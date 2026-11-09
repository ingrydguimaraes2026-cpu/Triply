# 056. Meu orçamento pessoal

**Fase:** 2 · **Tamanho:** P · **Depende de:** 002, 003 · **Status:** Pronto pra testar (web) · banco **não aplicado**

## Objetivo
No Financeiro, cada um define quanto quer gastar na viagem e vê o gasto real dele: a parte dele nos gastos do comboio + os gastos pessoais, com quanto sobra por dia.

## Por que
- Catálogo H14. O orçamento da 003 é do comboio; cada pessoa tem o próprio limite.

## Inclui
- Cartão "Meu orçamento" (só eu vejo): "R$ 4.000 de R$ 10.000", barra, "40% · sobram R$ 6.000 · R$ 1.500 por dia (4 dias)".
- Antes da viagem divide pelos dias da viagem; durante, pelos dias que faltam (contando hoje); depois, sem "por dia".
- Barra laranja a partir de 80%; "Passou R$ X do seu orçamento" quando estoura.
- Conversão pela mesma cotação do resto do Financeiro.

## Não inclui (fica pra depois)
- Gasto por dia (gráfico) — entra com H15 Relatórios.
- App mobile.

## Dados
- **Migration:** `supabase/migrations/20261030150000_orcamento_pessoal.sql` — `orcamentos_pessoais` (só a pessoa vê).

## Critérios de aceite
- [x] Só a pessoa vê e muda; precisa ser do comboio; meta > 0 (testado no banco).
- [x] Por dia antes/durante/depois, atenção e estouro (testado: `orcamento-pessoal.test.mjs`).
- [ ] No navegador: definir R$ 8.000 e ver a barra mexer ao lançar um gasto dividido.
