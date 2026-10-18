# 011. Hospedagem

**Fase:** 2 · **Tamanho:** M · **Depende de:** 001 · **Status:** Em andamento

## Objetivo
Para cada destino do roteiro, o comboio busca onde ficar (Airbnb, Booking, Google Maps já preenchidos com cidade, datas e número de pessoas), junta as opções que cada um achou, vota, e o ADM fecha a escolhida. O app mostra quanto sai por pessoa e por noite e lança o valor como gasto.

## Por que
Ideia do Victor (18/10/2026): depois de escolher pra onde vão, o passo seguinte é "onde vamos ficar". Hoje isso acontece no grupo de WhatsApp, com link perdido no meio da conversa. Pesquisa em `docs/pesquisa-hospedagem.md`: Airbnb e Booking não têm API aberta, então a fase 1 usa links de busca prontos + decisão em grupo dentro do app.

## Inclui
- **Uma seção por destino**, na ordem do roteiro, com datas e número de noites.
  - **Destino sem pernoite** (chegada = saída) aparece como "bate-e-volta: sem hospedagem".
  - **Ponto de partida e de volta no Brasil** (primeiro ou último destino, sem datas ou sem pernoite) aparece recolhido.
- **Buscar:** botões Airbnb, Booking e Google Maps.
  - Abrem a busca na cidade do destino, com check-in e check-out e o número de pessoas do comboio.
  - Sem datas no destino, abrem só com a cidade, e a tela avisa: "defina as datas no roteiro".
- **Opções:** qualquer pessoa do comboio adiciona:
  - link (o app reconhece Airbnb, Booking, Hostelworld, Expedia, Vrbo, Google);
  - nome, preço total, moeda, check-in, check-out e observação.
- **Votar:** um coração por pessoa em cada opção. A lista ordena pelos mais votados, e as fotos de quem votou aparecem na opção.
- **Contas:** preço por pessoa (total ÷ comboio) e por noite.
- **Escolhida:** o ADM marca uma opção como escolhida, e só pode haver uma por destino. Ela vai pro topo, em destaque, com:
  - "Abrir reserva" (o link);
  - "Lançar como gasto" (abre o formulário do Financeiro já preenchido: categoria Hospedagem, valor, moeda e descrição).
- **Avisos:**
  - destino com pernoite e sem hospedagem escolhida;
  - escolhida com check-in ou check-out diferente das datas do destino ("a hospedagem termina dia 4, mas vocês saem de Nice dia 5").
- **Resumo no topo:** "X de Y destinos com hospedagem" e o total das escolhidas por moeda, e por pessoa.
- **Overview:** cartão "Hospedagem" com o resumo, que leva pra aba.

## Não inclui (fica pra depois)
- Preço e disponibilidade reais dentro do app (LiteAPI) e sugestões de hotéis no mapa (Google Places).
- Reservar pelo app.
- Link de afiliado (Travelpayouts/Booking).
- Ler foto e preço automaticamente a partir do link (precisa de servidor).

## Telas
- **Nova aba "Hospedagem"** no menu, logo depois da Overview (no celular: "Estadia").
- Topo: título, resumo e barra de progresso.
- Por destino: cabeçalho (número, nome, datas, selo de status), a escolhida em destaque, os botões de busca, a lista de opções e "+ Adicionar opção".
- Formulário numa gaveta: o link vem primeiro, e o nome é sugerido a partir do site.
- Estado vazio do destino: "Nenhuma opção ainda. Busque nos sites acima e cole aqui o link do que gostar."

## Dados (migration nova)
- **`hospedagens`:**
  - `id`, `viagem_id`, `destino_id` (sem destino se ele sair do roteiro);
  - `nome`, `link`, `preco_total`, `moeda`, `checkin`, `checkout`, `observacao`;
  - `escolhida`, `criado_por`, `criado_em`.
- **`hospedagem_votos`:** (`hospedagem_id`, `usuario_id`).
- Função `escolher_hospedagem(p_hospedagem, p_escolher)`: desmarca as outras do destino e marca esta, tudo de uma vez.
- Regras no banco:
  - o destino precisa ser da mesma viagem;
  - só o ADM marca ou desmarca a escolhida;
  - no máximo uma escolhida por destino (índice único).

## Quem pode o quê
| Ação | ADM | Membro |
|---|---|---|
| Ver opções, votos e escolhida | sim | sim |
| Adicionar opção | sim | sim |
| Editar ou apagar opção | qualquer uma | só a sua |
| Votar / tirar o voto | o seu | o seu |
| Marcar a escolhida | sim | não |
| Lançar a escolhida como gasto | sim | sim |

## Critérios de aceite
- [ ] O destino Nice (1 a 3 jun, 2 noites, comboio de 4) abre o Airbnb com `checkin=2027-06-01`, `checkout=2027-06-03` e `adults=4`.
- [ ] O membro adiciona "Apê no Vieux Nice", com link do Airbnb e €480. Aparece o selo "Airbnb", "€120 por pessoa" e "€240 por noite".
- [ ] Outra pessoa vota, atualiza a página, e o voto continua lá com a foto dela.
- [ ] O membro não vê "Escolher"; o ADM escolhe, e a opção vai pro topo com destaque. Escolher outra desmarca a primeira.
- [ ] "Lançar como gasto" abre o formulário com Hospedagem, €480 e "Hospedagem: Apê no Vieux Nice".
- [ ] Destino com pernoite sem escolhida mostra o aviso; destino bate-e-volta não pede hospedagem.
- [ ] O membro não consegue apagar a opção de outra pessoa (nem pela tela, nem pelo banco).

## Perguntas em aberto
- Votar com 1 coração ou de 1 a 3? (Decisão: 1 coração, mais simples; dá pra mudar depois.)
- Membro pode marcar a escolhida? (Decisão: só o ADM, igual ao roteiro.)

## Dicas pra implementar
- Lógica pura: `src/features/hospedagem/regras.ts` (links de busca, site do link, contas, avisos).
- Formulário de gasto: reaproveitar `FormGasto` com `inicial`.
- Ícones: `BedDouble`, `Heart`, `ExternalLink`, `Crown` (escolhida), `Search`.
