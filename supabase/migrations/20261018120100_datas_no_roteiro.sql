-- Spec 001: datas de cada destino.
--
-- O que esta migration faz: troca a função `salvar_roteiro` por uma versão que TAMBÉM grava
-- `chegada` e `saida` de cada destino, no mesmo "tudo ou nada".
-- - Se um item não manda `chegada`/`saida`, a data dele não é tocada (igual à versão anterior).
-- - Saída antes da chegada é recusada (erro TR422) e nada é salvo.
-- Não altera tabelas, regras RLS nem dados.
--
-- Pra desfazer: rodar de novo o conteúdo de 20261013182836_salvar_roteiro.sql trocando
-- "create function" por "create or replace function".

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
  if p_viagem is null or not privado.e_adm(p_viagem) then
    raise exception 'Só o ADM pode editar o roteiro' using errcode = '42501';
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
