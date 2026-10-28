-- Spec 015 (ajuste): a conexão do Gmail sai do schema `privado` e vai pro `public`, mas com
-- RLS que NÃO dá nenhuma política pro cliente. Assim:
-- - o navegador (anon/authenticated) não lê nem escreve a tabela (RLS sem política = nega tudo);
-- - a Edge Function (service role) ignora o RLS e acessa normal;
-- - o cliente vê só o status (sem token) pela função `minha_conexao_gmail()`.
-- Motivo da mudança: o schema `privado` não é exposto pela API nem pro service role, então a
-- Edge Function não conseguiria lê-lo sem funções-ponte. No `public` com RLS fechada fica simples e seguro.
--
-- Pra desfazer: recriar em `privado` (ver migrations 20261019120000 e 20261019130000).

drop function public.minha_conexao_gmail();
drop table privado.gmail_contas;

create table public.gmail_contas (
  usuario_id uuid primary key references public.perfis (id) on delete cascade,
  email text not null,
  refresh_token text,
  expira_em timestamptz,
  ultimo_sync timestamptz,
  status text not null default 'ativo' check (status in ('ativo', 'expirado', 'erro')),
  erro text,
  criado_em timestamptz not null default now()
);

alter table public.gmail_contas enable row level security;
-- De propósito SEM políticas pra anon/authenticated: o cliente não toca nesta tabela.
revoke all on public.gmail_contas from anon, authenticated;

-- O cliente lê só o próprio status (sem o token) por aqui.
create function public.minha_conexao_gmail()
returns table (email text, status text, expira_em timestamptz, ultimo_sync timestamptz)
language sql
security definer
set search_path = ''
as $$
  select g.email, g.status, g.expira_em, g.ultimo_sync
  from public.gmail_contas g
  where g.usuario_id = (select auth.uid());
$$;

revoke execute on function public.minha_conexao_gmail() from public, anon;
grant execute on function public.minha_conexao_gmail() to authenticated;
