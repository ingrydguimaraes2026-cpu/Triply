# Together ✈️ *(nome provisório)*

Site de planejamento de viagens em grupo. Funciona no navegador e pode ser **instalado no celular como app** (PWA).

O que ele vai fazer:

- criar a viagem e escolher os destinos, que aparecem no mapa
- **Overview**: resumo de tudo
- **Transportes**: trajetos, horários e bate-e-volta
- **Financeiro**: orçamento, quem pagou o quê e câmbio (cotação média)
- **Fotos**: feed com as melhores fotos de cada lugar
- **Comboio**: o grupo que viaja junto

Requisitos completos em [`docs/conversa-2026-10-10-requisitos.md`](docs/conversa-2026-10-10-requisitos.md). Concorrentes em [`docs/benchmark.md`](docs/benchmark.md).

## Tecnologias

| Peça | Ferramenta |
|---|---|
| Site | [React](https://react.dev) + [Vite](https://vite.dev) |
| Linguagem | TypeScript |
| Navegação | [React Router](https://reactrouter.com) |
| Instalar no celular | [vite-plugin-pwa](https://vite-pwa-org.netlify.app) |
| Banco de dados, login e fotos | [Supabase](https://supabase.com) *(próxima etapa)* |
| Câmbio | [Frankfurter](https://frankfurter.dev) |

## Como rodar

Pré-requisito: [Node.js](https://nodejs.org) (versão LTS).

```bash
npm install     # só na primeira vez
npm run dev     # abre em http://localhost:5173
```

Ao salvar um arquivo, o site atualiza sozinho no navegador.

Pra ver no celular: rode `npm run dev -- --host` e abra no celular o endereço "Network" que aparece no terminal. O celular e o computador precisam estar na mesma rede Wi-Fi.

### Comandos úteis

| Comando | O que faz |
|---|---|
| `npm run dev` | Inicia o site |
| `npm run build` | Confere erros de TypeScript e gera a versão final |
| `npm run lint` | Procura problemas comuns no código |
| `npm run preview` | Abre a versão final (é onde o PWA funciona de verdade) |

## Estrutura de pastas

```
src/
├── pages/            ← TELAS (uma por arquivo)
│   ├── Login.tsx
│   ├── NovaViagem.tsx
│   └── viagem/           abas: Overview, Transportes, Financeiro, Fotos, Comboio
├── router.tsx        ← qual endereço abre qual tela
├── features/         ← LÓGICA de cada módulo (viagens, financeiro, câmbio...)
├── components/ui/    ← peças visuais reutilizáveis (Cartao, EstadoVazio, Avatar...)
├── lib/              ← conexões (Supabase, APIs) e utilidades
├── types/            ← formato dos dados
└── styles/           ← cores e estilos gerais
supabase/migrations/  ← tabelas do banco de dados
public/               ← ícones do app
docs/                 ← requisitos, benchmark, decisões
```

Regra principal: **`src/pages/` só mostra as telas; as regras ficam em `src/features/`.**

Pra começar uma funcionalidade, procure o comentário `TODO (Ingryd)` no topo de cada aba em `src/pages/viagem/`: ele diz o que construir e quais tabelas usar.

## Configuração

As chaves do Supabase ficam no arquivo `.env.local`, que nunca vai para o GitHub. Peça os valores pro Victor.

## Etapas

- [x] 1. Estrutura inicial (site + PWA)
- [ ] 2. Supabase: banco, login e comboio (quem vê o quê)
- [ ] 3. Viagens e destinos (com mapa)
- [ ] 4. Transportes
- [ ] 5. Financeiro e câmbio
- [ ] 6. Fotos
- [ ] 7. Overview juntando tudo

Ideias pra depois: checklists, favoritos, calendário, clima.
