# 019. Avisos do ADM

**Fase:** 2 · **Tamanho:** P · **Depende de:** 007 · **Status:** Em andamento

## Objetivo
O ADM fixa um recado curto no topo da viagem, que todo o comboio vê na hora que abre o app: "passaporte na mão amanhã às 8h!", "encontro no saguão 19h", "quem não pagou a van, me avisa".

## Por que
- **Pesquisa de mercado (out/2026):** horários descumpridos (36,3%) e falta de um lugar pra recados que não se percam no WhatsApp. O chat do grupo enterra o aviso em dez minutos; aqui ele fica fixo.
- É o começo da área "Comunicação" do catálogo, sem virar um chat (a conversa continua no WhatsApp — veja o "O que NÃO vamos fazer" do ROADMAP).

## Como funciona
- Uma tabela `avisos` guarda os recados da viagem. O mais novo fica no topo.
- Só o **ADM** cria, edita e apaga (o banco garante por RLS, não só a tela). Convidado nunca é ADM (spec 018), então convidado não posta.
- Todo o comboio **vê** os avisos.

## Inclui
- **Faixa de avisos no topo da viagem:**
  - **Web:** no topo do Overview, ocupando a largura toda. Cada aviso é um cartão com ícone de megafone.
  - **Mobile:** no topo da tela da viagem (`viagem/[id]`), logo abaixo do comboio.
- **ADM:**
  - **Web:** botão "Novo aviso" (ou "Fixar um aviso pro comboio" quando não há nenhum), editar e apagar cada aviso ali mesmo.
  - **Mobile:** criar um aviso novo e apagar. A edição fina fica no site (v1).
- **Limite:** 280 caracteres por aviso (recado curto, não texto longo).

## Não inclui (fica pra depois)
- Notificação por push quando o ADM posta um aviso (depende da Central de notificações / Lembretes, itens 10 e 11 da Onda 1).
- Marcar aviso como "lido" por pessoa.
- Comentar ou responder o aviso (a conversa é no WhatsApp).
- Agendar um aviso pra aparecer numa data.

## Dados
- **Migration nova** (`20261029130000_avisos_do_adm.sql`):
  - Tabela `avisos` (`id`, `viagem_id`, `texto` 1–280, `criado_por` = ADM, `criado_em`, `atualizado_em`).
  - Gatilho `conferir_aviso`: a viagem e o autor não mudam; `atualizado_em` sobe ao editar.
  - RLS: comboio vê (`e_membro`); só o ADM cria/edita/apaga (`e_adm`).
- **Tipos:** `avisos` foi adicionado à mão em `packages/core/src/database.ts`. Depois de aplicar a migration no Supabase, gerar os tipos de novo pra bater 100%.

## Quem pode o quê
| Ação | ADM | Membro | Convidado |
|---|---|---|---|
| Ver os avisos | sim | sim | sim |
| Criar / editar / apagar aviso | sim | não | não |

## Critérios de aceite
- [ ] O ADM fixa "Passaporte na mão amanhã!" e todo o comboio vê no topo da viagem (web e mobile).
- [ ] Um membro não vê botão de criar; e, chamando o banco direto, não consegue criar nem editar.
- [ ] Quem não é do comboio não vê nenhum aviso.
- [ ] Aviso em branco é recusado.
- [ ] O ADM apaga o aviso e ele some pra todo mundo.
- [ ] Funciona no web (360px e desktop) e no app mobile.
- [ ] `npm run build`, `npm run lint` e os testes passam.

## Perguntas em aberto
1. **Quantos avisos fixados por vez?** Sugestão: sem limite rígido; o mais novo em cima. Se virar bagunça, limitamos depois.
2. **Avisar por push quando sai um aviso novo?** Sugestão: sim, mas só quando a Central de notificações (item 10) existir.

## Dicas pra implementar
- **Core:** `buscarAvisos`, `criarAviso`, `editarAviso`, `apagarAviso` em `packages/core/src/dados.ts` (web e mobile usam os mesmos).
- **Web:** `src/features/avisos/FaixaAvisos.tsx`, no topo do `Overview`. CSS em `abas.css` (`.faixa-avisos`).
- **Mobile:** `src/ui/Avisos.tsx`, dentro de `app/viagem/[id].tsx`.
- **Testes:** `apps/web/tests/banco-specs.test.mjs`, seção "019" (rodam a migration no PGlite).
