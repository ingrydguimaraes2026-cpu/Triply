-- Spec 014: feed de fotos do comboio (estilo Instagram).
--
-- O que esta migration faz:
-- 1. Tabela `posts`: cada post tem de 1 a 10 fotos, lugar e legenda opcionais.
-- 2. `fotos` ganha `post_id` e `ordem`. Cada foto antiga vira um post de 1 foto (o post fica com o mesmo id da foto).
-- 3. Sai o limite de 5 fotos por lugar (spec 005). Entra o limite de 10 fotos por post (erro TR_LIMITE_POST).
-- 4. Tabela `curtidas`: um coração por pessoa em cada post.
-- 5. Tabela `comentarios`: comentários nos posts.
--
-- Quem pode:
-- - só quem está no comboio vê posts, fotos, curtidas e comentários, e posta, curte e comenta;
-- - apaga o post: quem postou ou o ADM;
-- - apaga o comentário: quem comentou, quem postou ou o ADM;
-- - cada um só dá e tira a própria curtida.
--
-- Pra desfazer (as fotos postadas em carrossel ficam sem post):
--   drop table public.comentarios;
--   drop table public.curtidas;
--   drop trigger limite_fotos_por_post on public.fotos;
--   drop function privado.conferir_fotos_do_post();
--   alter table public.fotos drop column ordem, drop column post_id;
--   drop table public.posts;
--   drop function privado.conferir_post();
--   (e rodar de novo a 20261018120300_limite_fotos.sql, se quiser o limite de volta)

-- ---------- 1. Posts ----------
create table public.posts (
  id uuid primary key default gen_random_uuid(),
  viagem_id uuid not null references public.viagens (id) on delete cascade,
  destino_id uuid references public.destinos (id) on delete set null,
  autor uuid not null default auth.uid() references public.perfis (id),
  legenda text check (legenda is null or char_length(legenda) <= 2200),
  criado_em timestamptz not null default now()
);

create index on public.posts (viagem_id, criado_em desc);
create index on public.posts (destino_id);
create index on public.posts (autor);

-- Gatilho: o lugar tem que ser da mesma viagem; viagem e autor não mudam
create function privado.conferir_post()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if new.destino_id is not null and not exists (
    select 1 from public.destinos d where d.id = new.destino_id and d.viagem_id = new.viagem_id
  ) then
    raise exception 'Esse lugar não é desta viagem' using errcode = 'TR422';
  end if;
  if tg_op = 'UPDATE' and (new.viagem_id <> old.viagem_id or new.autor <> old.autor) then
    raise exception 'Não dá pra mudar a viagem nem o autor do post' using errcode = '42501';
  end if;
  return new;
end;
$$;

revoke execute on function privado.conferir_post() from public, anon, authenticated;

create trigger conferir_post
before insert or update on public.posts
for each row execute function privado.conferir_post();

alter table public.posts enable row level security;

create policy "posts: ver (comboio)" on public.posts for select to authenticated
using (privado.e_membro(viagem_id));

create policy "posts: postar (comboio)" on public.posts for insert to authenticated
with check (autor = (select auth.uid()) and privado.e_membro(viagem_id));

create policy "posts: editar a legenda (autor)" on public.posts for update to authenticated
using (autor = (select auth.uid()))
with check (privado.e_membro(viagem_id));

create policy "posts: apagar (autor ou ADM)" on public.posts for delete to authenticated
using (autor = (select auth.uid()) or privado.e_adm(viagem_id));

-- ---------- 2. Fotos dentro do post ----------
alter table public.fotos
  add column post_id uuid references public.posts (id) on delete cascade,
  add column ordem smallint not null default 0 check (ordem between 0 and 9);

-- Cada foto antiga vira um post de 1 foto (mesmo id, mesmo autor, mesma data)
insert into public.posts (id, viagem_id, destino_id, autor, legenda, criado_em)
select f.id, f.viagem_id, f.destino_id, f.enviada_por, f.legenda, f.criado_em
from public.fotos f;

update public.fotos set post_id = id where post_id is null;

alter table public.fotos alter column post_id set not null;

create index on public.fotos (post_id, ordem);

-- Agora a foto só entra num post da mesma viagem, postado por quem está enviando
drop policy "fotos: enviar" on public.fotos;
create policy "fotos: enviar" on public.fotos for insert to authenticated
with check (
  privado.e_membro(viagem_id)
  and enviada_por = (select auth.uid())
  and split_part(caminho, '/', 1) = viagem_id::text
  and exists (
    select 1 from public.posts p
    where p.id = post_id and p.viagem_id = fotos.viagem_id and p.autor = (select auth.uid())
  )
);

-- ---------- 3. Limites ----------
-- Sai: 5 fotos por lugar
drop trigger limite_fotos_por_destino on public.fotos;
drop function privado.conferir_limite_fotos();

-- Entra: 10 fotos por post
create function privado.conferir_fotos_do_post()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if (select count(*) from public.fotos where post_id = new.post_id and id <> new.id) >= 10 then
    raise exception 'Um post tem no máximo 10 fotos' using errcode = 'P0001', hint = 'TR_LIMITE_POST';
  end if;
  return new;
end;
$$;

revoke execute on function privado.conferir_fotos_do_post() from public, anon, authenticated;

create trigger limite_fotos_por_post
before insert or update of post_id on public.fotos
for each row execute function privado.conferir_fotos_do_post();

-- ---------- 4. Curtidas ----------
create table public.curtidas (
  post_id uuid not null references public.posts (id) on delete cascade,
  usuario_id uuid not null default auth.uid() references public.perfis (id) on delete cascade,
  criado_em timestamptz not null default now(),
  primary key (post_id, usuario_id)
);

create index on public.curtidas (usuario_id);

alter table public.curtidas enable row level security;

create policy "curtidas: ver (comboio)" on public.curtidas for select to authenticated
using (exists (select 1 from public.posts p where p.id = post_id and privado.e_membro(p.viagem_id)));

create policy "curtidas: dar a minha" on public.curtidas for insert to authenticated
with check (
  usuario_id = (select auth.uid())
  and exists (select 1 from public.posts p where p.id = post_id and privado.e_membro(p.viagem_id))
);

create policy "curtidas: tirar a minha" on public.curtidas for delete to authenticated
using (usuario_id = (select auth.uid()));

-- ---------- 5. Comentários ----------
create table public.comentarios (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.posts (id) on delete cascade,
  autor uuid not null default auth.uid() references public.perfis (id) on delete cascade,
  texto text not null check (char_length(btrim(texto)) between 1 and 1000),
  criado_em timestamptz not null default now()
);

create index on public.comentarios (post_id, criado_em);
create index on public.comentarios (autor);

alter table public.comentarios enable row level security;

create policy "comentarios: ver (comboio)" on public.comentarios for select to authenticated
using (exists (select 1 from public.posts p where p.id = post_id and privado.e_membro(p.viagem_id)));

create policy "comentarios: comentar (comboio)" on public.comentarios for insert to authenticated
with check (
  autor = (select auth.uid())
  and exists (select 1 from public.posts p where p.id = post_id and privado.e_membro(p.viagem_id))
);

create policy "comentarios: apagar (autor, dono do post ou ADM)" on public.comentarios for delete to authenticated
using (
  autor = (select auth.uid())
  or exists (
    select 1 from public.posts p
    where p.id = post_id and (p.autor = (select auth.uid()) or privado.e_adm(p.viagem_id))
  )
);
