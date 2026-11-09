# 053. Busca na viagem

**Fase:** 2 · **Tamanho:** P · **Depende de:** várias · **Status:** Pronto pra testar (web)

## Objetivo
Uma lupa no topo acha qualquer coisa da viagem num campo só: lugar, gasto, hospedagem, trajeto, evento, tarefa, arquivo do cofre, enquete, destino — inclusive código de reserva e link.

## Por que
- Catálogo M9. "Onde estava o link daquele restaurante?" vira uma busca, não uma caça em 6 abas.

## Inclui
- Lupa no topo (celular) e "Buscar" no menu (computador), abrindo uma gaveta.
- Ao abrir, monta o índice com uma leitura de cada tabela (em paralelo). Busca enquanto digita.
- Sem acento e sem maiúscula; todas as palavras precisam aparecer; título vale mais que detalhe. Até 30 resultados, com o tipo e o detalhe.
- Tocar abre o item (gasto, lugar e enquete com destaque).

## Não inclui (fica pra depois)
- Buscar dentro de comentários e fotos.
- App mobile.

## Dados
- Nenhuma mudança no banco (só leituras que o comboio já pode fazer; gasto pessoal dos outros nem vem).

## Critérios de aceite
- [x] Sem acento, por detalhe (código de reserva), ordem, termo curto (testado: `busca.test.mjs`).
- [ ] No navegador: buscar o nome de um restaurante e cair no lugar destacado.

## Dicas pra implementar
- Core: `packages/core/src/busca.ts`. Web: `features/busca/BuscaNaViagem.tsx` (tipo novo: acrescentar no índice e em `NOMES_DOS_TIPOS`).
