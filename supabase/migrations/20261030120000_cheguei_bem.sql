-- Spec 051: "Cheguei bem" (F9). Um toque avisa o comboio que a pessoa chegou.
--
-- O que esta migration faz:
-- 1. Tabela `chegadas`: quem chegou bem, onde (texto curto) e quando.
-- 2. RLS: o comboio vê; cada um registra só a própria chegada e apaga a própria.
-- O aviso no celular é mandado pela função `cheguei-bem` (o app chama depois de gravar).
--
-- Pra desfazer:
--   drop table public.chegadas;

create table public.chegadas (
  id uuid primary key default gen_random_uuid(),
  viagem_id uuid not null references public.viagens (id) on delete cascade,
  usuario_id uuid not null default auth.uid() references public.perfis (id) on delete cascade,
  onde text check (onde is null or char_length(trim(onde)) between 1 and 120),
  criado_em timestamptz not null default now()
);

create index on public.chegadas (viagem_id, criado_em desc);
create index on public.chegadas (usuario_id);

alter table public.chegadas enable row level security;

create policy "chegadas: ver (comboio)" on public.chegadas for select to authenticated
using (privado.e_membro(viagem_id));
create policy "chegadas: registrar a minha (comboio)" on public.chegadas for insert to authenticated
with check (usuario_id = (select auth.uid()) and privado.e_membro(viagem_id));
create policy "chegadas: apagar a minha" on public.chegadas for delete to authenticated
using (usuario_id = (select auth.uid()));

grant select, insert, delete on public.chegadas to authenticated;
