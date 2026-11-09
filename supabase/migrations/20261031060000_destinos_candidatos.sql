-- Spec 075: destinos candidatos (A4). Antes de fechar o roteiro, o comboio sugere cidades e vota.
--
-- O que esta migration faz:
-- 1. Tabela `destinos_candidatos`: cidade sugerida (nome, país, coordenadas, link opcional).
-- 2. Tabela `candidato_votos`: o voto de cada um (um por pessoa por candidato).
-- 3. RLS: o comboio vê e sugere; quem sugeriu ou o ADM apaga; cada um dá e tira só o próprio voto.
-- Virar destino de verdade é o ADM adicionar no roteiro (tabela destinos, regra de sempre).
--
-- Pra desfazer:
--   drop table public.candidato_votos;
--   drop table public.destinos_candidatos;

create table public.destinos_candidatos (
  id uuid primary key default gen_random_uuid(),
  viagem_id uuid not null references public.viagens (id) on delete cascade,
  nome text not null check (char_length(trim(nome)) between 1 and 120),
  pais text check (pais is null or char_length(pais) <= 80),
  latitude double precision check (latitude is null or latitude between -90 and 90),
  longitude double precision check (longitude is null or longitude between -180 and 180),
  link text check (link is null or (link ~ '^https://' and char_length(link) <= 1000)),
  criado_por uuid not null default auth.uid() references public.perfis (id) on delete cascade,
  criado_em timestamptz not null default now()
);

create index on public.destinos_candidatos (viagem_id);
create index on public.destinos_candidatos (criado_por);

alter table public.destinos_candidatos enable row level security;

create policy "candidatos: ver (comboio)" on public.destinos_candidatos for select to authenticated
using (privado.e_membro(viagem_id));
create policy "candidatos: sugerir (comboio)" on public.destinos_candidatos for insert to authenticated
with check (criado_por = (select auth.uid()) and privado.e_membro(viagem_id));
create policy "candidatos: apagar (autor ou ADM)" on public.destinos_candidatos for delete to authenticated
using (criado_por = (select auth.uid()) or privado.e_adm(viagem_id));

grant select, insert, delete on public.destinos_candidatos to authenticated;

create table public.candidato_votos (
  candidato_id uuid not null references public.destinos_candidatos (id) on delete cascade,
  usuario_id uuid not null default auth.uid() references public.perfis (id) on delete cascade,
  primary key (candidato_id, usuario_id)
);

create index on public.candidato_votos (usuario_id);

alter table public.candidato_votos enable row level security;

create policy "votos de candidato: ver (comboio)" on public.candidato_votos for select to authenticated
using (exists (select 1 from public.destinos_candidatos c where c.id = candidato_id and privado.e_membro(c.viagem_id)));
create policy "votos de candidato: dar o meu" on public.candidato_votos for insert to authenticated
with check (usuario_id = (select auth.uid()) and exists (select 1 from public.destinos_candidatos c where c.id = candidato_id and privado.e_membro(c.viagem_id)));
create policy "votos de candidato: tirar o meu" on public.candidato_votos for delete to authenticated
using (usuario_id = (select auth.uid()));

grant select, insert, delete on public.candidato_votos to authenticated;
