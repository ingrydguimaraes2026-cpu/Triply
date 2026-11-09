-- Spec 070: programação em paralelo (B4). Um evento da agenda pode ser só de parte do comboio
-- ("museu: Ana e Ingryd" enquanto o resto vai à praia).
--
-- O que esta migration faz:
-- 1. `eventos_agenda.participantes`: lista de pessoas (vazia = o comboio inteiro, como antes).
-- 2. Gatilho: participantes só do comboio, sem repetir.
-- RLS da tabela continua igual (editar: quem criou ou o ADM).
--
-- Pra desfazer:
--   drop trigger conferir_participantes on public.eventos_agenda;
--   drop function privado.conferir_participantes();
--   alter table public.eventos_agenda drop column participantes;

alter table public.eventos_agenda add column participantes uuid[] not null default '{}';

create function privado.conferir_participantes()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  new.participantes := array(select distinct unnest(new.participantes));
  if exists (
    select 1 from unnest(new.participantes) p
    where not exists (select 1 from public.comboio_membros m where m.viagem_id = new.viagem_id and m.usuario_id = p)
  ) then
    raise exception 'Só gente do comboio participa do evento' using errcode = '23514';
  end if;
  return new;
end;
$$;

revoke execute on function privado.conferir_participantes() from public, anon, authenticated;

create trigger conferir_participantes
before insert or update of participantes on public.eventos_agenda
for each row execute function privado.conferir_participantes();
