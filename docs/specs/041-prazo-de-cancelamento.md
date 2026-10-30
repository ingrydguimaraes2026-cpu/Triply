# 041. Prazo de cancelamento grátis da hospedagem

**Fase:** 2 · **Tamanho:** P · **Depende de:** 011, 032 · **Status:** Pronto pra testar (web) · banco **não aplicado**

## Objetivo
Cada opção de hospedagem pode guardar "cancelamento grátis até tal dia". O cartão mostra quantos dias faltam e, na escolhida, o comboio recebe um lembrete no celular 2 dias antes.

## Por que
- Catálogo E10. Perder o prazo de cancelamento grátis custa caro e é comum quando ainda se está decidindo.

## Inclui
- Campo "Cancelamento grátis até" no formulário da opção.
- No cartão: "Cancelamento grátis até 12/11 · faltam 2 dias" (laranja quando faltam 3 dias ou menos; "é hoje!"); depois do prazo, "acabou em…".
- Lembrete push (spec 032) uma vez, 2 dias antes, só da hospedagem escolhida.

## Não inclui (fica pra depois)
- Aviso de pagamento restante (sinal/saldo no check-in) — entra com H13 "gastos planejados".
- App mobile.

## Dados
- **Migration:** `supabase/migrations/20261030060000_prazo_de_cancelamento.sql` — `hospedagens.cancelamento_gratis_ate`; `lembretes_a_enviar` recriada com o tipo `cancelamento`.

## Critérios de aceite
- [x] Lembra só da escolhida, 2 dias antes, uma vez; data absurda barrada (testado no banco).
- [x] Texto do lembrete e níveis tranquilo/perto/hoje/passou (testado: `lembretes.test.mjs`).
- [ ] No navegador: editar a opção escolhida com prazo daqui a 2 dias e ver o aviso laranja.

## Dicas pra implementar
- Core: `prazoDeCancelamento` e o tipo `cancelamento` em `textoDoLembrete` (`packages/core/src/lembretes.ts`); a cópia na função `lembretes` também.
