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

## Falta fazer
- Tela no **app mobile** (Expo).
- **"Começar explorando"** na Nova viagem (`apps/web/src/pages/NovaViagem.tsx`, Decisão 5).
- **Base curada:** só Jericoacoara e Gramado em `supabase/functions/explorar-cidade/curado.json`. Faltam os outros 18 destinos de natureza da spec (Chapada Diamantina/Lençóis veio com 0 lugares no teste).

## Cuidados
- **Deno:** rodar `deno check` numa pasta temporária. Dentro do projeto ele edita sozinho o `package.json` da raiz (adiciona `workspaces`).
- O Overpass público e o Nominatim **não podem** ser usados ao vivo nem pela função (bloqueiam).
- Outra sessão trocou o nome do produto pra **Tripwave** (textos visíveis). Nomes internos (`@together/core` etc.) continuam iguais de propósito.
