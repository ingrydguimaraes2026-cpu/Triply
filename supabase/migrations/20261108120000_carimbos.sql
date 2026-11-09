-- Spec 118a: carimbo de lugar (FILA 0.3). Aplicada em 08/11/2026 (confirmada pelo Victor). A âncora do produto: o passaporte da galera.
-- O que muda, em português simples:
-- 1. Tabela nova `carimbos`: cada destino da viagem que alguém do grupo provou que visitou.
--    O carimbo "apagado" não é guardado: é o destino sem linha aqui.
-- 2. Guarda o lugar (nome, latitude e longitude DO DESTINO), a data, quem liberou e como
--    (localização, foto, "Cheguei" do Hoje, ou "a gente esteve aqui" de memória).
--    A localização da pessoa NUNCA é guardada: o aparelho compara e só manda "estive aqui".
-- 3. Um carimbo por destino (o primeiro que liberar fica como "quem liberou primeiro").
-- 4. RLS: o comboio vê; membro (não convidado sem conta) libera; só o ADM apaga carimbo errado.
--    Ninguém edita: carimbo errado se apaga e libera de novo.
--
-- Pra desfazer:
--   drop table public.carimbos;
--   drop function privado.conferir_carimbo();

create table public.carimbos (
  id uuid primary key default gen_random_uuid(),
  viagem_id uuid not null references public.viagens (id) on delete cascade,
  destino_id uuid references public.destinos (id) on delete cascade,
  nome text not null check (char_length(trim(nome)) between 1 and 120),
  latitude double precision check (latitude is null or latitude between -90 and 90),
  longitude double precision check (longitude is null or longitude between -180 and 180),
  tipo text not null default 'cidade' check (tipo in ('cidade', 'praia', 'serra', 'show', 'festa')),
  data date not null default current_date,
  como text not null check (como in ('localizacao', 'foto', 'hoje', 'memoria')),
  liberado_por uuid not null default auth.uid() references public.perfis (id) on delete cascade,
  liberado_em timestamptz not null default now()
);

-- Um carimbo por destino (o rolê da 118f vai usar destino_id nulo)
create unique index carimbos_um_por_destino on public.carimbos (destino_id) where destino_id is not null;
create index on public.carimbos (viagem_id);
create index on public.carimbos (liberado_por);

-- O destino tem que ser da mesma viagem
create function privado.conferir_carimbo()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.destino_id is not null
     and not exists (select 1 from public.destinos d where d.id = new.destino_id and d.viagem_id = new.viagem_id) then
    raise exception 'Esse destino não é desta viagem.' using hint = 'TR_CARIMBO_DESTINO';
  end if;
  return new;
end;
$$;

create trigger conferir_carimbo
before insert on public.carimbos
for each row execute function privado.conferir_carimbo();

alter table public.carimbos enable row level security;

create policy "carimbos: ver (comboio)" on public.carimbos for select to authenticated
using (privado.e_membro(viagem_id));

create policy "carimbos: liberar (membro com conta)" on public.carimbos for insert to authenticated
with check (
  liberado_por = (select auth.uid())
  and privado.e_membro(viagem_id)
  and not coalesce(((select auth.jwt()) ->> 'is_anonymous')::boolean, false)
);

create policy "carimbos: apagar (ADM)" on public.carimbos for delete to authenticated
using (privado.e_adm(viagem_id));

grant select, insert, delete on public.carimbos to authenticated;
