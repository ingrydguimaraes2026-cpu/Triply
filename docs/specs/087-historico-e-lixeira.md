# 087. Histórico e lixeira de 30 dias

**Fase:** 7 · **Tamanho:** M · **Depende de:** 002, 029, 031 · **Status:** Pronto pra testar (web) · banco **não aplicado**

## Objetivo
Saber **quem editou ou apagou** gasto, lugar, trajeto ou evento da agenda, e **pôr de volta** o que foi apagado sem querer, por até 30 dias.

## Por que
- Catálogo M8. Hoje, apagou, sumiu. Num grupo, alguém sempre apaga o que não devia.

## Inclui
- No Comboio, o cartão "Histórico e lixeira": "Victor apagou o gasto “Café” · 30/10 14:02 · some em 29 dias".
- "Restaurar" pra quem apagou (ou pro ADM): o item volta igual, com o mesmo id. O gasto volta com a divisão.
- Item que tinha destino apagado nesse meio tempo volta sem destino.
- Edições seguidas da mesma pessoa no mesmo item (10 min) viram uma linha só.
- O que foi **criado** continua no sino de novidades (spec 031), não repete aqui.
- Limpeza diária do que passou de 30 dias (pg_cron, ver migration).

## Não inclui (fica pra depois)
- Ver o "antes e depois" de uma edição, e desfazer uma edição.
- Hospedagem, enquetes, posts e listas na lixeira.
- App mobile.

## Quem pode
- Ver: o comboio. Gasto pessoal: só o dono.
- Restaurar: quem apagou ou o ADM. Gasto pessoal: só o dono.
- Ninguém escreve no histórico na mão.

## Dados
- **Migration:** `supabase/migrations/20261031110000_historico_e_lixeira.sql` — tabela `historico_viagem`, gatilhos em `gastos`, `lugares`, `trajetos`, `eventos_agenda`, função `restaurar_da_lixeira`, `privado.limpar_historico`.
- **Agendar** depois de aplicar: `select cron.schedule('limpar-historico', '17 4 * * *', 'select privado.limpar_historico()');`

## Critérios de aceite
- [x] Apagar gasto guarda a divisão e restaurar devolve igual; só quem apagou ou ADM; não restaura 2x (testado no banco).
- [x] Gasto pessoal só o dono vê; destino apagado volta sem destino; apagar a viagem não quebra (testado no banco).
- [x] Frase, dias na lixeira e quem pode restaurar (testado: `historico.test.mjs`).
- [ ] No navegador: apagar um lugar, ir no Comboio, tocar "Restaurar" e ver o lugar de volta na aba Lugares.
