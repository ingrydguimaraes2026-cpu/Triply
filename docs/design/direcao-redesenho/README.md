# Direção do redesenho (10/11/2026)

Painel com 3 caminhos visuais pro app inteiro, pro Victor escolher **antes** de redesenhar qualquer tela (`docs/HANDOFF-redesenho.md`).

**Abrir:** duplo clique em `index.html`, no **Chrome**. O navegador do app do Claude deixa as animações lentas. Precisa de internet (fontes do Google Fonts e fotos da Wikimedia).

| Caminho | Ideia | Referências principais |
|---|---|---|
| **A · Diário de bordo** | Editorial e quente: serifa grande com itálico, fotos empilhadas, respiro, movimento macio | Airbnb (pilha de fotos, quantos hóspedes), Timeleft, Retro, CHANI |
| **B · Embarque** | Escuro e tátil: o cartão de embarque em 3D com luz dourada, gesto de segurar pra topar, carimbo | Revolut (cartão pronto), Opal (segurar), Co–Star (globo), Polarsteps |
| **C · Galera** | Social e vivo: rostos em bolhas que caem, adesivos (selos), letra gorda, festa só nos marcos | Retro (retrospectiva), Wabi (bolhas), corner, Bump, Partiful, Duolingo |

Os três usam a mesma viagem (Lisboa, 5 pessoas) e só a paleta Couro e laranja e os ícones/selos do `@together/core`.

## Escolha (10/11/2026)
O Victor escolheu o **B · Embarque** e pediu pra ver todas as telas, porque depois do primeiro uso a pessoa também se perde no app. Resposta: [`embarque.html`](embarque.html), um protótipo clicável com 22 telas (primeiro uso, convite web, Suas viagens, Viagem antes/durante/depois, Galera, Roteiro, Descobrir, Reservas, onde ficar, carimbo, Contas, Lançar gasto, Fotos), a navegação nova (as 5 abas, cabeçalho fixo, um próximo passo, fim do "Tudo da viagem") e uma chave pra comparar "tudo escuro" com "trabalho em creme".

## Arquivos
- `embarque.html`: o caminho B com todas as telas, clicável, e as regras de navegação.
- `index.html`: o painel (lado a lado, tabela de comparação, regras de tipografia, espaço, profundidade e movimento de cada caminho, referências).
- `icones.js`: ícones e selos de verdade, gerados do core por `node docs/design/direcao-redesenho/gerar-icones.mjs`. Não editar à mão.
- `refs/folha-*.jpg`: vídeos do [60fps.design](https://60fps.design) cortados em 8 quadros (da esquerda pra direita).
- `refs/telas-*.jpg`: telas reais da loja e do primeiro uso, tiradas do [appllama](https://appllama.io/u/jaimin/high-taste-apps) (coleção "High taste apps" do jaimin) e, pra Partiful e Polarsteps, da App Store.

## Como foi capturado
Playwright (Chromium headless) abrindo cada página: nos vídeos, pausa e pula pra 8 momentos; nas telas, monta uma tira com as imagens públicas da página. O appllama mostra só as telas da loja e 2 telas de primeiro uso por app sem assinatura; Mobbin pede conta e não foi usado.

## Próximo passo
O Victor escolhe A, B, C ou uma mistura em que um manda. Depois: redesenhar as 5 partes (Viagem, Roteiro, Reservas, Contas, Fotos), o primeiro uso e o convite web, de preferência direto no Expo com Reanimated.
