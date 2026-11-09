-- Spec 123: hospedagem por noite.
-- 1. lat/lon da casa: pra mostrar "N min a pé da estação" (preenchidos ao salvar o endereço).
-- 2. reserva: separa "escolhida" de "reservada" e "paga". Só o ADM muda (igual ao escolher).

alter table public.hospedagens
  add column lat double precision,
  add column lon double precision,
  add column reserva text not null default 'nao' check (reserva in ('nao', 'reservada', 'paga'));

comment on column public.hospedagens.reserva is 'Spec 123: nao | reservada | paga. Só o ADM muda.';

create function privado.conferir_reserva_da_hospedagem()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.reserva <> 'nao' and (tg_op = 'INSERT' or new.reserva <> old.reserva) and not privado.e_adm(new.viagem_id) then
    raise exception 'Só o ADM marca a hospedagem como reservada' using errcode = '42501';
  end if;
  if tg_op = 'UPDATE' and new.reserva <> old.reserva and new.reserva = 'nao' and not privado.e_adm(new.viagem_id) then
    raise exception 'Só o ADM marca a hospedagem como reservada' using errcode = '42501';
  end if;
  return new;
end;
$$;

revoke execute on function privado.conferir_reserva_da_hospedagem() from public, anon, authenticated;

create trigger conferir_reserva_da_hospedagem
before insert or update on public.hospedagens
for each row execute function privado.conferir_reserva_da_hospedagem();
