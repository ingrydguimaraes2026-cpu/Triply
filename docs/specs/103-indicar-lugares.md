# 103. Indicar lugares pra um amigo

**Fase:** 8 · **Tamanho:** P · **Depende de:** 016, 061 · **Status:** Pronto pra testar (web) · sem banco

## Objetivo
Na aba Lugares, "Indicar pra um amigo" manda a lista do destino pelo WhatsApp: "Minhas dicas em Nice", com link do Google Maps de cada lugar.

## Por que
- Catálogo N8. Todo mundo tem o amigo que vai pro mesmo lugar no mês seguinte e pede dica.

## Inclui
- Texto pronto: "fomos e recomendo" primeiro (spec 061), depois os mais curtidos. Observação curta entre parênteses.
- Link do Google Maps pela coordenada (spec 064) ou pelo nome + cidade.
- Guarda-volumes só entra se vocês usaram.
- No celular usa o compartilhar do sistema; no computador abre o WhatsApp Web.
- O amigo não precisa do app nem de conta.

## Não inclui (fica pra depois)
- Página pública com o mapa da lista (precisa decidir o que fica público).

## Dados
- Sem migration.

## Critérios de aceite
- [x] Ordem, links e o que entra (testado: `navegacao.test.mjs`).
- [ ] No navegador (celular): Lugares → Nice → Indicar pra um amigo → WhatsApp.
