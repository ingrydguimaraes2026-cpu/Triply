-- Spec 100 (K9): marcar pessoas nos posts ("com Ingryd e Victor").
--
-- O que muda:
-- - Tabela `post_marcacoes` (post, pessoa marcada, quem marcou).
-- - Só dá pra marcar quem é do comboio da viagem do post (gatilho confere).
--
-- Quem pode:
-- - ver: o comboio da viagem;
-- - marcar: quem é do comboio;
-- - tirar: o autor do post, quem marcou ou a própria pessoa marcada.
--
-- Pra desfazer:
--   drop table public.post_marcacoes;
--   drop function privado.conferir_marcacao();

create table public.post_marcacoes (
  post_id uuid not null references public.posts (id) on delete cascade,
  usuario_id uuid not null references public.perfis (id) on delete cascade,
  marcado_por uuid not null default auth.uid() references public.perfis (id) on delete cascade,
  criado_em timestamptz not null default now(),
  primary key (post_id, usuario_id)
);

create index on public.post_marcacoes (usuario_id);
create index on public.post_marcacoes (marcado_por);

alter table public.post_marcacoes enable row level security;

create policy "marcações: comboio vê" on public.post_marcacoes for select to authenticated
using (exists (select 1 from public.posts p where p.id = post_id and privado.e_membro(p.viagem_id)));

create policy "marcações: comboio marca" on public.post_marcacoes for insert to authenticated
with check (
  marcado_por = (select auth.uid())
  and exists (select 1 from public.posts p where p.id = post_id and privado.e_membro(p.viagem_id))
);

create policy "marcações: autor, quem marcou ou o marcado tira" on public.post_marcacoes for delete to authenticated
using (
  usuario_id = (select auth.uid())
  or marcado_por = (select auth.uid())
  or exists (select 1 from public.posts p where p.id = post_id and p.autor = (select auth.uid()))
);

-- Só marca quem é do comboio da viagem do post
create function privado.conferir_marcacao()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not exists (
    select 1 from public.posts p
    join public.comboio_membros m on m.viagem_id = p.viagem_id and m.usuario_id = new.usuario_id
    where p.id = new.post_id
  ) then
    raise exception 'Só dá pra marcar quem está no comboio.' using errcode = '23514';
  end if;
  return new;
end;
$$;

revoke execute on function privado.conferir_marcacao() from public, anon, authenticated;

create trigger conferir_marcacao before insert on public.post_marcacoes
for each row execute function privado.conferir_marcacao();
