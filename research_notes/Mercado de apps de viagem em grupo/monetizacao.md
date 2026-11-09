# Monetização de apps de planejamento e viagem em grupo (foco: "Together", Brasil, 2026)

Nota de método: 16 buscas web (sem fetch de páginas completas). Muitos números vêm de agregadores/sites concorrentes, não de páginas oficiais; isso está sinalizado em cada item. Verificar nas páginas oficiais antes de usar em pitch/plano financeiro.

## 1. Assinaturas: o que é grátis vs pago, preços, por usuário vs por viagem

### Takeaway
Freemium com assinatura anual barata (US$ 40–50/ano) é o padrão em planejadores (Wanderlog, TripIt) e em divisão de contas (Splitwise). Mas os maiores do nicho "grupo" monetizam fora da assinatura: Polarsteps vive de livro impresso + afiliados, Tricount virou funil gratuito de banco (bunq), Mindtrip é grátis e vive de comissão. Nenhuma fonte encontrada mostra cobrança "por viagem" em app de consumidor; a cobrança por viagem/transação aparece no B2B (organizadores).

### Cited Findings
- Wanderlog Pro: ~US$ 39,99/ano ou US$ 16,99/mês (rastreador de preços, verificado jul/2026); App Store mostra também planos mensais de US$ 5,99 e anuais até US$ 59,99, e preços locais em reais — [Recurdash](https://recurdash.com/subscription-pricing/wanderlog); [AppPricingLab](https://apppricinglab.com/iap/apple/1476732439); [App Store BR](https://apps.apple.com/BR/app/id1476732439)
- Wanderlog Pro inclui integração TripAdvisor, exportar para Google Maps, ligação com Gmail; offline e exportação em PDF ficam no pago (fonte concorrente) — [Recurdash](https://recurdash.com/subscription-pricing/wanderlog); [Pilot (concorrente)](https://www.pilotplans.com/compare/wanderlog-alternative)
- Splitwise: desde fim de 2023 o grátis limita lançamentos por dia (relatos de 3 a 4 gastos/dia, com espera de 10 s); Pro custa US$ 5/mês ou US$ 40/ano nos EUA (Rs 149/mês ou Rs 999/ano na Índia); Pro = gastos ilimitados, conversão de moeda, leitura de recibo — [IT Voice](https://www.itvoice.in/splitwise-has-introduced-restrictions-on-the-number-of-free-expenses-users-can-add); [Kittysplit (concorrente)](https://www.kittysplit.com/en/splitwise-alternative)
- Tricount: antes do bunq era grátis com anúncios + Premium (estatísticas, export CSV); após aquisição pelo bunq (2022), o Premium foi encerrado e o app novo é "grátis para todos", integrado ao cartão bunq; assinantes Premium ganharam 6 meses de plano bunq (valor €59,94) — [Tricount help](https://help.tricount.com/articles/what-happened-with-tricount-premium); [Tricount](https://tricount.com/en/what-happened-with-premium)
- Racional da aquisição: Tricount tem grande audiência mas pouca receita por usuário; serve de topo de funil para produtos do bunq — [TechCrunch](https://techcrunch.com/2022/05/03/bunq-to-acquire-group-expenses-app-tricount/)
- TripIt Pro: ~US$ 48,99–49/ano, renovação anual; usuários SAP Concur podem ganhar Pro de graça (canal B2B) — [AppFollow/App Store](https://apps.appfollow.io/ios/tripit-travel-planner/311035142?country=bb); [Subger (baixa qualidade)](https://subger.com/en/service/tripit-pro)
- Polarsteps: receita principal = Travel Books impressos (via API da Peecho, que diz que os livros geram a maior parte da receita); afiliados (hospedagem, voos, atividades) entraram em 2025; assinatura "Polarsteps Plus" lançada em jul/2026 para usuários avançados; sem anúncios nem venda de dados — [Peecho case](https://peecho.com/case-studies/polarsteps); [Polarsteps news](https://www.polarsteps.com/news/polarsteps-hits-1-million-users-and-raises-3-million-in-funding); [Silicon Canals](https://siliconcanals.com/polarsteps-travel-tracking-maximiliano-neustadt-interview)
- Mindtrip: grátis para o viajante; receita por comissão de afiliados de reserva; captou ~US$ 22M — [PhocusWire](https://www.phocuswire.com/mindtrip-ai-trip-planner-travel-startup); [Caplight](https://www.caplight.com/company/mindtrip)
- Layla: comissões de parceiros (Booking.com, Skyscanner) + premium; preço conflitante entre fontes (US$ 9,99/mês vs US$ 49/ano vs US$ 35,99–59,99/ano em 3 níveis) — [Ideausher](https://ideausher.com/blog/develop-ai-travel-chatbot-like-layla-ai/); [Lindy](https://www.lindy.ai/blog/trip-planner-app); [MonkeyTravel (concorrente)](https://monkeytravel.app/blog/layla-vs-mindtrip-2026)

### Inferences
- Faixa de preço de referência para um "Pro" de consumidor: US$ 40–50/ano (≈ R$ 100–150/ano em preço local, a ajustar por paridade). Em reais, provavelmente precisa ser menor.
- Gatilhos de conversão observados: limite de uso (Splitwise: gastos/dia), offline/PDF/export (Wanderlog), recursos de "power user" (Polarsteps Plus), estatísticas/exportação (Tricount antigo). Para Together, candidatos naturais: offline, export PDF do roteiro/acertos, câmbio/termômetro avançado, mais fotos/armazenamento, IA.
- Para app de grupo, cobrar só um membro (o ADM/organizador) desbloqueando a viagem inteira ("Pass de viagem") é plausível, mas não achei concorrente de consumidor fazendo isso — é hipótese, não padrão comprovado.
- O caso Tricount sugere que o dado de gastos de grupo vale mais como funil financeiro (conta/cartão) do que como assinatura.
- Limitar o grátis de forma agressiva (Splitwise) gera reclamação pública e abre espaço para concorrentes gratuitos.

### Gaps
- Preços oficiais de Flighty, Tripsy, Stippl não encontrados nas buscas.
- Nenhum dado de taxa de conversão freemium→pago de nenhum desses apps.
- Preço exato e recursos do Polarsteps Plus não confirmados em página oficial.

## 2. Afiliados/comissão: taxas, integração, disponibilidade no Brasil

### Takeaway
Afiliados é a receita mais fácil de ligar para um time pequeno, mas as taxas são baixas (≈2–10% do valor ou fatia da comissão do parceiro) e as regras mudam. Atividades (GetYourGuide/Viator ~7–8%) e eSIM (Airalo 10%) pagam melhor que hotel. Redes como Travelpayouts agregam muitas marcas com um cadastro só.

### Cited Findings
- Booking.com: modelo antigo = 25–40% da comissão do Booking por volume (25% até 50 reservas/mês, 40% acima de 500); fonte mais recente diz que desde jun/2025 o cadastro é via rede CJ, pagando ~4% sobre estadias concluídas; cookie de 30 dias via CJ/Awin vs "por sessão" em outras fontes — [Mize](https://mize.tech/blog/all-about-the-booking-com-affiliate-partner-program-for-travel-agents/); contradito por [Makeinfluence](https://www.makeinfluence.com/en/academy/booking-coms-affiliate-program-how-travel-creators-earn-commission); [Creator Hero](https://www.creator-hero.com/fr/blog/booking-com-affiliate-program-in-depth-review-pros-and-cons)
- GetYourGuide: 7% base (Awin, cookie 30 dias); outras fontes 8% (31 dias) ou 5,25% — [Awin](https://ui.awin.com/merchant-profile/18925); [Lasso](https://getlasso.co/affiliate/get-your-guide/); [Tourscanner](https://tourscanner.com/blog/tours-travel-activities-affiliate-programs/)
- Viator: 8% fixo com cookie de 30 dias na maioria das fontes; uma cita 3% nos EUA — [Creator Hero](https://www.creator-hero.com/fr/blog/viator-affiliate-program-in-depth-review-pros-and-cons); [Tourscanner](https://tourscanner.com/blog/tours-travel-activities-affiliate-programs/)
- Klook: 2–5% por categoria, cookie 30 dias (7 dias para hotel em uma fonte) — [Lasso](https://getlasso.co/affiliate/klook/); [UpPromote](https://uppromote.com/affiliate-program-directory/klook/)
- Airalo (eSIM): a partir de 10% por venda via Impact; cookie 30 dias; cupom não rastreia; pagamento até o fim do mês seguinte; também disponível via Travelpayouts — [Airalo FAQ](https://cdn.airalo.com/blog/airalo-affiliate-program-faqs); [Airalo help](https://www.airalo.com/help/affiliates-partnerships/JWVHG1H2NHJ7/do-you-have-an-affiliate-program/CVF0CNOFQN4I); [Travelpayouts](https://www.travelpayouts.com/en/offers/airalo-partner-program/)
- Travelpayouts: grátis, 100+ marcas (Booking.com, Viator, GetYourGuide etc.), site em português; desde 27/abr/2026 o projeto é conectado automaticamente a todos os programas relevantes; cada marca tem termos próprios — [Travelpayouts PT](https://www.travelpayouts.com/pt/); [Travelpayouts support](https://support.travelpayouts.com/hc/en-us/articles/203955763)
- Allianz Travel BR tem programa na Awin (seguro viagem brasileiro via rede); Awin fica com 25% da comissão como taxa operacional nesse caso — [Awin Allianz BR](https://ui.awin.com/merchant-profile/24143); [termos](https://ui.awin.com/merchant-profile-terms/24143)
- Rentalcars.com: ~6% em reservas "pague agora", 1% em "pague depois", cookie 30 dias, via Awin; Brasil não citado na lista de mercados — [FlexOffers](https://www.flexoffers.com/affiliate-programs/rentalcars-com-affiliate-program/); [Tradedoubler](https://tradedoubler.com/fr/?p=24252)
- Polarsteps só ligou afiliados em 2025, mostrando que mesmo app grande trata afiliado como receita complementar — [Silicon Canals](https://siliconcanals.com/polarsteps-travel-tracking-maximiliano-neustadt-interview)

### Inferences
- Para Together, encaixes naturais: Hospedagem (já tem busca Airbnb/Booking/Maps) → link afiliado Booking; Documentos de entrada → eSIM (Airalo) e seguro viagem (obrigatório em alguns destinos, ex. Schengen) — alto valor contextual; Roteiro → passeios (GetYourGuide/Viator).
- Usar uma rede (Travelpayouts/Awin) reduz trabalho de integração e de contrato, ao custo de uma fatia.
- Em app de grupo, uma reserva de hospedagem cobre várias pessoas → ticket maior por clique que em app individual.

### Gaps
- Airbnb: não confirmei status atual de programa de afiliados (conhecimento prévio indica que foi encerrado ~2021, mas sem fonte nesta pesquisa).
- Expedia (EPS/Rapid API), Skyscanner, Kiwi, Decolar, Holafly, Seguros Promo, Rentcars (BR): sem dados confiáveis de comissão encontrados.
- Regras de pagamento para afiliado pessoa jurídica brasileira (moeda, impostos) não pesquisadas.

## 3. Fintech: carteira de grupo, Pix, split, cartões, câmbio e regulação

### Takeaway
Viável via parceiro (subconta + split): Asaas e similares fazem split automático entre carteiras por API, então Together não precisa virar instituição de pagamento. Pix Automático (recorrência) só serve a recebedor PJ com CNPJ ativo há 6+ meses, então é para o lado B2B (organizador cobrando parcelas), não para amigos. Cartão virtual de grupo e conta global (Wise/Nomad/C6) exigem parceria; não achei programas abertos e documentados.

### Cited Findings
- Asaas Split: divide valores recebidos entre uma ou várias carteiras Asaas automaticamente; só via API; fixo ou percentual; precisa do walletId de todos; calculado sobre o valor líquido (após tarifa Asaas); funciona em cobranças avulsas, parcelamentos e assinaturas — [Asaas docs split](https://docs.asaas.com/docs/split-de-pagamentos); [FAQ split](https://docs.asaas.com/docs/faq-do-split); [API Asaas](https://www.asaas.com/api-de-pagamentos)
- Pix Automático (Resolução BCB 482, jun/2025): obrigatório para instituições do pagador, opcional para recebedor; recebedor precisa ser PJ com CNPJ ativo há pelo menos 6 meses e sem indício de fraude; o PSP do recebedor deve checar a idoneidade do cliente antes e durante o contrato — [Mobile Time](https://www.mobiletime.com.br/noticias/09/06/2025/pix-automatico-regras-bc/); [Finsiders](https://finsidersbrasil.com.br/regulamentacao/bc-publica-novas-regras-para-pix-automatico/); [Voto BC 113/2024](https://normativos.bcb.gov.br/Votos/BCB/2024113/Voto_do_BC_113_2024.pdf)
- Tricount + bunq mostra o modelo "app de divisão como funil de banco": app grátis integrado a cartão de crédito bunq — [Tricount](https://tricount.com/en/what-happened-with-premium)

### Inferences
- Caminho mais simples para Together: "acerto via Pix" com QR/copia-e-cola gerado por um PSP (sem custódia), cobrando no máximo uma pequena taxa de conveniência ou nada (Pix entre PF é grátis, difícil cobrar).
- "Caixinha da viagem" (carteira de grupo) com custódia de dinheiro de terceiros entra em território regulado; fazer só via subcontas de um parceiro (Asaas, Mercado Pago, Pagar.me, Iugu, Stripe BR) onde o parceiro é a instituição autorizada.
- Receita fintech realista para time pequeno: (a) take-rate em pagamentos B2B a organizadores via split; (b) indicação/afiliado de conta global/cartão (Wise, Nomad) — a confirmar se existem programas.
- O IOF sobre gasto internacional torna o "termômetro de câmbio" e indicação de conta global um gancho de valor para o usuário brasileiro.

### Gaps
- Tarifas Pix específicas do Asaas e regras de split no Pix não confirmadas.
- Mercado Pago, Pagar.me, Iugu, Stripe BR (split/marketplace): não pesquisados por limite de buscas.
- Regras BACEN de subcredenciador/marketplace e quando um app precisa virar instituição de pagamento: não encontrado nas buscas.
- Alíquota atual de IOF (cartão internacional/câmbio) em 2026: não verificada nesta pesquisa.
- Programas de afiliado/parceria de Wise, Nomad, C6 Global: não pesquisados.

## 4. B2B / organizadores (excursões, despedidas, casamentos, offsites)

### Takeaway
Plataformas para organizadores de viagem em grupo cobram taxa por transação (4–6%) com ou sem mensalidade. É o modelo com maior receita por usuário e encaixa com o split de pagamentos brasileiro (organizador recebe parcelas dos participantes).

### Cited Findings
- SquadTrip (página de preços, sem data): Starter grátis com 6% de taxa de processamento; Launch US$ 29/mês com 4%; Premium US$ 99/mês com 4% + suporte prioritário e CSM; todos os planos têm todos os recursos — [SquadTrip pricing](https://squadtrip.com/pricing/)
- Cobertura de imprensa antiga (2022) cita ora 4%, ora 6% por transação sem mensalidade — [Black Enterprise](https://www.blackenterprise.com/black-travel-entrepreneurs-squadtrip/); [People of Color in Tech](https://peopleofcolorintech.com/founders/black-duo-launch-online-payment-solution-designed-for-millennial-group-travelers/)
- Recursos do SquadTrip: página da viagem, pacotes, planos de parcelamento e cobrança automática, DocuSign para termos/chargeback, repasse diário via Stripe — [Black Enterprise](https://blackenterprise.com/black-tech-startup-launches-first-online-payment-solution-designed-for-millennial-group-travelers/)
- TripIt Pro distribuído grátis via SAP Concur = canal corporativo — [Subger](https://subger.com/en/service/tripit-pro)

### Inferences
- Versão brasileira do SquadTrip: organizador (excursão, agência pequena, "despedida") cria viagem, participantes pagam parcelas via Pix/cartão, split automático (Asaas etc.) repassa ao organizador e retém a taxa do Together. Pix Automático serve aqui (organizador PJ com CNPJ 6+ meses).
- Esse módulo reaproveita quase tudo que já existe no Together (Comboio, Financeiro, convite).

### Gaps
- Let's Jetty: modelo de take-rate não encontrado.
- Concorrentes brasileiros de gestão de excursão/viagem em grupo e suas taxas não pesquisados.
- Tamanho do mercado de excursões/organizadores no Brasil não pesquisado.

## 5. Produtos impressos, recomendações patrocinadas, anúncios

### Takeaway
Livro de fotos impresso é comprovadamente a principal receita do Polarsteps e se integra via API de print-on-demand (Peecho). Anúncios são evitados pelos líderes (Polarsteps explicitamente; Tricount abandonou). Recomendação patrocinada não teve dado encontrado.

### Cited Findings
- Polarsteps Travel Book: um clique gera o livro formatado, impresso e enviado pela Peecho; segundo a Peecho, os livros geram a maior parte da receita; surgiu de pedido de usuário — [Peecho case](https://peecho.com/case-studies/polarsteps); [Silicon Canals](https://siliconcanals.com/polarsteps-travel-tracking-maximiliano-neustadt-interview)
- Polarsteps não usa anúncios nem vende dados como parte do posicionamento — [Silicon Canals](https://siliconcanals.com/polarsteps-travel-tracking-maximiliano-neustadt-interview)
- Tricount antigo: grátis com anúncios + Premium; modelo abandonado após bunq — [Tricount](https://tricount.com/en/what-happened-with-premium)

### Inferences
- Together já tem feed de fotos do comboio + roteiro + mapa: um "livro da viagem do grupo" (várias pessoas compram cópia) é extensão natural e multiplica pedidos por viagem.
- Anúncios conflitam com experiência "tudo dentro do app" e com público pequeno no início; baixa prioridade.

### Gaps
- Fornecedores brasileiros de impressão sob demanda com API (e frete nacional) não pesquisados; Peecho entrega no Brasil não confirmado.
- Preço/margem de livro Polarsteps não encontrados.
- Nenhum dado sobre recomendações patrocinadas em apps de viagem.
