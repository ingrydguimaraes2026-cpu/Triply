# 085. Tempo real

**Fase:** 7 · **Tamanho:** M · **Depende de:** 001, 002 · **Status:** Pronto pra testar (web) · banco **não aplicado**

## Objetivo
Quando outra pessoa do comboio muda algo (gasto, roteiro, transporte, lugar, hospedagem, agenda, post), a tela de quem está com a viagem aberta atualiza sozinha, sem recarregar a página.

## Por que
- Catálogo M5. Hoje, se a Ingryd lança um gasto, o Victor só vê depois de recarregar.

## Inclui
- A moldura da viagem escuta o banco (Supabase Realtime) enquanto a viagem está aberta, só da viagem aberta.
- Viagem, destinos e comboio mudaram → recarrega a moldura (todas as abas usam).
- Gastos → Financeiro e Overview recarregam (mesmo aviso que já existia).
- Trajetos, lugares, hospedagens, agenda e posts → só o que mostra aquilo.
- Vários avisos em sequência (ex.: salvar o roteiro inteiro) viram uma recarga só (espera 0,6 s).

## Não inclui (fica pra depois)
- Ver quem está online / "fulano está editando".
- Curtidas, comentários, votos, enquetes e listas ao vivo (recarregam ao abrir).
- App mobile.

## Quem pode
- O próprio Realtime confere o RLS de cada pessoa: só chega a mudança de uma linha que ela já poderia ler. Gasto pessoal de outra pessoa não chega.

## Dados
- **Migration:** `supabase/migrations/20261031100000_tempo_real.sql` — coloca 9 tabelas na publicação `supabase_realtime`. Não muda tabela nem regra.
- Cuidado: o Realtime não filtra eventos de DELETE por viagem. Quem está com uma viagem aberta recebe "apagou o id X" de qualquer viagem (só o id, sem dados) e recarrega à toa. Na escala atual não pesa. Se pesar, trocar por Broadcast disparado por trigger.

## Critérios de aceite
- [x] Lista de tabelas do site = lista da migration; filtro por viagem; o que recarrega em cada caso (testado: `tempo-real.test.mjs`).
- [ ] No navegador (dois navegadores, duas contas): lançar gasto num e ver aparecer no outro em ~1 s; mudar o roteiro e ver o mapa mudar.
