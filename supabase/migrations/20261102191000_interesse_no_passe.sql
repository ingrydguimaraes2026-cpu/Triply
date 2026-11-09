-- Passe da viagem (spec 117, parte 7): a tela existe, mas ainda não cobra.
-- O botão mostra "Em breve" e grava aqui quem tocou e de onde veio, pra medir o interesse
-- antes da cobrança de verdade (spec 118).
--
-- Pra desfazer:
--   drop table public.interesse_no_passe;

create table public.interesse_no_passe (
  id uuid primary key default gen_random_uuid(),
  viagem_id uuid not null references public.viagens (id) on delete cascade,
  usuario_id uuid not null default auth.uid() references public.perfis (id) on delete cascade,
  -- De qual extra com cadeado a pessoa veio
  origem text not null check (origem in ('scan_recibo', 'mapa_offline', 'reservas_email', 'livro_pdf', 'livro_impresso', 'video', 'album', 'outro')),
  -- 'viu' = abriu a tela do Passe; 'quis' = tocou no botão de comprar
  acao text not null default 'viu' check (acao in ('viu', 'quis')),
  criado_em timestamptz not null default now()
);

create index on public.interesse_no_passe (viagem_id);
create index on public.interesse_no_passe (usuario_id);

alter table public.interesse_no_passe enable row level security;

-- Quem é do comboio registra o próprio interesse; ninguém do app lê o dos outros (a conta é feita no painel)
create policy "passe: registrar o meu interesse" on public.interesse_no_passe for insert to authenticated
  with check (usuario_id = (select auth.uid()) and privado.e_membro(viagem_id));
create policy "passe: ver o meu interesse" on public.interesse_no_passe for select to authenticated
  using (usuario_id = (select auth.uid()));
