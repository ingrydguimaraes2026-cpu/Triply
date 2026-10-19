-- Spec 013: aviso no celular quando o câmbio bate a meta.
--
-- O que esta migration faz:
-- 1. `metas_cambio`: a meta de compra de cada pessoa por viagem e moeda ("1 EUR até R$ 5,85 com IOF").
--    `abaixo` guarda o que a última checagem viu, pra avisar UMA vez quando cruza a meta (e não a cada 30 min).
-- 2. `push_inscricoes`: os aparelhos que aceitaram receber notificação (endereço do Web Push + chaves públicas do aparelho).
-- 3. `registrar_push`: grava a inscrição do aparelho pra quem está logado (se o aparelho era de outra conta, passa pra esta).
-- O agendamento da checagem (a cada 30 min) fica num passo separado, que o Victor liga quando quiser.
--
-- Quem pode: cada pessoa só vê e mexe na própria meta e nas próprias inscrições.
-- A função `avisos-cambio` lê tudo com a chave de serviço (fica só no servidor).
--
-- Pra desfazer:
--   drop function public.registrar_push(text, text, text);
--   drop table public.push_inscricoes;
--   drop table public.metas_cambio;

create table public.metas_cambio (
  usuario_id uuid not null default auth.uid() references public.perfis (id) on delete cascade,
  viagem_id uuid not null references public.viagens (id) on delete cascade,
  moeda char(3) not null check (moeda ~ '^[A-Z]{3}$' and moeda <> 'BRL'),
  meta numeric(10, 4) not null check (meta > 0 and meta < 1000),
  avisar boolean not null default true,
  abaixo boolean not null default false,
  avisado_em timestamptz,
  atualizado_em timestamptz not null default now(),
  primary key (usuario_id, viagem_id, moeda)
);

create index on public.metas_cambio (viagem_id);

alter table public.metas_cambio enable row level security;

create policy "metas: ver a minha" on public.metas_cambio for select to authenticated
using (usuario_id = (select auth.uid()));

create policy "metas: criar a minha" on public.metas_cambio for insert to authenticated
with check (usuario_id = (select auth.uid()) and privado.e_membro(viagem_id));

create policy "metas: mudar a minha" on public.metas_cambio for update to authenticated
using (usuario_id = (select auth.uid()))
with check (usuario_id = (select auth.uid()) and privado.e_membro(viagem_id));

create policy "metas: apagar a minha" on public.metas_cambio for delete to authenticated
using (usuario_id = (select auth.uid()));

create table public.push_inscricoes (
  id uuid primary key default gen_random_uuid(),
  usuario_id uuid not null default auth.uid() references public.perfis (id) on delete cascade,
  endpoint text not null unique check (endpoint ~ '^https://' and char_length(endpoint) <= 2000),
  p256dh text not null check (char_length(p256dh) between 1 and 200),
  auth text not null check (char_length(auth) between 1 and 100),
  criado_em timestamptz not null default now()
);

create index on public.push_inscricoes (usuario_id);

alter table public.push_inscricoes enable row level security;

create policy "push: ver as minhas" on public.push_inscricoes for select to authenticated
using (usuario_id = (select auth.uid()));

create policy "push: apagar as minhas" on public.push_inscricoes for delete to authenticated
using (usuario_id = (select auth.uid()));

-- Inserir só pela função abaixo (ela resolve o caso do aparelho que era de outra conta)
create function public.registrar_push(p_endpoint text, p_p256dh text, p_auth text)
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
  insert into public.push_inscricoes (usuario_id, endpoint, p256dh, auth)
  values (v_eu, p_endpoint, p_p256dh, p_auth)
  on conflict (endpoint) do update
    set usuario_id = excluded.usuario_id, p256dh = excluded.p256dh, auth = excluded.auth, criado_em = now();
end;
$$;

revoke execute on function public.registrar_push(text, text, text) from public, anon;
grant execute on function public.registrar_push(text, text, text) to authenticated;
