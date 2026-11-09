# 086. Marcações sem internet

**Fase:** 7 · **Tamanho:** M (parte do G) · **Depende de:** 009, 034, 048, 061 · **Status:** Pronto pra testar (web) · sem banco

## Objetivo
Sem internet (avião, metrô, roaming desligado), marcar item da **lista do comboio**, da **mala** e **tarefa** continua funcionando: a marcação fica guardada no celular e sobe sozinha quando a conexão volta. Os gastos já faziam isso (spec 009).

## Por que
- Catálogo M4 (gravar offline para tudo, não só o gasto). Esta spec cobre as marcações, que é o que mais se faz sem sinal. Criar e editar outras coisas sem internet fica pra depois.

## Inclui
- Marcou sem internet: a tela mostra marcado na hora e não dá erro.
- A fila fica no próprio aparelho (localStorage). Ao reabrir a tela, as marcações pendentes aparecem por cima do que veio do banco/cache.
- Quando a conexão volta (ou ao abrir a viagem), envia tudo, na ordem em que a pessoa fez.
- **Regra de conflito:**
  - marcar e desmarcar o mesmo item várias vezes vira uma mudança só (vale a última);
  - ao enviar, vale a marcação do celular (é o que a pessoa fez por último);
  - item apagado enquanto isso: a marcação é descartada;
  - o banco recusou (ex.: saiu do comboio): descarta e não tenta mais.
- A faixa "Sem internet" avisa que marcações também ficam guardadas.
- **Novo item na lista do comboio** (compras, quem leva) também funciona sem internet: o id nasce no aparelho, o item aparece na hora e sobe quando a conexão volta (antes das marcações; mandar duas vezes não duplica).

## Não inclui (fica pra depois)
- Criar itens da mala, lugares, transportes e editar textos sem internet.
- Comparar com a hora da mudança de outra pessoa (hoje vence quem envia por último).
- App mobile.

## Quem pode
- O mesmo de antes: o envio usa as regras do banco (RLS) de sempre.

## Dados
- Sem migration. Chave `together:fila-marcacoes` no aparelho.

## Critérios de aceite
- [x] Juntar marcações do mesmo item, ordem de envio, sobrepor pendentes na tela; item criado sem internet aparece sem repetir (testado: `fila-offline.test.mjs`).
- [ ] No navegador: DevTools → Network → Offline; marcar 2 itens da mala; recarregar (continuam marcados); voltar Online; ver no outro aparelho.
