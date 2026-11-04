# 118. O ciclo "viagem sem climão" (da frase ao Pix pago)

**Fase:** 0 (vem antes de tudo) · **Tamanho:** G (dividida em 118a a 118f) · **Depende de:** 018, 025, 093, 105, 114 · **Status:** A fazer

> Esta spec é o produto inteiro do novo rumo. Leia antes o [`docs/RUMO.md`](../RUMO.md).

## Objetivo
O organizador escreve uma frase e em 30 segundos tem o rascunho da viagem. Manda um link no grupo. Os amigos votam, topam e pagam a parte deles pelo navegador, sem instalar. O app lembra e cobra por ele até a data, e depois entrega a retrospectiva pra postar.

## Por que
- Benchmark 11/2026: ninguém leva o grupo do "decidimos" até o "pagamos"; nenhum concorrente trata Pix, parcelado, réveillon ou casa de praia.
- A dor mais forte do grupo brasileiro é dinheiro entre amigos (Serasa 61%, Datafolha 41%).
- App de grupo que cresce deixa o convidado agir pelo link (Partiful, Tricount).
- O Enxovaly mostra que "uma pessoa, um momento, um prazo, um link que espalha" fatura, mesmo sendo "só uma lista".

## Inclui (em 6 partes, cada uma entregável sozinha)

### 118a · Começar em 30 segundos (app)
- Campo único na criação: "conta a viagem numa frase" + botões "colar link" e "mandar print".
- A IA devolve: destino, datas (ou "a decidir" com 2 opções), nº de pessoas, orçamento por pessoa em R$, 2 ou 3 sugestões de casa/hospedagem (links colados ou busca pronta) e a **mensagem pronta pro grupo**.
- O organizador corrige qualquer campo antes de criar.
- Reaproveita a conversa da Agulha/Norti (116) e o leitor de link (097).

### 118b · Decidir pelo link (web leve)
- Página `/v/<código>` aberta no navegador do WhatsApp: nome, foto, datas, casas.
- Sem login: a pessoa digita o nome (convidado sem conta, 018) e escolhe "tô dentro / talvez / não vou".
- Vota na casa e nas datas (um toque cada).
- O organizador vê no app: "6 de 8 responderam · faltam Ana e Léo" com botão "lembrar no WhatsApp" (mensagem pronta, abre o WhatsApp).

### 118c · Fechar e cobrar (o diferencial)
- O organizador marca "casa escolhida", informa o valor total, a **chave Pix** dele, o prazo do sinal e se foi parcelado (nº de parcelas e dia).
- Cada pessoa que topou vê, no mesmo link: "Sua parte: R$ 412,50 · sinal R$ 150 até 15/11" com **Pix copia-e-cola** (BR Code gerado no aparelho) e botão "já paguei".
- Parcelado: lista das parcelas com data; cada uma tem o seu "já paguei".
- O organizador confirma o recebimento (ou não). Barra "5 de 8 pagaram o sinal".
- Lembrete pronto pra mandar no WhatsApp pra quem está atrasado, com o tom da Norti ("sem climão: o Pix do sinal vence amanhã").

### 118d · Contagem até a data (tela principal do organizador)
- Topo: "Floripa em 23 dias".
- "Nesta semana": até 3 coisas do que falta (votos, sinal, parcela, transporte, mala).
- "Quem não pagou" com 1 toque pro lembrete.
- Botão "postar contagem": gera imagem 9:16 pros stories com o selo do Tripwave.

### 118e · Na viagem
- Lançar gasto por frase ou voz (093) e placar "quem deve quanto". Sem mudança grande: só entrar no fluxo e no link (o convidado vê o placar dele no link).

### 118f · Depois
- Acerto final com Pix copia-e-cola por pessoa (mesma peça do 118c).
- Retrospectiva (105) com os números do ciclo: dias, pessoas, total, "0 brigas" (todo mundo pagou), e "bora a próxima?" que cria uma viagem nova com o mesmo grupo.

## Não inclui (fica pra depois)
- Dinheiro passando pelo Tripwave (custódia, split automático, cobrança por boleto ou cartão). Pix é direto entre amigos.
- Conferir automaticamente se o Pix caiu (precisa de banco/Open Finance).
- Bot dentro do grupo do WhatsApp (número que responde). Ideia anotada.
- Viagens de outros grupos como conteúdo/SEO.
- Assinatura e paywall: só depois de validar com os 10 grupos.
- Checagem contra golpe do aluguel falso: na 1ª versão, só um aviso fixo com dicas.

## Telas
- **App (organizador):** criação por frase (118a) · tela principal com contagem, semana e cobrança (118d) · tela "fechar a casa e cobrar" (118c) · lista de respostas e pagamentos.
- **Web leve (convidado):** uma página só, `/v/<código>`, que muda conforme a fase: decidir → pagar → placar da viagem → retrospectiva.
- Estados: carregando (esqueleto), link inválido ("esse link expirou, pede outro pro organizador"), viagem cancelada, sem internet no app.
- Tudo em 360px. Nada de emoji; ícones do catálogo.

## Dados
- Usa: viagens, membros/convidados (018), enquetes/votos (021), hospedagem e votos, gastos e acertos.
- **Muda (migration nova, pedir confirmação antes):**
  - `cobrancas`: viagem, descrição ("casa", "sinal"), valor total, chave Pix do organizador, prazo, nº de parcelas.
  - `cobranca_partes`: cobrança, pessoa (membro ou convidado), valor, vencimento, parcela nº, `pago_em`, `confirmado_em`.
  - Resposta "tô dentro / talvez / não vou" por pessoa (talvez já caiba em membros).
- RLS: quem está na viagem vê as partes de todos (transparência evita climão); só o dono da parte marca "já paguei"; só o ADM cria cobrança e confirma recebimento.
- A chave Pix é dado pessoal do organizador: só aparece pra quem está na viagem.

## Quem pode o quê
| Ação | ADM (organizador) | Membro | Convidado pelo link |
|---|---|---|---|
| Criar viagem por frase | sim | não | não |
| Responder se vai e votar | sim | sim | sim |
| Criar cobrança e informar Pix | sim | não | não |
| Ver quem pagou | sim | sim | sim |
| Marcar "já paguei" na própria parte | sim | sim | sim |
| Confirmar recebimento | sim | não | não |
| Mandar lembrete | sim | não | não |

## Critérios de aceite
- [ ] Escrevo "réveillon em Floripa, 8 amigos, R$ 2 mil cada" e em até 30 s vejo o rascunho com destino, datas, valor por pessoa e a mensagem do grupo.
- [ ] O link abre no navegador do celular, sem instalar e sem senha, em menos de 3 s no 4G.
- [ ] Um amigo diz "tô dentro" e vota na casa só digitando o nome.
- [ ] O organizador vê "faltam X responderem" com os nomes e manda o lembrete pelo WhatsApp em 1 toque.
- [ ] Ao fechar a casa (R$ 3.300, 8 pessoas, sinal R$ 150 até 15/11, 3 parcelas), cada um vê R$ 412,50, o sinal e as 3 parcelas com data.
- [ ] O Pix copia-e-cola abre e paga no app do banco (testar com valor real pequeno).
- [ ] "Já paguei" muda a barra pra todos; o organizador confirma.
- [ ] A tela principal mostra a contagem, até 3 coisas da semana e quem não pagou.
- [ ] "Postar contagem" gera imagem 9:16 bonita.
- [ ] Depois da viagem, a retrospectiva mostra os números e o "bora a próxima?" cria viagem com o mesmo grupo.
- [ ] Tudo funciona em 360px.

## Perguntas em aberto
- Quanto custa a assinatura do organizador e quando entra o paywall? (depois das 10 conversas)
- O convidado precisa de algo além do nome (telefone pra lembrete)?
- Arredondamento: diferença de centavos fica com quem? (proposta: com o organizador)
- Lembrete automático por WhatsApp (API paga) ou só mensagem pronta que o organizador manda? (proposta: começar com mensagem pronta)
- Gerar o Pix copia-e-cola no aparelho (BR Code estático) basta? (proposta: sim, sem API de banco)

## Dicas pra implementar
- Ordem sugerida: 118b e 118c primeiro (é o diferencial e testa com grupo real), depois 118a, 118d, 118f.
- BR Code (Pix copia-e-cola) estático é texto no padrão EMV com CRC16: dá pra gerar no `packages/core` com teste, sem biblioteca.
- Regra de dinheiro (dividir, parcelas, centavos) no `packages/core`, com teste, como o resto do financeiro.
- Web leve: rota nova no `apps/web`, carregando só o necessário (sem o painel inteiro).
- App: `apps/mobile/app/nova-viagem.tsx`, `comecar.tsx`, `contas.tsx`, `retrospectiva.tsx` e `chamar-galera.tsx` são as bases.
- Mensagens pro WhatsApp: reaproveitar o compartilhar da 025.
