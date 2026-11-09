-- Spec 048: listas do comboio — "quem leva" (I8) e lista de compras (I10).
--
-- O que esta migration faz:
-- 1. Tabela `itens_lista`: item de uma das listas ('levar' ou 'compras'), quem fica com ele,
--    quantidade (texto livre, ex.: "2", "1 kg") e se já está feito.
-- 2. Gatilho: viagem, lista e autor não mudam; quem fica com o item tem que ser do comboio.
--
-- Quem pode (RLS): todo o comboio vê, cria e marca (é lista de grupo); quem criou ou o ADM apaga.
--
-- Pra desfazer:
--   drop table public.itens_lista;
--   drop function privado.conferir_item_lista();

create table public.itens_lista (
  id uuid primary key default gen_random_uuid(),
  viagem_id uuid not null references public.viagens (id) on delete cascade,
  lista text not null check (lista in ('levar', 'compras')),
  texto text not null check (char_length(trim(texto)) between 1 and 120),
  quantidade text check (quantidade is null or char_length(trim(quantidade)) between 1 and 20),
  quem_id uuid references public.perfis (id) on delete set null,
  feito boolean not null default false,
  criado_por uuid not null default auth.uid() references public.perfis (id) on delete cascade,
  criado_em timestamptz not null default now()
);

create index on public.itens_lista (viagem_id, lista);
create index on public.itens_lista (criado_por);
create index on public.itens_lista (quem_id);

create function privado.conferir_item_lista()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if tg_op = 'UPDATE' and (new.viagem_id <> old.viagem_id or new.lista <> old.lista or new.criado_por <> old.criado_por) then
    raise exception 'Não dá pra mudar a viagem, a lista nem o autor do item' using errcode = '42501';
  end if;
  if new.quem_id is not null and not exists (
    select 1 from public.comboio_membros m where m.viagem_id = new.viagem_id and m.usuario_id = new.quem_id
  ) then
    raise exception 'Só dá pra passar o item pra alguém do comboio' using errcode = '23514';
  end if;
  return new;
end;
$$;

revoke execute on function privado.conferir_item_lista() from public, anon, authenticated;

create trigger conferir_item_lista
before insert or update on public.itens_lista
for each row execute function privado.conferir_item_lista();

alter table public.itens_lista enable row level security;

create policy "listas: ver (comboio)" on public.itens_lista for select to authenticated
using (privado.e_membro(viagem_id));
create policy "listas: criar (comboio)" on public.itens_lista for insert to authenticated
with check (criado_por = (select auth.uid()) and privado.e_membro(viagem_id));
create policy "listas: marcar e editar (comboio)" on public.itens_lista for update to authenticated
using (privado.e_membro(viagem_id)) with check (privado.e_membro(viagem_id));
create policy "listas: apagar (autor ou ADM)" on public.itens_lista for delete to authenticated
using (criado_por = (select auth.uid()) or privado.e_adm(viagem_id));

grant select, insert, update, delete on public.itens_lista to authenticated;
