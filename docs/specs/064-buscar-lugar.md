# 064. Buscar lugar com autocompletar

**Fase:** 2 · **Tamanho:** M · **Depende de:** 016, 061 · **Status:** Pronto pra testar (web) · banco **não aplicado**

## Objetivo
Ao digitar o nome de um lugar, aparecem sugestões reais perto do destino (restaurante, museu, praça…). Escolher preenche o nome, sugere o tipo e guarda onde fica.

## Por que
- Catálogo C4. Digitar tudo à mão desanima; e com a coordenada salva o "Ir", o "Perto de mim" e (depois) o mapa ficam certos.

## Inclui
- Sugestões do Photon (OpenStreetMap) a partir de 3 letras, puxando pra perto do destino escolhido (até 6).
- Escolher: nome, tipo sugerido (restaurante/café/bar → Comida; museu/atração → Passeio) e "📍 endereço" salvo.
- O lugar passa a guardar latitude, longitude e endereço. "Ir" e "Perto de mim" usam isso direto.
- Mudar o nome à mão apaga o ponto (pra não ficar o endereço errado).

## Não inclui (fica pra depois)
- Foto, nota e horário de funcionamento (precisaria Google Places, pago).
- Pins dos lugares num mapa (C3): fica pra quando tivermos um mapa com marcadores (MapLibre, junto do C9).
- App mobile.

## Dados
- **Migration:** `supabase/migrations/20261030210000_lugar_com_coordenadas.sql` — `lugares.latitude`, `longitude`, `endereco` (latitude e longitude juntas).

## Critérios de aceite
- [x] Guarda coordenada e endereço; latitude sem longitude barrada (testado no banco).
- [x] Consulta e leitura das sugestões com tipo (testado: `ferramentas.test.mjs`).
- [ ] No navegador: Lugares → novo → digitar "Le Safari" com destino Nice e escolher a sugestão.
