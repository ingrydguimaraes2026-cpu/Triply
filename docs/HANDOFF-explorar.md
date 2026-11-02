# HANDOFF — Explorar (spec 114), 02/11/2026

> Pro próximo Claude continuar. Leia a spec `docs/specs/114-explorar-deslizar-e-montar-roteiro.md` (seção Decisões) e o protótipo de UX: https://claude.ai/artifact/53ipQyHX27iXKaG8Gw71qv

## Pronto (local, testado)
- **Migration** `supabase/migrations/20261102120000_explorar.sql` → **APLICADA** no Supabase (`ltygqabtdbphtjscvuit`) em 02/11.
- **Core:** `packages/core/src/explorar.ts`, `explorar-cidades.ts` (100 cidades), `montar-dias.ts` (ritmo 2/3/4 por dia), tipos em `database.ts` (à mão; gerar de novo pra conferir).
- **Testes:** `apps/web/tests/explorar.test.mjs` e `explorar-banco.test.mjs` (verdes). Corrigido `supabase-falso.sql` (faltava `service_role`: TODOS os testes de banco estavam quebrados desde a spec 111).
- **Site:** `apps/web/src/pages/viagem/Explorar.tsx`, `features/explorar/*`, rota `explorar` no router, botão "Explorar {destino}" na aba Lugares. Build + lint + tsc ok.

## ⚠️ Onde parou
1. **Função `explorar-cidade`: a versão NO AR está quebrada.** Ela usa o Nominatim, que **bloqueia chamadas do Supabase (403)**. O arquivo local `supabase/functions/explorar-cidade/index.ts` já troca por Open-Meteo (cidade) + busca da Wikidata (região) e foi testado localmente (Paris 60 lugares, Toscana 10, Costa Amalfitana 43, Nova York 54). **Próximo passo: publicar de novo** (`deploy_edge_function`, `verify_jwt: false`, arquivos `index.ts` + `curado.json`) e testar no navegador: Eurotrip → Lugares → Explorar Paris → Ver os lugares.
2. **Agendamento da pré-carga (pg_cron) ainda não criado.** Copiar o padrão do job `atualizar-exigencias` (chave pública no header), a cada 10 min, `body: {"precarga": true, "quantos": 3}`, `timeout_milliseconds: 150000`.
3. **Testar o fluxo inteiro no site** (deslizar, desfazer, teclado, resumo, montar, pôr na agenda) com os critérios de aceite da spec.

## Falta fazer
- Tela no **app mobile** (Expo).
- **"Começar explorando"** na Nova viagem (`apps/web/src/pages/NovaViagem.tsx`, Decisão 5).
- Sugestões da spec 094 (`consultaDeSugestoes` em `packages/core/src/ferramentas.ts`) passarem a ler o catálogo. Hoje chamam o Overpass do navegador e já dão 429.
- **Base curada:** só Jericoacoara e Gramado em `supabase/functions/explorar-cidade/curado.json`. Faltam os outros 18 destinos de natureza da spec (Chapada Diamantina/Lençóis veio com 0 lugares no teste).

## Cuidados
- **Deno:** rodar `deno check` numa pasta temporária. Dentro do projeto ele edita sozinho o `package.json` da raiz (adiciona `workspaces`).
- O Overpass público e o Nominatim **não podem** ser usados ao vivo nem pela função (bloqueiam).
- Outra sessão trocou o nome do produto pra **Tripwave** (textos visíveis). Nomes internos (`@together/core` etc.) continuam iguais de propósito.
