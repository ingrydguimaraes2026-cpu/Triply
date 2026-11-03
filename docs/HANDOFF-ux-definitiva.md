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

## Falta (nessa ordem)
1. **Victor aprovar e aplicar** `supabase/migrations/20261102190000_matches_do_comboio.sql` e `20261102191000_interesse_no_passe.sql`. Sem elas: Matches fica vazio e o Passe não grava (nada quebra).
2. Regerar `packages/core/src/database.ts` (os tipos de `matches_da_viagem` e `interesse_no_passe` foram postos à mão).
3. Deploy: `supabase functions deploy lembretes --no-verify-jwt`.
4. Testar no iPhone de verdade (rolagem, deslize, haptic, "Reduzir movimento"). No web 360px já conferido.
5. Testar com comboio de 3 pessoas: duelo de hospedagem, Cutucar e Deu match (todas as viagens de teste são de 1 pessoa).

## Fora desta entrega (anotado)
- Mapa com os rostos na fase "na viagem" (tela 4 do desenho): hoje mostra a agenda do Hoje. Precisa de localização compartilhada.
- Transição compartilhada de verdade (foto do Início vira a capa): Reanimated exige flag experimental; ficou um zoom com mola.
- "Beto acertou € 30 no Pix": o app não registra acerto feito, só calcula quem paga quem.
- Aviso de console antigo no web: `<Icone accessibilityLabel>` passa `accessible` pro SVG.
