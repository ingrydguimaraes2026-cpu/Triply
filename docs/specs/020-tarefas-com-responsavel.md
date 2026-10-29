# 020. Tarefas com responsável

**Fase:** 2 · **Tamanho:** P · **Depende de:** 007 · **Status:** Em andamento

## Objetivo
Uma lista de tarefas da viagem onde dá pra dizer **quem** fica com cada coisa e **até quando**: "comprar o seguro", "reservar a van do aeroporto", "pegar os ingressos do museu". Assim ninguém assume que o outro ia fazer.

## Por que
- **Pesquisa de mercado (out/2026):** a preparação da viagem se perde no WhatsApp; some no meio da conversa quem ficou de fazer o quê. É a área "Documentos e preparação" do catálogo (item de tarefas).
- Simples, colaborativo e sem virar um gerenciador de projetos: um checklist com dono e prazo.

## Como funciona
- Uma tabela `tarefas` guarda cada item: título, responsável (opcional), prazo (opcional) e se já foi feita.
- **Todo o comboio** vê e cria tarefas.
- **Marcar feita e editar:** quem criou, o responsável ou o ADM.
- **Apagar:** quem criou ou o ADM.
- As pendentes aparecem primeiro; depois por prazo (sem prazo no fim).

## Inclui
- **Web (Overview):** cartão "Tarefas" na coluna lateral.
  - Lista com caixa de marcar, título (riscado quando feita), responsável (um seletor com o comboio) e prazo (em vermelho se atrasado).
  - Adicionar: título + responsável + prazo (data).
- **Mobile (tela da viagem):** cartão "Tarefas" abaixo dos gastos.
  - Lista com caixa de marcar, título, responsável e prazo.
  - Adicionar: título + escolher o responsável tocando numa bolinha com o nome.
  - **Prazo:** por enquanto só é definido no site; no app ele aparece se já estiver lá (v1).

## Não inclui (fica pra depois)
- Lembrete por push quando o prazo chega (depende de Lembretes, item 11 da Onda 1).
- Subtarefas, anexos ou comentários na tarefa.
- Tarefa recorrente, ou modelos de checklist ("o que levar numa viagem de praia").
- Mala individual / do grupo (é outro item do catálogo, com spec própria).

## Dados
- **Migration nova** (`20261029140000_tarefas.sql`):
  - Tabela `tarefas` (`id`, `viagem_id`, `titulo` 1–200, `responsavel_id` → perfis (opcional), `prazo` date, `feita` bool, `criado_por`, `criado_em`).
  - Gatilho `conferir_tarefa`: viagem e autor não mudam; o responsável tem que ser do comboio.
  - RLS: comboio vê e cria; autor/responsável/ADM editam e marcam feita; autor/ADM apagam.
- **Tipos:** `tarefas` adicionado à mão em `packages/core/src/database.ts`. Depois de aplicar a migration, gerar os tipos de novo.

## Quem pode o quê
| Ação | ADM | Membro | Convidado |
|---|---|---|---|
| Ver as tarefas | sim | sim | sim |
| Criar tarefa | sim | sim | sim |
| Marcar feita / editar | sim | só se for autor ou responsável | só se for autor ou responsável |
| Apagar | sim | só o que criou | só o que criou |

## Critérios de aceite
- [ ] Qualquer um do comboio cria "Comprar o seguro" e define a Ingryd como responsável.
- [ ] A Ingryd (responsável) e o autor conseguem marcar como feita; outro membro não.
- [ ] Definir um responsável que não é do comboio é recusado.
- [ ] Quem criou e o ADM apagam; outro membro não.
- [ ] Título em branco é recusado.
- [ ] Tarefa com prazo passado aparece destacada (atrasada).
- [ ] Funciona no web (360px e desktop) e no app mobile.
- [ ] `npm run build`, `npm run lint` e os testes passam.

## Perguntas em aberto
1. **Qualquer membro pode marcar qualquer tarefa como feita?** Sugestão (adotada): não — só quem criou, o responsável ou o ADM. Evita bagunça.
2. **Mais de um responsável por tarefa?** Sugestão: um só por enquanto; se pedirem, viram várias tarefas.

## Dicas pra implementar
- **Core:** `buscarTarefas`, `criarTarefa`, `editarTarefa`, `alternarTarefa`, `apagarTarefa` em `packages/core/src/dados.ts`.
- **Web:** `src/features/tarefas/Checklist.tsx`, num `Cartao` no `Overview`. CSS em `abas.css` (`.checklist`).
- **Mobile:** `src/ui/Tarefas.tsx`, dentro de `app/viagem/[id].tsx`.
- **Testes:** `apps/web/tests/banco-specs.test.mjs`, seção "020".
