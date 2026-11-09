-- Spec 042: resumo da noite (G6). Push por volta das 21h (hora do destino) com o que acontece amanhã.
--
-- O que esta migration faz:
-- 1. Tabela `resumos_enviados` (viagem + dia): garante um resumo por viagem por noite, mesmo que a
--    função rode de hora em hora. Sem policies: o app não lê; só o servidor (service_role).
-- 2. Função `marcar_resumo(viagem, dia)`: grava e diz se é a primeira vez (true = pode mandar).
--
-- O agendamento (pg_cron chamando a função "resumo-da-noite" de hora em hora) fica fora da migration:
-- ver docs/specs/042-resumo-da-noite.md.
--
-- Pra desfazer:
--   drop function public.marcar_resumo(uuid, date);
--   drop table public.resumos_enviados;

create table public.resumos_enviados (
  viagem_id uuid not null references public.viagens (id) on delete cascade,
  dia date not null,
  enviado_em timestamptz not null default now(),
  primary key (viagem_id, dia)
);

alter table public.resumos_enviados enable row level security;

create function public.marcar_resumo(p_viagem uuid, p_dia date)
returns boolean
language sql
security definer
set search_path = ''
as $$
  with novo as (
    insert into public.resumos_enviados (viagem_id, dia) values (p_viagem, p_dia)
    on conflict do nothing
    returning 1
  )
  select exists (select 1 from novo);
$$;

revoke execute on function public.marcar_resumo(uuid, date) from public, anon, authenticated;
