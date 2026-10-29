-- Spec 019: avisos do ADM (recado fixado no topo da viagem).
--
-- O que esta migration faz:
-- 1. Tabela `avisos`: recados curtos que o ADM fixa no topo da viagem
--    ("passaporte na mão amanhã!"). Todo o comboio lê; só o ADM escreve.
-- 2. Gatilho: a viagem e o autor não mudam, e `atualizado_em` sobe sozinho ao editar.
--
-- Quem pode:
-- - todo mundo do comboio vê os avisos;
-- - só o ADM cria, edita e apaga (garantido pela RLS, não só pela tela).
--   Convidado nunca é ADM (spec 018), então convidado não posta aviso.
--
-- Pra desfazer:
--   drop table public.avisos;
--   drop function privado.conferir_aviso();

create table public.avisos (
  id uuid primary key default gen_random_uuid(),
  viagem_id uuid not null references public.viagens (id) on delete cascade,
  texto text not null check (char_length(trim(texto)) between 1 and 280),
  criado_por uuid not null default auth.uid() references public.perfis (id) on delete cascade,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);

create index on public.avisos (viagem_id);
create index on public.avisos (criado_por);

-- Gatilho: viagem e autor não mudam; ao editar, atualizado_em acompanha.
create function privado.conferir_aviso()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if tg_op = 'UPDATE' then
    if new.viagem_id <> old.viagem_id or new.criado_por <> old.criado_por then
      raise exception 'Não dá pra mudar a viagem nem o autor do aviso' using errcode = '42501';
    end if;
    new.atualizado_em := now();
  end if;
  return new;
end;
$$;

revoke execute on function privado.conferir_aviso() from public, anon, authenticated;

create trigger conferir_aviso
before insert or update on public.avisos
for each row execute function privado.conferir_aviso();

alter table public.avisos enable row level security;

create policy "avisos: ver (comboio)" on public.avisos for select to authenticated
using (privado.e_membro(viagem_id));

create policy "avisos: criar (ADM)" on public.avisos for insert to authenticated
with check (criado_por = (select auth.uid()) and privado.e_adm(viagem_id));

create policy "avisos: editar (ADM)" on public.avisos for update to authenticated
using (privado.e_adm(viagem_id))
with check (privado.e_adm(viagem_id));

create policy "avisos: apagar (ADM)" on public.avisos for delete to authenticated
using (privado.e_adm(viagem_id));
