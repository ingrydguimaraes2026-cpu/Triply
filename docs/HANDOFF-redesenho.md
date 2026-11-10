# HANDOFF: redesenho do app inteiro (10/11/2026)

## O que o Victor decidiu
- **Nada novo nas specs**, desde 09/11. O foco é o primeiro uso, depois do feedback da Ingryd: bonito, mas confuso pra uma pessoa comum.
- **Refazer o visual do app inteiro**, todas as telas, não só o onboarding. Fica só:
  - a **paleta** (Couro e laranja, `apps/web/src/styles/global.css`);
  - os **ícones** (`<Icone>` e `<Selo>` do `@together/core`, regras em `docs/design/ICONES.md`).

  O resto pode mudar tudo.
- Palavras dele: "está tudo muito feio", "não tem motion, não tem animação", "não parece que estudamos".

## O que já foi tentado (e não serviu)
- [`docs/design/onboarding-v2.html`](design/onboarding-v2.html), um protótipo HTML com stories, a Norti perguntando, passaporte que abre e convite em cartaz. Reprovado: "muito ruim, feio, nada a ver com o que estudamos".
- O v1 (formulário simples) foi apagado.
- **Por que errei:**
  - Desenhei a partir de **regras de texto** (os artigos de onboarding), não de **telas bonitas de verdade**.
  - As ilustrações eram feitas à mão em SVG e com degradê, e ficaram com cara de amador.
  - O navegador do app do Claude deixa as animações lentas, então o movimento não apareceu do jeito certo.
- **O que vale reaproveitar** é o caminho, não o visual (`docs/ONBOARDING-referencias-2026-11-09.md`, seções 2.1 e 4.1):
  - dois caminhos: quem organiza no app, quem foi convidado na web;
  - a promessa na língua da galera ("o grupo da viagem sem bagunça");
  - a conta pedida só no convite;
  - um próximo passo por vez;
  - o momento de ativação "a galera topou".

## Onde estão as referências
- Os salvos do Victor no X (30/10 a 09/11), com a coleção **"High taste apps" do appllama** (post do jaimin, `x.com/jaimintf/status/2119455296750039509`):
  - Wabi, Duolingo, Opal, Endel, Airbnb, CHANI, Suno, ElevenLabs e outros (41 apps).
  - **É a régua de gosto dele.**
- Onde ver as telas e os fluxos: **appllama**, **Mobbin** e **60fps.design** (animações), indicados pelo Nero.
- `docs/design/referencias/` tem 15 imagens de rodadas anteriores (Thomino, Satya, Tobi, Hilda...), com README.
- Os quadros de vídeo vistos no X:
  - Satya, AI Companion: personagens em cartões grandes e contador gigante;
  - Satya, "anything app": fundo escuro, cartões do próprio produto flutuando em camadas, texto grande embaixo;
  - Airbnb travel map: globo 3D, um título, uma linha e um botão.
- O que dá pra tirar disso tudo:
  - telas cheias com o **próprio produto** aparecendo, sem ilustração inventada;
  - tipografia grande;
  - camadas e profundidade;
  - movimento com propósito.

## O que o app tem pra animar
`apps/mobile` já tem `react-native-reanimated` 4.7, `react-native-gesture-handler`, `expo-haptics` e `expo-linear-gradient`. Não tem Lottie nem Skia.

## Andamento
- **10/11:** passos 1 e 2 feitos. Painel com 3 caminhos (A Diário de bordo, B Embarque, C Galera) em [`docs/design/direcao-redesenho/`](design/direcao-redesenho/README.md). Victor escolheu o **B (Embarque)** e pediu todas as telas, com a navegação, porque a pessoa se perde depois do primeiro uso.
- **10/11:** [`docs/design/direcao-redesenho/embarque.html`](design/direcao-redesenho/embarque.html): 22 telas clicáveis + regras de navegação. **Falta o Victor decidir:** tudo escuro ou trabalho em creme; e se o mapa (5 abas, Galera nos rostos, fim do "Tudo da viagem") está certo. Depois: levar pro Expo, começando pela navegação e pela Viagem.

## Próximo passo exato (sessão nova)
1. **Estudar com os olhos, não com texto.** Abrir no appllama e no Mobbin de 6 a 8 apps da coleção "High taste" (Airbnb, Duolingo, Opal, Wabi, CHANI, Partiful, Polarsteps) e capturar telas e fluxos. Nos vídeos, ver os quadros (no X, a função de "folha de quadros" com canvas funciona).
2. Montar um **painel de direção**: 2 ou 3 caminhos visuais, cada um com prints reais de referência, as regras de tipografia, espaço e profundidade, e como seria o movimento. **Victor escolhe uma antes de qualquer tela.**
3. Com a direção escolhida, redesenhar **as 5 partes do app** (Viagem, Roteiro, Reservas, Contas, Fotos), mais o primeiro uso e o convite web.
   - Protótipo: de preferência **direto no Expo** (Reanimated), pra o movimento ser de verdade, ou em HTML aberto no Chrome, nunca só no navegador do app do Claude.
4. Só depois implementar no app e espelhar no site (`docs/HANDOFF-site-espelho.md`).

## Cuidados
- Responder sempre em pt-BR, sem emoji nas telas e sem "ponha/pôr" nos textos.
- Commit local só; push quando o Victor pedir.
- Nada de Artifact nem nuvem do Claude pra Norti: páginas ficam só em HTML no repositório.
- Branch `monorepo-split`. Os nomes internos `together`/`tripwave` não mudam.
