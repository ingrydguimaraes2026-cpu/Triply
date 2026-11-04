# 121. Transportes e Hospedagem que ajudam (não só organizam)

**Fase:** 0/2 · **Tamanho:** M por etapa (3 etapas) · **Depende de:** 004, 011, 067, 120a · **Status:** Etapa 1 pronta pra testar (app, 04/11/2026) · etapas 2 e 3 a fazer

## Objetivo
Hoje as telas de Transportes e Hospedagem só guardam o que a pessoa já resolveu fora do app. A ideia é que elas ajudem a resolver: **como ir do aeroporto até a casa, que horas sair pra não perder o voo, com quem dividir o transfer, em que região ficar e até quanto pagar.** Tudo com regra simples no `@together/core`, links prontos e uma tabela feita à mão, **sem API paga**.

## Por que
- Pedido do Victor (04/11/2026): o grupo ainda pergunta no WhatsApp "como a gente vai do aeroporto?", "que horas a gente sai?", "fico em qual bairro?". O app tem os dados pra responder (roteiro com coordenadas, datas, quem vai em cada trajeto, orçamento), mas não usa.
- **Encaixe no [RUMO](../RUMO.md):** transportes **não congelam** (alimentam o "Hoje", spec 120). Hospedagem é "base: fica como está, só conserto e acabamento". Por isso a spec separa:
  - **Etapa 1 = "Hoje" (serve à 120):** tudo de transporte e da chegada na casa. Pode começar já.
  - **Etapas 2 e 3 = base (planejar):** links melhores, teto de preço e região pra ficar. **Precisam do "sim" do Victor**, porque abrem coisa nova numa parte que o RUMO mandou segurar.

## O que já existe (não refazer)
| Já tem | Onde |
|---|---|
| Links de busca Airbnb, Booking, Hostelworld e Maps com cidade, datas e pessoas | `hospedagem.ts` → `linksDeBusca` (011, 063) |
| Grupo cola opções, prévia do link, coração, ADM escolhe | 011, 072 · `apps/mobile/app/hospedagem.tsx` |
| Quem dorme em qual quarto, sorteio | 068 · `quartos.ts` (só web) |
| Quem vai em cada trajeto e "quem vai buscar" | 067, 120a · `trajetos.quem_busca_id` |
| Km estimados (linha reta × 1,3), combustível, rodízio de motorista | 073 · `transportes.ts` |
| Conexão curta (avião < 60 min) | 074 · `transportes.ts` → `conexoes` |
| Campo de texto "Como chegar do aeroporto" no guia da casa | 062 · `hospedagens.como_chegar` |
| Lembrete 1 h antes do trajeto | 032 · função `lembretes` |
| Colar print/PDF/e-mail da reserva e o app preencher | **120b** (não entra aqui; esta spec só usa o que ela gerar) |

## As ideias, uma por uma

Esforço: **P** = poucos dias, **M** = cerca de uma semana, **G** = mais de uma semana. "Receita" = pode virar link de afiliado depois (a 119, de afiliados, está congelada; aqui os links só ficam **prontos pra receber o código de afiliado**, sem ativar).

### Transporte

| # | Ideia | O que a pessoa vê | Esforço | API ou dinheiro? | Receita no futuro? |
|---|---|---|---|---|---|
| T1 | **Do aeroporto até a casa** | No trajeto que chega num destino e no "Hoje" do dia: 2 ou 3 jeitos de ir (trem/ônibus, táxi, app de corrida) com **tempo e preço aproximados** e um "Ver no mapa" (Google Maps com origem e o endereço da casa, modo transporte público). | M | Não. Tabela à mão com os ~20 aeroportos e estações mais usados por brasileiros (como a 111 fez com exigências); Maps é só link. Fora da tabela, mostra só o link do mapa. | Sim: transfer privado (Welcome Pickups, Kiwitaxi, GetTransfer pelo Travelpayouts). Conferir o catálogo. |
| T2 | **"Saia às X"** | No voo, trem ou ônibus: "Saia da casa às **05:40**" = partida − antecedência do meio (voo internacional 3 h, nacional 2 h, trem e ônibus 30 min) − tempo até o embarque. O tempo até lá vem da tabela da T1; sem ela, a pessoa escolhe (30 min, 45, 1 h, 1h30). Aparece no "Hoje", no cartão do trajeto e no lembrete da 032. | P | Não. Regra pura. | Não. |
| T3 | **Dividir o transfer** | Quando 2+ pessoas chegam no **mesmo lugar** com **até 90 min de diferença** (trajetos separados, 067): "Ana e Bia chegam em Fiumicino com 40 min de diferença. Dividam o táxi: ~€28 cada." Botão "A gente vai junto" marca a outra como companhia (ou como "quem busca", que já existe). | P | Não. Regra pura sobre os trajetos. | Indireta (leva pro transfer da T1). |
| T4 | **Como ir de um destino pro outro** | No trecho sem trajeto ("Roma → Florença"): botões prontos com cidade e data: Google Maps (transporte), Rome2Rio, trem (Trainline/Omio), ônibus (FlixBus; no Brasil, ClickBus), voo (Google Flights), carro (aluguel). Igual ao que a 011 fez na hospedagem. | P | Não. Só links. | **Sim, a maior**: Omio, Trainline, Kiwi/Aviasales, Rentalcars têm afiliado (Travelpayouts ou programa próprio). |
| T5 | ~~Colar o e-mail ou print e preencher~~ | Já é a **120b**. Aqui só garantir que o trajeto lido ganha T2 e T3 sozinho. | — | — | — |

### Hospedagem

| # | Ideia | O que a pessoa vê | Esforço | API ou dinheiro? | Receita no futuro? |
|---|---|---|---|---|---|
| H1 | **Até quanto pagar** | Em cima dos links de busca: "Pra caber no orçamento, procurem até **R$ 180 por pessoa/noite**" (orçamento da 003 × parte da hospedagem ÷ noites ÷ pessoas), e esse teto já vai no link (Airbnb `price_max`, Booking filtro de preço). Sem orçamento, não aparece. | P | Não. Regra pura + parâmetro no link. | Sim (os mesmos links da busca). |
| H2 | **Região pra ficar perto do roteiro** | "Fiquem perto de **Trastevere e do Coliseu**: 8 dos 11 lugares do roteiro ficam a até 2 km daqui." Calcula o ponto do meio dos `lugares` do destino (que já têm coordenadas, 064), descarta os muito longe, e diz o nome dos 2 lugares mais perto desse ponto (sem precisar saber o nome do bairro). Os links do Airbnb e do Booking já abrem nessa área (caixa de coordenadas no Airbnb; testar se o Booking aceita latitude/longitude). | M | Não. Coordenadas já estão no banco; nada ao vivo. | Sim (os mesmos links). |
| H3 | **Distância de cada opção até o roteiro** | Na opção com endereço: "1,2 km do centro do roteiro". Precisa transformar endereço em coordenada **uma vez, ao salvar** (não ao vivo na tela). | M | Talvez. Photon (já usado na 064) ou Google Geocoding (tem cota grátis). **Ver pergunta em aberto.** | Não. |
| H4 | **Custo por quarto** | Com os quartos da 068: quem fica no quarto de casal ou na suíte paga um pouco mais. Sugere a divisão por pesos (081) e lança o gasto já dividido. | M | Não. | Não. |
| H5 | **Lembrete de check-in e check-out** | Véspera do check-out às 20 h: "Check-out amanhã às 11 h. Malas prontas, chave na mesa." Manhã do check-in: horário, endereço e o "Como chegar" (T1). Usa a função de lembretes que já existe (032). | P | Não. Mudança na função `lembretes` + deploy. | Não. |
| H6 | ~~Links prontos de busca~~ e ~~colar opções e votar~~ | Já existem (011, 072). Só ganham o teto (H1) e a região (H2). | — | — | — |

## Ordem sugerida (MVP em 3 etapas)

### Etapa 1 · "Chegar e sair sem perguntar no grupo" (serve ao "Hoje", pode começar já)
**T2 "Saia às X" + T3 dividir o transfer + T1 do aeroporto até a casa (com a tabela de ~20 aeroportos) + T4 links entre destinos.**
- Tudo regra pura no core + tabela + links. **Sem migration** (o tempo até o embarque escolhido à mão fica no aparelho na 1ª versão).
- Aparece no app: cartão do trajeto em `apps/mobile/app/transportes.tsx` e no "Hoje" (`hoje-do-grupo.ts`).
- Tamanho total: M.

### Etapa 2 · "Lembra a gente e diz até quanto gastar" (base: precisa do sim do Victor)
**H5 lembretes de check-in/out + H1 teto de preço nos links + T2 dentro do lembrete da 032.**
- Mexe na função `lembretes` (deploy pela CLI). Sem tabela nova.
- Tamanho total: P/M.

### Etapa 3 · "Onde ficar" (base: precisa do sim do Victor)
**H2 região perto do roteiro + H3 distância de cada opção + H4 custo por quarto.**
- H3 pode precisar de coluna nova (`hospedagens.latitude/longitude`): migration, pedir confirmação antes.
- Aqui é a hora de decidir se **descongela a 119** e liga os códigos de afiliado nos links (T1, T4, H1, H2).
- Tamanho total: M/G.

## Não inclui (fica pra depois)
- Horários e preços reais de trem, ônibus e voo (precisam de API paga ou contrato).
- Preço e disponibilidade reais de hospedagem dentro do app (LiteAPI, Booking Demand API).
- Reservar ou pagar pelo app.
- Overpass/Nominatim ao vivo (proibido pelas regras de uso públicas).
- Ativar afiliados (119 congelada). Os links só ficam prontos pra isso.
- Ler a reserva por print/PDF (é a 120b).

## Telas
- **Trajeto (app):** abaixo do horário, uma linha "Saia às 05:40" (T2). No trajeto de chegada, bloco "Do aeroporto até a casa" com até 3 jeitos (ícone, tempo, preço "~€14"), "Ver no mapa" e, se houver, "Ana chega 40 min antes: dividam o táxi" (T3).
- **Trecho sem trajeto:** fileira de botões "Procurar: Mapa · Trem · Ônibus · Voo · Carro" (T4), acima do "Adicionar trajeto".
- **Hoje:** "Saia às" no primeiro item do dia que for embarque; "Como chegar" no dia do check-in (já existe o campo; a T1 preenche quando o campo está vazio).
- **Hospedagem (etapas 2 e 3):** frase do teto acima dos botões de busca; frase da região com mini-mapa estático; distância em cada opção.
- **Estados:** sem horário no trajeto → não mostra "Saia às"; aeroporto fora da tabela → só "Ver no mapa"; sem endereço da casa → "Ver no mapa" abre só com a cidade e pede o endereço; sem lugares com coordenada → não mostra a região. Preços sempre com "~" e "aproximado, conferido em <mês/ano>".
- Ícones só pelo `<Icone>`, sem emoji (regra do `AGENTS.md`).

## Dados
- **Usa:** `trajetos` (partida, chegada, meio, escalas, passageiros, `quem_busca_id`), `destinos` (datas, coordenadas), `lugares` (coordenadas), `hospedagens` (endereço, check-in/out, `como_chegar`), `quartos`, orçamento (003).
- **Tabela à mão (etapa 1):** `packages/core/src/aeroportos.ts` com nome, apelidos ("FCO", "Fiumicino"), cidade e 2–3 jeitos de ir ao centro (meio, minutos, preço e moeda, data da conferência). Começa com ~20 (Lisboa, Porto, Madri, Barcelona, Paris CDG e Orly, Roma FCO, Milão MXP, Londres LHR, Amsterdã, Frankfurt, Buenos Aires EZE e AEP, Santiago, Miami, Orlando, Nova York JFK, Cancún, GRU, GIG).
- **Banco:** etapas 1 e 2 sem migration. Etapa 3 talvez (`hospedagens.latitude/longitude`). Pedir confirmação antes.

## Quem pode o quê
| Ação | ADM | Membro | Convidado (web leve) |
|---|---|---|---|
| Ver "Saia às", transfer, links e região | sim | sim | sim (só ver, no `/v/`) |
| Tocar "A gente vai junto" (T3) | sim | sim, no próprio trajeto | não |
| Escolher o tempo até o embarque | sim | sim (vale pro aparelho dele) | não |

## Critérios de aceite
**Etapa 1**
- [ ] Voo internacional às 09:00 saindo de Lisboa, tabela diz 25 min até o aeroporto → "Saia às 05:35".
- [ ] Trem às 14:10 sem tabela e sem tempo escolhido → pede o tempo; escolho 30 min → "Saia às 13:10".
- [ ] Ana chega em FCO 10:20 e Bia 11:00 → as duas veem a sugestão de dividir, com o preço do táxi da tabela ÷ 2. Com 2 h de diferença, não aparece.
- [ ] Trajeto chegando em FCO, casa com endereço → 3 jeitos com tempo e preço; "Ver no mapa" abre o Google Maps com origem FCO e destino o endereço, em transporte público.
- [ ] Trecho "Roma → Florença" sem trajeto → botões de trem, ônibus e voo abrem já com as cidades e a data de saída de Roma.
**Etapa 2**
- [ ] Orçamento de R$ 6.000 por pessoa, 4 pessoas, 5 noites → aparece o teto, e o link do Airbnb abre filtrado por preço.
- [ ] Na véspera do check-out chega o lembrete com o horário; quem não está no destino não recebe.
**Etapa 3**
- [ ] Destino com 11 lugares, 8 perto do centro → a frase cita os 2 lugares mais perto do ponto do meio; o link do Airbnb abre nessa área.

## Como ficou a etapa 1 (04/11/2026)
- **Core:** `packages/core/src/aeroportos.ts` (tabela com 20 aeroportos, `acharAeroporto`, `aeroportoDaCidade`) e `packages/core/src/como-ir.ts` (`horaDeSair`, `chegadasPerto`, `transferDividido`, `linksDoTrecho`, `trechosSemTrajeto`). Testes: `apps/web/tests/como-ir.test.mjs`.
- **App:** `apps/mobile/src/ui/AjudaDoTrajeto.tsx`, usado em `transportes.tsx` (dentro de cada passagem + trechos sem trajeto no fim da lista "Todos") e em `hoje.tsx` (dentro do bilhete de quem sai/chega hoje).
- **Qual aeroporto:** o que estiver escrito na estação de partida/chegada do trajeto; senão, o principal da cidade do roteiro (Paris → CDG, Buenos Aires → EZE). Casa ≈ centro: o tempo até o embarque da tabela é o do táxi/corrida.
- **Diferenças da proposta:**
  - T4 usa Google Maps (transporte e carro), Rome2Rio e Google Flights. Trainline, Omio e FlixBus ficaram de fora: o link de busca deles precisa do código interno da cidade.
  - T3 só avisa; o botão "A gente vai junto" ficou pra depois (dá pra usar o "quem vai buscar" que já existe).
  - A tabela só tem aeroportos (sem estações de trem). Trem e ônibus pedem o tempo até o embarque.
  - No "Hoje", a tabela do aeroporto só aparece quando o guia da casa não tem o "Como chegar" escrito (062).
- **Sem banco.** O tempo escolhido à mão fica no aparelho (`tempos_ate_embarque`).
- **Testado:** `npx tsc --noEmit` (mobile e core), testes de lógica e o Transportes no navegador a 375 px (trechos e links). Os blocos dentro da passagem não foram vistos na tela porque a viagem de teste não tem trajeto: falta conferir no iPhone com um voo cadastrado.

## Perguntas em aberto
1. ~~Qual etapa vem primeiro?~~ Etapa 1 (Victor, 04/11/2026).
2. Etapas 2 e 3 abrem coisa nova na hospedagem, que o RUMO mandou segurar. Libera?
3. A H3 pode usar o Photon (já usado na 064, uma vez ao salvar) ou também entra na proibição do "OSM público ao vivo"? Se entrar, fica Google Geocoding (cota grátis) ou a H3 sai.
4. A tabela de aeroportos fica com quem pra conferir os preços a cada ~6 meses?
5. Ao descongelar afiliados: Travelpayouts (um cadastro, vários parceiros) ou programa direto de cada um?

## Dicas pra implementar
- Regras novas em `packages/core/src/transportes.ts` (`horaDeSair`, `chegadasProximas`) e um arquivo novo `aeroportos.ts` (tabela + `acharAeroporto(texto)`, que entende "FCO", "Fiumicino" e "Aeroporto de Roma"). Reaproveite `semAcento` e a lista de `explorar-cidades.ts` (`PALAVRAS_DE_PARTIDA`).
- Links de trecho: um `linksDoTrecho(origem, destino, data)` no mesmo estilo de `linksDeBusca` (hospedagem.ts), com um parâmetro opcional `afiliado` que hoje fica vazio.
- Hora: tudo no fuso do lugar de partida (a partida já vem assim nos trajetos). Testar a virada de dia (voo 01:00 → "saia às 21:50 do dia anterior").
- Testes de lógica em `apps/web/tests/` como os outros (`transportes-situacao.test.mjs`). Rodar só o arquivo novo no meio e o `npm test` uma vez no fim.
- No app, conferir com `npx tsc --noEmit` em `apps/mobile` e `packages/core`.
