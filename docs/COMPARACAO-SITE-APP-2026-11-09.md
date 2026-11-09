# Site × app: por que o site parece outro produto (09/11/2026)

**Pedido do Victor:** "na versão web, que é a que eu uso com a Ingryd, compare o app com ela. O web está muito estranho, diferente e feio comparado à perfeição do app."

**Como comparei:**
- O site (`apps/web`, http://localhost:5173) e o app (Expo, http://localhost:8089), lado a lado.
- A mesma viagem nos dois: Eurotrip.
- Larguras: celular (375 px) e computador (1366 px).

## Resumo
O problema não é cor nem fonte: as duas usam a paleta Couro, a mesma fonte de título e os mesmos tons. O site parece "outro produto" por três motivos:

1. **Organização diferente.**
   - O app tem 5 abas e um "Tudo da viagem".
   - O site tem 16 itens no menu lateral, com outros nomes.
2. **Telas de gerações diferentes.** Hospedagem, Contas e Passagens no site são as versões antigas, de antes das specs 117 a 123. No app elas foram refeitas.
3. **No computador, o site vira painel de controle.** São muitos cartões pequenos lado a lado e botões coloridos fora da paleta. O app mostra uma coisa por vez, com hierarquia.

## Tela por tela

| Parte | App (como deve ser) | Site hoje | O que estranha |
|---|---|---|---|
| **Navegação** | 5 abas: Viagem, Roteiro, Reservas, Contas, Fotos. O resto fica em "Tudo da viagem" | Menu com 16 itens: **Overview** (em inglês), Roteiro, Hospedagem, Passagens, Financeiro, Comboio, Hoje, Agenda, Lugares, Fotos, Retrospectiva, Imprimir e PDF, Configurações, Buscar, Emergência… No celular, 7 abas: Início, Roteiro, **Estadia**, **Passag.**, **Finanças**, Comboio, Mais | Os nomes mudam de um lado pro outro: Contas / Financeiro / Finanças, Reservas / Estadia / Passagens. Quem usa os dois se perde |
| **Tela da viagem** | Capa, rostos do comboio, próximo carimbo, **passaporte do comboio**, carrossel dos dias, passagens e contas em resumo | Capa e próximo passo, depois uma **grade de 11 botões iguais** (Hoje, Roteiro, Agenda, Transporte, Hospedagem, Lugares, Contas, Fotos, Comboio, Retrospectiva, PDF) | Parece um menu, não a viagem. Some a âncora do produto (o passaporte, spec 118) |
| **Hospedagem** | Noite por noite (spec 123): 3 números (sem cama, pra reservar, reservadas), cidades em ordem, "só de dia", total | Por destino: mapa grande, "0/5 destinos fechados", abas por cidade, botões **Buscar no Airbnb (vermelho), Booking (azul), Hostels (laranja)** | Outro jeito de contar ("destinos fechados" × "noites sem cama"). As cores das marcas fogem da paleta |
| **Contas** | Saldo grande e lançamento rápido embaixo ("jantar 84"), estilo conversa | Painel com ~8 cartões: Orçamento total, Gasto até agora, A pagar, Meu orçamento (com campo), Meu euro, Minha carteira de euro, conexão com o Gmail… | No computador vira uma planilha de cartõezinhos. No celular, uma lista longa antes do primeiro gasto |
| **Passagens** | Deslocamentos com estado (decidir, comprar, garantido), comparar opções, "Ir" | Lista de trechos com "Falta definir" e links pro Rome2Rio e o Google Maps | É a versão antiga, sem as opções e os votos da spec 122 |
| **Roteiro / Explorar** | Matches, os dias, o mapa ilustrado com folha arrastável | Explorar de cartões (parecido) + Agenda separada | Mais perto do app, mas Roteiro e Agenda são duas coisas no site |
| **Ícones** | Selos e ícones de traço do catálogo | Mesmos ícones de traço, mas em quadradinhos repetidos na grade | Repetição deixa tudo com o mesmo peso |

## Por que ficou assim
- Decisão de 02/11 (AGENTS.md, `docs/RUMO.md`): **o produto é o app, o site fica só com o essencial**, e toda funcionalidade nova nasce no app. As specs 117 a 123 foram feitas só no app. A spec 123 diz com todas as letras: "o site continua com a tela atual".
- Só que vocês dois usam o site no dia a dia. Por isso a diferença aparece todo dia.

## Opções

**A. Site = espelho do app (recomendo).**
- O site passa a ter as mesmas 5 partes, com os mesmos nomes (Viagem, Roteiro, Reservas, Contas, Fotos) e o resto em "Tudo da viagem".
- Cada tela do site é reconstruída copiando o desenho do app, porque a lógica já está no `@together/core`.
- No computador, uma coluna central larga com um painel lateral, sem grade de botões.
- Ordem, do que mais incomoda pro que menos:
  1. navegação e nomes (rápido, muda a sensação geral);
  2. tela da viagem com o passaporte;
  3. Hospedagem por noite (spec 123);
  4. Contas no estilo do app;
  5. Passagens (spec 122).
- Muda a regra do RUMO ("site só o essencial"). Precisa da decisão do Victor e de uma linha nova no RUMO.

**B. Só uma "faxina visual" no site.**
- Renomear (Overview → Viagem etc.), tirar as cores de marca, enxugar a grade da tela da viagem e o painel de Contas.
- Rápido, mas as telas continuam sendo as antigas. O "outro produto" continua na Hospedagem e nas Passagens.

**C. Usar o app no navegador.**
- O app Expo já roda no navegador (é o que testei hoje em http://localhost:8089).
- Dá pra publicar esse build como o site de quem planeja, e o site atual fica só pra convite e divulgação (`/v/<código>`, `/espera`).
- Zero tela nova, mas no computador ele vira uma coluna de celular no meio da tela. Também precisa de outro endereço ou de mudar o que o `together-viagem.vercel.app` serve. Mexe em deploy e em login.

## Recomendação
Opção **A**, começando pelo passo 1 (navegação e nomes iguais ao app), que é pequeno e muda a sensação já. Depois, uma tela por vez, na ordem acima.

Cada tela é uma tarefa de 1 a 2 sessões. Como esta conversa já está muito longa, o certo pela regra do AGENTS.md é fazer em sessões novas, uma por tela.
