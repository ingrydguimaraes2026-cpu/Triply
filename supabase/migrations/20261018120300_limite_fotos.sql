-- Spec 005: fotos.
--
-- O que esta migration faz: no máximo 5 fotos por destino (somando o comboio inteiro).
-- A tela já bloqueia, mas a regra fica no banco pra valer sempre. Erro: TR_LIMITE_FOTOS.
-- Foto sem destino não entra na conta.
--
-- Pra desfazer:
--   drop trigger limite_fotos_por_destino on public.fotos;
--   drop function privado.conferir_limite_fotos();

create function privado.conferir_limite_fotos()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.destino_id is null then
    return new;
  end if;
  -- Duas pessoas enviando ao mesmo tempo: uma espera a outra
  perform pg_advisory_xact_lock(hashtextextended(new.destino_id::text, 1));
  if (select count(*) from public.fotos where destino_id = new.destino_id and id <> new.id) >= 5 then
    raise exception 'Esse destino já tem 5 fotos' using errcode = 'P0001', hint = 'TR_LIMITE_FOTOS';
  end if;
  return new;
end;
$$;

revoke execute on function privado.conferir_limite_fotos() from public, anon, authenticated;

create trigger limite_fotos_por_destino
before insert or update of destino_id on public.fotos
for each row execute function privado.conferir_limite_fotos();
