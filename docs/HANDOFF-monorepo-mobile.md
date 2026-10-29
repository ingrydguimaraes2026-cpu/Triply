# HANDOFF — Monorepo + Mobile (Together)

> Pro próximo Claude (ou dev) continuar sem se perder. Atualizado em 2026-10-29.
> Resumo de 1 linha: **transformamos o Triply num monorepo pnpm (web + mobile + core compartilhado) e estamos redesenhando o app mobile do zero, mobile-first, com identidade de marca.** Tudo local, nada no ar ainda.

---

## Novidades — sessão autônoma de 29/10 (Onda 1 do ROADMAP)

Implementadas **sem aplicar migration ainda** (o Victor roda os SQLs quando voltar e a gente testa junto). Cada uma tem spec, migration, funções no `@together/core`, tela no web + mobile e **testes de banco no PGlite** (rodam a migration de verdade, sem tocar no Supabase). Tudo com build + lint + type-check + testes verdes. Commits locais na `monorepo-split`.

| Spec | Feature | Onde |
|---|---|---|
| 019 | Avisos do ADM (recado fixado no topo) | web: `FaixaAvisos` no Overview · mobile: `Avisos` em `viagem/[id]` |
| 020 | Tarefas com responsável | web: `Checklist` no Overview · mobile: `Tarefas` em `viagem/[id]` |
| 021 | Enquetes rápidas | web: `Enquetes` no Overview · mobile: `Enquetes` em `viagem/[id]` |
| 022 | Votos em lugares | web: coração na aba Lugares (mobile: quando houver tela de Lugares) |
| 023 | Clima por dia | **sem migration** · core `clima.ts` (Open-Meteo) · web: cartão Clima no Overview · mobile: chip no Roteiro |
| 024 | Ponto de encontro | web: `PontoDeEncontro` no Overview · mobile: `PontoDeEncontro` em `viagem/[id]` |

**Pra ativar quando voltar (ordem importa):**
1. Aplicar as migrations novas em `supabase/migrations/` (as de `20261029130000` em diante, até `20261029170000`) no projeto `ltygqabtdbphtjscvuit`. Elas são aditivas (só criam tabelas/funções novas). **A 023 (clima) não tem migration** — é tudo API externa (Open-Meteo), nada no banco.
2. Config do painel do Supabase que a spec 018 pede (anonymous sign-in, manual linking) — se ainda não foi feito.
3. Depois de aplicar, **gerar de novo `packages/core/src/database.ts`** (os tipos dessas tabelas foram adicionados à mão; regenerar deixa 100% fiel).
4. Rodar web + mobile e testar pelos critérios de aceite de cada spec.

**Importante sobre os tipos:** como as migrations não foram aplicadas, os tipos das tabelas novas (`avisos`, `tarefas`, `enquetes`, `enquete_opcoes`, `enquete_votos`, `lugar_votos`, `pontos_de_encontro`) e das funções (`criar_enquete`, `votar_enquete`) foram escritos à mão em `packages/core/src/database.ts`, seguindo o formato do gerador. Regenerar depois de aplicar. A 023 não mexe em tipos de banco.

---

## 0. Regras que NÃO podem ser quebradas

1. **NADA vai pro Ar.** Decisão explícita do Victor: nenhum push pro remote, nenhum deploy. Tudo fica local na branch `monorepo-split`. Só sobe quando ele mandar.
2. **Nunca commitar na `main`.** Nem push, nem PR, sem ele pedir.
3. **Nunca mexer em credenciais do usuário.** Victor faz os logins. Não digitar senha dele nem com permissão. Não colar chave/segredo no chat.
4. **`.env` nunca é commitado.** Só `.env.example`. O `apps/mobile/.env` tem a chave Supabase e está no gitignore.
5. **Replicar o PADRÃO da humanav2, não o código.** A divisão web/desktop/mobile é inspirada neles, mas é propriedade intelectual da empresa (risco de contrato humana.ai). Copiar a ideia/arquitetura, nunca arquivos.
6. **Banco:** mudança de schema = migration nova (nunca editar migration antiga), explicar e confirmar antes de aplicar. Só o projeto Supabase `ltygqabtdbphtjscvuit` está no escopo. Nunca tocar no Postgres da empresa.
7. **Rotacionar o Google Client Secret** eventualmente (foi colado no chat numa conversa antiga).

---

## 1. O que é o Together

App de viagem em grupo ("o comboio"). O diferencial que estamos construindo: **carteira em euro por viagem** — cada pessoa liga sua conta Wise/Nomad por e-mail, o app soma o "euro do comboio" e no fim fecha a conta (quem deve pra quem) sem briga. Mascote: **ganso em formação V** ("comboio"), aparece nos momentos humanos; o lado dinheiro é limpo e sério.

Direção de design escolhida: **"Viagem caloroso"** (vibe Airbnb/Hopper). Paleta "Couro e laranja".

---

## 2. Arquitetura (monorepo pnpm)

```
together/ (raiz = repo Triply)
  package.json          # orquestrador: pnpm --filter @together/web dev/build/lint/test
  pnpm-workspace.yaml    # packages: apps/*, packages/*
  apps/
    web/                 # @together/web — o app Vite que já existia (movido via git mv)
    mobile/              # @together/mobile — Expo (React Native)
  packages/
    core/                # @together/core — TS puro, SEM React (lógica compartilhável)
  supabase/  docs/       # ficam na raiz
```

**Fronteira de compartilhamento:** só `packages/core` é compartilhado (TS puro: dinheiro, câmbio, supabase factory, tipos do banco, queries). **UI NÃO é compartilhável** (web usa react-dom, mobile usa react-native). Cada app tem sua própria UI.

### packages/core
- `src/index.ts` reexporta tudo.
- `dinheiro.ts`, `termometro.ts` (movidos da web), `database.ts` (tipos gerados do Supabase), `supabase.ts` (factory `criarClienteSupabase({url, chave, guarda?})`), `dados.ts` (queries: `listarMinhasViagens`, `contarMembros`, `saldoDaCarteira`, `saldoEuroDoComboio`).
- Factory recebe storage + env de cada plataforma (web passa um, mobile passa SecureStore).

### apps/web
- É o Triply original movido pra cá. Build + 176 testes + lint passando.
- Quando for pra produção (NÃO agora): no Vercel, mudar **Root Directory → apps/web**.

### apps/mobile (Expo SDK 58)
- `expo-router` (rotas por arquivo). `app/_layout.tsx` = raiz (carrega fontes, porteiro de login, moldura). `app/login.tsx`. `app/(tabs)/` = abas (index=Viagem, financeiro, comboio).
- **NativeWind** (Tailwind pro RN). `tailwind.config.js` tem a paleta e as fontes. `darkMode: 'class'` (senão o web quebra com erro "dark mode is type 'media'").
- Fontes de marca: **Fraunces** (display/serifada) + **Plus Jakarta Sans** (corpo), via `@expo-google-fonts/*`.
- `src/lib/supabase.ts` — cria o client; storage é `undefined` no web e SecureStore no celular.
- `src/lib/sessao.ts` — hook `useSessao` (getSession + onAuthStateChange).
- `src/dados/useResumoViagem.ts` — busca viagem[0], membros, e se moeda=EUR busca saldos.
- `src/ui/Moldura.tsx` — só no web: enquadra o app numa coluna de largura de celular (max-w-440px) pra não esticar feito formulário.
- `src/comboio/Ganso.tsx` — mascote placeholder (emoji 🪿 por enquanto).

---

## 3. Como rodar e TESTAR no navegador (importante)

O Victor pediu pra testar de verdade no navegador. Dá pra rodar o app mobile como web (react-native-web):

```bash
cd apps/mobile
npx expo start --web --port 8091 --clear
```

Abre em `http://localhost:8091`. Pra ver no formato de celular: no Chrome, redimensionar a aba pra ~430x900 (tem a Moldura que já centraliza).

**Automação de browser (Claude-in-Chrome):** dá pra tirar screenshot e iterar no design ao vivo. Carregar as tools via ToolSearch primeiro (ver instruções do claude-in-chrome). A aba de login a gente conseguiu ver e screenshotar.

**⚠️ A HOME só aparece logado.** Eu (Claude) NÃO posso digitar a senha do Victor. Então pra ver/iterar a home: **o Victor loga uma vez na aba do Chrome dele**, a sessão fica salva, e aí dá pra screenshotar a home e refinar. Login foi verificado visualmente; **home ainda não foi vista rodando**.

Rodar os testes/build da web:
```bash
pnpm --filter @together/web build   # + test + lint, tudo verde
pnpm --filter @together/core type-check
pnpm --filter @together/mobile type-check
```

---

## 4. Pegadinhas já resolvidas (não repetir)

- **pnpm não achata node_modules** como npm. Deps transitivas quebram. Ex: `@types/geojson` precisou virar devDep explícita da web; `react-native-css-interop` precisou ser dep direta do mobile (NativeWind injeta `react-native-css-interop/jsx-runtime`).
- **core sem typescript** → type-check falhava. Adicionado `typescript` como devDep do core.
- **tsc "Cannot find module '../global.css'"** → `declare module "*.css";` em `nativewind-env.d.ts`.
- **NativeWind darkMode erro no web** → `darkMode: 'class'` no tailwind.config.js.
- **ImageBackground colapsa no web** (empurra título pro topo) → usar `StyleSheet.absoluteFillObject` pra foto+gradiente e um `<View flex-1 justify-end>` separado pro conteúdo. (Ver `app/login.tsx`.)
- **Portas presas** depois de matar o expo → trocar de porta (usamos 8099→8097→8095→8093→8091).
- **Extensão do Chrome desconecta** se a conta do Google não bate — reconectar.

---

## 5. Estado do design (contexto quente)

Victor **odiou** a primeira versão ("TA MUITO SIMPLES", "eu ODIEI"). A última iteração (`9ccaf92`) subiu o nível:
- Login: foto de viagem (Veneza, Unsplash temporário) no topo, wordmark "Together" na serifada sobre gradiente quente, campos com ícone, botão laranja com sombra.
- Home: hero com gradiente, avatares com iniciais, "Meu euro" em display grande, pill "Euro do comboio", cards de atalho com ícones lucide, FAB "+", callout do ganso.

**Pendente de design:** a HOME nunca foi vista rodando (precisa do login do Victor). Próximo passo natural era: Victor logar → screenshotar home → refinar juntos. Pesquisar layouts de iPhone/Android no Twitter/Mobbin pra referência também estava na mesa.

---

## 6. Próximos passos (o que falta no produto)

- [ ] **Ver a home rodando** (Victor loga, Claude screenshota) e refinar o design.
- [ ] **Câmbio real na home** (hoje mostra euro; falta cotação pra converter).
- [ ] **Telas reais de Financeiro e Comboio** (hoje são placeholders).
- [ ] **Lançar gasto** (o botão "+" não faz nada ainda).
- [ ] **Login com Google nativo** no mobile.
- [ ] **Cadastro / esqueci senha** no mobile.
- [ ] Trocar foto/mascote temporários pelos assets de marca reais.

## 7. Quando for pra produção (NÃO agora — só quando o Victor mandar)

1. Vercel: Root Directory → `apps/web`.
2. `git push` da branch `monorepo-split` (ou merge pro fluxo dele).
3. Conferir env vars no Vercel (as `VITE_*`).

---

## 8. Specs relacionadas
- `docs/specs/015-*` — carteira de euro por e-mail (Wise/Nomad). Já integrada.
- `docs/specs/017-arquitetura-monorepo-e-mobile.md` — documenta as decisões de monorepo/core/mobile/identidade.

## 9. Branch e commits
Branch: **`monorepo-split`** (saiu de `dev-victurib`). Último commit: `9ccaf92`. Árvore limpa. Ver `git log --oneline` pra sequência (do `478d392` spec 015 até o redesign).

---

## 10. Atualização 2026-10-29 (tarde): redesign "Malinha" aplicado

Fonte: export do design "Together App" (13 telas + mascote Malinha). Aplicado no `apps/mobile`:

- **Mascote Malinha** (`src/ui/Malinha.tsx`): SVG + animação (parada, feliz, dormindo, pensando). Substituiu o ganso.
- **Paleta nova** em `theme.ts` + `tailwind.config.js` (fundo #FBF3E6, couro #7B542F, caramelo #B97A22…).
- **Peças** em `src/ui/pecas.tsx` (Botao, Cartao, Avatar, Campo, Carregando, ErroNaTela…).
- **Telas**: abertura (`Splash`), boas-vindas (3 slides), login/criar conta/esqueci senha, abas Viagens · Roteiro · Contas · Fotos · Perfil, detalhe `viagem/[id]`, `transportes`, `nova-viagem` (3 etapas + comemoração), `novo-gasto`.
- **Dados reais** via `@together/core` (novas consultas em `dados.ts`). `acertos.ts` (divisão/saldos) saiu da web e foi pro core; web importa de `@together/core`. Web: 176 testes, lint e build verdes.
- Viagem "atual" das abas: `src/dados/viagemAtual.tsx` (próxima viagem; muda ao abrir outra na home).

Limites conhecidos: Google no app = "em breve"; capas são Unsplash fixas por viagem; postar foto e gasto em outra moeda ficam no site; convite gera link `EXPO_PUBLIC_SITE_URL/convite/<código>`.
Visto rodando no navegador: abertura, boas-vindas e login. **Telas logadas ainda não vistas** (precisa do Victor logar em http://localhost:8089).
