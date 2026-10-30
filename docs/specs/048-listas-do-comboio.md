# 048. Listas do comboio: quem leva e compras

**Fase:** 2 · **Tamanho:** P · **Depende de:** 002, 007 · **Status:** Pronto pra testar (web) · banco **não aplicado**

## Objetivo
Duas listas compartilhadas na Overview: **Quem leva** (adaptador, secador, kit remédio…) e **Compras** (mercado da casa), cada item com dono e "feito".

## Por que
- Catálogo I8 (evita 5 secadores e nenhum adaptador) e I10 (lista de compras com "lançar como gasto").

## Inclui
- Abas "Quem leva" e "Compras" com contagem de pendentes.
- Item: marcar feito, escolher quem fica com ele ("Eu", nome ou "Ninguém"), apagar (autor ou ADM).
- Sugestões rápidas na "Quem leva" (adaptador, carregador portátil, kit remédio, secador…).
- Compras com quantidade ("2", "1 kg") e botão **"Lançar o que foi comprado como gasto"** (descrição "Compras: Água (2), Pão", categoria Alimentação).
- Resumo "3 de 5 garantidos · 1 sem ninguém".

## Não inclui (fica pra depois)
- Mala individual (I7, Fase 5).
- Aviso no celular quando alguém te passa um item.
- App mobile.

## Dados
- **Migration:** `supabase/migrations/20261030100000_listas_do_comboio.sql` — `itens_lista` (lista `levar`/`compras`).

## Quem pode o quê
| Ação | ADM | Membro | Quem não é do comboio |
|---|---|---|---|
| Ver, criar, marcar, passar pra alguém | ✅ | ✅ | ❌ |
| Apagar | ✅ todos | ✅ os que criou | ❌ |

## Critérios de aceite
- [x] Comboio cria e marca; só passa pra gente do comboio; lista e autor não mudam; tipo inventado barrado; só autor/ADM apaga (testado no banco).
- [x] Resumo, ordem e descrição do gasto (testado: `listas.test.mjs`).
- [ ] No navegador: tocar "Adaptador de tomada", escolher "Eu", marcar feito.

## Dicas pra implementar
- Core: `packages/core/src/listas.ts`. Web: `features/listas/ListasDoComboio.tsx`.
