# 121. Transporte v2: quem chega, entre cidades e "como chegar"

**Fase:** 0 · **Tamanho:** G (dividida em 121a a 121c) · **Depende de:** 004, 067, 120 · **Status:** 121a, 121b e 121c prontas pra testar (08/11/2026, banco aplicado)

> Revisão da [004 (Transportes)](004-transportes.md). A 004 continua valendo pro que já existe (trechos, bate-e-volta, avisos); esta spec troca a ideia da tela e diz o que vem depois.
> Cabe no [`docs/RUMO.md`](../RUMO.md) como **conserto da base que alimenta o "Hoje" (120)**: não é funcionalidade nova solta.

## Objetivo
Cada pessoa vê, sem perguntar no grupo, **como todo mundo chega e vai embora**, **como o grupo vai de uma cidade pra outra** (de onde sai, onde desce, o que tem no caminho) e, no dia a dia, **como chegar agora** no próximo lugar, de metrô, ônibus, Uber ou a pé.

## Por que
- Victor (08/11): "a página de transporte está ruim. Transporte não é só avião: é trem, ônibus, até Uber."
- Ingryd (mensagem de sexta, 06/11): "adicionar uma parte que mostra **por onde os ônibus ou trens passam**".
- A 004 nasceu com a pergunta "como o comboio vai da cidade A pra B, cadastrado pelo ADM". Na viagem de verdade são **3 perguntas diferentes**, e a tela atual não responde bem a nenhuma:

| Tipo | Exemplo | Tem reserva? | O que a pessoa quer saber |
|---|---|---|---|
| **1. Chegar e ir embora** | Ana voa de SP, Paulo vem de ônibus de BH | Sim, cada um a sua | "Quem chega quando? Quem busca quem?" |
| **2. Entre cidades** | Trem Roma → Florença, ônibus pra Garopaba, carro alugado | Às vezes | "Que horas sai, de onde, onde desço, o que tem no caminho?" |
| **3. No dia a dia** | Metrô, ônibus urbano, Uber, a pé | Não | "Como eu chego ali **agora**?" |

- Hoje, no app, a tela é só uma lista pra ler (sem botão de adicionar). Membro não consegue lançar nem o próprio voo: o banco só deixa o ADM (ou quem ele liberou) criar trajeto, então a reserva da 120b dá erro pra quem não é ADM.

## Inclui (em 3 partes, nesta ordem)

### 121a · A tela vira linha do tempo, e cada um lança o seu
- **Topo, "Chegadas e saídas":** uma linha por pessoa do comboio, com o voo ou ônibus de ida e de volta: "Ana · sex 28 · chega 10:25 em FLN · Paulo busca". Quem ainda não lançou aparece como "**Falta o seu**" (só pra própria pessoa: botão "Adicionar meu voo/ônibus"; pros outros: "Ana ainda não pôs").
- **Meio, "Entre cidades":** os trechos da 004 (um por par de destinos seguidos), cada um com o trajeto ou "Como vocês vão?".
- **Cada cartão mostra:** meio (ícone), horário de saída e chegada, **estação ou aeroporto de saída e de chegada**, número do voo/trem, situação (pesquisando / reservado), quem vai, e os botões "ver reserva" (cofre, 028) e "Como chegar na estação".
- **Adicionar:** 3 jeitos, os mesmos da 120b: **print, PDF ou colar o texto** da reserva, ou preencher na mão. O formulário pergunta primeiro "**É a sua chegada/saída ou um trecho do grupo?**".
- **Membro lança o próprio transporte:** o que ele lança é dele (ele é passageiro). Só ele e o ADM editam e apagam. Trecho do grupo continua do ADM (ou de quem ele liberou).
- **Meios aceitos:** avião, trem, ônibus, carro (próprio ou alugado), barco, carona, a pé, outro. "Carona" e "carro" mostram quem dirige e quantos lugares sobram (067).

### 121b · "Como chegar" em todo endereço
- **Sem cadastrar Uber nem metrô.** Em todo endereço da viagem (casa, evento da agenda, lugar do roteiro, estação do trajeto) entra o botão **"Como chegar"**.
- Abre um menu com: **Transporte público** (Google Maps no modo transporte público, com o destino preenchido), **Uber** (link do Uber com o destino), **A pé** (Maps a pé). No iPhone, o Apple Maps também aparece.
- Mora sobretudo no **"Hoje"** (120): no plano do dia, cada item tem "Como chegar". No transporte, aparece nas estações.
- Se o lugar tem coordenada, o link vai pela coordenada; se não, pelo endereço escrito.

### 121c · Mapa do trajeto com as paradas (a ideia da Ingryd)
- Num trajeto de **trem ou ônibus**, o botão "**Ver o caminho**" abre o mapa com a linha desenhada e **as paradas no meio** (Roma → Orvieto → Chiusi → Florença), com horário em cada uma.
- **"Onde eu desço?"**: a parada de chegada em destaque. Durante o trajeto, com o app aberto e a localização ligada: "**a sua é a próxima**".
- **"Dá pra parar no meio?"**: nas paradas que são cidades, "**Dá pra conhecer no caminho**" sugere ficar umas horas ali. Se o grupo para, vira carimbo (118a).
- **De onde vêm os dados, em 2 passos:**
  1. **Primeiro (sempre funciona):** "Ver o caminho" abre o Google Maps no modo transporte público de A pra B. A pessoa sai do app, mas o caminho aparece.
  2. **Depois (se a cobertura servir):** um serviço aberto de rotas de transporte público (ex.: **Transitous**, grátis, com trens e ônibus de vários países a partir de dados GTFS) devolve as paradas e a linha pra desenhar **dentro** do app. Guardar o resultado no trajeto, pra não buscar toda vez.
- Ônibus rodoviário no Brasil (rodoviária → rodoviária) tem pouco dado aberto: lá fica o passo 1 até achar fonte melhor.

## Não inclui (fica pra depois)
- Comprar passagem pelo app ou mostrar preço real de voo, trem e ônibus.
- Status do voo ao vivo (atraso, portão): precisa de API paga (já estava fora na 120).
- Chamar o Uber de dentro do app (só abre o app do Uber com o destino).
- Rota de carro com pedágio e combustível.
- Trajeto local cadastrado ("metrô até o Coliseu"): o "Como chegar" resolve sem guardar nada.

## Telas
- **Transportes (app e site):** título "Como a galera se move". Duas seções: "Chegadas e saídas" (por pessoa) e "Entre cidades" (por trecho), em ordem de data. Botão fixo "+ Adicionar" (print, PDF, colar texto, preencher).
- **Estado vazio:** "Ninguém pôs o transporte ainda. Manda o print do seu voo ou ônibus que a Norti preenche." + botão.
- **Cartão do trajeto:** ícone do meio, "09:10 Roma Termini → 10:47 Firenze S.M.N.", número, situação, rostos de quem vai, "ver reserva", "Como chegar na estação", "Ver o caminho" (trem e ônibus).
- **Menu "Como chegar":** gaveta com Transporte público / Uber / A pé (e Apple Maps no iPhone).
- **Mapa do caminho (121c):** mapa em cima, lista de paradas embaixo com horário; a parada de chegada em destaque; "Dá pra conhecer no caminho" nas cidades.
- **"Hoje" (120):** o bloco "quem chega e quem sai" passa a ler daqui; cada item do plano ganha "Como chegar".

## Dados
- **Já existem em `trajetos`:** `meio`, `partida`, `chegada`, `origem_id`, `destino_id`, `estacao_partida`, `estacao_chegada`, `escalas`, `situacao`, `link_reserva`, `preco`, `moeda`, `motorista_id`, `quem_busca_id`, `observacao`. E `trajeto_passageiros` (sem ninguém = o comboio inteiro).
- **Migration nova (121a):**
  - `trajetos.tipo` (`'chegada'`, `'saida'`, `'trecho'`; padrão `'trecho'`), pra separar a chegada de cada um dos trechos do grupo.
  - `trajetos.criado_por` (padrão `auth.uid()`).
  - `meio` aceita também `'carona'`.
  - **RLS:** membro **cria** trajeto de `tipo` chegada/saída (ou trecho, se liberado); **edita e apaga** o que ele criou; ADM (ou liberado em "transportes") continua editando tudo. Ver o que já existe em `20261031070000_permissoes_simples.sql`.
- **121b:** sem banco (só links).
- **121c:** `trajetos.caminho` (jsonb: paradas com nome, horário, coordenada; e a linha), preenchido pela busca e guardado.

## Quem pode o quê
| Ação | ADM | Membro |
|---|---|---|
| Ver todos os transportes | Sim | Sim |
| Lançar a própria chegada/saída | Sim | Sim |
| Editar/apagar a chegada/saída de outra pessoa | Sim | Não |
| Criar/editar trecho do grupo | Sim | Só se o ADM liberou "transportes" |
| Marcar "eu busco" numa chegada | Sim | Sim |
| Usar "Como chegar" e "Ver o caminho" | Sim | Sim (convidado da web leve também) |

## Critérios de aceite
- [ ] 121a: membro (não ADM) manda o print do próprio voo, confere e confirma: aparece em "Chegadas e saídas" pra todo mundo, com o nome dele.
- [ ] 121a: outro membro não consegue editar nem apagar esse voo; o ADM consegue.
- [ ] 121a: pessoa sem chegada lançada vê "Falta o seu"; os outros veem "Ana ainda não pôs".
- [ ] 121a: trem Roma → Florença mostra estação de saída e de chegada e o número do trem.
- [ ] 121a: carona mostra quem dirige e quantos lugares sobram.
- [ ] 121b: no "Hoje", tocar "Como chegar" num evento abre o Maps em transporte público com o destino certo; "Uber" abre o Uber com o destino.
- [ ] 121c (passo 1): "Ver o caminho" num trem abre o Maps de A pra B em transporte público.
- [ ] 121c (passo 2): com dado disponível, o mapa mostra a linha e as paradas com horário, e a parada de chegada em destaque.
- [ ] Tudo funciona em 360px (site) e no app.

## Como ficou (08/11/2026)
- **Banco:** `20261108230000_transporte_v2.sql` (`trajetos.tipo`, `criado_por`, `lugares_livres`, `caminho`; `meio` aceita `carona`; RLS nova; passageiros: quem lançou também põe e tira gente) e `20261108233000_eu_busco.sql` (`vou_buscar(trajeto, buscar)`: qualquer membro com conta marca "eu busco" sem poder editar o resto). Testado com rollback: membro cria e edita a própria chegada, não vira trecho, não cria trecho, não edita a dos outros, não lança em nome de outro; convidado anônimo barrado.
- **Core:** `packages/core/src/transporte-do-grupo.ts` (`tipoProvavel`, `chegadasPorPessoa`, `trechosDoGrupo`, `linksComoChegar`, `linkDoCaminho`, `decodificarLinha`, `caminhoDaResposta`, `buscarCaminho` no Transitous) + teste `transporte-do-grupo.test.mjs`. `salvarReserva` grava o `tipo` (chegada, saída ou trecho).
- **App:** `app/transportes.tsx` refeito (Chegadas e saídas + Entre cidades, apagar o que é seu, "Eu busco", botão fixo "Adicionar transporte"); `app/nova-reserva.tsx` pergunta "Minha chegada / Minha volta / Trecho do grupo" (vem marcado o provável); `app/caminho.tsx` (mapa em SVG com a linha e as paradas, "Estou no caminho: qual a próxima?", "Dá pra conhecer no caminho"); `src/ui/BotaoIr.tsx` virou "Como chegar".
- **Site:** seção `features/transportes/ChegadasESaidas.tsx` no topo de Transportes; `FormTrajeto` aceita chegada/volta (origem "De fora", destino "Pra casa", sem bate-e-volta) e lugares sobrando; "Ver o caminho" (link do Maps) em trem e ônibus; `BotaoIr` ganhou transporte público e a pé.
- **Transitous:** conferido em 08/11: Roma → Florença devolve o trem com paradas e linha; Florianópolis → Garopaba (ônibus) não devolve nada, aí fica o link do Maps. Resposta do serviço é guardada em `trajetos.caminho` (quem não pode editar só vê, sem guardar).
- **Não conferido:** o app no celular (precisa do build de desenvolvimento); salvar de verdade pelo site (gravaria no banco de produção).

**Mudança (08/11, Victor):** a seção "Chegadas e saídas" por pessoa e o painel "Viagem inteira" com o mapa saíram da tela (app e site): ocupavam espaço e ele não gostou. A tela ficou só com os trechos em lista (vazios compactos). Chegada e volta lançadas pela reserva aparecem no fim, em "Outros trajetos". O banco (tipo, "Eu busco") continua.

## Perguntas em aberto
- O "Falta o seu" vira um lembrete no celular antes da viagem (ex.: 7 dias antes)? Seria mais um tipo de aviso.
- Transitous: confirmar a cobertura de trem e ônibus no Brasil e na Europa e o limite de uso antes de começar o passo 2 da 121c. Alternativa paga: Google Directions no modo transporte.
- Carro alugado entra como "trecho do grupo" (com quem dirige) ou ganha um cartão próprio (retirada e devolução)?
- "a sua é a próxima" precisa de localização em segundo plano? Na 1ª versão, só com o app aberto.

## Dicas pra implementar
- Core: `packages/core/src/transportes.ts` (já tem `conexoes` e escalas) e `reserva-lida.ts` (`trajetoDaReserva`, `salvarReserva`: hoje falha pra membro por causa da RLS; com a 121a passa a gravar `tipo` chegada/saída).
- App: `apps/mobile/app/transportes.tsx` (132 linhas, só lista) vira a linha do tempo; o "+ Adicionar" reaproveita `app/nova-reserva.tsx`.
- Site: `apps/web/src/pages/viagem/Transportes.tsx` (formulário completo já existe; separar as duas seções).
- "Como chegar": uma função no core que monta os links (`https://www.google.com/maps/dir/?api=1&destination=...&travelmode=transit`, link universal do Uber com `dropoff`), e uma peça `ComoChegar` no app e no site.
- Ícones: só `<Icone nome="...">` (ver `docs/design/ICONES.md`); conferir se há ícone de carona e de barco no catálogo.
