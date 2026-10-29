# Fila da Onda 1 — o que falta e como vou fazer

**Atualizado:** 29/10/2026 · **Base:** `docs/ROADMAP.md` (Onda 1) e `docs/specs/`

Já entregues nesta onda (código + banco + testes): **018** convidado · **019** avisos · **020** tarefas · **021** enquetes · **022** votos em lugares · **023** clima · **024** ponto de encontro.

Este arquivo é a **fila de trabalho** do que resta na Onda 1. Cada item tem o plano de ataque (banco / core / web / mobile / testes) e as perguntas em aberto. **A regra: antes de codar um item, viro o plano dele numa spec formal em `docs/specs/` (modelo `_modelo.md`), implemento, testo pelos critérios e commito.** Um de cada vez.

## Como li a prioridade
Ordenei por **valor ÷ risco ÷ dependência**: primeiro o que entrega rápido, não mexe em coisa sensível (dinheiro, login, membros) e reaproveita o que já existe. Os itens de **notificação/push**, **arquivos (storage)** e **offline** vêm depois porque são de infra e mais pesados. Os de **dinheiro (#17/#18)** ficam **travados** esperando decisão do Victor (mudam o modelo de saldos; a spec 002 adiou "marcar como acertado" de propósito).

---

## A fila (ordem sugerida)

| Nº | Task | Tam. | Banco? | Risco | Estado |
|---|---|---|---|---|---|
| 1 | #5 Compartilhar no WhatsApp | P | não | baixo | a detalhar → spec 025 |
| 2 | #14 Endereço e guia da casa | P | sim (aditivo) | baixo | ✅ spec 026, web, banco aplicado |
| 3 | #16 Comentários em qualquer item | M | sim | médio | ✅ spec 027, web, banco aplicado |
| 4 | #13 Bilhete no trajeto | P | sim + storage | médio | ✅ feito junto com #12 → spec 028 |
| 5 | #6 Agenda do dia | G | sim | médio | a detalhar → spec 029 |
| 6 | #2 Pessoa sem app | P | sim | **alto** (modelo de membros) | a detalhar → spec 030 |
| 7 | #10 Central de notificações | M | sim | médio | a detalhar → spec 031 |
| 8 | #11 Lembretes (push) | M | sim + cron | médio | a detalhar → spec 032 |
| 9 | #12 Cofre da viagem | M | sim + storage | médio | ✅ feito junto com #13 → spec 028 |
| 10 | #15 Offline de leitura | G | não (cache) | alto | a detalhar → spec 034 |
| — | #17 Marcar acerto como pago | P | sim | **trava: Victor** | adiado |
| — | #18 Fechamento da viagem | P | sim | **trava: Victor** | adiado |

---

## 1 · #5 Compartilhar no WhatsApp  (P, sem banco)
**O que é:** um botão "Compartilhar" que gera o link certo (do gasto, da enquete, do dia, do ponto de encontro) e abre direto naquele item.

**Plano:**
- **Core:** `compartilhar.ts` — funções puras que montam o texto + a URL de deep-link por tipo (`gasto`, `enquete`, `lugar`, `ponto`, `dia`). Ex.: `linkDoItem(viagemId, {tipo, id})` → `https://<app>/viagem/<id>/financeiro?gasto=<id>`. Testável.
- **Web:** um `useCompartilhar()` que usa `navigator.share` quando existe (celular) e cai pra copiar o link + abrir `https://wa.me/?text=...` no desktop. Botãozinho reutilizável `BotaoCompartilhar`.
- **Rotas:** as abas já existem; só preciso ler o `?gasto=`/`?enquete=` etc. e rolar/destacar o item (abrir o acordeão certo). Mudança pequena em cada aba.
- **Mobile:** já existe `compartilharLink` (usado no convite). Reaproveito pro mesmo texto/URL.
- **Testes:** `compartilhar.test.mjs` (montagem de texto e URL por tipo).

**Perguntas em aberto:** (a) qual domínio público usar no link? Hoje não tem deploy — uso uma constante `BASE_URL` (env `VITE_APP_URL`, cai pra `window.location.origin`). (b) começo só com gasto + enquete + ponto de encontro e deixo "dia" pra quando a Agenda (#6) existir?

## 2 · #14 Endereço e guia da casa  (P, banco aditivo)
**O que é:** na hospedagem escolhida, guardar endereço, Wi-Fi (rede/senha), código da porta e regras da casa, pra todo o comboio ver.

**Plano:**
- **Banco:** migration aditiva em `hospedagens` — `endereco text`, `wifi_rede text`, `wifi_senha text`, `codigo_porta text`, `regras text`. RLS já existe na tabela (ver comboio; editar autor/ADM). Sem tabela nova.
- **Core:** estender o tipo/ção de hospedagem (já tem `editarHospedagem`?) pra incluir os campos; senão adiciono `salvarGuiaDaCasa`.
- **Web:** na aba Hospedagem, na hospedagem escolhida, um bloco "Guia da casa" (mostra pra todos; edita autor/ADM). Wi-Fi com botão "copiar senha".
- **Mobile:** mesmo bloco na tela de hospedagem (se existir) — senão fica web-only como o resto de hospedagem e documento isso.
- **Testes:** banco-specs seção nova (campos aditivos; só membro vê; autor/ADM edita).

**Perguntas em aberto:** guardar senha de Wi-Fi e código da porta em texto puro é aceitável? (é dado que o comboio compartilha mesmo; não é credencial de banco). Acho que sim, mas confirmo.

## 3 · #16 Comentários em qualquer item  (M, banco)
**O que é:** poder conversar dentro de um gasto, um lugar, uma opção de hospedagem — em vez de um chat separado.

**Plano:**
- **Reaproveita:** já existe a tabela `comentarios` (hoje só de `posts`/fotos). Vou **generalizar**: nova tabela `comentarios_item (viagem_id, alvo_tipo, alvo_id, autor, texto, criado_em)` OU estender a atual. Decido na spec; provável tabela nova genérica pra não quebrar o feed.
- **Banco:** RLS — comboio do `viagem_id` vê e comenta; autor ou ADM apaga. Gatilho confere que `alvo_tipo ∈ (gasto, lugar, hospedagem, trajeto, enquete)`.
- **Core:** `buscarComentarios(viagemId, alvo)`, `comentar`, `apagarComentario`.
- **Web:** componente `Comentarios alvo={{tipo,id}}` plugável em cada item (começo por gasto e lugar).
- **Mobile:** mesmo componente nos itens que já aparecem.
- **Testes:** seção nova (membro comenta/vê; estranho não; autor/ADM apaga; alvo_tipo inválido barra).

**Perguntas em aberto:** começar por quais alvos? Sugiro **gasto + lugar** (os mais pedidos) e ir ampliando.

## 4 · #13 Bilhete no trajeto  (P, banco + storage)
**O que é:** anexar o PDF/QR do trem ou voo no próprio trajeto.

**Plano:**
- **Storage:** bucket novo `bilhetes` (privado), com policy de storage espelhando a de `fotos` (só comboio da viagem lê/escreve no caminho `viagem/<id>/...`).
- **Banco:** `trajetos.bilhete_caminho text` (ou tabela `trajeto_bilhetes` se for mais de um). Começo com 1 arquivo por trajeto.
- **Core:** helpers de URL assinada (igual fotos).
- **Web:** no form/card do trajeto, upload (PDF/imagem) + "abrir bilhete". **Atenção:** upload é ação com confirmação; o fluxo é o usuário escolher o arquivo (não eu).
- **Mobile:** upload via picker (depois; pode começar web-only).
- **Testes:** banco-specs pro campo + policy (o teste de storage espelha o de fotos).

**Perguntas em aberto:** 1 bilhete por trajeto basta no começo? Limite de tamanho?

## 5 · #6 Agenda do dia  (G, banco)
**O que é:** linha do tempo do que acontece em cada dia, com horário (hoje o mobile já monta isso a partir de trajetos/lugares; falta um "evento" livre).

**Plano:**
- **Banco:** tabela `eventos (viagem_id, dia date, hora time, titulo, local, observacao, criado_por)`. RLS comboio vê/cria; autor/ADM edita/apaga.
- **Core:** CRUD + juntar com trajetos/lugares numa "agenda do dia" (a lógica de montar o dia que já existe no mobile `roteiro.tsx` vira função pura no core, reaproveitada web+mobile).
- **Web:** uma aba/boco "Agenda" por dia (hoje a web não tem a timeline por dia que o mobile tem — é a maior parte do trabalho).
- **Mobile:** já tem a timeline; só pluga os eventos livres.
- **Testes:** montagem da agenda (pura) + RLS dos eventos.

**Perguntas em aberto:** "Agenda" é aba nova no web ou entra dentro do Roteiro? Evento pode repetir? (sugiro não, no começo).

## 6 · #2 Pessoa sem app  (P de código, risco ALTO)
**O que é:** avó/criança entram na divisão de contas e nos quartos sem ter conta; o ADM lança por elas.

**Plano (precisa de spec caprichada — mexe no modelo de membros):**
- **Banco:** "membro fantasma" = um `perfis`/`comboio_membros` sem `auth.users`? Ou uma flag `gerenciado_por`? Isso toca em `auth.uid()`, RLS e em como `gasto_divisoes`/saldos contam. **Risco de quebrar o financeiro.**
- **Decisão de produto necessária** antes de codar.
- **Testes:** pesados (divisão, saldos, RLS com pessoa sem login).

**Perguntas em aberto (pro Victor):** pessoa-sem-app participa de saldo (alguém "cobre" por ela) ou é só rótulo na divisão? Some quando ela cria conta (vira convidado da 018)?

## 7 · #10 Central de notificações  (M, banco)
**O que é:** um sino com tudo que mudou desde a última visita.

**Plano:**
- **Banco:** tabela `eventos_viagem` (log do que acontece: gasto novo, enquete, aviso, ponto…) + `visto_em` por usuário/viagem. Gatilhos nas tabelas-fonte para registrar.
- **Core/Web/Mobile:** sino com contagem de não-lidos; lista; marcar como visto.
- **Testes:** registro do log + contagem de não-lidos.

**Perguntas em aberto:** gravar log por gatilho em cada tabela (mais robusto) vs. derivar na hora (mais simples, menos preciso). Sugiro log por gatilho.

## 8 · #11 Lembretes (push)  (M, banco + cron)
**O que é:** push antes de horários combinados (trem, check-out, encontro).

**Plano:** reaproveita a infra de push que já existe (`push_inscricoes`, `registrar_push`, o cron do boletim de câmbio). Função agendada que varre trajetos/hospedagens/pontos com horário e dispara push X min antes. Depende de ter horários (trajetos ✅, ponto ✅, check-out ✅).

**Perguntas em aberto:** janelas de antecedência (fixas vs. configuráveis). Começo com fixas (ex.: 1h antes).

## 9 · #12 Cofre da viagem  (M, banco + storage)
**O que é:** reservas, ingressos e PDFs num lugar só.

**Plano:** bucket `cofre` (privado, por viagem) + tabela `arquivos_viagem (viagem_id, nome, caminho, tipo, criado_por)`. Lista com upload/baixar/abrir. Espelha storage de fotos. Relaciona com #13 (bilhete é um arquivo com alvo trajeto).

**Perguntas em aberto:** unificar com #13 (bilhete = arquivo do cofre "amarrado" a um trajeto)? Provável sim — faço #13 e #12 compartilhando o mesmo storage/tabela.

## 10 · #15 Offline de leitura  (G, sem banco)
**O que é:** roteiro, documentos e gastos abrem sem internet.

**Plano:** web já é PWA (service worker). Preciso cachear os dados (não só os assets): estratégia de cache dos GETs do Supabase + fallback de leitura. Mobile é outro mecanismo (store local). É o item mais espalhado e arriscado — deixo por último.

**Perguntas em aberto:** só leitura (como diz o nome) — gravar offline fica pra Onda 2. Confirmo escopo.

---

## Travados (dinheiro — decisão do Victor)
- **#17 Marcar acerto como pago** e **#18 Fechamento da viagem.** Mudam o modelo de saldos. A spec 002 adiou "marcar como acertado" de propósito. **Não começo sem o Victor definir** como o acerto fecha (confirmação de quem recebe? saldo zera? histórico?).

---

## Fluxo que vou seguir em cada item
1. Viro o **plano acima** numa **spec** em `docs/specs/0XX-*.md` (modelo `_modelo.md`), resolvendo as perguntas em aberto (as de produto eu te pergunto; as óbvias sigo a sugestão).
2. Implemento: banco (migration + aplico via MCP, com teu ok quando for escrita) → core → web → mobile.
3. Testo pelos **critérios de aceite** (PGlite + build + lint + type-check).
4. Atualizo status no `README.md`/`ROADMAP.md` e **commito** na `monorepo-split`.
