# 065. Datas em comum

**Fase:** 2 · **Tamanho:** M · **Depende de:** 007, 046 · **Status:** Pronto pra testar (web) · banco **não aplicado**

## Objetivo
Cada pessoa toca nos dias do calendário em que pode viajar; o app pinta onde todo mundo pode e lista as melhores janelas. O ADM toca "Usar" e a janela vira o período da viagem.

## Por que
- Catálogo A2. "Achar data em comum" trava 39% dos grupos (pesquisa Skyscanner); hoje isso vive num Doodle ou no WhatsApp.

## Inclui
- Cartão "Datas em comum" na Overview enquanto a viagem não tem datas (ou está no modo sonhando).
- Calendário por mês: toque marca/desmarca os seus dias; cor pela quantidade de gente (laranja = todo mundo), número no canto e borda nos seus.
- "x de y já marcaram".
- Até 3 janelas (2+ dias seguidos): todo mundo primeiro; se não houver, quase todo mundo (falta 1). ADM: "Usar" → muda as datas da viagem.

## Não inclui (fica pra depois)
- Marcar "talvez".
- App mobile.

## Dados
- **Migration:** `supabase/migrations/20261030220000_datas_em_comum.sql` — `disponibilidades` (viagem, pessoa, dia).

## Quem pode o quê
| Ação | ADM | Membro | Fora do comboio |
|---|---|---|---|
| Ver os dias de todos | ✅ | ✅ | ❌ |
| Marcar/desmarcar os próprios | ✅ | ✅ | ❌ |
| Usar a janela como período | ✅ | ❌ | ❌ |

## Critérios de aceite
- [x] Cada um marca os próprios; comboio vê; estranho não; ninguém apaga dia dos outros (testado no banco).
- [x] Janelas: todos, quase todos, virada de mês, mínimo de dias (testado: `datas-em-comum.test.mjs`).
- [ ] No navegador com 2 contas: marcar dias e ver a janela em comum; ADM usa e a viagem ganha as datas.
