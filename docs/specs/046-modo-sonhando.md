# 046. Modo sonhando (viagem sem destino)

**Fase:** 2 · **Tamanho:** P · **Depende de:** 008, 021, 045 · **Status:** Pronto pra testar (web)

## Objetivo
Dá pra criar a viagem antes de saber pra onde: o comboio entra, vota e combina o orçamento, e o destino vem depois.

## Por que
- Catálogo A8. "Destino" trava 26% dos grupos; o onboarding obrigava a escolher um.

## Inclui
- No onboarding, sem destino escolhido: "Ainda não sei pra onde: começar sonhando". Datas continuam opcionais; nome sugerido "Próxima viagem".
- Na Overview, sem destinos: faixa "Modo sonhando" com o passo a passo (enquete "Pra onde vamos?", orçamento combinado, adicionar destinos no Roteiro).

## Não inclui (fica pra depois)
- Destinos candidatos com voto e foto (A4, Fase 5).
- App mobile (o onboarding do app ainda pede destino).

## Dados
- Nenhuma mudança no banco (viagem sem destino já era permitida).

## Critérios de aceite
- [ ] No navegador: Nova viagem → "começar sonhando" → criar → ver a faixa na Overview → adicionar um destino no Roteiro e a faixa some.

## Dicas pra implementar
- `pages/NovaViagem.tsx` (botão) e `features/viagens/api.ts` (`criarViagem` sem destinos).
