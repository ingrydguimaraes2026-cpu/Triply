-- Spec 033: preferências de aviso no celular, por tipo (G4).
--
-- O que esta migration faz:
-- 1. Tabela `preferencias_aviso`: uma linha por pessoa e tipo de aviso que ela DESLIGOU (ou religou).
--    Sem linha = ligado (o padrão é receber tudo).
--    Tipos: 'lembretes' (trajeto e encontro, spec 032), 'fotos' (post e comentário, spec 014),
--    'resumo' (resumo da noite, G6). O boletim do câmbio continua com o liga/desliga próprio (spec 013).
-- 2. RLS: cada um só vê e mexe nas próprias preferências. As funções do servidor leem com service_role.
--
-- Pra desfazer:
--   drop table public.preferencias_aviso;

create table public.preferencias_aviso (
  usuario_id uuid not null default auth.uid() references public.perfis (id) on delete cascade,
  tipo text not null check (tipo in ('lembretes', 'fotos', 'resumo')),
  ligado boolean not null default true,
  atualizado_em timestamptz not null default now(),
  primary key (usuario_id, tipo)
);

alter table public.preferencias_aviso enable row level security;

create policy "cada um vê as próprias preferências" on public.preferencias_aviso
  for select to authenticated using (usuario_id = (select auth.uid()));
create policy "cada um cria as próprias preferências" on public.preferencias_aviso
  for insert to authenticated with check (usuario_id = (select auth.uid()));
create policy "cada um muda as próprias preferências" on public.preferencias_aviso
  for update to authenticated using (usuario_id = (select auth.uid())) with check (usuario_id = (select auth.uid()));
create policy "cada um apaga as próprias preferências" on public.preferencias_aviso
  for delete to authenticated using (usuario_id = (select auth.uid()));

grant select, insert, update, delete on public.preferencias_aviso to authenticated;
