# 093. Gasto por frase ou voz

**Fase:** 8 · **Tamanho:** M · **Depende de:** 002, 009 · **Status:** Pronto pra testar (web) · sem banco

## Objetivo
No lançamento rápido (botão "+"), escrever ou **falar** o gasto numa frase: "jantar 45,50 a Ingryd pagou", e o formulário se preenche.

## Por que
- Catálogo L8. Na rua, com a mão ocupada, falar é mais rápido que digitar valor, moeda e categoria.
- Sem IA: regras simples em português. O microfone usa o reconhecimento de fala do próprio navegador (de graça).

## Inclui
- Campo "Ou escreva: …" no topo do lançamento rápido, com botão de microfone (só aparece onde o navegador suporta: Chrome, Edge, Safari).
- Entende:
  - **valor**: "12", "12,50", "12.50", "1.234,56";
  - **moeda**: reais/R$, euros/€, dólares/US$, libras/£, francos, pesos, ienes;
  - **quem pagou**: "paguei", "eu paguei", "a Ingryd pagou", "pago pela Ingryd" (pelo primeiro nome de quem está no comboio);
  - **pessoal**: "só eu", "só pra mim", "pessoal";
  - **categoria** por palavras: café, jantar, mercado → Alimentação; uber, trem → Transporte; hotel → Hospedagem; ingresso, museu → Passeios; lembrancinha, farmácia → Comprinhas;
  - **descrição**: o que sobra da frase ("Jantar restaurante").
- A linha de baixo mostra o que entendeu: "Jantar · Ingryd pagou · dividido entre todos · hoje". Dá pra corrigir nos campos antes de salvar.

## Não inclui (fica pra depois)
- Número por extenso ("doze euros"); o ditado do navegador já escreve em algarismos.
- Divisão com só algumas pessoas pela frase ("dividido com Victor").
- App mobile.

## Dados
- Sem migration.

## Critérios de aceite
- [x] Valor, moeda, quem pagou, pessoal, categoria e descrição (testado: `frase-de-gasto.test.mjs`).
- [ ] No navegador (celular, Chrome): "+" → microfone → falar "café doze e cinquenta euros" → conferir e salvar.
