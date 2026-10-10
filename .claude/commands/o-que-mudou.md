---
description: Resume em linguagem simples o que mudou no projeto recentemente
argument-hint: [quantos dias, padrão 7]
---

Resuma o que mudou no projeto nos últimos $ARGUMENTS dias (se não veio número, use 7), em linguagem simples (Modo mentor do AGENTS.md).

1. Rode `git fetch` e veja os commits recentes de todas as branches: `git log --all --since="<N> days ago" --pretty=format:"%h %an %ad %s" --date=short`.
2. Agrupe por assunto (ex.: "Login", "Financeiro"), não por commit.
3. Para cada assunto: o que mudou pra quem usa o app, em 1 ou 2 frases, e como ver isso funcionando (link/tela).
4. Diga quem fez (Victor ou Ingryd).
5. Termine com: "Tem algo na `main` que ainda não está na sua branch?" e, se tiver, explique como trazer (`git pull origin main`) e peça confirmação antes de fazer.
