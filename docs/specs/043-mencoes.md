# 043. Menções @nome nos comentários

**Fase:** 2 · **Tamanho:** P · **Depende de:** 027, 032 · **Status:** Pronto pra testar (web)

## Objetivo
Num comentário de gasto, lugar ou hospedagem, escrever `@Ingryd` chama a pessoa: o nome fica destacado e ela recebe um aviso no celular.

## Por que
- Catálogo G7. Sem menção, a pergunta "quem paga isso?" fica perdida até alguém abrir o item.

## Inclui
- Ao digitar `@` + letras, aparecem até 5 pessoas do comboio pra tocar e completar (`@Ingryd `).
- Funciona com primeiro nome ou nome inteiro, sem acento e sem maiúscula (`@ana paula`, `@VICTOR`). E-mail (`victor@gmail.com`) não conta.
- Menção destacada no texto; a minha em laranja.
- Push "💬 Victor te chamou" pra quem foi mencionado (função `avisar-mencao`), abrindo o item.

## Não inclui (fica pra depois)
- Menção em tarefa (a tarefa já tem responsável) e em post de fotos.
- Entrar na central de notificações (o log é por gatilho e não sabe de menções).
- App mobile.

## Dados
- Nenhuma mudança no banco. Função nova `supabase/functions/avisar-mencao` (precisa publicar).

## Critérios de aceite
- [x] Acha menções por primeiro nome/nome inteiro; ignora e-mail e nome colado; sugere e completa (testado: `mencoes.test.mjs`).
- [ ] No navegador: comentar "@Victor confere?" e ver o destaque; no celular do Victor, o aviso.

## Dicas pra implementar
- Core: `packages/core/src/mencoes.ts` (`acharMencoes` copiado na função).
