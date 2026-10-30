-- Spec 091 (N4): duplicar viagem. Copia o planejamento de uma viagem pra uma nova.
--
-- O que muda:
-- - Função `duplicar_viagem(origem, nome, inicio)`: cria uma viagem nova (quem chama vira ADM)
--   com cópia do roteiro (destinos), transportes, lugares, agenda, listas e tarefas.
--   Se `inicio` vier, todas as datas andam junto (ex.: começava 20/11, agora começa 10/05:
--   tudo anda 171 dias). Sem `inicio`, as datas ficam em branco e a agenda não é copiada.
-- - NÃO copia: gastos, hospedagens, fotos, posts, enquetes, documentos, nem as pessoas
--   (pra trazer o comboio, o app chama `trazer_comboio`, spec 055).
-- - Itens copiados nascem "não feitos", sem responsável, e criados por quem duplicou.
--
-- Quem pode: quem está no comboio da viagem de origem.
--
-- Pra desfazer:
--   drop function public.duplicar_viagem(uuid, text, date);

create function public.duplicar_viagem(p_origem uuid, p_nome text, p_inicio date)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  eu uuid := (select auth.uid());
  v public.viagens;
  v_nova uuid;
  v_dias int; -- quantos dias as datas andam (null = sem datas)
  r record;
  v_mapa jsonb := '{}'::jsonb; -- id do destino antigo → id do novo
  v_novo_destino uuid;
begin
  if eu is null or not privado.e_membro(p_origem) then
    raise exception 'Você não é do comboio dessa viagem.' using errcode = '42501';
  end if;
  if p_nome is null or char_length(trim(p_nome)) = 0 then
    raise exception 'Dê um nome pra viagem nova.';
  end if;

  select * into v from public.viagens where id = p_origem;
  v_dias := case when p_inicio is not null and v.data_inicio is not null then p_inicio - v.data_inicio end;

  insert into public.viagens (nome, data_inicio, data_fim, moeda_principal, criado_por,
    membro_edita_roteiro, membro_edita_transportes, membro_edita_orcamento)
  values (
    left(trim(p_nome), 120),
    case when v_dias is not null then v.data_inicio + v_dias else p_inicio end,
    case when v_dias is not null then v.data_fim + v_dias end,
    v.moeda_principal, eu,
    v.membro_edita_roteiro, v.membro_edita_transportes, v.membro_edita_orcamento
  )
  returning id into v_nova;

  -- Destinos (guardando o mapa antigo → novo)
  for r in select * from public.destinos where viagem_id = p_origem order by ordem loop
    v_novo_destino := gen_random_uuid();
    v_mapa := v_mapa || jsonb_build_object(r.id::text, v_novo_destino);
    insert into public.destinos
    select * from jsonb_populate_record(null::public.destinos, to_jsonb(r) || jsonb_build_object(
      'id', v_novo_destino, 'viagem_id', v_nova,
      'chegada', case when v_dias is not null then r.chegada + v_dias end,
      'saida', case when v_dias is not null then r.saida + v_dias end));
  end loop;

  -- Transportes (horários andam junto; sem motorista)
  for r in select * from public.trajetos where viagem_id = p_origem loop
    insert into public.trajetos
    select * from jsonb_populate_record(null::public.trajetos, to_jsonb(r) || jsonb_build_object(
      'id', gen_random_uuid(), 'viagem_id', v_nova,
      'origem_id', v_mapa -> (r.origem_id::text), 'destino_id', v_mapa -> (r.destino_id::text),
      'partida', case when v_dias is not null then r.partida + make_interval(days => v_dias) end,
      'chegada', case when v_dias is not null then r.chegada + make_interval(days => v_dias) end,
      'motorista_id', null));
  end loop;

  -- Lugares (ninguém visitou ainda)
  for r in select * from public.lugares where viagem_id = p_origem loop
    insert into public.lugares
    select * from jsonb_populate_record(null::public.lugares, to_jsonb(r) || jsonb_build_object(
      'id', gen_random_uuid(), 'viagem_id', v_nova, 'destino_id', v_mapa -> (r.destino_id::text),
      'criado_por', eu, 'criado_em', now(), 'visitado_em', null));
  end loop;

  -- Agenda (só se tem datas)
  if v_dias is not null then
    for r in select * from public.eventos_agenda where viagem_id = p_origem loop
      insert into public.eventos_agenda
      select * from jsonb_populate_record(null::public.eventos_agenda, to_jsonb(r) || jsonb_build_object(
        'id', gen_random_uuid(), 'viagem_id', v_nova, 'dia', r.dia + v_dias,
        'participantes', '{}'::uuid[], 'criado_por', eu, 'criado_em', now()));
    end loop;
  end if;

  -- Listas e tarefas (tudo por fazer, sem dono)
  insert into public.itens_lista (viagem_id, lista, texto, quantidade, criado_por)
  select v_nova, i.lista, i.texto, i.quantidade, eu from public.itens_lista i where i.viagem_id = p_origem;

  insert into public.tarefas (viagem_id, titulo, prazo, criado_por)
  select v_nova, t.titulo, case when v_dias is not null then t.prazo + v_dias end, eu
  from public.tarefas t where t.viagem_id = p_origem;

  return v_nova;
end;
$$;

revoke all on function public.duplicar_viagem(uuid, text, date) from public, anon;
grant execute on function public.duplicar_viagem(uuid, text, date) to authenticated;
