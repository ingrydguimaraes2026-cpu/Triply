-- Spec 061: "Já fomos" (C10). Marcar um lugar como visitado pelo comboio.
--
-- O que esta migration faz:
-- 1. `lugares.visitado_em`: quando o comboio marcou que foi (null = ainda não).
-- 2. Função `marcar_visitado(lugar, visitado)`: qualquer um do comboio marca/desmarca
--    (editar o resto do lugar continua com a regra de antes).
--
-- Pra desfazer:
--   drop function public.marcar_visitado(uuid, boolean);
--   alter table public.lugares drop column visitado_em;

alter table public.lugares add column visitado_em timestamptz;

create function public.marcar_visitado(p_lugar uuid, p_visitado boolean)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not exists (select 1 from public.lugares l where l.id = p_lugar and privado.e_membro(l.viagem_id)) then
    raise exception 'Lugar não encontrado' using errcode = '42501';
  end if;
  update public.lugares set visitado_em = case when p_visitado then now() end where id = p_lugar;
end;
$$;

revoke execute on function public.marcar_visitado(uuid, boolean) from public, anon;
grant execute on function public.marcar_visitado(uuid, boolean) to authenticated;
