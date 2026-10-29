-- Spec 020: tarefas com responsável ("quem compra o seguro?", com dono e prazo).
--
-- O que esta migration faz:
-- 1. Tabela `tarefas`: um item de checklist da viagem, com responsável e prazo opcionais.
-- 2. Gatilho: viagem e autor não mudam; o responsável, se houver, tem que ser do comboio.
--
-- Quem pode:
-- - todo mundo do comboio vê e cria tarefas;
-- - quem criou, o responsável ou o ADM marcam como feita e editam;
-- - quem criou ou o ADM apaga.
-- (Garantido por RLS, não só pela tela.)
--
-- Pra desfazer:
--   drop table public.tarefas;
--   drop function privado.conferir_tarefa();

create table public.tarefas (
  id uuid primary key default gen_random_uuid(),
  viagem_id uuid not null references public.viagens (id) on delete cascade,
  titulo text not null check (char_length(trim(titulo)) between 1 and 200),
  responsavel_id uuid references public.perfis (id) on delete set null,
  prazo date,
  feita boolean not null default false,
  criado_por uuid not null default auth.uid() references public.perfis (id) on delete cascade,
  criado_em timestamptz not null default now()
);

create index on public.tarefas (viagem_id);
create index on public.tarefas (responsavel_id);
create index on public.tarefas (criado_por);

-- Gatilho: viagem e autor não mudam; o responsável tem que ser alguém do comboio.
create function privado.conferir_tarefa()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if tg_op = 'UPDATE' then
    if new.viagem_id <> old.viagem_id or new.criado_por <> old.criado_por then
      raise exception 'Não dá pra mudar a viagem nem o autor da tarefa' using errcode = '42501';
    end if;
  end if;

  if new.responsavel_id is not null and not exists (
    select 1 from public.comboio_membros m
    where m.viagem_id = new.viagem_id and m.usuario_id = new.responsavel_id
  ) then
    raise exception 'O responsável precisa ser alguém do comboio' using errcode = 'TR422';
  end if;

  return new;
end;
$$;

revoke execute on function privado.conferir_tarefa() from public, anon, authenticated;

create trigger conferir_tarefa
before insert or update on public.tarefas
for each row execute function privado.conferir_tarefa();

alter table public.tarefas enable row level security;

create policy "tarefas: ver (comboio)" on public.tarefas for select to authenticated
using (privado.e_membro(viagem_id));

create policy "tarefas: criar (comboio)" on public.tarefas for insert to authenticated
with check (criado_por = (select auth.uid()) and privado.e_membro(viagem_id));

-- Edita/marca feita: quem criou, o responsável ou o ADM
create policy "tarefas: editar (autor, responsavel ou ADM)" on public.tarefas for update to authenticated
using (
  criado_por = (select auth.uid())
  or responsavel_id = (select auth.uid())
  or privado.e_adm(viagem_id)
)
with check (privado.e_membro(viagem_id));

create policy "tarefas: apagar (autor ou ADM)" on public.tarefas for delete to authenticated
using (criado_por = (select auth.uid()) or privado.e_adm(viagem_id));
