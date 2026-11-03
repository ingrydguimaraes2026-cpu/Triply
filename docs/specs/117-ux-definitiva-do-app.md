# 117. UX definitiva do app: viagem em 4 abas, carimbos, match do comboio e motion

**Fase:** 2 · **Tamanho:** G (em partes) · **Depende de:** 114, 115, 116 · **Status:** Pronta pra testar (migrations esperando aprovação)

## Objetivo
O app deixa de ser um menu de 11 cartões e vira uma jornada: a pessoa sempre vê **a próxima coisa a fazer**, o **grupo** puxando ela de volta e um **passaporte de carimbos** que enche até a viagem acabar. Tudo com animação no estilo motion (mola, transição compartilhada, comemoração nos marcos).

## Por que
- Victor (02/11/2026): a tela da viagem tem texto e coisa demais, o usuário se perde e cansa; "já me perdi no objetivo do app". Precisa ficar muito melhor antes do TestFlight.
- 3 rodadas de desenho. A **aprovada** está em `docs/design/direcoes-v2/definitiva.html` (abrir no navegador; PNG ao lado). As outras 6 (`direcoes/` e `direcoes-v2/modelos.html`) ficam só de referência.
- Base: `docs/design/MAPA-DE-TELAS.md` (25 telas → 15), `docs/design/referencias/README.md` (regras do X) e a pesquisa de mercado em `reports/` (o essencial do grupo é grátis; cobra o Passe da viagem e parceiros).
- Victor: "gostamos de UX, gostamos de animação estilo motion".

## Inclui

### 1. Navegação nova (o esqueleto)
- **Fora de uma viagem:** tela **Início** sem barra de abas (cartão de foto grande da próxima viagem com a barra de carimbos, "No comboio agora", "Nova viagem"). O Perfil abre pelo avatar no canto.
- **Dentro de uma viagem:** barra com **4 abas: Viagem · Roteiro · Contas · Fotos**. Some a barra atual (Viagens · Roteiro · Contas · Fotos · Perfil).
- O que sai da tela principal **continua acessível** (nada é apagado): Galera (pelos rostos), Papéis/Documentos e Cofre (item "Antes de embarcar"), Hospedagem e Transporte (pelos carimbos "Dormir" e "Chegar"), Configurações (engrenagem), PDF e Retrospectiva (Lembranças).

### 2. Aba Viagem: muda com a fase
Fases: **antes** (planejando) → **na viagem** (do 1º ao último dia) → **voltou**.
- **Antes** (tela 2 do desenho), de cima pra baixo, nada além disso:
  1. capa com foto, nome, datas e "faltam N dias";
  2. rostos do comboio como stories (anel dourado = tem novidade) + Convidar;
  3. **Próximo carimbo**: o card destacado da decisão aberta mais importante (ex.: onde dormir, com duelo de fotos, barra de votos, "faltam Beto e Lia" e **Cutucar**);
  4. **Passaporte do comboio**: os 6 selos (Roteiro, Galera, Datas, Dormir, Chegar, Contas), apagados até serem conquistados;
  5. Roteiro (carrossel de dias com foto), Contas (gasto do grupo e meu saldo), Antes de embarcar (passaportes, seguro, eSIM).
- **Na viagem** (tela 4): mapa com o rosto de cada um + folha com os lugares do dia ("Cheguei" no da vez), clima e ponto de encontro. Substitui a tela `hoje`.
- **Voltou** (tela 9): Lembranças: números da viagem, passaporte completo, "contas em dia", livro impresso e vídeo. Junta `retrospectiva` e `pdf-da-viagem`.
- O "próximo carimbo" vem das regras que já existem na 115/116 (`PassosDaViagem`); reaproveitar, não reescrever.

### 3. Aba Roteiro: junta Explorar + Roteiro + Lugares
- Pílulas no topo: **Matches** (com bolinha de quantos novos) · Dia 1 · Dia 2 ...
- **Matches** agrupa: "Todo mundo quer" · "Deu match (3 ou mais)" · "Quase (2 querem)" com "Opinar". Botão **Montar os dias com os matches** (usa a montagem da 096/114).
- Botão "Descobrir mais lugares" abre o **deslize** da 114.

### 4. Match do comboio (muda a decisão da 114)
- Cada um continua deslizando sozinho, mas o cartão mostra **quem já quer** ("Ana e Ju querem").
- Quando um lugar chega a **3 ou mais "quero"** (ou todos, se o comboio tem menos de 3), aparece a tela **Deu match!** na hora (foto redonda, rostos, "Pôr no dia N" e "Continuar deslizando").
- Quem ainda não opinou recebe aviso no celular: "Falta você opinar no Museu do Azulejo" (no máximo 1 por dia por viagem, pra não virar spam).

### 5. Contas
Um número grande (meu saldo) + câmbio de hoje numa linha + os gastos como **conversa** (bolhas, reações, "Beto acertou € 30 no Pix") + barra fixa embaixo pra lançar ("€ 0,00 · o que foi?"). Reaproveita `novo-gasto` por trás.

### 6. Motion (animação) — regras
- Biblioteca: **react-native-reanimated** + **react-native-gesture-handler** (instalar com `npx expo install`, que escolhe a versão certa do SDK 58). Nada de Lottie agora.
- **Mola, não linha reta**: tudo que entra usa `withSpring` (sem quique exagerado).
- **Entrada em cascata** das seções da aba Viagem (cada uma 40 ms depois da outra, sobe 12 px e aparece).
- **Transição compartilhada**: a foto do cartão do Início cresce e vira a capa da viagem.
- **Capa com parallax** e cabeçalho que encolhe ao rolar.
- **Deslize** com o cartão girando conforme o dedo, e os de baixo subindo.
- **Carimbo**: quando um selo é conquistado, ele cai girando no passaporte com um "tum" (haptic leve, `expo-haptics`).
- **Comemoração** (Deu match, Carimbo novo): Norti entra com mola + confete simples feito com Reanimated.
- Barra de votos e saldo **animam o número** ao mudar.
- Respeitar "Reduzir movimento" do celular (`useReducedMotion`): aí tudo vira só fade.
- A Norti aparece **só** em marcos (carimbo, match, fim da viagem). Nunca em toda tela.

### 7. Passe da viagem (só a tela, sem cobrar ainda)
- Tela do Passe (tela 8) aparece quando a pessoa toca num extra marcado com cadeado (scan de recibo, mapa sem internet, reservas do e-mail, livro em PDF).
- **Nesta spec, o botão não cobra**: mostra "Em breve" e grava o interesse (pra medir). A compra de verdade (RevenueCat, App Store) é a **spec 118**.
- Gastos, divisão, votos, fotos, Explorar e match: **sempre grátis**.

## Não inclui (fica pra depois)
- Cobrança de verdade e parceiros com link afiliado (spec 118).
- Nível de viajante, XP, sequência de dias e ranking (testados no modelo "Jogo"; ficaram de fora pra não poluir).
- Livro impresso e vídeo da viagem de verdade (Lembranças mostra o botão "Em breve").
- Mapa offline.
- O site (`apps/web`): segue depois, só no essencial (regra "mobile primeiro").

## Telas
Referência visual: `docs/design/direcoes-v2/definitiva.html` (telas 1 a 9 + A, B, C do match). Estado vazio:
- sem viagem: Início mostra "Pra onde a gente vai?" e o botão Nova viagem (porta da 116);
- comboio de 1 pessoa: o card "Próximo carimbo" vira "Chame a galera" e o match não aparece;
- sem gastos: Contas mostra o saldo zerado e "Lance o primeiro gasto".
Carregando: esqueleto com a mesma forma das seções (sem spinner no meio da tela). Erro: mensagem curta + "Tentar de novo".

## Dados
- Já existem: `explorar_escolhas` (quem quis cada lugar), `candidato_votos` (votos de hospedagem), `curtidas`, `enquete_votos`, gastos e acertos.
- **Migration nova** (pedir confirmação antes de aplicar):
  - função `matches_da_viagem(p_viagem)` → por lugar: quantos querem, quem quer, se já está num dia. Só membros da viagem (RLS / `security definer` com checagem de membro).
  - tabela `interesse_no_passe` (viagem, usuário, de onde veio, quando) pra medir quem tocaria no Passe.
- O aviso "falta você opinar" entra na função de lembretes que já existe (`supabase/functions/lembretes`, deploy com `--no-verify-jwt`).
- Regerar `packages/core/src/database.ts`.

## Quem pode o quê
| Ação | ADM | Membro |
|---|---|---|
| Deslizar, querer, opinar, ver matches | sim | sim |
| Pôr um match num dia | sim | sim (como hoje no roteiro do grupo, 115) |
| Cutucar quem falta votar | sim | sim |
| Escolher a hospedagem final | sim | não |
| Ver o Passe / registrar interesse | sim | sim |

## Ordem de implementação (cada parte é um commit que funciona)
1. Instalar Reanimated + Gesture Handler + Haptics e criar `apps/mobile/src/ui/movimento.ts` (molas e durações padrão, cascata, `useReducedMotion`).
2. Navegação: Início sem abas + viagem com 4 abas (expo-router: grupo `viagem/[id]/(abas)`). Redirecionar as rotas antigas.
3. Aba Viagem "antes" com as 5 seções + passaporte de carimbos.
4. Aba Viagem "na viagem" (junta `hoje`) e "voltou" (junta retrospectiva/PDF).
5. Aba Roteiro com Matches + deslize; migration do match; tela Deu match; aviso.
6. Contas em conversa.
7. Tela do Passe (sem cobrança) + `interesse_no_passe`.
8. Polimento de motion e conferência no iPhone (360px e telas grandes).

## Critérios de aceite
- [ ] Entrar numa viagem mostra só as 4 abas; nenhuma funcionalidade antiga sumiu (todas acessíveis em no máximo 2 toques).
- [ ] A aba Viagem antes da data tem no máximo 5 seções e o "próximo carimbo" muda quando a decisão é resolvida.
- [ ] Resolver um passo carimba o selo com animação e haptic; com "Reduzir movimento" ligado, só aparece.
- [ ] No dia da viagem, a aba Viagem vira o "Hoje"; depois da última data, vira Lembranças.
- [ ] 3 pessoas dando "quero" no mesmo lugar geram o "Deu match!" pra quem deu o 3º quero e o lugar aparece em Matches.
- [ ] Quem não opinou recebe no máximo 1 aviso de match por dia por viagem.
- [ ] Contas mostra o saldo, a conversa de gastos e lança um gasto pela barra de baixo.
- [ ] Tocar num extra com cadeado abre o Passe; o botão mostra "Em breve" e grava o interesse.
- [ ] Sem emoji e só `<Icone>`/`<Selo>` (o teste de ícones passa).
- [ ] `npx tsc --noEmit` no app passa; rolagem e deslize sem travar num iPhone de verdade.
