# Catálogo de funcionalidades da plataforma Together

> Versão 1 · 29/10/2026 · Base: specs 001–017, reuniões de 19/10 e 22/10, rotas de `apps/web` e `apps/mobile`, e a pesquisa de mercado em `reports/Mercado de apps de viagem em grupo.md` e `research_notes/Mercado de apps de viagem em grupo/`.
> Foco: **funcionalidades de produto**. Monetização, afiliados e Pix como negócio ficam fora deste documento (Pix aparece só como atalho de acerto, sem ser o centro).

## 1. Visão

Uma viagem em grupo passa por seis fases: **sonhar e decidir** (para onde, quando, quanto cada um topa gastar), **planejar** (roteiro, lugares, quem faz o quê), **reservar** (transporte, hospedagem, ingressos), **preparar** (documentos, seguro, mala, dinheiro), **viajar** (o dia de hoje, horários, encontros, gastos, imprevistos) e **depois** (acertar as contas, guardar as memórias, repetir). Hoje o comboio brasileiro atravessa essas fases pulando entre grupo de WhatsApp, planilha, Splitwise, Google Maps, e-mail de reserva, galeria do celular e Pix manual. O Together já cobre bem *planejar* (roteiro com datas, lugares, transportes, hospedagem com votos), parte de *preparar* (documentos de entrada por país, câmbio) e parte de *viajar* e *depois* (gastos, divisão, feed de fotos). A meta é ser o lugar onde o comboio **entra por um link no WhatsApp** e **só sai quando a conta zerou e as fotos estão guardadas**: decidir junto na fase 1, ter tudo anexado e conferido nas fases 3 e 4, ter uma tela "Hoje" que funciona sem internet na fase 5 e fechar com acerto, retrospectiva e "repetir viagem" na fase 6.

### Como ler as tabelas

| Coluna | Valores |
|---|---|
| **Status** | **Já temos** (pronto ou pronto pra testar) · **Parcial** (existe um pedaço) · **Novo** |
| **Referência** | Quem tem algo parecido no mercado (– = ninguém achado na pesquisa) |
| **Esf.** | Escala das nossas specs: **P** = poucos dias · **M** = cerca de 1 semana · **G** = mais de 1 semana (para uma pessoa, web + mobile contam como trabalho separado na UI; a regra fica no `packages/core`) |
| **Impacto** | Alto / Médio / Baixo, pesando a frequência da dor na pesquisa e quantas fases da viagem a função toca |
| **Tipo** | **Essencial** (sem isso a pessoa sai do app) · **Diferencial** (ninguém faz bem, é motivo pra escolher o Together) · **Encantamento** (faz a pessoa mostrar o app pros outros) |

Os códigos (A1, B3...) são usados no roadmap da seção 3.

---

## 2. Catálogo por área

### A. Decidir juntos

Dor: "interesses diferentes na programação" é o atrito nº 1 (42,7%, Imaginadora); achar data em comum (39%), orçamento (36%) e destino (26%) travam o começo (Skyscanner). Hoje só a hospedagem tem voto.

| # | Funcionalidade | O que faz | Status | Referência | Esf. | Impacto | Tipo |
|---|---|---|---|---|---|---|---|
| A1 | Enquete rápida | Qualquer pessoa cria uma pergunta com opções (única ou múltipla), prazo e "ver quem votou". Aparece na Overview e pode ser fixada. | Parcial (votos só na hospedagem) | Stippl, Mindtrip, Let's Jetty, TREK | P | Alto | Essencial |
| A2 | Datas em comum | Cada pessoa pinta no calendário os dias em que pode; o app mostra as janelas em que todos (ou quase todos) estão livres e vira o período da viagem com um toque. | Novo | Doodle, When2meet | M | Alto | Essencial |
| A3 | Orçamento combinado | Cada um informa, em segredo, a faixa que topa gastar; o app mostra só a faixa que serve pra todos e sugere o orçamento da viagem. | Novo | – | P | Alto | Diferencial |
| A4 | Destinos candidatos | Antes do roteiro, o comboio lista cidades/países candidatos com link e foto e vota; o mais votado vira destino. | Novo | Troupe (fechou), lista de desejos do Airbnb | M | Médio | Diferencial |
| A5 | Votos em lugares | Coração nos lugares (passeio, comida) da aba Lugares, com ranking por destino, reaproveitando o voto da hospedagem. | Parcial | Stippl, Pilot, SwipeSights | P | Alto | Essencial |
| A6 | "Não abro mão" | Cada pessoa marca até 3 coisas obrigatórias por destino; o planejamento do dia mostra se a vontade de todos foi atendida. | Novo | SwipeSights (swipe → plano) | M | Alto | Diferencial |
| A7 | Decisões registradas | Enquete encerrada vira "decisão" com data e resultado, e pode preencher o módulo certo (datas, destino, hospedagem). Histórico de decisões na Overview. | Novo | – | P | Médio | Diferencial |
| A8 | Modo rascunho ("sonhando") | Viagem sem datas e sem destinos fechados, só com ideias e enquetes; vira viagem de verdade quando o grupo decide. | Parcial (onboarding pede destino) | Wanderlog | P | Médio | Essencial |

### B. Roteiro e agenda do dia

Dor: "descumprimento de horários" (36,3%) e "ritmos diferentes" (36,1%). Hoje o roteiro é por destino, não por hora (a spec 016 deixou a agenda hora a hora pra depois).

| # | Funcionalidade | O que faz | Status | Referência | Esf. | Impacto | Tipo |
|---|---|---|---|---|---|---|---|
| B1 | Roteiro de destinos | Ordem, datas, noites, cidade repetida, bate-e-volta (0 noites) sem aviso falso, salvar tudo de uma vez. | Já temos | Wanderlog, Stippl | – | Alto | Essencial |
| B2 | Agenda do dia | Linha do tempo hora a hora que **puxa sozinha** trajetos, check-in/out e lugares, e aceita blocos livres (almoço, descanso). | Novo | Wanderlog, TripIt, Tripsy | G | Alto | Essencial |
| B3 | Ponto de encontro | Bloco com hora, local no mapa e contagem regressiva ("encontro na recepção às 7h40, faltam 12 min"), com push 15 min antes. | Novo | – | P | Alto | Diferencial |
| B4 | Programação em paralelo | O dia pode ter trilhas: "museu (Ana, Ingryd)" e "praia (resto)", com reencontro marcado. Respeita ritmos sem rachar o grupo. | Novo | – | M | Alto | Diferencial |
| B5 | Lembretes de compromisso | Push antes de trem, check-out, reserva de restaurante, ingresso com horário. Cada um escolhe a antecedência. | Novo | TripIt, Tripsy | M | Alto | Essencial |
| B6 | Tempo entre compromissos | Mostra quanto se leva de um item ao seguinte (a pé, transporte) e avisa quando não dá tempo. | Novo | Wanderlog, Airbnb (2026) | M | Médio | Essencial |
| B7 | Clima por dia | Previsão em cada dia da agenda e aviso de chuva em dia de passeio ao ar livre. | Novo | Wanderlog; pedido no Product Hunt | P | Médio | Essencial |
| B8 | Arrastar entre dias | Mover um lugar ou bloco de um dia pro outro e reordenar dentro do dia. | Novo | Wanderlog, Stippl | M | Médio | Essencial |
| B9 | Sugestão de ordem | Propõe a ordem dos destinos ou dos lugares do dia que reduz deslocamento. A estrutura já existe em `destinos/ordem.ts`. | Parcial | Wanderlog Pro, Stippl Pro | M | Médio | Diferencial |

### C. Mapa e lugares

Dor: "um milhão de links de Airbnb e passeios perdidos no WhatsApp" (TabNews). Hoje Lugares é lista por destino, sem mapa nem busca.

| # | Funcionalidade | O que faz | Status | Referência | Esf. | Impacto | Tipo |
|---|---|---|---|---|---|---|---|
| C1 | Mapa do roteiro | Destinos com bandeirinhas e linha da ordem do roteiro, com legenda honesta ("não é a rota do voo"). | Já temos | Wanderlog, Polarsteps | – | Alto | Essencial |
| C2 | Lugares por destino | Passeio, comida, guarda-volumes e outro, com link, horário, preço e observação. | Já temos | Wanderlog, Google Maps (listas) | – | Alto | Essencial |
| C3 | Lugares no mapa | Pins por tipo e por dia, junto da hospedagem escolhida; tocar no pin abre o lugar. | Novo | Wanderlog, Google Maps | M | Alto | Essencial |
| C4 | Buscar lugar | Autocompletar com endereço, foto, nota e horário de funcionamento (Google Places ou similar), em vez de digitar tudo. | Novo | Wanderlog, Mindtrip | M | Alto | Essencial |
| C5 | Abrir no app de navegação | Botão "Ir" em lugar, hospedagem e ponto de encontro: Google Maps, Waze, Apple Maps, Citymapper. | Parcial (só busca de hospedagem no Maps) | Wanderlog, TripIt | P | Médio | Essencial |
| C6 | Colar link de rede social | Colar ou compartilhar um link de Instagram, TikTok ou YouTube; a IA acha o lugar citado e sugere salvar no destino certo. | Novo | Triply-AI, Mindtrip, Layla | G | Médio | Encantamento |
| C7 | Importar lista do Google Maps | Trazer uma lista salva do Maps (ou um print dela) para Lugares. | Novo | Wanderlog; Screenshot List do Google Maps | M | Médio | Diferencial |
| C8 | Perto de mim | No destino, mostra os lugares salvos mais próximos de onde a pessoa está agora. | Novo | Wanderlog | P | Médio | Encantamento |
| C9 | Mapa offline do destino | Baixar o mapa da cidade antes da viagem (MapLibre + PMTiles no Storage) com os pins salvos. | Novo | Wanderlog Pro, Polarsteps, Maps.me | G | Alto | Diferencial |
| C10 | "Já fomos" | Marcar lugar como visitado; alimenta o diário e a retrospectiva. | Novo | Wanderlog, AdventureLog | P | Baixo | Encantamento |

### D. Transportes

Dor real das reuniões: situação da reserva, preço, conexões, primeiro/último trem e bate-e-volta. Grupo nem sempre viaja junto (chegadas em voos diferentes).

| # | Funcionalidade | O que faz | Status | Referência | Esf. | Impacto | Tipo |
|---|---|---|---|---|---|---|---|
| D1 | Trechos e trajetos | Um trecho por par de destinos; trajeto com meio, partida/chegada, observação, link da reserva; linha do tempo por dia. | Já temos | TripIt, Wanderlog | – | Alto | Essencial |
| D2 | Bate-e-volta | Ida e volta no mesmo dia, com aviso de diária na base. | Já temos | – | – | Alto | Diferencial |
| D3 | Próximo trajeto | Cartão na Overview com o próximo trajeto, mesmo sem horário. | Já temos | TripIt | – | Médio | Essencial |
| D4 | Situação e preço | Sugestão / reservado / comprado, preço e moeda, e "lançar como gasto" já preenchido (pendente desde 19/10). | Novo | TripIt | P | Alto | Essencial |
| D5 | Quem vai em cada trajeto | Escolher os passageiros do trajeto; cada pessoa vê o "meu itinerário" e o grupo vê quem chega quando. | Novo | TripIt (por viajante) | M | Alto | Essencial |
| D6 | Bilhete e cartão de embarque | Anexar PDF, imagem ou `.pkpass` ao trajeto, por pessoa; abre offline na hora do embarque. | Novo | TripIt, Tripsy | P | Alto | Essencial |
| D7 | Status do voo ao vivo | Número do voo → horário real, atraso, portão, esteira e cancelamento, com push para quem está no voo **e** para quem vai buscar. | Novo | Flighty, TripIt Pro, Tripsy | M | Alto | Diferencial |
| D8 | Conexões e estações | Um trajeto com várias pernas (escala, troca de trem), estação/terminal e tempo de conexão com alerta de conexão curta. | Novo | Flighty (Connection Assistant) | M | Médio | Essencial |
| D9 | Último trem para a base | Em bate-e-volta, mostra o horário do último trem/ônibus de volta e avisa no fim da tarde. | Novo | – | M | Alto | Diferencial |
| D10 | Horários reais de trem e ônibus | Buscar horários por API para preencher o trajeto (ideia guardada da Fase 3). | Novo | Rome2Rio, Omio, Trainline | G | Médio | Diferencial |
| D11 | Carro alugado e rodízio | Reserva do carro, quem dirige em cada trecho, combustível e pedágio estimados e divididos, devolução com lembrete. | Novo | Roadtrippers (combustível) | M | Médio | Diferencial |
| D12 | Transfer de chegada | Instrução de como ir do aeroporto/estação até a hospedagem (opções, preço, onde pegar), anexada ao primeiro dia. | Novo | Airbnb (Welcome Pickups) | P | Médio | Essencial |

### E. Hospedagem

A busca, os votos e a escolhida já funcionam. Falta o que a pessoa precisa **na porta da casa** e o conflito "quem fica no sofá-cama" (Skyscanner).

| # | Funcionalidade | O que faz | Status | Referência | Esf. | Impacto | Tipo |
|---|---|---|---|---|---|---|---|
| E1 | Busca com datas e pessoas | Botões Airbnb, Booking e Maps já com cidade, datas e tamanho do comboio. | Já temos | – | – | Alto | Diferencial |
| E2 | Opções, votos e escolhida | Qualquer um adiciona opção, todos votam, o ADM escolhe; preço por pessoa e por noite. | Já temos | Pilot, Airbnb (lista de desejos) | – | Alto | Diferencial |
| E3 | Lançar hospedagem como gasto | Abre o Financeiro já preenchido. | Já temos | – | – | Médio | Essencial |
| E4 | Horário de check-in/out | Hora de entrada e saída no cartão da opção. | Já temos | TripIt | – | Médio | Essencial |
| E5 | Endereço e como chegar | Endereço (com versão no idioma local), pin no mapa, contato do anfitrião (pendente desde 19/10). | Novo | Airbnb, TripIt | P | Alto | Essencial |
| E6 | Guia da casa | Wi-fi, código da porta/cofre de chaves, regras, lixo, ar-condicionado; visível só pro comboio e offline. | Novo | Airbnb (guia da casa) | P | Alto | Essencial |
| E7 | Quem dorme onde | Quartos e camas da hospedagem; cada um escolhe ou o app sorteia; opção de dividir o preço pelo tipo de cama. | Novo | – | M | Médio | Diferencial |
| E8 | Malas antes do check-in | Campo de guarda-volumes da hospedagem (aceita malas? até que horas?) ligado aos guarda-volumes de Lugares. | Parcial (só em Lugares) | Airbnb (Bounce) | P | Médio | Essencial |
| E9 | Prévia do link | Ao colar o link da opção, puxar foto, título e preço automaticamente. | Novo | Pilot, WhatsApp (prévia) | M | Médio | Encantamento |
| E10 | Prazo de cancelamento | Data limite de cancelamento grátis e lembrete antes dela; aviso de pagamento restante. | Novo | TripIt | P | Médio | Diferencial |

### F. Comboio e pessoas

Dor: obrigar todos a criar conta é o motivo de abandono mais citado (Splitwise, Wanderlog, Polarsteps). Família é a companhia mais comum (59,1%) e 7,6% se incomodam com alguém com pouca habilidade digital.

| # | Funcionalidade | O que faz | Status | Referência | Esf. | Impacto | Tipo |
|---|---|---|---|---|---|---|---|
| F1 | Papéis e gestão | ADM e membro, convite por link, remover, sair, viagem nunca sem ADM. | Já temos | TREK, Lambus | – | Alto | Essencial |
| F2 | Convidado sem conta | Abrir o link do convite e ver a viagem, votar e lançar gasto só com nome; criar conta depois sem perder nada. | Parcial (link pede login) | Tricount, Splid, TREK | M | Alto | Essencial |
| F3 | Pessoa sem app | Membro "de mentira" (a avó, a criança) que entra na divisão e nos quartos; o ADM lança por ela e pode convidá-la depois. | Novo | Splitwise, Tricount | P | Alto | Essencial |
| F4 | Núcleos (casal, família) | Agrupar pessoas que pagam juntas: a divisão e o acerto tratam o núcleo como uma unidade. | Novo | Settle Up (pesos) | M | Alto | Diferencial |
| F5 | Ficha da pessoa na viagem | Telefone, aniversário, idioma, restrições alimentares, alergias, mobilidade; o restaurante e a agenda avisam. | Parcial (nome e foto) | – | P | Médio | Diferencial |
| F6 | Contatos de emergência e saúde | Contato no Brasil, tipo sanguíneo, remédios, seguro; visível só pro ADM ou pra quem a pessoa escolher. | Novo | Apps de saúde (Ficha Médica) | P | Médio | Essencial |
| F7 | Permissões simples | Interruptores do ADM: "membro pode editar o roteiro / transportes / orçamento?" (poucos, não 17). | Novo | TREK | M | Médio | Diferencial |
| F8 | Localização ao vivo temporária | Opcional e por tempo ("compartilhar por 2 h"), só pro comboio; útil em show, parque, cidade grande. | Novo | Frienzy, WhatsApp, Life360 | G | Médio | Encantamento |
| F9 | "Cheguei bem" | Um toque avisa o comboio (ou só a família) que a pessoa chegou à hospedagem ou ao destino. | Novo | – | P | Médio | Encantamento |

### G. Comunicação

Decisão: **não** competir com o WhatsApp num chat completo (ver seção 4). O que falta é a conversa **presa ao item** e o aviso que não se perde.

| # | Funcionalidade | O que faz | Status | Referência | Esf. | Impacto | Tipo |
|---|---|---|---|---|---|---|---|
| G1 | Comentários em qualquer item | Gasto, lugar, opção de hospedagem, trajeto e enquete ganham comentários, como o feed já tem. | Parcial (só fotos) | Mindtrip, Pilot | M | Alto | Essencial |
| G2 | Avisos do ADM | Recado fixado no topo da viagem ("amanhã saímos 7h, levem casaco"), com push e "visto por". | Novo | Let's Jetty (notas) | P | Alto | Essencial |
| G3 | O que mudou | Feed de atividade: "Ana trocou o trem de Milão", "2 gastos novos", desde a última visita. | Novo | Google Docs, Wanderlog | M | Alto | Essencial |
| G4 | Central de notificações | Sininho com tudo que chegou e preferências por tipo (câmbio, fotos, gastos, horários). Reaproveita o push do boletim. | Parcial (push de câmbio e feed) | Todos | M | Alto | Essencial |
| G5 | Compartilhar no WhatsApp | Link com prévia bonita para convite, enquete, resumo do dia e acerto; abre direto no item. | Novo | Tricount (link) | P | Alto | Essencial |
| G6 | Resumo da noite | Push às 21h com "amanhã": primeiro compromisso, clima, ponto de encontro, o que levar. | Novo | TripIt (parcial) | P | Alto | Diferencial |
| G7 | Menções | `@nome` em comentário ou tarefa notifica a pessoa. | Novo | Lambus, Google Docs | P | Médio | Essencial |
| G8 | Bot de WhatsApp | Receber a agenda e lançar gasto mandando mensagem ("45 euros jantar todos"). Avaliar custo da API oficial. | Novo | – | G | Médio | Encantamento |

### H. Financeiro

O Together já é o mais forte do mercado em câmbio. Falta fechar o ciclo (marcar acerto como pago), cobrir quem divide por cota prévia (30,4% dos grupos) e tirar trabalho de quem lança.

| # | Funcionalidade | O que faz | Status | Referência | Esf. | Impacto | Tipo |
|---|---|---|---|---|---|---|---|
| H1 | Gastos e divisão | Gasto do comboio ou pessoal; dividir igual, entre alguns ou por valores; editar e apagar. | Já temos | Splitwise, Tricount | – | Alto | Essencial |
| H2 | Quem deve pra quem | Saldos com o menor número de pagamentos. | Já temos | Splitwise | – | Alto | Essencial |
| H3 | Orçamento por categoria | Barra de progresso com alerta em 80% e 100%. | Já temos | Wanderlog | – | Médio | Essencial |
| H4 | Câmbio de verdade | Compras de moeda, cotação média, termômetro de 90 dias, custo final com IOF e taxa, boletim 12h/20h. | Já temos | – | – | Alto | Diferencial |
| H5 | Lançamento rápido | Botão "+", teclado aberto, "detalhes depois", atalho do PWA, funciona sem internet. | Já temos | Splid | – | Alto | Essencial |
| H6 | Saldo das contas globais | Wise e Nomad lidas por e-mail; "euro do comboio" (spec 015). | Parcial (em andamento) | – | G | Médio | Diferencial |
| H7 | Marcar acerto como pago | Quem paga marca, quem recebe confirma; histórico de acertos. Atalho opcional com chave Pix copia-e-cola. | Novo | Splitwise, Tricount | P | Alto | Essencial |
| H8 | Caixa do comboio | Cota prévia por pessoa, quem já pagou a cota, gastos saindo do caixa e saldo que sobra (só registro, sem guardar dinheiro). | Novo | – | M | Alto | Diferencial |
| H9 | Divisão por pesos e por item | Pesos (casal = 2, criança = 0,5) e conta de restaurante item a item. | Novo | Settle Up, Tricount, Splid | M | Alto | Essencial |
| H10 | Foto do recibo | Anexar a nota ao gasto; a IA lê valor, moeda, data e estabelecimento e pré-preenche. | Novo | Splitwise Pro, Spliit | M | Alto | Diferencial |
| H11 | Câmbio congelado e meio de pagamento | Cada gasto guarda a cotação do dia e o meio (cartão, conta global, espécie) com o IOF certo. | Novo | TREK, Settle Up | M | Alto | Diferencial |
| H12 | Dinheiro na mão | Quanto de cada moeda em espécie cada pessoa ainda tem, descontando o que gastou em dinheiro (ficou de fora da 003). | Novo | – | M | Médio | Diferencial |
| H13 | Gastos planejados e recorrentes | Já reservado mas a pagar (sinal do Airbnb, saldo no check-in); diárias repetidas (estacionamento, carro). | Novo | SplitPro | P | Médio | Essencial |
| H14 | Meu orçamento pessoal | Cada um define o seu e vê o gasto real (compartilhado + pessoal) por dia. | Parcial (orçamento do comboio por pessoa) | Wanderlog | P | Médio | Essencial |
| H15 | Relatórios | Por categoria, por dia, por pessoa e "custo por pessoa por dia", com gráfico simples. | Novo | Splitwise Pro, Tricount | M | Médio | Diferencial |
| H16 | Exportar gastos | CSV, PDF e formato que o Splitwise importa. | Novo | Splid, Splitwise Pro | P | Médio | Essencial |
| H17 | Promover movimento a gasto | Transação lida da conta global vira gasto do comboio com um toque, sem contar em dobro. | Novo | – | M | Médio | Diferencial |

### I. Documentos e preparação

O checklist de documentos de entrada por país é exclusivo do Together. Falta o "cofre" (onde ficam os PDFs e ingressos) e as listas de preparação. Regra mantida da spec 010: **nunca guardar número de documento**.

| # | Funcionalidade | O que faz | Status | Referência | Esf. | Impacto | Tipo |
|---|---|---|---|---|---|---|---|
| I1 | Documentos de entrada por país | Checklist (passaporte, visto, ETIAS, vacinas...) com prazo, fonte oficial, pendente/resolvido/não preciso. | Já temos | – | – | Alto | Diferencial |
| I2 | Nacionalidade no perfil | Passaporte(s) da pessoa (sem número) para regras certas, inclusive dupla cidadania. | Novo | Sherpa | P | Médio | Diferencial |
| I3 | Validade do passaporte | Só a data; alerta se vence menos de 6 meses depois da volta. | Novo | TripIt (parcial) | P | Alto | Essencial |
| I4 | Cofre da viagem | PDFs e imagens de reservas, ingressos, seguro, CNH internacional; privado ou do comboio; disponível offline. | Novo | Lambus, TripIt, Wanderlog Pro | M | Alto | Essencial |
| I5 | Seguro viagem | Apólice, telefone 24 h, coberturas e quem está coberto; item obrigatório no Schengen. | Novo | – | P | Alto | Essencial |
| I6 | Tarefas com responsável | "Ana compra o ingresso do Louvre até 10/11": dono, prazo, lembrete e concluir. | Novo | Let's Jetty, TREK | P | Alto | Essencial |
| I7 | Mala individual | Checklist pessoal com modelo pelo clima e duração (inverno europeu, praia); reaproveita entre viagens. | Novo | Lambus, Stippl, PackPoint | M | Médio | Essencial |
| I8 | Itens do grupo | "Quem leva": adaptador, secador, caixa de som, kit remédio; evita 5 secadores e nenhum adaptador. | Novo | Stippl, Lambus | P | Médio | Diferencial |
| I9 | Ficha do país | Tomada e voltagem, gorjeta, idioma, fuso, número de emergência, internet (eSIM/chip/roaming). | Novo | TripIt, guias | P | Médio | Essencial |
| I10 | Lista de compras | Mercado da casa ou compras antes de viajar, com quem compra e "lançar como gasto". | Novo | Lambus (listas) | P | Baixo | Essencial |
| I11 | Contagem e progresso | "Faltam 23 dias · 78% pronto" somando documentos, tarefas, reservas e mala. | Novo | – | P | Médio | Encantamento |

### J. Durante a viagem: modo "Hoje"

O pior momento para o app falhar é no meio da viagem (queixa mais grave contra o Wanderlog). Esta área é a tela que abre sozinha quando a viagem está acontecendo.

| # | Funcionalidade | O que faz | Status | Referência | Esf. | Impacto | Tipo |
|---|---|---|---|---|---|---|---|
| J1 | Tela Hoje | O que está acontecendo agora e o próximo item, onde dormimos hoje, próximo trajeto, encontro, clima. | Parcial (Overview tem destaque do dia e próximo trajeto) | Tripsy, TripIt | M | Alto | Essencial |
| J2 | Conversor na mão | Digita um preço em euro e vê em reais pela cotação média do comboio e pela de hoje, com IOF. | Parcial (câmbio existe, falta a calculadora) | XE, Wise | P | Alto | Diferencial |
| J3 | Emergência | Um botão: 112/911 local, consulado brasileiro, hospital próximo, seguro, contatos do comboio. Funciona offline. | Novo | TripWhistle, Sitata | P | Alto | Essencial |
| J4 | Mostrar pro motorista | Endereço da hospedagem no idioma local, em tela cheia, pra mostrar no táxi. | Novo | – | P | Médio | Encantamento |
| J5 | Dia de passagem | Em destinos de 0 noites com malas: guarda-volumes, horário-limite e último trem na mesma tela. | Parcial (aviso de guarda-volumes em Lugares) | – | P | Médio | Diferencial |
| J6 | Gorjeta e divisão de conta | Calculadora de gorjeta pelo costume do país, que já vira gasto dividido. | Novo | Tricount | P | Médio | Essencial |
| J7 | Frases úteis | Frases essenciais por idioma (com áudio) e atalho para tradução por câmera. | Novo | Google Tradutor | M | Baixo | Encantamento |

### K. Fotos e memórias

O feed já está pronto. O próximo passo é transformar as fotos em **lembrança organizada** e fechar a viagem com algo que as pessoas mostrem pros outros.

| # | Funcionalidade | O que faz | Status | Referência | Esf. | Impacto | Tipo |
|---|---|---|---|---|---|---|---|
| K1 | Feed do comboio | Posts com até 10 fotos, curtidas, comentários, grade e aviso no celular. | Já temos | Frienzy, Lambus | – | Alto | Diferencial |
| K2 | Álbum por dia e destino | Organiza sozinho pela data da foto e pelo roteiro. | Parcial (filtro por destino) | Google Fotos | P | Médio | Essencial |
| K3 | Melhores fotos | As mais curtidas de cada lugar viram "as 5 melhores" (ideia original do benchmark). | Parcial (curtidas existem) | – | P | Médio | Diferencial |
| K4 | Fotos no mapa | Cada foto no lugar onde foi tirada (pela localização da foto, se a pessoa permitir). | Novo | Polarsteps | M | Médio | Encantamento |
| K5 | Baixar tudo | Baixar o álbum inteiro (zip) ou mandar pro Google Fotos. | Novo | Google Fotos | P | Médio | Essencial |
| K6 | Diário da viagem | Cada um escreve o seu dia (texto + foto); o comboio lê o dos outros. | Novo | Polarsteps, TREK | M | Médio | Encantamento |
| K7 | Retrospectiva | No fim: mapa percorrido, km, dias, cidades, gasto por pessoa, top fotos, em cartões prontos pra story. | Novo | Polarsteps, Spotify Wrapped | G | Alto | Encantamento |
| K8 | Livro da viagem | PDF bonito com roteiro, diário e fotos; impressão fica pra depois. | Novo | Polarsteps, TREK | G | Médio | Encantamento |
| K9 | Marcar pessoas | Marcar quem está na foto; cada um vê "fotos em que eu apareço". | Novo | Google Fotos, Instagram | P | Baixo | Encantamento |

### L. Descoberta e IA

Gerar roteiro com IA virou commodity (ChatGPT e Gemini fazem de graça). O valor está em **tirar trabalho de digitar** e em **usar os dados do grupo**.

| # | Funcionalidade | O que faz | Status | Referência | Esf. | Impacto | Tipo |
|---|---|---|---|---|---|---|---|
| L1 | Importar reserva | Print, PDF ou e-mail de voo, trem, hotel ou ingresso → a IA monta o item, a pessoa revisa e salva; preenche Transportes, Hospedagem, Cofre e Financeiro de uma vez. | Novo | TripIt, Wanderlog, Tripsy, TREK | M | Alto | Diferencial |
| L2 | E-mail da viagem | Endereço próprio da viagem para encaminhar confirmações, que caem na revisão do L1. | Novo | TripIt (plans@) | M | Alto | Diferencial |
| L3 | Detector de furos | Junta os avisos que já existem e cria novos: trem antes do check-out, noite sem cama, conexão curta, ingresso sem horário, documento vencendo. | Parcial (avisos de roteiro e hospedagem) | – | M | Alto | Diferencial |
| L4 | Sugestões por destino | Lugares populares, perto da hospedagem, por tipo; um toque salva em Lugares. | Novo | Wanderlog, Airbnb | M | Médio | Essencial |
| L5 | Montar o dia pelos votos | Propõe a agenda de um dia a partir dos votos, do "não abro mão", do orçamento e do clima. | Novo | SwipeSights, Mindtrip | G | Alto | Diferencial |
| L6 | Assistente do comboio | Pergunta em português sobre a viagem ("a que horas é o trem?", "o que cabe no orçamento amanhã?"); mudanças aparecem como cards "aplicar / descartar". | Novo | Mindtrip, TREK | G | Alto | Diferencial |
| L7 | Eventos e feriados nas datas | Avisa feriado, museu fechado, greve conhecida e eventos (ex.: GP de Mônaco) no período. | Novo | – | M | Médio | Diferencial |
| L8 | Gasto por frase ou voz | "Paguei 45 euros no jantar pra todos" vira gasto preenchido. | Novo | – | M | Médio | Encantamento |

### M. Plataforma

O que faz todas as outras áreas funcionarem no celular, sem internet e para todo tipo de pessoa.

| # | Funcionalidade | O que faz | Status | Referência | Esf. | Impacto | Tipo |
|---|---|---|---|---|---|---|---|
| M1 | PWA instalável | Instala pelo navegador, sem loja. | Já temos | TREK | – | Alto | Essencial |
| M2 | App nativo com paridade | App Expo com as mesmas abas da web (hoje: viagem, roteiro, contas, fotos, perfil, transportes, novo gasto). | Parcial (em andamento, spec 017) | Wanderlog, Lambus | G | Alto | Essencial |
| M3 | Offline de leitura | Roteiro, agenda, reservas, cofre, documentos, lugares e contatos abrem sem internet. | Novo | Wanderlog Pro, Lambus PRO, Polarsteps | G | Alto | Essencial |
| M4 | Gravar offline | Fila de gravações (gastos, comentários, votos) com envio quando voltar a rede e regra de conflito. | Parcial (gasto rápido) | TREK | G | Alto | Essencial |
| M5 | Tempo real | Mudanças de outra pessoa aparecem na hora, sem recarregar (Supabase Realtime). | Novo | Wanderlog, TREK | M | Médio | Essencial |
| M6 | Calendário | Assinar o calendário da viagem (ICS) no Google/Apple Calendar: trajetos, check-ins, encontros (pendente desde 19/10). | Novo | TripIt, Wanderlog | P | Alto | Essencial |
| M7 | Exportar em PDF | Roteiro, reservas, endereços e contatos num PDF para imprimir ou mandar pra família. | Novo | Wanderlog Pro | M | Médio | Essencial |
| M8 | Histórico e lixeira | Quem mudou o quê, desfazer, lixeira de 30 dias para itens apagados. | Novo | Google Docs | M | Médio | Essencial |
| M9 | Busca na viagem | Achar qualquer coisa (lugar, gasto, código de reserva, comentário) num campo só. | Novo | TripIt | P | Médio | Essencial |
| M10 | Acessibilidade e modo simples | Fonte grande, contraste, leitor de tela, e um modo "só o essencial" pro familiar menos digital. | Novo | – | M | Médio | Essencial |
| M11 | Privacidade e LGPD | Excluir conta, baixar meus dados, escolher o que cada item mostra (pessoal x comboio). | Parcial (gasto pessoal privado) | – | M | Médio | Essencial |
| M12 | Modo escuro | Tema escuro respeitando o sistema. | Novo | Maioria | P | Baixo | Essencial |
| M13 | Widgets e Live Activities | Próximo compromisso, contagem regressiva e voo na tela inicial/de bloqueio. | Novo | Tripsy, Flighty | G | Médio | Encantamento |
| M14 | Carteira do celular | Cartões de embarque e ingressos no Apple/Google Wallet. | Novo | Tripsy, TripIt | M | Baixo | Encantamento |
| M15 | Outros idiomas | Inglês e espanhol, pra amigos estrangeiros no comboio. | Novo | Maioria | M | Baixo | Diferencial |

### N. Pós-viagem e recorrência

O que faz o comboio voltar pro Together na próxima viagem.

| # | Funcionalidade | O que faz | Status | Referência | Esf. | Impacto | Tipo |
|---|---|---|---|---|---|---|---|
| N1 | Fechamento da viagem | Checklist do fim: acertos zerados, gastos completos, fotos baixadas; depois a viagem vira só leitura. | Novo | Tricount | P | Alto | Essencial |
| N2 | Arquivar | Tirar viagens velhas da lista sem apagar. | Novo | Wanderlog | P | Baixo | Essencial |
| N3 | Repetir com o mesmo comboio | "Nova viagem com este comboio": convida todo mundo de novo com um toque. | Novo | Splitwise (grupos) | P | Médio | Diferencial |
| N4 | Duplicar e templates | Copiar uma viagem (roteiro, lugares, listas) para um novo grupo, ou publicar como modelo por link. | Novo | Wanderlog (guias) | M | Médio | Diferencial |
| N5 | Mapa de onde já fui | Países e cidades visitados em todas as viagens, no perfil. | Novo | AdventureLog, Polarsteps, Been | M | Médio | Encantamento |
| N6 | Estatísticas do viajante | Dias viajando, km, países, gasto médio por dia, companheiro de viagem mais frequente. | Novo | Polarsteps | M | Baixo | Encantamento |
| N7 | Perfil viajante | Preferências e dados que se repetem (restrições, nacionalidade, modelo de mala) reaproveitados em toda viagem nova. | Novo | – | P | Médio | Diferencial |
| N8 | Indicar lugares | Mandar sua lista de lugares de um destino para um amigo que vai pra lá. | Novo | Wanderlog (guias), Google Maps | P | Baixo | Encantamento |

### Contagem por área

| Área | Total | Já temos | Parcial | Novo |
|---|---|---|---|---|
| A. Decidir juntos | 8 | 0 | 3 | 5 |
| B. Roteiro e agenda | 9 | 1 | 1 | 7 |
| C. Mapa e lugares | 10 | 2 | 1 | 7 |
| D. Transportes | 12 | 3 | 0 | 9 |
| E. Hospedagem | 10 | 4 | 1 | 5 |
| F. Comboio e pessoas | 9 | 1 | 2 | 6 |
| G. Comunicação | 8 | 0 | 2 | 6 |
| H. Financeiro | 17 | 5 | 2 | 10 |
| I. Documentos e preparação | 11 | 1 | 0 | 10 |
| J. Modo Hoje | 7 | 0 | 3 | 4 |
| K. Fotos e memórias | 9 | 1 | 2 | 6 |
| L. Descoberta e IA | 8 | 0 | 1 | 7 |
| M. Plataforma | 15 | 1 | 3 | 11 |
| N. Pós-viagem | 8 | 0 | 0 | 8 |
| **Total** | **141** | **19** | **21** | **101** |

São 141 itens, dos quais **122 são trabalho a fazer** (Parcial + Novo). O roadmap abaixo escolhe por onde começar.

---

## 3. Roadmap sugerido em ondas

Critério de ordem, nesta prioridade:
1. **Dor documentada** na pesquisa (não só recurso que concorrente anuncia).
2. **Reaproveitar o que existe** (votos da hospedagem, push do boletim, avisos, lançamento rápido).
3. **Fecha uma fase inteira** da viagem, para a pessoa não precisar sair do app naquela fase.
4. **Esforço P/M** primeiro; G só quando sustenta várias outras funções.

Regra pro time de 2: cada item da onda vira uma spec curta em `docs/specs/` antes de codar, com a regra no `packages/core` e a tela feita na web e no mobile. Itens P são bons para a Ingryd começar; itens G e de banco/IA ficam com o Victor ou em par.

### Onda 1: fundação "não sair do app" (entrar, decidir, combinar, abrir sem internet)

Objetivo: o comboio entra pelo WhatsApp sem cadastro, decide dentro do app, sabe onde e quando estar, e não perde nada na viagem.

| Ordem | Item | Esf. | Por que agora (evidência) |
|---|---|---|---|
| 1 | **F2 Convidado sem conta** + **F3 Pessoa sem app** | M + P | Cadastro obrigatório é o motivo de abandono mais citado (Splitwise, Wanderlog, Polarsteps; relato do TabNews pedindo "entrar sem instalar nem cadastrar"). Família é 59,1% das viagens. |
| 2 | **A1 Enquete rápida** + **A5 Votos em lugares** | P + P | Interesses diferentes: 42,7%. Reaproveita o voto da hospedagem. É o pedido mais repetido em reviews e no Product Hunt. |
| 3 | **G5 Compartilhar no WhatsApp** | P | Usar o WhatsApp como canal em vez de competir com ele; o link é a porta de entrada. |
| 4 | **B2 Agenda do dia** + **B3 Ponto de encontro** + **B7 Clima por dia** | G + P + P | Horários descumpridos: 36,3%. Clima por dia foi pedido no Product Hunt. Base da tela Hoje. |
| 5 | **G2 Avisos do ADM** + **G4 Central de notificações** + **B5 Lembretes** | P + M + M | Decisão perdida na thread do grupo; reaproveita o push do boletim de câmbio. |
| 6 | **I4 Cofre da viagem** + **D6 Bilhete anexado** + **E5/E6 Endereço e guia da casa** | M + P + P | Hoje o PDF do trem e o código da porta ficam no e-mail e no WhatsApp: é exatamente o motivo de sair do app no dia. |
| 7 | **M3 Offline de leitura** | G | Perder o roteiro no meio da viagem é a queixa mais grave contra o Wanderlog; dev brasileiro exige offline parcial (TabNews). Offline grátis onde os rivais cobram. |
| 8 | **G1 Comentários em qualquer item** | M | Substitui o chat: a discussão fica junto do gasto, lugar ou opção. |
| 9 | **H7 Marcar acerto como pago** + **N1 Fechamento** | P + P | Sem isso o ciclo do dinheiro termina fora do app; a planilha que "ninguém confiou" (TabNews) vira histórico visível. |
| 10 | **I6 Tarefas com responsável** | P | "1 ou 2 pessoas fazem tudo" é motivo de abandono; distribuir o trabalho tira peso do organizador. |

Também cabem na Onda 1, se sobrar fôlego (todos P): **D4 Situação e preço do trajeto** (pendente desde 19/10), **M6 Calendário** (pendente desde 19/10), **J3 Emergência**, **I3 Validade do passaporte**, **I5 Seguro viagem**.

### Onda 2: menos digitação, mais "Hoje"

Objetivo: tirar o trabalho de lançar dados e deixar a viagem acontecer dentro do app.

- **L1 Importar reserva** (print/PDF/e-mail com revisão) e **L2 E-mail da viagem**: um envio alimenta Transportes, Hospedagem, Cofre e Financeiro. Responde ao "ninguém quer lançar" da conversa de 10/10.
- **J1 Tela Hoje** completa, **J2 Conversor na mão**, **J5 Dia de passagem**, **D9 Último trem para a base**: junta o que já é diferencial (bate-e-volta e câmbio) no momento em que importa.
- **D5 Quem vai em cada trajeto** e **D7 Status do voo**: grupos que chegam em voos diferentes.
- **C3 Lugares no mapa**, **C4 Buscar lugar**, **C5 Abrir no app de navegação**.
- **H8 Caixa do comboio** (30,4% definem a cota antes), **H9 Divisão por pesos**, **H10 Foto do recibo**, **H11 Câmbio congelado**, **H16 Exportar gastos**.
- **A2 Datas em comum**, **A3 Orçamento combinado**, **A6 "Não abro mão"**, **B4 Programação em paralelo**: atacam data (39%), orçamento (36%) e ritmos (36,1%).
- **M4 Gravar offline** para tudo (não só o gasto), **M5 Tempo real**, **M2 paridade do app mobile**.
- **E7 Quem dorme onde**, **F5 Ficha da pessoa**, **F6 Emergência e saúde**, **I7/I8 Mala individual e do grupo**.

### Onda 3: inteligência e memórias

Objetivo: o app passa a sugerir e a fechar a viagem com algo que as pessoas mostram.

- **L3 Detector de furos**, **L5 Montar o dia pelos votos**, **L6 Assistente do comboio** (sempre com "aplicar / descartar").
- **K2/K3 Álbuns e melhores fotos**, **K5 Baixar tudo**, **K6 Diário**, **K7 Retrospectiva**.
- **C9 Mapa offline do destino**, **C6/C7 Importar de rede social e do Google Maps**.
- **H12 Dinheiro na mão**, **H15 Relatórios**, **H17 Promover movimento a gasto** (depende da 015).
- **D8 Conexões**, **D11 Carro e rodízio**, **E10 Prazo de cancelamento**, **M7 Exportar PDF**, **M8 Histórico e lixeira**.
- **N3 Repetir com o mesmo comboio**, **N7 Perfil viajante**.

### Futuro

**K8 Livro da viagem**, **K4 Fotos no mapa**, **F8 Localização ao vivo**, **G8 Bot de WhatsApp**, **D10 Horários reais de trem**, **M13 Widgets**, **M14 Carteira do celular**, **M15 Outros idiomas**, **N4 Templates**, **N5 Mapa de onde já fui**, **N6 Estatísticas**, **L7 Eventos e feriados**, **L8 Gasto por voz**, **J7 Frases úteis**, **A4 Destinos candidatos**, **C8 Perto de mim**.

Por que localização ao vivo, mala e chat não estão na Onda 1: na pesquisa, eles aparecem só como recurso anunciado por empresas, não como pedido documentado de usuários. Ficam atrás das dores com número.

---

## 4. O que NÃO fazer (e por quê)

| Não fazer | Por quê | No lugar |
|---|---|---|
| **Chat completo competindo com o WhatsApp** | O WhatsApp está em todo celular brasileiro; um chat a mais vira mais um lugar pra ignorar. Lambus e Frienzy têm chat e não tiraram ninguém do WhatsApp. | Comentários por item (G1), avisos fixados (G2), "o que mudou" (G3) e links que abrem no item certo (G5). |
| **Rede social aberta** (perfil público, seguidores, feed de desconhecidos) | Muda o produto de "ferramenta do meu grupo" para disputa com Instagram; traz moderação, denúncia e risco de privacidade que um time de 2 não sustenta. | Feed só do comboio (já existe) e compartilhamento opcional da retrospectiva (K7) para fora. |
| **Vender passagem ou hotel próprio** (motor de reserva) | Exige estoque, suporte, reembolso e responsabilidade legal; o histórico de 123milhas (cerca de R$ 2,3 bi em dívidas) e Hurb (34 mil processos) mostra o risco de confiança no Brasil. | Links para quem já vende (Airbnb, Booking, Trainline) e importar a reserva depois (L1). |
| **Guardar dinheiro das pessoas** (carteira própria) | Vira instituição de pagamento, com regras do Banco Central. | Caixa do comboio só como registro (H8) e acerto marcado como pago (H7). |
| **IA que gera roteiro genérico como produto principal** | ChatGPT e Gemini fazem isso de graça; virou commodity. | IA que usa os dados do grupo (L5, L6) e que tira digitação (L1, H10). |
| **Rastreio de GPS ligado o tempo todo** | Queixas de bateria e privacidade no Polarsteps; família não quer ser vigiada. | Localização opcional e por tempo (F8) e "cheguei bem" (F9). |
| **Vídeo no feed** | Custo de armazenamento e banda (o plano grátis do Supabase tem 1 GB); já decidido "só foto" em 10/10. | Fotos comprimidas e, no futuro, vídeo-resumo gerado (não upload). |
| **Guardar número de passaporte ou foto de documento** | Dado sensível; regra já definida na spec 010. | Só data de validade e nacionalidade (I2, I3); o cofre (I4) guarda reservas e ingressos, não documentos de identidade. |
| **Base de lugares própria** (clonar o Google Maps) | Impossível de manter atualizada com 2 pessoas. | Buscar em quem já tem (C4) e salvar só o que o comboio escolheu. |
| **Paywall no núcleo do grupo** | O limite do Splitwise (3 a 4 gastos por dia) gerou revolta pública; "o premium não se estende ao grupo" é queixa do Wanderlog. | Núcleo (gastos, votos, documentos, offline de leitura) sempre liberado para o comboio todo. |
| **Permissões demais** | O TREK tem 17 permissões configuráveis; para família e amigos isso confunde. | Dois papéis e poucos interruptores (F7). |
| **App de desktop e site de marketing agora** | Já adiado na spec 017; não há necessidade real. | PWA + Expo. |

---

## 5. Fontes resumidas

**Internas:** `AGENTS.md` (seção 6) · `docs/specs/README.md` e specs 001–017 · `docs/conversa-2026-10-10-requisitos.md` · `docs/benchmark.md` · `docs/reuniao-2026-10-19.md` · `docs/reuniao-2026-10-22.md` · `reports/Mercado de apps de viagem em grupo.md` · `research_notes/Mercado de apps de viagem em grupo/` (dores_e_desejos, concorrentes_globais, concorrentes_brasil, open_source).

**Dores e números:**
- Pesquisa Imaginadora 2025 (42,7% interesses diferentes, 36,3% horários, 36,1% ritmos, 30,4% cota prévia, 59,1% família): [Panrotas](https://www.panrotas.com.br/mercado/pesquisas-e-estatisticas/2025/06/quais-sao-os-maiores-obstaculos-nas-viagens-em-grupo-estudo-da-imaginadora-revela_218009.html)
- Pesquisa Skyscanner (data 39%, orçamento 36%, hospedagem 30%, destino 26%): [Estado de Minas](https://www.em.com.br/turismo/2026/07/7470938-de-melhores-amigos-a-desafetos-quando-uma-viagem-poe-a-amizade-a-prova.html)
- Relatos de brasileiros: [TabNews, "criei meu próprio Splitwise"](https://www.tabnews.com.br/sorrizera/criei-meu-proprio-splitwise-depois-de-uma-viagem-e-muitos-gastos-compartilhados-entre-amigos) · [TabNews, validação de SaaS](https://www.tabnews.com.br/pedroesteves/estou-validando-uma-ideia-de-saas-para-viagens-em-grupo-podem-me-ajudar-a-nao-construir-algo-inutil)
- Queixas de usuários: [Trustpilot Wanderlog](https://www.trustpilot.com/review/wanderlog.com?page=2) · [Trustpilot Splitwise](https://pt.trustpilot.com/review/splitwise.com?page=2) · [Trustpilot Polarsteps](https://www.trustpilot.com/review/polarsteps.com?page=3) · [Product Hunt IntoTheTrip](https://www.producthunt.com/products/intothetrip)

**Concorrentes e funcionalidades:**
- Comparativo de apps de grupo (fonte concorrente): [SwipeSights](https://swipesights.com/blog/best-group-trip-planner-apps)
- Wanderlog: [ai-tools-hq](https://www.ai-tools-hq.com/tools/wanderlog/) · TripIt, Tripsy, Lambus: [tripprof](https://tripprof.com/en/blog/best-trip-planning-apps-2026/) · Lambus: [App Store](https://apps.apple.com/us/app/lambus-travel-planner/id1446178879)
- Polarsteps: [trippytaless](https://trippytaless.com/blogs/is-polarsteps-worth-it-2026/) · Mindtrip: [datastudios](https://www.datastudios.org/post/mindtrip-ai-travel-planning-in-chat-booking-and-pricing)
- Flighty: [TechCrunch](https://techcrunch.com/2026/03/24/flightys-new-update-gives-you-real-time-alerts-about-airport-disturbances/) · [Euronews](https://www.euronews.com/travel/2026/07/08/this-flight-app-is-making-airport-connections-less-stressful)
- Airbnb (itinerário de grupo e serviços, 2026): [Airbnb Newsroom](https://news.airbnb.com/en-au/2026-may-release-now-theres-even-more-to-airbnb/) · Google Maps (Screenshot List): [Croma](https://www.croma.com/unboxed/gemini-in-google-maps-can-help-you-plan-trips-using-screenshots)
- Triply-AI (importar de TikTok/Instagram): [Google Play](https://play.google.com/store/apps/details?id=com.aiside.triply&hl=en)

**Open source (ideias, não código quando for AGPL):** [TREK](https://github.com/liketrek/TREK) · [AdventureLog](https://github.com/seanmorley15/AdventureLog) · [Spliit](https://github.com/spliit-app/spliit) · [SplitPro](https://github.com/oss-apps/split-pro) · [maplibre-react-native](https://github.com/maplibre/maplibre-react-native) · [PMTiles](https://github.com/protomaps/PMTiles) · [Frankfurter](https://github.com/lineofflight/frankfurter)

**Confiança no mercado brasileiro:** [Panrotas, 123milhas](https://www.panrotas.com.br/agencias-de-viagens/mercado/2026/02/123-milhas-propoe-acordo-para-credores-com-pagamentos-em-quase-8-anos_225827.html) · [Panrotas, Hurb](https://www.panrotas.com.br/agencias-de-viagens/mercado/2025/02/sem-acordo-com-senacon-hurb-abandona-escritorio-no-rj-e-segue-devendo-clientes_214311.html)

**Limites desta versão:** referências marcadas como "Doodle", "XE", "Sitata", "PackPoint", "Been" e "Ficha Médica" vêm de conhecimento geral, não da pesquisa citada; a pesquisa não acessou Reddit nem X, então localização ao vivo, mala e importação de reservas não têm pedido de usuário documentado, só anúncio de empresas.
