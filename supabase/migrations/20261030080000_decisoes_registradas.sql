-- Spec 044: decisões registradas (A7). Enquete fechada vira "decisão", com data.
--
-- O que esta migration faz:
-- 1. `enquetes.fechada_em`: quando a enquete foi fechada (null = aberta).
-- 2. Gatilho: preenche `fechada_em` sozinho ao fechar e limpa ao reabrir (o app não manda a data).
--    Enquetes que já estavam fechadas ficam com a data de criação (melhor que nada).
--
-- Pra desfazer:
--   drop trigger carimbar_fechamento_enquete on public.enquetes;
--   drop function privado.carimbar_fechamento_enquete();
--   alter table public.enquetes drop column fechada_em;

alter table public.enquetes add column fechada_em timestamptz;
update public.enquetes set fechada_em = criado_em where fechada;

create function privado.carimbar_fechamento_enquete()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if new.fechada and (tg_op = 'INSERT' or not old.fechada) then
    new.fechada_em := now();
  elsif not new.fechada then
    new.fechada_em := null;
  else
    new.fechada_em := old.fechada_em; -- continua fechada: a data não muda
  end if;
  return new;
end;
$$;

revoke execute on function privado.carimbar_fechamento_enquete() from public, anon, authenticated;

create trigger carimbar_fechamento_enquete
before insert or update on public.enquetes
for each row execute function privado.carimbar_fechamento_enquete();
