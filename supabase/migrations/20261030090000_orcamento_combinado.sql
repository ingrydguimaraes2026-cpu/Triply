-- Spec 045: orçamento combinado (A3). Cada um diz, EM SEGREDO, quanto topa gastar na viagem
-- (por pessoa, na moeda principal da viagem). O comboio só vê a faixa que serve pra todo mundo.
--
-- O que esta migration faz:
-- 1. Tabela `orcamento_faixas`: a faixa de cada pessoa. Só a própria pessoa vê e mexe (RLS).
-- 2. Função `faixa_do_comboio(viagem)`: pra quem é do comboio, devolve só o resultado:
--    quantos responderam, quantos são, e a faixa comum (maior mínimo, menor máximo). Se só uma pessoa
--    respondeu, não devolve a faixa (seria a faixa dela).
--
-- Pra desfazer:
--   drop function public.faixa_do_comboio(uuid);
--   drop table public.orcamento_faixas;

create table public.orcamento_faixas (
  viagem_id uuid not null references public.viagens (id) on delete cascade,
  usuario_id uuid not null default auth.uid() references public.perfis (id) on delete cascade,
  minimo numeric(12, 2) not null check (minimo >= 0),
  maximo numeric(12, 2) not null check (maximo >= minimo and maximo < 100000000),
  atualizado_em timestamptz not null default now(),
  primary key (viagem_id, usuario_id)
);

alter table public.orcamento_faixas enable row level security;

create policy "faixas: ver a minha" on public.orcamento_faixas for select to authenticated
using (usuario_id = (select auth.uid()));
create policy "faixas: criar a minha (comboio)" on public.orcamento_faixas for insert to authenticated
with check (usuario_id = (select auth.uid()) and privado.e_membro(viagem_id));
create policy "faixas: mudar a minha" on public.orcamento_faixas for update to authenticated
using (usuario_id = (select auth.uid())) with check (usuario_id = (select auth.uid()) and privado.e_membro(viagem_id));
create policy "faixas: apagar a minha" on public.orcamento_faixas for delete to authenticated
using (usuario_id = (select auth.uid()));

grant select, insert, update, delete on public.orcamento_faixas to authenticated;

create function public.faixa_do_comboio(p_viagem uuid)
returns table (responderam int, pessoas int, minimo numeric, maximo numeric)
language sql
stable
security definer
set search_path = ''
as $$
  select
    count(f.usuario_id)::int,
    (select count(*)::int from public.comboio_membros m where m.viagem_id = p_viagem),
    case when count(f.usuario_id) >= 2 then max(f.minimo) end,
    case when count(f.usuario_id) >= 2 then min(f.maximo) end
  from public.orcamento_faixas f
  join public.comboio_membros m on m.viagem_id = f.viagem_id and m.usuario_id = f.usuario_id
  where f.viagem_id = p_viagem
    and privado.e_membro(p_viagem);
$$;

revoke execute on function public.faixa_do_comboio(uuid) from public, anon;
grant execute on function public.faixa_do_comboio(uuid) to authenticated;
