# 081. Divisão por pesos e por item

**Fase:** 2 · **Tamanho:** M · **Depende de:** 002 · **Status:** Pronto pra testar (web)

## Objetivo
No formulário de gasto, além de "Igual" e "Valores", dá pra dividir por **Pesos** (casal = 2, criança = 0,5) e **Por item** (conta de restaurante: cada um paga o que comeu).

## Por que
- Catálogo H9. Família com criança e casal que paga junto não cabe no "dividir igual"; conta de restaurante item a item é pedido clássico.

## Inclui
- Botões "Igual · Valores · Pesos · Por item".
- **Pesos:** um campo por pessoa (padrão 1); o valor de cada um aparece na hora. Sobra dos centavos com quem pagou.
- **Por item:** lista de itens (o que foi, valor, quem consumiu). O que sobra do total (serviço, couvert, item não marcado) é dividido igual entre todos. Aviso se os itens passarem do total.
- O gasto continua salvo com o valor de cada pessoa: saldos e acertos não mudam de regra.

## Não inclui (fica pra depois)
- Lembrar os pesos de cada pessoa (núcleos, F4, travado).
- Foto do recibo lendo os itens (H10, Fase 8).
- App mobile.

## Dados
- Nenhuma mudança no banco.

## Critérios de aceite
- [x] Pesos proporcionais com sobra pra quem pagou; peso zero fora; itens + serviço; itens passando do total (testado: `divisao.test.mjs`).
- [ ] No navegador: R$ 100 com pesos 2/1/0,5 dá R$ 57,14 / 28,58 / 14,28.
