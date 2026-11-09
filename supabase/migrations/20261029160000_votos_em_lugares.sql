-- Spec 022: votos em lugares (votar nos passeios e comidas, igual já é na hospedagem).
--
-- O que esta migration faz:
-- 1. Tabela `lugar_votos`: um coração por pessoa em cada lugar (spec 016).
--
-- Quem pode:
-- - todo mundo do comboio vê os votos;
-- - cada um só dá e tira o próprio voto.
-- (Garantido por RLS, não só pela tela.)
--
-- Pra desfazer:
--   drop table public.lugar_votos;

create table public.lugar_votos (
  lugar_id uuid not null references public.lugares (id) on delete cascade,
  usuario_id uuid not null default auth.uid() references public.perfis (id) on delete cascade,
  criado_em timestamptz not null default now(),
  primary key (lugar_id, usuario_id)
);

create index on public.lugar_votos (usuario_id);

alter table public.lugar_votos enable row level security;

create policy "lugar_votos: ver (comboio)" on public.lugar_votos for select to authenticated
using (exists (select 1 from public.lugares l where l.id = lugar_id and privado.e_membro(l.viagem_id)));

create policy "lugar_votos: dar o meu" on public.lugar_votos for insert to authenticated
with check (
  usuario_id = (select auth.uid())
  and exists (select 1 from public.lugares l where l.id = lugar_id and privado.e_membro(l.viagem_id))
);

create policy "lugar_votos: tirar o meu" on public.lugar_votos for delete to authenticated
using (usuario_id = (select auth.uid()));
