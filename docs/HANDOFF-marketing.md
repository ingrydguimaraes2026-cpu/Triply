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
| Script de triagem de nome (domínio + App Store) | `docs/marketing/checar-nome.py` |
| Página de lista de espera `/espera` (código pronto) | `apps/web/src/pages/ListaDeEspera.tsx` |

**Páginas no claude.ai (privadas, compartilhar pelo menu Share):**
- Caderno de marketing: https://claude.ai/artifact/HzBVv7tXWkKLmAqu4x8nom (fonte: `docs/marketing/tripwave-marketing.html`). Já mostra a Norti "Pin" (topo, ícone e galeria das 9 poses). Pra republicar, mandar junto as imagens: `files` com `norti/norti-<pose>.png` → `docs/marketing/norti/web/norti-<pose>.png`.
- Quadro de design da Norti: https://claude.ai/artifact/GU32RoWEYJWRyuM8t1hCoP

## Pendente

1. **Dupla registra** tripwave.app e tripwave.com.br, cria `@tripwaveapp` (X) e `@tripwave.app` (Instagram e TikTok), busca "Tripwave" no INPI (classes 9, 39, 42).
2. **Nome da Norti como nome do app?** Em discussão (NOME-E-VOZ.md, rodada 7). Hoje: app Tripwave, mascote Norti.
3. **Sessão de dev:** aplicar a migration `supabase/migrations/20261102130000_lista_espera.sql`; trocar a Agulha pela Norti no app usando `docs/marketing/norti/app-web` (e `app-ios`).
4. **Ingryd revisa** `CONTEUDO-INICIAL.md` (piadas e bios). Post "em breve" do X só depois que a lista de espera funcionar.
5. **Personalidade da Norti** com a Ingryd (piadas fixas), antes de gravar a série "tipos de amigo".
6. Opcional: levar o conteúdo inicial pro caderno na nuvem.

## Cuidados

- Sessão de marketing **não mexe em código, banco ou migrations**.
- Ao usar conversas privadas que o Victor mandar (ex.: WhatsApp), **usar só as ideias**, sem citar a conversa nos docs.
- Vetos de nome do Victor: nada que lembre "zap", nada de letra dobrada ou grafia inventada.
- Skill Mascot Designer instalada em `~/.claude/skills/mascot-designer`. Sem conta da OpenAI: as poses são desenhadas pelo Claude em vetor e a skill só limpa, anima e gera ficha e vídeo (`poses.mjs --sheet`, depois `make.mjs finish`, dentro de `~/Mascots/Norti`).
