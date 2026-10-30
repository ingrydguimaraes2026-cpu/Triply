# 077. Tempo entre compromissos

**Fase:** 2 · **Tamanho:** M · **Depende de:** 029 · **Status:** Pronto pra testar (web)

## Objetivo
Na Agenda do dia, um aviso quando um compromisso começa antes do anterior acabar ("⚠ Começa antes de acabar Nice → Roma") ou com menos de 30 min de folga ("⏱ Só 20 min depois de Almoço").

## Por que
- Catálogo B6. "Descumprimento de horários" (36,3%) muitas vezes nasce de um plano impossível no papel.

## Inclui
- Trajeto ocupa da partida até a chegada (quando chega no mesmo dia); evento é um ponto no horário.
- Conflito (por cima de um trajeto) em laranja escuro; apertado (< 30 min) em caramelo.

## Não inclui (fica pra depois)
- Tempo de deslocamento real entre os lugares (precisaria de API de rotas; nada inventado).
- Duração dos eventos (hoje evento não tem hora de fim).

## Dados
- Nenhuma mudança no banco. `montarAgendaDoDia` passa a informar `fim` do trajeto.

## Critérios de aceite
- [x] Conflito com trajeto, folga curta, item sem hora ignorado (testado: `hoje.test.mjs`).
- [ ] No navegador: marcar "Almoço 13h" num dia com trem 9h15–15h40 e ver o aviso.
