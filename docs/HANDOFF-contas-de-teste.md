# HANDOFF — Contas de teste (QA/dev) e roteiro Playwright

Atualizado: 05/11/2026.

## O que está pronto
- **Botões de teste no login do app** (`apps/mobile/app/login.tsx`), só em modo dev
  (`__DEV__` ou `EXPO_PUBLIC_MODO_TESTE=1`; nunca no build de loja):
  - **Nova conta de teste**: cria um usuário de verdade no Supabase com e-mail
    `teste+<AAAAMMDD-HHMMSS>@teste.norti.app` e senha aleatória, e já entra.
  - **Voltar pra última conta de teste**: entra de novo na última criada neste aparelho.
  - As contas ficam só no aparelho/navegador (SecureStore / localStorage, chave `together.contas-de-teste`).
  - Lógica em `apps/mobile/src/lib/contasDeTeste.ts`.
- **Conta + viagem de teste pra roteiros**: `node apps/mobile/e2e/conta-de-teste.mjs` cria conta e uma
  viagem "Rio de teste" (Rio de Janeiro, daqui a 30 dias) e guarda e-mail/senha/viagemId em
  `apps/mobile/e2e/.contas-teste.local.json` (ignorado pelo git; não imprime a senha).
- **Roteiro `apps/mobile/e2e/explorar.mjs`**: sem variáveis, usa a última conta do arquivo acima.
  Ajustado à tela atual (o botão "Explorar" saiu da viagem: abre por `/explorar?viagem=<id>&roteiro=1`;
  o deslize é só por gesto: arrasta o cartão). **Rodou em 05/11: 7/7 PASSOU.**

## Configuração do Supabase (feita pelo Victor em 05/11)
- "Confirm email" **desligado** (Authentication > Sign In / Providers > Email). Vale pra todo cadastro,
  inclusive produção. Se religar, os botões de teste avisam "o Supabase pediu confirmação de e-mail".

## Como rodar
```bash
pnpm -C Triply --filter @together/mobile exec expo start --web --port 8089   # ou config "mobile" do launch.json
node apps/mobile/e2e/conta-de-teste.mjs
PLAYWRIGHT=<caminho>/node_modules/playwright/index.mjs node apps/mobile/e2e/explorar.mjs
```
Playwright não está no monorepo: aponte `PLAYWRIGHT` pra um já instalado
(ex.: `docs/marketing/video/node_modules/playwright/index.mjs`). Usa o Chrome do sistema.

iPhone (Expo Go, mesmo Wi-Fi): abrir `exp://<IP-do-PC>:8089` (QR no terminal do `expo start`).

## Cuidados / próximos passos
- Antes de lançar na loja: decidir se religa "Confirm email" (aí os botões de teste param; trocar por
  uma Edge Function que cria usuário confirmado só com chave secreta).
- Contas `teste+…@teste.norti.app` se acumulam no banco: dá pra apagar por SQL quando quiser
  (`auth.users where email like 'teste+%@teste.norti.app'`), pedindo confirmação antes.
