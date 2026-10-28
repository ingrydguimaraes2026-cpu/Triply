# 003. Financeiro: orçamento e câmbio

**Fase:** 1 · **Tamanho:** M · **Depende de:** 002 · **Status:** A fazer

## Objetivo
1. O ADM define quanto o comboio quer gastar em cada categoria, e o app mostra quanto já foi usado.
2. Cada pessoa registra as compras de moeda (ex.: real → euro). O app mostra a cotação média que ela pagou e se o dinheiro está "rendendo" em relação à cotação de hoje.

## Por que
O câmbio é um dos 3 diferenciais do benchmark: os outros apps só convertem pela cotação do dia. Do áudio: "mostrar quanto cada um tem da moeda que comprou" e "se a gente está fazendo o dinheiro valer a pena". O orçamento por categoria também veio do áudio (transporte, hospedagem, comprinhas).

## Inclui
- **Orçamento:** valor por categoria, na moeda da viagem. Barra de progresso com o gasto real (da spec 002) e alerta acima de 80% e de 100%.
- **Os 3 números do topo:** orçamento total, gasto até agora e cotação média. Os cartões já existem, hoje com "—".
- **Câmbio:**
  - registrar compra de moeda (quanto pagou em reais, quanto recebeu na outra moeda, data);
  - mostrar a cotação média ponderada por pessoa e do comboio;
  - quanto cada um tem de cada moeda;
  - comparação com a cotação de hoje.
- **Converter os gastos** pra moeda da viagem nos totais, usando a cotação média do comboio. Se não tiver compra registrada, usar a cotação do dia.

## Não inclui
- Saldo restante de moeda descontando o que cada um gastou. Seria legal, mas depende de saber quem gastou em espécie e quem gastou no cartão. Fica pra depois.
- Histórico de cotação em gráfico.

## Telas
- **Financeiro → Por categoria** (já existe o visual): cada barra fica preenchida. O ADM vê "Definir orçamento".
- **Financeiro → Câmbio:** um cartão novo com a lista de compras de moeda, "Registrar compra", a cotação média e o "rendendo bem / mal".
  - Exemplo: "Vocês compraram € a R$ 6,12 em média. Hoje está R$ 6,30: compraram 2,9% mais barato."

## Dados (já existem no banco)
- **`orcamentos`:** `viagem_id`, `categoria`, `valor_meta`, `moeda`. Uma linha por categoria; só o ADM edita.
- **`compras_cambio`:** `usuario_id`, `moeda_origem`, `moeda_destino`, `valor_origem`, `valor_destino`, `data`. A `cotacao` é calculada pelo banco.
  - Cada pessoa lança e edita as suas compras; o comboio inteiro vê todas.
- **Cotação de hoje:** API grátis Frankfurter, sem chave: `https://api.frankfurter.dev/v1/latest?base=EUR&symbols=BRL`. Guarde em memória por algumas horas.

## Quem pode o quê
| Ação | ADM | Membro |
|---|---|---|
| Definir orçamento | sim | não |
| Ver orçamento | sim | sim |
| Registrar compra de moeda | sim (as próprias) | sim (as próprias) |
| Ver compras de moeda | todas do comboio | todas do comboio |

## Critérios de aceite
- [ ] O ADM define "Hospedagem € 800". Com € 600 de gastos de hospedagem, a barra mostra 75%.
- [ ] Passar de 100% deixa a barra laranja com o aviso "estourou € X".
- [ ] Registrar "R$ 3.060 → € 500" mostra a cotação 6,12.
- [ ] Duas compras (6,00 e 6,24, mesmos valores) mostram a média ponderada certa.
- [ ] Sem internet, a cotação de hoje some com "indisponível agora" e o resto continua funcionando.
- [ ] O membro não vê o botão de definir orçamento.

## Perguntas em aberto
- O orçamento é do comboio inteiro ou por pessoa? (Sugestão: do comboio, e a tela mostra "por pessoa" dividindo pelo número de membros.)
- Comprinhas (gasto pessoal) contam no orçamento do comboio? (Sugestão: não.)
- Qual cotação usar pra converter os gastos: a média do comboio ou a de quem pagou?

## Dicas pra implementar
- Arquivos: `src/features/financeiro/` e `src/features/cambio/` (os READMEs já existem).
- A média ponderada é a soma de `valor_origem` dividida pela soma de `valor_destino`. Faça como função pura e teste.
- A cotação do Frankfurter vem como "1 EUR = X BRL". Cuidado pra não inverter.
