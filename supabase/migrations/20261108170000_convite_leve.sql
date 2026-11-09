-- FILA 0.8 (spec 018, web leve /v/<código>): a prévia do convite ganha a vitrine do passaporte.
--
-- O que muda em ver_convite(codigo):
-- 1. Devolve 'passaporte': cada destino da viagem com o tipo e a data do carimbo (null = ainda apagado).
--    Só nome de lugar e data: nada de endereço, coordenada ou quem liberou.
-- 2. Quem já é do comboio continua abrindo pelo mesmo link depois que o convite vence
--    ('expirado' = true). Pra quem não é do comboio, convite vencido segue devolvendo null.
--
-- Pra desfazer: recriar ver_convite como em 20261029120000_convidado_sem_conta.sql.

create or replace function public.ver_convite(p_codigo text)
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  select jsonb_build_object(
    'viagem_id', v.id,
    'nome', v.nome,
    'data_inicio', v.data_inicio,
    'data_fim', v.data_fim,
    'destinos', coalesce((
      select jsonb_agg(d.nome order by d.ordem)
      from public.destinos d
      where d.viagem_id = v.id
    ), '[]'::jsonb),
    -- Só o primeiro nome de quem já está no comboio
    'membros', coalesce((
      select jsonb_agg(split_part(coalesce(p.nome, 'Viajante'), ' ', 1) order by m.entrou_em)
      from public.comboio_membros m
      join public.perfis p on p.id = m.usuario_id
      where m.viagem_id = v.id
    ), '[]'::jsonb),
    'ja_sou_membro', eu.membro,
    'expirado', c.expira_em <= now(),
    -- Vitrine do passaporte: um por destino, com a data do carimbo se já caiu
    'passaporte', coalesce((
      select jsonb_agg(jsonb_build_object('nome', d.nome, 'tipo', coalesce(k.tipo, 'cidade'), 'data', k.data) order by d.ordem)
      from public.destinos d
      left join public.carimbos k on k.destino_id = d.id
      where d.viagem_id = v.id
    ), '[]'::jsonb)
  )
  from public.convites c
  join public.viagens v on v.id = c.viagem_id
  cross join lateral (
    select exists (
      select 1 from public.comboio_membros m
      where m.viagem_id = v.id and m.usuario_id = (select auth.uid())
    ) as membro
  ) eu
  where c.codigo = p_codigo and (c.expira_em > now() or eu.membro);
$$;

revoke execute on function public.ver_convite(text) from public;
grant execute on function public.ver_convite(text) to anon, authenticated;
