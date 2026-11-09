-- Spec 122: membro pode SUGERIR deslocamento (decisão do Victor, 08/11/2026).
-- Qualquer pessoa do comboio (com conta) põe um deslocamento ou uma opção "pra decidir".
-- Decidir, reservar e comprar continua só com o ADM ou com quem ele liberou (pode_editar 'transportes').
-- Quem lançou a sugestão pode mexer nela e apagar enquanto ela for sugestão.

drop policy if exists "trajetos: criar (adm, liberado ou a própria chegada)" on public.trajetos;
create policy "trajetos: criar (adm, liberado, a própria chegada ou sugestão)" on public.trajetos
  for insert to authenticated
  with check (
    privado.pode_editar(viagem_id, 'transportes')
    or (
      criado_por = (select auth.uid())
      and privado.membro_com_conta(viagem_id)
      and (tipo in ('chegada', 'saida') or (tipo = 'trecho' and situacao = 'sugestao'))
    )
  );

drop policy if exists "trajetos: editar (adm, liberado ou quem lançou)" on public.trajetos;
create policy "trajetos: editar (adm, liberado ou quem lançou)" on public.trajetos
  for update to authenticated
  using (
    privado.pode_editar(viagem_id, 'transportes')
    or (criado_por = (select auth.uid()) and privado.membro_com_conta(viagem_id))
  )
  with check (
    privado.pode_editar(viagem_id, 'transportes')
    or (
      criado_por = (select auth.uid())
      and privado.membro_com_conta(viagem_id)
      and (tipo in ('chegada', 'saida') or (tipo = 'trecho' and situacao = 'sugestao'))
    )
  );
