-- Roteiro do grupo (spec 115, etapa 6): quantas pessoas do comboio já escolheram lugares num destino.
-- As escolhas continuam "só eu vejo" (explorar_escolhas). Esta função devolve só os números,
-- nunca quem escolheu o quê. Só quem é do comboio consegue perguntar.

create function public.explorar_quem_escolheu(p_destino uuid)
returns table (escolheram integer, pessoas integer)
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_viagem uuid;
begin
  select viagem_id into v_viagem from public.destinos where id = p_destino;
  if v_viagem is null or not privado.e_membro(v_viagem) then
    raise exception 'Você não está nesta viagem' using errcode = '42501';
  end if;

  return query
  select
    (select count(distinct e.usuario_id)::integer from public.explorar_escolhas e where e.destino_id = p_destino),
    (select count(*)::integer from public.comboio_membros m where m.viagem_id = v_viagem);
end;
$$;

revoke all on function public.explorar_quem_escolheu(uuid) from public, anon;
grant execute on function public.explorar_quem_escolheu(uuid) to authenticated;
