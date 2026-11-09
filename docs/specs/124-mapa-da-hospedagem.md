# 124. Mapa da hospedagem

**Fase:** 1 · **Tamanho:** P · **Depende de:** 123 (hospedagem por noite) · **Status:** Pronta pra testar (app e site, 09/11)

## Objetivo
Na Hospedagem de uma cidade, trocar de **Lista** pra **Mapa** e ver de uma vez onde fica cada opção, a estação (ou aeroporto) onde o grupo chega e o principal ponto turístico, com os minutos a pé entre eles.

## Por que
Na Eurotrip, a escolha de Roma foi decidida pela distância da estação Termini (chegam 23h de trem) e do Coliseu. A sessão de 09/11 montou esse mapa fora do app e o Victor pediu que ele morasse dentro do app.

**Encaixe no RUMO:** é acabamento da base de hospedagem (spec 123), não funcionalidade nova. Usa os dados que a 123 já calcula (`lat`/`lon` da opção, ponto de chegada, minutos a pé) e só mostra num mapa. Também ajuda o "Hoje": a casa escolhida e o caminho da estação ficam à vista.

## Inclui
1. **Alternância Lista/Mapa** no topo da tela da cidade (app: `cidade-hospedagem`; site: a cidade aberta em Reservas → Hospedagem). Lista continua sendo o padrão.
2. **Pinos numerados**, na mesma ordem da lista (escolhida primeiro, depois as mais votadas). Rótulo do pino: preço por pessoa e a nota, se tiver ("R$ 722 · 4,8"). A escolhida tem o pino escuro.
3. **Chegada:** pino da estação ou aeroporto. Vem do último deslocamento do dia de chegada (o mesmo da spec 123): `estacao_chegada` e `para_lat`/`para_lon`.
4. **Ponto principal:** um lugar da cidade (tabela `lugares`, com coordenada, sem guarda-volumes). Por padrão é o mais votado; empatando, o que fica mais perto do meio das opções (é o que as opções "cercam"). Uma fileira de botões embaixo do mapa troca o ponto. Os outros lugares aparecem como pontinhos.
5. **Minutos a pé:** embaixo do mapa, uma linha por opção: "6 min da Roma Termini · 12 min do Coliseu". Tocar no pino ou na linha destaca a opção e desenha as duas retas (chegada → opção → ponto).
6. Opção sem ponto no mapa aparece embaixo: "Sem lugar no mapa: informe o endereço".
7. **Link preenche o lugar:** ao colar o link da opção, a prévia (spec 072) também devolve `lat`/`lon` quando a página tem (Airbnb, sites de hotel com dados estruturados, links do Google Maps). O endereço continua valendo e passa na frente.

## Não inclui
- Rota de verdade pelas ruas ou linhas de metrô desenhadas (a distância continua em linha reta × 1,3, como na 123).
- Mapa com zoom e arrastar. É um retrato fixo que enquadra tudo.
- Booking: a página bloqueia robôs; o link do Booking não traz a localização (fica pelo endereço).

## Telas
- **Mapa:** quadro do mapa (altura ~ 3/4 da largura no celular; mais largo no desktop), atribuição "© OpenStreetMap" no canto, fileira "Medir até", lista dos minutos.
- **Vazio:** nenhuma opção com lugar e sem chegada: "Informe o endereço das opções pra ver no mapa."
- **Erro de imagem do mapa:** os pinos continuam sobre o fundo areia.

## Dados
- Sem migration. Usa `hospedagens.lat/lon` (spec 123), `trajetos.para_lat/para_lon/estacao_chegada`, `lugares.latitude/longitude` e votos de `lugar_votos`.
- Fundo do mapa: azulejos do OpenStreetMap (`tile.openstreetmap.org`), com atribuição. Se o uso crescer, trocar por um provedor pago (MapTiler, Stadia) mudando uma constante no core (`URL_DO_AZULEJO`).

## Quem pode o quê
Igual à 123: todo mundo do comboio vê. Trocar o ponto principal é só da tela (não grava nada).

## Critérios de aceite
- [x] Na Eurotrip, Roma → Mapa mostra os 5 pinos, a Roma Termini e o Coliseu.
- [x] Cada opção mostra os minutos a pé da Termini e até o Coliseu.
- [x] Tocar num pino destaca a opção e desenha as retas.
- [x] Trocar "Medir até" pra Fontana di Trevi refaz os minutos.
- [ ] Colar um link do Airbnb preenche o lugar da opção sem digitar endereço. (A função lê o lugar das páginas reais; salvar pela tela não foi testado pra não gravar opção de teste na Eurotrip.)
- [x] Funciona a 360px e no desktop.

## Como ficou (09/11)
- **Core:** `packages/core/src/mapa-da-hospedagem.ts` (`mapaDaHospedagem`, `pontoPrincipal`, `enquadrarNoMapa`). Teste: `apps/web/tests/mapa-da-hospedagem.test.mjs`. Em `previa.ts`: `lerPontoDaPagina` (lat/lon da página), copiado na função `previa-link`.
- **App:** `src/ui/MapaDaHospedagem.tsx`, usado em `app/cidade-hospedagem.tsx` (Lista/Mapa). `app/opcao-hospedagem.tsx` usa o lugar que vem da prévia do link.
- **Conferido (09/11):** site a 360px e no desktop, app (Expo web) a 360px. Zoom fracionado pra os pontos ocuparem o quadro; rótulo de preço que cobriria outro fica escondido (o da opção destacada sempre aparece); o nome da estação e do ponto fica à direita da bolinha.
- **Site:** `apps/web/src/features/hospedagem/MapaDaHospedagem.tsx`, na cidade aberta da Hospedagem.
- **Dados da Eurotrip (09/11):** o trem que chega em Roma passou a apontar pra Roma Termini (41.9010, 12.5016); Coliseu, Trevi, Panteão, Vaticano e o Buraco da Fechadura ganharam coordenada; a Just Chilling Suites ganhou o lugar do site dela (Largo Brancaccio, 83).
