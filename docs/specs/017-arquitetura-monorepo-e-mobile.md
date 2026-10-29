# 017 — Arquitetura: monorepo, core compartilhado e app mobile

**Fase:** 3 · **Tamanho:** G · **Depende de:** todo o app atual (apps/web)

## Por que

O Together deixa de ser só a ferramenta da eurotrip e passa a ser tratado como produto
(ver `Together — Estratégia de Produto`). O produto é **mobile-first**: o usuário de eurotrip
vive no celular. Para desenvolver web e mobile sem duplicar a lógica, adotamos o mesmo molde
que a humana v2 usa: **monorepo com um app por plataforma + pacotes compartilhados**.

## O que entra

Estrutura (pnpm workspaces):

```
together/
  apps/
    web/      PWA atual (React + Vite)        → @together/web
    mobile/   app novo (Expo / React Native)  → @together/mobile   (mobile-first)
  packages/
    core/     lógica compartilhada, TS puro   → @together/core
  supabase/   banco + Edge Functions (infra, raiz)
  docs/       specs e documentação (raiz)
```

Regra de ouro (a que mais erram): **web usa `react-dom` (`<div>`), mobile usa
`react-native` (`<View>`).** Então:

- **Compartilhável** → `packages/core`: tipos, contas de dinheiro, câmbio/IOF, regras de
  domínio, parsing. Sem React, sem react-dom, sem react-native.
- **Não compartilhável** → cada app desenha a própria UI. Nada de componente cruzando a fronteira.

Desktop (Electron) e website (marketing) ficam **adiados** — não há necessidade real agora.
Quando existir, desktop segue o padrão humana v2 (copia a UI da web com *drift check*,
não importa os pacotes pesados).

## Identidade (começa aqui, antes das telas)

Direção escolhida: **híbrido comboio**.

- **Personagem** (o comboio) só nos momentos humanos: onboarding, estados vazios, acerto final,
  fotos/memórias, voz dos avisos. Forma de referência: **ganso em formação V** — viaja em bando,
  reveza quem vai na frente, ninguém aguenta o vento sozinho (é a tese do rateio).
- **Sistema limpo** (sem personagem) em tudo que é dinheiro: saldo, divisão, câmbio, IOF.
- Paleta "Couro e laranja" e tipografia (Fraunces + Plus Jakarta) reaproveitadas.
- Voz brasileira: comboio, rachar, acerto, "quem deve pra quem". Zero jargão gringo traduzido.

## Direção do redesign mobile (dinheiro no centro)

A home da viagem mostra, num segundo: quanto o grupo gastou, quanto cada um deve, e se o câmbio
está bom hoje. Real e euro lado a lado. Botão "+" (lançar gasto) sempre à mão. Roteiro e
hospedagem ficam um toque abaixo.

## O que não entra (por enquanto)

- Desktop, website.
- Carteira via Gmail no mobile público (escopo restrito do Google — ver spec 015).
- Reescrever a web: ela continua funcionando igual; só ganhou o endereço `apps/web`.
- Compartilhar componentes entre web e mobile.

## Como saber que ficou pronto (fases)

1. **Monorepo** — `apps/web` roda igual de antes (`pnpm build/test/lint` verdes). ✅ feito
2. **core** — `@together/core` com dinheiro + câmbio; web importa de lá; testes verdes. ✅ feito
3. **mobile** — `apps/mobile` (Expo) existe, importa `@together/core`, `tsc` verde, e a home
   "dinheiro no centro" renderiza com a identidade comboio. Rodar em device/simulador fica para
   quando houver Expo Go/simulador à mão.

## Observações de infra (quando formos publicar — não agora)

- Vercel: Root Directory → `apps/web`, build via pnpm.
- Nada vai pro ar neste trabalho; tudo local, na branch `monorepo-split`.
