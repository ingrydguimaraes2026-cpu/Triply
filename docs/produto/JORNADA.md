# Jornada do comboio: do "bora viajar" à próxima viagem

*03/11/2026. Sessão de produto, só documento. Base: `docs/ROADMAP.md`, spec 117, `docs/design/MAPA-DE-TELAS.md`, `reports/Mercado de apps de viagem em grupo.md` e `docs/marketing/benchmark/PADROES.md`.*

## O problema em uma linha

A viagem acontece poucas vezes por ano. Se a Norti só serve **durante** a viagem, a pessoa abre o app 10 dias por ano e esquece. A jornada precisa começar antes da viagem existir e continuar depois que ela acaba.

Hoje o app é forte no meio (antes e durante) e quase vazio nas pontas.

| Fase | Quanto dura | O app hoje |
|---|---|---|
| 0. Antes do antes | semanas a anos | quase nada |
| 1. Antes | 1 a 3 meses | forte |
| 2. Durante | 3 a 15 dias | forte |
| 3. Depois | 1 a 4 semanas | fraco |
| 4. Entre viagens | meses | quase nada |

Regra pra ler as ideias abaixo: **no máximo 3 por fase**. Ideia que não está aqui não some, só não é prioridade.

---

## Fase 0. Antes do antes: do "bora viajar" até a viagem existir

**O que o grupo faz hoje sem o app**
- Alguém manda "bora viajar esse ano?" no grupo do zap. Todo mundo responde "bora". Nada acontece.
- Quem deu a ideia tenta de novo: manda uma enquete do próprio WhatsApp (data, destino). Metade vota, a outra metade some.
- Ninguém sabe quem topa de verdade, quanto cada um pode gastar nem que datas servem. A conversa morre e volta meses depois.
- No benchmark, esse é o tema que **mais gera compartilhamento**: "a viagem que vocês sempre se prometeram finalmente saiu do whatsapp" e "chegou a tão falada viagem" (padrão 2, até 77 mil compartilhamentos).
- Na pesquisa, achar data em comum (39%) e definir orçamento (36%) são os maiores obstáculos (Skyscanner, em `reports/`).

**O que a Norti já tem**
- Onboarding da spec 116: começa em "Pra onde vocês vão?". Ou seja, **já supõe que o destino existe**.
- Enquetes (spec 021) e convite por link. Mas tudo mora **dentro de uma viagem**, que precisa de destino pra nascer.
- Nada pra quem ainda está no "bora?".

**O que falta (3 ideias)**
1. **Viagem rascunho ("Bora?")**: uma viagem que nasce sem destino nem data. O link vai pro zap e cada pessoa responde 3 coisas em 30 segundos, sem conta: **quando posso** (meses ou feriados), **quanto posso** (faixa por pessoa) e **o que quero** (praia, cidade, natureza, fora do país). O app mostra o cruzamento: "4 de 6 podem no carnaval, até R$ 1.500, praia".
2. **"Tô dentro de verdade"**: cada um confirma com um compromisso pequeno e visível (marcar "eu vou" com prazo, e depois o sinal da casa registrado). O grupo vê quem está dentro e quem só disse "bora". O prazo ("decidimos até sexta") é público.
3. **Cartão pro zap**: uma imagem pronta do estado do grupo ("4 de 6 já toparam. Falta o Lucas.") com a Norti. É o padrão 2 e 4 do benchmark virando funcionalidade: o post é usado como mensagem.

**Motivo pra abrir o app de novo**
- "Falta você responder" (link no zap).
- Ver se o grupo já fechou data e destino.
- O prazo chegando.

---

## Fase 1. Antes: da viagem existir até o embarque

**O que o grupo faz hoje sem o app**
- Links do Airbnb soltos no zap, cada um defende o seu, o mais insistente ganha.
- Alguém reserva e paga a casa inteira, depois cobra o sinal de cada um por Pix. Uns pagam na hora, outros em semanas.
- Planilha pra dividir quartos, compras e quem leva o quê. Pesquisa: 30,4% definem a cota de cada um antes (Imaginadora, em `reports/`).
- Documentos e seguro: alguém lembra na véspera.

**O que a Norti já tem**
- Aba Viagem "antes" (spec 117): próximo carimbo, passaporte do comboio com 6 selos, Cutucar.
- Hospedagem com opções, votos e escolha do ADM; duelo de fotos.
- Explorar com deslize e **match do comboio** (3 "quero" = Deu match!).
- Roteiro do grupo, transportes, documentos de entrada por país, tarefas, enquetes.
- Gastos planejados ("A pagar", spec 057).

**O que falta (3 ideias)**
1. **Sinal da casa / caixa do comboio** (só registro, sem guardar dinheiro): "a casa custa R$ 6.000, cada um manda R$ 1.000 pra Ana". Mostra quem já mandou, com a chave Pix de quem recebe e um "e o pix?" pronto pra mandar. É a primeira dor de dinheiro do grupo e o momento em que a viagem sai do papel de verdade.
2. **Quem dorme onde** (catálogo E7): quartos e camas, cada um escolhe ou o app sorteia. É a piada nº 1 do benchmark ("dividir quarto com um casal aleatório", "a casa que cabia todo mundo").
3. **Quem leva o quê**: lista curta do grupo (caixa de som, carvão, remédio), reaproveitando as tarefas com responsável (spec 020). Opcional: só se os grupos do teste pedirem.

**Motivo pra abrir o app de novo**
- Um carimbo aberto ("onde dormir") e o voto que falta.
- O Deu match! e o aviso "falta você opinar".
- A cutucada de um amigo.
- Ver quem já pagou o sinal.

---

## Fase 2. Durante: do embarque à volta

**O que o grupo faz hoje sem o app**
- Zap pra tudo: "onde vocês estão?", "que horas a gente sai?". Descumprir horário é a dor nº 2 (36,3%, Imaginadora).
- Splitwise ou Tricount pros gastos, quando alguém lembra. O Splitwise grátis limita a cerca de 3 a 4 despesas por dia (em `reports/`).
- Google Maps pra se achar, câmbio na cabeça.

**O que a Norti já tem**
- Aba Viagem "na viagem": Hoje com agenda, clima e ponto de encontro.
- Contas como conversa, com a barra "o que foi?" ("taxi 20" vira € 20 Transporte), câmbio e boletim às 12h e 20h.
- Fotos do comboio, documentos e cofre, guia da casa.

**O que falta (3 ideias)**
1. **Marcar acerto como pago** (roadmap #17): hoje o app calcula quem paga quem, mas não registra o Pix feito ("Beto acertou € 30 no Pix" ainda não existe, ver `docs/HANDOFF-ux-definitiva.md`).
2. **Offline de leitura** (roadmap #15): roteiro, endereço, documentos e gastos abrem sem internet. Sem isso, o grupo volta pro print no zap.
3. **Lançar gasto pelo recibo** (foto → gasto). É um dos extras com cadeado do Passe.

**Motivo pra abrir o app de novo**
- Lançar o gasto na hora.
- "Onde e que horas a gente se encontra?"
- O boletim do câmbio.
- Ver o meu saldo.

---

## Fase 3. Depois: da volta até a conta fechar

**O que o grupo faz hoje sem o app**
- Alguém faz a "planilha final". Ninguém confia totalmente nela (relato do TabNews, em `reports/`).
- A cobrança do Pix dura semanas e é constrangedora. É o tema mais compartilhado do benchmark (padrão 4: "e o pix? nada ainda?", até 71,6 mil compartilhamentos).
- As fotos ficam espalhadas entre o zap e o celular de cada um. O grupo do zap vira grupo de meme e esfria.

**O que a Norti já tem**
- Aba Viagem "voltou" = Lembranças: números da viagem, passaporte completo, "contas em dia".
- Retrospectiva (spec 105, cartão vira imagem) e PDF da viagem.
- Repetir com o mesmo comboio (spec 055, só web, banco não aplicado).

**O que falta (3 ideias)**
1. **Fechamento com cobrança gentil**: a conta fecha num resumo que todos veem (roadmap #18) e o app manda o "e o pix?" por você, com a Norti, num link que abre direto no que a pessoa deve. Quem cobra não fica com cara de chato. O cobrado entra no app pelo link.
2. **Lembranças pra postar**: a retrospectiva vira story vertical (números, mapa, melhores fotos). Cada story é propaganda que o grupo faz de graça.
3. **"Bora de novo?"**: no fim das Lembranças, um botão abre a viagem rascunho da fase 0 já com o mesmo comboio.

**Motivo pra abrir o app de novo**
- O saldo em aberto (de quem deve e de quem recebe).
- Ver e postar as lembranças.
- Votar na próxima.

---

## Fase 4. Entre viagens

**O que o grupo faz hoje sem o app**
- Nada. "A gente tem que repetir" no zap, uma vez por mês, sem data.
- O próximo feriado chega e ninguém se organizou.

**O que a Norti já tem**
- Início com "No comboio agora" e a lista de viagens.
- Repetir com o mesmo comboio (055, só web).

**O que falta (2 ideias)**
1. **Calendário de feriados do comboio**: "o próximo feriadão é daqui a 6 semanas. Bora?" Um toque abre a viagem rascunho (fase 0) pro grupo. O feriado é o gatilho natural que já existe no Brasil.
2. **"Há 1 ano vocês estavam em Lisboa"**: lembrança no aniversário da viagem, com uma foto e o botão "Bora de novo?". Barato de fazer e liga a fase 4 de volta à fase 0.

**Motivo pra abrir o app de novo**
- O feriado chegando.
- A lembrança da última viagem.
- Um amigo começou um "Bora?".

---

## O ciclo

```
Entre viagens ──(feriado / lembrança)──> Antes do antes ──(sinal pago)──> Antes
      ^                                                                      │
      └──(Bora de novo?)── Depois <──(volta)── Durante <──(embarque)─────────┘
```

O que fecha o ciclo são duas portas que **não existem hoje**: a viagem rascunho (entrada) e o "Bora de novo?" (saída). Sem elas, cada viagem é um app instalado e esquecido.

---

## A aposta central

**Hipótese inicial:** "a Norti faz a viagem do grupo sair do papel".

### Por que eu contesto (em parte)

1. **É um ótimo gancho de marketing, mas é uma promessa fraca de produto.** O que trava o "bora viajar" é social (ninguém quer ser o chato que cobra decisão), não falta de ferramenta. O WhatsApp já tem enquete nativa e o grupo não usa direito.
2. **Os 5 grupos do réveillon já saíram do papel.** Quem viaja daqui a 2 meses já tem destino e, quase sempre, casa. O teste não consegue provar essa aposta (ver `TESTE-REVEILLON.md`).
3. **Planejar é feito 1 vez por viagem.** Dinheiro aparece em **todas** as fases: o sinal da casa (antes), os gastos (durante), o acerto (depois). E é onde o zap é pior: conta não se faz em conversa.

### A aposta que proponho

> **"Ninguém fica devendo e ninguém precisa cobrar."**
> A Norti é o lugar onde o dinheiro do grupo fica claro, do sinal da casa ao último pix, sem ninguém virar o chato.

Por que essa:
- **É onde o zap é 10 vezes pior.** Enquete o zap faz. Saldo com câmbio, IOF, quem pagou o sinal e quem ainda deve, ele não faz.
- **É a dor com mais evidência:** pix é o tema mais compartilhado do benchmark (padrão 4), "a dor do pix não pago já roda na bolha dev" (grupo D), e o relato do TabNews pede chave Pix no perfil e link sem cadastro.
- **Liga com o "sair do papel":** a viagem sai do papel no momento em que **o primeiro sinal é pago**. O sinal da casa é a ponte entre a fase 0 e a fase 1.
- **Liga com a receita:** o grupo grátis e sem limite é o argumento contra o Splitwise (em `reports/`), e o Passe pode ser dividido como um gasto do comboio (ver `PRECO.md`).
- **Faz o ciclo girar:** a cobrança gentil traz quem sumiu de volta ao app pelo link.

O "sair do papel" continua como **história de marketing** (padrão 2) e como porta de entrada (viagem rascunho). A promessa que o produto precisa cumprir todo dia é a do dinheiro.

### Como decidir entre as duas

Não é opinião, é teste:
- No réveillon, medir se os grupos **fecham a conta no app** (sinal registrado, gastos lançados, acerto marcado). Se sim, a aposta do dinheiro se sustenta.
- Em paralelo, 2 grupos que **ainda não decidiram** o carnaval 2027 testam a viagem rascunho (depois que ela existir). Se o "Bora?" vira viagem com data e sinal em até 3 semanas, o "sair do papel" ganha força como produto.

### Métrica norte (candidata)

**Comboios que fecharam a conta no app no mês** (viagem terminada com o saldo de todos zerado ou marcado como pago).
- Mostra valor entregue (ninguém ficou devendo), não vaidade (downloads).
- Métricas de entrada: % do comboio que entrou pelo link · gastos lançados por viagem · acertos marcados como pagos · viagens novas criadas por comboios que já viajaram.

É candidata: confirmar depois do teste do réveillon.

---

## O que isso muda no roadmap (proposta, não decisão)

Ordem sugerida depois da spec 117, se a aposta do dinheiro se confirmar:
1. Marcar acerto como pago + fechamento + cobrança gentil (roadmap #17 e #18).
2. Sinal da casa / caixa do comboio (Onda 2, "Caixa do comboio").
3. Viagem rascunho "Bora?" (nova, fase 0).
4. "Bora de novo?" + feriados + aniversário da viagem (fase 4).

Quem dorme onde, offline e recibo por foto entram conforme o que os grupos do teste mais pedirem.
