# Triply ✈️

Aplicativo de planejamento e gestão de viagens, feito com React Native e Expo.

Com o Triply você vai poder:

- criar várias viagens e organizar destinos e trajetos
- acompanhar o roteiro dia a dia
- controlar orçamento e gastos em diferentes moedas, e registrar compras de câmbio
- montar checklists e salvar lugares favoritos
- ver o calendário e o clima dos destinos
- ter um dashboard que se adapta ao momento da viagem
- guardar fotos e memórias

## Tecnologias

| Peça | Ferramenta |
|---|---|
| App | [Expo](https://expo.dev) (React Native) |
| Linguagem | TypeScript |
| Navegação | [Expo Router](https://docs.expo.dev/router/introduction/) (cada arquivo em `src/app/` é uma tela) |
| Banco de dados, login e fotos | [Supabase](https://supabase.com) *(etapa 2)* |
| Clima | [Open-Meteo](https://open-meteo.com) |
| Câmbio | [Frankfurter](https://frankfurter.dev) |

## Como rodar

Pré-requisitos: [Node.js](https://nodejs.org) (versão LTS) e o app **Expo Go** no celular ([iPhone](https://apps.apple.com/app/expo-go/id982107779) / [Android](https://play.google.com/store/apps/details?id=host.exp.exponent)).

1. Instale as dependências (só na primeira vez):

   ```bash
   npm install
   ```

2. Inicie o servidor de desenvolvimento:

   ```bash
   npx expo start
   ```

3. Leia o QR code que aparece no terminal com a câmera do iPhone (ou pelo app Expo Go no Android). O celular e o computador precisam estar na mesma rede Wi-Fi.

Ao salvar um arquivo, o app atualiza sozinho no celular.

### Comandos úteis

| Comando | O que faz |
|---|---|
| `npx expo start` | Inicia o app |
| `npm run typecheck` | Procura erros de TypeScript |
| `npm run lint` | Procura problemas de estilo e erros comuns no código |

## Estrutura de pastas

```
src/
├── app/                  ← TELAS (arquivo = tela)
│   ├── (tabs)/               abas: Início, Viagens, Favoritos, Perfil
│   ├── (auth)/login.tsx      login
│   └── viagem/[id]/          telas de uma viagem (roteiro, orçamento...)
├── features/             ← LÓGICA de cada módulo (viagens, orçamento, clima...)
├── components/ui/        ← peças visuais reutilizáveis
├── lib/                  ← conexões (Supabase, APIs) e utilidades
├── theme/                ← cores, fontes e espaçamentos
├── hooks/                ← hooks gerais (tema claro/escuro)
└── types/                ← formato dos dados
supabase/migrations/      ← tabelas do banco de dados
assets/                   ← ícone, tela de abertura e imagens
```

Regra principal: **`src/app/` só mostra as telas; as regras ficam em `src/features/`.**

## Configuração

Copie `.env.example` para `.env.local` e preencha os valores. O `.env.local` nunca vai para o GitHub.

## Etapas

- [x] 1. Estrutura inicial
- [ ] 2. Supabase e login
- [ ] 3. Viagens
- [ ] 4. Destinos e roteiro
- [ ] 5. Orçamento, gastos e câmbio
- [ ] 6. Checklists e favoritos
- [ ] 7. Calendário e clima
- [ ] 8. Dashboard inteligente
- [ ] 9. Memórias (fotos)
