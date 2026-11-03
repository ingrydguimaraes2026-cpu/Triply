# Mascote: a bússola (Norti)

*02/11/2026. Nome do mascote em discussão: **Norti** (ver NOME-E-VOZ.md, rodada 7). Hoje no app ela se chama Agulha.*

## Como ela é hoje

Uma bússola dourada com chapéu de safári, olhos grandes, bochechas rosadas e um braço que acena. Tem 4 humores no app: parada, feliz, dormindo e pensando. Desenho em SVG (`apps/web/src/components/ui/Agulha.tsx` e `apps/mobile/src/ui/Agulha.tsx`).

**O que já está bom:** tem significado (bússola = acha o caminho do grupo), cores da marca (couro e caramelo) e é reconhecível pequena.

**O que falta pro marketing:**
- Expressões fortes pro humor dos vídeos (brava, chocada, chorando de rir, cobrando).
- Poses e figurinos pros nichos (réveillon, Carnaval, praia).
- Arquivos com fundo transparente e animações prontas pra colocar em cima de trend.
- Uma ficha do personagem, pra sair igual em todo lugar.

---

## A ferramenta: Mascot Designer (skill grátis do Tobi)

Fonte: [artigo do Tobi no X](https://x.com/tobiadonadon_/status/2117008336927297938) e [página da skill](https://www.tobiadonadon.com/projects/construct/material/setups/mascot-designer).

**Como funciona:**
1. Faz 4 perguntas sobre o que o app representa.
2. Escreve o **significado**: uma ideia, uma característica marcante e um formato que dá pra reconhecer com 64 pixels.
3. Mostra **3 ideias diferentes**. Você escolhe uma e ela desenha todas as poses.

**O que entrega:**
- 8 movimentos animados: oi, pensando, comemorando, ops, dormindo, apontando, amor e aparecendo.
- Ficha do personagem (nome, significado, cores, poses).
- **9 poses em PNG transparente de 1024 px** (as que mais importam pro marketing).
- Um vídeo 1080p do mascote dentro de um app de iPhone e de Mac.
- Arquivos pro app (Xcode e web) e um guia de onde usar cada movimento (onboarding, telas vazias, espera, conquistas, erros).

**6 estilos:** massinha (soft clay), pelúcia, peludinho, boneco colecionável (designer toy), traço chapado e adesivo retrô.

**Precisa de:**
- Claude Code e Node.js 18 ou mais novo.
- **Uma conta da OpenAI** (chave de API ou ChatGPT pelo Codex) pra desenhar um mascote exclusivo: cerca de 12 imagens. Sem ela, só dá pra partir de 20 mascotes prontos (tem um de viagem, o "Scout"), o que não serve pra nós porque já temos a bússola.

---

## Respostas pras 4 perguntas (rascunho pra Ingryd ajustar)

| Pergunta | Resposta |
|---|---|
| O que o app representa? | A viagem com a galera que finalmente sai do papel, sem briga por dinheiro. |
| Qual sentimento? | Alívio e animação: "agora vai". |
| Que papel o mascote tem? | O amigo que sempre acha o caminho e organiza tudo, mas perde a paciência com quem não paga o Pix. |
| Pra quem? | Brasileiros de 18 a 35 que viajam com amigos. Gen Z, TikTok. |

**Significado proposto:**
> "A Norti é uma bússola de chapéu de safári cuja agulha aponta pro próximo destino do grupo: com ela, a viagem sempre acha o caminho."

**Característica marcante: a agulha.** Ela vira a forma de a Norti se expressar:
- gira rápido quando está confusa ou carregando
- **aponta pro amigo que está devendo**
- aponta pra cima quando comemora
- fica caída quando está triste

**Estilo sugerido:** **massinha (soft clay)**, com acabamento de curta da Pixar. Combina com as cores quentes de couro e caramelo e fica bonito em vídeo. Alternativa: **boneco colecionável**, se a Ingryd quiser mais atitude pras trends.

---

## Poses extras pro marketing (além das 8 da skill)

| Pose | Pra quê |
|---|---|
| Cobrando: agulha apontando pra câmera, "cadê o Pix?" | O formato "o amigo que nunca paga" |
| Desesperada com o celular (grupo com 300 mensagens) | POV do organizador |
| De branco, com taça | Réveillon |
| Com fantasia e confete | Carnaval 2027 |
| De óculos escuros e boia | Praia, bate-volta |
| Puxando uma mala | Lista de espera, "em breve" |

---

## ✅ Escolhido: Norti "Pin" (02/11/2026)

A bússola em forma de pino de mapa, com chapéu de safári e a agulha vermelha acima dos olhos. "O caminho e o destino da viagem do grupo."

**Arquivos pro marketing** (cópia em [`norti/`](norti/), original em `~/Mascots/Norti/`):
- `norti/png/`: as 9 poses em PNG 1024 px com fundo transparente (oi, pensando, comemorando, ops, dormindo, apontando, amor, parada, piscando). Prontas pra colocar em cima de vídeo.
- `norti/Norti character sheet.png`: a ficha do personagem.
- `norti/Norti.mp4`: vídeo de 32 s da Norti dentro de um app de iPhone e de Mac, fazendo todos os movimentos.

**Arquivos pro app** (cópia no repo, pra uma **sessão de dev** colocar no código):
- `norti/app-web/`: componente `<mascot-view>` com as animações (`mascot.js`, poses em `.webp`, exemplo em `index.html`).
- `norti/app-ios/`: `Norti.xcassets` e `NortiView.swift` (Xcode e SwiftUI).
- `norti/vetor/`: as 9 poses originais em SVG, pra redesenhar ou fazer figurino.
- `norti/mascot.json` e `norti/brief.json`: configuração e significado da mascote. `norti/HOW TO USE.md`: onde usar cada movimento.

**Como foi feito:** as poses foram desenhadas pelo Claude em vetor (script em scratchpad, a partir do desenho do quadro "Norti Redesign"), e a skill Mascot Designer limpou, alinhou, animou e gerou a ficha e o vídeo. Sem conta da OpenAI.

## Redesenho (02/11/2026)

Sem conta da OpenAI, o desenho é feito pelo Claude em vetor e a skill cuida das animações, da ficha e do vídeo.

- **Quadro de design com 3 caminhos:** [Norti Redesign](https://claude.ai/artifact/GU32RoWEYJWRyuM8t1hCoP). **Polida** (a de hoje, mais limpa), **Topete** (sem chapéu, a agulha sai pelo topo) e **Pin** (corpo de pino de mapa).
- **9 poses da versão atual** já desenhadas em `~/Mascots/Norti/raw/` (parada, piscando, acenando, pensando, comemorando, ops, dormindo, apontando, amor), caso a escolha seja manter a de hoje.
- **Próximo passo:** escolher o caminho, desenhar as 9 poses dele e rodar a skill pra gerar animações, ficha e vídeo.

## Análise de segurança da skill (02/11/2026)

Arquivo: `~/Downloads/mascot-designer.zip` (330 KB, 47 arquivos). Código lido antes de rodar. **Veredito: parece seguro**, sem nada escondido.

| O que olhei | O que achei |
|---|---|
| Onde instala | Copia a skill pra `~/.claude/skills/mascot-designer` e cria `~/.mascot-designer` com 2 pacotes conhecidos (sharp pra imagens, playwright-core pra gravar o vídeo) e o ffmpeg se não tiver. Uns 40 MB. Nada no sistema todo. |
| Internet | Só fala com **api.openai.com** (pra desenhar, com a sua chave) e com o site do Tobi (só baixa as imagens dos 20 mascotes prontos, se usar). **Não manda dados pra mais ninguém.** |
| Chave da OpenAI | Fica em `~/.mascot-designer/.env`, em texto puro no seu computador. Só é enviada pra OpenAI. |
| Codex | Se usar a conta do ChatGPT pelo Codex, ele roda numa pasta temporária e com permissão limitada (`workspace-write`). |
| Onde salva o mascote | `~/Desktop/Mascots/<Nome>/` (ou `~/Mascots` se não tiver Área de Trabalho). |
| Custo | Umas 12 imagens na sua conta da OpenAI. |

**Cuidados:**
- A etapa 8 da skill ("pôr o mascote no app") mexe no código do app. **Pular** e deixar pra uma sessão de dev.
- Se rodar dentro da pasta do app, ela lê README, CSS e cores pra entender o app. Melhor rodar fora e passar o resumo do rascunho acima.
- A skill foi feita pra criar personagem a partir do significado. Pra manter a nossa bússola, descrever o personagem na hora da entrevista: "bússola dourada com chapéu de safári, olhos grandes, bracinhos, agulha vermelha". Ela vai redesenhar no estilo escolhido.

## Passo a passo

1. **Baixar a skill** pela página do Tobi. O botão "Get it free" pede e-mail pra newsletter.
2. **Ler o código antes de rodar**, porque é ferramenta de terceiro.
3. Rodar numa **pasta separada do app** (ex.: `together/mascote-norti/`), pra não mexer no código.
4. Colocar a chave da OpenAI **direto na skill**, nunca no chat.
5. Responder as 4 perguntas com o rascunho acima e pedir pra partir da bússola de chapéu de safári que já existe.
6. Escolher 1 das 3 ideias, junto com a Ingryd.
7. Usar as 9 poses em PNG no marketing. Entregar os arquivos de Xcode e web pra uma **sessão de dev** colocar no app.
