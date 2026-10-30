# 097. Link de rede social vira lugar

**Fase:** 8 · **Tamanho:** G (feito em P) · **Depende de:** 016, 072 · **Status:** Pronto pra testar (web) · usa a função `previa-link` (spec 072)

## Objetivo
Colar o link de um post do Instagram, TikTok ou YouTube no formulário de lugar e o app já preencher o nome do lugar (quando o post tem "📍 Nome") e a observação "Visto no Instagram de @fulano".

## Por que
- Catálogo C6. É assim que o grupo descobre lugar hoje: alguém manda um reel no WhatsApp e ele se perde.

## Inclui
- Campo Link do formulário de lugar (novo lugar): se for Instagram, TikTok ou YouTube, lê a prévia do post pela função `previa-link` (spec 072).
- Nome: o texto depois do 📍 na legenda ("📍 Café de Flore, Paris"). Só preenche se o nome estiver vazio.
- Observação: "Visto no Instagram de @anaviaja" (se estiver vazia).
- O link fica salvo no lugar, pra rever o vídeo depois.

## Não inclui (fica pra depois)
- Achar o lugar quando o post não tem 📍 (precisaria de IA).
- Compartilhar direto do app do Instagram pro Together (Web Share Target).
- App mobile.

## Riscos
- Instagram e TikTok às vezes não mostram a legenda pra robôs; aí o app só não preenche, e a pessoa digita o nome. A função usa um "User-Agent" honesto (não finge ser o Facebook).

## Dados
- Sem migration. Nenhuma função nova (reaproveita `previa-link`).

## Critérios de aceite
- [x] Reconhece a rede pelo link; tira o nome do 📍 e o @ do autor (testado: `previa.test.mjs`).
- [ ] No navegador: Lugares → Adicionar → colar um reel com 📍 → ver o nome preenchido.
