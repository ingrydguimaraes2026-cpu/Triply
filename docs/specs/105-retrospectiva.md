# 105. Retrospectiva da viagem

**Fase:** 8 · **Tamanho:** G (feito em M) · **Depende de:** 017, 061, 098, 102 · **Status:** Pronto pra testar (web) · sem banco

## Objetivo
No fim da viagem, cartões "estilo story" com os números: dias, cidades, km, gasto por pessoa, fotos e lugares riscados da lista. Cada cartão vira uma imagem pra postar.

## Por que
- Catálogo K7 (ideia do Spotify Wrapped / Polarsteps). É o momento em que o grupo mostra o app pros amigos.

## Inclui
- Página `/viagem/<id>/retrospectiva`. Na Overview, depois da data final: "A viagem acabou. Ver a retrospectiva →".
- Cartões (só os que têm dado): dias; cidades (Nice → Mônaco → Gênova); km entre cidades e países; gasto **por pessoa** (só o que é do comboio, nunca o pessoal); fotos, posts e curtidas; lugares "já fomos".
- Cartão com as 3 fotos mais curtidas (spec 098).
- "Postar" (celular): gera um PNG 1080×1920 e abre o compartilhar (Instagram, WhatsApp). No computador: "Baixar".
- Imagem desenhada no próprio navegador (canvas), nas cores do app. Nenhuma biblioteca nova.

## Não inclui (fica pra depois)
- Vídeo/animação estilo Wrapped.
- Mapa percorrido dentro da imagem.
- App mobile.

## Dados
- Sem migration.

## Critérios de aceite
- [x] Cartões e textos certos; sem dado, sem cartão (testado: `retrospectiva.test.mjs`).
- [ ] No navegador (celular): viagem com data final passada → Overview → retrospectiva → Postar um cartão no story.
