-- Spec 050: ficha da pessoa (F5) + contatos de emergência e saúde (F6).
--
-- O que esta migration faz:
-- 1. Tabela `fichas_pessoais` (uma por pessoa, vale pra todas as viagens):
--    - parte do comboio: telefone, aniversário, restrições alimentares, alergias, mobilidade;
--    - parte de saúde: contato de emergência (nome e telefone), tipo sanguíneo, remédios,
--      com `saude_visivel_para`: 'ninguem', 'adm' (ADMs das viagens em comum) ou 'comboio'.
--    Só a própria pessoa lê e grava a tabela (RLS).
-- 2. Função `fichas_do_comboio(viagem)`: pra quem é do comboio, devolve a ficha de cada membro,
--    com a parte de saúde só quando a pessoa liberou pra quem está pedindo.
--
-- Pra desfazer:
--   drop function public.fichas_do_comboio(uuid);
--   drop table public.fichas_pessoais;

create table public.fichas_pessoais (
  usuario_id uuid primary key default auth.uid() references public.perfis (id) on delete cascade,
  telefone text check (telefone is null or telefone ~ '^\+?[0-9 ()./-]{6,30}$'),
  aniversario date check (aniversario is null or aniversario between date '1900-01-01' and current_date),
  restricoes text check (restricoes is null or char_length(trim(restricoes)) between 1 and 200),
  alergias text check (alergias is null or char_length(trim(alergias)) between 1 and 200),
  mobilidade text check (mobilidade is null or char_length(trim(mobilidade)) between 1 and 200),
  emergencia_nome text check (emergencia_nome is null or char_length(trim(emergencia_nome)) between 1 and 80),
  emergencia_telefone text check (emergencia_telefone is null or emergencia_telefone ~ '^\+?[0-9 ()./-]{6,30}$'),
  tipo_sanguineo text check (tipo_sanguineo is null or tipo_sanguineo in ('A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-')),
  remedios text check (remedios is null or char_length(trim(remedios)) between 1 and 300),
  saude_visivel_para text not null default 'adm' check (saude_visivel_para in ('ninguem', 'adm', 'comboio')),
  atualizado_em timestamptz not null default now()
);

alter table public.fichas_pessoais enable row level security;

create policy "fichas: ver a minha" on public.fichas_pessoais for select to authenticated using (usuario_id = (select auth.uid()));
create policy "fichas: criar a minha" on public.fichas_pessoais for insert to authenticated with check (usuario_id = (select auth.uid()));
create policy "fichas: mudar a minha" on public.fichas_pessoais for update to authenticated
using (usuario_id = (select auth.uid())) with check (usuario_id = (select auth.uid()));
create policy "fichas: apagar a minha" on public.fichas_pessoais for delete to authenticated using (usuario_id = (select auth.uid()));

grant select, insert, update, delete on public.fichas_pessoais to authenticated;

create function public.fichas_do_comboio(p_viagem uuid)
returns table (
  usuario_id uuid, telefone text, aniversario date, restricoes text, alergias text, mobilidade text,
  emergencia_nome text, emergencia_telefone text, tipo_sanguineo text, remedios text
)
language sql
stable
security definer
set search_path = ''
as $$
  with eu as (
    select papel from public.comboio_membros where viagem_id = p_viagem and usuario_id = (select auth.uid())
  )
  select f.usuario_id, f.telefone, f.aniversario, f.restricoes, f.alergias, f.mobilidade,
    case when libera then f.emergencia_nome end,
    case when libera then f.emergencia_telefone end,
    case when libera then f.tipo_sanguineo end,
    case when libera then f.remedios end
  from public.fichas_pessoais f
  join public.comboio_membros m on m.usuario_id = f.usuario_id and m.viagem_id = p_viagem
  cross join eu
  cross join lateral (
    select f.usuario_id = (select auth.uid())
      or f.saude_visivel_para = 'comboio'
      or (f.saude_visivel_para = 'adm' and eu.papel = 'adm') as libera
  ) l;
$$;

revoke execute on function public.fichas_do_comboio(uuid) from public, anon;
grant execute on function public.fichas_do_comboio(uuid) to authenticated;
