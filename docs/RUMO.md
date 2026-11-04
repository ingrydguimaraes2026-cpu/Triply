# Rumo do Tripwave (decidido em 03/11/2026, revisto no mesmo dia)

Este é o documento que manda. Quando a FILA, o ROADMAP ou uma spec antiga brigar com ele, **vale o RUMO**.
De onde veio: o benchmark de 11/2026, principalmente a conclusão [`09-ancora-opcoes.md`](benchmark-2026-11/09-ancora-opcoes.md) (com as partes [06](benchmark-2026-11/06-ancoras-eua-europa.md), [07](benchmark-2026-11/07-ancoras-asia-e-mundo.md) e [08](benchmark-2026-11/08-ancoras-fora-de-viagem.md)). A decisão do Victor está registrada em [`HANDOFF-rumo-ancora.md`](HANDOFF-rumo-ancora.md).

> **O que mudou na revisão:** a primeira versão punha a cobrança do Pix como âncora ("viagem sem climão"). O Victor rejeitou. O Pix virou só um detalhe do Financeiro.

## Em uma frase

> **O mapa de todas as viagens e rolês da sua galera.**

Cada lugar onde a galera esteve vira um carimbo, sem ninguém digitar. O mapa do grupo vai acendendo. No fim, a retrospectiva sai pronta pra postar. No resto do ano, o app lembra ("há 1 ano vocês estavam em Floripa") e conta os dias pra próxima.

## Por que essa âncora

- **Âncora que pega é um objeto pronto, bonito o bastante pra virar print:** mapa, passaporte, livro, recap (Polarsteps, Flighty Passport, Spotify Wrapped, Strava).
- **Planejador não é âncora.** Wanderlog, Stippl, Mindtrip e Layla têm uso, mas ninguém lembra deles por uma coisa só.
- **Na Ásia, o hábito vem de colecionar lugares com prova:** carimbos 集章 e 御朱印, cidades que "acendem", o 駅メモ.
- **Ninguém faz isso em grupo.** Polarsteps, Been, Visited e Google Fotos são individuais. Esse é o buraco.
- **Frequência não se inventa, mas se contorna:** rolê, show e bate-volta também contam; a nostalgia ("há 1 ano"); o widget com a contagem na tela do celular.
- **Risco:** virar mais um "países visitados" individual, que já existe e não decolou. A defesa é ser **do grupo** e contar **rolê e bate-volta**, não só país.

## As 3 camadas do app

O app não é só a âncora. Ele tem 3 camadas, e cada uma tem um papel.

| Camada | O que é | Papel | Spec |
|---|---|---|---|
| **1. Âncora** | **Passaporte da galera:** carimbos, mapa do grupo, retrospectiva, "há 1 ano", widget, viagens antigas e rolês | O que aparece no vídeo, na loja e no post. O motivo de lembrar do app. | [118](specs/118-passaporte-da-galera.md) |
| **2. Na viagem** | **"Hoje" com as reservas do grupo:** plano do dia, horários, endereço da casa, voo e check-in de todo mundo numa tela | O que faz abrir o app todo dia durante a viagem. **Alimenta o passaporte:** chegou no lugar do roteiro, sai o carimbo. | [120](specs/120-hoje-com-reservas-do-grupo.md) |
| **3. Base** | **Planejar:** hospedagem com busca e votos, transporte, roteiro por dia, gastos e acertos | Necessária, não é diferencial. **Fica como está, sem inventar coisa nova.** Só conserto e acabamento. | 002, 004, 011, 029, 115, 117 |

**Porta de entrada:** o convite que todo mundo topa **sem instalar** (estilo Partiful). O convidado abre o link no navegador do WhatsApp, diz "tô dentro" e vota. É a opção C da parte 09, usada como porta da A.

**Fase 2:** "copiar a viagem de outro grupo" (estilo Xiaohongshu, opção B da parte 09). Cada passaporte terminado vira um modelo que outro grupo copia com um toque. Só depois que a âncora estiver de pé.

### O volante (como as partes se puxam)

Convite (porta) → a viagem acontece → "Hoje" no dia a dia → carimbos ao vivo → retrospectiva e mapa da galera (âncora) → "há 1 ano" e contagem trazem de volta → próxima viagem → (fase 2) a viagem terminada vira modelo pra outros grupos.

## IA invisível (nunca como âncora)

IA de viagem virou commodity: a Expedia comprou a Layla; Booking e Expedia já rodam dentro do ChatGPT. Então a IA **não aparece como produto**. Ela serve só pra **tirar digitação**:

- print, PDF ou e-mail da reserva vira item no "Hoje" do grupo (estilo TripIt);
- "jantar 84" vira gasto (spec 093);
- legenda da retrospectiva;
- foto ou lugar vira carimbo.

Regra prática: se a tela diz "IA" ou tem um chat como atração, está errado. Se a pessoa digitou menos, está certo.

## Pra quem

- **A pessoa que a gente persegue: o organizador do grupo** (o "amigo que organiza"). É quem baixa o app, quem monta a viagem e quem paga a assinatura.
- **O resto da galera** age pelo link no navegador, sem instalar: topa, vota, vê o plano. Quem instala ganha o passaporte e o "Hoje".
- **As viagens:** réveillon, carnaval, casa de praia, feriado, fim de semana, show, bate-volta, rolê. Grupo de 3 a 15 amigos, no Brasil ou fora.
- **Solo e casal** usam sem atrito (o passaporte funciona com 1 ou 2 pessoas), mas **sem funcionalidade exclusiva** pra eles. O viajante solo que quer conhecer gente (tripbff) é outro produto.

## O que congelar

**Congelar não é apagar.** O código fica; a funcionalidade sai do menu principal (ou fica num canto "mais") e **não se abre spec nova pra ela** até a âncora estar de pé e validada.

Congela (❄):
- câmbio avançado (termômetro, boletim das 12h e 20h, avisos de câmbio);
- documentos de entrada por país, exigências automáticas, ficha do país, frases úteis;
- guia da casa, calendário (ICS);
- central de notificações própria, comentários soltos, menções;
- Passe/RevenueCat (spec 119) e qualquer plano que não seja a assinatura do organizador.

**Não congela** (corrigido nesta revisão):
- **roteiro do dia** (agenda, 029) e **transportes** (004): são a base e alimentam o "Hoje";
- **cofre** (028): vira a pasta das reservas do grupo no "Hoje" (spec 120);
- clima e ponto de encontro: ficam como estão dentro do "Hoje", sem trabalho novo.

Fica (porque serve às 3 camadas): login, convite, convidado sem conta, Explorar/deslizar, hospedagem com votos, roteiro, transportes, Contas (com o Pix copia-e-cola só como detalhe do acerto), fotos, retrospectiva, livro, onde já fui, carimbos e a Norti.

Regra prática: **antes de pegar uma task, pergunte "isso serve à âncora, ao 'Hoje' ou é conserto da base?"**. Se não serve, não é agora.

## O Pix

Sai do papel de âncora. No máximo, o **Pix copia-e-cola fica como detalhe do Financeiro**, no acerto de contas ("pagar a Ana: copiar Pix"). Sem cobrança automática, sem parcelas, sem "barra de quem pagou" como tela principal. O dinheiro da viagem nunca passa pelo Tripwave.

## Onde roda

- **App (Expo) = do organizador e de quem quiser o passaporte.** Criar, planejar, "Hoje", carimbos, mapa, retrospectiva, widget.
- **Web leve = do convidado.** A página do convite (`/v/<código>`): topar, votar, ver o plano. Abre rápido no navegador do WhatsApp, sem login obrigatório. Toda página da web leve mostra o passaporte do grupo como vitrine ("baixe pra ganhar o seu carimbo").
- O resto do site continua como está (planejar no PC, `/espera`), sem funcionalidade nova.

## Como ganha dinheiro

- **Grátis pro grupo, sempre.** Ninguém paga pra topar, votar, ver o plano ou ganhar carimbo.
- **Assinatura do organizador** (ideia inicial; preço a validar): libera mais viagens ao mesmo tempo, leitura de reservas sem limite, retrospectiva completa (molduras, caderno em PDF) e o passaporte da galera completo com viagens antigas.
- **Memória física** (depois): o caderno da viagem impresso, como o livro do Polarsteps, que é de onde o Polarsteps tira o lucro.
- **Nunca cobrar antes de mostrar valor** (o erro do Roameo). O paywall só aparece depois do primeiro carimbo ou da primeira retrospectiva.
- O dinheiro da viagem nunca passa por nós (sem custódia, sem risco tipo Hurb/123milhas).

## Distribuição (metade do trabalho)

- **O post é o anúncio:** carimbo, mapa da galera, retrospectiva e contagem saem em 9:16 com "feito com Tripwave". Todo convite também.
- **Temporada:** réveillon agora (o post do mapa e da retrospectiva de 01 a 05/01 é o momento de viralizar); janela do Carnaval 2027 de 26/12 a 25/01.
- **Campanhas:** "o mapa da sua galera", "Réveillon 2027 carimbado", "há 1 ano a gente estava aqui".
- **TikTok/Reels sem rosto**, várias contas, 1 vídeo por dia: o mapa da galera acendendo, carimbos caindo, "quantos lugares sua galera já carimbou?", a retrospectiva montando sozinha. Os vídeos saem por código (`docs/marketing/video/`).
- **Loja em português:** "mapa de viagens com amigos", "passaporte de viagem", "roteiro de viagem com amigos", "retrospectiva da viagem".
- **Lançamento em grupo VIP** (WhatsApp).

## Como saber se está certo (validação)

**Antes de construir**, fazer **3 telas falsas, uma por opção da parte 09**, e mostrar pra **10 organizadores** (gente fechando réveillon ou carnaval):
- **A:** passaporte da galera (mapa do grupo com carimbos);
- **B:** copiar a viagem de um grupo real;
- **C:** convite que todo mundo topa + contagem no widget.

Perguntar:
- "qual você postaria?";
- "qual faria seus amigos baixarem?".

Leva 1 a 2 dias. **Se a A não ganhar com folga, voltar pro Victor antes de construir a spec 118.**

Sinais de que funciona (primeiros 30 dias depois de lançar a âncora):
- 7 de 10 convidados abrem o link e topam sem instalar;
- 50% das viagens que acontecem ganham pelo menos 3 carimbos sem ninguém digitar;
- 30% dos grupos postam a retrospectiva ou o mapa;
- 20% dos organizadores preenchem pelo menos 1 viagem antiga;
- quem tem o widget abre o app pelo menos 1 vez por semana fora da viagem.

## O que muda nas regras do projeto

- AGENTS.md seção 5: o app é do organizador; o convidado age pela **web leve**; antes de pegar task, perguntar se serve à âncora, ao "Hoje" ou é conserto da base.
- `docs/FILA-completa.md`: a Fase 0 (validação, passaporte e "Hoje") vem antes de tudo; o que está congelado ganha a marca ❄.
- `docs/ROADMAP.md`: a meta passa a ser o passaporte da galera.
