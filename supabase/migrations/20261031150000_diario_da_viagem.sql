-- Spec 101 (K6): diário da viagem. Cada um escreve o seu dia; o comboio lê o dos outros.
--
-- O que muda:
-- - Tabela `diario`: um texto por pessoa por dia da viagem, "comboio" (todos leem) ou
--   "so_eu" (só a pessoa).
--
-- Quem pode:
-- - ver: o próprio sempre; o dos outros se for "comboio" e eu estiver no comboio;
-- - escrever, mudar e apagar: só o dono, e só quem está no comboio.
--
-- Pra desfazer:
--   drop table public.diario;

create table public.diario (
  id uuid primary key default gen_random_uuid(),
  viagem_id uuid not null references public.viagens (id) on delete cascade,
  autor uuid not null default auth.uid() references public.perfis (id) on delete cascade,
  dia date not null,
  texto text not null check (char_length(trim(texto)) between 1 and 5000),
  visibilidade text not null default 'comboio' check (visibilidade in ('comboio', 'so_eu')),
  criado_em timestamptz not null default now(),
  editado_em timestamptz not null default now(),
  unique (viagem_id, autor, dia)
);

create index on public.diario (viagem_id, dia);
create index on public.diario (autor);

alter table public.diario enable row level security;

create policy "diário: ver o meu e o do comboio" on public.diario for select to authenticated
using (
  autor = (select auth.uid())
  or (visibilidade = 'comboio' and privado.e_membro(viagem_id))
);

create policy "diário: escrever o meu" on public.diario for insert to authenticated
with check (autor = (select auth.uid()) and privado.e_membro(viagem_id));

create policy "diário: mudar o meu" on public.diario for update to authenticated
using (autor = (select auth.uid()))
with check (autor = (select auth.uid()) and privado.e_membro(viagem_id));

create policy "diário: apagar o meu" on public.diario for delete to authenticated
using (autor = (select auth.uid()));
