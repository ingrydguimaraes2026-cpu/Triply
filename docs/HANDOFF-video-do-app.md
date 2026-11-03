# HANDOFF: vídeo do app em moldura de iPhone (marketing)

Data: 03/11/2026. Branch `monorepo-split`. Pasta: `docs/marketing/video/`.

## O pedido do Victor
Um vídeo curto, em pé (1080x1920, TikTok/Reels/Shorts), mostrando o Tripwave de verdade dentro de um iPhone.
Precisa de animações caprichadas e narração. O Victor quer **fazer tudo sem precisar dele**: nada de pedir pra ele entrar na conta.
Precisa de um comboio com várias pessoas e conteúdo bonito (dá pra copiar da Eurotrip).

## Decisões
- **Montagem:** o vídeo é feito com código, com HyperFrames 0.9.9 + GSAP 3.14.2 (HTML renderizado em MP4 com o ffmpeg do PC). Não tem IA gerando imagem e não tem custo.
- **Narração:** em **inglês**, voz masculina `en-US-AndrewMultilingualNeural` (edge-tts, grátis). O Victor quis "estilo HPM".
  - O vídeo do HPM (`humanav2/apps/web/public/hpm/how-it-works.mp4`) tem narrador masculino (tom médio de 130 Hz) com música por baixo.
  - Os títulos na tela ficam em **português** e servem de legenda pro público do Brasil.
- **Sem contas de teste nem login:** o Claude não pode criar conta nem entrar com senha (o login passa pelo Supabase de produção).
  - **Saída: modo demonstração na gravação.** O Playwright intercepta (`page.route`) tudo que vai pra `https://ltygqabtdbphtjscvuit.supabase.co/**` e responde com dados prontos (fixtures).
  - Também põe uma sessão falsa no `localStorage` antes do app abrir. Ela não vale em lugar nenhum, porque nenhuma chamada sai do PC.
  - Resultado: nada vai pro banco, e a gente controla cada cena.

## Pronto
- `roteiro.json`: 5 cenas (gancho, explorar, contas, carimbo, fim), cada uma com a fala em inglês e o título em pt-BR.
- `narrar.py`: gera `audio/<cena>.mp3` e `audio/duracoes.json`. Já rodado: cerca de 21 s de fala.
- `montar.mjs`: monta `saida/projeto/index.html` e renderiza `saida/tripwave-app.mp4`.
  - Inclui: iPhone desenhado (moldura, ilha, barra das 9:41), mensagens do grupo pipocando com a Norti assustada no gancho, o celular entrando e saindo, a Norti apontando, e no fim a marca com confete e a Norti comemorando.
  - Usa as fontes do app (Fraunces, Plus Jakarta Sans) e as Nortis de `docs/marketing/norti/recorte/`.
  - **Ainda não foi renderizado** (falta a gravação).
- `gravar.mjs`: grava as cenas com Playwright (390x844, DPR 2) em `gravacoes/<cena>.webm` + `gravacoes/marcas.json` (o segundo em que a ação começa).
  - Usa a viagem "Lisboa" e um perfil logado: o modo `entrar` foi **abandonado** e deve ser trocado pelo modo demonstração.
- `node_modules` instalado na pasta (npm, fora do pnpm). O Chromium do Playwright 1.64 também.
- Conserto no app: `apps/mobile/src/ui/Icone.tsx` não passa mais `accessible` pro SVG no web. Era o aviso vermelho do modo dev que ia aparecer na gravação.

## Próximo passo exato
1. Ler o conteúdo da Eurotrip (`f5763559-f032-4ed3-9195-fd84b11088b4`) com SQL só de leitura: destinos, lugares, catálogo com foto, roteiros, gastos, hospedagens.
   - Montar fixtures em `docs/marketing/video/demo/`: comboio de 4 (Você, Ana, Ju, Beto), viagem com datas futuras, 2 hospedagens votadas (duelo), lugares com "quero" de 2 pessoas (o swipe fecha o match → "Deu match!"), gastos variados.
2. Em `gravar.mjs`, trocar o perfil logado por:
   - `context.route('https://ltygqabtdbphtjscvuit.supabase.co/**', responder)`;
   - `addInitScript` com a sessão falsa (chave `sb-ltygqabtdbphtjscvuit-auth-token`).
   - Primeiro logar as URLs pedidas (responder `[]` por padrão) e ir preenchendo as que as cenas usam: auth/user, viagens + membros, `carregarAbaViagem`, `rpc/matches_da_viagem`, explorar, gastos, cotação.
   - As fotos do catálogo (Wikimedia) podem continuar vindo da internet.
3. Cenas novas pro roteiro: "Deu match no comboio" (o swipe que fecha o match) e o duelo de hospedagem com a barra enchendo. Ajustar as falas e rodar `python narrar.py`.
4. `node gravar.mjs` → `node montar.mjs` → assistir `saida/tripwave-app.mp4` (conferir com `npx hyperframes snapshot` ou quadros com ffmpeg).
5. Opcional: música de fundo livre de direitos, baixinha, como no vídeo do HPM.

## Cuidados
- O servidor Expo web tem que estar no ar na porta 8089 (`preview_start` "mobile" ou `npx expo start --web --port 8089` em `apps/mobile`).
- Não gravar com a conta de ninguém e não escrever no banco.
- `gravacoes/`, `audio/`, `saida/` e `node_modules/` estão no `.gitignore` da pasta.
- Exportar `HYPERFRAMES_NO_TELEMETRY=1 DO_NOT_TRACK=1 HYPERFRAMES_SKIP_SKILLS=1` ao usar o CLI do HyperFrames.
