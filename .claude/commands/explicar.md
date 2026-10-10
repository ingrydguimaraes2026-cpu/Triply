---
description: Explica de forma simples como uma parte do projeto funciona
argument-hint: <arquivo, tela ou assunto>
---

Explique de forma simples como funciona: $ARGUMENTS

Se não veio nada depois do comando, pergunte qual tela ou assunto ela quer entender, dando 3 sugestões.

Regras:
- Leia os arquivos envolvidos antes de explicar. Não invente.
- Modo mentor (AGENTS.md, seção 2): sem jargão sem explicação, uma comparação do dia a dia, frases curtas.
- Estrutura:
  1. **Em uma frase**: o que essa parte faz pra quem usa o app.
  2. **O caminho**: de onde vem a informação e pra onde vai (ex.: tela → `features/.../api.ts` → Supabase → volta pra tela), com os nomes dos arquivos.
  3. **O trecho mais importante**: no máximo 10 linhas de código, explicando linha por linha o que importa.
  4. **Se quiser mudar algo**: em qual arquivo mexer pra ajustes comuns (ex.: mudar um texto, uma cor).
  5. **Pra aprender**: 1 conceito novo ligado a isso.
