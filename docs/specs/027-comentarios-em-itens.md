# 027. Comentários em qualquer item

**Fase:** 2 · **Tamanho:** M · **Depende de:** 002, 011, 016 · **Status:** Pronto pra testar (web)

## Objetivo
Conversar **dentro** de um gasto, de um lugar ou de uma opção de hospedagem ("tem café da manhã?", "paguei em dinheiro", "vale ir cedo?"), em vez de perder a conversa no WhatsApp.

## Por que
- Roadmap #16 (Onda 1). A pesquisa mostrou que competir com o WhatsApp num chat geral não funciona; comentário **no item** resolve a dúvida onde ela nasce. É o "no lugar" de "Chat completo" na lista do que NÃO vamos fazer.

## Inclui
- Botão de balão (com o número de comentários) em:
  - cada gasto (aba Financeiro);
  - cada lugar (aba Lugares);
  - cada opção de hospedagem (aba Hospedagem).
- Tocar abre uma gaveta com a conversa, do mais antigo pro mais novo, e um campo pra escrever.
- Apagar o próprio comentário (o ADM apaga qualquer um).

## Não inclui (fica pra depois)
- Editar comentário (apaga e escreve de novo).
- Comentar em trajeto, enquete, tarefa ou ponto de encontro.
- Avisar no celular quando alguém comenta (vai com a Central de notificações, #10).
- Menção com @.
- App mobile (web primeiro).

## Telas
- **Botão:** balão + número (sem número quando não tem comentário). Fica ao lado do compartilhar.
- **Gaveta "Comentários · <nome do item>":** lista com foto, nome ("Você" pros meus), texto e "há quanto tempo". Vazia: "Nenhum comentário ainda". Erro ao carregar ou enviar aparece em vermelho; o texto digitado não se perde.

## Dados
- **Migration nova:** tabela `comentarios_item` com `viagem_id`, `gasto_id`, `lugar_id`, `hospedagem_id`, `autor`, `texto` (1 a 1000), `criado_em`.
  - Exatamente um dos três alvos preenchido (check).
  - Chave estrangeira de verdade pra cada alvo, com cascade: apagar o item apaga os comentários.
  - Gatilho preenche a `viagem_id` a partir do item (quem comenta não escolhe a viagem).
- Sem update (não dá pra editar).

## Quem pode o quê
| Ação | ADM | Membro | Quem não é do comboio |
|---|---|---|---|
| Ver e comentar (lugar, hospedagem, gasto do comboio) | ✅ | ✅ | ❌ |
| Ver e comentar gasto **pessoal** | só quem lançou | só quem lançou | ❌ |
| Apagar o próprio comentário | ✅ | ✅ | — |
| Apagar comentário de outra pessoa | ✅ | ❌ | — |

## Critérios de aceite
- [ ] Gasto, lugar e opção de hospedagem têm o botão de comentários com o número certo.
- [ ] Comentar aparece na hora e continua lá ao recarregar.
- [ ] Apagar o próprio comentário some e o número diminui.
- [ ] Apagar o item apaga os comentários dele (testado no banco).
- [ ] Comentário de gasto pessoal só quem lançou vê (testado no banco).
- [ ] Quem não é do comboio não vê nem comenta (testado no banco).
- [ ] `npm run build`, `npm run lint` e os testes passam.

## Perguntas em aberto
- Nenhuma. Decidido: começa por gasto, lugar e hospedagem (os mais pedidos); tabela nova com uma coluna por alvo (em vez de "tipo + id" solto), pra o banco garantir que o item existe e limpar sozinho.

## Dicas pra implementar
- Migration: `supabase/migrations/20261029223918_comentarios_em_itens.sql`. Testes: `apps/web/tests/banco-specs.test.mjs` (seção 027).
- Core: `buscarComentariosDoItem`, `contarComentariosDaViagem`, `comentarNoItem`, `apagarComentarioDoItem` em `packages/core/src/dados.ts`.
- Web: `features/comentarios/ComentariosDoItem.tsx` (botão + gaveta, autossuficiente) e `useContagemDeComentarios` (`hooks.ts`). Basta pôr `<ComentariosDoItem alvo={{ tipo, id }} titulo=… quantidade=… aoMudar=… />` no item.
- A gaveta é um portal do React: o clique lá dentro sobe pelos pais do React. Por isso o componente para a propagação no `<span>` em volta.
