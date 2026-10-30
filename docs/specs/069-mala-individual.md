# 069. Minha mala

**Fase:** 2 · **Tamanho:** M · **Depende de:** 048 · **Status:** Pronto pra testar (web) · banco **não aplicado**

## Objetivo
Cada pessoa tem o checklist da própria mala na Overview, começando por um modelo pelo clima (frio, meia-estação, calor) e pela duração da viagem.

## Por que
- Catálogo I7. Complementa o "Quem leva" do grupo (spec 048): o que é de todos lá, o que é seu aqui.

## Inclui
- Cartão "Minha mala" (só você vê).
- Vazia: escolher o modelo e "Montar minha lista". Quantidades de roupa pelos dias da viagem (até 7: dá pra lavar no caminho).
- Marcar "já está na mala", acrescentar e apagar itens. "8 de 20 na mala".

## Não inclui (fica pra depois)
- Escolher o modelo sozinho pelo clima previsto (spec 023).
- Reaproveitar a mala de uma viagem anterior.
- App mobile.

## Dados
- **Migration:** `supabase/migrations/20261031010000_mala_individual.sql` — `mala_itens` (só a pessoa vê).

## Critérios de aceite
- [x] Só a pessoa vê; precisa ser do comboio; quantidade 1–99 (testado no banco).
- [x] Modelo por clima e dias, progresso (testado: `mala.test.mjs`).
- [ ] No navegador: montar a lista "Frio" e marcar itens.
