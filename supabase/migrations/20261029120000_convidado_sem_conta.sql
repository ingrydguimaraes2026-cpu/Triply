-- Spec 018: convidado sem conta.
--
-- O convidado entra pelo link só com o nome, usando o login anônimo do Supabase
-- (precisa ligar "Allow anonymous sign-ins" no painel). Ele vira um auth.users com
-- is_anonymous = true e um perfil normal (o trigger criar_perfil já cuida disso).
--
-- O que esta migration faz:
-- 1. ver_convite(codigo): prévia da viagem pra quem ainda não está no comboio
--    (até sem login). Devolve só nome, datas, destinos e primeiros nomes.
-- 2. aceitar_convite(codigo, nome): igual à de antes, mas grava o nome do convidado
--    quando o perfil ainda não tem nome.
-- 3. Convidado não vira ADM (erro TR_CONVIDADO_ADM).
-- 4. Convidado não cria viagem.
-- 5. convidados_da_viagem(viagem): quem do comboio ainda está sem conta (selo na tela).
--
-- Pra desfazer:
--   drop function public.ver_convite(text);
--   drop function public.aceitar_convite(text, text);  (e recriar a versão de 20261010120000)
--   drop trigger convidado_nao_vira_adm on public.comboio_membros;
--   drop function privado.conferir_convidado_nao_vira_adm();
--   drop policy "viagens: criar" on public.viagens;  (e recriar a versão de 20261010120000)
--   drop function public.convidados_da_viagem(uuid);

-- 1. Prévia do convite -------------------------------------------------------
create function public.ver_convite(p_codigo text)
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
    'ja_sou_membro', exists (
      select 1 from public.comboio_membros m
      where m.viagem_id = v.id and m.usuario_id = (select auth.uid())
    )
  )
  from public.convites c
  join public.viagens v on v.id = c.viagem_id
  where c.codigo = p_codigo and c.expira_em > now();
$$;

revoke execute on function public.ver_convite(text) from public;
grant execute on function public.ver_convite(text) to anon, authenticated;

-- 2. Aceitar convite com nome -------------------------------------------------
drop function public.aceitar_convite(text);

create function public.aceitar_convite(p_codigo text, p_nome text default null)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_viagem uuid;
  v_nome text := nullif(left(trim(coalesce(p_nome, '')), 40), '');
begin
  if (select auth.uid()) is null then
    raise exception 'Faça login antes de aceitar o convite';
  end if;

  select viagem_id into v_viagem
  from public.convites
  where codigo = p_codigo and expira_em > now();

  if v_viagem is null then
    raise exception 'Convite inválido ou expirado';
  end if;

  -- Convidado anônimo chega sem nome: usa o que ele digitou
  if v_nome is not null then
    update public.perfis
    set nome = v_nome
    where id = (select auth.uid()) and (nome is null or nome = '');
  end if;

  insert into public.comboio_membros (viagem_id, usuario_id, papel)
  values (v_viagem, (select auth.uid()), 'membro')
  on conflict do nothing;

  return v_viagem;
end;
$$;

revoke execute on function public.aceitar_convite(text, text) from public, anon;
grant execute on function public.aceitar_convite(text, text) to authenticated;

-- 3. Convidado não vira ADM ---------------------------------------------------
create function privado.conferir_convidado_nao_vira_adm()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.papel = 'adm' and exists (
    select 1 from auth.users u where u.id = new.usuario_id and u.is_anonymous
  ) then
    raise exception 'Convidado precisa criar conta antes de virar ADM' using errcode = 'P0001', hint = 'TR_CONVIDADO_ADM';
  end if;
  return new;
end;
$$;

revoke execute on function privado.conferir_convidado_nao_vira_adm() from public, anon, authenticated;

create trigger convidado_nao_vira_adm
before insert or update of papel on public.comboio_membros
for each row execute function privado.conferir_convidado_nao_vira_adm();

-- 4. Convidado não cria viagem ------------------------------------------------
drop policy "viagens: criar" on public.viagens;
create policy "viagens: criar" on public.viagens for insert to authenticated
with check (
  criado_por = (select auth.uid())
  and not coalesce(((select auth.jwt()) ->> 'is_anonymous')::boolean, false)
);

-- 5. Quem é convidado no meu comboio -----------------------------------------
-- auth.users não é visível pelo app; esta função conta só pra quem é do comboio.
create function public.convidados_da_viagem(p_viagem uuid)
returns setof uuid
language sql
stable
security definer
set search_path = ''
as $$
  select m.usuario_id
  from public.comboio_membros m
  join auth.users u on u.id = m.usuario_id
  where m.viagem_id = p_viagem
    and u.is_anonymous
    and privado.e_membro(p_viagem);
$$;

revoke execute on function public.convidados_da_viagem(uuid) from public, anon;
grant execute on function public.convidados_da_viagem(uuid) to authenticated;
