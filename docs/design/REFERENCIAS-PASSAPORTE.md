# Referências de UI pro passaporte da galera (spec 118)

*03/11/2026. Protótipo: [`docs/marketing/teste/ancora/passaporte.html`](../marketing/teste/ancora/passaporte.html), um passaporte literal com capa de couro e letras douradas, página de dados da galera com a zona de leitura, páginas de visto com carimbos, o carimbo caindo e a luz UV.*

## Native Cook (https://nativecook.dev)

Blocos de UI de celular, cada um com vídeo, um prompt pra React Native (Expo + Reanimated) e o código no GitHub. **Grátis por enquanto.** Antes de copiar código, confira a licença do repositório e o autor do design: muitos blocos citam o Pinterest como fonte.

| Bloco | Pra quê no Tripwave |
|---|---|
| [blacklight-flight-passport](https://nativecook.dev/blocks/blacklight-flight-passport/) | Passaporte com mapa, rotas em arco, zona de leitura e **luz UV que revela tinta escondida**. É a base da página de dados. |
| [postcard-stamp-cancel](https://nativecook.dev/blocks/postcard-stamp-cancel/) | Carimbo de correio caindo num cartão-postal do dia ("Lisbon, day 4"): o carimbo do dia da viagem. |
| [postage-stamp-reveal](https://nativecook.dev/blocks/postage-stamp-reveal/) | Lugar desenhado como selo de correio picotado: a arte local de cada carimbo. |
| [stamp-diary-calendar](https://nativecook.dev/blocks/stamp-diary-calendar/) | Selos que você arranca com o dedo e voam pra uma colagem com o carimbo por cima: o "há 1 ano" e as viagens antigas. |
| [page-curl-journal](https://nativecook.dev/blocks/page-curl-journal/) e [dreambook-hinge-journal](https://nativecook.dev/blocks/dreambook-hinge-journal/) | Virar a página como livro de verdade e abrir a capa na dobra: a navegação do passaporte. |
| [foil-stamp-button](https://nativecook.dev/blocks/foil-stamp-button/) | Botão que é um carimbo de latão: o "Carimbar". |
| [wax-seal-invite](https://nativecook.dev/blocks/wax-seal-invite/) | Convite com selo de cera que racha ao puxar: o convite da viagem. |
| [stamped-ticket-pile](https://nativecook.dev/blocks/stamped-ticket-pile/), [boarding-pass-stack](https://nativecook.dev/blocks/boarding-pass-stack/), [travel-pass-stack](https://nativecook.dev/blocks/travel-pass-stack/), [departure-board-ticket](https://nativecook.dev/blocks/departure-board-ticket/) | As reservas do grupo no "Hoje" (spec 120), como pilha de bilhetes. |
| [folded-map-card](https://nativecook.dev/blocks/folded-map-card/), [quest-map-unroll](https://nativecook.dev/blocks/quest-map-unroll/) | O mapa da galera como mapa de papel que desdobra. |
| [travel-stat-story-card](https://nativecook.dev/blocks/travel-stat-story-card/), [trip-album-folder](https://nativecook.dev/blocks/trip-album-folder/) | Retrospectiva em cartões de story e o álbum da viagem. |
| [widget-stamp-picker](https://nativecook.dev/blocks/widget-stamp-picker/) | Escolher o widget de contagem como selo. |
| [badge-vault-grid](https://nativecook.dev/blocks/badge-vault-grid/), [crayon-rubbing-card](https://nativecook.dev/blocks/crayon-rubbing-card/) | Coleção de conquistas; "esfregar o giz" pra revelar um carimbo escondido. |

## Regras visuais que saíram do protótipo

- **Literal, não metáfora:** couro, folha de ouro, papel com padrão de segurança (guilhoché), zona de leitura (MRZ), número do passaporte e páginas numeradas.
- **Carimbos variam:** redondo, retangular, oval e triangular, em tintas diferentes, girados, com borda irregular e falhas de tinta, aplicados por cima do papel (multiply).
- **Mão humana:** notas e assinatura em letra cursiva ("a Ana perdeu o chinelo").
- **Momento físico:** o carimbo cai grande, encolhe, faz o papel tremer e espirra tinta. No celular, junto com uma vibração curta.
- **Segredo:** a luz UV mostra o caminho e uma piada do grupo em tinta neon. É o print que a pessoa vai postar.
