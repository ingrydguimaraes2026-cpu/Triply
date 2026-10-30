# 058. Tela Hoje

**Fase:** 2 · **Tamanho:** M · **Depende de:** 024, 029, 040 · **Status:** Pronto pra testar (web)

## Objetivo
Uma aba **Hoje** (logo depois da Overview) que mostra só o que importa no dia: o que está acontecendo agora, o próximo compromisso com "em 25 min", onde o comboio dorme hoje (com "Ir / corrida"), o encontro do dia e as ferramentas da spec 059.

## Por que
- Catálogo J1. O pior momento pro app falhar é no meio da viagem; quem está na rua quer uma tela só.
- Lote 1 de `docs/ideias-de-outros-apps.md`: as dores são de "durante a viagem".

## Inclui
- "Hoje em Nice" + data por extenso. Fora das datas do roteiro: aviso, e as ferramentas continuam funcionando.
- **Agora** (o último item com hora que começou há até 2 h) e **Próximo** (com quanto falta), vindos da Agenda do dia (spec 029). Atualiza a cada minuto.
- **Onde dormimos hoje:** a hospedagem escolhida do destino de hoje, horário de check-in/out quando é hoje, botão "Ir / corrida".
- **Encontro** de hoje com "Ir".
- Barra de abas do celular com 9 itens (fonte 9,5 px).

## Não inclui (fica pra depois)
- Abrir sozinho na Hoje quando a viagem está acontecendo.
- Clima e último trem pra base (D9) na própria tela.
- App mobile.

## Dados
- Nenhuma mudança no banco.

## Critérios de aceite
- [x] Agora/próximo e "falta pra" (testado: `hoje.test.mjs`).
- [ ] No celular, num dia da viagem: ver o próximo trem e tocar em "Ir / corrida" da hospedagem.
