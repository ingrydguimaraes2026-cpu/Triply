# 049. Contagem e progresso da preparação

**Fase:** 2 · **Tamanho:** P · **Depende de:** 006, 010, 011, 035 · **Status:** Pronto pra testar (web)

## Objetivo
No topo da Overview, antes da viagem: "Faltam 23 dias · 78% pronto". Passar o mouse mostra o que falta.

## Por que
- Catálogo I11. Dá a sensação de progresso e mostra o que ainda trava a viagem.

## Inclui
- Porcentagem = média das partes que existem na viagem (cada uma vale igual): meus documentos resolvidos, destinos com hospedagem, trajetos comprados (spec 035).
- Só aparece antes do primeiro dia da viagem.
- Dica (title) com as partes incompletas.

## Não inclui (fica pra depois)
- Tarefas e "quem leva" na conta (estão em componentes que buscam sozinhos; entram quando houver um hook compartilhado).
- App mobile.

## Dados
- Nenhuma mudança no banco.

## Critérios de aceite
- [x] Média das partes, partes vazias não contam, o que falta (testado: `transportes-situacao.test.mjs`).
- [ ] No navegador: viagem futura mostra "Faltam N dias · X% pronto".

## Dicas pra implementar
- Core: `prontidao` em `packages/core/src/transportes.ts`.
