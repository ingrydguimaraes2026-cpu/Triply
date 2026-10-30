# 035. Situação e preço do trajeto

**Fase:** 2 · **Tamanho:** P · **Depende de:** 002, 004 · **Status:** Pronto pra testar (web) · banco **não aplicado**

## Objetivo
Cada trajeto mostra se ainda é **sugestão**, se já foi **reservado** ou **comprado**, e quanto custa. Com preço, vira gasto com um toque.

## Por que
- Catálogo D4, pendente desde a reunião de 19/10. O comboio não sabia o que já estava pago.

## Inclui
- No formulário do trajeto (ADM): situação (Sugestão / Reservado / Comprado), preço pro comboio e moeda (padrão: moeda da viagem).
- No cartão: selo da situação, preço e "Lançar como gasto" (só reservado/comprado com preço). Abre o formulário de gasto já preenchido (descrição "Trem: Nice → Mônaco", valor, moeda, categoria Transporte, data da partida).
- No painel "Viagem inteira": "2 de 5 comprados · falta pagar € 75,60 · 1 sem preço".
- Bate-e-volta: o preço fica só na ida (pra não contar em dobro).

## Não inclui (fica pra depois)
- Preço por pessoa ou por passageiro (depende de D5).
- Marcar o gasto como ligado ao trajeto (o botão só pré-preenche).

## Dados
- **Migration:** `supabase/migrations/20261030030000_situacao_e_preco_do_trajeto.sql` (`situacao`, `preco`, `moeda` em `trajetos`; preço exige moeda).

## Quem pode o quê
| Ação | ADM | Membro |
|---|---|---|
| Ver situação e preço | ✅ | ✅ |
| Mudar situação e preço | ✅ | ❌ |
| Lançar como gasto | ✅ | ✅ |

## Critérios de aceite
- [x] Nasce como sugestão; ADM marca comprado com preço; preço sem moeda e situação inventada são barrados; membro não muda (testado no banco).
- [x] Resumo "x de y comprados" e quanto falta por moeda (testado: `transportes-situacao.test.mjs`).
- [ ] No navegador: editar um trajeto, marcar comprado com € 45,50 e lançar como gasto.

## Dicas pra implementar
- Core: `packages/core/src/transportes.ts`. Valores do resumo em **centavos**, como o resto do app.
