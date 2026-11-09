# 080. Volta pra base no bate-e-volta

**Fase:** 2 · **Tamanho:** P · **Depende de:** 004, 058 · **Status:** Pronto pra testar (web) · parcial

## Objetivo
No dia de bate-e-volta (ex.: Nice → Mônaco e volta), a tela Hoje mostra "Volta pra Nice: saída 18:40 de Mônaco · em 3 h", ou avisa "Sem horário de volta marcado. Confira o último trem!", com um atalho de busca.

## Por que
- Catálogo D9. Perder o último trem pra base é o pesadelo do bate-e-volta.

## Inclui
- Cartão na Hoje quando há bate-e-volta saindo hoje.
- Hora da volta (do trajeto de volta) com quanto falta; sem hora, aviso em destaque.
- Link de busca "último trem de Mônaco pra Nice hoje".

## Não inclui (fica pra depois)
- Horário real do último trem (precisaria de API de horários, D10, Fase 8) e push no fim da tarde.

## Dados
- Nenhuma mudança no banco.

## Critérios de aceite
- [x] Acha ida e volta do dia; volta sem hora; outro dia não (testado: `hoje.test.mjs`).
- [ ] No navegador, no dia do bate-e-volta: ver o cartão "Volta pra Nice".
