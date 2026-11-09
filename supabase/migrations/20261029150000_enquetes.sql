-- Spec 021: enquete rápida (pergunta com opções pra qualquer decisão do grupo).
--
-- O que esta migration faz:
-- 1. Tabelas `enquetes`, `enquete_opcoes` e `enquete_votos`.
-- 2. Função `criar_enquete`: cria a pergunta e as opções numa tacada só.
-- 3. Função `votar_enquete`: marca/desmarca um voto, respeitando se a enquete
--    é de escolha única (troca o voto) ou múltipla (soma votos).
--
-- Quem pode:
-- - todo mundo do comboio vê e cria enquetes, e vota;
-- - quem criou a enquete (ou o ADM) fecha e apaga;
-- - cada um só dá e tira o próprio voto (as funções cuidam disso).
--   Enquete fechada não aceita mais voto.
--
-- Pra desfazer:
--   drop function public.votar_enquete(uuid, boolean);
--   drop function public.criar_enquete(uuid, text, boolean, jsonb);
--   drop table public.enquete_votos;
--   drop table public.enquete_opcoes;
--   drop table public.enquetes;

create table public.enquetes (
  id uuid primary key default gen_random_uuid(),
  viagem_id uuid not null references public.viagens (id) on delete cascade,
  pergunta text not null check (char_length(trim(pergunta)) between 1 and 200),
  multipla boolean not null default false,
  fechada boolean not null default false,
  criado_por uuid not null default auth.uid() references public.perfis (id) on delete cascade,
  criado_em timestamptz not null default now()
);

create index on public.enquetes (viagem_id);
create index on public.enquetes (criado_por);

create table public.enquete_opcoes (
  id uuid primary key default gen_random_uuid(),
  enquete_id uuid not null references public.enquetes (id) on delete cascade,
  texto text not null check (char_length(trim(texto)) between 1 and 120),
  ordem integer not null default 0
);

create index on public.enquete_opcoes (enquete_id);

create table public.enquete_votos (
  enquete_id uuid not null references public.enquetes (id) on delete cascade,
  opcao_id uuid not null references public.enquete_opcoes (id) on delete cascade,
  usuario_id uuid not null default auth.uid() references public.perfis (id) on delete cascade,
  criado_em timestamptz not null default now(),
  primary key (opcao_id, usuario_id)
);

create index on public.enquete_votos (enquete_id);
create index on public.enquete_votos (usuario_id);

alter table public.enquetes enable row level security;
alter table public.enquete_opcoes enable row level security;
alter table public.enquete_votos enable row level security;

-- Enquetes: comboio vê; quem criou ou o ADM fecha e apaga. Criar é pela função.
create policy "enquetes: ver (comboio)" on public.enquetes for select to authenticated
using (privado.e_membro(viagem_id));

create policy "enquetes: editar (autor ou ADM)" on public.enquetes for update to authenticated
using (criado_por = (select auth.uid()) or privado.e_adm(viagem_id))
with check (privado.e_membro(viagem_id));

create policy "enquetes: apagar (autor ou ADM)" on public.enquetes for delete to authenticated
using (criado_por = (select auth.uid()) or privado.e_adm(viagem_id));

-- Opções: comboio vê (inserção é pela função criar_enquete).
create policy "opcoes: ver (comboio)" on public.enquete_opcoes for select to authenticated
using (exists (select 1 from public.enquetes e where e.id = enquete_id and privado.e_membro(e.viagem_id)));

-- Votos: comboio vê (voto é pela função votar_enquete).
create policy "votos: ver (comboio)" on public.enquete_votos for select to authenticated
using (exists (select 1 from public.enquetes e where e.id = enquete_id and privado.e_membro(e.viagem_id)));

-- Cria a enquete e as opções juntas. Roda como dono do banco, mas confere que
-- quem chamou é do comboio. Exige de 2 a 10 opções.
create function public.criar_enquete(p_viagem uuid, p_pergunta text, p_multipla boolean, p_opcoes jsonb)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_enquete uuid;
  v_texto text;
  v_n int := 0;
  v_ordem int := 0;
begin
  if (select auth.uid()) is null then
    raise exception 'Faça login antes de criar a enquete';
  end if;
  if not privado.e_membro(p_viagem) then
    raise exception 'Você não é desta viagem' using errcode = '42501';
  end if;
  if char_length(trim(coalesce(p_pergunta, ''))) = 0 then
    raise exception 'A pergunta não pode ficar em branco' using errcode = 'TR422';
  end if;

  select count(*) into v_n from jsonb_array_elements_text(p_opcoes) t where char_length(trim(t)) > 0;
  if v_n < 2 then
    raise exception 'A enquete precisa de pelo menos 2 opções' using errcode = 'TR422';
  end if;
  if v_n > 10 then
    raise exception 'No máximo 10 opções por enquete' using errcode = 'TR422';
  end if;

  insert into public.enquetes (viagem_id, pergunta, multipla, criado_por)
  values (p_viagem, trim(p_pergunta), coalesce(p_multipla, false), (select auth.uid()))
  returning id into v_enquete;

  for v_texto in select jsonb_array_elements_text(p_opcoes) loop
    if char_length(trim(v_texto)) > 0 then
      insert into public.enquete_opcoes (enquete_id, texto, ordem) values (v_enquete, left(trim(v_texto), 120), v_ordem);
      v_ordem := v_ordem + 1;
    end if;
  end loop;

  return v_enquete;
end;
$$;

revoke execute on function public.criar_enquete(uuid, text, boolean, jsonb) from public, anon;
grant execute on function public.criar_enquete(uuid, text, boolean, jsonb) to authenticated;

-- Marca (ou tira) um voto numa opção. Escolha única: troca o voto anterior.
-- Múltipla: soma. Enquete fechada não aceita mais voto.
create function public.votar_enquete(p_opcao uuid, p_marcar boolean default true)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_enquete uuid;
  v_viagem uuid;
  v_multipla boolean;
  v_fechada boolean;
begin
  if (select auth.uid()) is null then
    raise exception 'Faça login antes de votar';
  end if;

  select e.id, e.viagem_id, e.multipla, e.fechada
    into v_enquete, v_viagem, v_multipla, v_fechada
  from public.enquete_opcoes o
  join public.enquetes e on e.id = o.enquete_id
  where o.id = p_opcao;

  if v_enquete is null then
    raise exception 'Opção não encontrada' using errcode = 'P0002';
  end if;
  if not privado.e_membro(v_viagem) then
    raise exception 'Você não é desta viagem' using errcode = '42501';
  end if;
  if v_fechada then
    raise exception 'Esta enquete já está fechada' using errcode = 'TR422';
  end if;

  if p_marcar then
    -- Escolha única: sai dos outros antes de entrar neste
    if not v_multipla then
      delete from public.enquete_votos where enquete_id = v_enquete and usuario_id = (select auth.uid());
    end if;
    insert into public.enquete_votos (enquete_id, opcao_id, usuario_id)
    values (v_enquete, p_opcao, (select auth.uid()))
    on conflict do nothing;
  else
    delete from public.enquete_votos where opcao_id = p_opcao and usuario_id = (select auth.uid());
  end if;
end;
$$;

revoke execute on function public.votar_enquete(uuid, boolean) from public, anon;
grant execute on function public.votar_enquete(uuid, boolean) to authenticated;
