# HANDOFF: passaporte da galera (Fase 0), 08/11/2026

## Pronto (commits locais na `monorepo-split`, sem push)
- `92a23e1` tirou da fila o teste das 3 telas (0.1). A 118 não espera mais validação.
- `aef3668` + `d2bd510` **0.3 carimbo de lugar (118a)**. Banco aplicado: `20261108120000_carimbos.sql` (tabela `carimbos`, 1 por destino, RLS testada com rollback: membro libera, só ADM apaga, convidado anônimo não libera, quem é de fora não vê). Core `packages/core/src/carimbos.ts` + teste. Telas: `apps/web/src/features/carimbos/`, `apps/mobile/src/ui/viagem/CarimbosDaViagem.tsx`. Cai pela localização (app aberto, nas datas, 15 km), por foto com GPS no post, ou "a gente esteve aqui". App ganhou `expo-location` (precisa de build de desenvolvimento novo).
- `6638b5b` **nome do produto agora é Norti** (antes Tripwave). Ficaram de propósito: chaves `tripwave.*` no celular, `TRIPWAVE_*` do e2e, nomes de arquivos, migrations antigas. **Domínio e @ da Norti: decisão do Victor** (ver nota em `docs/marketing/NOME-E-VOZ.md`).
- `017e894` **0.5 "Cheguei" vira carimbo (120c)**: "Cheguei" no plano do dia e "Cheguei na casa" liberam o carimbo do destino de hoje.
- `db6b201` **0.6 mapa da galera no Início (118b)**: core `mapa-da-galera.ts` + teste; app desenha com d3-geo + world-atlas + react-native-svg; site em Minhas viagens. Sem banco novo.

## Não conferido
- Nenhuma tela logada foi aberta (sem conta de teste aqui; criar conta mandaria dados pro Supabase de produção). Conferir em 360px e no app: carimbos na viagem e no Hoje, "Cheguei na casa", mapa no Início, postar carimbo e postar mapa.
- `icones.test.mjs` já falhava antes (emojis antigos, inclusive os `❄` dos congelados).

## Próximo passo exato
**0.7 · Retrospectiva que monta sozinha (spec 118c)**: moldura por data (Réveillon se passa por 31/12, Carnaval, São João, feriado), carimbos da viagem na retrospectiva, 3 fotos mais curtidas, gasto por pessoa (só do grupo), legenda pronta (IA invisível, editável), caderno PDF com carimbos na capa (livro 106), aviso "a retrospectiva de X está pronta", "Bora a próxima?". Base: `apps/mobile/app/retrospectiva.tsx`, `apps/web/src/pages/viagem/Retrospectiva.tsx`, `packages/core/src/retrospectiva.ts`, `pdf-da-viagem.ts`.
Depois: 0.8 convite web leve (`/v/<código>`), 0.9 viagens antigas e rolê (118f).

## Cuidados
- Ler `AGENTS.md`, `docs/RUMO.md`, spec 118.
- Aplicar migration sem MCP: `npx --no-install supabase db query --remote=ltygqabtdbphtjscvuit --yes -f arquivo.sql` (CLI v3 local, não pede senha) e registrar em `supabase_migrations.schema_migrations`.
- Victor autorizou seguir a fila sozinho (aplicar migration, commit local, próximo item). Push só se ele pedir.
- Responder em pt-BR.
