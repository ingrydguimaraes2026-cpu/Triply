# 013. Boletim do câmbio no celular (antes: aviso quando bate a meta)

**Fase:** 2 · **Tamanho:** M · **Depende de:** 012 · **Status:** Código pronto (falta publicar: veja "Pra ligar")

## Objetivo
A pessoa define uma meta ("1 EUR até R$ 5,85 com IOF") e recebe uma notificação no celular quando a cotação chega lá.

## Como funciona
1. **Meta:** fica no banco (`metas_cambio`), uma por pessoa, viagem e moeda.
2. **"Avisar no celular quando bater":** o navegador pede permissão e inscreve o aparelho no Web Push. A inscrição vai pro banco (`push_inscricoes`, pela função `registrar_push`).
3. **A cada 30 min**, um agendamento (pg_cron) chama a função `avisos-cambio`:
   - busca a cotação comercial (AwesomeAPI) e soma o IOF de 3,5%;
   - cruzou a meta pra baixo → manda a notificação e marca `abaixo = true`, pra não repetir;
   - voltou a subir 0,3% acima da meta → rearma.
4. Tocar na notificação abre o Financeiro da viagem.
5. Botão **"Testar"** manda uma notificação de teste pros meus aparelhos.

## Arquivos
- Banco: `supabase/migrations/20261018150000_avisos_cambio.sql`
- Servidor: `supabase/functions/avisos-cambio/` (`index.ts`; `regras.ts`, puro e testado)
- Aparelho: `public/sw-push.js` (carregado pelo service worker, `vite.config.ts`)
- App: `src/features/cambio/avisos.ts` e `AvisoDeMeta.tsx`

## Pra ligar (uma vez)
1. Aplicar a migration.
2. Publicar a função `avisos-cambio` no Supabase.
3. Colocar o segredo `VAPID_PRIVATE_KEY` na função (Supabase → Edge Functions → Secrets). A chave pública já está no código.
4. Criar o agendamento de 30 min (SQL com `cron.schedule`; não está numa migration de propósito).
5. Publicar o app num endereço https (ex.: Vercel). No computador, dá pra testar com `npm run build` e `npm run preview`.

## Limitações
- iPhone: só com o app instalado na tela de início (iOS 16.4+).
- O aviso chega em até 30 min depois de bater a meta.

## Critérios de aceite
- [ ] Salvar a meta, ligar o aviso e tocar em "Testar": chega a notificação.
- [ ] Meta acima da cotação de hoje com IOF: na próxima checagem chega "EUR bateu sua meta", só uma vez.
- [ ] Ninguém vê a meta nem os aparelhos de outra pessoa (testado no banco).

## Revisão (18/10/2026): boletim no lugar da meta
Pedido do Victor: o comboio não sabe que meta pôr, então em vez de "avisar quando bater a meta" o app manda um **boletim às 12h e às 20h** (horário de Brasília).
- O boletim diz quanto o euro está com IOF, quanto subiu ou caiu desde o último aviso e se está barato, na média ou caro em relação aos últimos 90 dias (a mesma régua do termômetro).
- A tela tem só "Receber boletim do euro", "Testar" e "Parar boletim". A meta saiu da tela. No banco ela virou opcional (migration `20261018160000_boletim_cambio.sql`).
- O agendamento é `cron.schedule('boletim-cambio', '0 15,23 * * *', …)`, rodado no SQL Editor. Pra desligar: `select cron.unschedule('boletim-cambio');`.
- Se a AwesomeAPI recusar o servidor, a função usa a cotação do Banco Central Europeu (Frankfurter).
