-- Spec 039: seguro viagem (I5).
--
-- O que esta migration faz:
-- 1. Tabela `seguros_viagem`: seguradora, telefone 24 h, número da apólice, validade, o que cobre
--    e quem do comboio está coberto. Uma viagem pode ter vários (cada família com o seu).
-- 2. Gatilho: viagem e autor não mudam; mantém `atualizado_em`; só gente do comboio entre os cobertos.
--
-- Quem pode (RLS): todo o comboio vê (é o que se procura na emergência) e cadastra;
-- quem cadastrou ou o ADM edita e apaga.
--
-- Pra desfazer:
--   drop table public.seguros_viagem;
--   drop function privado.conferir_seguro_viagem();

create table public.seguros_viagem (
  id uuid primary key default gen_random_uuid(),
  viagem_id uuid not null references public.viagens (id) on delete cascade,
  seguradora text not null check (char_length(trim(seguradora)) between 1 and 120),
  telefone text check (telefone is null or telefone ~ '^\+?[0-9 ()./-]{6,30}$'),
  apolice text check (apolice is null or char_length(trim(apolice)) between 1 and 60),
  valido_de date,
  valido_ate date,
  cobertura text check (cobertura is null or char_length(trim(cobertura)) between 1 and 500),
  cobertos uuid[] not null default '{}',
  criado_por uuid not null default auth.uid() references public.perfis (id) on delete cascade,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now(),
  check (valido_ate is null or valido_de is null or valido_ate >= valido_de)
);

create index on public.seguros_viagem (viagem_id);
create index on public.seguros_viagem (criado_por);

create function privado.conferir_seguro_viagem()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if tg_op = 'UPDATE' then
    if new.viagem_id <> old.viagem_id or new.criado_por <> old.criado_por then
      raise exception 'Não dá pra mudar a viagem nem o autor do seguro' using errcode = '42501';
    end if;
    new.criado_em := old.criado_em;
    new.atualizado_em := now();
  end if;
  if exists (
    select 1 from unnest(new.cobertos) c
    where not exists (select 1 from public.comboio_membros m where m.viagem_id = new.viagem_id and m.usuario_id = c)
  ) then
    raise exception 'Só dá pra cobrir gente do comboio' using errcode = '23514';
  end if;
  return new;
end;
$$;

revoke execute on function privado.conferir_seguro_viagem() from public, anon, authenticated;

create trigger conferir_seguro_viagem
before insert or update on public.seguros_viagem
for each row execute function privado.conferir_seguro_viagem();

alter table public.seguros_viagem enable row level security;

create policy "seguros: ver (comboio)" on public.seguros_viagem for select to authenticated
using (privado.e_membro(viagem_id));

create policy "seguros: criar (comboio)" on public.seguros_viagem for insert to authenticated
with check (criado_por = (select auth.uid()) and privado.e_membro(viagem_id));

create policy "seguros: editar (autor ou ADM)" on public.seguros_viagem for update to authenticated
using (criado_por = (select auth.uid()) or privado.e_adm(viagem_id))
with check (privado.e_membro(viagem_id));

create policy "seguros: apagar (autor ou ADM)" on public.seguros_viagem for delete to authenticated
using (criado_por = (select auth.uid()) or privado.e_adm(viagem_id));

grant select, insert, update, delete on public.seguros_viagem to authenticated;
