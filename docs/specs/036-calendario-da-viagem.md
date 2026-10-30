# 036. Calendário da viagem (.ics)

**Fase:** 2 · **Tamanho:** P · **Depende de:** 004, 011, 024, 029 · **Status:** Pronto pra testar (web)

## Objetivo
Um botão "Calendário" na Agenda baixa um arquivo que põe a viagem inteira no Google Agenda, no Calendário do iPhone ou no Outlook.

## Por que
- Catálogo M6, pendente desde 19/10. Quem vive pela agenda do celular quer ver o trem e o check-out lá, com o alarme do próprio celular.

## Inclui
- Arquivo `.ics` com: dias em cada destino (dia inteiro), trajetos com partida e chegada, eventos da agenda, pontos de encontro, check-in e check-out da hospedagem escolhida.
- Cada item tem um código fixo: importar de novo **atualiza** em vez de duplicar (no Apple/Outlook; o Google às vezes duplica).
- Recado com quantos itens foram no arquivo.

## Não inclui (fica pra depois)
- **Assinar** o calendário (link `webcal://` que se atualiza sozinho). Precisa de uma função no servidor com link secreto por pessoa.
- App mobile.

## Dados
- Nenhuma mudança no banco. Lê `trajetos`, `eventos_agenda`, `pontos_de_encontro`, `hospedagens` (escolhida).

## Quem pode o quê
Todo mundo do comboio baixa (vê só o que já podia ver).

## Critérios de aceite
- [x] Formato do .ics: hora UTC, hora local, dia inteiro com fim exclusivo, escape de vírgula, linhas de no máximo 75 bytes (testado: `calendario.test.mjs`).
- [ ] No navegador: Agenda → "Calendário" → abrir o arquivo no celular e ver o trem no horário certo.

## Dicas pra implementar
- Core: `packages/core/src/calendario.ts` (`gerarIcs`, `nomeDoArquivoIcs`).
- Web: `features/agenda/calendario.ts` (`baixarCalendario`).
- Evento da agenda sem fuso (hora local) vai "flutuante": aparece na mesma hora em qualquer fuso, que é o que o comboio espera.
