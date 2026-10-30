-- Spec 073: carro e rodízio de motorista (D11). Quem dirige em cada trecho de carro.
--
-- O que esta migration faz:
-- 1. `trajetos.motorista_id`: quem dirige (só faz sentido quando o meio é carro).
-- 2. Gatilho: o motorista tem que ser do comboio.
-- RLS de trajetos continua igual (o ADM edita).
--
-- Pra desfazer:
--   drop trigger conferir_motorista on public.trajetos;
--   drop function privado.conferir_motorista();
--   alter table public.trajetos drop column motorista_id;

alter table public.trajetos add column motorista_id uuid references public.perfis (id) on delete set null;
create index on public.trajetos (motorista_id);

create function privado.conferir_motorista()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.motorista_id is not null and not exists (
    select 1 from public.comboio_membros m where m.viagem_id = new.viagem_id and m.usuario_id = new.motorista_id
  ) then
    raise exception 'O motorista tem que ser do comboio' using errcode = '23514';
  end if;
  return new;
end;
$$;

revoke execute on function privado.conferir_motorista() from public, anon, authenticated;

create trigger conferir_motorista
before insert or update of motorista_id on public.trajetos
for each row execute function privado.conferir_motorista();
