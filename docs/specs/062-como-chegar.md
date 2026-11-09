# 062. Transfer de chegada ("como chegar")

**Fase:** 2 · **Tamanho:** P · **Depende de:** 026, 058 · **Status:** Pronto pra testar (web) · banco **não aplicado**

## Objetivo
No guia da casa, um campo "Como chegar do aeroporto ou da estação" (ônibus, preço, onde pegar). No dia da chegada, aparece na tela Hoje junto do "Ir / corrida".

## Por que
- Catálogo D12. A primeira hora no país novo é a mais confusa; a instrução que o anfitrião mandou se perde no e-mail.

## Inclui
- Campo novo no formulário do guia da casa (até 1000 caracteres, quebra de linha respeitada).
- Guia mostra "Como chegar (aeroporto/estação)".
- Hoje, no dia da chegada no destino: "Como chegar: …" dentro de "Onde dormimos hoje".

## Não inclui (fica pra depois)
- Opções e preços automáticos (Rome2Rio etc.).
- App mobile.

## Dados
- **Migration:** `supabase/migrations/20261030190000_como_chegar.sql` — `hospedagens.como_chegar`.

## Critérios de aceite
- [x] Guarda e respeita o limite (testado no banco).
- [ ] No navegador: preencher no guia e ver na Hoje no dia da chegada.
