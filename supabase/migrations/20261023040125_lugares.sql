-- Spec 016: lugares de cada destino.
--
-- O que esta migration faz:
-- 1. Tabela `lugares`: o que o comboio quer ver ou usar em cada destino:
--    passeio, comida, guarda-volumes ou outro. Cada um com link, horário, preço e observação.
--    (Ex.: "Galeria Vittorio Emanuele: girar no touro" em Milão; "Lock & Go, 3 min da estação" em Como.)
-- 2. Gatilho `privado.conferir_lugar`: o destino tem que ser da mesma viagem; viagem e autor não mudam.
--
-- Quem pode:
-- - todo mundo do comboio vê e adiciona lugares;
-- - quem criou (ou o ADM) edita e apaga.
-- Não altera nenhuma tabela, regra ou dado que já existe.
--
-- Pra desfazer:
--   drop table public.lugares;
--   drop function privado.conferir_lugar();

create table public.lugares (
  id uuid primary key default gen_random_uuid(),
  viagem_id uuid not null references public.viagens (id) on delete cascade,
  destino_id uuid references public.destinos (id) on delete set null,
  tipo text not null default 'passeio' check (tipo in ('passeio', 'comida', 'guarda_volumes', 'outro')),
  nome text not null check (char_length(trim(nome)) between 1 and 120),
  link text check (link is null or (link ~* '^https://' and char_length(link) <= 1000)),
  horario text check (horario is null or char_length(horario) <= 120), -- texto livre: "6h às 21h", "primeiro trem 9h"
  preco numeric(12, 2) check (preco is null or preco >= 0),
  moeda char(3) not null default 'EUR',
  observacao text check (observacao is null or char_length(observacao) <= 500),
  criado_por uuid not null default auth.uid() references public.perfis (id) on delete cascade,
  criado_em timestamptz not null default now()
);

create index on public.lugares (viagem_id);
create index on public.lugares (destino_id);
create index on public.lugares (criado_por);

-- Gatilho: o destino tem que ser da mesma viagem; viagem e autor não mudam
create function privado.conferir_lugar()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if new.destino_id is not null and not exists (
    select 1 from public.destinos d where d.id = new.destino_id and d.viagem_id = new.viagem_id
  ) then
    raise exception 'Esse destino não é desta viagem' using errcode = 'TR422';
  end if;

  if tg_op = 'UPDATE' and (new.viagem_id <> old.viagem_id or new.criado_por <> old.criado_por) then
    raise exception 'Não dá pra mudar a viagem nem o autor do lugar' using errcode = '42501';
  end if;

  return new;
end;
$$;

revoke execute on function privado.conferir_lugar() from public, anon, authenticated;

create trigger conferir_lugar
before insert or update on public.lugares
for each row execute function privado.conferir_lugar();

alter table public.lugares enable row level security;

create policy "lugares: ver (comboio)" on public.lugares for select to authenticated
using (privado.e_membro(viagem_id));

create policy "lugares: adicionar (comboio)" on public.lugares for insert to authenticated
with check (criado_por = (select auth.uid()) and privado.e_membro(viagem_id));

create policy "lugares: editar (autor ou ADM)" on public.lugares for update to authenticated
using (criado_por = (select auth.uid()) or privado.e_adm(viagem_id))
with check (privado.e_membro(viagem_id));

create policy "lugares: apagar (autor ou ADM)" on public.lugares for delete to authenticated
using (criado_por = (select auth.uid()) or privado.e_adm(viagem_id));
