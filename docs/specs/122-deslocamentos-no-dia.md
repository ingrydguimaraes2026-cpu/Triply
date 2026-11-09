# 122. Deslocamentos no dia

**Fase:** 0 · **Tamanho:** G · **Depende de:** 029 (agenda do dia), 120 ("Hoje"), 121c (caminho com paradas) · **Status:** A fazer (spec escrita em 08/11/2026, ajustada no mesmo dia: cartões por meio, sem print nem Rome2rio)

Protótipo: [`docs/design/transporte-v3.html`](../design/transporte-v3.html) (abrir no navegador; são 4 telas de celular).

## Objetivo
O grupo monta cada dia **horário por horário**, com passeios e deslocamentos na mesma linha. O app ajuda nas decisões:
- compara opções;
- busca os horários de verdade;
- avisa quando o plano não fecha: folga curta, último do dia, malas, check-in.

## Por que
A tela de Transportes de hoje é "meio inútil" (Victor, 08/11). Ela trata transporte como **um trecho por par de cidades do roteiro**. Nas reuniões de planejamento da Eurotrip (22/10, 27/10, 28/10 e 06/11), o Victor e a Ingryd planejam de outro jeito:

- **O dia inteiro em horários.** Exemplo, a quarta no Lago de Como:
  - 6:10 trem Tirano → Como;
  - guarda-volumes;
  - balsa até Lenno, depois a vila;
  - 14:15 balsa até Varenna;
  - 17:55 ferry até Bellagio;
  - 20h ônibus até Como;
  - 22:20 ônibus até Veneza.

  São 6 deslocamentos num dia, e quase nenhum é entre dois "destinos" do app.
- **Comparam opções** pelo que pesa de verdade: tempo, trocas, de quanto em quanto tempo passa, **último horário do dia**, **folga na conexão** e preço. Exemplo: "o trem tem pouca margem, então vai de ônibus, mesmo com 1 hora a mais, porque o ônibus vai até as 23h".
- **O transporte decide o resto:**
  - hospedagem perto da estação, porque chegam tarde;
  - check-in à noite;
  - guarda-volumes entre o check-out e o próximo trem;
  - traslado da estação até o Airbnb.
- **Ficam coisas "a confirmar"**: horário oficial, o link de onde saiu, comprar ou não.
- O roteiro de cidades encolheu: Monza saiu, Milão virou passagem, Mônaco é bate-e-volta e Bernina é passeio do dia. O que sobrou de "cidade" é pouco; o resto mora dentro dos dias.

O `docs/specs/README.md` diz que "roteiro do dia e transportes não congelam". Esta spec serve ao "Hoje" (120): o "Hoje" passa a mostrar os deslocamentos do dia com hora e aviso.

## Inclui (em 4 partes)

### 122a · O deslocamento mora no dia
- Um deslocamento tem:
  - **de** e **para** em texto livre, com sugestões dos lugares e destinos da viagem (e coordenadas quando tiver);
  - dia;
  - hora de saída e de chegada (a chegada pode ser no dia seguinte);
  - meio: trem, ônibus, barco, metrô, avião, carro, a pé, outro;
  - preço por pessoa;
  - link;
  - observação;
  - quem vai (a galera toda ou só alguns).
- Situação: **comparando**, **decidido** ou **comprado** ("compra no cais" conta como decidido).
- O dia mostra, em ordem de hora, os passeios (lugares e eventos da agenda) e os deslocamentos. Os deslocamentos aparecem como cartões e os passeios como linhas leves.
- No topo do dia:
  - fita de dias pra trocar;
  - título;
  - "dorme em X";
  - resumo: N comprados, N pra decidir, N avisos.
- Botão "Adicionar" leva a "Novo deslocamento" (tela 3). Também dá pra adicionar a partir de um passeio: "Como chego no próximo?" preenche o de/para.

### 122b · Avisos que o app calcula sozinho
Os avisos aparecem **entre os passos**, no lugar onde o problema está:
- **Folga curta:** menos de 30 min entre chegar e o próximo sair (com malas, 45 min). Folga boa aparece discreta ("1h20 de folga").
- **Último do dia:** quando a opção escolhida é o último horário; perdeu, fica sem.
- **Chega depois do check-in:** a chegada no lugar onde dormem passa do horário de check-in da hospedagem (spec 120 já tem check-in e check-out). Ação: "Mandar mensagem pro anfitrião", que abre o compartilhar com o texto pronto.
- **Malas no dia:** fizeram check-out e o próximo lugar de dormir só abre bem depois. Ação: "Achar guarda-volumes", que abre a busca no Maps perto da estação.
- **Buraco no dia:** dois passeios em lugares diferentes sem deslocamento entre eles. Ação: "Como chego?".

### 122c · Achar o jeito de ir (cartões por meio) e comparar
Decisão de 08/11: tudo dentro do Norti. Nada de botão pro Rome2rio, colar link ou mandar print (Victor e Ingryd não gostaram).

**Novo deslocamento (tela 3):** a pessoa põe de, para e o dia.
- **Passo 1, cartões por meio, no estilo do Rome2rio:**
  - Trem e Ônibus: duração, trocas, de quanto em quanto tempo passa. Vem do Transitous.
  - Carro: tempo pela estrada e preço **estimado** (combustível e pedágio pela distância). Vem de serviço aberto de rotas (OSRM).
  - Táxi: tempo e preço **estimado** pela distância.
  - A pé: quando for perto (até ~3 km).
  - Selos "Mais rápido" e "Mais barato" (o mais barato só entre os que têm preço).
  - Tudo que é estimativa diz "estimativa".
- **Passo 2, horários exatos:** tocou em Trem ou Ônibus, abrem as saídas a partir da hora em que o grupo fica livre ("Vocês saem da Villa Monastero às 17:50"). Cada saída mostra saída → chegada, trocas e onde trocar. Marcas "Não dá tempo" e "Último do dia". Um toque preenche tudo.
- **Sem dado** (balsas e ônibus do Lago de Como, ônibus de estrada no Brasil, avião): o cartão "Cadastrar à mão" já vem com de, para e dia preenchidos; falta só hora, meio e preço.
- **Preço da passagem** de trem e ônibus não tem fonte grátis: campo opcional, preenchido quando compram.

**Comparar (tela 2):** o deslocamento em "comparando" junta 2 ou 3 opções escolhidas nos cartões. Cada uma mostra:
- saída → chegada e duração;
- trocas;
- de quanto em quanto tempo passa;
- último do dia;
- folga calculada com o passo anterior;
- preço.

O app marca a de "mais folga" ou "mais barata" e um toque escolhe. As outras ficam guardadas, recolhidas.

**Comparação feita em 08/11 (trechos reais da Eurotrip):**

| Trecho | Rome2rio | Transitous |
|---|---|---|
| Como → Veneza | 6 meios, preço | saídas exatas, inclusive FlixBus noturno 22:11 → 05:28 |
| Tirano → Como, Milão → Tirano, Nice → Mônaco, Veneza → Roma | meios, preço | saídas exatas, trocas, frequência, último do dia |
| Varenna → Bellagio (ferry), Bellagio → Como (ônibus) | aparece | nada |

- Rome2rio ganha em "qual meio e quanto custa". O Norti com Transitous ganha em "hora certa e não perder conexão".
- Rome2rio não tem API aberta (só parceiro). O Transitous é grátis, com uso justo: se o Norti crescer, avisar a equipe deles e mandar `User-Agent` com contato.

### 122d · Passagens (substitui a tela Transportes)
- Contadores: pra decidir, pra comprar, compradas.
- Avisos da viagem toda, que levam pro dia certo.
- Listas "Pra decidir", "Pra comprar" (com "na hora" pra quem compra no cais) e "Compradas" (com "Ver bilhete" quando tiver anexo).
- Total de transporte por pessoa e quanto já foi pago. "Lançar como gasto" usa o Financeiro, como a hospedagem faz.
- Tocar num item abre o dia dele, com o deslocamento em destaque.

## Não inclui (fica pra depois)
- Comprar passagem dentro do app.
- Preço de passagem em tempo real (não tem fonte grátis; o grupo digita quando compra).
- Ler print ou link de passagem (decidido em 08/11: não querem).
- Aluguel de carro ou Vespa com reserva. Entra como deslocamento "outro", com link.
- Mapa do dia com o caminho todo desenhado. Por enquanto, "Ver no mapa" abre o Google Maps com as paradas.
- Mexer no roteiro de cidades (destinos). Esta spec não apaga destinos. Os destinos antigos da Eurotrip (Mônaco duas vezes, Bernina) ficam com o grupo arrumar.

## Telas
O protótipo tem as 4 telas. No app (Expo), onde fica cada uma:
- **Dia** (tela 1): a tela do dia que já existe (agenda, spec 029) ganha os cartões de deslocamento e os avisos. No "Hoje", aparece o mesmo trecho do dia, a partir da hora atual.
- **Comparar** (tela 2): gaveta que sobe do dia.
- **Novo deslocamento** (tela 3): tela cheia. Substitui o formulário de trajeto atual (`nova-reserva` com tipo e o `FormTrajeto` do site).
- **Passagens** (tela 4): no lugar de `transportes.tsx` e `Transportes.tsx`.
- Estados:
  - vazio: "Nenhum deslocamento neste dia. Como vocês vão de A pra B?", com A e B já sugeridos pelo roteiro;
  - carregando os horários: lista com esqueleto;
  - sem horários: "Não achamos os horários dessa linha", com o cartão "Cadastrar à mão" já preenchido.
- Site: mesma coisa no essencial (ver o dia, comparar, Passagens). Adicionar com horários reais pode vir só no app primeiro.

## Dados
- A tabela `trajetos` hoje é presa a `origem_id` e `destino_id` (destinos). Proposta: migration nova que **amplia** `trajetos` em vez de criar outra tabela, pra não quebrar Financeiro, "Hoje", reservas e caminho:
  - `dia date`;
  - `de_texto` e `para_texto` (text), mais `de_lat/de_lon` e `para_lat/para_lon`, opcionais;
  - `situacao` ('comparando', 'decidido', 'comprado'), default 'decidido';
  - `grupo_opcoes uuid`: opções do mesmo deslocamento compartilham o mesmo valor; `escolhida boolean`;
  - `ultimo_do_dia boolean`, `frequencia_min int`, `trocas int`, `preco_pessoa numeric`, `link text`.
  - `origem_id`/`destino_id` continuam, opcionais.
  - Trajetos antigos viram `de_texto` e `para_texto` com o nome do destino, e situação 'comprado' quando já tinham reserva.
- Hospedagem: usa o check-in e o check-out que já existem (spec 120) pros avisos.
- Avisos: **calculados na hora** (função pura em `packages/core/src/dia-com-deslocamentos.ts`), não guardados.
- Tipos novos em `packages/core/src/database.ts`.

## Quem pode o quê
| Ação | ADM | Membro |
|---|---|---|
| Ver dia, comparar e Passagens | sim | sim |
| Adicionar deslocamento ou opção | sim | sim (como hoje com "liberado"; proposta: qualquer membro adiciona **opção**) |
| Escolher a opção e marcar comprado | sim | quem lançou ou quem o ADM liberou |
| Apagar | sim | quem lançou |

## Critérios de aceite
- [ ] No dia, consigo pôr "Varenna → Bellagio, 17:55, barco", sem esses lugares serem destinos.
- [ ] O dia mostra passeios e deslocamentos misturados em ordem de hora, em 360px, sem rolar pro lado.
- [ ] Com 21:00 de chegada e 21:36 de saída com malas, aparece "folga curta" entre os dois.
- [ ] Chegada às 3h e check-in até 0h mostra o aviso vermelho com "Mandar mensagem pro anfitrião".
- [ ] Check-out de manhã, próximo lugar de dormir à noite e deslocamentos no meio mostram "Malas até HH:MM".
- [ ] Num deslocamento "comparando" com 2 opções, vejo folga, último do dia, trocas e preço de cada, e escolho com 1 toque.
- [ ] Em "Novo deslocamento" Como → Veneza aparecem os cartões Trem, Ônibus, Carro e Táxi (carro e táxi com "estimativa").
- [ ] Tocar em Trem mostra saídas reais a partir da hora livre. Tocar numa preenche hora, chegada, meio e trocas.
- [ ] Varenna → Bellagio (sem dado) mostra "Cadastrar à mão" com de, para e dia preenchidos, sem erro.
- [ ] Passagens mostra os contadores certos. Tocar num item abre o dia com o item em destaque.
- [ ] Os trajetos que já existiam continuam aparecendo (no dia deles e em Passagens).
- [ ] Teste de lógica dos avisos e da folga (`apps/web/tests/dia-com-deslocamentos.test.mjs`).

## Perguntas em aberto
- Membro pode adicionar opção sem ser liberado? (Proposta: sim, opção é sugestão; escolher é do ADM ou de quem ele liberar.)
- Folga mínima: 30 min sem malas e 45 com malas está bom?
- O "Hoje" mostra só o próximo deslocamento ou o dia todo dali pra frente?
- Arrumar os destinos da Eurotrip (tirar o Mônaco repetido, transformar Bernina e Como em passeio do dia) fica com vocês ou eu proponho no app?

## Dicas pra implementar
- Ordem sugerida:
  1. 122a (banco + dia);
  2. 122b (avisos, função pura com teste);
  3. 122c (comparar e Transitous);
  4. 122d (Passagens e tirar a tela antiga).
- Carro: OSRM público (`router.project-osrm.org/route/v1/driving/lon,lat;lon,lat`) dá distância e tempo. Estimativa de preço = km × consumo × combustível + pedágio aproximado, numa função pura com teste.
- Transitous: `buscarCaminho` e `caminhoDaResposta` em `packages/core/src/transporte-do-grupo.ts`. Para listar saídas, chamar `/api/v5/plan` com `numItineraries=5` e montar a lista a partir dos `itineraries`.
- O "Ver o caminho" (`apps/mobile/app/caminho.tsx`) continua: o cartão de trem ou ônibus ganha "Paradas".
- Ícones: só `<Icone>` do `@together/core`. Os do protótipo são desenho; conferir trem, ônibus, barco, mala e alerta no catálogo e pedir os que faltarem (`docs/design/ICONES.md`).
- As abas de baixo no protótipo são ilustração; vale a navegação real do app.
