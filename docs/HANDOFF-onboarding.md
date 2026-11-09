# HANDOFF — Onboarding (spec 116 v2), 02/11/2026

> Leia `AGENTS.md` (seções 1, 3.1, 5) e `docs/specs/116-primeira-viagem-guiada-no-app.md` (seção v2).

## Pronto (app mobile; `npx tsc --noEmit` ok em apps/mobile e packages/core)
- **`/comecar`** (`apps/mobile/app/comecar.tsx`): conversa com a Agulha (oi → destino → dias → com quem/o que curtem → gostinho de 6 cartões → prévia → conta → cria a viagem e abre o roteiro).
- **Rascunho** (`src/lib/rascunho.ts`): respostas guardadas no SecureStore (localStorage no web) até a conta existir.
- **Porteiro** (`app/_layout.tsx`): deslogado → `/comecar`; depois do login com rascunho → `/comecar` (cria a viagem). `AbrirAvisos` não roda no `/comecar`.
- **Explorar**: `?roteiro=1` monta o roteiro direto com as escolhas; `?estilos=a,b` define os estilos.
- **Login**: botão de voltar pra `/comecar` (reabre no passo da conta, com as respostas).
- Da v1 continuam: "Chamar a galera", "Montem a viagem" no dashboard, "+ Nova viagem" rápido (`src/ui/CriarViagemRapida.tsx`), convite → deslize guiado.
- Conferido no navegador (375px): oi, destino, dias, com quem/o que curtem. Sem erros no console.

## Não testado (precisa do iPhone / login de verdade)
- **Login anônimo** no Supabase: se estiver desligado, o gostinho é pulado (cai direto na conta). Conferir em Authentication → Sign In / Providers → "Allow anonymous sign-ins".
- Gostinho, prévia, criar conta, voltar com o rascunho, roteiro montado, "Chamar a galera", dashboard.

## Cuidados
- Cada gostinho cria um usuário anônimo; quem desiste deixa um usuário anônimo sobrando no Auth (dá pra limpar depois por data).
- Sem mudança no banco.
- Fora daqui: visual do login e o site.

## Consertos de 04/11 (app mais leve e completo)
- **Bibliotecas que faltavam:** Reanimated/Gesture Handler/Worklets (spec 117) estavam no package.json mas não instaladas nesta máquina; `pnpm install` resolveu (o app não abria).
- **Deslize do Explorar refeito** (`src/ui/CartaoDoExplorar.tsx`): Gesture Handler + Reanimated (roda na thread nativa, segue o dedo), peteleco decide (velocidade medida por nós, 500 px/s), vibra ao passar do ponto, toque abre o "ver mais". **Saiu a fileira de botões** no Explorar e no `/comecar`: embaixo só "Desfazer" e a dica das direções; cartão maior.
- **Lentidão:** `useCarregar` agora guarda a última resposta por tela (volta instantânea, atualiza por trás; limpa ao trocar de conta). Fotos com cache no aparelho: `src/ui/Foto.tsx` (`Foto`, `FotoDeFundo`, expo-image).
- **Transportes no app:** antes só mostrava. Agora "Adicionar trajeto" (`src/ui/NovoTrajeto.tsx`: como, de onde, pra onde, dia, horários, preço, link) e segurar pra apagar. Core: `criarTrajeto` e `apagarTrajeto`.
- **Testes:** 460 de 462 passavam; consertado o "nenhum emoji" (❄ em comentários). Sobra só o `zip` antigo (nome com acento).
- **Roteiro de teste sem login:** `docs/marketing/video/demo/testar-gestos.mjs` (modo demonstração): arrasto, peteleco e folha do trajeto → PASSOU.
- **Pendências pequenas:** registrar a migration `convidado_sem_conta` no histórico do Supabase (já está aplicada); ligar "leaked password protection" no painel; `npx expo install --check` (patches do Expo).
