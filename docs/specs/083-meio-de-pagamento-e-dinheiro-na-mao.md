# 083. Meio de pagamento, câmbio congelado e dinheiro na mão

**Fase:** 2 · **Tamanho:** M · **Depende de:** 002, 003 · **Status:** Pronto pra testar (web) · banco **não aplicado**

## Objetivo
O gasto guarda **como foi pago** (cartão, conta global, dinheiro) e a **cotação do dia** (quanto valia 1 da moeda em reais). A compra de moeda pode ser marcada "em dinheiro vivo". O Financeiro mostra o **dinheiro na mão** de cada um: compras em espécie menos o que ela pagou em dinheiro.

## Por que
- Catálogo H11 (câmbio congelado e meio) e H12 (dinheiro em espécie, que ficou de fora da 003).

## Inclui
- Formulário de gasto: "Como pagou? Cartão · Conta global · Dinheiro" (opcional).
- Ao salvar, quem lançou grava o meio e a cotação de hoje (Frankfurter) em `cotacao_reais`. É só registro: as contas do Financeiro continuam pela regra da spec 003.
- Formulário de câmbio: "Em dinheiro vivo".
- Cartão "Dinheiro na mão" (só aparece quando há algo): "€ 155,00".

## Não inclui (fica pra depois)
- IOF diferente por meio de pagamento nas contas.
- Lançamento rápido com meio de pagamento.
- App mobile.

## Dados
- **Migration:** `supabase/migrations/20261031080000_meio_de_pagamento.sql` — `gastos.meio_pagamento`, `gastos.cotacao_reais`, `compras_cambio.especie`.

## Critérios de aceite
- [x] Meio só cartão/conta global/espécie; cotação positiva; compra em espécie (testado no banco).
- [x] Dinheiro na mão = compras em espécie − gastos em dinheiro, só os meus (testado: `dinheiro-na-mao.test.mjs`).
- [ ] No navegador: comprar € 200 em espécie, pagar € 45 em dinheiro e ver € 155 na mão.
