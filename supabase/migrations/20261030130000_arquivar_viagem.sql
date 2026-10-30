-- Spec 054: arquivar viagem (N2). Cada pessoa tira a viagem da PRÓPRIA lista, sem apagar nada
-- e sem mexer na lista dos outros.
--
-- O que esta migration faz:
-- 1. `comboio_membros.arquivada_em`: quando a pessoa arquivou a viagem (null = na lista).
-- 2. Função `arquivar_viagem(viagem, arquivar)`: grava/limpa SÓ a linha de quem chama
--    (a tabela continua sem deixar o membro mudar o próprio papel).
--
-- Pra desfazer:
--   drop function public.arquivar_viagem(uuid, boolean);
--   alter table public.comboio_membros drop column arquivada_em;

alter table public.comboio_membros add column arquivada_em timestamptz;

create function public.arquivar_viagem(p_viagem uuid, p_arquivar boolean)
returns void
language sql
security definer
set search_path = ''
as $$
  update public.comboio_membros
  set arquivada_em = case when p_arquivar then now() end
  where viagem_id = p_viagem and usuario_id = (select auth.uid());
$$;

revoke execute on function public.arquivar_viagem(uuid, boolean) from public, anon;
grant execute on function public.arquivar_viagem(uuid, boolean) to authenticated;
