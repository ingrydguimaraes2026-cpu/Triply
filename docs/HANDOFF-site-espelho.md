# HANDOFF: site espelho do app

**Decisão (Victor, 09/11/2026):** o site (`apps/web`) passa a ser espelho do app (`apps/mobile`). Ele usa as mesmas 5 partes e os mesmos nomes, e copia o desenho do app adaptado pra tela larga. O motivo e a comparação tela por tela estão em `docs/COMPARACAO-SITE-APP-2026-11-09.md`. A regra nova está em `docs/RUMO.md` ("Onde roda") e em `AGENTS.md`, seção 5.

## Regras pra quem pegar uma etapa
- Leia antes `AGENTS.md`, a comparação e a spec da tela (`docs/specs/`).
- **A lógica fica no `@together/core`.** O site só mostra. Se uma conta existe só no app (`apps/mobile/src/dados/...`), mova pro core antes de usar no site.
- **O modelo é a tela do app**, e não a tela antiga do site. Abra as duas lado a lado:
  - site: `npm run dev` em `apps/web`, http://localhost:5173;
  - app no navegador: preview "mobile", http://localhost:8089.
- **Teste em 360 px e em 1366 px.** No computador:
  - uma coluna central larga, mais um painel lateral quando fizer sentido;
  - nada de grade de botões iguais;
  - nada de cor de marca (Airbnb, Booking) fora da paleta.
- **Texto:** pt-BR, sem "ponha/pôr/põe", sem emoji, ícones só do catálogo. O teste `apps/web/tests/icones.test.mjs` já falha por causa dos "❄" em comentários de 03/11; não é da sua etapa.
- **Antes de dizer que terminou:** rode `npm run build` e `npm run lint` em `apps/web`.
- **Git:** commit local na branch `monorepo-split`, sem push (o Victor dá push).

## Etapas (em ordem)

| # | Etapa | O que muda | Estado |
|---|---|---|---|
| 1 | **Navegação e nomes** | `apps/web/src/pages/viagem/ViagemLayout.tsx`: as 5 partes do app (Viagem, Roteiro, Reservas, Contas, Fotos) e "Tudo da viagem" com o resto (Hoje, Lugares, Cidades, Comboio, Retrospectiva, PDF, Configurações). Sai o "Overview" (inglês), "Estadia", "Passag." e "Finanças". "Reservas" junta Passagens e Hospedagem com as duas pílulas, como no app | **Feito (09/11)** |
| 2 | **Tela da viagem** | `Overview.tsx` vira a aba Viagem do app (`apps/mobile/app/viagem/[id]/(abas)/index.tsx` + `src/ui/viagem/Secoes.tsx`): capa, rostos, próximo carimbo, passaporte do comboio, carrossel dos dias, passagens, contas. Sai a grade de 11 botões | **Feito (09/11)** |
| 3 | **Hospedagem por noite** | `Hospedagem.tsx` segue a spec 123 (`docs/specs/123-hospedagem-por-noite.md`): `noitesDaViagem` e `fatosDaOpcao` já estão no core. Modelo: `apps/mobile/app/hospedagem.tsx`, `cidade-hospedagem.tsx`, `opcao-hospedagem.tsx` | Feita (09/11), ver abaixo |
| 4 | **Contas** | `Financeiro.tsx` no estilo da aba Contas do app: saldo grande, lista e lançamento rápido. O orçamento e a carteira vão pra uma linha ou um painel lateral, não 8 cartões | Pronta (09/11) |
| 5 | **Passagens** | `Transportes.tsx` segue a spec 122 (deslocamentos com opções e comparar). Modelo: `apps/mobile/app/transportes.tsx` e `comparar.tsx` | **Feito (09/11)** |
| 6 | Roteiro do dia e Agenda | Juntar Agenda no Roteiro como no app (dia a dia com mapa ilustrado) | **Feito (09/11)**, sem o mapa ilustrado (ver "Roteiro do site") |

## Auditoria com prints (09/11/2026, noite)
O Victor viu as etapas 1 a 4 e não gostou: "muita coisa do site ainda está antiga, que no app já está nova". Comparei site e app lado a lado em 375 px, na Eurotrip. O que ainda foge do app:

**Em todas as telas (a "casca"), é o que mais faz parecer outro produto:**
- O site tem uma barra no topo ("Eurotrip >", lupa, emergência, "...", avatar). O app não tem: cada aba abre direto no título grande.
- O site tem o botão flutuante "+" em todas as abas. O app não tem: cada tela tem o seu botão ("Postar", "Novo deslocamento", a barra de lançar em Contas).
- O cabeçalho das telas do site é "Eurotrip / Título / frase explicando". No app é só o título grande, com no máximo uma linha pequena ("0 fotos · 0 pessoas").
- Tela vazia: o site usa ícone num quadrado e um cartão tracejado. O app usa a Norti (mascote) com uma frase e o botão principal embaixo.
- Pílulas: o app usa 2 pílulas largas (Feed | Por dia; Transporte | Hospedagem). O site tem 4 abas em maiúsculas em Fotos.
- Menu do computador ainda tem "Buscar" e "Emergência" soltos embaixo.

**Tela por tela:**
| Tela | Site hoje | App |
|---|---|---|
| Início (`/`) | **Feito (09/11)**: `/` e `/viagens` mostram o Início igual ao app (ver "Início do site" abaixo) | "Bom dia, Paulo", avatar, mapa da galera claro, cartão grande da próxima viagem com "Faltam N dias" e carimbos |
| Roteiro | **Feito (09/11)**: abre em Matches + pílulas Dia 1, Dia 2...; o baralho fica em "Descobrir mais lugares" | Abre em Matches + pílulas Dia 1, Dia 2...; "Descobrir mais lugares" leva ao baralho |
| Reservas → Passagens | Versão antiga: "Entre cidades", trechos com "Falta definir", links Rome2Rio e Google Maps | Deslocamentos (spec 122): vazio com a Norti e "Novo deslocamento"; opções, votos e comparar |
| Fotos | Caixa "Compartilhe uma foto", 4 abas (Feed, Grade, Por dia, Melhores), vazio tracejado | "0 fotos · 0 pessoas", botão "Postar", 2 pílulas, Norti dormindo |
| Comboio | "Quem vai" + "Histórico e lixeira" grande logo embaixo | Refeito no app; o histórico não é destaque |
| Hoje, Lugares, Configurações, Perfil | Não comparadas ainda com print; código do site é de 02 a 08/11 | Refeitas no app |

Consertado já: Comboio dizia "pode pôr de volta" (regra de texto) → "pode restaurar".

**Casca feita (09/11/2026, noite), commit local na `monorepo-split`:**
- Celular sem a barra de cima ("Eurotrip >", lupa, emergência, "...", avatar) e sem o botão flutuante "+" em todas as abas (`ViagemLayout.tsx`). Cada aba abre no título grande. O atalho do app instalado (`?lancar=1`) continua abrindo o lançamento rápido.
- Voltar e "..." (Tudo da viagem) ficam em cima da capa da tela Viagem, como no app (`Overview.tsx`; o voltar só aparece no celular).
- Buscar e Emergência saíram da barra e do menu do computador: viraram itens em "Tudo da viagem" (abrem na gaveta, como antes). Nada foi apagado.
- Peças novas em `components/ui`: `TituloDaTela` (título grande + no máximo uma linha pequena + botão; `voltar` só no celular) e `TelaVazia` (Norti + frase + botão). Aplicadas em Fotos, Comboio, Hoje, Lugares, Agenda, Cidades, Tudo da viagem, Configurações, Retrospectiva, Reservas (título "Reservas" em cima das pílulas, como no app) e Hospedagem (`naAba`: sem título duplicado dentro de Reservas). As telas de "Tudo" têm o voltar pra `/tudo`.
- Fotos igual ao app: "N fotos · N pessoas", botão "Postar" no cabeçalho, pílulas Feed | Por dia, Norti dormindo no vazio. "Por dia" tem o filtro por pessoa do app e o "Baixar fotos". Saíram a barra "Compartilhe uma foto", a Grade, os Melhores (spec 098) e o filtro "Fotos em que estou" (spec 100), porque o app não tem.
- **Falta:** o Contas (`Financeiro.tsx`) também ainda usa o `CabecalhoPagina` com "Eurotrip".
- Conferido no navegador em 375 px e 1366 px (Fotos, Viagem, Reservas, Tudo, Comboio, Lugares, Agenda). O app (preview "mobile") não foi aberto lado a lado: comparei com o código das telas do app.

**Ordem sugerida:** casca primeiro (muda a sensação de todas as telas), depois Roteiro, Passagens, Fotos, Início, e por fim Hoje, Lugares, Comboio, Configurações e Perfil.

As etapas 3, 4 e 5 mexem em arquivos separados e podem andar em paralelo, cada uma na sua sessão ou worktree. A 2 depende da 1.

## Onde parou
Etapas 1 e 2 prontas (09/11/2026), commit local na `monorepo-split`, sem push.

**Etapa 1 (navegação):**
- Menu = as 5 partes do app: Viagem (`/viagem/<id>`), Roteiro (`explorar`), Reservas (`reservas`), Contas (`contas`), Fotos. No celular, a barra de baixo tem só essas 5; o "..." do topo abre "Tudo da viagem".
- "Tudo da viagem" (`/tudo`, `TudoDaViagem.tsx`): no computador fica no menu, embaixo das 5 partes (Hoje, Lugares, Cidades, Agenda, Comboio, Retrospectiva, PDF, Configurações só pro ADM). A página tem os atalhos e, embaixo, os cartões do comboio que estavam na tela antiga (furos, tarefas, enquetes, ponto de encontro, clima, cofre, orçamento combinado, cheguei bem, mala, listas...). Nada foi apagado.
- A Agenda ficou em "Tudo da viagem" até a etapa 6 juntar ela no Roteiro.
- Lista das partes: `apps/web/src/features/viagens/partes.ts`.
- `Reservas.tsx`: pílulas Passagens | Hospedagem, cada parte é a tela de antes (`Transportes.tsx`, `Hospedagem.tsx`). Endereço `reservas?parte=hospedagem`.
- Endereços antigos continuam abrindo e caem no novo (`Redirecionar.tsx`, mantém `?foco=` e o resto): `/hospedagem` → `reservas?parte=hospedagem`, `/transportes` → `reservas?parte=transporte`, `/financeiro` → `contas`.
- Core: modo simples agora usa `contas` (`ABAS_DO_MODO_SIMPLES`); link de compartilhar gasto vai pra `contas`, enquete e ponto de encontro vão pra `tudo` (link antigo `/viagem/<id>?foco=` a tela da viagem manda pra `tudo`). Testes `acessibilidade` e `compartilhar` atualizados.

**Etapa 2 (tela da viagem):**
- `Overview.tsx` = aba Viagem do app: capa, rostos do comboio (anel = novidade), próximo carimbo (com duelo de votos quando "onde dormir" tem 2 opções), passaporte do comboio (6 selos), carimbos dos lugares (spec 118a), carrossel dos dias montados, passagens e contas. No computador: coluna larga + passagens e contas numa coluna ao lado.
- Peças: `apps/web/src/features/viagens/SecoesDaViagem.tsx`; dados: `features/viagens/abaViagem.ts`.
- Lógica movida pro core em `packages/core/src/aba-viagem.ts`: `carregarAbaViagem`, `montarPassos`, `proximoCarimbo`, `estadoDosPassos`, `textoDoBotaoDoPasso`, `resumoDasContas`, `CATEGORIAS`. Os arquivos do app (`src/dados/abaViagem.ts`, `contas.ts`, `ui/PassosDaViagem.tsx`) só reexportam do core.
- O mapa e a edição das cidades (ordem, datas, adicionar) saíram da tela da viagem e foram pra **Cidades** (`/cidades`, `Cidades.tsx`), como a tela "Cidades do roteiro" do app.

**Ficou de fora (de propósito):**
- A comemoração da Norti quando cai um carimbo.
- A fase "voltou" (Lembranças) do app: o site mostra a mesma tela.
- Na fase "na viagem", o site continua levando pro Hoje uma vez por aba, como antes.
- "Antes de embarcar" está congelado no RUMO.

**Pra etapa 3 e 5:** dentro de Reservas, `Hospedagem.tsx` e `Transportes.tsx` ainda mostram o título grande de cada um embaixo das pílulas. O app esconde esse título quando a tela está dentro da aba (`naAba`). Dá pra fazer igual quando mexerem nelas.

**Etapa 4 (Contas), pronta em 09/11/2026:**
- `Financeiro.tsx` (endereço `contas`) segue a aba Contas do app: cartão couro com o saldo grande ("Tudo certo por aqui", "Você recebe", "Você deve"), linha "Euro hoje R$ ..." e, ao tocar, quem paga quem e o saldo de cada um.
- Gastos como conversa: do mais antigo pro mais novo, os meus à direita (couro), dos outros à esquerda com o rosto. Tocar abre o gasto pra editar. Filtros, "só você vê", "completar", compartilhar e os recados verdes de quem paga quem continuam.
- Barra de lançar presa embaixo: "jantar 84" + Enter abre o formulário completo já preenchido (`lerFraseDeGasto` do core). Nada é salvo sem a pessoa confirmar. O botão do recibo abre o formulário vazio. No Contas o botão flutuante "+" do layout some (CSS em `financeiro.css`), porque a barra faz o mesmo.
- Painel "Orçamento, câmbio e carteira": no computador fica do lado (fixo ao rolar); no celular é uma linha que abre. Dentro: Orçamento (gasto de X, barra, por categoria dobrável), Meu orçamento, A pagar, Dinheiro na mão, Carteira de euro com o Gmail, Câmbio (média + compras dobráveis), Relatórios (dobrável). Saiu o cartão "Acertos" (foi pro saldo) e o "Meu euro" (virou a pílula "Euros na sua carteira").
- Saldo de cada um vem de `calcularSaldos` do core. A tela não tem conta de dinheiro nova (o "X cada" do app virou "sua parte", que já vem da divisão).
- Testado em 360 px e 1366 px na Eurotrip (sem gastos: só o estado vazio e a frase abrindo o formulário). **As bolhas com gastos de verdade não foram vistas no navegador:** o banco não tem nenhum gasto. Vale olhar quando houver.
- `npm test`: falham `zip` (antiga), `icones` (❄ de outros arquivos; o Financeiro já não tem) e `078` (membro conseguiu inserir trajeto; provável efeito da regra nova da spec 122, não desta etapa).

## Início do site (09/11/2026, commit local)
- **`/` agora mostra o Início** (antes pulava direto pra última viagem). Igual ao app: num dia de viagem abre direto no Hoje (uma vez por abertura do site), conta sem viagem vai pra `/nova-viagem`, e `/?lancar=1` continua abrindo o lançamento rápido. `/viagens` mostra a mesma tela. **Victor: mudança de comportamento do `/`.**
- Tela: "Bom dia, <nome>" com o avatar (abre o Perfil; Sair fica no Perfil), mapa da galera **claro** (SVG parado como o do app, não o mapa escuro com zoom), cartão grande da próxima viagem com a capa, "Faltam N dias", "N de 6 carimbos" e a barra, "No comboio agora", Próximas, Viagens passadas, Arquivadas, Nova viagem tracejado, Rolê hoje e "Já fomos pra..." (gavetas).
- Computador (≥1024px): coluna larga com as viagens + mapa fixo à direita. Celular: uma coluna, mapa em cima.
- Novos: `features/carimbos/RoleHoje.tsx` (Rolê hoje no site: tipo, "Usar onde estou" pelo navegador ou busca) e `features/viagens/resumoDoInicio.ts` (carimbos + atividades, igual ao app).
- Conferido logado na 5173 (medidas pela página, sem print: janela do Claude escondida): 375px sem rolagem pro lado, mapa em cima, cartão 400px, barra em 3/6; 1366px coluna de 680px + mapa de 400px à direita. Mesmos dados do app (Paulo, 204 dias, 3 de 6 carimbos).


## Etapa 5 feita: Passagens (09/11/2026)

- `pages/viagem/Transportes.tsx` refeita igual ao app (`transportes.tsx`, `novo-deslocamento.tsx`, `comparar.tsx`, `caminho.tsx`). Saíram "Entre cidades", "Falta definir", Rome2Rio, "Meu itinerário", rodízio e "Lançar como gasto" (o app não tem).
- Celular: a lista OU o painel aberto (`?passagem=novo | opcoes:<grupo> | caminho:<id> | <id>`). Computador: lista à esquerda, painel à direita (mesmo esquema da Hospedagem).
- Peças novas em `features/transportes/`: `FormDeslocamento` (de/para/dia, jeitos de ir sozinhos, "Já comprei", "Mais detalhes", guardar como opção), `CompararOpcoes` (folga, selos, "Ficar com esta") e `CaminhoDoTrajeto` (paradas + mapinha, link do Google Maps quando não tem dado).
- Lógica nova no core: `packages/core/src/opcoes-do-deslocamento.ts` (`compararOpcoes`, `folgaDaOpcao`, `livreNoDia`, `escolherOpcaoDoDeslocamento`). O app (`comparar.tsx`, `novo-deslocamento.tsx`) passou a usar ela. Teste: `apps/web/tests/opcoes-do-deslocamento.test.mjs`.
- `naAba` dentro de Reservas (sem título duplicado); pílula renomeada pra "Transporte", igual ao app.
- "Votos" nas opções de deslocamento: o app não tem (só a Hospedagem tem), então o site também não.
- Conferido lado a lado com o app (porta 8089) em 375 px e no computador em 1366 px: Eurotrip (vazia, Norti dormindo) e "Galeão, Paris e mais 5" (1 deslocamento, aberto). Comparar não foi visto na tela: nenhuma viagem tem opções e não gravei dado de teste.
- Ficaram sem uso: `features/transportes/FormTrajeto.tsx` e `rota.ts` (podem ser apagados depois).
- `npm test`: 547 de 550. Falhas antigas: `078` (o teste espera que membro não grave trajeto nenhum, mas a spec 122 deixou o membro gravar sugestão: o teste precisa inserir com `situacao = 'decidido'`), emoji (arquivos de outras telas) e o zip do Windows.

## Roteiro do site (09/11/2026, commit local)
- Pedido da pessoa: a tela de Roteiro do site estava estranha (abria direto no baralho do Explorar).
- Nova `pages/viagem/Roteiro.tsx` em `/viagem/<id>/roteiro`, igual à aba do app: título "Roteiro" + botão "Cidades", pílulas **Matches** (com o número de novos) e **Dia 1, Dia 2...**. Matches em 3 grupos (Todo mundo quer, Deu match, Quase) com "Adicionar ao dia", "Opinar" e "No dia"; botões "Montar os dias com os matches" e "Descobrir mais lugares" (este abre o baralho em `explorar`).
- Tocar num dia mostra a antiga Agenda daquele dia dentro do Roteiro (`Agenda` aceita `diaDoRoteiro`: sem título e sem a fileira de dias). A Agenda saiu de "Tudo da viagem"; o endereço `/agenda` continua funcionando.
- Menu: a aba Roteiro aponta pra `roteiro` e fica acesa no `explorar` e na `agenda`. A seta do baralho volta pro Roteiro.
- `features/roteiro/matches.ts`: cópia de `apps/mobile/src/dados/matches.ts` (RPC `matches_da_viagem`).
- **Falta:** o mapa ilustrado do dia (folha que sobe por cima) e os avisos do dia (spec 122b) do app. Matches com dados de verdade não conferido (as viagens da conta de teste não tinham match); vazio, dias, 375px e 1366px conferidos na 5173.

