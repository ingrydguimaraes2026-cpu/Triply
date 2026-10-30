-- Spec 065: datas em comum (A2). Cada pessoa marca os dias em que pode viajar; o app acha as janelas
-- em que todo mundo (ou quase) está livre.
--
-- O que esta migration faz:
-- 1. Tabela `disponibilidades` (viagem, pessoa, dia): uma linha por dia livre.
-- 2. RLS: o comboio vê (é pra combinar junto); cada um marca e desmarca só os próprios dias.
--
-- Pra desfazer:
--   drop table public.disponibilidades;

create table public.disponibilidades (
  viagem_id uuid not null references public.viagens (id) on delete cascade,
  usuario_id uuid not null default auth.uid() references public.perfis (id) on delete cascade,
  dia date not null check (dia between date '2020-01-01' and date '2100-12-31'),
  primary key (viagem_id, usuario_id, dia)
);

create index on public.disponibilidades (usuario_id);

alter table public.disponibilidades enable row level security;

create policy "disponibilidades: ver (comboio)" on public.disponibilidades for select to authenticated
using (privado.e_membro(viagem_id));
create policy "disponibilidades: marcar os meus (comboio)" on public.disponibilidades for insert to authenticated
with check (usuario_id = (select auth.uid()) and privado.e_membro(viagem_id));
create policy "disponibilidades: desmarcar os meus" on public.disponibilidades for delete to authenticated
using (usuario_id = (select auth.uid()));

grant select, insert, delete on public.disponibilidades to authenticated;
