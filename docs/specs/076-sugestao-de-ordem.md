# 076. Sugestão de ordem do roteiro

**Fase:** 2 · **Tamanho:** M · **Depende de:** PR #3 (editor do roteiro) · **Status:** Pronto pra testar (web)

## Objetivo
Ao editar o roteiro (ainda sem datas), se a ordem estiver em zigue-zague, o app sugere uma ordem com menos deslocamento e diz quanto economiza e de onde vem a conta.

## Por que
- Catálogo B9. A estrutura (`SugestaoDeOrdem`, com fonte obrigatória) já estava pronta em `features/destinos/ordem.ts`.

## Inclui
- "Sugestão de ordem: Roma → Florença → Milão → Veneza. Essa ordem anda uns 250 km a menos. Fonte: distância em linha reta…" + "Usar essa ordem" (só muda o rascunho; salvar continua com a pessoa).
- O primeiro destino fica onde está (é de onde se parte). Destino sem coordenada vai pro fim.
- Só aparece se economizar pelo menos 30 km e 10%, e só enquanto o roteiro não tem datas (com datas, a ordem é a do calendário).

## Não inclui (fica pra depois)
- Tempo real de trem/voo (precisaria de API; a regra proíbe inventar).
- Ordem dos lugares dentro do dia.

## Dados
- Nenhuma mudança no banco.

## Critérios de aceite
- [x] Vizinho mais perto a partir do primeiro, limiar de economia, sem coordenada no fim (testado: `ordem.test.mjs`).
- [ ] No navegador: roteiro Roma, Milão, Florença, Veneza sem datas → Editar → ver a sugestão e usar.
