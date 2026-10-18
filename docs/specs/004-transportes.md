# 004. Transportes

**Fase:** 1 · **Tamanho:** G · **Depende de:** 001 · **Status:** A fazer

## Objetivo
O ADM registra como o comboio vai de um destino pro outro: meio de transporte, horário, observações. O app avisa os casos chatos de logística, como o bate-e-volta que obriga a voltar pra base e pagar uma diária a mais.

## Por que
É um dos 3 diferenciais do benchmark ("logística de bate-e-volta, ninguém trata isso direito"). Do áudio: Nice → Mônaco → volta pra Nice pra pegar as malas, +1 diária de Airbnb, e o trem pra Suíça. Também resolve o "como é que ela vai saber os horários dos ônibus?".

## Inclui
- **Trechos:** um para cada par de destinos seguidos. A tela já monta essa lista sozinha a partir do roteiro.
- **Adicionar trajeto num trecho:**
  - meio (trem, ônibus, avião, carro, barco, a pé, outro);
  - partida e chegada (data e hora);
  - observação (ex.: "comprar bilhete na estação");
  - link da reserva (opcional).
- **Bate-e-volta:** marcar o trajeto como ida e volta no mesmo dia. O app mostra a volta e o aviso:
  - "Vocês voltam pra Nice no mesmo dia: confiram se a diária em Nice cobre essa noite."
  - Com as datas da spec 001, dá pra ser exato: "a saída de Nice é dia 14, mas a volta do bate-e-volta é dia 15".
- **Próximo trajeto:** o mais perto de agora, usado no cartão da Overview (spec 006).
- **Linha do tempo:** os trajetos em ordem de partida, agrupados por dia.

## Não inclui
- Buscar horários reais de trem e ônibus numa API (Fase 3).
- Preço do transporte. O preço vira um gasto na spec 002; no máximo, um botão "lançar como gasto" que abre o formulário já preenchido.
- Cálculo de rota e distância real.

## Telas
- **Transportes:** os cartões de trecho que já existem ("Nice → Mônaco") passam a mostrar o trajeto cadastrado ou o botão "Adicionar trajeto" (só ADM).
- **Formulário do trajeto:** origem e destino já vêm preenchidos pelo trecho; meio com ícones; datas e horas; o interruptor "bate-e-volta".
- **Avisos:** cartão laranja-claro, igual ao do protótipo, quando:
  - existe bate-e-volta;
  - a partida é antes da chegada no destino anterior;
  - o trajeto cai fora das datas do destino.

## Dados (já existem no banco)
- **`trajetos`:** `viagem_id`, `origem_id`, `destino_id`, `meio`, `partida`, `chegada` (com hora), `bate_e_volta`, `observacao`.
- Só o ADM cria, edita e apaga; o comboio vê.
- Se um destino for removido do roteiro, o trajeto continua existindo, mas fica sem origem ou destino (`on delete set null`). A tela precisa mostrar esse caso: "trajeto sem destino, editar ou apagar".
- **Talvez mude no banco:** uma coluna `link_reserva` (texto). É uma migration nova e pequena.

## Quem pode o quê
| Ação | ADM | Membro |
|---|---|---|
| Ver trajetos e avisos | sim | sim |
| Criar, editar e apagar trajeto | sim | não |

## Critérios de aceite
- [ ] Roteiro Nice → Mônaco → Milão mostra 2 trechos.
- [ ] O ADM adiciona "trem, 14/11 09:10 → 09:35" em Nice → Mônaco, salva e atualiza a página: continua lá.
- [ ] Marcar bate-e-volta mostra o aviso da diária extra.
- [ ] O membro vê tudo, mas não vê "Adicionar" nem "Editar".
- [ ] Remover Mônaco do roteiro: o trajeto aparece como "sem destino" em vez de sumir ou quebrar a tela.
- [ ] O "próximo trajeto" é o de partida mais próxima no futuro.

## Perguntas em aberto
- O bate-e-volta vira 1 trajeto marcado como ida e volta, ou 2 trajetos (ida e volta)? (Sugestão: 2 trajetos, com a volta criada sozinha, porque a volta pode ser noutro horário.)
- Membro pode sugerir trajeto pro ADM aprovar? (Sugestão: depois.)

## Dicas pra implementar
- Tela: `src/pages/viagem/Transportes.tsx` (o `TODO (Ingryd)`). Lógica: `src/features/transportes/api.ts`.
- As regras de aviso dão boas funções puras pra testar (`src/features/transportes/avisos.ts`).
- Ícones: `TrainFront`, `Bus`, `Plane`, `Car`, `Ship`, `Footprints` do lucide-react.
- Datas com hora (`timestamptz`) voltam do banco em UTC. Mostre no fuso do destino ou, pra simplificar, no fuso do celular, e deixe isso escrito na tela.
