-- Spec 068: quem dorme onde (E7). Quartos da hospedagem e quem fica em cada um.
--
-- O que esta migration faz:
-- 1. Tabela `quartos`: nome ("Quarto 1", "Sofá-cama"), vagas e ocupantes (lista de pessoas).
-- 2. Gatilho: ocupantes só do comboio, sem passar das vagas, e a mesma pessoa não fica em dois quartos
--    da mesma hospedagem.
-- 3. RLS: o comboio vê; o ADM (ou quem criou a opção de hospedagem) cria, edita e apaga quartos.
-- 4. Função `entrar_no_quarto(quarto, entrar)`: cada um se põe/tira de um quarto (sai do outro sozinho).
--
-- Pra desfazer:
--   drop function public.entrar_no_quarto(uuid, boolean);
--   drop table public.quartos;
--   drop function privado.conferir_quarto();

create table public.quartos (
  id uuid primary key default gen_random_uuid(),
  hospedagem_id uuid not null references public.hospedagens (id) on delete cascade,
  viagem_id uuid not null references public.viagens (id) on delete cascade,
  nome text not null check (char_length(trim(nome)) between 1 and 60),
  vagas int not null default 2 check (vagas between 1 and 20),
  ocupantes uuid[] not null default '{}',
  criado_em timestamptz not null default now()
);

create index on public.quartos (hospedagem_id);
create index on public.quartos (viagem_id);

create function privado.conferir_quarto()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if (select h.viagem_id from public.hospedagens h where h.id = new.hospedagem_id) is distinct from new.viagem_id then
    raise exception 'O quarto tem que ser da mesma viagem da hospedagem' using errcode = '23514';
  end if;
  new.ocupantes := array(select distinct unnest(new.ocupantes));
  if cardinality(new.ocupantes) > new.vagas then
    raise exception 'Esse quarto já está cheio' using errcode = '23514';
  end if;
  if exists (
    select 1 from unnest(new.ocupantes) o
    where not exists (select 1 from public.comboio_membros m where m.viagem_id = new.viagem_id and m.usuario_id = o)
  ) then
    raise exception 'Só gente do comboio dorme nos quartos' using errcode = '23514';
  end if;
  if exists (
    select 1 from public.quartos q
    where q.hospedagem_id = new.hospedagem_id and q.id <> new.id and q.ocupantes && new.ocupantes
  ) then
    raise exception 'Essa pessoa já está em outro quarto' using errcode = '23514';
  end if;
  return new;
end;
$$;

revoke execute on function privado.conferir_quarto() from public, anon, authenticated;

create trigger conferir_quarto
before insert or update on public.quartos
for each row execute function privado.conferir_quarto();

alter table public.quartos enable row level security;

create policy "quartos: ver (comboio)" on public.quartos for select to authenticated
using (privado.e_membro(viagem_id));
create policy "quartos: criar (ADM ou autor da opção)" on public.quartos for insert to authenticated
with check (privado.e_adm(viagem_id) or exists (select 1 from public.hospedagens h where h.id = hospedagem_id and h.criado_por = (select auth.uid())));
create policy "quartos: editar (ADM ou autor da opção)" on public.quartos for update to authenticated
using (privado.e_adm(viagem_id) or exists (select 1 from public.hospedagens h where h.id = hospedagem_id and h.criado_por = (select auth.uid())))
with check (privado.e_membro(viagem_id));
create policy "quartos: apagar (ADM ou autor da opção)" on public.quartos for delete to authenticated
using (privado.e_adm(viagem_id) or exists (select 1 from public.hospedagens h where h.id = hospedagem_id and h.criado_por = (select auth.uid())));

grant select, insert, update, delete on public.quartos to authenticated;

create function public.entrar_no_quarto(p_quarto uuid, p_entrar boolean)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_eu uuid := (select auth.uid());
  v_quarto public.quartos;
begin
  select * into v_quarto from public.quartos where id = p_quarto;
  if v_quarto.id is null or not privado.e_membro(v_quarto.viagem_id) then
    raise exception 'Quarto não encontrado' using errcode = '42501';
  end if;
  -- Sai de qualquer quarto da mesma hospedagem
  update public.quartos set ocupantes = array_remove(ocupantes, v_eu)
  where hospedagem_id = v_quarto.hospedagem_id and v_eu = any (ocupantes);
  if p_entrar then
    update public.quartos set ocupantes = array_append(ocupantes, v_eu) where id = p_quarto;
  end if;
end;
$$;

revoke execute on function public.entrar_no_quarto(uuid, boolean) from public, anon;
grant execute on function public.entrar_no_quarto(uuid, boolean) to authenticated;
