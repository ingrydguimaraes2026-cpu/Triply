-- Spec 024 (roadmap #7): ponto de encontro ("onde e que horas nos encontramos").
--
-- O que esta migration faz:
-- 1. Tabela `pontos_de_encontro`: um lugar + horário combinados pro comboio se encontrar,
--    com coordenadas opcionais pra abrir no mapa.
-- 2. Gatilho: viagem e autor não mudam; mantém `atualizado_em` em dia.
--
-- Quem pode:
-- - todo mundo do comboio vê e cria pontos de encontro;
-- - quem criou ou o ADM edita e apaga.
-- (Garantido por RLS, não só pela tela.)
--
-- Pra desfazer:
--   drop table public.pontos_de_encontro;
--   drop function privado.conferir_ponto_de_encontro();

create table public.pontos_de_encontro (
  id uuid primary key default gen_random_uuid(),
  viagem_id uuid not null references public.viagens (id) on delete cascade,
  local text not null check (char_length(trim(local)) between 1 and 200),
  quando timestamptz,
  observacao text check (observacao is null or char_length(trim(observacao)) between 1 and 280),
  latitude double precision check (latitude is null or latitude between -90 and 90),
  longitude double precision check (longitude is null or longitude between -180 and 180),
  criado_por uuid not null default auth.uid() references public.perfis (id) on delete cascade,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);

create index on public.pontos_de_encontro (viagem_id);
create index on public.pontos_de_encontro (criado_por);

-- Gatilho: viagem e autor não mudam; `atualizado_em` acompanha a última edição.
create function privado.conferir_ponto_de_encontro()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if tg_op = 'UPDATE' then
    if new.viagem_id <> old.viagem_id or new.criado_por <> old.criado_por then
      raise exception 'Não dá pra mudar a viagem nem o autor do ponto de encontro' using errcode = '42501';
    end if;
    new.criado_em := old.criado_em;
    new.atualizado_em := now();
  end if;
  return new;
end;
$$;

revoke execute on function privado.conferir_ponto_de_encontro() from public, anon, authenticated;

create trigger conferir_ponto_de_encontro
before insert or update on public.pontos_de_encontro
for each row execute function privado.conferir_ponto_de_encontro();

alter table public.pontos_de_encontro enable row level security;

create policy "pontos: ver (comboio)" on public.pontos_de_encontro for select to authenticated
using (privado.e_membro(viagem_id));

create policy "pontos: criar (comboio)" on public.pontos_de_encontro for insert to authenticated
with check (criado_por = (select auth.uid()) and privado.e_membro(viagem_id));

create policy "pontos: editar (autor ou ADM)" on public.pontos_de_encontro for update to authenticated
using (criado_por = (select auth.uid()) or privado.e_adm(viagem_id))
with check (privado.e_membro(viagem_id));

create policy "pontos: apagar (autor ou ADM)" on public.pontos_de_encontro for delete to authenticated
using (criado_por = (select auth.uid()) or privado.e_adm(viagem_id));
