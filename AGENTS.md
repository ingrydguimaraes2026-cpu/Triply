# AGENTS.md — Together (nome provisório)

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

## 4. Como trabalhamos com Git (explique isso pra ela na primeira vez)

- `main` = versão oficial. **Nunca** commitar nem dar push direto na `main`.
- Ingryd trabalha na branch **`dev-ingryd`**; Victor na **`dev-victurib`**.
- Antes de começar algo novo: `git pull` na branch dela pra pegar o que mudou.
- Ao terminar uma parte que funciona: commit com mensagem em português dizendo o que mudou
  (ex.: `Lança gastos no Financeiro`) e push.
- Pra entrar na `main`: abrir um Pull Request (PR) pro Victor revisar. Explique que PR é "pedir pra alguém conferir antes de juntar na versão oficial".
- **Peça confirmação dela antes de**: push, abrir PR, apagar arquivos, mudar o banco de dados.

## 5. Regras do código

- Código simples, sem "esperteza". Nomes e comentários em português.
- Rotas em `src/router.tsx`. Telas em `src/pages/` (só mostram as coisas).
- Regras e acesso ao banco em `src/features/<módulo>/` (`api.ts`, `hooks.ts`).
- Peças visuais prontas em `src/components/ui/` (veja o README de lá). Reaproveite antes de criar outra.
- Dados da viagem dentro das abas: `const { viagem, destinos, membros, euSouAdm } = useViagemAtual()`.
- **Antes de construir uma funcionalidade, leia a spec dela em `docs/specs/`** (o README de lá tem o roteiro em ordem). A spec diz o que entra, o que não entra, quem pode o quê e os critérios de aceite. Se o pedido da pessoa sair da spec, avise e sugira atualizar a spec primeiro.
- Cada aba em `src/pages/viagem/` tem um comentário **`TODO (Ingryd)`** no topo apontando pra spec dela.
- Ao terminar, use os **critérios de aceite** da spec como roteiro de teste e atualize o status no `docs/specs/README.md`.
- Cores e fontes: só as variáveis de `src/styles/global.css` (paleta Couro e laranja). Ícones: `lucide-react`.
- Variáveis de ambiente do navegador começam com `VITE_`. Nunca colocar segredos nelas.
- Antes de dizer que terminou: `npm run build` e `npm run lint` sem erros. Se der erro, explique e conserte.

## 6. O que já existe (pra contextualizar e montar roteiros de teste)

| Parte | Estado |
|---|---|
| Login (Google, e-mail e senha, criar conta, esqueci a senha) | Pronto |
| Onboarding com mapa: destinos, datas, nome/moeda, convite do comboio | Pronto |
| Link de convite `/convite/<código>` | Pronto |
| Dashboard: menu, Overview (mapa, roteiro, comboio), aba Comboio | Pronto |
| Transportes, Financeiro, Fotos | Só o visual. Funcionalidade = trabalho da Ingryd (ver `TODO (Ingryd)`) |
| Página 404 e de erro | Pronto |

## 7. Banco de dados (Supabase)

- Tabelas e regras de acesso estão em `supabase/migrations/` (leia o README de lá).
- Regra geral: quem está no comboio vê a viagem; o ADM edita destinos, trajetos, orçamento e convites; gasto "pessoal" só quem lançou vê. Isso é garantido pelo banco (RLS), não só pela tela.
- Mudar o banco = criar um arquivo novo de migration (nunca editar um antigo), explicar pra ela o que muda em linguagem simples e **pedir confirmação** antes de aplicar. O Victor revisa no PR.
- Depois de mudar o banco, gerar de novo os tipos em `src/types/database.ts`.

## 8. Referências

- Roteiro e specs das próximas funcionalidades: `docs/specs/README.md`
- Requisitos combinados: `docs/conversa-2026-10-10-requisitos.md`
- Concorrentes: `docs/benchmark.md`
- Glossário pra Ingryd: `docs/glossario.md`
- Guia "como pedir coisas pro Claude": `docs/COMO-TRABALHAR.md`
- O nome "Together" é provisório (era "Triply", que já existe). O repositório no GitHub continua se chamando Triply.
