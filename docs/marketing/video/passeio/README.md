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

- **Quadro a quadro, 60 fps.** Gravar em tempo real dava ~12 quadros por segundo e o vídeo pulava. Agora a página
  roda com um relógio de mentira: `Date.now`, `performance.now`, `setTimeout`, `setInterval`,
  `requestAnimationFrame` e as animações de CSS só andam quando o script manda. Ele anda 1/60 s, fotografa a tela
  do iPhone e repete. Sai liso por mais pesado que o PC esteja (leva ~7 min pra gravar ~100 s).
- Janela de 593×932 com DPR 2: a moldura de iPhone do app aparece em tamanho real e a tela sai em 786×1704.
- O tour aparece porque cada gravação começa com o navegador limpo (sem `tripwave.tour.v1`).
- Toques viram um círculo na tela; a rolagem é suave; a caixa "Modo teste" do login (só dev) fica escondida.
- Cada aba só rola depois que o endereço muda (`/roteiro`, `/contas`...), então a aba certa está aberta.
- `gravacao/marcas.json` guarda quando cada parte começa e a hora de cada toque e tecla.
- Testar só um pedaço: `node passeio/gravar.mjs --ate=tour-1` (grava até essa marca em `gravacao/teste.mp4`).

## Trilha

`trilha.py` faz a música na mão (sem música de terceiros, sem direito autoral): pop leve de viagem em Ré maior,
~111 bpm. Cada instrumento entra numa parte do vídeo (arpejo no login, baixo no início, bateria no tour, tema de
marimba nas 5 partes), e o andamento é ajustado pro acorde final cair quando o cartão da Norti aparece. Por cima:
som leve de toque, de tecla, um "plim" a cada fala do tour e um sopro na troca de parte. O `montar.mjs` chama sozinho.

## Montagem

- HyperFrames + GSAP, 1920×1080 a 60 fps, com a trilha. O render sai pesado; a montagem recomprime (CRF 19).

## Cuidado antes da main

- `docs/marketing/videos/norti-passeio.mp4` (~29 MB, 60 fps com som) está no repositório pra facilitar ver e baixar. Antes do PR pra
  `main`, decidir se fica (como o `docs/marketing/video/saida/tripwave-app.mp4`, que já está marcado pra sair).
- As fotos dos posts são do Wikimedia Commons: pra divulgação, dar crédito (lista em `CREDITOS-FOTOS.md`).
