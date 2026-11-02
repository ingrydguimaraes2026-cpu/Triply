# HANDOFF — Explorar (spec 114), 02/11/2026

> Pro próximo Claude continuar. Leia a spec `docs/specs/114-explorar-deslizar-e-montar-roteiro.md` (seção Decisões) e o protótipo de UX: https://claude.ai/artifact/53ipQyHX27iXKaG8Gw71qv

## Pronto (local, testado)
- **Migration** `supabase/migrations/20261102120000_explorar.sql` → **APLICADA** no Supabase (`ltygqabtdbphtjscvuit`) em 02/11.
- **Core:** `packages/core/src/explorar.ts`, `explorar-cidades.ts` (100 cidades), `montar-dias.ts` (ritmo 2/3/4 por dia), tipos em `database.ts` (à mão; gerar de novo pra conferir).
- **Testes:** `apps/web/tests/explorar.test.mjs` e `explorar-banco.test.mjs` (verdes). Corrigido `supabase-falso.sql` (faltava `service_role`: TODOS os testes de banco estavam quebrados desde a spec 111).
- **Site:** `apps/web/src/pages/viagem/Explorar.tsx`, `features/explorar/*`, rota `explorar` no router, botão "Explorar {destino}" na aba Lugares. Build + lint + tsc ok.

## No ar (02/11, PC 2)
- **Função `explorar-cidade` v2 publicada** (Open-Meteo + Wikidata, `verify_jwt: false`). Paris carregou no navegador com 15 cartões e fotos.
- **Pré-carga agendada:** job `precarga-explorar` no pg_cron, a cada 10 min, `{"precarga": true, "quantos": 3}`. Primeiro teste preparou o Rio de Janeiro.
- **Testado no site (Eurotrip → Lugares → Explorar Paris):** estilo/ritmo, deslizar pelo teclado (→ quero, ← passo, ↑ não abro mão, Z desfaz), resumo, montar 1 dia, 360px sem rolar pro lado.
- Data do dia corrigida ("Sexta-feira, 4 de junho"; antes "4 De Junho").
- **Não testado ainda:** "Pôr na agenda da viagem" (grava na viagem de verdade).
- Teclas apertadas muito rápido (sem pausa) só contam a primeira: a animação trava. Ok com ~0,5 s entre elas.

- **Sugestões da aba Lugares (spec 094) leem o catálogo** (`sugestoesDoCatalogo` + `carregarCatalogo`); o Overpass saiu delas. Ainda resta o Overpass no "banheiro grátis" da tela Hoje.

## App mobile (02/11, PC 1) — decisão: MOBILE PRIMEIRO (ver AGENTS.md seção 5)
- **Pronto e testado na versão web do Expo (porta 8089, celular 375px):** `apps/mobile/app/explorar.tsx`, `src/ui/CartaoDoExplorar.tsx` (arrasto com PanResponder + Animated, sem libs novas), `src/ui/RoteiroDoExplorar.tsx`; atalho "Explorar" na tela da viagem (`app/viagem/[id].tsx`).
- Funções de banco do Explorar foram pro core: `packages/core/src/explorar-dados.ts` (o site ainda usa `apps/web/src/features/explorar/api.ts`; dá pra trocar depois).
- Testado: deslize nas 3 direções (toque e mouse) gravando no banco, botões, "Pronto" → roteiro com dias, mapa, estrela e "min a pé", menu "…" abre.
- **Feito em 02/11 (sessão 2):**
  - "Mover pra Dia 2" **salva**: conferido no banco (tabela `roteiros`) depois de mover no app.
  - **Aeroporto/ponto de partida é pulado** no app e no site: `ehPontoDePartida` / `destinosParaExplorar` em `packages/core/src/explorar-cidades.ts` (palavras como "aeroporto", "rodoviária" e nomes como Galeão, Guarulhos, Santos Dumont). Teste em `apps/web/tests/explorar.test.mjs`. Se a viagem só tiver partida, mostra tudo.
  - **Tempo real no app**: `apps/mobile/src/dados/useAoVivo.ts` (escuta tabelas da viagem pelo Realtime, junta mudanças em 600 ms). O Explorar usa `useAoVivo(viagem.id, ['roteiros','lugares'], …)` e recarrega o roteiro sem "Montando…". Conferido: mudança feita direto no banco apareceu na tela sem recarregar.
  - **Roteiro de teste Playwright** (texto, passou/falhou): `apps/mobile/e2e/explorar.mjs`. Precisa de conta de TESTE: `TRIPWAVE_EMAIL=… TRIPWAVE_SENHA=… VIAGEM_ID=… node apps/mobile/e2e/explorar.mjs` (Expo web na 8089). O Playwright não está no projeto: aponte `PLAYWRIGHT=<caminho>/node_modules/playwright/index.mjs` ou instale. **Ainda não rodou de ponta a ponta** (faltou a conta de teste).
- **Próximo no app:** criar a conta de teste e rodar o roteiro; levar o tempo real pras outras telas do app (só o Explorar escuta hoje).

## Falta fazer
- **"Começar explorando"** na Nova viagem (`apps/web/src/pages/NovaViagem.tsx`, Decisão 5).
- **Base curada:** só Jericoacoara e Gramado em `supabase/functions/explorar-cidade/curado.json`. Faltam os outros 18 destinos de natureza da spec (Chapada Diamantina/Lençóis veio com 0 lugares no teste).

## Cuidados
- **Deno:** rodar `deno check` numa pasta temporária. Dentro do projeto ele edita sozinho o `package.json` da raiz (adiciona `workspaces`).
- O Overpass público e o Nominatim **não podem** ser usados ao vivo nem pela função (bloqueiam).
- Outra sessão trocou o nome do produto pra **Tripwave** (textos visíveis). Nomes internos (`@together/core` etc.) continuam iguais de propósito.
