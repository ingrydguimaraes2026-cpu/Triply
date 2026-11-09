# 102. Onde já fui e estatísticas do viajante

**Fase:** 8 · **Tamanho:** M · **Depende de:** 001 · **Status:** Pronto pra testar (web) · sem banco

## Objetivo
No Perfil, "Onde já fui": o mapa com os países acesos e as cidades marcadas, e os números: viagens, países, cidades, dias viajando e km entre cidades.

## Por que
- Catálogo N5 (mapa de onde já fui) e N6 (estatísticas). É o que faz a pessoa voltar ao app entre uma viagem e outra.

## Inclui
- Conta só viagens que já começaram (viagem em andamento conta os dias até hoje).
- O Brasil (casa) não conta como país visitado nem como cidade.
- Cidade repetida em viagens diferentes conta uma vez.
- km: soma da linha reta entre os destinos de cada viagem, na ordem do roteiro.
- Mapa: o mesmo da Overview, sem ligar os pontos.

## Não inclui (fica pra depois)
- Viagens fora do app ("já fui pra Paris em 2019").
- Compartilhar como imagem (entra na retrospectiva, K7).

## Dados
- Sem migration (lê viagens e destinos, que o banco já libera pra quem está no comboio).

## Critérios de aceite
- [x] Só viagens começadas; casa não conta; cidade repetida conta 1; dias até hoje; km (testado: `viajante.test.mjs`).
- [ ] No navegador: Perfil mostra o mapa e os números.
