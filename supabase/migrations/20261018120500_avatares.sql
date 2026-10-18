-- Spec 008: perfil.
--
-- O que esta migration faz: cria o bucket público `avatares` pras fotos de perfil.
-- - Público pra ler (a foto aparece no comboio sem precisar de link temporário).
-- - Cada pessoa só envia, troca e apaga arquivos dentro da própria pasta: avatares/<id da pessoa>/...
-- - Até 512 KB, só jpeg/webp (o site comprime antes).
--
-- Pra desfazer: apagar as 4 policies "storage avatares: ..." e o bucket (vazio) pelo painel.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('avatares', 'avatares', true, 524288, array['image/jpeg', 'image/webp']);

create policy "storage avatares: ver a minha pasta" on storage.objects for select to authenticated
using (bucket_id = 'avatares' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy "storage avatares: enviar" on storage.objects for insert to authenticated
with check (bucket_id = 'avatares' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy "storage avatares: trocar" on storage.objects for update to authenticated
using (bucket_id = 'avatares' and (storage.foldername(name))[1] = (select auth.uid())::text)
with check (bucket_id = 'avatares' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy "storage avatares: apagar" on storage.objects for delete to authenticated
using (bucket_id = 'avatares' and (storage.foldername(name))[1] = (select auth.uid())::text);
