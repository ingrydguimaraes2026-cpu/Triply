# Rumo do Tripwave (decidido em 03/11/2026)

Este é o documento que manda. Quando a FILA, o ROADMAP ou uma spec antiga brigar com ele, **vale o RUMO**.
De onde veio: o benchmark de 11/2026 ([`docs/benchmark-2026-11/00-sintese.md`](benchmark-2026-11/00-sintese.md)) e o estudo do Enxovaly ([`05-enxovaly.md`](benchmark-2026-11/05-enxovaly.md)).

## Em uma frase

> **Viagem sem climão.** Você só organiza a viagem. O Tripwave cobra a galera por você.

O Tripwave tira a viagem do grupo do WhatsApp e leva até o Pix pago. O organizador para de ser o chato que cobra. O resto do grupo só toca no link.

## Pra quem

- **A pessoa:** **o organizador** da viagem com os amigos (o "amigo que organiza"). É quem baixa o app, quem paga a assinatura e quem sofre hoje.
- **O momento:** do "bora?" no grupo até a data da viagem, e o acerto logo depois. **A data é o prazo**, como o nascimento é o prazo no Enxovaly.
- **As viagens:** réveillon, carnaval, casa de praia, feriado, show, fim de semana. Grupo de 4 a 15 amigos, no Brasil ou fora.
- **O resto do grupo** ("o que só faz a mala") **não instala nada**: vota, topa e paga pelo link no WhatsApp.

## O ciclo (o produto inteiro cabe aqui)

| # | Passo | O que acontece | Já temos uma base em |
|---|---|---|---|
| 1 | **Começar em 30 segundos** | O organizador escreve uma frase ("réveillon em Floripa, 8 amigos, R$ 2 mil cada"), cola um print do grupo ou um link (Airbnb, TikTok). A IA devolve o rascunho: destino, datas, 2 ou 3 casas, custo por pessoa em R$ e a mensagem pronta pro grupo. | 093, 097, 114, 116 |
| 2 | **Decidir pelo link, sem instalar** | Cartão no WhatsApp. Cada amigo abre no navegador, diz se topa, vota na casa e nas datas. Barra "faltam 2 votarem"; o lembrete sai do Tripwave, não do organizador. | 018, 021, 025, duelo da hospedagem |
| 3 | **Fechar e cobrar (o diferencial)** | Fechou a casa: cada um recebe a sua parte com **Pix copia-e-cola, prazo do sinal e parcelas** (se a casa foi no cartão parcelado). Barra "faltam 2 pagarem", lembrete automático. O dinheiro **não passa pelo Tripwave**. | Contas, acertos |
| 4 | **Contagem até a data** | Tela principal do organizador: "Floripa em 23 dias" + o que falta **nesta semana** (casa, sinal, transporte, mala) + quem não pagou. Cartão de contagem pra postar. | 049, 032 |
| 5 | **Na viagem** | Gasto por frase ou voz ("jantar 84") e o placar de quem deve. | 093, Contas |
| 6 | **Depois** | Acerto final com Pix e a **retrospectiva pros stories** ("Réveillon 2027: 8 amigos, R$ 14.200, 0 brigas"), que já puxa a próxima viagem. | 105, Fotos, carimbos |

O detalhe de cada passo está na spec [118](specs/118-ciclo-viagem-sem-climao.md).

## O que congelar

**Congelar não é apagar.** O código fica; a funcionalidade some do menu (ou fica num canto "mais") e **não se abre spec nova fora do ciclo** até o ciclo estar redondo e validado.

Congela:
- câmbio avançado (termômetro, boletim das 12h e 20h);
- documentos de entrada por país, clima, ficha do país, frases úteis;
- cofre de documentos, guia da casa, calendário;
- central de notificações própria, comentários soltos;
- transportes detalhados e roteiro hora a hora (fica o básico do roteiro);
- Passe/planos novos que não sejam a assinatura do organizador.

Fica (porque serve ao ciclo): login, convite, convidado sem conta, Explorar/deslizar (vira parte do passo 1 e 2), hospedagem com votos, Contas, contagem, fotos e retrospectiva, carimbos e a Norti.

Regra prática: **antes de pegar uma task, pergunte "isso serve a um dos 6 passos?"**. Se não serve, não é agora.

## Onde roda

- **App (Expo) = do organizador.** Criar, acompanhar, cobrar, lançar gasto, retrospectiva.
- **Web leve = do convidado.** Só a página do convite, de votar, de topar e de pagar (Pix). Abre rápido no navegador do WhatsApp, sem login obrigatório.
- O resto do site continua como está (planejar no PC, `/espera`), sem funcionalidade nova.

## Como ganha dinheiro

- **Grátis pro grupo, sempre.** Ninguém paga pra votar ou pagar a sua parte.
- **Assinatura do organizador** (ideia inicial; preço a validar): a 1ª viagem é grátis até a cobrança funcionar; a assinatura libera mais viagens ao mesmo tempo, IA sem limite, lembretes automáticos de cobrança e a retrospectiva completa.
- **Nunca cobrar antes de mostrar valor** (o erro do Roameo). Teste grátis só depois do momento "uau".
- O dinheiro da viagem nunca passa por nós (sem custódia, sem risco tipo Hurb/123milhas).

## Distribuição (metade do trabalho)

- **Temporada:** réveillon agora; janela do Carnaval 2027 de 26/12 a 25/01; acerto do réveillon de 01 a 05/01 é o momento de viralizar.
- **Campanhas:** "Réveillon sem climão" e "a retrospectiva do réveillon".
- **TikTok/Reels sem rosto**, várias contas, 1 vídeo por dia: "o amigo que organiza vs o que só faz a mala", "o grupo no dia 1 vs no dia 7", "quem paga o Pix na hora vs quem some". Os vídeos saem por código (`docs/marketing/video/`).
- **Loja em português:** "roteiro de viagem com amigos", "dividir casa de praia", "racha da viagem".
- **Lançamento em grupo VIP** (WhatsApp), como o Enxovaly.
- **O link é o anúncio:** todo convite, cobrança e retrospectiva mostra "feito com Tripwave".

## Como saber se está certo (validação)

Antes de construir o passo 3 inteiro, **falar com 10 grupos** que estão fechando réveillon ou carnaval:
- como estão decidindo e cobrando hoje;
- o que deu briga;
- se usariam um link que cobra por eles, e se o organizador pagaria por isso.

Sinais de que funciona (primeiros 30 dias depois de lançar o ciclo):
- 7 de 10 convidados abrem o link e votam sem instalar;
- 50% das viagens criadas chegam a "casa escolhida";
- 30% chegam a "todo mundo pagou o sinal";
- organizador volta pelo menos 1 vez por semana até a data.

## O que muda nas regras do projeto

- AGENTS.md seção 5: o "mobile primeiro" vale pro organizador; o convidado age pela **web leve**.
- `docs/FILA-completa.md`: a Fase 0 (o ciclo) vem antes de tudo; o que está congelado ganha a marca ❄.
- `docs/ROADMAP.md`: a meta antiga ("não sair do Together") foi trocada por esta.
