# 091. Duplicar viagem

**Fase:** 8 · **Tamanho:** M · **Depende de:** 001, 055 · **Status:** Pronto pra testar (web) · banco **não aplicado**

## Objetivo
Copiar o planejamento de uma viagem pra uma nova: repetir a mesma rota no ano que vem, ou usar uma viagem boa como ponto de partida.

## Por que
- Catálogo N4 (duplicar e templates). Montar roteiro, transportes e lista dá trabalho; não precisa refazer.

## Inclui
- Comboio → "Duplicar viagem": nome, data de início (opcional) e "Trazer o comboio junto".
- Vai junto: roteiro (destinos), transportes, lugares, agenda, listas e tarefas.
- Com data: todas as datas e horários andam juntos (ex.: começava 20/11, agora 10/05).
- Sem data: datas em branco; a agenda não vai (cada evento precisa de dia).
- Itens copiados nascem "não feitos", sem responsável, sem motorista, lugares não visitados.
- Quem duplica vira ADM da nova. As regras de "quem edita" vêm iguais.
- Não vão: gastos, hospedagens, fotos, posts, enquetes, documentos.

## Não inclui (fica pra depois)
- Publicar como **modelo por link** pra quem não é do comboio (precisa decidir o que fica público).
- Escolher item a item o que copiar.
- App mobile.

## Quem pode
- Quem está no comboio da viagem de origem.

## Dados
- **Migration:** `supabase/migrations/20261031130000_duplicar_viagem.sql` — função `duplicar_viagem`.

## Critérios de aceite
- [x] Copia roteiro, transporte, lugar, agenda e lista; datas andam; destinos ligados aos novos; nada de gasto (testado no banco).
- [x] Sem data: datas em branco e agenda de fora; estranho não duplica (testado no banco).
- [ ] No navegador: Comboio → Duplicar viagem com data → abrir a nova e conferir Agenda e Transportes.
