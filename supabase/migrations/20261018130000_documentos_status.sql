-- Spec 010: documentos de entrada.
--
-- O que esta migration faz: cria a tabela `documentos_status`, onde cada pessoa marca
-- o que já resolveu do checklist da viagem (ex.: "passaporte: resolvido").
-- As regras do checklist ficam no código (src/features/documentos/regras.ts), não no banco.
-- Não guarda número de documento nem foto: só a chave do item e o status.
--
-- Quem pode:
-- - todo mundo do comboio vê o status de todos da viagem;
-- - cada um só cria e muda o próprio status (desmarcar = voltar pra 'pendente').
--
-- Pra desfazer:
--   drop table public.documentos_status;

create table public.documentos_status (
  viagem_id uuid not null references public.viagens (id) on delete cascade,
  usuario_id uuid not null references public.perfis (id) on delete cascade,
  item text not null check (char_length(item) between 1 and 60),
  status text not null default 'pendente' check (status in ('pendente', 'resolvido', 'nao_preciso')),
  atualizado_em timestamptz not null default now(),
  primary key (viagem_id, usuario_id, item)
);

create index on public.documentos_status (usuario_id);

alter table public.documentos_status enable row level security;

create policy "documentos: ver (comboio)" on public.documentos_status for select to authenticated
using (privado.e_membro(viagem_id));

create policy "documentos: marcar o meu" on public.documentos_status for insert to authenticated
with check (usuario_id = (select auth.uid()) and privado.e_membro(viagem_id));

create policy "documentos: mudar o meu" on public.documentos_status for update to authenticated
using (usuario_id = (select auth.uid()))
with check (usuario_id = (select auth.uid()) and privado.e_membro(viagem_id));
