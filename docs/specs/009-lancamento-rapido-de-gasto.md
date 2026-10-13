# 009. Lançamento rápido de gasto

**Fase:** 2 · **Tamanho:** M · **Depende de:** 002 · **Status:** A fazer

## Objetivo
Lançar um gasto em menos de 10 segundos pelo celular, no meio da viagem, sem precisar navegar até o Financeiro.

## Por que
O maior problema levantado no áudio: "Você pararia pra fazer isso no meio da viagem?" O Victor disse que não; a Ingryd faria só à noite, no hotel. Se lançar gasto for chato, o Financeiro inteiro perde o valor. A leitura automática de e-mail do banco ficou como ideia de Fase 3; esta spec é o caminho simples primeiro.

## Inclui
- **Botão flutuante "+"** em todas as abas da viagem, no celular, que abre direto o "lançar gasto" já no valor.
- **Teclado numérico** já aberto; valor, categoria (um toque) e "Salvar". O resto usa o padrão:
  - quem pagou = eu;
  - dividir = todos;
  - data = hoje;
  - moeda = a última usada.
- **"Detalhes depois":** o gasto fica com um selo "completar" e a pessoa ajusta à noite.
- **Atalho do PWA:** item "Lançar gasto" ao segurar o ícone do app na tela inicial (manifest `shortcuts`).
- **Funcionar sem internet:** guardar no celular e enviar quando a conexão voltar.

## Não inclui
- Leitura de e-mail, foto de nota fiscal ou SMS do banco (Fase 3).
- Voz.

## Telas
- **Botão "+"** laranja, fixo acima da barra de abas, à direita.
- **Gaveta:** valor gigante, os 6 ícones de categoria, "Salvar". Embaixo, um link "mais detalhes" que abre o formulário completo da spec 002.
- **Na lista do Financeiro:** um selo "completar" nos gastos lançados rápido.

## Dados
- Usa a tabela `gastos` (spec 002). Pra o selo "completar", criar uma coluna `rascunho boolean` (migration nova) ou definir que descrição vazia = completar.
- **Sem internet:** fila no `localStorage` ou no IndexedDB, enviada quando o navegador voltar a ficar online (evento `online`).

## Quem pode o quê
O mesmo da spec 002.

## Critérios de aceite
- [ ] Do Overview no celular até o gasto salvo: 3 toques e o valor digitado, em menos de 10 segundos.
- [ ] Gasto lançado rápido aparece no Financeiro com o selo "completar".
- [ ] No modo avião, lançar o gasto, voltar a internet: ele é enviado sozinho, uma vez só (sem duplicar).
- [ ] Com o app instalado, segurar o ícone mostra "Lançar gasto".

## Perguntas em aberto
- Moeda padrão: a última usada ou a do país do destino de hoje (spec 001)?
- O botão "+" aparece também no computador?

## Dicas pra implementar
- Atalho do PWA: `shortcuts` no `manifest` do `vite.config.ts`.
- Pra não duplicar o envio sem internet, gere o `id` do gasto no celular (`crypto.randomUUID()`) e use `upsert`.
