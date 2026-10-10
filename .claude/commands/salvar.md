---
description: Salva o trabalho (commit e push) explicando cada passo
argument-hint: [o que foi feito, opcional]
---

Ajude a salvar o trabalho no Git, seguindo a seção 4 do AGENTS.md e o Modo mentor.

1. Veja a branch atual (`git branch --show-current`). Se for `main`, **pare**: explique por que não se salva direto na `main` e ofereça mudar pra `dev-ingryd` levando as mudanças junto.
2. Rode `npm run build` e `npm run lint`. Se der erro, explique e conserte antes de salvar.
3. Mostre, em linguagem simples, a lista do que mudou (`git status` / `git diff --stat`): quais arquivos e o que cada um faz.
4. Proponha uma mensagem de commit curta em português (use $ARGUMENTS se ela descreveu o que fez).
5. **Peça confirmação** antes de fazer o commit e o push.
6. Depois do push, explique o que aconteceu ("agora seu trabalho está guardado no GitHub, na sua branch") e pergunte se ela quer abrir um Pull Request pro Victor revisar. Se sim, abra o PR pra `main` com descrição simples do que mudou e como testar.
