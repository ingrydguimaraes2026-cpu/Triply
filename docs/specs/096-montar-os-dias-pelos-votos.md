# 096. Montar os dias pelos votos

**Fase:** 8 · **Tamanho:** G (feito em M) · **Depende de:** 016, 022, 029, 066 · **Status:** Pronto pra testar (web) · sem banco

## Objetivo
Na aba Lugares, "Montar os dias pelos votos" propõe o que fazer em cada dia do destino, a partir do que o comboio curtiu. A pessoa vê a proposta e escolhe **Pôr na agenda** ou **Descartar**.

## Por que
- Catálogo L5. Depois de salvar 15 lugares, ninguém quer montar o quebra-cabeça de qual dia fazer o quê.
- Sem IA: regra simples e explicável.

## Inclui
- Regra:
  1. quem “não abre mão” (spec 066) primeiro, depois os mais curtidos (spec 022);
  2. cada dia começa com um dos mais importantes; os outros vão pro dia cujo começo é mais perto (com coordenada, spec 064); sem coordenada, pro dia mais vazio;
  3. até 3 passeios por dia (10:00, 15:00, 17:30) e 1 comida (13:00);
  4. dentro do dia, a ordem segue o caminho mais curto;
  5. o que não cabe aparece em "Não couberam".
- Ignora lugares já visitados e guarda-volumes.
- "Pôr na agenda" cria os eventos (com "Montado pelos votos" na observação). Depois dá pra mudar ou apagar na Agenda.

## Não inclui (fica pra depois)
- Considerar horário de funcionamento e dias fechados.
- Considerar o que já está marcado na agenda naquele dia.
- Ajustar a proposta arrastando itens.

## Dados
- Sem migration.

## Critérios de aceite
- [x] Prioridade e votos, perto junto, comida no meio, sem coordenada no dia mais vazio, sobras (testado: `montar-dias.test.mjs`).
- [ ] No navegador: curtir 5 lugares de Nice → "Montar os dias pelos votos" → Pôr na agenda → ver na Agenda.
