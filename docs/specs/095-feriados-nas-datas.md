# 095. Feriados nas datas da viagem

**Fase:** 8 · **Tamanho:** M (feito em P) · **Depende de:** 029 · **Status:** Pronto pra testar (web) · sem banco

## Objetivo
Na Agenda, o dia que é feriado no país onde o comboio está mostra: "Feriado em Nice: Toussaint (All Saints' Day). Lojas, bancos e alguns museus podem fechar."

## Por que
- Catálogo L7 (eventos e feriados). Chegar num domingo de feriado com tudo fechado estraga o dia.
- Dados grátis e sem chave: Nager.Date (feriados oficiais de ~100 países).

## Inclui
- Busca os feriados de cada país e ano dos destinos (uma vez por página aberta).
- Só os feriados que caem enquanto o comboio está num destino daquele país.
- Feriado só de uma região aparece como "Feriado regional".
- Sem internet ou serviço fora: a agenda funciona igual, só sem o aviso.

## Não inclui (fica pra depois)
- Eventos (shows, festivais, jogos): precisa de API paga (Ticketmaster, PredictHQ).
- Aviso no Overview / no celular antes do dia.
- App mobile.

## Dados
- Sem migration.

## Critérios de aceite
- [x] Consultas por país e ano; só feriados no período de cada destino; regional marcado (testado: `feriados.test.mjs`).
- [ ] No navegador: viagem com destino na França em 01/11 → Agenda → dia 1º mostra Toussaint.
