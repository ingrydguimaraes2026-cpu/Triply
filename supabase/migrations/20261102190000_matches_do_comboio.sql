-- Match do comboio (spec 117, parte 4; muda a decisão da 114).
-- Cada um continua deslizando sozinho, mas agora o grupo vê QUEM quer cada lugar ("Ana e Ju querem")
-- e, com 3 ou mais "quero" (ou todos, se o comboio tem menos de 3), o lugar vira match.
--
-- O que muda:
--   1. `matches_da_viagem(p_viagem)`: por lugar do catálogo, quantos querem, quem quer e se já está num dia
--      do roteiro. Só quem é do comboio pergunta (security definer com checagem de membro).
--      As escolhas continuam sem leitura direta (explorar_escolhas: "ver as minhas"); "passo" nunca aparece.
--   2. `avisos_de_match`: guarda o dia em que cada pessoa recebeu o aviso "falta você opinar"
--      (no máximo 1 por dia por viagem, pra não virar spam).
--   3. `avisos_de_match_a_enviar()`: a função "lembretes" (service role) chama e já marca como enviado.
--
-- Pra desfazer:
--   drop function public.avisos_de_match_a_enviar();
--   drop table public.avisos_de_match;
--   drop function public.matches_da_viagem(uuid);

-- ---------- 1. Matches da viagem ----------
create function public.matches_da_viagem(p_viagem uuid)
returns table (catalogo_lugar_id uuid, destino_id uuid, nome text, foto_url text, querem integer, quem uuid[], no_dia boolean)
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if not privado.e_membro(p_viagem) then
    raise exception 'Você não está nesta viagem' using errcode = '42501';
  end if;

  return query
  select
    e.catalogo_lugar_id,
    e.destino_id,
    c.nome,
    c.foto_url,
    count(*)::integer as querem,
    array_agg(e.usuario_id order by e.criado_em) as quem,
    -- Já está num dia: o lugar da viagem (mesmo item da Wikidata ou mesmo nome no destino) aparece no roteiro
    exists (
      select 1
      from public.lugares l
      join public.roteiros r on r.destino_id = l.destino_id
      where l.viagem_id = p_viagem
        and l.destino_id = e.destino_id
        and ((c.wikidata is not null and l.wikidata = c.wikidata) or lower(l.nome) = lower(c.nome))
        and r.dias @> jsonb_build_array(jsonb_build_array(l.id::text))
    ) as no_dia
  from public.explorar_escolhas e
  join public.catalogo_lugares c on c.id = e.catalogo_lugar_id
  where e.viagem_id = p_viagem and e.escolha in ('quero', 'nao_abro_mao')
  group by e.catalogo_lugar_id, e.destino_id, c.nome, c.foto_url, c.wikidata;
end;
$$;

revoke all on function public.matches_da_viagem(uuid) from public, anon;
grant execute on function public.matches_da_viagem(uuid) to authenticated;

-- Pra contar rápido as escolhas da viagem
create index if not exists explorar_escolhas_viagem_idx on public.explorar_escolhas (viagem_id, catalogo_lugar_id) where escolha in ('quero', 'nao_abro_mao');

-- ---------- 2. Quem já recebeu o aviso hoje ----------
create table public.avisos_de_match (
  viagem_id uuid not null references public.viagens (id) on delete cascade,
  usuario_id uuid not null references public.perfis (id) on delete cascade,
  dia date not null default (now() at time zone 'America/Sao_Paulo')::date,
  catalogo_lugar_id uuid references public.catalogo_lugares (id) on delete set null,
  enviado_em timestamptz not null default now(),
  primary key (viagem_id, usuario_id, dia)
);

create index on public.avisos_de_match (usuario_id);
create index on public.avisos_de_match (catalogo_lugar_id);

-- Só a função do servidor mexe aqui (RLS ligada e sem política = ninguém do app lê nem grava)
alter table public.avisos_de_match enable row level security;

-- ---------- 3. Avisos a mandar agora ----------
-- Pra cada match (3+ "quero", ou todos se o comboio tem menos de 3 e pelo menos 2), quem do comboio
-- ainda não opinou naquele lugar e não recebeu aviso de match hoje nessa viagem. Um lugar por pessoa.
create function public.avisos_de_match_a_enviar()
returns table (viagem_id uuid, usuario_id uuid, catalogo_lugar_id uuid, lugar text)
language sql
security definer
set search_path = ''
as $$
  with pessoas as (
    select m.viagem_id, count(*)::integer as total from public.comboio_membros m group by m.viagem_id
  ),
  matches as (
    select e.viagem_id, e.destino_id, e.catalogo_lugar_id, count(*)::integer as querem, max(e.criado_em) as quando
    from public.explorar_escolhas e
    where e.escolha in ('quero', 'nao_abro_mao')
    group by e.viagem_id, e.destino_id, e.catalogo_lugar_id
  ),
  pendentes as (
    select distinct on (m.viagem_id, cm.usuario_id)
      m.viagem_id, cm.usuario_id, m.catalogo_lugar_id, c.nome as lugar
    from matches m
    join pessoas p on p.viagem_id = m.viagem_id
    join public.viagens v on v.id = m.viagem_id
    join public.catalogo_lugares c on c.id = m.catalogo_lugar_id
    join public.comboio_membros cm on cm.viagem_id = m.viagem_id
    where p.total >= 2
      and m.querem >= least(3, p.total)
      and (v.data_fim is null or v.data_fim >= current_date)
      and not exists (
        select 1 from public.explorar_escolhas x
        where x.destino_id = m.destino_id and x.catalogo_lugar_id = m.catalogo_lugar_id and x.usuario_id = cm.usuario_id
      )
      and not exists (
        select 1 from public.avisos_de_match a
        where a.viagem_id = m.viagem_id and a.usuario_id = cm.usuario_id
          and a.dia = (now() at time zone 'America/Sao_Paulo')::date
      )
    order by m.viagem_id, cm.usuario_id, m.querem desc, m.quando desc
  ),
  marcados as (
    insert into public.avisos_de_match (viagem_id, usuario_id, catalogo_lugar_id)
    select viagem_id, usuario_id, catalogo_lugar_id from pendentes
    on conflict do nothing
    returning viagem_id, usuario_id, catalogo_lugar_id
  )
  select k.viagem_id, k.usuario_id, k.catalogo_lugar_id, p.lugar
  from marcados k
  join pendentes p on p.viagem_id = k.viagem_id and p.usuario_id = k.usuario_id;
$$;

revoke execute on function public.avisos_de_match_a_enviar() from public, anon, authenticated;
