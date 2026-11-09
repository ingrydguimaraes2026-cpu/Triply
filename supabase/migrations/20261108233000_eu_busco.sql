-- Spec 121a: "Eu busco" na chegada de alguém. Qualquer membro com conta marca (ou desmarca) que vai
-- buscar, sem poder editar o resto do trajeto (que é de quem lançou ou do ADM).
--
-- Pra desfazer:
--   drop function public.vou_buscar(uuid, boolean);

create function public.vou_buscar(p_trajeto uuid, p_buscar boolean)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_viagem uuid;
  v_quem uuid;
begin
  select viagem_id, quem_busca_id into v_viagem, v_quem from public.trajetos where id = p_trajeto and tipo = 'chegada';
  if v_viagem is null or not privado.membro_com_conta(v_viagem) then
    raise exception 'Só quem está no comboio marca quem vai buscar.' using errcode = '42501';
  end if;
  if p_buscar then
    update public.trajetos set quem_busca_id = (select auth.uid()) where id = p_trajeto;
  elsif v_quem = (select auth.uid()) then
    update public.trajetos set quem_busca_id = null where id = p_trajeto;
  end if;
end;
$$;

revoke execute on function public.vou_buscar(uuid, boolean) from public, anon;
grant execute on function public.vou_buscar(uuid, boolean) to authenticated;
