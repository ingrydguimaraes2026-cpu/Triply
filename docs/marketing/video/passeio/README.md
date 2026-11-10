# Vídeo do passeio pela Norti

Vídeo de demonstração (1920×1080) da versão web do app (Expo web, `apps/mobile`) dentro de um iPhone em 3D.
Do começo ao fim: login com e-mail e senha → início → abre a Eurotrip → tour da Norti (11 passos) → Viagem,
Roteiro, Reservas, Contas e Fotos. Resultado: `docs/marketing/videos/norti-passeio.mp4`.

## Gravar de novo (um comando)

Com o Expo web no ar na porta 8089 (`.claude/launch.json`, config `mobile`):

```bash
cd docs/marketing/video
npm run passeio
```

Isso roda `gravar.mjs` (Playwright grava o app) e depois `montar.mjs` (HyperFrames monta o iPhone 3D e renderiza).

## Conta e login (login de QA)

- Conta: **`demo@norti.test`**, criada à mão no painel do Supabase (Authentication > Add user, Auto Confirm).
- `passeio/.env.local` (fora do git) precisa de `QA_LOGIN=1` e `SUPABASE_SECRET_KEY=...`. Nunca com `EXPO_PUBLIC_` nem `VITE_`.
- `login-qa.mjs` gera uma sessão nova a cada gravação (`generateLink` + `verifyOtp`), sem ninguém digitar senha.
  Só abre com `QA_LOGIN=1`, fora de produção e da Vercel, e só pra contas `@norti.test` da lista. Nunca cria usuário.
- No vídeo, o login parece o de verdade: o script digita o e-mail e uma **senha de enfeite**. O Playwright segura o
  pedido `grant_type=password` e responde com a sessão do login de QA. A senha nunca sai do PC e o app não muda.
- `node passeio/login-qa.mjs` só confere se a porta abre.

## Dados da conta demo

1. `copiar-eurotrip.sql`: copia a Eurotrip pra conta demo (rodar uma vez no SQL Editor do Supabase).
   Comboio de demonstração: Lívia (a conta demo), Ana Clara, Beto e Juliana. Mais 6 gastos de demonstração.
2. `node passeio/fotos-demo.mjs`: 5 posts com fotos do catálogo (Wikimedia Commons). Créditos em `CREDITOS-FOTOS.md`.

## Detalhes da gravação

- Janela de 593×932 com DPR 3: a moldura de iPhone do app aparece em tamanho real e a tela sai em 1179×2556.
- O tour aparece porque cada gravação começa com o navegador limpo (sem `tripwave.tour.v1`).
- Toques viram um círculo na tela; a rolagem é suave; a caixa "Modo teste" do login (só dev) fica escondida.
- `gravacao/marcas.json` guarda quando cada parte começa; a montagem usa isso pros títulos do lado.
- Com o PC pesado, o Chrome às vezes para de mandar quadros (já saiu vídeo com 20 s de tela parada). O script confere:
  se ficar mais de 3,5 s sem quadro, ou uma rolagem começar sem mexer a tela, grava de novo (até 3 vezes).
  Cada aba só rola depois que o endereço muda (`/roteiro`, `/contas`...), então a aba certa está aberta.
- O render do HyperFrames sai com ~60 MB; a montagem recomprime (CRF 21) pra ~20 MB sem diferença visível.

## Cuidado antes da main

- `docs/marketing/videos/norti-passeio.mp4` (~20 MB) está no repositório pra facilitar ver e baixar. Antes do PR pra
  `main`, decidir se fica (como o `docs/marketing/video/saida/tripwave-app.mp4`, que já está marcado pra sair).
- As fotos dos posts são do Wikimedia Commons: pra divulgação, dar crédito (lista em `CREDITOS-FOTOS.md`).
