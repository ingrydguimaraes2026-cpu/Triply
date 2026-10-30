# 057. Gastos planejados e recorrentes ("A pagar")

**Fase:** 2 · **Tamanho:** P · **Depende de:** 002, 009 · **Status:** Pronto pra testar (web) · banco **não aplicado**

## Objetivo
No Financeiro, a lista "A pagar" guarda o que já está combinado mas ainda não foi pago: saldo do Airbnb no check-in, sinal de passeio, diárias de estacionamento. "Paguei" vira gasto de verdade.

## Por que
- Catálogo H13. Sem isso, o comboio esquece o saldo do check-in ou lança antes da hora e bagunça os acertos.

## Inclui
- Cartão "A pagar" com o total que falta (por moeda) e a lista: descrição, valor, vencimento, quem paga e a situação (atrasado, vence hoje, em breve).
- **Fica fora da conta de quem deve pra quem** até ser pago (não mexe no modelo de saldos).
- "Pagamento previsto": descrição, valor, moeda, categoria, quem paga, vencimento. **Repetir todo dia** cria uma linha por dia "(1/5)…" (até 60).
- **Paguei**: abre o formulário de gasto já preenchido (descrição, valor, moeda, categoria, quem pagou); ao salvar, o previsto sai da lista.

## Não inclui (fica pra depois)
- Lembrete no celular no vencimento.
- Ligar automaticamente ao gasto criado (o campo `gasto_id` existe; o formulário de gasto ainda não devolve o id).
- App mobile.

## Dados
- **Migration:** `supabase/migrations/20261030160000_pagamentos_previstos.sql` — `pagamentos_previstos` (`pago_em`, `gasto_id`).

## Quem pode o quê
| Ação | ADM | Quem paga | Quem criou | Outros do comboio | Fora do comboio |
|---|---|---|---|---|---|
| Ver / criar | ✅ | ✅ | ✅ | ✅ | ❌ |
| Editar / marcar pago | ✅ | ✅ | ✅ | ❌ | ❌ |
| Apagar | ✅ | ❌ | ✅ | ❌ | ❌ |

## Critérios de aceite
- [x] Comboio cria; quem paga liga ao gasto; quem paga fora do comboio e valor 0 barrados; estranho não vê (testado no banco).
- [x] Repetir por dia, situação, total por moeda (testado: `previstos.test.mjs`).
- [ ] No navegador: prever "Saldo do Airbnb" e "Estacionamento" por 3 dias; "Paguei" num deles e ver o gasto lançado.
