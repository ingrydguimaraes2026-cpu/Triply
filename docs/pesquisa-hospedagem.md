# Pesquisa: hospedagem (18/10/2026)

Ideia do Victor: uma página pra decidir **onde o comboio vai ficar** em cada destino, com sugestões e busca no Airbnb, Booking ou Google Maps.

## O que existe de API

| Fonte | Situação | Serve? |
|---|---|---|
| **Airbnb** | Sem API pública. Acesso só por convite (empresas de gestão de imóveis). Os termos proíbem robôs e scraping. | Só link pra busca |
| **Booking.com (Demand API)** | Exige contrato de "Managed Affiliate Partner"; sem cadastro aberto nem ambiente de teste público. | Só link pra busca (ou afiliado depois) |
| **Amadeus Self-Service** | Tinha API grátis de hotéis, **desligada em 17/07/2026**. | Não |
| **Google Places** | Lista hotéis com nota e endereço. Grátis até ~5.000 buscas por mês (Text Search Pro), depois ~US$ 32 a cada 1.000. | Fase 2 (sugestões no mapa) |
| **LiteAPI** | API de hotéis com preço e disponibilidade (3 mi+ de lugares), sem contrato, com ambiente de teste. | **Fase 2 (preço real)** |
| **Travelpayouts** | Programa de afiliados (Booking, Agoda...), cadastro grátis e aberto. | Fase 2 (comissão nos links) |
| **Expedia Rapid / Hotelbeds** | Pra empresas grandes, com contrato. | Não |

## Concorrentes
- **Kayak Trip Huddle** (fora do ar): o grupo adicionava hotéis e votava de 1 a 3 corações. Não reservava, só ajudava a decidir. É o mais parecido com a nossa ideia.
- Wanderlog, Tricount, Splitwise: nenhum tem votação de hospedagem bem feita.

## Decisão (fase 1)
Sem API paga e sem depender de aprovação:
1. **Links de busca prontos** (Airbnb, Booking, Google Maps) com cidade, datas do destino e número de pessoas do comboio.
2. **Opções do comboio:** cada um cola o link do que achou, com preço; o grupo vota.
3. **Escolhida:** o ADM fecha a decisão; o app mostra preço por pessoa e por noite e lança como gasto.

## Fontes
- https://www.octoparse.com/blog/airbnb-api-data-access-options · https://www.koombea.com/blog/airbnb-api/
- https://developers.booking.com/demand/docs/getting-started/prerequisites · https://supergood.ai/api-report-card/booking-com
- https://www.phocuswire.com/amadeus-shut-down-self-service-apis-portal-developers · https://ignav.com/docs/amadeus-self-service-shutdown
- https://www.woosmap.com/blog/google-places-api-pricing · https://developers.google.com/maps/billing/gmp-pricing
- https://developers.liteapi.travel/ · https://dev.to/kouta222/complete-guide-for-individual-developers-recommended-hotel-affiliate-apis-by-region-4c1e
- https://milestomemories.boardingarea.com/trip-huddle-kayaks-new-group-travel-tool/
