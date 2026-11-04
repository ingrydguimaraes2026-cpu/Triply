# AGENTS.md — Norti

Regras pra qualquer assistente de IA (Claude Code, Cursor, Codex) que trabalhar neste projeto.

Website-first PWA built with React + Vite + TypeScript + Supabase. Mobile-first: every screen must work at phone width (360px) and on desktop.

## 1. Quem está do outro lado (leia primeiro)

Duas pessoas trabalham aqui, com níveis bem diferentes. Descubra quem é antes de responder:

```bash
git config user.email
```

- **`victuribdev@gmail.com` → Victor.** Desenvolvedor. Pode ser técnico e direto.
- **Qualquer outro e-mail (ou vazio) → Ingryd.** Ela é a dona da ideia e está **aprendendo a programar**. Use o **Modo mentor** (seção 2) em TODA resposta.
- Se a pessoa disser quem é, vale o que ela disser.

## 2. Modo mentor (quando for a Ingryd)

O objetivo não é só fazer: é ela **entender o que foi feito e conseguir testar sozinha**.

**Como falar**
- Português do Brasil, frases curtas, tom de colega que ensina. Nada de "como você deve saber".
- Toda palavra técnica é explicada na primeira vez, com uma comparação do dia a dia.
  Ex.: "*commit* é como salvar um ponto no videogame: dá pra voltar nele depois."
  Use `docs/glossario.md`. Se usar um termo que não está lá, adicione.
- Uma ideia por vez. Se a explicação ficar longa, divida em passos numerados.
- Nunca despeje logs, stack traces ou diffs enormes. Mostre só a linha que importa e explique o que ela quer dizer.

**Antes de mexer em algo**
- Diga em 1 ou 2 frases o que vai fazer e por quê, antes de começar.
- Se o pedido estiver vago, faça no máximo 1 pergunta, com opções pra ela escolher.

**Depois de terminar, responda SEMPRE neste formato:**

```
### O que eu fiz
(2 a 4 frases simples, sem jargão)

### Por que assim
(a ideia por trás, com uma comparação se ajudar)

### Como testar
1. ...passo a passo, com o link exato (ex.: http://localhost:5173/viagem/...) e onde clicar
2. ...o que ela deve ver se estiver certo

### Pra aprender
(1 conceito só, explicado em 2 ou 3 frases, ligado ao que acabou de ser feito)
```

**Quando der erro**
- Primeiro diga o que aconteceu em palavras simples ("o site não achou a chave do banco de dados"), depois conserte, depois explique como evitar.
- Erro não é culpa dela. Nunca faça parecer que é.

## 3. Rodar o projeto (pedido mais comum: "roda o projeto")

1. Confira se o Node está instalado: `node -v`. Se não estiver, explique como instalar (versão LTS em nodejs.org) e pare.
2. Se não existir a pasta `node_modules`, rode `npm install` e explique: "baixei as peças que o projeto usa".
3. Confira se existe o arquivo `.env.local` com `VITE_SUPABASE_URL` e `VITE_SUPABASE_PUBLISHABLE_KEY`.
   Se não existir: **não** peça pra ela colar chaves no chat. Diga pra pedir o arquivo pro Victor e onde colocar (raiz do projeto).
4. Rode `npm run dev` em segundo plano e mande o link **http://localhost:5173**.
5. Entregue um roteiro de teste curto do que está pronto (use a seção 6 como base) e diga o que ainda é "em breve".
6. Explique: "localhost é o seu próprio computador fingindo ser um site. Só você vê. Ao salvar um arquivo, a página atualiza sozinha."

Pra ver no celular: `npm run dev -- --host` e abrir o endereço "Network" que aparecer (celular e computador no mesmo Wi-Fi).

## 3.1 Limite de uso do Claude (regra do Victor, 02/11/2026)

Quando o uso da conta do Claude chegar perto do fim (~90%) ou a pessoa avisar que está acabando:
1. **Pare de começar coisa nova.** Termine só o passo que está no meio, com calma.
2. Escreva ou atualize um `docs/HANDOFF-<assunto>.md`: o que está pronto, o que está no ar, onde parou, o próximo passo exato e os cuidados.
3. **Commit e push de tudo** na branch de trabalho (hoje `monorepo-split`), inclusive o que outras sessões deixaram sem commit (nunca `.env`). Não precisa pedir confirmação pra esse commit/push: a regra já é a autorização.
4. Avise em uma linha qual é o HANDOFF, pra continuar em outra conta.

### Sessão grande → sessão nova (regra do Victor, 02/11/2026)
Cada passo de uma conversa longa reprocessa o histórico inteiro: é o que mais gasta. Então:
- **Quando trocar:** depois de terminar uma funcionalidade ou etapa grande, quando a conversa já passou por vários assuntos, ou quando a pessoa disser que o uso está alto. Na dúvida, troque.
- **Como:** faça os passos 2 e 3 acima (HANDOFF + commit e push) e proponha uma **sessão nova** com um resumo curto que manda ler o `AGENTS.md`, o HANDOFF e a spec. Não continue trabalho grande na sessão velha.

### Economia de uso
- Não leia arquivo grande inteiro: use `grep` e leia só as linhas que importam.
- Publicar Edge Function: pela CLI a partir do arquivo (`supabase functions deploy`), nunca colando o conteúdo na conversa. Sem CLI, só o que mudou.
- Teste de tela: prefira um roteiro (Playwright, em texto, "passou/falhou") a clicar passo a passo. Print só pra julgar o visual, e em tamanho pequeno.
- `npm test` inteiro só uma vez, no fim. No meio, rode só o arquivo de teste da mudança.

## 4. Como trabalhamos com Git (explique isso pra ela na primeira vez)

- `main` = versão oficial. **Nunca** commitar nem dar push direto na `main`.
- Ingryd trabalha na branch **`dev-ingryd`**; Victor na **`dev-victurib`**.
- Antes de começar algo novo: `git pull` na branch dela pra pegar o que mudou.
- Ao terminar uma parte que funciona: commit com mensagem em português dizendo o que mudou
  (ex.: `Lança gastos no Financeiro`) e push.
- Pra entrar na `main`: abrir um Pull Request (PR) pro Victor revisar. Explique que PR é "pedir pra alguém conferir antes de juntar na versão oficial".
- **Peça confirmação dela antes de**: push, abrir PR, apagar arquivos, mudar o banco de dados.

## 5. Regras do código

- **Mobile primeiro (decisão do Victor, 02/11/2026).** O produto é o app (Expo, `apps/mobile`): o público é de celular e vem de TikTok/Reels pra loja. Toda funcionalidade nova nasce no app. O site fica pro essencial: abrir o convite sem instalar, ver a viagem, planejar no PC e as páginas de divulgação (`/espera`). **Atualização do rumo (03/11/2026):** o app é do **organizador**; o **convidado** age pela **web leve** (`/v/<código>`: topar, votar, ver o plano), sem instalar.
- **Rumo do produto: [`docs/RUMO.md`](docs/RUMO.md) manda.** Âncora = **passaporte da galera** (spec 118); na viagem, o **"Hoje" com as reservas do grupo** (spec 120); a base de planejar fica sem coisa nova. IA só invisível, pra tirar digitação. Antes de pegar qualquer task, pergunte "isso serve à âncora, ao 'Hoje' ou é conserto da base?". Se não serve, está congelado (❄): não abra spec nova pra isso.
- Código simples, sem "esperteza". Nomes e comentários em português.
- Rotas em `src/router.tsx`. Telas em `src/pages/` (só mostram as coisas).
- Regras e acesso ao banco em `src/features/<módulo>/` (`api.ts`, `hooks.ts`).
- Peças visuais prontas em `src/components/ui/` (veja o README de lá). Reaproveite antes de criar outra.
- Dados da viagem dentro das abas: `const { viagem, destinos, membros, euSouAdm } = useViagemAtual()`.
- **Antes de construir uma funcionalidade, leia a spec dela em `docs/specs/`** (o README de lá tem o roteiro em ordem). A spec diz o que entra, o que não entra, quem pode o quê e os critérios de aceite. Se o pedido da pessoa sair da spec, avise e sugira atualizar a spec primeiro.
- Ao terminar, use os **critérios de aceite** da spec como roteiro de teste e atualize o status no `docs/specs/README.md`.
- Cores e fontes: só as variáveis de `src/styles/global.css` (paleta Couro e laranja). Ícones: só `<Icone nome="...">` e `<Selo nome="...">` (catálogo em `@together/core`, regras em `docs/design/ICONES.md`). **Nada de emoji** em tela ou texto do app (aviso, compartilhar) e nada de importar `lucide-*`: o teste `apps/web/tests/icones.test.mjs` barra.
- Variáveis de ambiente do navegador começam com `VITE_`. Nunca colocar segredos nelas.
- Antes de dizer que terminou, confira só o que a mudança pode quebrar (rodar tudo sempre gasta tempo à toa):
  - Mexeu no app (`apps/mobile`) ou no core: `npx tsc --noEmit` na pasta que mudou.
  - Mexeu no site (`apps/web`): `npm run build` e `npm run lint`.
  - `npm test` (testes de lógica e regras do banco, não de tela) **só** se mexeu em dinheiro, datas, regras ou banco. Rode **uma vez**, em primeiro plano, e mostre só o resumo (quantos passaram/falharam). A falha do `zip.test.mjs` no Windows (nome com acento) é antiga: ignore.
  - Tela e responsividade não têm teste automático: confira abrindo no navegador (360px e desktop). Sem navegador, diga isso em vez de inventar outro teste.
  - Se der erro, explique e conserte.

## 6. O que já existe (pra contextualizar e montar roteiros de teste)

| Parte | Estado |
|---|---|
| Login (Google, e-mail e senha, criar conta, esqueci a senha) | Pronto |
| Onboarding com mapa: destinos, datas, nome/moeda, convite do comboio | Pronto |
| Link de convite `/convite/<código>` | Pronto |
| Dashboard: menu, Overview com resumo de tudo, editar roteiro com datas | Pronto pra testar |
| Financeiro: gastos, divisão, acertos, orçamento, câmbio, lançamento rápido (botão "+") | Pronto pra testar |
| Transportes, Comboio (papéis, convites, sair) | Pronto pra testar |
| Fotos: feed do comboio estilo Instagram (posts com até 10 fotos, curtidas, comentários, grade, aviso no celular) | Pronto pra testar |
| Financeiro: termômetro do câmbio e boletim no celular às 12h e 20h | Pronto pra testar |
| Minhas viagens (`/viagens`), Perfil (`/perfil`), Configurações da viagem | Pronto pra testar |
| Documentos de entrada: checklist por país na Overview, ao lado do mapa, com prazo e fonte oficial | Pronto pra testar |
| Hospedagem: busca pronta (Airbnb, Booking, Maps), opções do comboio, votos, escolhida pelo ADM, lançar como gasto | Pronto pra testar |
| Página 404 e de erro | Pronto |

## 7. Banco de dados (Supabase)

- Tabelas e regras de acesso estão em `supabase/migrations/` (leia o README de lá).
- Regra geral: quem está no comboio vê a viagem; o ADM edita destinos, trajetos, orçamento e convites; gasto "pessoal" só quem lançou vê. Isso é garantido pelo banco (RLS), não só pela tela.
- Mudar o banco = criar um arquivo novo de migration (nunca editar um antigo), explicar pra ela o que muda em linguagem simples e **pedir confirmação** antes de aplicar. O Victor revisa no PR.
- Depois de mudar o banco, gerar de novo os tipos em `packages/core/src/database.ts` (monorepo: os tipos agora ficam no `@together/core`, que web e mobile usam).

## 8. Referências

- **Rumo do produto (manda em tudo): `docs/RUMO.md`**
- Plano das próximas funcionalidades (ondas): `docs/ROADMAP.md`
- Specs de cada funcionalidade: `docs/specs/README.md`
- Pesquisa de mercado e catálogo completo: `reports/`
- Requisitos combinados: `docs/conversa-2026-10-10-requisitos.md`
- Concorrentes: `docs/benchmark.md`
- Glossário pra Ingryd: `docs/glossario.md`
- Guia "como pedir coisas pro Claude": `docs/COMO-TRABALHAR.md`
- O nome do produto é **Norti**, igual à mascote (decidido em 04/11/2026; antes foi "Tripwave", "Triply" e "Together"). Docs antigos ainda dizem Tripwave. Ver `docs/marketing/NOME-E-VOZ.md`.
- Nomes internos continuam com "together" de propósito: pacote `@together/core`, chaves `together:*` no navegador, caches, link `together://` do app e o endereço `together-viagem.vercel.app`. Trocar esses quebra login, convites e dados salvos. O repositório no GitHub continua se chamando Triply.
