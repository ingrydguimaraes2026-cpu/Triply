-- Spec 029: agenda do dia (o que acontece em cada dia, com horário).
--
-- O que esta migration faz:
-- 1. Tabela `eventos_agenda`: um compromisso livre num dia da viagem ("jantar no Le Safari às 20h").
--    Trajetos, chegadas e lugares já aparecem na agenda sozinhos; aqui fica só o que não é nenhum deles.
-- 2. Gatilho: viagem e autor não mudam depois.
--
-- Quem pode:
-- - todo mundo do comboio vê e cria eventos;
-- - quem criou ou o ADM edita e apaga.
-- (Garantido por RLS, não só pela tela.)
--
-- Pra desfazer:
--   drop table public.eventos_agenda;
--   drop function privado.conferir_evento_agenda();

create table public.eventos_agenda (
  id uuid primary key default gen_random_uuid(),
  viagem_id uuid not null references public.viagens (id) on delete cascade,
  dia date not null,
  hora time,
  titulo text not null check (char_length(trim(titulo)) between 1 and 120),
  local text check (char_length(local) <= 200),
  observacao text check (char_length(observacao) <= 500),
  criado_por uuid not null default auth.uid() references public.perfis (id) on delete cascade,
  criado_em timestamptz not null default now()
);

create index on public.eventos_agenda (viagem_id, dia);
create index on public.eventos_agenda (criado_por);

-- Gatilho: viagem e autor não mudam
create function privado.conferir_evento_agenda()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if new.viagem_id <> old.viagem_id or new.criado_por <> old.criado_por then
    raise exception 'Não dá pra mudar a viagem nem o autor do evento' using errcode = '42501';
  end if;
  return new;
end;
$$;

revoke execute on function privado.conferir_evento_agenda() from public, anon, authenticated;

create trigger conferir_evento_agenda
before update on public.eventos_agenda
for each row execute function privado.conferir_evento_agenda();

alter table public.eventos_agenda enable row level security;

create policy "eventos_agenda: ver (comboio)" on public.eventos_agenda for select to authenticated
using (privado.e_membro(viagem_id));

create policy "eventos_agenda: criar (comboio)" on public.eventos_agenda for insert to authenticated
with check (criado_por = (select auth.uid()) and privado.e_membro(viagem_id));

create policy "eventos_agenda: editar (autor ou ADM)" on public.eventos_agenda for update to authenticated
using (criado_por = (select auth.uid()) or privado.e_adm(viagem_id))
with check (privado.e_membro(viagem_id));

create policy "eventos_agenda: apagar (autor ou ADM)" on public.eventos_agenda for delete to authenticated
using (criado_por = (select auth.uid()) or privado.e_adm(viagem_id));
