# 116. Onboarding: conversa com a Agulha e primeira viagem (app)

**Fase:** 2 · **Tamanho:** M · **Depende de:** 114 (Explorar), 115 v2 (jeito rápido) · **Status:** v2 pronta pra testar no iPhone (02/11/2026)

## Objetivo
Quem acabou de criar a conta não cai numa home vazia: o app leva direto pra montar a primeira viagem e o roteiro. O dashboard só aparece depois, já com roteiro.

## Por que
Teste do Victor no iPhone (02/11/2026): depois de criar a conta a pessoa fica perdida, o onboarding é feio, a home vazia não diz o que fazer e o Explorar (a melhor parte) fica escondido dentro da viagem. A spec 115 v2 já descreve o "jeito rápido" (pra onde → quantos dias → deslize → roteiro), mas só existe no site.

## v2 (02/11/2026): conversa com a Agulha, conta só no fim
O Victor não gostou da v1 (boas-vindas com 3 fotos + formulário). Pesquisa no X de onboardings que convertem:
**WeWard** (mascote fala num balão em toda tela, pergunta, monta um plano), **Headspace** (deixa provar o produto antes de pedir algo), **Cal AI / Been** (uma pergunta por tela, barra fina de progresso, "preparando…").

**Como ficou (`/comecar`, primeira tela de quem não está logado):**
1. **Oi:** Agulha grande, "Oi, eu sou a Agulha", "Bora" / "Já tenho conta".
2. **Pra onde vocês vão?** Balão da Agulha + busca + 6 sugestões. Tocar já avança.
3. **Quantos dias?** Contador grande ("Não sabe as datas? Dá pra pôr depois").
4. **Com quem você vai?** (amigos, casal, família, sozinho) + **o que vocês curtem?** (natureza, museus, lugares pra foto). Viram os estilos do Explorar (casal → romântica, família → com crianças).
5. **Gostinho:** desliza 6 lugares de verdade, ANTES da conta. Pra ler o catálogo, o app entra como convidado (login anônimo) sem a pessoa ver. Se o login anônimo estiver desligado ou a cidade não tiver lugares, pula direto pra conta.
6. **Prévia:** "Pronto! Olha o começo do roteiro" (Dia 1, Dia 2… com o que curtiu). "Salvar meu roteiro".
7. **Conta:** "Crie sua conta pra guardar o roteiro e chamar a galera" → login (criar/entrar). As respostas ficam guardadas no aparelho (`src/lib/rascunho.ts`), inclusive se precisar confirmar o e-mail.
8. **Depois do login:** `/comecar` cria a viagem (destino, dias, moeda pelo país), grava as escolhas do gostinho e abre o **roteiro já montado** (`/explorar?roteiro=1&guiado=1`). Sem gostinho: abre o deslize com os estilos escolhidos. Depois: "Continuar" → "Chamar a galera" → dashboard com "Montem a viagem".

Saiu da v1: as 3 telas de boas-vindas (a rota `/boas-vindas` só redireciona) e a `/primeira-viagem`. Conta logada sem viagem também vai pro `/comecar` (sem o passo da conta).

## v1 (substituída)

## Decisão do Victor (02/11/2026)
Aprovou a jornada e pediu pra estruturar o onboarding **inteiro** pelo que a plataforma faz: boas-vindas contando como funciona, criação guiada e, no dashboard, um checklist que apresenta o resto (datas, hospedagem, transporte, contas).

## Antes da conta: boas-vindas (3 telas)
Foto em cima com uma miniatura do app, texto embaixo no creme, na ordem da jornada:
1. "Diga pra onde e quantos dias" (ficha "Jericoacoara · 4 dias").
2. "Deslizem e o roteiro se monta" (botões passo / não abro mão / quero).
3. "E na viagem, tudo num lugar só" (ficha "Você recebe R$ 120").
Último botão: "Criar minha conta". "Pular" leva pra última tela.

## Depois do roteiro: "Montem a viagem" no dashboard
Cartão no topo da viagem (antes de ela começar) com 6 passos, o próximo destacado e os feitos riscados: montar o roteiro, chamar a galera, pôr as datas (só ADM), onde dormir, como chegar, dividir as contas. Some quando tudo está feito ou a viagem começa.

## A jornada (app)
1. **Conta nova e sem viagem** → em vez da home vazia, abre a tela cheia "Pra onde vocês vão?" com a Agulha. Uma pergunta por tela. Sugestões em cartões coloridos; dá pra buscar ou digitar qualquer cidade.
2. **"Quantos dias?"** → contador grande (1 a 30, padrão 4) e, opcional, "Já sei as datas" (calendário). Sem tela de moeda: sai do país do destino (BRL se não souber) e muda depois.
3. **"Escolher os lugares"** cria a viagem (nome = destino) e cai direto no deslize do Explorar (12 cartões), com uma dica curta na primeira vez ("→ quero, ← passo, ↑ não abro mão").
4. **Acabou a pilha** → roteiro montado. Botão de baixo "Continuar".
5. **"Chamar a galera"** (tela cheia com a Agulha): "Mandar convite" ou "Agora não".
6. **Dashboard da viagem** (`/viagem/[id]`), já com roteiro.

**Convidado** (`/convite/...`): ao entrar na viagem, vai pro deslize do destino (se ainda não deslizou nada) e depois pro roteiro. Se já tem escolhas, abre o roteiro.

**Quem já tem viagem** não vê nada disso. A "Nova viagem" (botão +) também passa a usar o jeito rápido (mesmas telas, sem o passo 5 quando já tem gente).

## Não inclui
- Redesenho da tela de login/boas-vindas.
- Site.
- Mudança no banco.
- Vários destinos na criação (um destino; os outros entram pela tela da viagem).

## Dados
Nenhuma mudança. Usa `criarViagem` (com `dias` no destino se a função aceitar; senão datas nulas e `dias` via update do destino) e as funções do Explorar no core.

## Critérios de aceite
- [ ] Conta nova, sem viagem: depois de criar a conta abre "Pra onde vocês vão?", não a home.
- [ ] Escolher destino + dias → cria a viagem e abre o deslize com 12 cartões.
- [ ] Acabar a pilha → roteiro com os dias → "Continuar" → "Chamar a galera" → "Agora não" → dashboard da viagem.
- [ ] Fechar o app no meio e abrir de novo: se a viagem já existe, abre a home normal (não repete o guia).
- [ ] Convite: entrar por link → deslize do destino → roteiro.
- [ ] Quem já tem viagem: nada muda no início.
- [ ] Boas-vindas: 3 telas, "Pular" vai pra última, "Criar minha conta" abre o login no modo criar.
- [ ] Dashboard da viagem nova mostra "Montem a viagem" com o roteiro já marcado.
- [x] `npx tsc --noEmit` em `apps/mobile` e `packages/core` passa.

## Como ficou no código
- `app/boas-vindas.tsx` (refeito), `app/primeira-viagem.tsx`, `app/chamar-galera.tsx`, `src/ui/CriarViagemRapida.tsx` (usado também pela `nova-viagem.tsx`), `src/ui/PassosDaViagem.tsx`.
- `app/(tabs)/index.tsx`: sem nenhuma viagem → `<Redirect href="/primeira-viagem" />` (convidado anônimo não).
- `app/explorar.tsx`: params `viagem` (espera a viagem nova chegar no contexto) e `guiado=1` (começa no deslize, dica no 1º cartão, "Continuar" no roteiro → `chamar-galera` se ADM sozinho, senão `/viagem/[id]`).
- `app/convite/[codigo].tsx`: depois de entrar → `/explorar?viagem=…&guiado=1`.
- Core: `NovaViagem.destinos[].dias` (coluna já existia) e `NOME_EM_PORTUGUES` em `paises.ts` (o celular não tem `Intl.DisplayNames` garantido).
- A busca usa a lista de 100 cidades do Explorar (`CIDADES_DA_PRE_CARGA`) + "Usar “texto”" pra qualquer outra. Moeda sai do país (BRL se não souber).

## Dicas pra implementar (originais)
- Porteiro em `apps/mobile/app/_layout.tsx` e a função `Vazio` em `app/(tabs)/index.tsx`: sem viagem → `router.replace('/primeira-viagem')`.
- Tela nova `app/primeira-viagem.tsx` (ou reescrever `nova-viagem.tsx` no jeito rápido e reaproveitar).
- `app/explorar.tsx` recebe `?guiado=1`: no roteiro, mostra "Continuar" que leva pra "Chamar a galera" e depois pro dashboard.
- Convite: `app/convite/[codigo].tsx` → `abrirViagem` manda pra `/explorar?guiado=1`.
