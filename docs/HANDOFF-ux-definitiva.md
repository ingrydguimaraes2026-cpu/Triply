# HANDOFF: implementação da spec 117 (UX definitiva do app)

Data: 02/11/2026. Branch `monorepo-split`, só commits locais (sem push).

## Pronto (um commit por parte)
1. Reanimated 4.7, Gesture Handler 3.3, Haptics, Worklets + `apps/mobile/src/ui/movimento.ts` (molas, durações, `useCascata`, `useNumeroAnimado`, `tum()`, `cssInterop` pra `className` nos componentes animados). `GestureHandlerRootView` na raiz.
2. Navegação: `app/index.tsx` = Início sem abas (Perfil pelo avatar). Viagem em `app/viagem/[id]/(abas)/` com 4 abas. `/roteiro`, `/contas`, `/fotos` antigos redirecionam (`src/ui/IrPraAba.tsx`).
3. Aba Viagem "antes": capa com parallax e cabeçalho que encolhe, stories (anel dourado = novidade), Próximo carimbo (duelo de hospedagem + Cutucar), Passaporte (carimbo cai com haptic; vistos guardados em `tripwave.carimbos.<id>`), Roteiro em carrossel, Contas, Antes de embarcar. Comemoração da Norti (`src/ui/Comemoracao.tsx`). Tudo que saiu da tela: `/tudo-da-viagem` (botão "...").
4. "Na viagem" = `Hoje` dentro da aba (+ clima e ponto de encontro). "Voltou" = Lembranças. Em dev: `?fase=durante|voltou` simula.
   Início: barra de carimbos no cartão e "No comboio agora".
5. Roteiro abre em Matches (pílulas Matches · Dia N). Explorar: cartão mostra quem já quer, "Deu match!" pra quem deu o quero que fechou. Lembretes: aviso "falta você opinar" (1/dia/viagem).
6. Contas como conversa + barra "o que foi?" que abre o `novo-gasto` preenchido pela frase.
7. Tela `/passe?de=<origem>` (sem cobrar, "Em breve", grava interesse). Cadeados em Lembranças e no "Tudo da viagem".
8. Polimento: cartão de baixo do deslize sobe com mola; capa assenta com mola na entrada.

## Feito em 02/11 (depois da aprovação do Victor)
- Migrations `matches_do_comboio` e `interesse_no_passe` aplicadas no banco; tipos regerados em `packages/core/src/database.ts`.
- `lembretes` publicada (`--no-verify-jwt`).
- Regras do match conferidas no banco numa transação desfeita no fim: 3 querem = match, 2 = quase, "passo" não aparece, aviso só pra quem não opinou e 1 por dia, quem não é do comboio é barrado.
- Roteiro de teste no web 360px: Início (avatar, destaque, próximas, nova viagem), aba Viagem (cabeçalho voltar/compartilhar/"...", rostos, chamar a galera, carrossel, contas, antes de embarcar, rolagem da capa e do cabeçalho), comemoração (aparece 1 vez só), os 10 atalhos e os 3 cadeados do "Tudo da viagem", Passe (grava viu/quis), Roteiro (Matches, Descobrir), Explorar (Passo + Desfazer), Contas ("taxi 20" vira € 20 Transporte), Fotos, fases durante/voltou, rotas antigas /roteiro /contas /fotos.
- Consertos: o Passe contava "viu" 2 vezes; o voltar do Explorar não fazia nada quando aberto por link; textos do match diziam "3 pessoas" mesmo em comboio de 2.

## Falta
1. Testar no iPhone de verdade (deslize com o dedo, haptic, "Reduzir movimento").
2. Ver na tela o duelo de hospedagem, o Cutucar e o "Deu match!": só a Eurotrip (da Ingryd) tem 2 pessoas, e eu não mexi nela.
3. Roteiro sem datas mostra só "Dia 1" nas pílulas, mas o carrossel da aba Viagem conta os dias montados pelo Explorar (Lisboa: 4). São dois jeitos de contar que já existiam antes; vale juntar.
4. Linhas de teste em `interesse_no_passe` (do usuário 34991f24…): apagar antes de medir.

## Fora desta entrega (anotado)
- Mapa com os rostos na fase "na viagem" (tela 4 do desenho): hoje mostra a agenda do Hoje. Precisa de localização compartilhada.
- Transição compartilhada de verdade (foto do Início vira a capa): Reanimated exige flag experimental; ficou um zoom com mola.
- "Beto acertou € 30 no Pix": o app não registra acerto feito, só calcula quem paga quem.
- Aviso de console antigo no web: `<Icone accessibilityLabel>` passa `accessible` pro SVG.
