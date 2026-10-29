# 029. Agenda do dia

**Fase:** 2 · **Tamanho:** G · **Depende de:** 003, 004 · **Status:** Pronto pra testar (web)

## Objetivo
Ver o que acontece em cada dia da viagem, com horário, num lugar só: trem das 9h15, chegada em Roma, jantar às 20h.

## Por que
- Roadmap #6 (Onda 1). Hoje o comboio junta trajetos (Transportes), destinos (roteiro) e combinados (WhatsApp) de cabeça. O mobile já tinha uma linha do tempo; a web não tinha nada por dia.

## Inclui
- Aba nova **Agenda** (`/viagem/<id>/agenda`), logo depois da Overview no menu.
- Botões de dia (rolam pro lado no celular). Abre em **hoje** se a viagem estiver acontecendo; senão no primeiro dia. Bolinha laranja = dia com algo marcado.
- Linha do tempo do dia, montada sozinha:
  - saídas de destino (no topo);
  - trajetos que partem no dia (com hora, "chega HH:MM");
  - **eventos livres** do comboio (com ou sem hora);
  - chegadas em destino (no fim).
- "Em <destino>" no topo do dia e link "Ideias do que fazer em <destino>" pra aba Lugares.
- Criar, editar e apagar evento livre (nome, dia, hora opcional, onde, observação).
- No celular o menu passa de 7 pra 8 abas; a Overview aparece como "Início" (nome curto, igual "Estadia" e "Transp.").

## Não inclui (fica pra depois)
- Evento que repete, duração/hora de fim, lembrete do evento (vai com #11 Lembretes).
- Lugares com dia marcado na agenda (hoje lugar não tem dia; fica o link pra aba Lugares).
- Arrastar pra reordenar.
- Check-in/check-out da hospedagem na linha do tempo.
- Mobile: o roteiro do app ainda usa a montagem antiga. Trocar por `montarAgendaDoDia` do core quando levarmos pro mobile.

## Telas
- **Sem datas no roteiro:** "Sem datas no roteiro · Coloque as datas de chegada e saída dos destinos na Overview pra montar a agenda."
- **Dia vazio:** "Nada marcado nesse dia · Adicione um evento ou um trajeto com horário."
- Item sem hora mostra "—". Lápis só nos eventos que eu criei (ADM vê em todos). Trajeto tem "→" pra aba Transportes.
- **Gaveta "Novo evento" / "Editar evento":** apagar pede confirmação (Manter / Apagar evento).

## Dados
- **Migration:** `supabase/migrations/20261029232632_agenda_do_dia.sql`.
- Tabela `eventos_agenda` (`viagem_id`, `dia`, `hora` opcional, `titulo` 1 a 120, `local` até 200, `observacao` até 500, `criado_por`, `criado_em`).
- Gatilho: viagem e autor não mudam.
- O dia não é travado no período da viagem (o roteiro pode mudar); a tela só oferece os dias da viagem e mantém o dia antigo na edição.

## Quem pode o quê
| Ação | ADM | Membro | Quem não é do comboio |
|---|---|---|---|
| Ver a agenda | ✅ | ✅ | ❌ |
| Criar evento | ✅ | ✅ | ❌ |
| Editar/apagar evento que criou | ✅ | ✅ | — |
| Editar/apagar evento de outra pessoa | ✅ | ❌ | — |

## Critérios de aceite
- [x] A agenda abre no dia certo e mostra chegadas/saídas e trajetos com hora, na ordem (testado: `agenda.test.mjs`).
- [x] Criar evento aparece na hora, na posição da hora (testado no navegador).
- [x] Editar a hora reordena; apagar some (testado no navegador).
- [x] Quem não é do comboio não vê nem cria; membro não mexe no evento dos outros (testado no banco).
- [x] Menu de baixo cabe em 360px com 8 abas.
- [x] `npm run build`, `npm run lint` e os testes passam.

## Perguntas em aberto
- Nenhuma. Decidido: aba própria (não dentro do roteiro da Overview); evento não repete no começo.

## Dicas pra implementar
- Core: `packages/core/src/agenda.ts` (`montarAgendaDoDia`, `diasDoPeriodo`, `destinoDoDia`, puro) e CRUD em `dados.ts` (`buscarEventosDaAgenda`, `criarEventoDaAgenda`, `editarEventoDaAgenda`, `apagarEventoDaAgenda`).
- Web: `pages/viagem/Agenda.tsx`, `features/agenda/` (`hooks.ts`, `FormEvento.tsx`).
- Testes: `apps/web/tests/agenda.test.mjs` (montagem) e `banco-specs.test.mjs` (seção 029).
