# 088. A viagem em PDF

**Fase:** 7 · **Tamanho:** M · **Depende de:** 029, 004, 005, 047 · **Status:** Pronto pra testar (web) · sem banco

## Objetivo
Uma folha com a viagem inteira pra imprimir ou mandar pra família: roteiro dia a dia, transportes, hospedagens e contatos do comboio.

## Por que
- Catálogo M7. Família quer saber onde a gente vai estar; e papel não acaba a bateria.

## Inclui
- Página `/viagem/<id>/imprimir` (botão "PDF" na Agenda).
- "Imprimir ou salvar PDF" abre a impressão do navegador; lá a pessoa escolhe "Salvar como PDF". Nada de biblioteca nova.
- Roteiro dia a dia (só os dias com alguma coisa), com onde o comboio está.
- Transportes numa tabela; hospedagens escolhidas com check-in/out, endereço e como chegar.
- **Wi-Fi e código da porta só entram se marcar** "Incluir Wi-Fi e código da porta" (desligado por padrão).
- Contatos do comboio: telefone e contato de emergência (da ficha, spec 047).
- Na impressão, o menu e as abas somem.

## Não inclui (fica pra depois)
- Gerar o PDF no servidor / mandar por e-mail.
- Gastos no PDF (já tem CSV na spec 052).
- App mobile.

## Quem pode
- Quem está no comboio (mesmos dados que já vê nas abas).

## Dados
- Sem migration.

## Critérios de aceite
- [x] Roteiro dia a dia pula dias vazios e diz onde o comboio está (testado: `agenda.test.mjs`).
- [ ] No navegador: Agenda → PDF → Imprimir → Salvar como PDF; conferir que o menu não aparece e o Wi-Fi só aparece marcando.
