# 025. Compartilhar no WhatsApp

**Fase:** 2 · **Tamanho:** P · **Depende de:** — · **Status:** Em andamento

## Objetivo
Um botão **"Compartilhar"** em itens da viagem (gasto, lugar, enquete, ponto de encontro) que manda o link certo pelo WhatsApp (ou qualquer app) e **abre direto naquele item** pra quem recebe. O WhatsApp continua sendo o lugar da conversa; o Together resolve.

## Por que
- **Pesquisa de mercado (out/2026):** o grupo vive no WhatsApp. Em vez de competir com um chat, a gente leva a pessoa de volta pro item certo com um toque.

## Como funciona
- Cada item compartilhável vira uma URL `/viagem/<id>/<aba>?foco=<itemId>`.
- Quem abre o link cai na aba e o item é **rolado até o centro e destacado** por uns segundos.
- O botão usa o compartilhamento nativo do celular (`navigator.share`); no desktop, copia o link e abre o WhatsApp Web já com o texto.
- **O usuário é quem envia** a mensagem no WhatsApp — o app só prepara o texto e o link.

## Inclui
- **Core (`@together/core`):** `compartilhar.ts` — `linkDoItem(base, viagemId, item)` e `textoDoItem(item, link, nomeDaViagem?)` (puros, testados).
- **Web:** `BotaoCompartilhar` (ícone) + `compartilharItem()` + `useFoco`/`useRolarParaFoco`. Botão em: gasto (Financeiro), lugar (Lugares), enquete e ponto de encontro (Overview). As abas de destino leem `?foco=` e destacam o item.
- **Mobile:** botão de compartilhar no ponto de encontro e na enquete (usa o `Share` nativo + o mesmo link).

## Não inclui (fica pra depois)
- Compartilhar "o dia" — depende da Agenda do dia (#6 / spec 029).
- Prévia bonita (Open Graph) do link — precisa de deploy e server; fica pra produção.
- Compartilhar a viagem inteira (já existe pelo convite).

## Dados
- **Sem migration.** Só montagem de link + leitura de query param. O domínio vem de `VITE_APP_URL` (web) com fallback pro `window.location.origin`, e `EXPO_PUBLIC_SITE_URL` (mobile).

## Quem pode o quê
Qualquer membro do comboio compartilha qualquer item que já pode ver. O link não dá acesso novo: quem abre ainda precisa ser do comboio (a RLS continua valendo).

## Critérios de aceite
- [ ] Cada item (gasto, lugar, enquete, ponto) tem um botão de compartilhar.
- [ ] No celular abre o compartilhamento nativo; no desktop copia o link e abre o WhatsApp Web com o texto.
- [ ] Abrir o link cai na aba certa e destaca o item.
- [ ] O link não burla a RLS (quem não é do comboio não vê o item ao abrir).
- [ ] `npm run build`, `npm run lint` e os testes passam.

## Dicas pra implementar
- **Core:** `packages/core/src/compartilhar.ts`; teste `apps/web/tests/compartilhar.test.mjs`.
- **Web:** `src/lib/compartilhar.ts` (base + share), `src/components/ui/BotaoCompartilhar.tsx`, `src/lib/foco.ts` (`useFoco`, `useRolarParaFoco`). CSS `.item-destacado` e `.botao-compartilhar` no `global.css`.
- **Referência:** o compartilhar do convite (`NovaViagem.tsx`, `Comboio.tsx`, mobile `lib/convite.ts`).
