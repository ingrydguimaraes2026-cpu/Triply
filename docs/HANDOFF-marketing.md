# HANDOFF: marketing do Tripwave

*02/11/2026. Sessão de marketing (sem código: código e banco ficam com as sessões de dev).*

## Pronto

| O quê | Onde |
|---|---|
| Estratégia de redes (X, TikTok, Instagram, contato direto com influenciadores), ideias da Ingryd, plano de 30 dias | `docs/marketing/ESTRATEGIA-REDES.md` |
| Nome **Tripwave** (decidido), triagem de domínios e @, tom de voz, rodadas de nomes descartados | `docs/marketing/NOME-E-VOZ.md` |
| Mascote **Norti**, versão "Pin" (bússola em forma de pino de mapa, chapéu de safári, agulha vermelha) | `docs/marketing/MASCOTE.md` |
| 9 poses PNG transparentes, ficha do personagem, vídeo 32 s | `docs/marketing/norti/` |
| Arquivos de animação pro app (web `<mascot-view>`, iOS) | `~/Mascots/Norti/web` e `ios` (fora do repo) |
| Script de triagem de nome (domínio + App Store) | `docs/marketing/checar-nome.py` |
| Página de lista de espera `/espera` (código pronto) | `apps/web/src/pages/ListaDeEspera.tsx` |

**Páginas no claude.ai (privadas, compartilhar pelo menu Share):**
- Caderno de marketing: https://claude.ai/artifact/HzBVv7tXWkKLmAqu4x8nom (fonte: `docs/marketing/tripwave-marketing.html`)
- Quadro de design da Norti: https://claude.ai/artifact/GU32RoWEYJWRyuM8t1hCoP

## Pendente

1. **Dupla registra** tripwave.app e tripwave.com.br, cria `@tripwaveapp` (X) e `@tripwave.app` (Instagram e TikTok), busca "Tripwave" no INPI (classes 9, 39, 42).
2. **Nome da Norti como nome do app?** Em discussão (NOME-E-VOZ.md, rodada 7). Hoje: app Tripwave, mascote Norti.
3. **Sessão de dev:** aplicar a migration `supabase/migrations/20261102130000_lista_espera.sql`; trocar a Agulha pela Norti no app usando `~/Mascots/Norti/web`.
4. **Atualizar o caderno de marketing** na nuvem com a Norti "Pin" (ainda mostra a Agulha antiga).
5. **Próximos conteúdos:** personalidade da Norti com a Ingryd, roteiros de TikTok do réveillon, primeiros posts do X, bio dos perfis.

## Cuidados

- Sessão de marketing **não mexe em código, banco ou migrations**.
- Ao usar conversas privadas que o Victor mandar (ex.: WhatsApp), **usar só as ideias**, sem citar a conversa nos docs.
- Vetos de nome do Victor: nada que lembre "zap", nada de letra dobrada ou grafia inventada.
- Skill Mascot Designer instalada em `~/.claude/skills/mascot-designer`. Sem conta da OpenAI: as poses são desenhadas pelo Claude em vetor e a skill só limpa, anima e gera ficha e vídeo (`poses.mjs --sheet`, depois `make.mjs finish`, dentro de `~/Mascots/Norti`).
