# 070. Programação em paralelo

**Fase:** 2 · **Tamanho:** M · **Depende de:** 029 · **Status:** Pronto pra testar (web) · banco **não aplicado**

## Objetivo
Um evento da agenda pode ser só de parte do comboio: "Museu Matisse · só Ana, você" enquanto o resto tem outro plano no mesmo horário.

## Por que
- Catálogo B4. "Ritmos diferentes" incomodam 36,1% dos grupos; trilhas paralelas evitam rachar o grupo.

## Inclui
- Formulário do evento: "Quem vai" (caixinhas). Ninguém ou todo mundo marcado = o comboio inteiro.
- Agenda: "só Ana, você" embaixo do evento.

## Não inclui (fica pra depois)
- Filtrar a agenda só com o que é meu.
- Reencontro marcado automaticamente (use o ponto de encontro, spec 024).
- App mobile.

## Dados
- **Migration:** `supabase/migrations/20261031020000_programacao_em_paralelo.sql` — `eventos_agenda.participantes` + gatilho (só comboio, sem repetir).

## Critérios de aceite
- [x] Participantes só do comboio, sem repetir (testado no banco).
- [ ] No navegador: criar "Museu" só com 2 pessoas e "Praia" com o resto no mesmo horário.
