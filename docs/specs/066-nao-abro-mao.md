# 066. "Não abro mão"

**Fase:** 2 · **Tamanho:** M · **Depende de:** 016, 022 · **Status:** Pronto pra testar (web) · banco **não aplicado**

## Objetivo
Cada pessoa marca até 3 lugares obrigatórios por destino. O lugar mostra "obrigatório pra Ana, você", pra o comboio montar o dia respeitando a vontade de todos.

## Por que
- Catálogo A6. "Interesses diferentes na programação" é o atrito nº 1 (42,7%). Curtir (spec 022) diz o que é legal; "não abro mão" diz o que não pode faltar.

## Inclui
- Botão "Não abro mão" em cada lugar (liga/desliga o seu).
- No máximo 3 por pessoa em cada destino (garantido no banco). Passou: aviso "tire um pra marcar outro".
- "obrigatório pra …" embaixo do lugar.

## Não inclui (fica pra depois)
- Conferir na agenda se o "não abro mão" de todos entrou (vai com L5 "montar o dia pelos votos").
- App mobile.

## Dados
- **Migration:** `supabase/migrations/20261030230000_nao_abro_mao.sql` — `lugar_prioridades` + gatilho do limite de 3.

## Critérios de aceite
- [x] Limite de 3 por destino; cota separada por destino e por pessoa; comboio vê; só tira o seu; estranho não vê (testado no banco).
- [ ] No navegador: marcar 3 em Nice, tentar o 4º e ver o aviso.
