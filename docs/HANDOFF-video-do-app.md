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

## Pronto (03/11)
- **Modo demonstração** em `demo/`:
  - `servidor.mjs` responde ao Supabase com sessão falsa e filtros/ordem simples do PostgREST. Escritas viram "ok" sem guardar.
  - `dados.mjs` tem a "Eurotrip" de mentira: 4 pessoas (Você, Ana Clara, Juliana, Beto), Paris/Nice/Roma, catálogo de Paris e Roma com fotos da Wikimedia, quem quer o quê, roteiro de Roma, 2 hospedagens em Paris (duelo), 3 gastos, saldo do euro.
  - `salvar_gasto` guarda na memória, então o "jantar 84" entra na conversa.
  - `descobrir.mjs` lista o que o app pede e tira print (rodar com `MSYS_NO_PATHCONV=1` no Git Bash).
- `gravar.mjs` grava 4 cenas (`explorar` com "Deu match", `duelo`, `contas`, `carimbo`) em `gravacoes/` + `marcas.json`.
- `roteiro.json` + `narrar.py`: 6 falas em inglês (`en-US-AndrewMultilingualNeural`) e títulos em pt-BR.
- `montar.mjs` monta e renderiza `saida/tripwave-app.mp4` (cerca de 29 s, 1080x1920).
  - O Playwright grava 390x844 no canto de um quadro maior: o ffmpeg recorta e amplia.
  - `npx hyperframes lint saida/projeto` deve dar 0 erros. As falas precisam de `id`, senão o vídeo sai mudo.
- `apps/mobile/src/ui/Icone.tsx`: sem o aviso `accessible` no web.

## Refazer o vídeo
```bash
cd docs/marketing/video
node gravar.mjs          # com o Expo web no ar na porta 8089
python narrar.py         # se mudou alguma fala
node montar.mjs
```

## Ideias pra próxima versão
- Música de fundo livre de direitos, baixinha (o vídeo do HPM tem).
- Outra cena: Matches no Roteiro, Lembranças, Fotos.
- Versão em pt-BR da narração (`pt-BR-ThalitaMultilingualNeural`) pra testar contra a de inglês.
