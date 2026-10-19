# 012. Termômetro do câmbio

**Fase:** 2 · **Tamanho:** P · **Depende de:** 003 · **Status:** Pronto pra testar

## Objetivo
No Financeiro, mostrar se a moeda da viagem (ex.: euro) está barata ou cara em reais agora, quanto sai na Wise ou na Nomad com IOF, e avisar quando bater a meta de compra.

## Por que
Pedido do Victor (18/10/2026): saber quando o euro está barato pra comprar na Wise e na Nomad.

## Pesquisa
- **Wise:** a API de cotação só existe pra afiliado com contrato (Basic auth com client id/secret). **Nomad:** sem API pública. Então o app estima: comercial + IOF, e a pessoa cola a cotação que viu no app pra saber a taxa dele.
- **IOF 2026:** 3,5% pra comprar moeda pra gastar (conta global e cartão); 1,1% só pra investimento.
- **Cotações (grátis, sem chave, funcionam no navegador):**
  - agora: AwesomeAPI (`economia.awesomeapi.com.br/json/last/EUR-BRL`);
  - histórico de 1 ano: Frankfurter (Banco Central Europeu).

## Inclui
- Cotação comercial de agora, com selo **Barato / Na média / Caro**. A régua é o percentil nos últimos 90 dias: até 25% é barato, a partir de 75% é caro.
- Comparação com a média de 90 dias e gráfico de 6 meses.
- Números: menor e maior dos 90 dias, variação em 30 dias, sua média de compra (ou o menor do ano).
- **Na Wise ou na Nomad:** o piso (comercial + 3,5%), quanto o app cobra além do IOF (a partir da cotação que você viu) e quanto custam X euros.
- **Meta de compra:** "comprar com 1 EUR até R$ X (com IOF)". Fica guardada neste aparelho; o aviso aparece quando você abre a tela.

## Não inclui (depois)
- Notificação no celular quando bater a meta (precisa de servidor: função agendada no Supabase + Web Push).
- Cotação exata da Wise/Nomad (sem API aberta).
- Meta compartilhada com o comboio (precisa de coluna nova no banco).

## Critérios de aceite
- [ ] Com a viagem em EUR, o Financeiro mostra a cotação de agora e o selo.
- [ ] Digitar 6,10 em "cotação que você viu" mostra quanto o app cobra além do IOF.
- [ ] Meta acima do valor de hoje com IOF mostra "Bateu a meta".
- [ ] Viagem em BRL não mostra o termômetro.
- [ ] Sem internet, aparece "Tentar de novo".
