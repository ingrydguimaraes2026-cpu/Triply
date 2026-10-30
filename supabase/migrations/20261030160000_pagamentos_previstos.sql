-- Spec 057: gastos planejados e recorrentes (H13) — "pagamentos previstos".
-- Ficam FORA da conta de quem deve pra quem até virarem gasto de verdade (aí o gasto entra normal).
--
-- O que esta migration faz:
-- 1. Tabela `pagamentos_previstos`: descrição, valor, moeda, categoria, quando vence e quem vai pagar.
--    `pago_em` = quando foi pago (null = ainda a pagar); `gasto_id` liga ao gasto lançado, quando dá.
-- 2. Gatilho: viagem e autor não mudam; quem paga tem que ser do comboio; o gasto ligado tem que ser da viagem.
--
-- Quem pode (RLS): o comboio vê e cria; quem criou ou o ADM edita e apaga.
--
-- Pra desfazer:
--   drop table public.pagamentos_previstos;
--   drop function privado.conferir_pagamento_previsto();

create table public.pagamentos_previstos (
  id uuid primary key default gen_random_uuid(),
  viagem_id uuid not null references public.viagens (id) on delete cascade,
  descricao text not null check (char_length(trim(descricao)) between 1 and 200),
  valor numeric(12, 2) not null check (valor > 0 and valor < 100000000),
  moeda char(3) not null check (moeda ~ '^[A-Z]{3}$'),
  categoria text not null default 'outros' check (categoria in ('transporte', 'hospedagem', 'alimentacao', 'passeios', 'comprinhas', 'outros')),
  vence_em date,
  quem_paga uuid references public.perfis (id) on delete set null,
  gasto_id uuid references public.gastos (id) on delete set null,
  pago_em timestamptz,
  criado_por uuid not null default auth.uid() references public.perfis (id) on delete cascade,
  criado_em timestamptz not null default now()
);

create index on public.pagamentos_previstos (viagem_id, vence_em);
create index on public.pagamentos_previstos (criado_por);
create index on public.pagamentos_previstos (quem_paga);
create index on public.pagamentos_previstos (gasto_id);

create function privado.conferir_pagamento_previsto()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if tg_op = 'UPDATE' and (new.viagem_id <> old.viagem_id or new.criado_por <> old.criado_por) then
    raise exception 'Não dá pra mudar a viagem nem o autor do pagamento' using errcode = '42501';
  end if;
  if new.quem_paga is not null and not exists (
    select 1 from public.comboio_membros m where m.viagem_id = new.viagem_id and m.usuario_id = new.quem_paga
  ) then
    raise exception 'Quem paga tem que ser do comboio' using errcode = '23514';
  end if;
  if new.gasto_id is not null and not exists (select 1 from public.gastos g where g.id = new.gasto_id and g.viagem_id = new.viagem_id) then
    raise exception 'O gasto tem que ser desta viagem' using errcode = '23514';
  end if;
  return new;
end;
$$;

revoke execute on function privado.conferir_pagamento_previsto() from public, anon, authenticated;

create trigger conferir_pagamento_previsto
before insert or update on public.pagamentos_previstos
for each row execute function privado.conferir_pagamento_previsto();

alter table public.pagamentos_previstos enable row level security;

create policy "previstos: ver (comboio)" on public.pagamentos_previstos for select to authenticated
using (privado.e_membro(viagem_id));
create policy "previstos: criar (comboio)" on public.pagamentos_previstos for insert to authenticated
with check (criado_por = (select auth.uid()) and privado.e_membro(viagem_id));
create policy "previstos: editar (autor, quem paga ou ADM)" on public.pagamentos_previstos for update to authenticated
using (criado_por = (select auth.uid()) or quem_paga = (select auth.uid()) or privado.e_adm(viagem_id))
with check (privado.e_membro(viagem_id));
create policy "previstos: apagar (autor ou ADM)" on public.pagamentos_previstos for delete to authenticated
using (criado_por = (select auth.uid()) or privado.e_adm(viagem_id));

grant select, insert, update, delete on public.pagamentos_previstos to authenticated;
