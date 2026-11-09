# 104. Frases úteis com áudio

**Fase:** 8 · **Tamanho:** M (feito em P) · **Depende de:** 059 · **Status:** Pronto pra testar (web) · sem banco

## Objetivo
Na tela Hoje, "Frases em francês": o essencial pra se virar (obrigado, a conta, onde fica o banheiro, sou alérgico…). Toque e o celular fala.

## Por que
- Catálogo J7. Na hora do aperto ninguém lembra como se diz "água sem gás".

## Inclui
- 14 frases em inglês, espanhol, francês, italiano e alemão, com o português embaixo.
- Idioma pelo país do destino de hoje (França/Mônaco → francês, Argentina → espanhol…). Outros países: inglês. Brasil e Portugal: não aparece.
- Áudio pela voz do próprio celular (Web Speech), um pouco mais devagar. De graça, sem servidor.
- "Traduzir cardápio ou placa pela câmera": abre o Google Tradutor no modo imagem, já no idioma.

## Não inclui (fica pra depois)
- Mais idiomas (japonês, holandês…) e frases escritas pela pessoa.
- Tradução dentro do app.

## Dados
- Sem migration.

## Critérios de aceite
- [x] Idioma pelo país; português fica de fora; todas as línguas com as 14 frases (testado: `frases.test.mjs`).
- [ ] No navegador (celular): Hoje com destino na França → tocar "L'addition, s'il vous plaît" e ouvir.
