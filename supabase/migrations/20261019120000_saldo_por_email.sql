-- Spec 015: saldo da viagem por e-mail (Wise e Nomad).
--
-- O que esta migration faz:
-- 1. `privado.gmail_contas`: a conexão do Gmail de cada pessoa. Guarda SÓ o id de um
--    segredo do Vault (o refresh token de verdade fica no Vault, criado pela Edge Function).
--    Esta tabela fica no schema `privado`, que não é exposto pela API: o navegador nunca a alcança.
-- 2. `public.carteiras`: a carteira de cada pessoa em cada viagem (saldo inicial + ajuste manual).
-- 3. `public.movimentos_carteira`: cada transação lida do e-mail (entrada ou gasto), com dedup
--    por id do e-mail. Gravada pela Edge Function (service role); a pessoa só lê e apaga as suas.
-- 4. Funções de leitura segura:
--    - `public.minha_conexao_gmail()`: devolve e-mail/status/expiração da MINHA conexão (sem o token).
--    - `public.saldo_euro_do_comboio(viagem)`: soma o saldo de euro de todo o comboio (sem detalhar).
--    - view `public.carteiras_com_saldo`: a carteira com o saldo atual já calculado (RLS do dono).
--
-- Quem pode:
-- - conexão do Gmail: só o dono vê o status; o token não é visível por ninguém via API;
-- - carteira e movimentos: só o dono vê e mexe;
-- - saldo somado do comboio: qualquer membro da viagem vê (só o número total).
--
-- Observação: as 3 Edge Functions (conectar-gmail, ler-carteiras, desconectar-gmail) usam o
-- service role, que ignora o RLS. Por isso aqui não há política de INSERT de movimento pro
-- cliente: quem escreve movimento é sempre o servidor.
--
-- Pra desfazer:
--   drop view public.carteiras_com_saldo;
--   drop function public.saldo_euro_do_comboio(uuid);
--   drop function public.minha_conexao_gmail();
--   drop table public.movimentos_carteira;
--   drop table public.carteiras;
--   drop table privado.gmail_contas;

-- ---------- 1. Conexão do Gmail (fica no schema privado, fora da API) ----------
create table privado.gmail_contas (
  usuario_id uuid primary key references public.perfis (id) on delete cascade,
  email text not null,
  -- id do segredo no Vault onde mora o refresh token (nunca o token em si)
  token_secret_id uuid,
  expira_em timestamptz,          -- quando o Google derruba o acesso (modo Testing = ~7 dias)
  ultimo_sync timestamptz,        -- última vez que a função leu os e-mails
  status text not null default 'ativo' check (status in ('ativo', 'expirado', 'erro')),
  erro text,                      -- última mensagem de erro, pra depurar
  criado_em timestamptz not null default now()
);

-- Ninguém alcança esta tabela pela API. Só o service role (Edge Function) lê e escreve.
revoke all on privado.gmail_contas from public, anon, authenticated;

-- Leitura segura do próprio status (sem token): o cliente chama esta função, não a tabela.
create function public.minha_conexao_gmail()
returns table (email text, status text, expira_em timestamptz, ultimo_sync timestamptz)
language sql
security definer
set search_path = ''
as $$
  select g.email, g.status, g.expira_em, g.ultimo_sync
  from privado.gmail_contas g
  where g.usuario_id = (select auth.uid());
$$;

revoke execute on function public.minha_conexao_gmail() from public, anon;
grant execute on function public.minha_conexao_gmail() to authenticated;

-- ---------- 2. Carteira por pessoa por viagem ----------
create table public.carteiras (
  id uuid primary key default gen_random_uuid(),
  viagem_id uuid not null references public.viagens (id) on delete cascade,
  usuario_id uuid not null default auth.uid() references public.perfis (id) on delete cascade,
  moeda text not null default 'EUR' check (char_length(moeda) = 3),
  saldo_inicial numeric(12, 2) not null default 0,
  ajuste numeric(12, 2) not null default 0,   -- correção manual ("ajustar saldo")
  criado_em timestamptz not null default now(),
  unique (viagem_id, usuario_id)
);

create index on public.carteiras (viagem_id);

alter table public.carteiras enable row level security;

-- Só o dono vê e mexe na própria carteira. O total do comboio sai pela função mais abaixo.
create policy "carteiras: ver a minha" on public.carteiras for select to authenticated
using (usuario_id = (select auth.uid()));

create policy "carteiras: criar a minha" on public.carteiras for insert to authenticated
with check (usuario_id = (select auth.uid()) and privado.e_membro(viagem_id));

create policy "carteiras: editar a minha" on public.carteiras for update to authenticated
using (usuario_id = (select auth.uid()))
with check (usuario_id = (select auth.uid()));

create policy "carteiras: apagar a minha" on public.carteiras for delete to authenticated
using (usuario_id = (select auth.uid()));

-- ---------- 3. Movimentos (lidos do e-mail) ----------
create table public.movimentos_carteira (
  id uuid primary key default gen_random_uuid(),
  carteira_id uuid not null references public.carteiras (id) on delete cascade,
  tipo text not null check (tipo in ('entrada', 'gasto')),
  valor numeric(12, 2) not null check (valor > 0),
  moeda text not null check (char_length(moeda) = 3),
  descricao text check (descricao is null or char_length(descricao) <= 200),
  data timestamptz not null default now(),
  provedor text not null check (provedor in ('wise', 'nomad')),
  gmail_message_id text not null,   -- id do e-mail no Gmail, pra não importar duas vezes
  criado_em timestamptz not null default now(),
  unique (carteira_id, gmail_message_id)
);

create index on public.movimentos_carteira (carteira_id, data desc);

alter table public.movimentos_carteira enable row level security;

-- Quem escreve movimento é o servidor (service role). O cliente só lê e apaga os seus.
create policy "movimentos: ver os meus" on public.movimentos_carteira for select to authenticated
using (exists (
  select 1 from public.carteiras c
  where c.id = carteira_id and c.usuario_id = (select auth.uid())
));

create policy "movimentos: apagar os meus" on public.movimentos_carteira for delete to authenticated
using (exists (
  select 1 from public.carteiras c
  where c.id = carteira_id and c.usuario_id = (select auth.uid())
));

-- ---------- 4. Saldo calculado ----------
-- Saldo atual = saldo inicial + ajuste manual + entradas - gastos.
-- A view roda como o usuário (security_invoker), então o RLS da carteira já filtra pra "a minha".
create view public.carteiras_com_saldo
with (security_invoker = on) as
select
  c.*,
  c.saldo_inicial + c.ajuste
    + coalesce((
        select sum(case when m.tipo = 'entrada' then m.valor else -m.valor end)
        from public.movimentos_carteira m
        where m.carteira_id = c.id and m.moeda = c.moeda
      ), 0) as saldo_atual
from public.carteiras c;

-- Total de euro do comboio inteiro numa viagem: qualquer membro vê, mas só o número somado.
create function public.saldo_euro_do_comboio(p_viagem_id uuid)
returns numeric
language sql
security definer
set search_path = ''
as $$
  select coalesce(sum(
    c.saldo_inicial + c.ajuste
    + coalesce((
        select sum(case when m.tipo = 'entrada' then m.valor else -m.valor end)
        from public.movimentos_carteira m
        where m.carteira_id = c.id and m.moeda = c.moeda
      ), 0)
  ), 0)
  from public.carteiras c
  where c.viagem_id = p_viagem_id
    and c.moeda = 'EUR'
    -- só responde se quem pergunta é do comboio desta viagem
    and privado.e_membro(p_viagem_id);
$$;

revoke execute on function public.saldo_euro_do_comboio(uuid) from public, anon;
grant execute on function public.saldo_euro_do_comboio(uuid) to authenticated;
