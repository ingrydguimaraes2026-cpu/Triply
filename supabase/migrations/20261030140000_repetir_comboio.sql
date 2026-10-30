-- Spec 055: repetir com o mesmo comboio (N3). "Nova viagem com este comboio" traz todo mundo
-- de uma viagem antiga pra uma viagem nova, sem precisar de convite.
--
-- O que esta migration faz:
-- 1. Função `trazer_comboio(nova, origem)`: quem chama precisa ser ADM da viagem nova e do comboio
--    da viagem de origem. Põe na nova, como membro, todo mundo da origem que ainda não está lá.
--    Devolve quantas pessoas entraram.
--
-- Pra desfazer:
--   drop function public.trazer_comboio(uuid, uuid);

create function public.trazer_comboio(p_nova uuid, p_origem uuid)
returns int
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_quantos int;
begin
  if not exists (select 1 from public.comboio_membros where viagem_id = p_nova and usuario_id = (select auth.uid()) and papel = 'adm') then
    raise exception 'Só o ADM da viagem nova traz o comboio' using errcode = '42501';
  end if;
  if not exists (select 1 from public.comboio_membros where viagem_id = p_origem and usuario_id = (select auth.uid())) then
    raise exception 'Você não é do comboio dessa viagem' using errcode = '42501';
  end if;
  insert into public.comboio_membros (viagem_id, usuario_id, papel)
  select p_nova, m.usuario_id, 'membro'
  from public.comboio_membros m
  where m.viagem_id = p_origem
  on conflict do nothing;
  get diagnostics v_quantos = row_count;
  return v_quantos;
end;
$$;

revoke execute on function public.trazer_comboio(uuid, uuid) from public, anon;
grant execute on function public.trazer_comboio(uuid, uuid) to authenticated;
