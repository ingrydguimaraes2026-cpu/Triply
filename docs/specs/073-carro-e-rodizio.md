# 073. Carro e rodízio de motorista

**Fase:** 2 · **Tamanho:** M · **Depende de:** 004, 035 · **Status:** Pronto pra testar (web) · banco **não aplicado**

## Objetivo
Nos trechos de carro, marcar quem dirige e ver os km estimados; no painel "Viagem inteira", o rodízio: "Rodízio no volante: Victor ~240 km · você ~120 km".

## Por que
- Catálogo D11. Road trip em grupo sempre tem alguém que dirige tudo.

## Inclui
- Formulário do trajeto de carro: "Quem dirige".
- Cartão: "Ana dirige · ~18 km". Km = linha reta entre os destinos × 1,3 (estimativa, sem API de rota).
- Resumo do rodízio por pessoa.
- Regra no core pra estimar combustível (km ÷ km/l × preço do litro), pronta pra tela de custo.

## Não inclui (fica pra depois)
- Tela de combustível e pedágio divididos (a regra existe; falta onde digitar km/l e preço).
- Reserva do carro e lembrete de devolução (use o Cofre e a Agenda por enquanto).
- App mobile.

## Dados
- **Migration:** `supabase/migrations/20261031040000_motorista.sql` — `trajetos.motorista_id` (só gente do comboio).

## Critérios de aceite
- [x] Motorista só do comboio (testado no banco).
- [x] Km estimados, combustível e rodízio (testado: `transportes-situacao.test.mjs`).
- [ ] No navegador: trecho de carro Nice → Mônaco com "Ingryd dirige".
