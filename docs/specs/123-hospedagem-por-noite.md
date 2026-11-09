# 123. Hospedagem por noite

**Fase:** 1 · **Tamanho:** M · **Depende de:** 011 (hospedagem), 122 (deslocamentos no dia), 122d (aba Reservas) · **Status:** Pronta pra testar no app (09/11; protótipo aprovado: `docs/design/hospedagem-v2.html`)

## Objetivo
Abrir Reservas → Hospedagem e ver, **noite por noite**, onde o grupo dorme, o que falta decidir e quanto custa tudo. Cada opção mostra só o que o grupo compara de verdade: preço, distância da estação onde chegam e se dá pra entrar no horário em que chegam.

## Por que
Pedido do Victor (08/11): "a hospedagem está horrível". As reuniões (22/10, 27/10, 28/10, 06/11) mostram como eles escolhem onde dormir:
- comparam **preço, distância da estação e check-in tardio** (a reunião de Veneza foi só isso);
- a pergunta é "onde dormimos **cada noite**, perto de onde chegamos, e conseguimos entrar?", e não "qual Airbnb é mais bonito";
- chegam tarde (Veneza ~1h): o check-in até meia-noite precisa estar à vista;
- no dia do check-out ficam com as malas: guarda-volumes perto da estação;
- Mônaco, Bernina e Milão não pedem cama (bate-e-volta ou passagem);
- a escolha é **provisória** até reservar;
- pediram o **total gasto em hospedagem**.

A tela de hoje é uma lista por destino, com botões de busca no topo e muitos campos no formulário. Ela não responde nenhuma dessas perguntas de cara.

## Inclui
1. **Linha das noites.** Uma linha por noite da viagem, agrupada por cidade ("Nice · 3 noites · sex 4 a dom 6"). Cada grupo mostra o estado:
   - **Sem cama:** nenhuma opção ainda. Fica em destaque, laranja.
   - **Comparando:** tem opções, ninguém escolheu.
   - **Escolhida:** tem uma escolhida, mas falta reservar.
   - **Reservada:** reservada e paga (verde).
   - Bate-e-volta e passagem (destino de 0 noites) **não aparecem** como pendência, só como uma linha fina "Mônaco: bate-e-volta, dorme em Nice".
2. **No topo, três números, igual a Passagens:** noites sem cama, pra reservar e reservadas. Embaixo, o **total da hospedagem** (por pessoa e do grupo) e quanto já foi pago.
3. **Cartão de cada opção** com só 4 coisas:
   - nome e site (Airbnb, Booking, hotel), foto se tiver;
   - **preço total e por pessoa** (por noite em letra menor);
   - **distância a pé da estação** de chegada ("8 min a pé da Santa Lucia"). A estação vem do último deslocamento do dia de chegada (spec 122). Sem endereço, mostra "Pôr endereço pra ver a distância";
   - **check-in até que horas contra a hora em que chegam:** verde "Chegam 01:10, check-in até 02:00"; vermelho "Chegam 01:10, check-in só até 00:00. Falar com o anfitrião". Sem deslocamento no dia, só mostra o horário.
   - Além disso: corações de voto (quem votou) e o selo "Escolhida".
4. **Comparar lado a lado:** com 2 ou mais opções na mesma cidade, o botão "Comparar" mostra as opções em colunas: preço/pessoa, distância, check-in, votos. O melhor de cada linha fica marcado, como no Comparar de deslocamento.
5. **Pôr uma opção é curto:** colar o link (o app já lê o título e a foto, spec 072) e o preço total. Endereço e check-in até ficam à vista porque mudam a conta da distância e do aviso. Todo o resto (check-out, regras, wi-fi, código da porta, cancelamento, contato do anfitrião, guarda-malas) vai pra **"Mais detalhes"**.
6. **Buscar:** os atalhos Airbnb, Booking e Maps saem do topo e vão pra dentro da cidade sem cama ("Procurar em Tirano"), já com as datas e o número de pessoas.
7. **Dia do check-out:** quando o próximo deslocamento sai 3h ou mais depois do check-out, a linha do dia mostra "Malas: guarda-volumes perto da estação de Como" com o link do Maps. É o mesmo cálculo do aviso de malas da spec 122b.
8. **Permissões iguais às da spec 122:** o membro põe opção e vota; o ADM escolhe e marca como reservada e paga.

## Não inclui (fica pra depois)
- Ler print da reserva (decidido em 08/11: print e link não agradaram pro transporte; aqui o link fica só pra preencher nome e foto).
- Quem dorme em qual quarto (spec 068).
- Busca de preço automática em Airbnb ou Booking (eles não têm API aberta).
- Mudanças no site (web). Primeiro o app; o site continua com a tela atual.

## Telas
- **Reservas → Hospedagem (app):** três números, total e a linha das noites. A cidade aberta mostra os cartões das opções, "Pôr opção" e "Comparar".
  - **Vazio** (viagem sem destino com noites): "Ponha os destinos e as datas no roteiro pra ver as noites."
  - **Carregando:** esqueleto. **Erro:** "Não deu pra carregar. Tentar de novo".
- **Pôr opção:** uma tela só, com link, nome, preço total, endereço e check-in até. Embaixo, "Mais detalhes".
- **Comparar hospedagem:** colunas, igual ao Comparar de deslocamento.
- **Cartão na tela da viagem:** troca o "Hospedagem: opções e votos" por "2 noites sem cama · R$ 3.400 no total".

## Dados
- Tabela `hospedagens` (já existe): `preco_total`, `endereco`, `hora_checkin_limite`, `checkin`, `checkout`, `escolhida`, `link`, `foto_url`. Votos em `hospedagem_votos`.
- **Migration nova (pequena):**
  - `lat` e `lon` em `hospedagens`, pra calcular a distância. Preenchidos ao salvar o endereço (geocodificação, como no Novo deslocamento).
  - `reserva` (`nao` | `reservada` | `paga`), pra separar "escolhida" de "reservada". Só o ADM muda (gatilho no banco). Migration `20261109120000_hospedagem_por_noite.sql`, aplicada.
- Distância a pé: em linha reta × 1,3 ÷ 80 m/min. É suficiente pra comparar e não precisa de API. A estação vem do destino do último trajeto do dia.

## Quem pode o quê
| Ação | ADM | Membro |
|---|---|---|
| Ver noites, opções e total | Sim | Sim |
| Pôr opção e votar | Sim | Sim |
| Editar ou apagar a própria opção | Sim | Sim |
| Editar ou apagar a opção de outro | Sim | Não |
| Escolher a opção da noite | Sim | Não (só se "membro edita hospedagem" estiver ligado) |
| Marcar reservada ou paga | Sim | Não |

## Critérios de aceite
- [ ] Na Eurotrip, a Hospedagem mostra Nice (3 noites), Tirano (2), Veneza (1+) e Roma sem data. Mônaco, Bernina e Milão aparecem como bate-e-volta ou passagem, não como pendência.
- [ ] Os três números batem com a linha das noites.
- [ ] O total soma só as opções escolhidas e mostra também o valor por pessoa.
- [ ] Uma opção com endereço perto da estação de chegada mostra "N min a pé da estação".
- [ ] Chegando em Veneza 01:10 com check-in até 00:00, o cartão fica vermelho e oferece falar com o anfitrião.
- [ ] Com 2 opções em Veneza, "Comparar" mostra as duas lado a lado com o melhor preço e a menor distância marcados.
- [ ] Pôr opção só com link e preço funciona; o resto fica em "Mais detalhes".
- [ ] O membro põe opção e vota, mas não vê "Escolher" nem "Reservada".
- [ ] O dia do check-out com trem tarde mostra o guarda-volumes perto da estação.
- [ ] Funciona em 360px.

## Perguntas em aberto
- Colar o link pra preencher nome e foto vale aqui? (No transporte, print e link não agradaram.) Proposta: sim, só pra nome e foto.
- Quando a ADM marca "Reservada", o app lança o gasto no Financeiro sozinho? Hoje existe "lançar como gasto" à mão. Proposta: perguntar com um botão, sem lançar sozinho.

## Dicas pra implementar
- **Core:** função pura nova `noitesDaViagem(destinos, opcoes, trajetos)` em `packages/core/src/hospedagem.ts`, que devolve as noites agrupadas por cidade e os contadores, mais `distanciaAPe(a, b)`. Teste em `apps/web/tests/`. Reaproveita `montarHospedagem`, `contasDaOpcao`, `avisosDoDia` (malas e check-in) e `opcoesNoDia`.
- **App:** reescrever o `TelaDeHospedagem` em `apps/mobile/app/hospedagem.tsx`, que já é usado em Reservas com `naAba`. Copiar a estrutura do `TelaDePassagens` (`Contador`, `Lista`, recarregar com `useFocusEffect`). O Comparar copia o `apps/mobile/app/comparar.tsx`.
- **Geocodificar o endereço** com o mesmo helper do Novo deslocamento.
- Não rodar prettier. Nada de emoji. Ícones só de `src/ui/icones`.

## Como ficou (09/11)
- **Core:** `packages/core/src/noites.ts` (`noitesDaViagem`, `fatosDaOpcao`, `checkinContraChegada`, `minutosAPe`, `textoDasNoites`). Teste: `apps/web/tests/noites.test.mjs` (4 passam). Em `hospedagem.ts`: `reserva`, `selfCheckin`, `lat/lon` na opção; `atualizarOpcaoDeHospedagem`, `apagarOpcaoDeHospedagem`, `marcarReservaDaHospedagem`.
- **App:**
  - `app/hospedagem.tsx`: as noites (aba Reservas → Hospedagem).
  - `app/cidade-hospedagem.tsx`: as opções da cidade, voto, Comparar e as ações do ADM.
  - `app/opcao-hospedagem.tsx`: pôr ou editar uma opção. O endereço vira ponto no mapa (Transitous) pra calcular a distância.
  - Carregador comum: `src/dados/hospedagemDaViagem.ts`.
- Bate-e-volta aparece como linha fina: "Mônaco (sáb 5): só de dia, dormem em Nice".
- **Não testado:** salvar opção, votar e as ações do ADM (não gravei dado de teste na Eurotrip). Na Eurotrip, Veneza, Roma e Paris (volta) estão sem data de saída, então aparecem como "Sem datas no roteiro".
- **Respostas às perguntas:** o link preenche nome e foto. Marcar reservada **não** lança gasto sozinho.
