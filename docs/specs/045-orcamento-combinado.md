# 045. Orçamento combinado (em segredo)

**Fase:** 2 · **Tamanho:** P · **Depende de:** 003 · **Status:** Pronto pra testar (web) · banco **não aplicado**

## Objetivo
Cada pessoa diz, em segredo, quanto topa gastar na viagem (de/até, por pessoa). O comboio vê só a faixa que serve pra todos.

## Por que
- Catálogo A3 (diferencial, ninguém faz). "Fechar orçamento" trava 36% dos grupos; ninguém quer ser o "pão-duro" falando em voz alta.

## Inclui
- Cartão "Orçamento combinado" na Overview: minha faixa (cadeado, só eu vejo) e o resultado.
- Resultado: "Faixa que serve pra todos: R$ 6.000 a R$ 9.000 por pessoa · 4 de 5 responderam"; ou "ainda não há uma faixa que sirva pra todos"; ou "assim que 2 pessoas responderem…".
- Com só 1 resposta o banco não devolve a faixa (seria a da pessoa).

## Não inclui (fica pra depois)
- Botão "usar como orçamento da viagem" (o orçamento da 003 é por categoria).
- App mobile.

## Dados
- **Migration:** `supabase/migrations/20261030090000_orcamento_combinado.sql` — `orcamento_faixas` (só a pessoa vê) + `faixa_do_comboio(viagem)`.

## Quem pode o quê
| Ação | A pessoa | Resto do comboio | Quem não é do comboio |
|---|---|---|---|
| Ver/mudar a própria faixa | ✅ | ❌ | ❌ |
| Ver a faixa comum | ✅ | ✅ | ❌ |

## Critérios de aceite
- [x] Faixa secreta; resultado só com 2+ respostas; maior mínimo e menor máximo; estranho não vê nem grava; máximo < mínimo barrado (testado no banco).
- [x] Leitura esperando/comum/sem acordo (testado: `orcamento-combinado.test.mjs`).
- [ ] No navegador com 2 contas: cada um põe a faixa e os dois veem a mesma faixa comum.

## Dicas pra implementar
- Core: `packages/core/src/orcamento-combinado.ts` (centavos). Web: `features/orcamento-combinado/`.
