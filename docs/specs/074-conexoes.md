# 074. Conexões e estações

**Fase:** 2 · **Tamanho:** M · **Depende de:** 004 · **Status:** Pronto pra testar (web) · banco **não aplicado**

## Objetivo
O trajeto guarda o terminal/estação de saída e de chegada e até 4 escalas (onde, chega, sai). O cartão mostra "Escala em Frankfurt · 45 min de conexão · conexão curta!".

## Por que
- Catálogo D8. Escala curta é a maior fonte de estresse em voo; troca de trem em Milano Centrale também.

## Inclui
- Formulário: estação/terminal de saída e de chegada; escalas com local, chegada e saída (horário do celular).
- Cartão: "Terminal 2 → Milano Centrale" e cada escala com o tempo de conexão.
- Alerta de conexão curta: avião < 60 min; trem/ônibus < 15 min.

## Não inclui (fica pra depois)
- Avisar no celular sobre conexão curta.
- Status do voo ao vivo (D7, Fase 8).
- App mobile.

## Dados
- **Migration:** `supabase/migrations/20261031050000_conexoes.sql` — `trajetos.estacao_partida`, `estacao_chegada`, `escalas` (JSON, até 4).

## Critérios de aceite
- [x] Escalas como lista de até 4 (testado no banco).
- [x] Leitura segura do JSON, tempo de conexão, curta por meio (testado: `transportes-situacao.test.mjs`).
- [ ] No navegador: voo com escala de 45 min em Frankfurt mostra "conexão curta!".
