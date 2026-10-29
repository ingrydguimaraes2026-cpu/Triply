# @together/mobile

App mobile do Together (Expo / React Native), parte do monorepo. Usa a lógica
compartilhada de `@together/core` (dinheiro, câmbio, client do Supabase).

## Rodar

1. Da **raiz** do monorepo: `pnpm install`.
2. Copie `apps/mobile/.env.example` para `apps/mobile/.env` e preencha (peça os valores ao Victor).
3. Alinhe as versões ao SDK (uma vez): `cd apps/mobile && npx expo install --fix`.
4. Inicie: `pnpm --filter @together/mobile start` (ou `cd apps/mobile && pnpm start`).
5. Abra no **Expo Go** (celular) lendo o QR, ou num emulador Android / simulador iOS.

> Se o Metro reclamar de módulo não encontrado (pnpm é estrito), crie um `.npmrc`
> na raiz com `node-linker=hoisted` e rode `pnpm install` de novo.

## Estrutura

- `app/` — rotas (expo-router). `(tabs)/` tem Viagem (home), Financeiro e Comboio.
- `src/comboio/Ganso.tsx` — mascote do comboio (placeholder).
- `src/lib/supabase.ts` — client do Supabase (cofre seguro do aparelho).
- `theme.ts` — paleta "Couro e laranja", a mesma da web.

## Verificar

`pnpm --filter @together/mobile type-check` (TS sem erros).
