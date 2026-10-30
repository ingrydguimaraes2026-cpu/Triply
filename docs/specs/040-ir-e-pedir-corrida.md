# 040. Ir até o lugar e pedir corrida

**Fase:** 2 · **Tamanho:** P · **Depende de:** 016, 024, 026 · **Status:** Pronto pra testar (web)

## Objetivo
Botão **"Ir"** em lugar, ponto de encontro e endereço da hospedagem: abre o caminho no Google Maps, Waze, Apple Mapas ou Citymapper, ou pede corrida no Uber, Bolt ou FREENOW.

## Por que
- Catálogo C5 (abrir no app de navegação) e D13 (ideia do Bolt, lote 1 de `docs/ideias-de-outros-apps.md`: "na Europa é mais barato que Uber, vale comparar").

## Inclui
- Gaveta "Ir até <lugar>" com o endereço e dois grupos: **Ver o caminho** (4 apps) e **Pedir corrida** (3 apps).
- Com coordenadas (ponto de encontro com mapa) usa o ponto exato; sem, usa "nome, cidade" ou o endereço.
- Uber já abre com o destino. Bolt e FREENOW não aceitam destino no link: ao tocar, o endereço é **copiado** pra colar no app.
- Dica: comparar preço antes (Bolt costuma ser mais barato na Europa).

## Não inclui (fica pra depois)
- Comparar preço das corridas dentro do app (precisaria de API paga).
- Lançar a corrida como gasto automaticamente (use o "+").
- App mobile.

## Dados
- Nenhuma mudança no banco.

## Critérios de aceite
- [x] Links com coordenada e com texto; Uber com destino; Bolt/FREENOW sem (testado: `navegacao.test.mjs`).
- [ ] No celular: Lugares → "Ir" → Waze abre navegando pro lugar.

## Dicas pra implementar
- Core: `packages/core/src/navegacao.ts`. Web: `components/ui/BotaoIr.tsx` (peça pronta, use em qualquer item com endereço).
