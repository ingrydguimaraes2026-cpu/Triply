# Pesquisa: documentos de entrada por país (18/10/2026)

Ideia do Victor: depois de escolher **pra onde** vai, o próximo passo natural é **"o que eu preciso pra entrar lá?"**.
O app montaria um checklist de documentos por país do roteiro, pra cada pessoa do comboio.

> Regras de entrada mudam o tempo todo e muita fonte na internet é site comercial ou desatualizado.
> Tudo marcado com **(confirmar)** precisa ser checado na fonte oficial antes de entrar no app.

## 1. O que um brasileiro precisa saber (as "camadas" do checklist)

Não é só visto. Pra cada país do roteiro, as perguntas são sempre as mesmas:

| Camada | Exemplo | De onde vem |
|---|---|---|
| **Documento de viagem** | Passaporte ou RG/CIN? Validade mínima (ex.: 6 meses; Schengen: 3 meses após a saída e emitido há menos de 10 anos) | Regra do país de destino |
| **Visto / autorização** | Isento, autorização eletrônica (ETA, ETIAS, eTA), e-visa, visto no consulado | Regra do país + nacionalidade da pessoa |
| **Saúde** | Certificado de febre amarela (CIVP), vacinas | Lista da OMS + regra do país (às vezes depende de onde a pessoa vem) |
| **Comprovantes** | Passagem de volta, reserva de hotel, dinheiro suficiente, seguro viagem (Schengen exige cobertura mínima de €30 mil) | Regra do país |
| **Conexões** | Escala num país fora do Mercosul obriga passaporte; alguns países exigem visto de trânsito | Rota do voo |
| **Casos especiais** | Menor de 18 anos sem os dois pais: autorização (Resolução CNJ 131/2011, em papel com firma ou pelo e-Notariado) | Regra **brasileira**, vale pra qualquer destino |

Ponto importante pro nosso app: **a regra depende da pessoa, não da viagem.** No mesmo comboio pode ter alguém com passaporte italiano (não precisa de nada na Europa) e alguém só com o brasileiro. Então o checklist é **por pessoa × país**.

### Exemplos de como varia (brasileiro, turismo)

| Destino | O que precisa | Confiança |
|---|---|---|
| Argentina, Uruguai, Paraguai, Chile, Bolívia, Peru, Equador, Colômbia | RG ou CIN emitido há menos de 10 anos já basta (sem passaporte). CNH não vale. Venezuela está em dúvida. | alta |
| Espaço Schengen (Portugal, Espanha, França, Itália...) | Sem visto, até 90 dias a cada 180. EES (registro biométrico na fronteira) já funciona. **ETIAS** (autorização online, cerca de €20, vale 3 anos) previsto pro fim de 2026, **sem data oficial ainda** | média (confirmar data do ETIAS) |
| Reino Unido | Sem visto, mas precisa de **ETA** (£20) | média (confirmar no gov.uk) |
| Estados Unidos | Visto B1/B2 com entrevista no consulado. Fila pode levar meses | alta |
| Canadá | eTA se já teve visto canadense nos últimos 10 anos ou tem visto americano válido; senão, visto | média (confirmar) |
| México | Visto, ou visto válido dos EUA/Canadá/Reino Unido/Japão/Schengen no lugar | média (confirmar) |
| Japão | Isento desde 2023 (até 90 dias) | alta |
| Austrália | Visto de visitante, pedido online | alta |

Isso mostra o tamanho do problema: **não dá pra manter isso na mão pra 200 países.**

## 2. Quem já resolve isso (benchmark)

| Produto | O que faz | Serve pra gente? |
|---|---|---|
| **Sherpa** (joinsherpa.com) | Líder do mercado. Regras de entrada em tempo real (visto, passaporte, trânsito, saúde) e vende e-visa. Usado por companhias aéreas (a British Airways manda o passageiro pra lá). Oferece link co-branded, widget embutido ou API. | Melhor dado, mas vende pra empresa grande. Sem preço público, modelo de **divisão de receita** nos vistos vendidos. Dá pra perguntar se aceitam startup. |
| **IATA Timatic** | A base que as companhias aéreas usam no check-in. Mais de 220 países, mais de 2.000 fontes, atualizada até 200 vezes por dia. | Padrão ouro, mas licença cara e voltada pra companhia aérea. Tem uma API "AutoCheck" listada no portal da IATA (confirmar se dá acesso a gente pequena). |
| **Atlys, iVisa, VisaHQ** | Fazem o pedido de visto pra pessoa, cobrando taxa. | Não são concorrentes diretos. Podem virar **parceiros** (link de afiliado no checklist). |
| **Travel Buddy** (via RapidAPI) | API de "passaporte × destino" para 200 passaportes e 210 destinos. | Barata e simples, mas só diz o *tipo* (isento, e-visa, visto). Não traz checklist completo. |
| **Orizn Visa API** | Cerca de 40 mil pares passaporte × destino, 15 idiomas, tem até servidor MCP. Grátis com 50 consultas por mês. | Bom pra testar; os campos detalhados são pagos. |
| **Visa Atlas** (visaatlas.org) | Dados abertos (CC BY 4.0) com link pra fonte oficial de cada país. | Mais voltado pra imigração (trabalho, residência), pouco sobre turismo. |
| **Passport Index Dataset** (GitHub, ilyankou) | CSV de 199 países com o tipo de exigência. | Arquivado; dados novos ficam em outro lugar. Serve como base inicial grátis. |
| **Wanderlog, TripIt, Polarsteps, Tricount** | Os concorrentes de planejamento. | **Nenhum tem checklist de documentos de entrada.** O TripIt Pro só mostrava regras de covid em 2021. |

**Conclusão do benchmark:** os apps de planejamento em grupo não fazem isso, e quem faz (Sherpa, Timatic) vende pra companhia aérea. É um buraco real, principalmente com conteúdo **em português e pensado pro brasileiro** (RG no Mercosul, CNJ 131, febre amarela pelo ConecteSUS, fila de visto americano).

## 3. Fontes oficiais (pra conferir e linkar)

- **Itamaraty / Portal Consular** (gov.br/mre): página por país com as exigências para brasileiros, com base no que as embaixadas informam. O próprio Itamaraty recomenda confirmar no site da embaixada.
- **Polícia Federal** (gov.br/pf): emissão de passaporte, agendamento e taxa.
- **ConecteSUS / Anvisa**: emite o Certificado Internacional de Vacinação (febre amarela). Para doses de antes de 2023, o pedido é pelo gov.br e leva alguns dias.
- **OMS**: lista dos países que exigem febre amarela.
- **e-Notariado / CNJ**: autorização de viagem de menor (Resolução 131/2011).
- **Destino**: europa.eu/etias, gov.uk/eta, travel.state.gov (EUA), etc.

Nenhum governo oferece uma "API de requisitos de entrada". O que existe é página web. Por isso empresas como Sherpa e IATA existem: elas pagam gente pra ler isso tudo e manter atualizado.

## 4. Como o Together poderia fazer (proposta)

### Fase 1: checklist próprio, curado, sem API paga
1. **Regras gerais do Brasil** (valem pra qualquer viagem): passaporte (prazo de emissão), validade mínima, menores (CNJ 131), febre amarela, seguro viagem.
2. **Tabela própria no banco** com os ~30 destinos mais comuns pra brasileiros (Mercosul, Schengen, Reino Unido, EUA, Canadá, México, Japão, Caribe...). Cada regra com **link da fonte oficial** e **"conferido em DD/MM/AAAA"**.
3. **Base grátis** (Passport Index ou Visa Atlas) só pra dizer o *tipo* nos outros países ("precisa de visto: confira no Itamaraty").
4. **Checklist por pessoa:** cada um marca "tenho / não tenho / não preciso" e o ADM vê o resumo do comboio ("2 pessoas sem ETA pro Reino Unido").
5. **Prazos ao contrário:** pela data da viagem, o app avisa "visto americano pode levar meses: comece agora", "passaporte: agende com 1 mês de folga".
6. Sempre com um aviso: "Confira na fonte oficial; as regras mudam."

### Fase 2: dado automático
- Testar **Orizn** (grátis) ou **Travel Buddy** pra cobrir todos os países automaticamente.
- Conversar com a **Sherpa** sobre o widget ou afiliado. O modelo deles é dividir a receita quando a pessoa compra o e-visa pelo app, o que também pode **gerar receita pro Together**.

### O que fica de fora
- Fazer o pedido de visto pela pessoa (isso é o negócio da Atlys e da iVisa; no máximo damos o link).
- Garantir que a regra está certa. O app **ajuda a lembrar**, quem decide é a fonte oficial.

## 5. Perguntas em aberto

- [ ] Perguntar a nacionalidade/passaportes de cada pessoa no perfil? (dupla cidadania muda tudo)
- [ ] Quem mantém a tabela da fase 1 atualizada, e de quanto em quanto tempo?
- [ ] Vale a pena falar com a Sherpa agora ou só depois de ter usuários?
- [ ] Virar spec 010 no `docs/specs/`?

## 6. Teste de scraping nas páginas oficiais (18/10/2026)

Tentei ler as páginas oficiais "como robô" (sem navegador):

| Página | Resultado |
|---|---|
| ETIAS (travel-europe.europa.eu) | Só devolve o título: o conteúdo é montado por JavaScript |
| France-Visas (france-visas.gouv.fr) | **Bloqueado** (403) |
| Itamaraty / Portal Consular (gov.br/mre) | **CAPTCHA** (verificação de robô) |
| Visto per l'Italia (vistoperitalia.esteri.it) | Funciona, mas é um questionário: a resposta só sai depois de escolher nacionalidade, duração e motivo |

Conclusão: **scraping automático das fontes oficiais é frágil**. Os sites bloqueiam robôs, mudam de endereço e escondem o conteúdo atrás de JavaScript. Passar por cima de CAPTCHA ou bloqueio está fora de questão.

Caminho mais realista: **curadoria assistida**.
1. Uma tabela nossa no banco (país, regra, link oficial, "conferido em").
2. De tempos em tempos (ex.: todo mês, e sempre que um país novo aparecer num roteiro), uma pesquisa com IA propõe as mudanças, citando as fontes.
3. Uma pessoa revisa e aprova antes de ir pro app.
4. Opcional: um robô que só **avisa que a página mudou** (compara a página de hoje com a anterior), nas fontes que deixam ler.

## 7. Caso real: Galeão → Paris → Nice → Mônaco → Milão → Como → Roma (1 a 8 jun 2027)

| Item | Pra essa viagem | Quando resolver |
|---|---|---|
| Passaporte | Válido até pelo menos **8 set 2027** (3 meses depois da saída) e emitido há menos de 10 anos. Algumas fontes falam em 6 meses: na dúvida, válido até dez/2027 | Agora (se precisar renovar, a PF tem fila) |
| Visto | Não precisa (turismo até 90 dias). França e Itália são Schengen; Mônaco não é, mas a entrada é pela França, sem controle de fronteira | — |
| ETIAS | **Provavelmente sim**, se começar no fim de 2026 como previsto (cerca de €20, vale 3 anos). Conferir a data oficial | 1 a 3 meses antes |
| EES | Na primeira entrada (Paris) tiram foto e digital. Sem pedido prévio | Na chegada |
| Seguro viagem | Obrigatório, cobertura mínima de **€30 mil**, cobrindo os 8 dias e os 3 países | Antes de embarcar |
| Comprovantes | Passagem de volta (Roma → Brasil), reservas de hospedagem de cada cidade, dinheiro por dia de viagem (o valor exato varia entre as fontes) | Ter impresso ou no celular |
| Febre amarela | Não é exigida pra França, Mônaco e Itália | — |
| Menores | Se alguém do comboio tiver menos de 18 anos sem os dois pais: autorização CNJ 131 | 1 mês antes |

Isso mostra como o checklist ficaria no app: **8 linhas, cada uma com prazo e link oficial**.

## Fontes

- Sherpa: https://www.joinsherpa.com/solutions · https://documenter.getpostman.com/view/2025972/sherpa-api-v2/6YzvDPM · https://www.phocuswire.com/sherpa-raises-8-5-million-to-meet-demand-for-its-travel-rules-platform
- British Airways (usa Sherpa): https://www.britishairways.com/content/information/passports-visas-and-api
- Timatic: https://en.wikipedia.org/wiki/Timatic · https://www.altexsoft.com/blog/timatic/ · https://api.developer.iata.org/ja/iata-iata-timatic/api/timatic-autocheck-rest-api
- Travel Buddy: https://wordpress.org/plugins/travel-buddy · https://zylalabs.com/api-marketplace/top-search/visa%20requirements%20api
- Orizn: https://socket.dev/npm/package/orizn-visa-mcp
- Dados abertos: https://visaatlas.org/use-our-data · https://github.com/ilyankou/passport-index-dataset · https://github.com/herrniemand/visas
- Apps de visto e checklist: https://www.peakxv.com/companies/atlys · https://appsavvytraveller.com/visa-requirement-apps/ · https://www.travelguys.fr/en/2021/12/07/5-apps-to-find-out-about-country-entry-restrictions/
- ETIAS/EES: https://agenciavalevisto.com.br/blog/etias-europa-2026-guia-completo · https://www.correiobraziliense.com.br/cbradar/portugal-se-junta-a-espanha-franca-alemanha-italia-e-holanda-ao-endurecer-regras-de-visto-para-brasileiros-como-funcionam-o-ees-e-o-etias-para-quem-viaja-a-turismo-em-2026/ · https://www.institutocidadaniaitaliana.com.br/brasileiros-na-europa-em-2026-saiba-o-que-muda-com-o-etias
- Reino Unido ETA: https://www.gov.uk/guidance/apply-for-an-electronic-travel-authorisation-eta · https://passageirodeprimeira.com/taxa-de-autorizacao-de-viagem-para-o-reino-unido-ficara-mais-cara-a-partir-de-abril
- RG no Mercosul: https://www.infomoney.com.br/?p=2843493 · https://www.correio24horas.com.br/em-alta/brasileiros-poderao-usar-apenas-a-nova-carteira-de-identidade-para-entrar-em-8-paises-da-america-do-sul-veja-a-lista-0626 · https://catracalivre.com.br/viagem-livre/confira-os-paises-para-onde-brasileiro-pode-viajar-sem-passaporte/
- Febre amarela: https://jundiai.sp.gov.br/noticias/2023/07/20/certificado-internacional-de-vacinacao-passa-a-ser-emitido-conecte-sus/ · https://www.curitiba.pr.gov.br/noticias/certificado-de-vacinacao-da-febre-amarela-so-pode-ser-emitido-pelo-conectesus/69269
- Menores: https://atos.cnj.jus.br/atos/detalhar/3335 · https://www.tjma.jus.br/midia/extrajudicial/pagina/site/507696/autorizacao-de-viagem
- Itamaraty: https://oespecialista.safra.com.br/itamaraty-atualiza-informacoes-para-viagem-internacional-de-brasileiros/
- França e Mônaco: https://www.eurodicas.com.br/?p=9305 · https://www4.mundodosvistos.com.br/p/visto-para-franca/ · https://www.segurospromo.com.br/blog/documentos-para-entrar-na-franca/ · https://visarequirements.info/countries/brazil/monaco/ · https://www.peninsulavisa.com/visa-requirements/brazil-to-monaco
- Itália: https://vistoperitalia.esteri.it/
- Concorrentes: https://app.stippl.io/blog/stippl-vs-wanderlog · https://blog.jetpacglobal.com/blog/best-travel-apps-for-planning/
