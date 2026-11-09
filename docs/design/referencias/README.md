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

## Menos conteúdo, mais conceito (2ª rodada, 02/11)

| Print | De onde | O que aprender |
|---|---|---|
| `12`, `13` | [@tobiadonadon_, artigo com 590 mil views](https://x.com/tobiadonadon_/status/2106430529113301163) | O defeito de app feito com IA: "os mesmos cartões arredondados, o mesmo layout de painel, nenhuma ideia por trás". **É a nossa grade de 11 cartões.** Remédio: começar de um **conceito** (app de corrida = pista de atletismo; app de sono = vila adormecendo) e tirar dele tipografia, layout, cor e movimento. Processo: conceito → 3 direções → desenho → ver no tamanho do iPhone → crítica (cartões repetidos, hierarquia fraca, espaçamento torto) → refazer. No antes e depois dele: **um número gigante, um cartão escuro de destaque, o resto discreto**. |
| `14` | [@3xProduct_D (25 mil views)](https://x.com/search?q=%22progressive%20disclosure%22%20ux) | **Complexidade em camadas.** "Antes" põe tudo no mesmo nível e obriga a pessoa a descobrir o que vai junto; "depois" agrupa e mostra o resto só quando ela pede. |
| `15` | [@askwhykartik (41 mil views)](https://x.com/askwhykartik/status/2069041508121186685) | Apps com mascote: a pessoa esquece a tela, lembra do personagem. **Um mascote só** (a Agulha), poucas poses (acenando, apontando, comemorando), **movimento sutil**, e só onde importa: onboarding, tela vazia, progresso, conquista, marco. Nunca em toda tela. Os "baratos" têm cor demais, animação demais, coisa demais na tela. |

Comentário que resume (resposta ao Theo, 48 mil views): o que a IA ainda faz mal em código é **UX: hierarquia, camadas, navegação, rótulos**. Foi exatamente o que aconteceu com a gente: cada funcionalidade ganhou um lugar na tela, ninguém decidiu a hierarquia.

### Nosso conceito (proposta)
**O passaporte do comboio.** A viagem é um passaporte: cada etapa resolvida carimba um selo; a capa é a foto do destino; a página de hoje mostra só o próximo carimbo; a Agulha aparece só nos marcos. Tipografia, cores (couro e dourado) e os selos que já temos saem daí.
