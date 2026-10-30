# 092. Detector de furos

**Fase:** 8 · **Tamanho:** M · **Depende de:** 001, 004, 005 · **Status:** Pronto pra testar (web) · sem banco

## Objetivo
Um cartão na Overview que junta o que pode dar errado no plano: "2 noites sem hospedagem em Nice", "Falta o transporte Nice → Mônaco", "o check-out é 22/11, mas vocês ficam até 23/11".

## Por que
- Catálogo L3. Os avisos estavam espalhados (Hospedagem, Transportes). Juntos, viram uma lista do que resolver.
- Sem IA: são regras simples sobre o roteiro, os transportes e as hospedagens escolhidas.

## Inclui
- Furos procurados:
  - destino sem datas;
  - noites sem hospedagem escolhida;
  - hospedagem escolhida que não cobre todas as noites (check-in depois de chegar, check-out antes de sair);
  - sair da cidade antes do check-out (paga noite que não usa);
  - falta transporte entre destinos seguidos;
  - trajetos que se atropelam (o próximo sai antes do anterior chegar);
  - destinos sobrepostos e buraco entre destinos (noites sem destino).
- Os graves primeiro (borda laranja). Toque leva pra aba onde resolve.
- Aparece até o fim da viagem; some quando não há furo.

## Não inclui (fica pra depois)
- Conexão curta (já avisa em Transportes, spec 080), passaporte vencendo (já avisa em Documentos, spec 038).
- Ingresso sem horário.
- Aviso no celular.

## Dados
- Sem migration.

## Critérios de aceite
- [x] Plano redondo sem furo; cada tipo de furo com o texto certo (testado: `furos.test.mjs`).
- [ ] No navegador: tirar a hospedagem escolhida de um destino e ver o furo na Overview; tocar e cair na aba Hospedagem.
