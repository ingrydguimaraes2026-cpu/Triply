# 060. Malas antes do check-in + dia de passagem

**Fase:** 2 · **Tamanho:** P · **Depende de:** 011, 016, 058 · **Status:** Pronto pra testar (web) · banco **não aplicado**

## Objetivo
Saber se a hospedagem guarda as malas e, no dia de trocar de cidade (ou de passar só um dia num lugar), ver na tela Hoje a hora da saída e onde deixar as malas.

## Por que
- Catálogo E8 (malas antes do check-in) e J5 (dia de passagem). Problema real das reuniões: chegar às 9h com o check-in às 15h, ou passar o dia em Milão com a mala no braço.

## Inclui
- Opção de hospedagem: "Guarda as malas antes do check-in?" (sim / não / perguntar ao anfitrião) + detalhe ("até 22h, € 5 por mala"). Aparece no cartão.
- Na tela Hoje, quando é **dia de passagem** (chega e sai no mesmo dia) ou **dia de trocar de cidade**: "Saída 15:40 pra Roma · em 3 h", se a hospedagem guarda as malas, os guarda-volumes salvos em Lugares desse destino e, se não tiver nenhum, busca de Nannybag/Bounce/Radical Storage.

## Não inclui (fica pra depois)
- Último trem de volta pra base (D9, Fase 5).
- App mobile.

## Dados
- **Migration:** `supabase/migrations/20261030170000_malas_antes_do_checkin.sql` — `hospedagens.guarda_malas`, `guarda_malas_obs`.

## Critérios de aceite
- [x] Valores sim/não/perguntar; valor inventado barrado (testado no banco).
- [x] Dia de passagem / de troca / normal (testado: `hoje.test.mjs`).
- [ ] No navegador: marcar "Sim, até 22h" na hospedagem e ver no cartão; no dia de troca, ver o cartão na Hoje.
