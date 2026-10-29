# features

A lógica de cada módulo do app fica aqui, separada por assunto.
As telas (em `src/pages/`) só mostram as coisas; as regras e o acesso aos dados ficam nestas pastas.

Cada módulo, quando implementado, costuma ter:
- `api.ts`: busca e salva os dados no Supabase
- `hooks.ts`: hooks do React usados pelas telas (ex.: `useViagens()`)
- `components/`: componentes visuais específicos do módulo
