# 044. Decisões registradas

**Fase:** 2 · **Tamanho:** P · **Depende de:** 021 · **Status:** Pronto pra testar (web) · banco **não aplicado**

## Objetivo
Enquete fechada vira **decisão**: o cartão mostra "Decidido: Pizza · 12/11" (ou "Empate: Pizza e Sushi").

## Por que
- Catálogo A7. Depois de votar, o comboio esquece o que decidiu e a discussão volta no WhatsApp.

## Inclui
- Data de fechamento gravada pelo banco (o app não escolhe a data). Reabrir limpa.
- Faixa "Decidido: X · data" ou "Empate: X e Y" na enquete fechada (sem votos: nada).

## Não inclui (fica pra depois)
- Preencher o módulo certo com a decisão (datas, destino, hospedagem).
- Lista separada de "histórico de decisões" na Overview (por enquanto, as fechadas ficam na lista de enquetes).
- App mobile.

## Dados
- **Migration:** `supabase/migrations/20261030080000_decisoes_registradas.sql` — `enquetes.fechada_em` + gatilho.

## Critérios de aceite
- [x] Fechar carimba a data (mesmo que o app mande outra); editar a pergunta não muda; reabrir limpa (testado no banco).
- [x] Vencedora, empate e sem votos (testado: `decisoes.test.mjs`).
- [ ] No navegador: votar, fechar a enquete e ver "Decidido".

## Dicas pra implementar
- Core: `packages/core/src/decisoes.ts` (`resultadoDaEnquete`).
