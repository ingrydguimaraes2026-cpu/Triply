-- Roteiro do destino (spec 115 v2): o plano dia a dia que o grupo monta deslizando.
-- Uma linha por destino. `dias` é uma lista de dias, cada dia uma lista de ids de lugares, na ordem:
--   [["<lugar>", "<lugar>"], ["<lugar>"], []]
-- Lugar que o grupo curtiu e não está em nenhum dia fica em "Sem dia" (a tela calcula).
-- Quem está no comboio vê e arruma (é o plano de todo mundo, como uma lista compartilhada).

create table public.roteiros (
  destino_id uuid primary key references public.destinos (id) on delete cascade,
  viagem_id uuid not null references public.viagens (id) on delete cascade,
  dias jsonb not null default '[]'::jsonb check (jsonb_typeof(dias) = 'array'),
  atualizado_por uuid default auth.uid() references public.perfis (id) on delete set null,
  atualizado_em timestamptz not null default now()
);

create index on public.roteiros (viagem_id);
create index on public.roteiros (atualizado_por);

-- O destino tem que ser desta viagem; guarda quem mexeu e quando
create function privado.conferir_roteiro()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not exists (select 1 from public.destinos d where d.id = new.destino_id and d.viagem_id = new.viagem_id) then
    raise exception 'Esse destino não é desta viagem' using errcode = 'TR422';
  end if;
  new.atualizado_por := auth.uid();
  new.atualizado_em := now();
  return new;
end;
$$;

revoke execute on function privado.conferir_roteiro() from public, anon, authenticated;

create trigger conferir_roteiro
before insert or update on public.roteiros
for each row execute function privado.conferir_roteiro();

alter table public.roteiros enable row level security;

create policy "roteiros: ver (comboio)" on public.roteiros for select to authenticated
using (privado.e_membro(viagem_id));
create policy "roteiros: criar (comboio)" on public.roteiros for insert to authenticated
with check (privado.e_membro(viagem_id));
create policy "roteiros: arrumar (comboio)" on public.roteiros for update to authenticated
using (privado.e_membro(viagem_id))
with check (privado.e_membro(viagem_id));

grant select, insert, update on public.roteiros to authenticated;

-- Tempo real: quando alguém arruma, a tela dos outros atualiza
do $$
begin
  -- No banco de testes (sem Realtime) a publicação não existe: não faz nada.
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    alter publication supabase_realtime add table public.roteiros;
  end if;
end;
$$;
