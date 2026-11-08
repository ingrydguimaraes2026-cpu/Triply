-- Spec 118f: viagens antigas e rolê em 2 toques (FILA 0.9).
-- O que muda, em português simples:
-- 1. `viagens.tipo`: marca se é uma viagem normal, um rolê (1 dia, criado na hora) ou uma
--    viagem antiga ("a gente já foi pra..."). As que já existem ficam como 'viagem'.
--    Serve pro mapa da galera contar rolês à parte e não inventar "dias juntos" de viagem antiga.
-- 2. `destinos.tipo_do_lugar`: dica pra arte do carimbo (praia, show...). Vazio = a arte
--    adivinha pelo nome, como antes. O rolê de show usa isso.
-- 3. `minha_galera()`: lista quem já dividiu pelo menos uma viagem comigo (sem convidado anônimo),
--    pra chamar na viagem antiga sem precisar de link.
-- 4. `trazer_da_galera(viagem, pessoas)`: o ADM põe na viagem pessoas da galera dele.
--    Quem não divide viagem nenhuma com ele é ignorado (não dá pra pôr desconhecido).
--
-- Pra desfazer:
--   drop function public.trazer_da_galera(uuid, uuid[]);
--   drop function public.minha_galera();
--   alter table public.destinos drop column tipo_do_lugar;
--   alter table public.viagens drop column tipo;

alter table public.viagens
  add column tipo text not null default 'viagem' check (tipo in ('viagem', 'role', 'antiga'));

alter table public.destinos
  add column tipo_do_lugar text check (tipo_do_lugar is null or tipo_do_lugar in ('cidade', 'praia', 'serra', 'show', 'festa'));

-- Quem já dividiu viagem comigo, de quem mais dividiu pra quem menos
create function public.minha_galera()
returns table (id uuid, nome text, avatar_url text, viagens_juntos int)
language sql
stable
security definer
set search_path = ''
as $$
  select p.id, p.nome, p.avatar_url, count(distinct eles.viagem_id)::int
  from public.comboio_membros eu
  join public.comboio_membros eles on eles.viagem_id = eu.viagem_id and eles.usuario_id <> eu.usuario_id
  join public.perfis p on p.id = eles.usuario_id
  join auth.users u on u.id = p.id and not coalesce(u.is_anonymous, false)
  where eu.usuario_id = (select auth.uid())
  group by p.id, p.nome, p.avatar_url
  order by 4 desc, p.nome;
$$;

revoke execute on function public.minha_galera() from public, anon;
grant execute on function public.minha_galera() to authenticated;

create function public.trazer_da_galera(p_viagem uuid, p_pessoas uuid[])
returns int
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_quantos int;
begin
  if not exists (select 1 from public.comboio_membros where viagem_id = p_viagem and usuario_id = (select auth.uid()) and papel = 'adm') then
    raise exception 'Só o ADM da viagem chama a galera' using errcode = '42501';
  end if;
  insert into public.comboio_membros (viagem_id, usuario_id, papel)
  select distinct p_viagem, eles.usuario_id, 'membro'
  from public.comboio_membros eu
  join public.comboio_membros eles on eles.viagem_id = eu.viagem_id
  where eu.usuario_id = (select auth.uid())
    and eles.usuario_id = any (p_pessoas)
    and eles.usuario_id <> (select auth.uid())
  on conflict do nothing;
  get diagnostics v_quantos = row_count;
  return v_quantos;
end;
$$;

revoke execute on function public.trazer_da_galera(uuid, uuid[]) from public, anon;
grant execute on function public.trazer_da_galera(uuid, uuid[]) to authenticated;
