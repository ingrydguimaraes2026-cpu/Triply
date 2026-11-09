# 082. Relatórios do Financeiro

**Fase:** 2 · **Tamanho:** M · **Depende de:** 002, 003 · **Status:** Pronto pra testar (web)

## Objetivo
No Financeiro, um cartão "Relatórios" com quanto o comboio gastou por dia, quanto cada pessoa consumiu e pagou, o custo médio por pessoa por dia e o dia mais caro.

## Por que
- Catálogo H15. Responde "quanto essa viagem está custando por cabeça?" sem planilha.

## Inclui
- "~R$ 325 por pessoa por dia · dia mais caro: 10/11".
- Aba **Por dia**: barra por dia.
- Aba **Por pessoa**: barra grossa = consumiu (a parte dela nos gastos); fina = pagou.
- Tudo na moeda da viagem, com a mesma conversão do resto do Financeiro. Só gastos do comboio.

## Não inclui (fica pra depois)
- Gráfico de pizza e exportar o relatório (a planilha da spec 052 já tem tudo).
- App mobile.

## Dados
- Nenhuma mudança no banco.

## Critérios de aceite
- [x] Por dia, por pessoa, custo por pessoa por dia, dia mais caro, sem gastos (testado: `relatorios.test.mjs`).
- [ ] No navegador: com gastos em 3 dias, ver as barras por dia e por pessoa.
