-- Spec 007: gestão do comboio.
--
-- O que esta migration faz:
-- 1. A viagem nunca fica sem ADM: o banco recusa remover ou rebaixar o último ADM
--    (erro TR_ULTIMO_ADM). Apagar a viagem inteira continua funcionando.
-- 2. Quem saiu do comboio continua aparecendo com o nome nos gastos e fotos antigos:
--    a regra de "ver perfis" passa a incluir quem tem gasto, divisão ou foto numa viagem minha.
--
-- Pra desfazer:
--   drop trigger sempre_um_adm on public.comboio_membros;
--   drop function privado.conferir_sempre_um_adm();
--   drop policy "perfis: ver" on public.perfis;  (e recriar a versão de 20261010120000)
--   drop function privado.aparece_pra_mim(uuid);

create function privado.conferir_sempre_um_adm()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  -- Se a viagem está sendo apagada (cascata), ela já não existe aqui: deixa passar
  if not exists (select 1 from public.viagens where id = old.viagem_id) then
    return null;
  end if;
  if not exists (select 1 from public.comboio_membros where viagem_id = old.viagem_id and papel = 'adm') then
    raise exception 'A viagem precisa de pelo menos um ADM' using errcode = 'P0001', hint = 'TR_ULTIMO_ADM';
  end if;
  return null;
end;
$$;

revoke execute on function privado.conferir_sempre_um_adm() from public, anon, authenticated;

create constraint trigger sempre_um_adm
after update of papel or delete on public.comboio_membros
for each row execute function privado.conferir_sempre_um_adm();

-- Perfis que eu posso ver: o meu, o de quem viaja comigo e o de quem já viajou
-- (deixou gasto, divisão ou foto numa viagem em que eu estou)
create function privado.aparece_pra_mim(p_perfil uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select p_perfil = (select auth.uid())
    or exists (
      select 1 from public.comboio_membros eu
      join public.comboio_membros outro on outro.viagem_id = eu.viagem_id
      where eu.usuario_id = (select auth.uid()) and outro.usuario_id = p_perfil
    )
    or exists (
      select 1 from public.gastos g
      join public.comboio_membros eu on eu.viagem_id = g.viagem_id and eu.usuario_id = (select auth.uid())
      where g.pago_por = p_perfil or g.criado_por = p_perfil
    )
    or exists (
      select 1 from public.gasto_divisoes d
      join public.gastos g on g.id = d.gasto_id
      join public.comboio_membros eu on eu.viagem_id = g.viagem_id and eu.usuario_id = (select auth.uid())
      where d.usuario_id = p_perfil
    )
    or exists (
      select 1 from public.fotos f
      join public.comboio_membros eu on eu.viagem_id = f.viagem_id and eu.usuario_id = (select auth.uid())
      where f.enviada_por = p_perfil
    );
$$;

revoke execute on function privado.aparece_pra_mim(uuid) from public, anon;
grant execute on function privado.aparece_pra_mim(uuid) to authenticated;

drop policy "perfis: ver" on public.perfis;
create policy "perfis: ver" on public.perfis for select to authenticated
using (privado.aparece_pra_mim(id));
