# 042. Resumo da noite

**Fase:** 2 · **Tamanho:** P · **Depende de:** 029, 032, 033 · **Status:** Pronto pra testar (servidor) · banco **não aplicado**

## Objetivo
Por volta das 21h (hora do destino), o celular de cada um recebe: "🌙 Amanhã em Roma · começa 08:30 — 08:30 Encontro: Recepção · 09:10 Trem Nice → Roma · 20:00 Jantar".

## Por que
- Catálogo G6. Resolve "descumprimento de horários" (36,3%) sem ninguém precisar abrir o app à noite.

## Inclui
- Função `resumo-da-noite`, chamada de hora em hora. Pra cada viagem acontecendo, calcula a hora no destino de hoje e manda às 20h ou 21h, **uma vez por noite**.
- Junta trajetos, pontos de encontro e eventos da agenda de amanhã (até 4, "+ N"), e a chegada num destino novo.
- Sem nada marcado amanhã: não manda.
- Respeita "Resumo da noite" desligado nas preferências (spec 033). Tocar abre a Agenda.

## Não inclui (fica pra depois)
- Clima no resumo (a função não busca previsão ainda).
- Fuso exato: usamos a longitude (15° = 1 h), sem horário de verão. Erra no máximo 1 hora; por isso aceita 20h ou 21h.
- App mobile nativo.

## Dados
- **Migration:** `supabase/migrations/20261030070000_resumo_da_noite.sql` — `resumos_enviados` + `marcar_resumo`.
- **Agendamento** (SQL Editor, depois de publicar a função):
  ```sql
  select cron.schedule('resumo-da-noite', '5 * * * *', $$
    select net.http_post(
      url := 'https://ltygqabtdbphtjscvuit.supabase.co/functions/v1/resumo-da-noite',
      headers := jsonb_build_object('Content-Type', 'application/json')
    );
  $$);
  ```

## Critérios de aceite
- [x] Um resumo por viagem por dia; o app não chama nem lê (testado no banco).
- [x] Fuso pela longitude, ordem por hora, chegada, nada marcado = sem push (testado: `resumo.test.mjs`).
- [ ] Publicar a função, criar o agendamento e receber o resumo de verdade.

## Dicas pra implementar
- Core: `packages/core/src/resumo.ts` (sem imports, copiado na função).
