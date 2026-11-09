# 023. Clima por dia

**Fase:** 2 · **Tamanho:** P · **Depende de:** 001 (datas dos destinos) · **Status:** Em andamento

## Objetivo
Mostrar a **previsão do tempo em cada dia do roteiro**, por destino. Assim o comboio sabe se leva casaco ou guarda-chuva e planeja os passeios sem surpresa.

## Por que
- É uma das funcionalidades mais pedidas em apps de viagem (catálogo de funcionalidades) e tira dúvida que hoje a pessoa vai buscar fora do app.
- A gente já tem o que precisa: cada destino tem **coordenadas** (latitude/longitude) e **datas** (chegada/saída, spec 001).

## Como funciona
- Para cada destino com coordenadas e data de chegada, buscamos o clima dia a dia do período dele.
- **Previsão de verdade** nos próximos ~16 dias (o quanto o serviço prevê).
- **Estimativa** para dias mais distantes: usamos o **mesmo período do ano passado** como palpite (não é previsão, é referência histórica). Esses dias aparecem marcados como "estimativa".
- Dias que já passaram não aparecem (clima é pra frente).
- Fonte: **Open-Meteo** — grátis, sem chave, funciona direto do navegador e do app. Sem banco de dados.

## Inclui
- **Core (`@together/core`):** `clima.ts` com `buscarClima(...)`, `interpretarTempo(codigo)` e `janelaDeClima(...)` (a parte pura que decide previsão × estimativa, com teste).
- **Web (Overview):** cartão "Clima" com uma tira de dias por destino (emoji, dia da semana, máxima/mínima). Só aparece quando há o que mostrar.
- **Mobile (Roteiro):** um chip de clima no cabeçalho do dia escolhido (emoji + rótulo + máx/mín), a partir do destino daquele dia.

## Não inclui (fica pra depois)
- Avisar sobre tempo ruim (push/alerta) — é um item à parte, ligado à Central de notificações.
- Previsão por hora. Mostramos só o resumo do dia (máx/mín, chuva, condição).
- Clima de lugares específicos dentro do destino (usamos as coordenadas do destino).

## Dados
- **Sem migration.** Nenhuma tabela nova; tudo vem da API externa, em memória (cache de 3 horas por destino/período).

## Quem pode o quê
Clima é informação pública: todo o comboio vê igual. Ninguém edita.

## Critérios de aceite
- [ ] Na Overview, aparece o cartão "Clima" com os dias de cada destino que tem coordenadas e datas.
- [ ] Dias nos próximos ~16 dias mostram previsão; dias mais distantes aparecem como "estimativa" (mais apagados).
- [ ] Viagem toda no passado, ou destino sem coordenadas/datas: o cartão não aparece (nada quebra).
- [ ] No app, ao abrir o Roteiro e escolher um dia, aparece o clima daquele dia quando há destino com coordenadas.
- [ ] Sem internet, a tela mostra "não deu pra buscar a previsão agora" (não quebra).
- [ ] `npm run build`, `npm run lint` e os testes passam.

## Dicas pra implementar
- **Core:** `packages/core/src/clima.ts`. A parte pura (`janelaDeClima`, `interpretarTempo`) tem teste em `apps/web/tests/clima.test.mjs`. O `buscarClima` faz o fetch no Open-Meteo (previsão em `/v1/forecast`, estimativa em `/v1/archive` com as datas do ano anterior).
- **Web:** `src/features/clima/ClimaDaViagem.tsx` (+ `clima.css`), montado na Overview com `destinos`.
- **Mobile:** `app/(tabs)/roteiro.tsx` — chip no cabeçalho do dia, a partir de `destinoDoDia`.
- **Referência:** o jeito de buscar API externa com cache espelha o câmbio (`features/cambio/api.ts`).
