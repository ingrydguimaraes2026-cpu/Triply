# 099. Baixar todas as fotos em .zip

**Fase:** 8 · **Tamanho:** P · **Depende de:** 017, 098 · **Status:** Pronto pra testar (web) · sem banco

## Objetivo
Na aba Fotos, "Baixar todas (80) em .zip": um arquivo com todas as fotos da viagem, com nome que dá pra achar depois ("2026-11-20_Nice_03.jpg").

## Por que
- Catálogo K5. Depois da viagem cada um quer as fotos no próprio computador/Google Fotos, sem baixar uma por uma.

## Inclui
- Monta o .zip no próprio aparelho (nada novo no servidor, nenhuma biblioteca nova): o app tem um zip simples, sem compressão (foto já vem comprimida).
- Ordem e nome pelo álbum por dia (spec 098): dia, destino, número.
- Mostra o progresso ("Baixando 12 de 80…"). Foto que falhar não trava: avisa quantas não vieram.

## Não inclui (fica pra depois)
- Vídeos (o feed ainda não tem).
- Zip montado no servidor (pra viagens com milhares de fotos).
- App mobile.

## Riscos
- Viagem com muitas fotos usa memória do celular (as fotos já são reduzidas no envio, ~300 KB cada: 300 fotos ≈ 90 MB). Se for problema, dividir por dia.

## Dados
- Sem migration.

## Critérios de aceite
- [x] CRC certo; o zip abre no `unzip` e devolve os arquivos iguais; nomes sem caractere proibido (testado: `zip.test.mjs`).
- [ ] No navegador: Fotos → Baixar todas → abrir o .zip no computador.
