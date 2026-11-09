# 063. Vibe da hospedagem + hostels na busca

**Fase:** 2 · **Tamanho:** P · **Depende de:** 011 · **Status:** Pronto pra testar (web) · banco **não aplicado**

## Objetivo
Cada opção de hospedagem ganha etiquetas rápidas ("Social", "Tranquilo", "Seguro", "Bem localizado"…) e a nota do site, pra o comboio comparar a "vibe" antes de votar. E a busca pronta ganha um botão de hostels.

## Por que
- Catálogo E11, ideia do Hostelworld (lote 1 de `docs/ideias-de-outros-apps.md`): "as avaliações me ajudaram a escolher lugares seguros e bem localizados; dava pra ver a vibe".

## Inclui
- Formulário da opção: até 4 etiquetas de uma lista fixa e nota de 0 a 10.
- Cartão: "★ 8,7 · Social · Barato".
- Busca pronta: botão "Hostels" (busca do Hostelworld na cidade) ao lado de Airbnb e Booking.

## Não inclui (fica pra depois)
- Puxar a nota e a foto sozinho do link (E9, Fase 5).
- App mobile.

## Dados
- **Migration:** `supabase/migrations/20261030200000_vibe_da_hospedagem.sql` — `hospedagens.etiquetas` (lista fixa, até 4) e `nota` (0–10).

## Critérios de aceite
- [x] Etiquetas só da lista e até 4; nota de 0 a 10 (testado no banco).
- [x] Link de hostels e nomes das etiquetas (testado: `hospedagem.test.mjs`).
- [ ] No navegador: marcar "Social" e nota 8,7 numa opção e ver no cartão.
