# Referências do X (02/11/2026)

Busca feita no X logado (Principais, Mais recentes e Mídia) pra repensar a tela da viagem e a jornada (`docs/HANDOFF-tela-da-viagem.md`).
"Mais recentes" com termo genérico ("travel app") só trouxe barulho; o que serve está em Principais e Mídia com termo de design.

| Print | De onde | O que aprender |
|---|---|---|
| `01`, `02` | [@ThominoDesign](https://x.com/ThominoDesign/status/2115805863352897674) (feito com Expo + NativeWind + Reanimated, igual a nós) | Criar viagem com **uma pergunta por cartão** (número grande que desliza, 3 tracinhos de progresso). No fim, **um cartão de foto cheia**: "Sua viagem está pronta · 7 dias em Bali" + seta. |
| `03` | [@TonmoyD62313245](https://x.com/search?q=AI%20Travel%20Planner%20Mobile%20App%20UI) | Passos da viagem num **caminho vertical** (voo, hotel, comida, passeios) e "**Trip Ready 85%**" com um **carrinho andando na estrada**. Pra nós: o comboio andando até o destino. |
| `04` | [@_DanielsSharon](https://x.com/search?q=%22group%20trip%22%20app%20design) | Onboarding de viagem em grupo: **frase enorme** ("Viagem é melhor junto", "Todo mundo opina"), fotos tipo polaroid, 2 botões ("Planejar a 1ª viagem" / "Entrar num grupo"). |
| `05`, `11` | [@code_blve](https://x.com/code_blve/status/2071935745938399555), [@rakibulism](https://x.com/rakibulism/status/2092705893242814564) | Home = **um cartão de foto grande** (carrossel), uma linha de saudação, barra de baixo com 3 ou 4 ícones. Nada de grade. |
| `06` | [@uiuxjoy99](https://x.com/uiuxjoy99/status/2117137552876716188) | "Trip to Japan **62%**": **um número gigante** e embaixo só marcos "feito / próximo". |
| `07` | [@Choley_Bhature](https://x.com/Choley_Bhature/status/2115874047318016007) | O que traz a pessoa de volta: **recompensa surpresa**, **sequência sem fim** (ofensiva), **placar visível** do grupo. |
| `08`–`10` | [@heysatya_](https://x.com/heysatya_) ("o app tem 30 segundos pra convencer") | Onboarding: cada tela = **um objeto 3D animado** + título de 3 palavras + 1 linha + "Continuar". Última tela: **"Colecione todos" com medalhas** → nossos **selos** como coleção. |

Também vale: o post do Polarsteps que viralizou (50 mil views) elogia que o app **monta sozinho a história da viagem** com as fotos e o lugar. Encanta porque não dá trabalho → nossa Retrospectiva pode ser isso.

## Regras que saem daqui
1. **Foto manda, texto é 1 linha.** Título curto e grande; subtítulo só quando precisa.
2. **Uma ação por tela.** A tela da viagem mostra só a próxima coisa a fazer.
3. **Progresso visível e bonito**: um número grande ou o comboio andando na estrada, não uma lista.
4. **Selos viram coleção**: cada etapa resolvida dá um selo no passaporte da viagem (e do perfil).
5. **O grupo é o placar**: quem já votou, quem falta. É o que faz voltar.
6. **Animação com propósito**: um objeto que se mexe por tela (Reanimated já está no projeto).
