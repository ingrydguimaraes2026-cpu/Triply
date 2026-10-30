-- Spec 056: meu orçamento pessoal (H14). Cada um define quanto quer gastar na viagem (na moeda
-- principal) e vê o gasto real: a parte dele nos gastos do comboio + os gastos pessoais.
--
-- O que esta migration faz:
-- 1. Tabela `orcamentos_pessoais`: uma meta por pessoa por viagem. Só a própria pessoa vê e mexe.
--
-- Pra desfazer:
--   drop table public.orcamentos_pessoais;

create table public.orcamentos_pessoais (
  viagem_id uuid not null references public.viagens (id) on delete cascade,
  usuario_id uuid not null default auth.uid() references public.perfis (id) on delete cascade,
  meta numeric(12, 2) not null check (meta > 0 and meta < 100000000),
  atualizado_em timestamptz not null default now(),
  primary key (viagem_id, usuario_id)
);

alter table public.orcamentos_pessoais enable row level security;

create policy "orçamento pessoal: ver o meu" on public.orcamentos_pessoais for select to authenticated
using (usuario_id = (select auth.uid()));
create policy "orçamento pessoal: criar o meu (comboio)" on public.orcamentos_pessoais for insert to authenticated
with check (usuario_id = (select auth.uid()) and privado.e_membro(viagem_id));
create policy "orçamento pessoal: mudar o meu" on public.orcamentos_pessoais for update to authenticated
using (usuario_id = (select auth.uid())) with check (usuario_id = (select auth.uid()) and privado.e_membro(viagem_id));
create policy "orçamento pessoal: apagar o meu" on public.orcamentos_pessoais for delete to authenticated
using (usuario_id = (select auth.uid()));

grant select, insert, update, delete on public.orcamentos_pessoais to authenticated;
