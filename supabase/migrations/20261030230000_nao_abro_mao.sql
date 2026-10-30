-- Spec 066: "Não abro mão" (A6). Cada pessoa marca até 3 lugares obrigatórios por destino.
--
-- O que esta migration faz:
-- 1. Tabela `lugar_prioridades` (lugar, pessoa): o "não abro mão" de cada um.
-- 2. Gatilho: no máximo 3 por pessoa em cada destino (lugar sem destino conta junto, como "sem destino").
-- 3. RLS: o comboio vê; cada um marca e tira só os próprios.
--
-- Pra desfazer:
--   drop table public.lugar_prioridades;
--   drop function privado.conferir_prioridade();

create table public.lugar_prioridades (
  lugar_id uuid not null references public.lugares (id) on delete cascade,
  usuario_id uuid not null default auth.uid() references public.perfis (id) on delete cascade,
  criado_em timestamptz not null default now(),
  primary key (lugar_id, usuario_id)
);

create index on public.lugar_prioridades (usuario_id);

create function privado.conferir_prioridade()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_destino uuid;
  v_viagem uuid;
begin
  select destino_id, viagem_id into v_destino, v_viagem from public.lugares where id = new.lugar_id;
  if (
    select count(*) from public.lugar_prioridades p
    join public.lugares l on l.id = p.lugar_id
    where p.usuario_id = new.usuario_id and l.viagem_id = v_viagem and l.destino_id is not distinct from v_destino
  ) >= 3 then
    raise exception 'No máximo 3 "não abro mão" por destino' using errcode = '23514';
  end if;
  return new;
end;
$$;

revoke execute on function privado.conferir_prioridade() from public, anon, authenticated;

create trigger conferir_prioridade
before insert on public.lugar_prioridades
for each row execute function privado.conferir_prioridade();

alter table public.lugar_prioridades enable row level security;

create policy "prioridades: ver (comboio)" on public.lugar_prioridades for select to authenticated
using (exists (select 1 from public.lugares l where l.id = lugar_id and privado.e_membro(l.viagem_id)));
create policy "prioridades: marcar a minha" on public.lugar_prioridades for insert to authenticated
with check (
  usuario_id = (select auth.uid())
  and exists (select 1 from public.lugares l where l.id = lugar_id and privado.e_membro(l.viagem_id))
);
create policy "prioridades: tirar a minha" on public.lugar_prioridades for delete to authenticated
using (usuario_id = (select auth.uid()));

grant select, insert, delete on public.lugar_prioridades to authenticated;
