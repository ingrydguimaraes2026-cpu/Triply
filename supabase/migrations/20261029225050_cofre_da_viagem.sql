-- Spec 028: cofre da viagem (reservas, ingressos, PDFs) e bilhete no trajeto.
-- O bilhete é um arquivo do cofre "amarrado" a um trajeto (trajeto_id). Um lugar só pra tudo.
--
-- 1. Bucket privado `cofre`: até 10 MB, só PDF e imagem. Caminho: <viagem_id>/<id>.<ext>
-- 2. Tabela `arquivos_viagem`: nome, tipo, tamanho, quem enviou e, se for bilhete, o trajeto.
-- Comboio vê e envia; quem enviou ou o ADM renomeia/apaga.
--
-- Pra desfazer:
--   drop table public.arquivos_viagem; drop function privado.conferir_trajeto_do_arquivo();
--   drop policy "storage cofre: ver" on storage.objects; (idem enviar/apagar)
--   delete from storage.buckets where id = 'cofre';

-- ---------- 1. Bucket ----------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('cofre', 'cofre', false, 10485760, array['application/pdf', 'image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do nothing;

create policy "storage cofre: ver" on storage.objects for select to authenticated
using (bucket_id = 'cofre' and privado.e_membro(((storage.foldername(name))[1])::uuid));

create policy "storage cofre: enviar" on storage.objects for insert to authenticated
with check (bucket_id = 'cofre' and privado.e_membro(((storage.foldername(name))[1])::uuid));

create policy "storage cofre: apagar" on storage.objects for delete to authenticated
using (
  bucket_id = 'cofre'
  and (owner_id = (select auth.uid())::text or privado.e_adm(((storage.foldername(name))[1])::uuid))
);

-- ---------- 2. Tabela ----------
create table public.arquivos_viagem (
  id uuid primary key default gen_random_uuid(),
  viagem_id uuid not null references public.viagens (id) on delete cascade,
  -- Bilhete de um trajeto. Se o trajeto for apagado, o arquivo continua no cofre.
  trajeto_id uuid references public.trajetos (id) on delete set null,
  nome text not null check (char_length(btrim(nome)) between 1 and 120),
  caminho text not null unique check (char_length(caminho) <= 300),
  tipo text not null check (tipo in ('application/pdf', 'image/jpeg', 'image/png', 'image/webp')),
  tamanho integer not null check (tamanho > 0 and tamanho <= 10485760),
  enviado_por uuid not null default auth.uid() references public.perfis (id) on delete cascade,
  criado_em timestamptz not null default now(),
  -- O arquivo fica na pasta da própria viagem
  check (split_part(caminho, '/', 1) = viagem_id::text)
);

create index on public.arquivos_viagem (viagem_id, criado_em);
create index on public.arquivos_viagem (trajeto_id) where trajeto_id is not null;
create index on public.arquivos_viagem (enviado_por);

-- O trajeto tem que ser da mesma viagem; e ninguém troca a viagem nem quem enviou
create or replace function privado.conferir_trajeto_do_arquivo()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if tg_op = 'UPDATE' and (new.viagem_id <> old.viagem_id or new.enviado_por <> old.enviado_por or new.caminho <> old.caminho) then
    raise exception 'Não dá pra mudar a viagem, o arquivo nem quem enviou.' using hint = 'TR_ARQUIVO_FIXO';
  end if;
  if new.trajeto_id is not null
     and not exists (select 1 from public.trajetos t where t.id = new.trajeto_id and t.viagem_id = new.viagem_id) then
    raise exception 'Esse trajeto não é desta viagem.' using hint = 'TR_ARQUIVO_TRAJETO';
  end if;
  return new;
end;
$$;

create trigger conferir_trajeto before insert or update on public.arquivos_viagem
for each row execute function privado.conferir_trajeto_do_arquivo();

alter table public.arquivos_viagem enable row level security;

create policy "arquivos: ver (comboio)" on public.arquivos_viagem for select to authenticated
using (privado.e_membro(viagem_id));

create policy "arquivos: enviar (comboio)" on public.arquivos_viagem for insert to authenticated
with check (enviado_por = (select auth.uid()) and privado.e_membro(viagem_id));

create policy "arquivos: editar (quem enviou ou ADM)" on public.arquivos_viagem for update to authenticated
using (enviado_por = (select auth.uid()) or privado.e_adm(viagem_id))
with check (privado.e_membro(viagem_id));

create policy "arquivos: apagar (quem enviou ou ADM)" on public.arquivos_viagem for delete to authenticated
using (enviado_por = (select auth.uid()) or privado.e_adm(viagem_id));
