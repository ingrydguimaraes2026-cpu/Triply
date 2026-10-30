-- Spec 083: câmbio congelado e meio de pagamento (H11) + dinheiro na mão (H12).
--
-- O que esta migration faz (só acrescenta):
-- 1. `gastos.meio_pagamento`: 'cartao', 'conta_global' ou 'especie' (null = não informado).
-- 2. `gastos.cotacao_reais`: quantos reais valia 1 da moeda no dia do gasto (congelada; só registro,
--    as contas do Financeiro continuam como antes).
-- 3. `compras_cambio.especie`: a compra de moeda foi em dinheiro vivo (pra calcular o "dinheiro na mão").
-- RLS das tabelas continua igual.
--
-- Pra desfazer:
--   alter table public.gastos drop column meio_pagamento, drop column cotacao_reais;
--   alter table public.compras_cambio drop column especie;

alter table public.gastos
  add column meio_pagamento text check (meio_pagamento in ('cartao', 'conta_global', 'especie')),
  add column cotacao_reais numeric(12, 6) check (cotacao_reais > 0 and cotacao_reais < 100000);

alter table public.compras_cambio add column especie boolean not null default false;
