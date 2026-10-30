# 106. Livro da viagem

**Fase:** 8 · **Tamanho:** G (feito em M) · **Depende de:** 088, 098, 101 · **Status:** Pronto pra testar (web) · sem banco

## Objetivo
Um PDF bonito da viagem: capa, e uma página por dia com a agenda, o que cada um escreveu no diário e as fotos.

## Por que
- Catálogo K8. É a lembrança que fica; dá pra mandar pra família ou imprimir numa gráfica depois.

## Inclui
- Página `/viagem/<id>/livro` (links na Retrospectiva e na página do PDF).
- Capa: nome, período, roteiro e o comboio.
- Cada dia em página nova (na impressão): agenda, diário (só os textos "do comboio"; "só eu" não entra) e até 6 fotos, as mais curtidas primeiro, com a legenda.
- "Imprimir ou salvar PDF" (impressão do navegador). Nenhuma biblioteca nova.

## Não inclui (fica pra depois)
- Escolher as fotos de cada dia.
- Mandar pra gráfica (impressão de verdade).
- App mobile.

## Riscos
- O link de cada foto vale 1 hora (o bucket é privado): imprimir logo depois de abrir a página.

## Dados
- Sem migration.

## Critérios de aceite
- [x] Uma página por dia com alguma coisa, em ordem (testado: `livro.test.mjs`).
- [ ] No navegador: Retrospectiva → Livro da viagem → Imprimir → Salvar como PDF; conferir um dia por página.
