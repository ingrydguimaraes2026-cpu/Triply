# 075. Destinos candidatos ("Pra onde vamos?")

**Fase:** 2 · **Tamanho:** M · **Depende de:** 046 · **Status:** Pronto pra testar (web) · banco **não aplicado**

## Objetivo
Antes de fechar o roteiro, o comboio sugere cidades e vota com coração. O ADM põe a escolhida no roteiro com um toque.

## Por que
- Catálogo A4. "Destino" trava 26% dos grupos; completa o modo sonhando (spec 046).

## Inclui
- Cartão "Pra onde vamos?" na Overview enquanto o roteiro tem 0 ou 1 destino.
- Sugerir cidade com a mesma busca do onboarding (nome, país e coordenadas).
- Votar/tirar voto; lista ordenada pelos votos, com quem votou.
- ADM: "Pôr no roteiro" (vira destino no fim do roteiro e sai dos candidatos). Quem sugeriu ou o ADM tira o candidato.

## Não inclui (fica pra depois)
- Foto e link de cada cidade.
- App mobile.

## Dados
- **Migration:** `supabase/migrations/20261031060000_destinos_candidatos.sql` — `destinos_candidatos` + `candidato_votos`.

## Critérios de aceite
- [x] Comboio sugere e vota; só tira o próprio voto; estranho não vê nem vota; apagar leva os votos (testado no banco).
- [ ] No navegador: sugerir Lisboa e Porto, votar, ADM põe Lisboa no roteiro.
