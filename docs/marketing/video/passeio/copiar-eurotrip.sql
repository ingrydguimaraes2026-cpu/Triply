-- Cópia da Eurotrip (f5763559…) pra conta de QA demo@norti.test, pro vídeo de demonstração.
-- Aprovado pelo Victor em 10/11/2026. Roda no SQL Editor do Supabase (ou pelo MCP), como dono do banco.
--
-- O que faz:
-- - cria a viagem "Eurotrip" (mesmas datas e moeda) com a demo@norti.test como ADM;
-- - comboio de demonstração: Lívia (a conta demo), Ana Clara, Beto e Juliana. Ana, Beto e Juliana são
--   3 contas de teste antigas que não estavam em viagem nenhuma: aqui só troca o nome no perfil.
--   Ingryd vira Lívia e Paulo victor vira Ana Clara em tudo que foi copiado (votos, escolhas, autor);
-- - copia destinos, trajetos, hospedagens, lugares (com votos e prioridades), agenda, roteiro e Explorar;
-- - lança 6 gastos de demonstração (pagos antes da viagem), divididos entre os 4.
-- - Fotos: não estão aqui (precisam subir arquivo). Depois desta cópia: node passeio/fotos-demo.mjs
-- Não copia: convites, carteiras do Gmail, histórico e avisos.
-- Se já existir uma Eurotrip da conta demo, para sem mexer em nada.
--
-- Pra desfazer: delete from public.viagens where nome = 'Eurotrip'
--   and criado_por = (select id from auth.users where email = 'demo@norti.test');

do $$
declare
  v_origem constant uuid := 'f5763559-f032-4ed3-9195-fd84b11088b4';
  v_ingryd constant uuid := 'aeac53fd-8d2b-4fef-b90a-08ed10c37cf7';
  v_paulo constant uuid := '34991f24-0b5b-4b95-9313-1f47cb5addd1';
  v_ana constant uuid := '45dcd1f6-91fa-4299-836c-c1957d367e36';
  v_beto constant uuid := '877c23d7-eb97-4237-9194-81c088525bdc';
  v_ju constant uuid := '7d1dc45d-7f47-4055-b2b0-d555b8a3a51a';
  v_demo uuid;
  v_nova uuid;
  v_pessoas jsonb;            -- pessoa da Eurotrip → pessoa da cópia
  v_dest jsonb := '{}';       -- destino antigo → novo
  v_lug jsonb := '{}';        -- lugar antigo → novo
  v_grupo jsonb := '{}';      -- grupo de opções de trajeto antigo → novo
  v_gasto uuid;
  r record;
begin
  select id into v_demo from auth.users where email = 'demo@norti.test';
  if v_demo is null then
    raise exception 'Crie a conta demo@norti.test antes (Authentication > Add user, Auto Confirm).';
  end if;
  if exists (select 1 from public.viagens where criado_por = v_demo and nome = 'Eurotrip') then
    raise exception 'A conta demo já tem uma Eurotrip. Apague antes (ver "Pra desfazer").';
  end if;
  -- As 3 contas do comboio de demonstração não podem estar em outra viagem
  if exists (select 1 from public.comboio_membros where usuario_id in (v_ana, v_beto, v_ju)) then
    raise exception 'Alguma conta do comboio de demonstração já está em outra viagem.';
  end if;

  -- Tudo daqui pra baixo roda "como" a conta demo (auth.uid() = demo): é ela a ADM
  perform set_config('request.jwt.claims', json_build_object('sub', v_demo, 'role', 'authenticated')::text, true);

  v_pessoas := jsonb_build_object(v_ingryd, v_demo, v_paulo, v_ana);

  -- Nomes de demonstração
  update public.perfis set nome = 'Lívia' where id = v_demo;
  update public.perfis set nome = 'Ana Clara' where id = v_ana;
  update public.perfis set nome = 'Beto' where id = v_beto;
  update public.perfis set nome = 'Juliana' where id = v_ju;

  -- Viagem (o gatilho já põe a demo como ADM)
  insert into public.viagens (nome, data_inicio, data_fim, moeda_principal, criado_por,
    membro_edita_roteiro, membro_edita_transportes, membro_edita_orcamento, tipo)
  select nome, data_inicio, data_fim, moeda_principal, v_demo,
    membro_edita_roteiro, membro_edita_transportes, membro_edita_orcamento, tipo
  from public.viagens where id = v_origem
  returning id into v_nova;

  update public.comboio_membros set entrou_em = now() - interval '30 days' where viagem_id = v_nova and usuario_id = v_demo;
  insert into public.comboio_membros (viagem_id, usuario_id, papel, entrou_em) values
    (v_nova, v_ana, 'membro', now() - interval '29 days'),
    (v_nova, v_beto, 'membro', now() - interval '28 days'),
    (v_nova, v_ju, 'membro', now() - interval '27 days');

  -- Destinos
  for r in select * from public.destinos where viagem_id = v_origem order by ordem loop
    v_dest := v_dest || jsonb_build_object(r.id, gen_random_uuid());
    insert into public.destinos
    select * from jsonb_populate_record(null::public.destinos, to_jsonb(r) || jsonb_build_object(
      'id', v_dest ->> r.id::text, 'viagem_id', v_nova));
  end loop;

  -- Trajetos (passagens e deslocamentos)
  for r in select * from public.trajetos where viagem_id = v_origem loop
    if r.grupo_opcoes is not null and not v_grupo ? r.grupo_opcoes::text then
      v_grupo := v_grupo || jsonb_build_object(r.grupo_opcoes, gen_random_uuid());
    end if;
    insert into public.trajetos
    select * from jsonb_populate_record(null::public.trajetos, to_jsonb(r) || jsonb_build_object(
      'id', gen_random_uuid(), 'viagem_id', v_nova,
      'origem_id', v_dest -> (r.origem_id::text),
      'destino_id', v_dest -> (r.destino_id::text),
      'grupo_opcoes', v_grupo -> (r.grupo_opcoes::text),
      'motorista_id', v_pessoas -> (r.motorista_id::text),
      'quem_busca_id', v_pessoas -> (r.quem_busca_id::text),
      'criado_por', coalesce(v_pessoas -> (r.criado_por::text), to_jsonb(v_demo))));
  end loop;

  -- Hospedagens (as 3 escolhidas continuam escolhidas)
  for r in select * from public.hospedagens where viagem_id = v_origem loop
    insert into public.hospedagens
    select * from jsonb_populate_record(null::public.hospedagens, to_jsonb(r) || jsonb_build_object(
      'id', gen_random_uuid(), 'viagem_id', v_nova,
      'destino_id', v_dest -> (r.destino_id::text),
      'criado_por', coalesce(v_pessoas -> (r.criado_por::text), to_jsonb(v_demo))));
  end loop;

  -- Lugares, votos e "não abro mão"
  for r in select * from public.lugares where viagem_id = v_origem loop
    v_lug := v_lug || jsonb_build_object(r.id, gen_random_uuid());
    insert into public.lugares
    select * from jsonb_populate_record(null::public.lugares, to_jsonb(r) || jsonb_build_object(
      'id', v_lug ->> r.id::text, 'viagem_id', v_nova,
      'destino_id', v_dest -> (r.destino_id::text),
      'criado_por', coalesce(v_pessoas -> (r.criado_por::text), to_jsonb(v_demo))));
  end loop;
  insert into public.lugar_votos (lugar_id, usuario_id, criado_em)
  select (v_lug ->> lv.lugar_id::text)::uuid, (v_pessoas ->> lv.usuario_id::text)::uuid, lv.criado_em
  from public.lugar_votos lv
  where lv.lugar_id in (select id from public.lugares where viagem_id = v_origem)
    and v_pessoas ? lv.usuario_id::text;
  insert into public.lugar_prioridades (lugar_id, usuario_id, criado_em)
  select (v_lug ->> lp.lugar_id::text)::uuid, (v_pessoas ->> lp.usuario_id::text)::uuid, lp.criado_em
  from public.lugar_prioridades lp
  where lp.lugar_id in (select id from public.lugares where viagem_id = v_origem)
    and v_pessoas ? lp.usuario_id::text;

  -- Agenda (participantes trocados pelos do comboio novo)
  for r in select * from public.eventos_agenda where viagem_id = v_origem loop
    insert into public.eventos_agenda
    select * from jsonb_populate_record(null::public.eventos_agenda, to_jsonb(r) || jsonb_build_object(
      'id', gen_random_uuid(), 'viagem_id', v_nova,
      'criado_por', coalesce(v_pessoas -> (r.criado_por::text), to_jsonb(v_demo)),
      'participantes', coalesce((
        select jsonb_agg(v_pessoas -> (p::text)) from unnest(r.participantes) p where v_pessoas ? p::text
      ), '[]'::jsonb)));
  end loop;

  -- Roteiro dia a dia
  insert into public.roteiros (destino_id, viagem_id, dias)
  select (v_dest ->> ro.destino_id::text)::uuid, v_nova, ro.dias
  from public.roteiros ro where ro.viagem_id = v_origem;

  -- Escolhas do Explorar
  insert into public.explorar_escolhas (viagem_id, destino_id, usuario_id, catalogo_lugar_id, escolha, criado_em)
  select v_nova, (v_dest ->> e.destino_id::text)::uuid, (v_pessoas ->> e.usuario_id::text)::uuid, e.catalogo_lugar_id, e.escolha, e.criado_em
  from public.explorar_escolhas e
  where e.viagem_id = v_origem and v_pessoas ? e.usuario_id::text;

  -- Gastos de demonstração (pagos antes da viagem), divididos igual entre os 4
  for r in select * from (values
    ('Sinal do apê em Nice', 360.00, 'hospedagem', v_demo, date '2026-10-20'),
    ('Bernina Express (4 bilhetes)', 248.00, 'transporte', v_ana, date '2026-10-24'),
    ('B&B di Lorenzo, Roma', 420.00, 'hospedagem', v_beto, date '2026-10-28'),
    ('Ingressos do Coliseu', 72.00, 'passeios', v_ju, date '2026-11-03'),
    ('Voo Milão → Paris', 316.00, 'transporte', v_demo, date '2026-11-06'),
    ('Seguro viagem do grupo', 184.00, 'outros', v_ana, date '2026-11-08')
  ) as g(descricao, valor, categoria, pago_por, data) loop
    insert into public.gastos (viagem_id, pago_por, criado_por, descricao, valor, moeda, categoria, pessoal, data, criado_em, rascunho, meio_pagamento)
    values (v_nova, r.pago_por, r.pago_por, r.descricao, r.valor, 'EUR', r.categoria, false, r.data, r.data + time '20:00', false, 'cartao')
    returning id into v_gasto;
    insert into public.gasto_divisoes (gasto_id, usuario_id, valor)
    select v_gasto, u, r.valor / 4 from unnest(array[v_demo, v_ana, v_beto, v_ju]) u;
  end loop;

  raise notice 'Eurotrip da demo: %', v_nova;
end;
$$;
