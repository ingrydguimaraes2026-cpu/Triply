# 061. "Já fomos" e "Perto de mim" nos Lugares

**Fase:** 2 · **Tamanho:** P · **Depende de:** 016, 040 · **Status:** Pronto pra testar (web) · banco **não aplicado**

## Objetivo
Marcar um lugar como visitado ("Já fomos") e, na rua, ver quais lugares salvos estão mais perto de onde a pessoa está, com "Ir".

## Por que
- Catálogo C10 ("já fomos", alimenta diário e retrospectiva) e C8 ("perto de mim").

## Inclui
- Botão "Fomos?" / "Já fomos" em cada lugar (qualquer um do comboio marca/desmarca). Contagem "· 3 visitados" no topo.
- "Perto de mim" no topo de Lugares: pede a localização, acha no mapa (Photon/OpenStreetMap, perto do destino) cada lugar salvo ainda não visitado (até 25) e lista os 8 mais perto, com distância e "Ir". Descarta o que ficou a mais de 50 km (nome igual em outra cidade).

## Não inclui (fica pra depois)
- Guardar a coordenada do lugar no banco (hoje procura na hora e guarda só enquanto a página está aberta). Entra com C3 "lugares no mapa".
- App mobile.

## Dados
- **Migration:** `supabase/migrations/20261030180000_ja_fomos.sql` — `lugares.visitado_em` + `marcar_visitado(lugar, visitado)`.

## Critérios de aceite
- [x] Qualquer um do comboio marca/desmarca; estranho não (testado no banco).
- [x] Consulta e leitura do Photon, ordem, corte de 50 km, texto da distância (testado: `ferramentas.test.mjs`).
- [ ] No celular, no destino: "Perto de mim" lista os lugares salvos com distância.
