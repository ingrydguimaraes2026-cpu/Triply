-- Imitação mínima do que o Supabase já tem antes das nossas migrations
create role anon nologin;
create role authenticated nologin;
create schema extensions;
create extension pgcrypto schema extensions;

create schema auth;
create table auth.users (id uuid primary key, email text, raw_user_meta_data jsonb not null default '{}', is_anonymous boolean not null default false);
-- Quem está logado (no Supabase vem do token de login)
create function auth.uid() returns uuid language sql stable
as $$ select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
-- Dados do token de login (no Supabase vem do JWT; aqui, só o "is_anonymous" do convidado)
create function auth.jwt() returns jsonb language sql stable
as $$ select jsonb_build_object('is_anonymous', coalesce(nullif(current_setting('request.jwt.claim.is_anonymous', true), ''), 'false')::boolean) $$;

create schema storage;
create table storage.buckets (id text primary key, name text, public boolean, file_size_limit bigint, allowed_mime_types text[]);
create table storage.objects (id uuid primary key default gen_random_uuid(), bucket_id text, name text, owner_id text);
alter table storage.objects enable row level security;
create function storage.foldername(name text) returns text[] language sql immutable
as $$ select (string_to_array(name, '/'))[1:array_length(string_to_array(name, '/'), 1) - 1] $$;

grant usage on schema public, auth, extensions, storage to anon, authenticated;
grant execute on function auth.uid(), auth.jwt() to anon, authenticated;
-- Igual ao Supabase: tudo que for criado em "public" já nasce liberado pra anon/authenticated
-- (as regras RLS e os "revoke" das migrations é que restringem)
alter default privileges in schema public grant all on tables to anon, authenticated;
alter default privileges in schema public grant all on functions to anon, authenticated;
alter default privileges in schema public grant all on sequences to anon, authenticated;

-- Função que o Supabase cria sozinho em todo projeto (a migration "ajustes_seguranca" mexe nela)
create function public.rls_auto_enable() returns void language sql as $$ select $$;
