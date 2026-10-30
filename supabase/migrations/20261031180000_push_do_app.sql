-- Spec 110: avisos no app nativo (Expo). O site usa Web Push (`push_inscricoes`, spec 013);
-- o app do celular recebe pelo serviço de push do Expo, que identifica o aparelho por um token
-- ("ExponentPushToken[...]"). Esta migration guarda esses tokens.
--
-- 1. `push_expo`: os aparelhos com o app que aceitaram receber notificação.
-- 2. `registrar_push_expo`: grava o token pra quem está logado (se o aparelho era de outra conta, passa pra esta).
--
-- Quem lê os tokens pra mandar o aviso é só o servidor (funções com a chave de serviço).
-- Excluir a conta apaga os tokens junto (cascade em `perfis`).
--
-- Pra desfazer:
--   drop function public.registrar_push_expo(text, text);
--   drop table public.push_expo;

create table public.push_expo (
  id uuid primary key default gen_random_uuid(),
  usuario_id uuid not null default auth.uid() references public.perfis (id) on delete cascade,
  token text not null unique check (token ~ '^Expo(nent)?PushToken\[.+\]$' and char_length(token) <= 200),
  plataforma text not null check (plataforma in ('ios', 'android')),
  criado_em timestamptz not null default now()
);

create index on public.push_expo (usuario_id);

alter table public.push_expo enable row level security;

create policy "push app: ver os meus" on public.push_expo for select to authenticated
using (usuario_id = (select auth.uid()));

create policy "push app: apagar os meus" on public.push_expo for delete to authenticated
using (usuario_id = (select auth.uid()));

-- Inserir só pela função abaixo (ela resolve o caso do aparelho que era de outra conta)
create function public.registrar_push_expo(p_token text, p_plataforma text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_eu uuid := (select auth.uid());
begin
  if v_eu is null then
    raise exception 'Faça login pra ativar os avisos' using errcode = '42501';
  end if;
  insert into public.push_expo (usuario_id, token, plataforma)
  values (v_eu, p_token, p_plataforma)
  on conflict (token) do update
    set usuario_id = excluded.usuario_id, plataforma = excluded.plataforma, criado_em = now();
end;
$$;

revoke execute on function public.registrar_push_expo(text, text) from public, anon;
grant execute on function public.registrar_push_expo(text, text) to authenticated;
