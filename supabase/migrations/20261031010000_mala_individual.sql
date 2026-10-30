-- Spec 069: mala individual (I7). Checklist pessoal da mala, por viagem. Só a própria pessoa vê.
--
-- O que esta migration faz:
-- 1. Tabela `mala_itens`: item da mala (texto, quantidade, já está na mala?).
-- 2. RLS: só a dona/o dono vê e mexe (precisa ser do comboio pra criar).
--
-- Pra desfazer:
--   drop table public.mala_itens;

create table public.mala_itens (
  id uuid primary key default gen_random_uuid(),
  viagem_id uuid not null references public.viagens (id) on delete cascade,
  usuario_id uuid not null default auth.uid() references public.perfis (id) on delete cascade,
  texto text not null check (char_length(trim(texto)) between 1 and 80),
  quantidade int check (quantidade is null or quantidade between 1 and 99),
  feito boolean not null default false,
  criado_em timestamptz not null default now()
);

create index on public.mala_itens (viagem_id, usuario_id);
create index on public.mala_itens (usuario_id);

alter table public.mala_itens enable row level security;

create policy "mala: ver a minha" on public.mala_itens for select to authenticated using (usuario_id = (select auth.uid()));
create policy "mala: pôr na minha (comboio)" on public.mala_itens for insert to authenticated
with check (usuario_id = (select auth.uid()) and privado.e_membro(viagem_id));
create policy "mala: mudar a minha" on public.mala_itens for update to authenticated
using (usuario_id = (select auth.uid())) with check (usuario_id = (select auth.uid()));
create policy "mala: tirar da minha" on public.mala_itens for delete to authenticated using (usuario_id = (select auth.uid()));

grant select, insert, update, delete on public.mala_itens to authenticated;
