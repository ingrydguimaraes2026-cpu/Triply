-- Spec 114: Explorar (deslizar lugares e montar o roteiro).
--
-- O que esta migration faz:
-- 1. `catalogo_cidades` e `catalogo_lugares`: o catálogo grátis de cada cidade (Wikidata, Wikipédia, Commons
--    e base curada). Todo mundo logado lê; só a Edge Function `explorar-cidade` (chave de serviço) escreve.
-- 2. `catalogo_pedidos`: quem pediu pra preparar cidade nova (limite de 5 por pessoa por dia, conferido na função).
-- 3. `lugares.wikidata`: pra não duplicar o mesmo lugar quando ele vem do Explorar.
-- 4. `explorar_escolhas`: quero / passo / não abro mão de cada pessoa. Só a própria pessoa vê.
--    "Não abro mão" respeita o limite de 3 por destino (somando com os que já viraram prioridade).
-- 5. `explorar_criar_lugares(destino)`: transforma os "quero" e "não abro mão" em lugares da viagem,
--    curtidas e prioridades, sem duplicar. Devolve os lugares (pra montar os dias na tela).
--
-- Pra desfazer:
--   drop function public.explorar_criar_lugares(uuid);
--   drop table public.explorar_escolhas;
--   drop function privado.conferir_escolha_explorar();
--   alter table public.lugares drop column wikidata;
--   drop table public.catalogo_pedidos;
--   drop table public.catalogo_lugares;
--   drop table public.catalogo_cidades;

-- ---------- 1. Catálogo ----------
create table public.catalogo_cidades (
  id uuid primary key default gen_random_uuid(),
  chave text not null unique check (char_length(chave) between 3 and 160), -- "paris|fr": nome simplificado + país
  nome text not null check (char_length(trim(nome)) between 1 and 120),
  pais char(2),
  latitude double precision not null check (latitude between -90 and 90),
  longitude double precision not null check (longitude between -180 and 180),
  raio_km numeric(5, 1) not null default 4 check (raio_km between 1 and 80),
  regiao boolean not null default false,
  situacao text not null default 'preparando' check (situacao in ('preparando', 'pronta', 'erro')),
  atualizado_em timestamptz,
  criado_em timestamptz not null default now()
);

create table public.catalogo_lugares (
  id uuid primary key default gen_random_uuid(),
  cidade_id uuid not null references public.catalogo_cidades (id) on delete cascade,
  wikidata text check (wikidata is null or wikidata ~ '^Q[0-9]{1,12}$'),
  nome text not null check (char_length(trim(nome)) between 1 and 120),
  bairro text check (bairro is null or char_length(bairro) <= 120),
  tipo text not null check (tipo in (
    'museu', 'igreja', 'castelo', 'palacio', 'monumento', 'mirante', 'ponte', 'praca', 'parque', 'jardim',
    'praia', 'cachoeira', 'lagoa', 'duna', 'natureza', 'sitio_historico', 'zoologico', 'aquario', 'bairro', 'outro'
  )),
  estilos text[] not null default '{}',
  fama integer not null default 0 check (fama >= 0),
  latitude double precision not null check (latitude between -90 and 90),
  longitude double precision not null check (longitude between -180 and 180),
  por_que text check (por_que is null or char_length(por_que) <= 200),
  sobre text check (sobre is null or char_length(sobre) <= 800),
  tempo_min integer check (tempo_min is null or tempo_min between 5 and 720),
  gratis boolean, -- null = não se sabe
  melhor_hora text check (melhor_hora is null or char_length(melhor_hora) <= 40),
  foto_url text check (foto_url is null or (foto_url ~* '^https://' and char_length(foto_url) <= 1000)),
  foto_autor text check (foto_autor is null or char_length(foto_autor) <= 200),
  foto_licenca text check (foto_licenca is null or char_length(foto_licenca) <= 60),
  foto_pagina text check (foto_pagina is null or (foto_pagina ~* '^https://' and char_length(foto_pagina) <= 1000)),
  link_wikipedia text check (link_wikipedia is null or (link_wikipedia ~* '^https://' and char_length(link_wikipedia) <= 1000)),
  fonte text not null default 'wikidata' check (fonte in ('wikidata', 'curado')),
  criado_em timestamptz not null default now(),
  unique (cidade_id, wikidata)
);

create index on public.catalogo_lugares (cidade_id, fama desc);

create table public.catalogo_pedidos (
  id bigint generated always as identity primary key,
  usuario_id uuid not null references public.perfis (id) on delete cascade,
  cidade_id uuid not null references public.catalogo_cidades (id) on delete cascade,
  criado_em timestamptz not null default now()
);

create index on public.catalogo_pedidos (usuario_id, criado_em desc);

alter table public.catalogo_cidades enable row level security;
alter table public.catalogo_lugares enable row level security;
alter table public.catalogo_pedidos enable row level security;

create policy "catálogo: ver cidades (logado)" on public.catalogo_cidades for select to authenticated using (true);
create policy "catálogo: ver lugares (logado)" on public.catalogo_lugares for select to authenticated using (true);
-- catalogo_pedidos: nenhuma política. Só a função (chave de serviço) lê e escreve.

grant select on public.catalogo_cidades, public.catalogo_lugares to authenticated;

-- ---------- 2. Lugar da viagem lembra de onde veio ----------
alter table public.lugares
  add column wikidata text check (wikidata is null or wikidata ~ '^Q[0-9]{1,12}$');

create index on public.lugares (viagem_id, wikidata) where wikidata is not null;

-- ---------- 3. Escolhas de cada pessoa ----------
create table public.explorar_escolhas (
  viagem_id uuid not null references public.viagens (id) on delete cascade,
  destino_id uuid not null references public.destinos (id) on delete cascade,
  usuario_id uuid not null default auth.uid() references public.perfis (id) on delete cascade,
  catalogo_lugar_id uuid not null references public.catalogo_lugares (id) on delete cascade,
  escolha text not null check (escolha in ('quero', 'passo', 'nao_abro_mao')),
  criado_em timestamptz not null default now(),
  primary key (destino_id, usuario_id, catalogo_lugar_id)
);

create index on public.explorar_escolhas (usuario_id);

create function privado.conferir_escolha_explorar()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_qid text;
begin
  if not exists (select 1 from public.destinos d where d.id = new.destino_id and d.viagem_id = new.viagem_id) then
    raise exception 'Esse destino não é desta viagem' using errcode = 'TR422';
  end if;

  if new.escolha = 'nao_abro_mao' then
    select wikidata into v_qid from public.catalogo_lugares where id = new.catalogo_lugar_id;
    -- Conta os "não abro mão" do Explorar + as prioridades que já existem no destino
    -- (sem contar duas vezes o mesmo lugar, que já virou prioridade pelo Explorar).
    if (
      select count(*) from (
        select c.wikidata as qid, e.catalogo_lugar_id::text as chave
        from public.explorar_escolhas e
        join public.catalogo_lugares c on c.id = e.catalogo_lugar_id
        where e.usuario_id = new.usuario_id and e.destino_id = new.destino_id
          and e.escolha = 'nao_abro_mao' and e.catalogo_lugar_id <> new.catalogo_lugar_id
        union
        select l.wikidata as qid, l.id::text as chave
        from public.lugar_prioridades p
        join public.lugares l on l.id = p.lugar_id
        where p.usuario_id = new.usuario_id and l.destino_id = new.destino_id
          and (l.wikidata is null or l.wikidata is distinct from v_qid)
          and (l.wikidata is null or not exists (
            select 1 from public.explorar_escolhas e2
            join public.catalogo_lugares c2 on c2.id = e2.catalogo_lugar_id
            where e2.usuario_id = new.usuario_id and e2.destino_id = new.destino_id
              and e2.escolha = 'nao_abro_mao' and c2.wikidata = l.wikidata
          ))
      ) t
    ) >= 3 then
      raise exception 'No máximo 3 "não abro mão" por destino' using errcode = '23514';
    end if;
  end if;
  return new;
end;
$$;

revoke execute on function privado.conferir_escolha_explorar() from public, anon, authenticated;

create trigger conferir_escolha_explorar
before insert or update on public.explorar_escolhas
for each row execute function privado.conferir_escolha_explorar();

alter table public.explorar_escolhas enable row level security;

create policy "explorar: ver as minhas" on public.explorar_escolhas for select to authenticated
using (usuario_id = (select auth.uid()));
create policy "explorar: escolher (comboio, a minha)" on public.explorar_escolhas for insert to authenticated
with check (usuario_id = (select auth.uid()) and privado.e_membro(viagem_id));
create policy "explorar: mudar a minha" on public.explorar_escolhas for update to authenticated
using (usuario_id = (select auth.uid()))
with check (usuario_id = (select auth.uid()) and privado.e_membro(viagem_id));
create policy "explorar: desfazer a minha" on public.explorar_escolhas for delete to authenticated
using (usuario_id = (select auth.uid()));

grant select, insert, update, delete on public.explorar_escolhas to authenticated;

-- ---------- 4. Montar: escolhas viram lugares, curtidas e prioridades ----------
-- Roda como quem chamou (security invoker): as regras de lugares, votos e prioridades continuam valendo.
create function public.explorar_criar_lugares(p_destino uuid)
returns setof uuid
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_viagem uuid;
  r record;
  v_lugar uuid;
begin
  select viagem_id into v_viagem from public.destinos where id = p_destino;
  if v_viagem is null or not privado.e_membro(v_viagem) then
    raise exception 'Você não está nesta viagem' using errcode = '42501';
  end if;

  for r in
    select e.escolha, c.*
    from public.explorar_escolhas e
    join public.catalogo_lugares c on c.id = e.catalogo_lugar_id
    where e.usuario_id = auth.uid() and e.destino_id = p_destino and e.escolha in ('quero', 'nao_abro_mao')
    order by (e.escolha = 'nao_abro_mao') desc, c.fama desc
  loop
    -- Já existe na viagem? (mesmo item da Wikidata, ou mesmo nome no mesmo destino)
    select l.id into v_lugar from public.lugares l
    where l.viagem_id = v_viagem
      and ((r.wikidata is not null and l.wikidata = r.wikidata)
        or (l.destino_id = p_destino and lower(l.nome) = lower(r.nome)))
    limit 1;

    if v_lugar is null then
      insert into public.lugares (viagem_id, destino_id, tipo, nome, link, observacao, latitude, longitude, endereco, wikidata)
      values (v_viagem, p_destino, 'passeio', left(r.nome, 120), r.link_wikipedia, r.por_que, r.latitude, r.longitude, left(r.bairro, 200), r.wikidata)
      returning id into v_lugar;
    end if;

    insert into public.lugar_votos (lugar_id) values (v_lugar) on conflict do nothing;
    if r.escolha = 'nao_abro_mao' then
      insert into public.lugar_prioridades (lugar_id) values (v_lugar) on conflict do nothing;
    end if;
    return next v_lugar;
  end loop;
end;
$$;

revoke execute on function public.explorar_criar_lugares(uuid) from public, anon;
grant execute on function public.explorar_criar_lugares(uuid) to authenticated;
