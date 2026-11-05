# HANDOFF: marketing da Norti (antes Tripwave)

*02/11/2026. Sessão de marketing (sem código: código e banco ficam com as sessões de dev).*

## Pronto

| O quê | Onde |
|---|---|
| Estratégia de redes (X, TikTok, Instagram, contato direto com influenciadores), ideias da Ingryd, plano de 30 dias | `docs/marketing/ESTRATEGIA-REDES.md` |
| Nome **Tripwave** (decidido), triagem de domínios e @, tom de voz, rodadas de nomes descartados | `docs/marketing/NOME-E-VOZ.md` |
| Mascote **Norti**, versão "Pin" (bússola em forma de pino de mapa, chapéu de safári, agulha vermelha) | `docs/marketing/MASCOTE.md` |
| 9 poses PNG transparentes, ficha do personagem, vídeo 32 s | `docs/marketing/norti/` |
| Poses recortadas e leves (360 px) pra páginas web | `docs/marketing/norti/web/` |
| Arquivos de animação pro app (web `<mascot-view>`, iOS) e desenhos em SVG | `docs/marketing/norti/app-web`, `app-ios` e `vetor` |
| Bios dos 3 perfis, 8 roteiros de TikTok/Reels do réveillon, 8 primeiros posts do X (rascunho pra Ingryd revisar) | `docs/marketing/CONTEUDO-INICIAL.md` |
| Calendário das 2 primeiras semanas (09 a 22/11): vídeo do dia, 2 posts do X, story, teste de formatos, banco de variações e 14 posts novos (X1 a X14) | `docs/marketing/CALENDARIO-2-SEMANAS.md` |
| Pesquisa: conteúdo sem rosto (slideshow, "2 lados" com a Norti, voz, regras do TikTok, build in public BR, dicas da Apple) | `docs/marketing/PESQUISA-SEM-ROSTO.md` |
| Gerador de carrossel: planilha (`planilha.csv`, 1 linha por slide) → `node docs/marketing/slides/gerar.mjs S1` → PNGs do TikTok (1080×1920) e Instagram (1080×1350) + legenda em `saida/<post>/`. S1 pronto | `docs/marketing/slides/` |
| Análise do S1, fontes de benchmark sem login e próximos passos | `docs/marketing/ANALISE-E-PROXIMOS-PASSOS.md` |
| Exemplos prontos dos 3 formatos novos (F1 "E o pix, Lucas?", F2 "A amiga que deu a ideia", F3 "Esse ano a gente decide cedo") em TikTok e Instagram, com o modelo novo do gerador (tipos `nome`, `frase` e `frase-escura`: frase gigante + Norti grande). Prévia em `previa-tiktok.png` de cada pasta | `docs/marketing/slides/saida/F1`, `F2`, `F3` |
| Script de triagem de nome (domínio + App Store) | `docs/marketing/checar-nome.py` |
| Página de lista de espera `/espera` (código pronto) | `apps/web/src/pages/ListaDeEspera.tsx` |

**Páginas em HTML, só no repo (abrir com duplo clique; não publicar na nuvem do Claude):**
- Calendário das 2 semanas: `docs/marketing/calendario-2-semanas.html`
- Ícones do Tripwave: `docs/marketing/icones-tripwave.html`

**Páginas no claude.ai:** se foram feitas na conta da Humana, apagar de lá e manter só o HTML do repo. As da conta pessoal do Victor podem ficar.
- Caderno de marketing: https://claude.ai/artifact/HzBVv7tXWkKLmAqu4x8nom (fonte: `docs/marketing/tripwave-marketing.html`).
- Quadro de design da Norti: https://claude.ai/artifact/GU32RoWEYJWRyuM8t1hCoP (sem cópia no repo: salvar o HTML em `docs/marketing/` antes de apagar)

## Pendente

0000000. **05/11/2026: VÍDEO PAUSADO** (Victor: "não vamos focar em vídeo, pode esquecer"). Foco: **imagem e carrossel**, com artes bem feitas para o começo do perfil. Os vídeos do passaporte (V1 a V6) e o MP4 do app ficam parados. **Primeiro lote de carrosséis pronto pra aprovar:** C0, C1, C2, C3, C4 e K1 em `slides/saida/` (cada pasta tem `previa.png`). Os modelos de slide são `capa`, `lista`, `tela`, `duas`, `bolhas` (grupo de sempre, balões genéricos) e `versus` (zap x Norti). Faltam o K2 (conferir o limite do Splitwise antes) e o E1 (precisa de número real).

000000. **04/11/2026: o app se chama NORTI** (igual à mascote; decisão do Victor, registrada no topo de `NOME-E-VOZ.md`). Escrever "a Norti" no feminino pro app também. Já trocados: bios e posts (`CONTEUDO-PASSAPORTE.md`, `APRESENTAR-O-APP.md`), carrosséis C0 e C1 (gerados de novo) e AGENTS.md. Docs antigos ainda dizem Tripwave (histórico). **A fazer:** a dupla registra **norti.app** (+ getnorti.com), confere e cria **@nortiapp** (X) e **@norti.app** (Instagram e TikTok) e busca "Norti" no INPI; **sessão de dev** troca o nome que aparece no app e no site (título, ícone, loja, texto "Tripwave" nas telas e no protótipo `teste/ancora/passaporte.html`), sem mexer nos nomes internos "together".

00000. **04/11/2026: C0 ("A história") e C1 ("O que é o Tripwave?") prontos pra aprovar**, 7 slides cada, 1080×1350, em `slides/saida/C0` e `C1` (prévia em `previa.png`). Visual do vídeo do app: fundo de couro com mapa de rota, título com palavra em destaque, celular com tela real e Norti. Gerador: `node docs/marketing/slides/apresentar.mjs C0` (os textos ficam no próprio arquivo). As telas vêm de `docs/marketing/video/gravacoes/telas/`, que não vai pro git: pra gerar de novo, subir o Expo web na 8089 e rodar `node telas.mjs` dentro de `docs/marketing/video` (modo demonstração, sem banco). As páginas do passaporte são do protótipo `teste/ancora/passaporte.html`.

0000. **04/11/2026: posts que APRESENTAM o app inteiro, estilo Loopou** (pedido do Victor): `docs/marketing/APRESENTAR-O-APP.md`, com os padrões da Loopou traduzidos, 12 posts (4 Reels de rosto com versão sem rosto, 4 carrosséis, 2 comparações, série "do 0 ao primeiro grupo") e o passaporte como uma das funções. **Esperando o Victor aprovar** antes de produzir arte. **Decidido 04/11: sem rosto e, por agora, só foto e carrossel** (vídeo depois; a origem virou o carrossel C0). Abertas: de quem é a voz, a relação real da dupla no R1 e os números do E1.

000. **04/11/2026 (o que vale agora): rumo novo do app = Passaporte da galera** (`docs/RUMO.md`, que manda em tudo). O conteúdo novo está em **`docs/marketing/CONTEUDO-PASSAPORTE.md`**: bios novas, 6 vídeos (V1 a V6: mapa acendendo, "Carimbou", contador, "há 1 ano", retrospectiva, luz UV) e 6 posts do X (X1 a X6). Pix e "organizar a viagem" saem do centro. Os docs antigos de marketing ganharam um aviso no topo dizendo o que ainda vale. Os docs de `docs/produto/` (aposta do dinheiro e Passe) estão marcados como superados. **Próximo:** postar X1 a X3; fazer V2 e V6 por código a partir de `teste/ancora/passaporte.html`.

00. **03/11/2026 (mais recente): os 6 posts do teste (F1 a F3b) também foram reprovados pelo Victor** (vazios, só pix). Foco agora no **X**: lições dos posts salvos dele, temas novos e posts X-A a X-D em `docs/marketing/X-APRENDIZADOS.md`. O teste da semana 1 está **suspenso**. Próximo formato de vídeo: cena animada com a Norti e amigos desenhados, com voz, partindo de um vídeo de referência que a dupla escolher.

0. **03/11/2026: decidido testar os 3 formatos (F1, F2, F3), 2 posts de cada, de 09 a 14/11.** Plano, ordem dos dias e regra de quem vence: `docs/marketing/teste/TESTE-SEMANA-1.md`. Os 6 posts estão prontos em `slides/saida/F1`, `F1b`, `F2`, `F2b`, `F3`, `F3b`. Página na nuvem (conta pessoal do Victor): https://claude.ai/artifact/VT4aesHUCoP3YDNBShLq2L (fonte em `docs/marketing/teste/pagina/`; pra atualizar de outra conversa, publicar com essa `url` e `files` mapeando `img/*.jpg`). Resultados vão em `teste/resultados.csv`; no dom 15/11, ler os números numa sessão de marketing. A página do benchmark (`benchmark/index.html`) abre com fotos no Chrome ou no Firefox; no navegador do app, as imagens não carregam.
   **S1 reprovado pelo Victor. Calendário de 09/11 pausado.** O porquê está em `docs/marketing/ANALISE-E-PROXIMOS-PASSOS.md`.
   - ✅ **Benchmark dos grupos A, B e C feito** (03/11): `docs/marketing/benchmark/` tem `posts.csv` (108 posts: TikTok, YouTube Shorts e X), `PADROES.md` (4 padrões + 1 anti-padrão, o que muda no calendário e **3 rascunhos de formato: F1 "E o pix, [NOME]?", F2 "O amigo que...", F3 "Expectativa x 3º dia"**) e `index.html` (prints + rascunhos com a Norti; abrir com duplo clique).
   - Resumo: post que mostra o app tem mediana de 3,5 mil views, contra 220 mil a 1,2 mi dos padrões de humor. Pix é o tema que mais gera compartilhamento. Na Meta, ninguém anuncia "dividir gastos" no Brasil.
   - **Próximo passo:** Victor e Ingryd escolhem entre F1, F2 e F3 → refazer o calendário e o modelo do gerador de slides (frase gigante + Norti grande, sem tela do app).
   - ✅ **Grupo D (X) feito** (03/11): 30 posts da bolha dev na mesma `posts.csv` e 4 padrões no fim do `PADROES.md` (processo copiável, número real, puxar conversa, surfar o assunto do dia). Lido com a conta do Victor no navegador do app, só leitura. Ideia pronta pro 1º post do X: o próprio resultado do benchmark.
   - **Atenção:** o navegador do app do Claude está **logado numa conta do TikTok**. O benchmark só leu páginas, mas confira de quem é a conta e saia dela se for a pessoal.

1. **Dupla registra** tripwave.app e tripwave.com.br, cria `@tripwaveapp` (X) e `@tripwave.app` (Instagram e TikTok), busca "Tripwave" no INPI (classes 9, 39, 42).
2. **Nome da Norti como nome do app?** Em discussão (NOME-E-VOZ.md, rodada 7). Hoje: app Tripwave, mascote Norti.
3. ~~**Sessão de dev:** migration da lista de espera e troca da Agulha pela Norti~~ ✅ 02/11/2026: tabela no ar e testada; Norti no site (`<mascot-view>`, `apps/web/src/components/ui/Norti.tsx`, poses em `apps/web/public/norti`) e no app (`apps/mobile/src/ui/Norti.tsx`, poses em `apps/mobile/assets/norti`). Falta: ícone do app e splash nativo (ainda com o desenho antigo), e versão nativa com `app-ios` se um dia tiver.
4. **Ingryd revisa** `CONTEUDO-INICIAL.md` (piadas e bios). Post "em breve" do X só depois que a lista de espera funcionar.
5. **Personalidade da Norti** com a Ingryd (piadas fixas), antes de gravar a série "tipos de amigo".
6. Opcional: levar o conteúdo inicial pro caderno na nuvem.

## Cuidados

- **Nuvem do Claude (Artifacts), regra do Victor (esclarecida em 03/11/2026):** na conta da **Humana**, **nada** do Tripwave: lá as páginas ficam só como HTML no repo. Na conta **pessoal do Victor** (este PC, `victuribdev@gmail.com`), **pode** publicar Artifacts. Na dúvida sobre qual conta está em uso, pergunte antes de publicar.

- Sessão de marketing **não mexe em código, banco ou migrations**.
- Ao usar conversas privadas que o Victor mandar (ex.: WhatsApp), **usar só as ideias**, sem citar a conversa nos docs.
- Vetos de nome do Victor: nada que lembre "zap", nada de letra dobrada ou grafia inventada.
- Skill Mascot Designer instalada em `~/.claude/skills/mascot-designer`. Sem conta da OpenAI: as poses são desenhadas pelo Claude em vetor e a skill só limpa, anima e gera ficha e vídeo (`poses.mjs --sheet`, depois `make.mjs finish`, dentro de `~/Mascots/Norti`).
