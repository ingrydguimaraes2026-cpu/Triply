-- Spec 067: quem vai em cada trajeto (D5) + "meu itinerário".
--
-- O que esta migration faz:
-- 1. Tabela `trajeto_passageiros` (trajeto, pessoa). Trajeto SEM ninguém na lista = o comboio inteiro vai
--    (assim tudo que já existe continua igual).
-- 2. Gatilho: só gente do comboio da viagem do trajeto.
-- 3. RLS: o comboio vê; o ADM define (igual a editar trajetos); cada um pode se tirar ou se pôr
--    ("vou nesse" / "não vou nesse").
-- 4. `lembretes_a_enviar` não muda; a função `lembretes` passa a avisar só os passageiros (quando há lista).
--
-- Pra desfazer:
--   drop table public.trajeto_passageiros;
--   drop function privado.conferir_passageiro();

create table public.trajeto_passageiros (
  trajeto_id uuid not null references public.trajetos (id) on delete cascade,
  usuario_id uuid not null references public.perfis (id) on delete cascade,
  primary key (trajeto_id, usuario_id)
);

create index on public.trajeto_passageiros (usuario_id);

create function privado.conferir_passageiro()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not exists (
    select 1 from public.trajetos t
    join public.comboio_membros m on m.viagem_id = t.viagem_id and m.usuario_id = new.usuario_id
    where t.id = new.trajeto_id
  ) then
    raise exception 'Passageiro tem que ser do comboio' using errcode = '23514';
  end if;
  return new;
end;
$$;

revoke execute on function privado.conferir_passageiro() from public, anon, authenticated;

create trigger conferir_passageiro
before insert on public.trajeto_passageiros
for each row execute function privado.conferir_passageiro();

alter table public.trajeto_passageiros enable row level security;

create policy "passageiros: ver (comboio)" on public.trajeto_passageiros for select to authenticated
using (exists (select 1 from public.trajetos t where t.id = trajeto_id and privado.e_membro(t.viagem_id)));
create policy "passageiros: pôr (ADM ou a própria pessoa)" on public.trajeto_passageiros for insert to authenticated
with check (exists (
  select 1 from public.trajetos t where t.id = trajeto_id
    and (privado.e_adm(t.viagem_id) or (usuario_id = (select auth.uid()) and privado.e_membro(t.viagem_id)))
));
create policy "passageiros: tirar (ADM ou a própria pessoa)" on public.trajeto_passageiros for delete to authenticated
using (exists (
  select 1 from public.trajetos t where t.id = trajeto_id
    and (privado.e_adm(t.viagem_id) or usuario_id = (select auth.uid()))
));

grant select, insert, delete on public.trajeto_passageiros to authenticated;
