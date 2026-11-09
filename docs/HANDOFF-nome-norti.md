# HANDOFF: nome do app Tripwave → Norti (04/11/2026)

## Pronto
- O nome que o usuário vê agora é **Norti** ("a Norti", no feminino) no app (`apps/mobile`), no site (`apps/web`), no core (textos de compartilhar, PDF, calendário) e no protótipo `docs/marketing/teste/ancora/passaporte.html`.
- Inclui: `<title>` do `index.html`, manifest do PWA (`vite.config.ts`), `expo.name` e textos de permissão no `app.json`, logo, splash, login, `/espera`, convite, avisos, notificação push, plano "Norti+ anual", retrospectiva, rodapés de impressão/livro.
- Comentários de código que diziam "do Tripwave" também viraram "da Norti".

## De propósito ficou igual
- `slug`, `scheme` (`together`), bundle id/package, `@together/core`, chaves `together:*`, caches, `together-viagem.vercel.app`.
- Chaves internas `tripwave.rascunho` e `tripwave.carimbos.<id>` no app: trocar apagaria rascunhos e carimbos já salvos no celular.
- Variáveis `TRIPWAVE_EMAIL`/`TRIPWAVE_SENHA` do `apps/mobile/e2e/explorar.mjs` (só teste interno).
- Nenhum link de domínio novo (norti.app ainda não foi registrado).

## Conferido
- `npx tsc --noEmit` no mobile e no core: ok.
- Web: `npm run build` ok, `npm run lint` sem erros (só avisos antigos), `tests/icones.test.mjs` e `tests/navegacao.test.mjs` passando.
- Navegador: título "Norti", `/espera` e `/login` sem "Tripwave".
- App no celular não foi aberto (só checagem de tipos).

## Próximo passo
- Ícone e nome na loja (App Store / Play) quando houver conta de dev.
- Se o Victor quiser, trocar `slug`/`scheme` depois do registro do domínio (afeta links já mandados: decidir antes).
