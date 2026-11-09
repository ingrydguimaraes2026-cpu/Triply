# 052. Exportar gastos

**Fase:** 2 · **Tamanho:** P · **Depende de:** 002 · **Status:** Pronto pra testar (web)

## Objetivo
No Financeiro, "Exportar" baixa os gastos numa planilha (Excel/Google Planilhas) ou no formato que o Splitwise importa.

## Por que
- Catálogo H16. Quem cuida das contas quer a planilha; quem já usa Splitwise não quer redigitar.

## Inclui
- **Planilha:** CSV em português (separador `;`, vírgula decimal, acentos certos no Excel), uma linha por gasto em ordem de data: data, descrição, categoria, valor, moeda, quem pagou, comboio/pessoal e a parte de cada pessoa.
- **Splitwise:** só gastos do comboio, com o saldo de cada pessoa por gasto (pagou − parte), no formato de importação.
- Proteção contra fórmula: descrição começando com `=`, `+`, `-` ou `@` vira texto.
- Gasto pessoal de outra pessoa nunca sai (o banco nem devolve).

## Não inclui (fica pra depois)
- PDF (entra com M7 "exportar a viagem em PDF").
- Converter tudo pra uma moeda só na planilha.

## Dados
- Nenhuma mudança no banco.

## Critérios de aceite
- [x] Formato da planilha e do Splitwise, aspas, fórmula, ordem (testado: `exportar.test.mjs`).
- [ ] No navegador: Financeiro → Exportar → Planilha → abrir no Excel com acentos e valores certos.

## Dicas pra implementar
- Core: `packages/core/src/exportar.ts`. Web: `lib/baixar.ts` (peça pronta pra baixar arquivo gerado na hora).
