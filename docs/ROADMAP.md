# Roadmap: o que vamos construir

**Atualizado em:** 29/10/2026 · **Base:** pesquisa de mercado e catálogo de funcionalidades (veja "De onde veio" no fim)

## A meta
O comboio planeja, decide, paga, se encontra e guarda as memórias da viagem **sem sair do Together**. O WhatsApp continua sendo o lugar da conversa; o Together é onde as coisas ficam resolvidas.

## Como usar este plano
1. Cada item vira uma **spec curta** em `docs/specs/` antes de codar (use o `_modelo.md`).
2. A regra fica no `packages/core`. A tela é feita no **site e no app**.
3. Ao começar ou terminar um item, atualize a coluna **Status** aqui e no `docs/specs/README.md`.
4. **Quem:** itens **P** são bons pra Ingryd começar. Itens **G**, de banco ou de IA, ficam com o Victor ou em par.

Tamanho: **P** = poucos dias · **M** = cerca de uma semana · **G** = mais de uma semana (contando site + app).

---

## Onda 1: fundação "não sair do app"
**Objetivo:** o comboio entra pelo link do WhatsApp sem cadastro, decide dentro do app, sabe onde e quando estar, e não perde nada na viagem.

| # | Funcionalidade | O que é, em uma frase | Tam. | Quem | Spec | Status |
|---|---|---|---|---|---|---|
| 1 | Convidado sem conta | Entra pelo link só com o nome; cria a conta depois sem perder nada | M | Victor | [018](specs/018-convidado-sem-conta.md) | Em andamento |
| 2 | Pessoa sem app | A avó ou a criança entram na divisão e nos quartos; o ADM lança por elas | P | Victor | — | A fazer |
| 3 | Enquete rápida | Pergunta com opções pra qualquer decisão (data, restaurante, passeio) | P | Ingryd | [021](specs/021-enquetes-rapidas.md) | Em andamento |
| 4 | Votos em lugares | Votar nos lugares e passeios, igual já é na hospedagem | P | Ingryd | [022](specs/022-votos-em-lugares.md) | Em andamento (web) |
| 5 | Compartilhar no WhatsApp | Botão que manda o link certo (gasto, enquete, dia) e abre direto no item | P | Ingryd | — | A fazer |
| 6 | Agenda do dia | O que acontece em cada dia, com horário | G | Victor | — | A fazer |
| 7 | Ponto de encontro | "Onde e que horas nos encontramos", com mapa | P | Ingryd | — | A fazer |
| 8 | Clima por dia | Previsão do tempo em cada dia do roteiro | P | Ingryd | [023](specs/023-clima-por-dia.md) | Em andamento |
| 9 | Avisos do ADM | Recado fixado no topo da viagem ("passaporte na mão amanhã!") | P | Ingryd | [019](specs/019-avisos-do-adm.md) | Em andamento |
| 10 | Central de notificações | Um sino com tudo que mudou desde a última visita | M | Victor | — | A fazer |
| 11 | Lembretes | Push antes de horários combinados (trem, check-out, encontro) | M | Victor | — | A fazer |
| 12 | Cofre da viagem | Reservas, ingressos e PDFs da viagem num lugar só | M | Victor | — | A fazer |
| 13 | Bilhete no trajeto | Anexar o PDF/QR do trem ou voo no próprio trajeto | P | Ingryd | — | A fazer |
| 14 | Endereço e guia da casa | Endereço, Wi-Fi, código da porta e regras da hospedagem escolhida | P | Ingryd | — | A fazer |
| 15 | Offline de leitura | Roteiro, documentos e gastos abrem sem internet | G | Victor | — | A fazer |
| 16 | Comentários em qualquer item | Conversar no gasto, no lugar ou na opção, em vez de um chat | M | Victor | — | A fazer |
| 17 | Marcar acerto como pago | Quem recebeu confirma; o saldo fecha | P | Ingryd | — | A fazer |
| 18 | Fechamento da viagem | Resumo final de quem pagou o quê, pra todo mundo ver | P | Ingryd | — | A fazer |
| 19 | Tarefas com responsável | "Quem compra o seguro?", com dono e prazo | P | Ingryd | [020](specs/020-tarefas-com-responsavel.md) | Em andamento |

**Se sobrar fôlego (todos P):** situação e preço do trajeto · exportar pro calendário · botão de emergência (números do país) · aviso de validade do passaporte · item "seguro viagem" no checklist.

---

## Onda 2: menos digitação, mais "Hoje"
**Objetivo:** tirar o trabalho de lançar dados e deixar a viagem acontecer dentro do app.

| Grupo | Funcionalidades | Tam. |
|---|---|---|
| Importar sem digitar | Importar reserva por print, PDF ou e-mail (com revisão antes de salvar) · e-mail próprio da viagem | G |
| Tela "Hoje" | O que fazer agora · conversor de moeda na mão · dia de deslocamento · último trem pra voltar à base | G |
| Transportes | Quem vai em cada trajeto · status do voo | M |
| Mapa e lugares | Lugares no mapa · buscar lugar · abrir no Google Maps / Waze | M |
| Financeiro | Caixa do comboio (cota antes da viagem, só registro) · divisão por pesos · foto do recibo · câmbio congelado no gasto · exportar gastos | M |
| Decidir juntos | Datas em comum · orçamento combinado · "não abro mão" · programação em paralelo | M |
| Plataforma | Gravar offline em tudo · atualização em tempo real · app mobile igual ao site | G |
| Pessoas e preparação | Quem dorme onde · ficha da pessoa (alergias, restrições) · emergência e saúde · mala individual e do grupo | M |

---

## Onda 3: inteligência e memórias
**Objetivo:** o app passa a sugerir e fecha a viagem com algo que as pessoas mostram.

| Grupo | Funcionalidades |
|---|---|
| IA com os dados do grupo | Detector de furos ("ninguém tem hotel na noite 3") · montar o dia pelos votos · assistente do comboio (sempre com "aplicar / descartar") |
| Fotos e memórias | Álbuns por dia/lugar · melhores fotos · baixar tudo · diário · retrospectiva |
| Mapa | Mapa offline do destino · importar do Google Maps e de redes sociais |
| Financeiro | Dinheiro em espécie · relatórios · transformar movimento da conta em gasto (depende da 015) |
| Viagem | Conexões · carro e rodízio de motorista · prazo de cancelamento da reserva · exportar PDF · histórico e lixeira |
| Depois da viagem | Repetir com o mesmo comboio · perfil viajante |

---

## Futuro (ideias guardadas)
Livro da viagem impresso · fotos no mapa · localização ao vivo (opcional) · bot de WhatsApp · horários reais de trem · widgets · carteira do celular · outros idiomas · modelos de viagem · mapa de onde já fui · estatísticas · eventos e feriados · gasto por voz · frases úteis · comparar destinos · "perto de mim".

---

## O que NÃO vamos fazer
| Não fazer | No lugar |
|---|---|
| Chat completo competindo com o WhatsApp | Comentários por item, avisos e links que abrem no item certo |
| Rede social aberta (seguidores, desconhecidos) | Feed só do comboio |
| Vender passagem ou hotel | Links pra quem vende + importar a reserva |
| Guardar dinheiro das pessoas | Caixa do comboio só como registro + acerto marcado como pago |
| IA que só gera roteiro genérico | IA que usa os votos, o orçamento e as reservas do grupo |
| GPS ligado o tempo todo | Localização opcional e por tempo, "cheguei bem" |
| Guardar número ou foto de passaporte | Só validade e nacionalidade |
| Cobrar pelo básico do grupo | Gastos, votos, documentos e offline de leitura sempre liberados pra todo o comboio |

---

## De onde veio
- `reports/Mercado de apps de viagem em grupo.md`: concorrentes no Brasil e no mundo, open source, reclamações dos usuários, monetização.
- `reports/Catálogo de funcionalidades da plataforma.md`: as 141 funcionalidades por área, com esforço, impacto e referências.
- Dores com número que guiaram a ordem: interesses diferentes na programação (42,7%), horários descumpridos (36,3%), achar data comum (39%), fechar orçamento (36%), e abandono de apps por cadastro obrigatório e falta de offline.
