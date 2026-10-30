# 098. Álbum por dia e melhores fotos

**Fase:** 8 · **Tamanho:** P · **Depende de:** 017 · **Status:** Pronto pra testar (web) · sem banco

## Objetivo
Na aba Fotos, além de Feed e Grade: **Por dia** (as fotos separadas por dia da viagem, com o destino) e **Melhores** (as mais curtidas).

## Por que
- Catálogo K2 (álbum por dia e destino) e K3 (melhores fotos). Depois da viagem, ninguém acha "aquela foto de Mônaco" rolando o feed.

## Inclui
- **Por dia**: grupos na ordem da viagem ("sexta-feira, 20 de novembro · Nice"), cada um em grade. O destino vem do post; se o post não tem, do roteiro naquele dia.
- **Melhores**: até 9 posts, por curtidas, depois comentários, depois o mais novo. Só entra quem tem curtida.
- Tocar numa foto abre o post no Feed (igual à Grade).
- 4 abas cabem no celular (ícone em cima do nome em telas estreitas).

## Não inclui (fica pra depois)
- Escolher à mão as melhores / capa do álbum.
- Melhores por destino.

## Dados
- Sem migration.

## Critérios de aceite
- [x] Grupos por dia na ordem, destino do post ou do dia; melhores pela regra (testado: `album.test.mjs`).
- [ ] No navegador (360px): Fotos → Por dia e Melhores; tocar abre no Feed.
