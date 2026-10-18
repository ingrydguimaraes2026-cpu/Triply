-- Spec 011: hospedagem.
--
-- O que esta migration faz:
-- 1. Tabela `hospedagens`: opções de onde ficar em cada destino (link do Airbnb/Booking, preço, datas).
--    Uma por destino pode ser a "escolhida".
-- 2. Tabela `hospedagem_votos`: um coração por pessoa em cada opção.
-- 3. Função `escolher_hospedagem`: o ADM marca a escolhida (desmarca as outras do destino junto).
--
-- Quem pode:
-- - todo mundo do comboio vê opções e votos, e adiciona opções;
-- - quem criou a opção (ou o ADM) edita e apaga;
-- - cada um só dá e tira o próprio voto;
-- - só o ADM marca/desmarca a escolhida (garantido por gatilho, não só pela tela).
--
-- Pra desfazer:
--   drop function public.escolher_hospedagem(uuid, boolean);
--   drop table public.hospedagem_votos;
--   drop table public.hospedagens;
--   drop function privado.conferir_hospedagem();

create table public.hospedagens (
  id uuid primary key default gen_random_uuid(),
  viagem_id uuid not null references public.viagens (id) on delete cascade,
  destino_id uuid references public.destinos (id) on delete set null,
  nome text not null check (char_length(trim(nome)) between 1 and 120),
  link text check (link is null or (link ~* '^https://' and char_length(link) <= 1000)),
  preco_total numeric(12, 2) check (preco_total is null or preco_total >= 0),
  moeda char(3) not null default 'EUR',
  checkin date,
  checkout date,
  observacao text check (observacao is null or char_length(observacao) <= 500),
  escolhida boolean not null default false,
  criado_por uuid not null default auth.uid() references public.perfis (id) on delete cascade,
  criado_em timestamptz not null default now(),
  check (checkin is null or checkout is null or checkout >= checkin)
);

create index on public.hospedagens (viagem_id);
create index on public.hospedagens (destino_id);
create index on public.hospedagens (criado_por);
-- No máximo uma escolhida por destino
create unique index hospedagens_uma_escolhida on public.hospedagens (destino_id) where escolhida;

create table public.hospedagem_votos (
  hospedagem_id uuid not null references public.hospedagens (id) on delete cascade,
  usuario_id uuid not null references public.perfis (id) on delete cascade,
  criado_em timestamptz not null default now(),
  primary key (hospedagem_id, usuario_id)
);

create index on public.hospedagem_votos (usuario_id);

-- Gatilho: o destino tem que ser da mesma viagem; viagem e autor não mudam;
-- só o ADM mexe em `escolhida`.
create function privado.conferir_hospedagem()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if new.destino_id is not null and not exists (
    select 1 from public.destinos d where d.id = new.destino_id and d.viagem_id = new.viagem_id
  ) then
    raise exception 'Esse destino não é desta viagem' using errcode = 'TR422';
  end if;

  if tg_op = 'UPDATE' then
    if new.viagem_id <> old.viagem_id or new.criado_por <> old.criado_por then
      raise exception 'Não dá pra mudar a viagem nem o autor da opção' using errcode = '42501';
    end if;
    if new.escolhida <> old.escolhida and not privado.e_adm(new.viagem_id) then
      raise exception 'Só o ADM escolhe a hospedagem' using errcode = '42501';
    end if;
  elsif new.escolhida and not privado.e_adm(new.viagem_id) then
    raise exception 'Só o ADM escolhe a hospedagem' using errcode = '42501';
  end if;

  return new;
end;
$$;

revoke execute on function privado.conferir_hospedagem() from public, anon, authenticated;

create trigger conferir_hospedagem
before insert or update on public.hospedagens
for each row execute function privado.conferir_hospedagem();

alter table public.hospedagens enable row level security;
alter table public.hospedagem_votos enable row level security;

create policy "hospedagens: ver (comboio)" on public.hospedagens for select to authenticated
using (privado.e_membro(viagem_id));

create policy "hospedagens: adicionar (comboio)" on public.hospedagens for insert to authenticated
with check (criado_por = (select auth.uid()) and privado.e_membro(viagem_id));

create policy "hospedagens: editar (autor ou ADM)" on public.hospedagens for update to authenticated
using (criado_por = (select auth.uid()) or privado.e_adm(viagem_id))
with check (privado.e_membro(viagem_id));

create policy "hospedagens: apagar (autor ou ADM)" on public.hospedagens for delete to authenticated
using (criado_por = (select auth.uid()) or privado.e_adm(viagem_id));

create policy "votos: ver (comboio)" on public.hospedagem_votos for select to authenticated
using (exists (select 1 from public.hospedagens h where h.id = hospedagem_id and privado.e_membro(h.viagem_id)));

create policy "votos: dar o meu" on public.hospedagem_votos for insert to authenticated
with check (
  usuario_id = (select auth.uid())
  and exists (select 1 from public.hospedagens h where h.id = hospedagem_id and privado.e_membro(h.viagem_id))
);

create policy "votos: tirar o meu" on public.hospedagem_votos for delete to authenticated
using (usuario_id = (select auth.uid()));

-- Marca (ou desmarca) a escolhida do destino. Desmarca as outras antes, por causa do índice único.
-- Roda com as permissões de quem chamou: o gatilho barra quem não é ADM.
create function public.escolher_hospedagem(p_hospedagem uuid, p_escolher boolean default true)
returns void
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_destino uuid;
  v_viagem uuid;
begin
  select destino_id, viagem_id into v_destino, v_viagem from public.hospedagens where id = p_hospedagem;
  if v_viagem is null then
    raise exception 'Opção não encontrada' using errcode = 'P0002';
  end if;
  if not privado.e_adm(v_viagem) then
    raise exception 'Só o ADM escolhe a hospedagem' using errcode = '42501';
  end if;
  if p_escolher and v_destino is null then
    raise exception 'Essa opção não está ligada a nenhum destino' using errcode = 'TR422';
  end if;

  if p_escolher then
    update public.hospedagens set escolhida = false
    where destino_id = v_destino and escolhida and id <> p_hospedagem;
  end if;
  update public.hospedagens set escolhida = p_escolher where id = p_hospedagem;
end;
$$;

revoke execute on function public.escolher_hospedagem(uuid, boolean) from public, anon;
grant execute on function public.escolher_hospedagem(uuid, boolean) to authenticated;
