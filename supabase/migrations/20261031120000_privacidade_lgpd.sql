-- Spec 089 (M11): privacidade e LGPD. Baixar meus dados e excluir minha conta.
--
-- O que muda:
-- 1. `public.meus_dados()`: devolve tudo que é MEU num JSON só (perfil, ficha, documentos,
--    mala, orçamento pessoal, avisos, viagens, gastos que lancei ou paguei, minha parte nas
--    divisões, posts e comentários). Gasto pessoal de outra pessoa nunca entra.
-- 2. `public.excluir_meus_dados()`: o "excluir conta" do lado do banco:
--    - em cada viagem: se eu sou a única pessoa, a viagem é apagada; se eu sou o único ADM,
--      o ADM passa pra quem entrou primeiro (com conta, não convidado); depois eu saio;
--    - apaga ficha, documentos, mala, orçamento pessoal, carteira, avisos no celular,
--      disponibilidades, metas de câmbio, chegadas, diário, marcações em fotos e meus gastos pessoais;
--    - o perfil vira "Conta excluída" (sem foto). Gastos, fotos e posts que o comboio
--      divide continuam, com esse nome, pra não bagunçar as contas de quem ficou.
--    A Edge Function `excluir-conta` chama esta função e depois desativa o login.
--
-- Quem pode: cada um só os próprios dados (usa auth.uid()).
--
-- Pra desfazer:
--   drop function public.excluir_meus_dados();
--   drop function public.meus_dados();

create function public.meus_dados()
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  eu uuid := (select auth.uid());
  v_extra jsonb;
begin
  if eu is null then
    raise exception 'Precisa estar logado.' using errcode = '42501';
  end if;
  -- Diário (spec 101): tabela de uma migration posterior; só entra se já existir
  if to_regclass('public.diario') is not null then
    execute 'select jsonb_build_object(''diario'', coalesce((select jsonb_agg(to_jsonb(x)) from public.diario x where x.autor = $1), ''[]''))'
    into v_extra using eu;
  end if;
  return jsonb_build_object(
    'gerado_em', now(),
    'perfil', (select to_jsonb(p) from public.perfis p where p.id = eu),
    'email', (select u.email from auth.users u where u.id = eu),
    'ficha', (select to_jsonb(f) from public.fichas_pessoais f where f.usuario_id = eu),
    'documentos', (select to_jsonb(d) from public.documentos_pessoais d where d.usuario_id = eu),
    'viagens', coalesce((select jsonb_agg(jsonb_build_object('id', v.id, 'nome', v.nome, 'inicio', v.data_inicio, 'fim', v.data_fim, 'papel', m.papel))
      from public.comboio_membros m join public.viagens v on v.id = m.viagem_id where m.usuario_id = eu), '[]'),
    'gastos', coalesce((select jsonb_agg(to_jsonb(g)) from public.gastos g
      where (g.criado_por = eu or (g.pago_por = eu and not g.pessoal))), '[]'),
    'minhas_partes', coalesce((select jsonb_agg(to_jsonb(d)) from public.gasto_divisoes d
      join public.gastos g on g.id = d.gasto_id
      where d.usuario_id = eu and (not g.pessoal or g.criado_por = eu)), '[]'),
    'compras_de_moeda', coalesce((select jsonb_agg(to_jsonb(c)) from public.compras_cambio c where c.usuario_id = eu), '[]'),
    'mala', coalesce((select jsonb_agg(to_jsonb(x)) from public.mala_itens x where x.usuario_id = eu), '[]'),
    'orcamentos_pessoais', coalesce((select jsonb_agg(to_jsonb(x)) from public.orcamentos_pessoais x where x.usuario_id = eu), '[]'),
    'preferencias_de_aviso', coalesce((select jsonb_agg(to_jsonb(x)) from public.preferencias_aviso x where x.usuario_id = eu), '[]'),
    'disponibilidades', coalesce((select jsonb_agg(to_jsonb(x)) from public.disponibilidades x where x.usuario_id = eu), '[]'),
    'chegadas', coalesce((select jsonb_agg(to_jsonb(x)) from public.chegadas x where x.usuario_id = eu), '[]'),
    'posts', coalesce((select jsonb_agg(to_jsonb(x)) from public.posts x where x.autor = eu), '[]'),
    'comentarios', coalesce((select jsonb_agg(to_jsonb(x)) from public.comentarios x where x.autor = eu), '[]'),
    'comentarios_em_itens', coalesce((select jsonb_agg(to_jsonb(x)) from public.comentarios_item x where x.autor = eu), '[]')
  ) || coalesce(v_extra, '{}'::jsonb);
end;
$$;

revoke all on function public.meus_dados() from public, anon;
grant execute on function public.meus_dados() to authenticated;

create function public.excluir_meus_dados()
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  eu uuid := (select auth.uid());
  m record;
  v_novo_adm uuid;
begin
  if eu is null then
    raise exception 'Precisa estar logado.' using errcode = '42501';
  end if;

  for m in select viagem_id, papel from public.comboio_membros where usuario_id = eu loop
    if not exists (select 1 from public.comboio_membros o where o.viagem_id = m.viagem_id and o.usuario_id <> eu) then
      -- Só eu na viagem: apaga a viagem inteira
      delete from public.viagens where id = m.viagem_id;
      continue;
    end if;
    if m.papel = 'adm' and not exists (
      select 1 from public.comboio_membros o where o.viagem_id = m.viagem_id and o.usuario_id <> eu and o.papel = 'adm'
    ) then
      select o.usuario_id into v_novo_adm
      from public.comboio_membros o
      join auth.users u on u.id = o.usuario_id
      where o.viagem_id = m.viagem_id and o.usuario_id <> eu and not coalesce(u.is_anonymous, false)
      order by o.entrou_em
      limit 1;
      if v_novo_adm is null then
        raise exception 'Numa das viagens só sobram convidados sem conta. Apague a viagem ou peça pra alguém criar conta antes.'
          using hint = 'TR_SEM_HERDEIRO';
      end if;
      update public.comboio_membros set papel = 'adm' where viagem_id = m.viagem_id and usuario_id = v_novo_adm;
    end if;
    delete from public.comboio_membros where viagem_id = m.viagem_id and usuario_id = eu;
  end loop;

  delete from public.gastos where criado_por = eu and pessoal;
  delete from public.fichas_pessoais where usuario_id = eu;
  delete from public.documentos_pessoais where usuario_id = eu;
  delete from public.documentos_status where usuario_id = eu;
  delete from public.mala_itens where usuario_id = eu;
  delete from public.orcamentos_pessoais where usuario_id = eu;
  delete from public.orcamento_faixas where usuario_id = eu;
  delete from public.preferencias_aviso where usuario_id = eu;
  delete from public.push_inscricoes where usuario_id = eu;
  delete from public.carteiras where usuario_id = eu;
  delete from public.gmail_contas where usuario_id = eu;
  delete from public.atividades_vistas where usuario_id = eu;
  delete from public.disponibilidades where usuario_id = eu;
  delete from public.metas_cambio where usuario_id = eu;
  delete from public.chegadas where usuario_id = eu;
  delete from public.seguros_viagem where criado_por = eu;
  -- Tabelas de migrations posteriores (specs 100 e 101): só se já existirem
  if to_regclass('public.diario') is not null then
    execute 'delete from public.diario where autor = $1' using eu;
  end if;
  if to_regclass('public.post_marcacoes') is not null then
    execute 'delete from public.post_marcacoes where usuario_id = $1' using eu;
  end if;

  update public.perfis set nome = 'Conta excluída', avatar_url = null where id = eu;
end;
$$;

revoke all on function public.excluir_meus_dados() from public, anon;
grant execute on function public.excluir_meus_dados() to authenticated;
