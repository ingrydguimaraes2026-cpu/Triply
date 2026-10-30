# 050. Ficha da pessoa + emergência e saúde

**Fase:** 2 · **Tamanho:** P · **Depende de:** 007, 008 · **Status:** Pronto pra testar (web) · banco **não aplicado**

## Objetivo
No perfil, cada um preenche uma vez: telefone, aniversário, restrições alimentares, alergias, mobilidade e, à parte, contato de emergência, tipo sanguíneo e remédios — escolhendo quem vê a parte de saúde.

## Por que
- Catálogo F5 (ficha da pessoa) e F6 (emergência e saúde). Família é a companhia mais comum (59%); restaurante e emergência dependem disso.

## Inclui
- **Perfil → Sua ficha** (vale pra todas as viagens).
- Parte de saúde com "Quem vê": **só o ADM** (padrão), **todo o comboio** ou **ninguém**.
- **Comboio:** embaixo do nome de cada um, telefone (toque pra ligar), alergia e, se liberado, o contato de emergência e o tipo sanguíneo.
- **Comboio → Bom saber:** "Ana faz aniversário em 05/06, durante a viagem!" e as restrições do grupo pro restaurante ("Léo: alergia a amendoim").

## Não inclui (fica pra depois)
- Avisos automáticos no restaurante/agenda.
- Emergência do comboio dentro da gaveta de Emergência (spec 037).
- App mobile.

## Dados
- **Migration:** `supabase/migrations/20261030110000_ficha_da_pessoa.sql` — `fichas_pessoais` (só a pessoa lê a tabela) + `fichas_do_comboio(viagem)` (filtra a saúde por quem pede).

## Quem pode o quê
| Parte | A pessoa | ADM da viagem | Membro | Quem não é do comboio |
|---|---|---|---|---|
| Telefone, aniversário, alergias, restrições | ✅ | ✅ | ✅ | ❌ |
| Emergência e saúde | ✅ | se "ADM" ou "comboio" | se "comboio" | ❌ |

## Critérios de aceite
- [x] Comboio vê alergia; saúde só pra quem foi liberada; a pessoa sempre vê a dela; estranho não vê; ninguém lê a tabela dos outros (testado no banco).
- [x] Aniversário na viagem (inclusive no Réveillon) e restrições do grupo (testado: `ficha-pessoal.test.mjs`).
- [ ] No navegador: preencher a ficha e ver a linha embaixo do seu nome no Comboio.

## Dicas pra implementar
- Core: `packages/core/src/ficha-pessoal.ts`. Web: `features/ficha-pessoal/FormFicha.tsx` e `pages/viagem/Comboio.tsx`.
