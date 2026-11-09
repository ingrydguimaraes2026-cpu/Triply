# 079. Importar lista do Google Maps

**Fase:** 2 · **Tamanho:** M · **Depende de:** 016 · **Status:** Pronto pra testar (web)

## Objetivo
Trazer uma lista salva no Google Maps ("Quero ir em Nice") pros Lugares do comboio de uma vez.

## Por que
- Catálogo C7. Muita gente já tem a lista pronta no Maps; redigitar desanima.

## Inclui
- Lugares → "Importar do Google Maps": passo a passo do Google Takeout (só "Salvos"), escolher o CSV da lista, ver quantos lugares e os primeiros nomes, escolher destino e tipo, importar.
- Lê o CSV do Takeout (Title, Note, URL, Comment): nomes com vírgula, notas com Enter, repetidos ignorados, link só se for https. Até 200 por vez.

## Não inclui (fica pra depois)
- Importar por print da lista (precisaria de leitura de imagem, Onda 3).
- Coordenadas dos lugares importados (dá pra "Ir" pelo nome; o "Perto de mim" procura na hora).

## Dados
- Nenhuma mudança no banco (insere em `lugares`, regra de sempre).

## Critérios de aceite
- [x] Leitura do CSV com aspas, Enter, repetidos, sem título, link inseguro (testado: `importar-maps.test.mjs`).
- [ ] No navegador: importar o CSV de uma lista do Takeout no destino Nice.
