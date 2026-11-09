-- Spec 078: permissões simples (F7). O ADM liga, por viagem, se o comboio também pode editar:
--   - o roteiro (destinos e datas),
--   - os transportes (trajetos),
--   - o orçamento por categoria.
-- Padrão: desligado (tudo continua só com o ADM, como antes).
--
-- O que esta migration faz:
-- 1. Colunas em `viagens`: membro_edita_roteiro, membro_edita_transportes, membro_edita_orcamento.
--    Só o ADM muda (a regra de editar viagens já é do ADM).
-- 2. Função `privado.pode_editar(viagem, area)`: ADM sempre; membro só se a área estiver liberada.
-- 3. Troca as regras (RLS) de criar/editar/apagar de destinos, trajetos e orçamentos pra usar essa função.
-- 4. Recria `salvar_roteiro` (mesmo corpo da 20261018120100) trocando só a checagem de ADM.
--
-- Pra desfazer: recriar as policies "(adm)" de 20261010120000 e salvar_roteiro de 20261018120100;
--   drop function privado.pode_editar(uuid, text);
--   alter table public.viagens drop column membro_edita_roteiro, drop column membro_edita_transportes, drop column membro_edita_orcamento;

alter table public.viagens
  add column membro_edita_roteiro boolean not null default false,
  add column membro_edita_transportes boolean not null default false,
  add column membro_edita_orcamento boolean not null default false;

create function privado.pode_editar(p_viagem uuid, p_area text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select privado.e_adm(p_viagem)
    or (
      privado.e_membro(p_viagem)
      and exists (
        select 1 from public.viagens v
        where v.id = p_viagem
          and case p_area
            when 'roteiro' then v.membro_edita_roteiro
            when 'transportes' then v.membro_edita_transportes
            when 'orcamento' then v.membro_edita_orcamento
            else false
          end
      )
    );
$$;

revoke execute on function privado.pode_editar(uuid, text) from public, anon;
grant execute on function privado.pode_editar(uuid, text) to authenticated;

drop policy "destinos: criar (adm)" on public.destinos;
drop policy "destinos: editar (adm)" on public.destinos;
drop policy "destinos: apagar (adm)" on public.destinos;
create policy "destinos: criar (adm ou liberado)" on public.destinos for insert to authenticated with check (privado.pode_editar(viagem_id, 'roteiro'));
create policy "destinos: editar (adm ou liberado)" on public.destinos for update to authenticated
  using (privado.pode_editar(viagem_id, 'roteiro')) with check (privado.pode_editar(viagem_id, 'roteiro'));
create policy "destinos: apagar (adm ou liberado)" on public.destinos for delete to authenticated using (privado.pode_editar(viagem_id, 'roteiro'));

drop policy "trajetos: criar (adm)" on public.trajetos;
drop policy "trajetos: editar (adm)" on public.trajetos;
drop policy "trajetos: apagar (adm)" on public.trajetos;
create policy "trajetos: criar (adm ou liberado)" on public.trajetos for insert to authenticated with check (privado.pode_editar(viagem_id, 'transportes'));
create policy "trajetos: editar (adm ou liberado)" on public.trajetos for update to authenticated
  using (privado.pode_editar(viagem_id, 'transportes')) with check (privado.pode_editar(viagem_id, 'transportes'));
create policy "trajetos: apagar (adm ou liberado)" on public.trajetos for delete to authenticated using (privado.pode_editar(viagem_id, 'transportes'));

drop policy "orcamentos: criar (adm)" on public.orcamentos;
drop policy "orcamentos: editar (adm)" on public.orcamentos;
drop policy "orcamentos: apagar (adm)" on public.orcamentos;
create policy "orcamentos: criar (adm ou liberado)" on public.orcamentos for insert to authenticated with check (privado.pode_editar(viagem_id, 'orcamento'));
create policy "orcamentos: editar (adm ou liberado)" on public.orcamentos for update to authenticated
  using (privado.pode_editar(viagem_id, 'orcamento')) with check (privado.pode_editar(viagem_id, 'orcamento'));
create policy "orcamentos: apagar (adm ou liberado)" on public.orcamentos for delete to authenticated using (privado.pode_editar(viagem_id, 'orcamento'));

-- salvar_roteiro: mesmo corpo de 20261018120100_datas_no_roteiro.sql, só a checagem de quem pode mudou
create or replace function public.salvar_roteiro(p_viagem uuid, p_destinos jsonb, p_removidos uuid[] default '{}')
returns setof public.destinos
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_item jsonb;
  v_posicao int;
  v_total int;
begin
  if p_viagem is null or not privado.pode_editar(p_viagem, 'roteiro') then
    raise exception 'Só o ADM (ou o comboio, se o ADM liberar) pode editar o roteiro' using errcode = '42501';
  end if;
  if p_destinos is null or jsonb_typeof(p_destinos) <> 'array' then
    raise exception 'Formato de roteiro inválido';
  end if;
  v_total := jsonb_array_length(p_destinos);
  if v_total = 0 then
    raise exception 'O roteiro precisa ter pelo menos um destino';
  end if;
  if v_total > 100 then
    raise exception 'O roteiro pode ter no máximo 100 destinos';
  end if;

  -- Uma edição por vez em cada viagem (a segunda espera a primeira terminar)
  perform pg_advisory_xact_lock(hashtextextended(p_viagem::text, 0));

  if exists (select 1 from jsonb_array_elements(p_destinos) e where jsonb_typeof(e) <> 'object') then
    raise exception 'Formato de destino inválido';
  end if;
  if (
    select count(*) <> count(distinct x)
    from (select (e->>'id')::uuid as x from jsonb_array_elements(p_destinos) e where e->>'id' is not null) s
  ) then
    raise exception 'Destino repetido na lista';
  end if;
  if exists (
    select 1 from jsonb_array_elements(p_destinos) e
    where (e->>'id')::uuid = any(coalesce(p_removidos, '{}'))
  ) then
    raise exception 'Um destino não pode ser mantido e removido ao mesmo tempo';
  end if;
  if exists (
    select 1 from jsonb_array_elements(p_destinos) e
    where (e->>'chegada') is not null and (e->>'saida') is not null
      and (e->>'saida')::date < (e->>'chegada')::date
  ) then
    raise exception 'A saída de um destino não pode ser antes da chegada' using errcode = 'TR422';
  end if;

  -- 1. Apaga SÓ os que a pessoa removeu. Trajetos e fotos ficam (on delete set null).
  delete from public.destinos
  where viagem_id = p_viagem and id = any(coalesce(p_removidos, '{}'));

  -- 2. Grava ordem e datas dos que ficaram e insere os novos
  for v_item, v_posicao in
    select e.valor, (e.posicao - 1)::int
    from jsonb_array_elements(p_destinos) with ordinality as e(valor, posicao)
  loop
    if v_item->>'id' is not null then
      update public.destinos set
        ordem = v_posicao,
        chegada = case when v_item ? 'chegada' then (v_item->>'chegada')::date else chegada end,
        saida = case when v_item ? 'saida' then (v_item->>'saida')::date else saida end
      where id = (v_item->>'id')::uuid and viagem_id = p_viagem;
      if not found then
        raise exception 'O roteiro foi alterado em outro lugar' using errcode = 'TR409';
      end if;
    else
      if char_length(trim(coalesce(v_item->>'nome', ''))) not between 1 and 200
         or char_length(coalesce(v_item->>'pais', '')) > 100
         or v_item->>'latitude' is null
         or v_item->>'longitude' is null
         or (v_item->>'latitude')::double precision not between -90 and 90
         or (v_item->>'longitude')::double precision not between -180 and 180 then
        raise exception 'Destino novo com dados inválidos';
      end if;
      insert into public.destinos (viagem_id, nome, pais, latitude, longitude, ordem, chegada, saida)
      values (
        p_viagem,
        trim(v_item->>'nome'),
        nullif(v_item->>'pais', ''),
        (v_item->>'latitude')::double precision,
        (v_item->>'longitude')::double precision,
        v_posicao,
        (v_item->>'chegada')::date,
        (v_item->>'saida')::date
      );
    end if;
  end loop;

  -- 3. Conflito: a viagem tem algum destino que a pessoa não conhecia? Desfaz tudo.
  if (select count(*) from public.destinos where viagem_id = p_viagem) <> v_total then
    raise exception 'O roteiro foi alterado em outro lugar' using errcode = 'TR409';
  end if;

  return query select * from public.destinos where viagem_id = p_viagem order by ordem;
end;
$$;

revoke execute on function public.salvar_roteiro(uuid, jsonb, uuid[]) from public, anon;
grant execute on function public.salvar_roteiro(uuid, jsonb, uuid[]) to authenticated;
