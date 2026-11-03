# HANDOFF: marketing do Tripwave

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
| Script de triagem de nome (domínio + App Store) | `docs/marketing/checar-nome.py` |
| Página de lista de espera `/espera` (código pronto) | `apps/web/src/pages/ListaDeEspera.tsx` |

**Páginas em HTML, só no repo (abrir com duplo clique; não publicar na nuvem do Claude):**
- Calendário das 2 semanas: `docs/marketing/calendario-2-semanas.html`
- Ícones do Tripwave: `docs/marketing/icones-tripwave.html`

**Páginas antigas no claude.ai (feitas na conta do outro PC; apagar de lá e manter só o HTML do repo):**
- Caderno de marketing: https://claude.ai/artifact/HzBVv7tXWkKLmAqu4x8nom (fonte: `docs/marketing/tripwave-marketing.html`).
- Quadro de design da Norti: https://claude.ai/artifact/GU32RoWEYJWRyuM8t1hCoP (sem cópia no repo: salvar o HTML em `docs/marketing/` antes de apagar)

## Pendente

1. **Dupla registra** tripwave.app e tripwave.com.br, cria `@tripwaveapp` (X) e `@tripwave.app` (Instagram e TikTok), busca "Tripwave" no INPI (classes 9, 39, 42).
2. **Nome da Norti como nome do app?** Em discussão (NOME-E-VOZ.md, rodada 7). Hoje: app Tripwave, mascote Norti.
3. ~~**Sessão de dev:** migration da lista de espera e troca da Agulha pela Norti~~ ✅ 02/11/2026: tabela no ar e testada; Norti no site (`<mascot-view>`, `apps/web/src/components/ui/Norti.tsx`, poses em `apps/web/public/norti`) e no app (`apps/mobile/src/ui/Norti.tsx`, poses em `apps/mobile/assets/norti`). Falta: ícone do app e splash nativo (ainda com o desenho antigo), e versão nativa com `app-ios` se um dia tiver.
4. **Ingryd revisa** `CONTEUDO-INICIAL.md` (piadas e bios). Post "em breve" do X só depois que a lista de espera funcionar.
5. **Personalidade da Norti** com a Ingryd (piadas fixas), antes de gravar a série "tipos de amigo".
6. Opcional: levar o conteúdo inicial pro caderno na nuvem.

## Cuidados

- **Nada do Tripwave na nuvem do Claude** (regra do Victor, 02/11/2026): a conta usada é da Humana. Páginas ficam só como HTML no repo, sem publicar Artifact.

- Sessão de marketing **não mexe em código, banco ou migrations**.
- Ao usar conversas privadas que o Victor mandar (ex.: WhatsApp), **usar só as ideias**, sem citar a conversa nos docs.
- Vetos de nome do Victor: nada que lembre "zap", nada de letra dobrada ou grafia inventada.
- Skill Mascot Designer instalada em `~/.claude/skills/mascot-designer`. Sem conta da OpenAI: as poses são desenhadas pelo Claude em vetor e a skill só limpa, anima e gera ficha e vídeo (`poses.mjs --sheet`, depois `make.mjs finish`, dentro de `~/Mascots/Norti`).
