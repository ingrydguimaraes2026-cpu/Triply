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
- **10/11:** [`docs/design/direcao-redesenho/embarque.html`](design/direcao-redesenho/embarque.html): 22 telas clicáveis + regras de navegação. **Decidido (10/11): trabalho em creme** (abas e listas em creme; escuro só nos momentos: abertura, viagem pronta, convite, carimbo, descobrir). **Mapa aprovado (10/11):** 5 abas (Viagem, Roteiro, Reservas, Contas, Fotos), cabeçalho igual em toda aba (viagem, rostos, ajustes), Galera aberta pelos rostos, um só "Próximo passo", fim do "Tudo da viagem".

- **10/11:** passos 1 a 3 abaixo feitos **no app e no site ao mesmo tempo** (pedido do Victor: site no celular junto; o site no computador fica pra depois). Parado antes do passo 4 pra o Victor ver.
  - **Base:** fontes Inter Tight (títulos, 800) + Inter (corpo) no app (`@expo-google-fonts`, `app/_layout.tsx`; os nomes `font-display`/`font-body*` do Tailwind agora apontam pra elas, então todas as telas mudaram juntas) e no site (`@fontsource-variable`, `main.tsx`, `--fonte-titulo`/`--fonte-corpo` no `global.css`). Tokens `trabalho`, `momento`, `fonte`, `titulo()` e `rotulo` no `theme.ts`; molas `mola.entrar` e `mola.macia` no `movimento.ts`; no site `--momento`, `--vidro`, `--mola`, `--macia`.
  - **Navegação:** app em `app/viagem/[id]/(abas)/_layout.tsx` (barra de vidro flutuante com ícone + nome, cabeçalho `src/ui/viagem/CabecalhoDaViagem.tsx`: chip da viagem → Suas viagens, rostos → Galera (`/comboio`), ajustes → `/configuracoes`). As abas recebem `insets.top = 0` e o `insets.bottom` já com a altura da barra, então as telas antigas se ajeitam sozinhas. Site: `.viagem-cab` no `ViagemLayout.tsx` e barra de vidro no `viagem.css` (só abaixo de 1024px). Reservas usa o ícone `hospedagem` nos dois. O "..." do "Tudo da viagem" saiu da aba Viagem e do Hoje (as telas continuam existindo; no computador o menu do site ainda mostra).
  - **Aba Viagem (antes):** app em `(abas)/index.tsx` com `src/ui/viagem/Bilhete.tsx` (Reanimated: chega girando, balança, brilho) e `src/ui/viagem/ProximoPasso.tsx` (próximo carimbo + passaporte num cartão só, com o selo novo caindo); site em `pages/viagem/Overview.tsx` + `features/viagens/Embarque.tsx` + `embarque.css` (mesmo desenho, animação em CSS). Durante = Hoje; depois = Lembranças (como antes, sem o cabeçalho velho).
  - **Conferido:** `npx tsc --noEmit` no app, `npm run build` e `npm run lint` no site, e as 5 abas em 360px logado na Eurotrip, no Expo web (`localhost:8089`) e no site (`localhost:5173`). A barra de lançar gasto das Contas (app) subiu pra ficar acima da barra de vidro. Não conferido: celular de verdade (Expo Go), fase "durante" e "depois", site no computador.
  - **Suas viagens (Início), 10/11, pedido do Victor ("a pessoa leiga se perde no Início"):** app `app/index.tsx` e site `pages/MinhasViagens.tsx` + `suas-viagens.css` viraram a carteira de bilhetes do embarque.html. A próxima viagem fica na frente com a data, o próximo passo e os rostos; as outras e as antigas (carimbadas) ficam atrás. Rolê hoje, "Já fomos pra..." e o Mapa da galera desceram pra baixo da carteira. No site, arquivar e apagar ficaram em "Arquivar ou apagar viagens", no fim. Saiu o "No comboio agora".
  - **Roteiro, 10/11, pedido do Victor:** app `(abas)/roteiro.tsx` e site `pages/viagem/Roteiro.tsx` + `roteiro.css` (classes `.rt-*`) no desenho do embarque.html: rótulo "N dias · X com plano", título grande, "Cidades", dias em chips (SEX/4), o dia em cartões com a hora na esquerda (avisos da spec 122b, comparar, paradas e editar continuam), "Ideias da galera" com foto e rostos (os matches que ainda não estão num dia) e um botão só, "Adicionar" (Passeio ou evento / Ida pra outro lugar), acima da barra. Saíram o mapa ilustrado com folha arrastável e a tela "Matches" separada (o componente `Matches` continua no código). No site a Agenda ganhou `novoPedido`/`aoFecharNovo` pro botão abrir o formulário dela; no celular o PDF e o "Adicionar neste dia" somem (o PDF segue no computador). Conferido em 360px nos dois, com o menu e o formulário de evento abrindo.
  - **Reservas, 10/11:** app `(abas)/reservas.tsx`, `app/transportes.tsx`, `app/hospedagem.tsx`; site `Reservas.tsx`, `Transportes.tsx`, `Hospedagem.tsx` + `viagem-tela.css`, `transportes.css`, `hospedagem.css`. Título grande e troca Transporte/Hospedagem no desenho B; cada deslocamento da lista virou bilhete (cidade pequena + código grande de/para, meio no centro, picote com furinhos, dia/hora e preço embaixo); contagem em cada seção; "Novo deslocamento" virou o botão do canto "Adicionar reserva" (no site, só no celular). Hospedagem: o cartão da cidade ganha a foto da casa escolhida ou da mais votada, quando tem foto. Conferido em 360px nos dois; site no computador não conferido (o bilhete também vale lá).
  - **Contas e Fotos, 10/11:** app `(abas)/contas.tsx`, `(abas)/fotos.tsx` (+ `src/ui/Entra.tsx`, a cascata de entrada com `mola.entrar`, e o cartão do `FeedDaViagem` com raio 20); site `Financeiro.tsx` + `financeiro.css` (classes `.ct-*`) e `Fotos.tsx` + `fotos.css` (classes `.ft-*`). Contas: rótulo "N gastos", título grande, o meu saldo num cartão creme com o número grande ("Você deve pra Ana", câmbio, por pessoa, euros na carteira), "Quem deve quem" sempre à vista com "Saldo de cada um", os gastos em lista (o mais novo em cima, um cartão por dia, ícone da categoria, quem pagou e quantas pessoas, valor na direita) e um botão só, "Lançar gasto", no canto. A barra de frase virou o campo "Escreva rápido: jantar 84" no topo dos gastos (continua abrindo o gasto preenchido). Comentários, compartilhar, filtros, painel de orçamento/câmbio/carteira e exportar continuam no site. Fotos: título grande, Feed | Por dia no segmento redondo do B, posts em cartão creme (no site deixou de ser ponta a ponta no celular), "Por dia" em mosaico (de 3 em 3, uma alta e duas empilhadas) e o botão do canto "Publicar" no lugar do "Postar" do topo. Conferido em 360px nos dois (Eurotrip: saldo, lançar pelo botão e pela frase, Feed e Por dia); site no computador não conferido.
  - **Troca de aba rápida e com movimento, 10/11, pedido do Victor ("sempre aparece carregando, não tem animação"):** app: `useCarregar` ganhou o 3º parâmetro `nome` (as abas, Passagens e Hospedagem usam): a memória por tela já existia, mas a chave era o texto da função, que no celular (Hermes) vira "[bytecode]" pra todas; sem `nome` e sem texto de verdade, agora não guarda. `(abas)/_layout.tsx`: `lazy: false` (as 5 abas carregam por trás na entrada) e `sceneStyleInterpolator` próprio com `transitionSpec` de mola (`mola.macia`): a aba nova aparece e sobe 10px, a que sai some rápido; com Reduzir movimento, fade de 160 ms. `EsqueletoDaAba` (`src/ui/viagem/Esqueleto.tsx`) no lugar da Norti "Carregando" em Roteiro, Contas, Fotos, Passagens e Hospedagem; entrar na viagem mostra o `EsqueletoDaViagem`. Site: `src/lib/memoria.ts` (`useEstadoGuardado`, `lembrar`/`guardar`, limpa ao trocar de conta) nos hooks `useAbaViagem`, `useFinanceiro`, `usePosts`, `useTrajetos`, `useNoitesDaViagem` e nas ideias do Roteiro; `components/ui/Esqueleto.tsx` (+ `ui.css`) no lugar do Carregando; `.aba-entra` no `viagem.css` (aparece e sobe 10px com `--macia`, só fade com reduced motion) envolvendo o `Outlet` (com `key` da aba) e as abas guardadas. Conferido em 360px nos dois trocando as 5 abas duas vezes: 1ª visita com esqueleto, depois nenhuma vez "Carregando", animação em toda troca. Não conferido: celular de verdade (no Expo web o painel do navegador estava escondido, então a fluidez da mola não deu pra julgar lá).
  - O que não mudou ainda: Galera, momentos (passo 4), site no computador.

### Próximo passo exato: levar o B pro Expo (`apps/mobile`)
Régua visual e de navegação: `docs/design/direcao-redesenho/embarque.html` (abrir no Chrome) e as regras da seção "Por que a pessoa não se perde" de lá.
1. **Base visual:** tokens do B no `theme.ts`/`tailwind.config.js` (só a paleta atual): creme nas telas de trabalho, escuro (`#4A2E14` → `#3B2715`) nos momentos; fonte Inter Tight (títulos 800, letras juntas) + Inter (corpo), via `@expo-google-fonts`; molas no `src/ui/movimento.ts` (entrar: damping 16 / stiffness 220; macia: damping 18 / stiffness 160).
2. **Navegação:** `app/viagem/[id]/(abas)/_layout.tsx` com a barra de vidro (ícone + nome nas 5), um cabeçalho comum (chip da viagem que troca de viagem, rostos que abrem a Galera, ajustes). Tirar o "Tudo da viagem" do caminho (o código fica; cada item vai pra aba do assunto, ver a tabela "De onde veio cada tela" no embarque.html).
3. **Viagem (aba 1):** bilhete 3D (Reanimated: chega girando, inclina devagar, brilho), contagem de dias, um cartão "Próximo passo" (juntar ProximoCarimbo + Passaporte), resumo das 4 abas com os mesmos nomes e ícones. Fases: antes / durante (Hoje) / depois (passaporte + história).
4. **Momentos:** carimbo (selo bate + `expo-haptics`), viagem pronta, chamar a galera.
5. Depois: Roteiro, Reservas, Contas, Fotos, Galera, primeiro uso; o convite web (`/v/<código>`) com o "segure pra topar"; por último espelhar no site.
Conferir cada etapa com `npx tsc --noEmit` em `apps/mobile` e no navegador/Expo em 360px. Textos: "galera" no lugar de "comboio", "quem organiza" no lugar de ADM, sem emoji, sem "ponha".

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
