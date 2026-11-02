# 113. Site no design "Together Plataforma"

**Fase:** 7 · **Tamanho:** G · **Depende de:** 112 (site no estilo do app) · **Status:** Em andamento

## Objetivo
O site (`apps/web`) fica igual ao design "Together Plataforma" feito no Claude Design a partir dos prints de 01/11/2026 (`Together Plataforma.dc.html`, no zip "Together App mobile design (2)"). São 20 telas: as mesmas que já existem, redesenhadas.

## Por que
Pedido do Victor em 01/11/2026: tirou print de todas as páginas, refez no Claude Design e pediu pra implementar.

## Inclui
Uma etapa por vez, um commit por etapa (`Site no design Plataforma (spec 113): <tela>`).

| # | Etapa | Tela no design | Onde no site | Status |
|---|---|---|---|---|
| 1 | Moldura da viagem: menu claro que recolhe, "Depois da viagem" (Retrospectiva, Imprimir e PDF, Configurações), rodapé com Novidades e perfil | menu lateral | `pages/viagem/ViagemLayout.tsx` | ✅ Buscar e Emergência ficam no rodapé; Nova viagem e Sair seguem em Minhas viagens |
| 2 | Login | 01 | `pages/Login.tsx` | ✅ Frase da foto muda junto com a foto (3 frases do design) |
| 3 | Convite, convite inválido, 404 (cartão creme sobre o mapa escuro, Agulha em cima) | 02, 02b, 19 | `Convite.tsx`, `Perdido.tsx` | ✅ Peça nova `components/ui/SobreOMapa` (mapa, logo e cartão) usada pelas três |
| 4 | Nova viagem (cartão sobre o mapa) | 05 | `NovaViagem.tsx` | ✅ Logo igual à do Convite; cartão de 500px no computador |
| 5 | Minhas viagens (capa grande + "Próximas" com barra de pronto) | 03 | `MinhasViagens.tsx` | ✅ Barra de "% pronto" fica de fora (precisaria buscar documentos, hospedagem e trajetos de cada viagem); arquivar/apagar do cartão aparecem ao passar o mouse |
| 6 | Perfil (coluna fixa com foto e atalhos, cartões à direita) | 04 | `Perfil.tsx` | ✅ "Onde já fui" entra nos atalhos; no celular os atalhos somem (vira uma coluna só) |
| 7 | Overview (capa, atalhos, mapa + roteiro + clima, furos e documentos ao lado, cartões em colunas) | 06 | `Overview.tsx` | ✅ Todos os cartões à mostra no mosaico (sai o "Mostrar mais da viagem"); clima na coluna do mapa; candidatos e datas em comum seguem só ao planejar |
| 8 | Hoje (aviso com a Agulha, ferramentas em 2 colunas) | 07 | `Hoje.tsx` | ✅ Cartões do dia e ferramentas no mesmo mosaico de 2 colunas |
| 9 | Agenda (dias em pílulas, dia escolhido + "Neste dia") | 08 | `Agenda.tsx` | ✅ Cidade em cada pílula; "Neste dia" mostra a previsão e a hospedagem escolhida do destino |
| 10 | Hospedagem (pílulas de destino, mapa + painel do destino) | 09 | `Hospedagem.tsx` | ✅ Botão "Buscar no Hostels" ganhou cor (estava branco no branco) |
| 11 | Lugares (pílulas, lista + sugestões ao lado) | 10 | `Lugares.tsx` | ✅ Sugestões saíram do painel pra um cartão ao lado (só aparece se o destino tem coordenadas) |
| 12 | Transportes (pílulas, mapa + painel de trechos) | 11 | `Transportes.tsx` | ✅ Herda o palco e o painel da Hospedagem (mesmas peças) |
| 13 | Financeiro (saldo + 4 números, câmbio ao lado de carteira/categorias/acertos, filtros, lista) | 12 | `Financeiro.tsx` | ✅ Só a arrumação mudou (nenhuma conta); relatórios ficam embaixo do câmbio; "Meu orçamento" não vaza mais do cartão estreito |
| 14 | Fotos (coluna central de 760px) | 13 | `Fotos.tsx` | ✅ coluna de 760px; estado vazio com borda tracejada (o resto já vinha da spec 112) |
| 15 | Comboio e Configurações (duas colunas; não-ADM vê "como está agora" travado) | 14, 15 | `Comboio.tsx`, `Configuracoes.tsx` | ✅ Comboio: quem vai | histórico, dica da Agulha, botões numa fileira; Configurações pra não-ADM: aviso, quem é ADM e "Como está agora" com cadeados |
| 16 | Imprimir, Livro e Retrospectiva (folha branca com sombra, capa com foto no livro) | 16, 17, 18 | `Imprimir.tsx`, `Livro.tsx`, `Retrospectiva.tsx` | ⏳ |

## Não inclui
- Funcionalidade nova. Onde o design mostra algo que o site não faz (ex.: "Calendário" na Agenda, "Traduzir pela câmera"), fica de fora ou vira o que já existe.
- Dados de exemplo do design (Galeão, € 540, ingryd paga você). A tela mostra os dados reais.
- O app do celular (`apps/mobile`).

## Telas
- Cores e medidas do design: fundo `#FBF3E6`, cartão branco raio 20 com sombra `0 4px 14px rgba(74,46,20,.06)`, botão couro `#7B542F` raio 12 com sombra, botão claro com borda `#D9C3A2`, campo com borda `#E3D2B8` raio 12.
- Título da tela: nome da viagem pequeno em cima, título Fraunces 30–40px, frase embaixo, ações à direita.
- Desktop usa colunas que quebram sozinhas (flex-wrap); em 360px tudo vira uma coluna.

## Dados
Nada muda no banco.

## Quem pode o quê
Igual ao de hoje em cada tela.

## Critérios de aceite
Valem pra cada etapa:
- [ ] A tela do site fica igual à do design lado a lado (desktop 1424px).
- [ ] Tudo que a tela fazia continua funcionando.
- [ ] Funciona em 360px sem rolar pro lado.
- [ ] `npm run build` e `npm run lint` passam.

## Como ficou
(preencher no fim)
