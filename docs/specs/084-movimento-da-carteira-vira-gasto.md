# 084. Movimento da carteira vira gasto do comboio

**Fase:** 2 · **Tamanho:** P · **Depende de:** 002, 015 · **Status:** Pronto pra testar (web) · banco **não aplicado**

## Objetivo
Uma compra lida do e-mail do Wise/Nomad (carteira de euro, spec 015) pode virar **gasto do comboio** com um toque, já preenchida, e fica marcada pra não ser lançada duas vezes.

## Por que
- Catálogo H17: hoje a carteira mostra a compra, mas a pessoa precisa digitar tudo de novo no Financeiro.

## Inclui
- Na lista de movimentos da carteira, cada **gasto** sem ligação ganha "Virar gasto do comboio".
- O botão abre o formulário de gasto preenchido: descrição, valor, moeda e data do movimento, categoria "Outros", pago por mim. A pessoa ajusta a divisão e salva.
- Ao salvar, o movimento fica ligado ao gasto e mostra "já é gasto do comboio".
- Se o gasto for apagado, a ligação some e o botão volta.

## Não inclui (fica pra depois)
- Virar gasto automaticamente (sem a pessoa confirmar).
- Entradas (recarga) virando compra de moeda.
- App mobile.

## Quem pode
- Só o dono da carteira liga um movimento, e só a um gasto **dele**, da **mesma viagem** (função `ligar_movimento_ao_gasto`).

## Dados
- **Migration:** `supabase/migrations/20261031090000_movimento_vira_gasto.sql` — `movimentos_carteira.gasto_id` + função `ligar_movimento_ao_gasto`.

## Critérios de aceite
- [x] Só o dono liga; gasto de outra pessoa é recusado; apagar o gasto desfaz a ligação (testado no banco).
- [ ] No navegador: tocar "Virar gasto do comboio" numa compra, salvar e ver "já é gasto do comboio" + o gasto na lista.
