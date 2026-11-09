# 006. Overview com dados reais

**Fase:** 2 · **Tamanho:** P · **Depende de:** 002, 003, 004, 005 · **Status:** A fazer

## Objetivo
Os cartões da Overview que hoje estão vazios passam a mostrar um resumo real de cada aba, pra pessoa entender a viagem inteira numa olhada.

## Por que
Do áudio: a Overview "reúne todas as informações". Hoje Orçamento, Próximo trajeto e Fotos mostram só o estado vazio.

## Inclui
- **Orçamento:** gasto até agora de quanto, com a barra (spec 003). Sem orçamento, mostra só o total gasto.
- **Próximo trajeto:** o próximo da lista (spec 004): "Nice → Mônaco · trem · amanhã 09:10".
- **Fotos:** as 4 a 6 mais recentes em miniatura (spec 005).
- **"Dia X da viagem":** quando a viagem está acontecendo, destacar o destino de hoje no roteiro e no mapa (usa a spec 001).
- Cada cartão continua sendo um atalho pra aba dele.

## Não inclui
- Gráficos.
- Feed de "o que aconteceu" (quem lançou o quê).

## Telas
Os mesmos cartões de hoje, em `src/pages/viagem/Overview.tsx`. Cada cartão mantém o estado vazio quando não tem dado.

## Dados
Nada novo. Reaproveita as funções das specs 002 a 005, buscando só o resumo (sem trazer listas inteiras).

## Critérios de aceite
- [ ] Com gastos lançados, o cartão de orçamento mostra o total e a porcentagem.
- [ ] O próximo trajeto bate com o que aparece em Transportes.
- [ ] As miniaturas abrem a aba Fotos.
- [ ] Durante a viagem, o destino de hoje aparece destacado.
- [ ] A Overview carrega rápido: as buscas dos cartões rodam em paralelo, não uma depois da outra.

## Perguntas em aberto
- O que mostrar quando a viagem acabou? (Sugestão: um convite pra retrospectiva, Fase 3.)

## Dicas pra implementar
- Cada cartão pode ter o próprio hook (`useResumoFinanceiro`, `useProximoTrajeto`, `useUltimasFotos`) em `src/features/<módulo>/hooks.ts`.
- Use `Promise.all` quando buscar várias coisas ao mesmo tempo.
