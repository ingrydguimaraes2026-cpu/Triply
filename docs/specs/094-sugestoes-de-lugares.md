# 094. Sugestões de lugares por destino

**Fase:** 8 · **Tamanho:** M · **Depende de:** 016, 064 · **Status:** Pronto pra testar (web) · sem banco

## Objetivo
Na aba Lugares, cada destino ganha "Sugestões em Nice": as atrações mais conhecidas perto dali, com "Salvar" pra virar lugar do comboio.

## Por que
- Catálogo L4. Quem nunca foi não sabe por onde começar.
- Sem IA e sem custo: dados abertos do OpenStreetMap (Overpass), só o que tem verbete na Wikipédia/Wikidata (sinal de que é conhecido).

## Inclui
- Busca num raio de 5 km do destino: atrações, museus, galerias, mirantes, castelos, monumentos, ruínas, fortes.
- Com Wikipédia primeiro, depois por distância. No máximo 12. Tira o que já está salvo no destino (pelo nome, sem ligar pra acento).
- Nome em português quando o mapa tem.
- "Salvar" cria o lugar (tipo passeio) com a coordenada e o link da Wikipédia; a sugestão some da lista.

## Não inclui (fica pra depois)
- Restaurantes e vida noturna (já tem os links de restaurante, spec 061).
- Foto, nota e horário de cada sugestão.
- App mobile.

## Dados
- Sem migration.

## Critérios de aceite
- [x] Consulta perto do destino; com Wikipédia primeiro; sem repetido nem já salvo; nome em português (testado: `sugestoes.test.mjs`).
- [ ] No navegador: Lugares → Nice → "Sugestões em Nice" → Salvar uma e ver na lista.
