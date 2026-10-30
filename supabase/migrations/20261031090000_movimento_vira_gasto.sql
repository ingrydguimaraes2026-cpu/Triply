-- Spec 084 (H17): um movimento da carteira (lido do e-mail do Wise/Nomad) vira gasto do comboio.
--
-- O que muda:
-- 1. `movimentos_carteira.gasto_id`: liga o movimento ao gasto criado a partir dele
--    (pra mostrar "já virou gasto" e não lançar duas vezes). Se o gasto for apagado, a ligação some.
-- 2. `public.ligar_movimento_ao_gasto(movimento, gasto)`: grava a ligação. Só o dono da carteira,
--    só com um gasto da MESMA viagem e criado por ele mesmo.
--    (Não abrimos UPDATE na tabela: a função faz só essa mudança e mais nada.)
--
-- Pra desfazer:
--   drop function public.ligar_movimento_ao_gasto(uuid, uuid);
--   alter table public.movimentos_carteira drop column gasto_id;

alter table public.movimentos_carteira
  add column gasto_id uuid references public.gastos (id) on delete set null;

create index movimentos_carteira_gasto_idx on public.movimentos_carteira (gasto_id);

create function public.ligar_movimento_ao_gasto(p_movimento uuid, p_gasto uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_viagem uuid;
begin
  select c.viagem_id into v_viagem
  from public.movimentos_carteira m
  join public.carteiras c on c.id = m.carteira_id
  where m.id = p_movimento and c.usuario_id = (select auth.uid());

  if v_viagem is null then
    raise exception 'Movimento não encontrado.' using errcode = '42501';
  end if;

  if not exists (
    select 1 from public.gastos g
    where g.id = p_gasto and g.viagem_id = v_viagem and g.criado_por = (select auth.uid())
  ) then
    raise exception 'Esse gasto não é seu ou é de outra viagem.' using errcode = '42501';
  end if;

  update public.movimentos_carteira set gasto_id = p_gasto where id = p_movimento;
end;
$$;

revoke all on function public.ligar_movimento_ao_gasto(uuid, uuid) from public, anon;
grant execute on function public.ligar_movimento_ao_gasto(uuid, uuid) to authenticated;
