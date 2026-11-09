# 032. Lembretes no celular

**Fase:** 2 · **Tamanho:** M · **Depende de:** 004, 013, 024 · **Status:** Pronto pra testar (web) · banco **não aplicado**

## Objetivo
O celular avisa 1 hora antes de cada trajeto e de cada ponto de encontro: "🚆 Saída em 55 min · Nice → Mônaco. Bilhete e documentos na mão."

## Por que
- Roadmap #11 / catálogo B5. "Descumprimento de horários" é a 2ª dor da pesquisa (36,3%).
- A infraestrutura de push já existe (boletim do câmbio, feed de fotos).

## Inclui
- Push 1 h antes da **partida do trajeto** e do **horário do ponto de encontro**, pra todo o comboio que ligou os avisos no aparelho.
- Cada lembrete sai **uma vez só**. Se o horário mudar, lembra de novo no novo horário.
- Tocar no aviso abre Transportes (trajeto) ou a Overview com o ponto em destaque.
- Painel **"Avisos no celular"** no topo da gaveta Novidades: liga a notificação no aparelho e deixa desligar os lembretes (spec 033).

## Não inclui (fica pra depois)
- Antecedência escolhida por pessoa (fixo em 1 h).
- Check-out da hospedagem e eventos da agenda (entram quando tiverem hora certa com fuso).
- Lembrar só quem vai no trajeto (depende de D5 "quem vai em cada trajeto").
- App mobile nativo (push do Expo).

## Telas
- Gaveta Novidades → "Avisos no celular" (fechado mostra o estado; "Ajustar" abre). Explica iPhone sem app instalado, notificação bloqueada e navegador sem suporte.

## Dados
- **Migration:** `supabase/migrations/20261030010000_lembretes.sql`.
- `lembretes_enviados` (`tipo`, `alvo_id`, `horario`): o que já foi lembrado. Sem policies (o app não lê).
- `lembretes_a_enviar(antecedencia)`: devolve o que vence agora e já marca como enviado. Só o servidor chama.
- **Função:** `supabase/functions/lembretes` (cópia do texto de `packages/core/src/lembretes.ts`).
- **Agendamento** (fora da migration, igual ao boletim), rodar no SQL Editor depois de publicar a função:
  ```sql
  select cron.schedule('lembretes', '*/5 * * * *', $$
    select net.http_post(
      url := 'https://ltygqabtdbphtjscvuit.supabase.co/functions/v1/lembretes',
      headers := jsonb_build_object('Content-Type', 'application/json')
    );
  $$);
  ```
  Pra desligar: `select cron.unschedule('lembretes');`

## Quem pode o quê
| Ação | ADM | Membro | Quem não é do comboio |
|---|---|---|---|
| Receber lembrete da viagem | ✅ | ✅ | ❌ |
| Chamar `lembretes_a_enviar` / ler o que foi enviado | ❌ (só o servidor) | ❌ | ❌ |

## Critérios de aceite
- [x] Trajeto e ponto que vencem na próxima hora saem uma vez só (testado no banco).
- [x] Mudou o horário, lembra de novo (testado no banco).
- [x] Ninguém do app chama a função nem lê o que foi enviado (testado no banco).
- [x] Texto: emoji do meio, "em 45 min / em 1 h", link certo (testado: `lembretes.test.mjs`).
- [ ] Aplicar a migration, publicar a função, criar o agendamento e receber um lembrete de verdade no celular.

## Perguntas em aberto
- Nenhuma. Decidido: 1 h fixa; todo o comboio recebe.

## Dicas pra implementar
- Core: `packages/core/src/lembretes.ts` (`textoDoLembrete`, `faltaQuanto`).
- Web: `features/notificacoes/AvisosNoCelular.tsx`.
