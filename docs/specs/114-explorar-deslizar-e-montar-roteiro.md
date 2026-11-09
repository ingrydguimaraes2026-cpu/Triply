# 114. Explorar: deslizar lugares e montar o roteiro

**Fase:** 2 · **Tamanho:** G · **Depende de:** 016, 022, 029, 064, 066, 096 · **Status:** Em andamento (web pronto, banco e função não aplicados)

## Objetivo
A pessoa escolhe a cidade, quantos dias e o estilo da viagem, vê os lugares em cartões e **desliza**: pra direita "quero", pra esquerda "passo", pra cima "não abro mão". No fim toca em **Montar roteiro** e recebe os dias prontos, com o que fica perto junto, e põe tudo na agenda da viagem com um toque. Funciona **pra qualquer cidade**, no **site e no app**, e é **grátis**.

## Por que
- **Vídeo do TikTok (02/11/2026)** de uma criadora brasileira mostrando o app **Roameo**: destino, dias, estilo, deslizar e roteiro gerado. Nos comentários, muita gente reclamou que o app é pago.
- **Benchmark do Roameo (02/11/2026):**
  - Mais de 50 mil downloads no Android e cerca de 31 mil nos últimos 30 dias. O site diz "70 mil+ usuários". No iPhone, nota 4,5 com só 25 avaliações.
  - Preço: Trip Pass a US$ 4,99, mensal a US$ 9,99, anual entre US$ 24,99 e 39,99.
  - Já chegou a **8º em faturamento na categoria Viagem no Brasil** (AppBrain). O público brasileiro paga por isso.
  - Não é open source.
- **Pesquisa de mercado:** "interesses diferentes na programação" é a dor nº 1 (42,7%). E quem nunca foi não sabe por onde começar (catálogo L4).
- **Quase tudo já existe:** curtir (022), "não abro mão" (066), coordenadas (064), montar os dias pelos votos (096) e agenda (029). Falta a **tela de deslizar** e um **catálogo de lugares por cidade** que não dependa de API paga.
- **Decisões do Victor:**
  - É **individual**: cada pessoa desliza sozinha, sem "match" com o grupo.
  - A UX tem que ser melhor que a do Roameo.
  - Foco em **web e mobile** juntos.
  - **Sem custo** agora.

**Protótipo aprovado (UX):** <https://claude.ai/artifact/53ipQyHX27iXKaG8Gw71qv>. A tela do celular é clicável e a do PC mostra os atalhos de teclado. É a referência visual desta spec.

## Inclui

### 1. O fluxo (3 passos + roteiro), igual ao protótipo
1. **Pra onde?** Cidade (busca com autocompletar, que já existe no onboarding) e quantos dias (de 1 a 14).
2. **Como vai ser?**
   - Estilo, pode escolher vários: Romântica, Cultura, Ao ar livre, Fotogênica, Com crianças.
   - Ritmo: Tranquilo (2 lugares por dia), Equilibrado (3) ou Intenso (4).
   - Quanto quer gastar com passeios: Grátis e barato, Médio ou Sem limite.
3. **Deslizar:**
   - Pilha do tamanho certo pra viagem (regra na Decisão 4), com contador "3 de 30" e barra de progresso. No fim, "Ver mais 15 lugares", se houver.
   - Botões **com nome**: Passo, Não abro mão, Quero e Desfazer.
   - **"Ver mais"** abre os detalhes por cima, e dá pra decidir de lá.
   - **"Pronto"** leva ao resumo a qualquer hora, sem precisar passar por todos os cartões.
4. **Resumo:** quantos quis, quantos "não abro mão" e quantos passou, com a lista dos escolhidos. Botões **Montar roteiro de N dias** e **Ver os lugares de novo**.
5. **Montando:** três passos curtos explicando o que está acontecendo ("juntando o que fica perto", "respeitando seus não abro mão", "encaixando N por dia").
6. **Roteiro:**
   - Dias em abas e mini mapa com o caminho do dia.
   - Entre um lugar e outro, "N min a pé" (ou "de trem" quando é longe).
   - Os "não abro mão" aparecem marcados.
   - Dia sem nada vira **"Dia livre"**, com o botão "Ver mais lugares".
   - Avisa o que ficou de fora por falta de dia.
   - **Pôr na agenda da viagem** e **Refazer**.

### 2. Como o cartão se comporta (aprendido no protótipo)
- O **próximo cartão fica parado embaixo**, no mesmo tamanho e com o mesmo conteúdo. Ao arrastar, só o de cima se mexe.
- Quando o cartão sai, a **troca acontece sem animação**, pra não "saltar".
- Ao arrastar aparecem os selos QUERO (direita), PASSO (esquerda) e NÃO ABRO MÃO (pra cima), mais fortes quanto mais longe o arraste.
- O cartão mostra:
  - foto grande e etiqueta do estilo;
  - nome e bairro;
  - **"por que ir" em uma frase**;
  - tempo médio de visita, preço (Grátis/Pago) e melhor hora;
  - crédito da foto.
- **No PC:** atalhos ← passo, → quero, ↑ não abro mão, Z desfazer e Espaço ver mais. A lista de escolhidos e o mapa ficam ao lado.

### 3. Catálogo de lugares por cidade (grátis e guardado no nosso banco)
**Regra de ouro:** o app **nunca** consulta serviços públicos (Overpass, Nominatim, Wikidata) na hora em que a pessoa abre a tela. Tudo vem do **nosso banco**.

- **Edge Function `explorar-cidade`:**
  - Se a cidade já está no catálogo e foi atualizada nos últimos 90 dias, devolve na hora.
  - Se não, monta uma vez e guarda, valendo pra todo mundo. A ordem é:
    1. **Nominatim:** onde fica a cidade. É uma consulta só, com `User-Agent` próprio, no máximo 1 por segundo.
    2. **Wikidata (SPARQL, busca "perto deste ponto"):**
       - pega só lugares de uma **lista de tipos que contam** (museu, igreja, catedral, castelo, palácio, monumento, mirante, ponte, praça, parque, jardim, praia, cachoeira, lagoa, duna, sítio arqueológico, zoológico, aquário);
       - ordena pela **fama**, que é o número de Wikipédias em que o lugar aparece;
       - guarda o tipo, a foto (P18), a coordenada e a descrição em português.
    3. **Wikipédia em português** (ou inglês, se não houver): o primeiro parágrafo vira o texto de "ver mais", e a primeira frase curta vira o "por que ir".
    4. **Fotos do Wikimedia Commons:** miniatura de **960 px** (tamanhos fora do padrão, como 800, dão erro), com o autor e a licença guardados pra mostrar o crédito. Se o lugar não tem foto, busca uma foto por localização no Commons, num raio de 300 m.
- **Tempo médio e melhor hora:** tabela simples por tipo (museu 2h, igreja 45 min, mirante 30 min, parque 1h30 e por aí vai), em `packages/core`. Sem IA.
- **Base curada (`fonte = 'curado'`):** pros destinos brasileiros de natureza, onde o automático é fraco (o teste mostrou Jericoacoara com 4 lugares e Gramado com 8). A primeira leva tem 20 destinos:
  - Jericoacoara, Gramado, Canela, Bonito, Chapada dos Veadeiros, Chapada Diamantina, Lençóis Maranhenses;
  - Fernando de Noronha, Paraty, Arraial do Cabo, Búzios, Ilha Grande, Maragogi, Porto de Galinhas;
  - Foz do Iguaçu, Campos do Jordão, Monte Verde, Ilhabela, Pipa, Morro de São Paulo.
  - Cada lugar tem nome, coordenada **conferida no mapa**, texto próprio e foto do Commons com crédito.
- **Pré-carga agendada (pg_cron):** prepara as **100 cidades da lista inicial** (Decisão 2) e depois **todo destino criado no app**, poucas por rodada pra respeitar o limite dos serviços. Fica igual à `atualizar-exigencias`. A meta é chegar a ~300 com o uso.
- **Regiões** (Toscana, Costa Amalfitana, Algarve): veja a Decisão 3.
- **Cidade nova:** a tela mostra "Preparando os lugares de X…" (até ~30 s) e, depois, os cartões. A cidade fica guardada pra todo mundo.

### 4. Escolhas e roteiro
- **As escolhas ficam só suas** enquanto você desliza (tabela `explorar_escolhas`). Ninguém do comboio vê.
- **Ao tocar em "Montar roteiro":**
  - cada "quero" e "não abro mão" vira um **lugar da viagem** (`lugares`, tipo passeio), com coordenada, endereço e link da Wikipédia, no destino certo;
  - "quero" vira **curtida** (`lugar_votos`) e "não abro mão" vira **prioridade** (`lugar_prioridades`, limite de 3 por destino; veja a Decisão 1);
  - a proposta de dias sai do **`montarDiasPelosVotos`** (spec 096), com o **ritmo** escolhido (2, 3 ou 4 por dia) e os **dias** do destino.
- **"Pôr na agenda da viagem"** cria os eventos em `eventos_agenda`, como na spec 096 ("Montado pelo Explorar" na observação).
- **Duas entradas:**
  - **aba Lugares** de uma viagem: botão "Explorar Paris", que já sabe a cidade e os dias do destino e começa no passo 2;
  - **Nova viagem:** "Começar explorando" cria a viagem com o destino e os dias e segue o fluxo. É a **porta de entrada principal** (Decisão 5).

### 5. Arrumar o que já consulta serviço público ao vivo
- **Sugestões de lugares (spec 094)**, em `consultaDeSugestoes`, no `packages/core/src/ferramentas.ts`: passam a ler o **catálogo** em vez de chamar o Overpass do celular.

## Não inclui (fica pra depois)
- ~~**Match com o comboio**~~ → **entrou na spec 117** (Victor aprovou em 02/11/2026 o match: 3 ou mais "quero" no mesmo lugar).
- **Restaurantes, vida noturna e compras.** A Wikidata cobre mal. Os estilos "Gastronomia", "Vida noturna" e "Compras" ficam fora até termos uma fonte.
- **Horário de funcionamento e dias fechados** no roteiro.
- **Importar do TikTok, Instagram ou Google Maps** dentro do Explorar. Já existem as specs 079 e 097, separadas.
- **Google Places, ou qualquer API paga ou com IA paga.** Fica como reserva se o grátis não der conta.
- **Reservar passeio e afiliados** (GetYourGuide, Viator).
- **Catálogo offline.**
- **Banheiros (spec 059):** a consulta é pequena (800 m) e continua ao vivo por enquanto, mas precisa de tempo-limite e mensagem de erro amigável.

## Telas
- **Web:** rota nova `/viagem/:id/explorar` (e `/explorar` pra começar sem viagem), no layout do protótipo de PC: cartão grande no centro, "Sua lista" e mapa à direita, atalhos embaixo. No celular do navegador, vira o layout do app.
- **Mobile (Expo):** tela `explorar.tsx` com o fluxo inteiro e arrastar com o dedo.
- **Estados:**
  - **Carregando cidade já pronta:** esqueleto do cartão, menos de 1 s.
  - **Cidade nova:** "Preparando os lugares de X…", com os mesmos três pontinhos do "Montando".
  - **Poucos lugares (menos de 8):** "Achamos poucos lugares em X ainda", com "Adicionar um lugar" e "Colar link do Google Maps" (spec 079).
  - **Sem internet ou serviço fora:** "Não deu pra carregar agora", com "Tentar de novo". As escolhas já feitas não se perdem.
  - **Acabaram os cartões:** vai direto pro resumo.
  - **Nenhum escolhido:** o resumo mostra "Nenhum lugar escolhido ainda" e "Ver os lugares de novo".

## Dados
- **Já existem e serão usadas:** `lugares` (com `latitude`, `longitude` e `endereco` da 064), `lugar_votos` (022), `lugar_prioridades` (066), `eventos_agenda` (029), `destinos` e `viagens`.
- **Migration nova** (`supabase/migrations/<data>_explorar.sql`, com "Pra desfazer" no topo):
  - `catalogo_cidades`: `id`, `nome`, `pais` (código), `latitude`, `longitude`, `raio_km`, `atualizado_em`, `situacao` (`pronta` | `preparando` | `erro`).
  - `catalogo_lugares`:
    - `id`, `cidade_id`, `wikidata` (Q…, único por cidade), `nome`, `bairro`;
    - `tipo` (da lista), `estilos` (array: romantica, cultura, ar_livre, fotogenica, criancas);
    - `fama` (número de Wikipédias), `latitude`, `longitude`;
    - `por_que` (até 160 caracteres), `sobre` (até 600), `tempo_min`, `gratis` (sim/não/não se sabe), `melhor_hora`;
    - `foto_url`, `foto_autor`, `foto_licenca`, `link_wikipedia`, `fonte` (`wikidata` | `curado`).
  - `explorar_escolhas`: `viagem_id`, `destino_id`, `usuario_id`, `catalogo_lugar_id`, `escolha` (`quero` | `passo` | `nao_abro_mao`), `criado_em`. Chave única por pessoa + destino + lugar.
- **Base curada:** arquivo `supabase/seed/catalogo-curado.json` (revisável), carregado pela própria função.

## Quem pode o quê
| Ação | ADM | Membro | Logado sem viagem |
|---|---|---|---|
| Ver o catálogo de uma cidade | ✓ | ✓ | ✓ |
| Pedir pra preparar uma cidade nova | ✓ | ✓ | ✓ (limite: 5 cidades novas por pessoa por dia) |
| Escrever no catálogo | — | — | — (só a Edge Function, com a chave de serviço) |
| Deslizar e ver as **próprias** escolhas | ✓ | ✓ | — |
| Ver as escolhas dos outros | — | — | — |
| Montar o roteiro e pôr na agenda | ✓ | ✓ (cria lugares e eventos da viagem, como já pode hoje) | — |

## Critérios de aceite
- [ ] Paris, Roma, Lisboa, Tóquio e Ouro Preto mostram pelo menos 25 cartões, com 90% ou mais com foto, e os mais famosos primeiro.
- [ ] Jericoacoara e Gramado mostram os lugares da base curada (Pedra Furada, Duna do Pôr do Sol, Lagoa do Paraíso; Lago Negro, Rua Coberta, Snowland).
- [ ] Nenhum cartão é "conceito" (Império Romano, Metrô, Universidade, campeonato).
- [ ] Uma cidade já preparada abre em menos de 1 s, e o app não chama Overpass, Nominatim nem Wikidata do celular. Conferir na aba Rede do navegador.
- [ ] Cidade nova: aparece "Preparando…" e, em até ~30 s, os cartões. Abrindo de novo, vem na hora.
- [ ] Arrastar o cartão: o de baixo **não se mexe** e a troca não salta.
- [ ] Os selos aparecem conforme o arraste. Soltar antes do limite volta o cartão pro centro.
- [ ] Desfazer volta o último cartão e apaga a escolha.
- [ ] No PC, ← → ↑ Z e Espaço funcionam, e os botões também.
- [ ] "Montar roteiro" cria os lugares (sem duplicar os que já existem com o mesmo `wikidata` ou nome) e propõe os dias no ritmo escolhido. "Não abro mão" entra primeiro.
- [ ] "Pôr na agenda" cria os eventos e eles aparecem na Agenda e no Hoje.
- [ ] Outra pessoa do comboio não vê as minhas escolhas antes de eu montar o roteiro.
- [ ] Todo cartão mostra o crédito da foto, e a tela mostra "Dados: Wikidata, Wikipédia, OpenStreetMap".
- [ ] Funciona no site (PC e celular) e no app.
- [ ] As sugestões de lugares da spec 094 passam a vir do catálogo.
- [ ] "Toscana" vira região: cartões de Florença, Siena, Pisa etc., com a cidade no cartão. Se o roteiro espalhar mais de 60 km, aparece o aviso de "dormir em 2 lugares".
- [ ] A pilha segue a regra (4 dias no Equilibrado dá 30 cartões; 2 dias no Tranquilo dá 15), com "Ver mais 15 lugares" no fim.
- [ ] No 4º "não abro mão" do mesmo destino, o botão fica apagado e aparece o aviso.
- [ ] "Começar explorando" na Nova viagem leva do zero aos cartões em 2 telas, sem pedir nome nem moeda.

## Decisões (02/11/2026)
1. **"Não abro mão" continua com limite de 3 por destino** (Victor). No 3º, o botão fica apagado e mostra "Você já tem 3. Tire um pra marcar outro". No resumo dá pra trocar.
2. **Lista inicial de 100 cidades pra pré-carga.** Sai dos rankings de 2025 e 2026: Decolar (buscas), Civitatis (passeios reservados), Azul (voos) e Booking (feriados). Depois, **todo destino criado no app entra na fila**. A lista fica em `packages/core/src/explorar-cidades.ts`.
   - **Brasil (50):** Rio de Janeiro, São Paulo, Salvador, Fortaleza, Recife, Maceió, Natal, João Pessoa, Porto Seguro, Florianópolis, Foz do Iguaçu, Gramado, Canela, Belo Horizonte, Ouro Preto, Tiradentes, Brasília, Curitiba, Porto Alegre, Bonito, Manaus, Belém, São Luís, Barreirinhas (Lençóis Maranhenses), Jericoacoara, Fernando de Noronha, Porto de Galinhas, Maragogi, Pipa, Arraial do Cabo, Búzios, Paraty, Ilha Grande, Petrópolis, Campos do Jordão, Monte Verde, Ilhabela, Ubatuba, Balneário Camboriú, Bombinhas, Alto Paraíso (Chapada dos Veadeiros), Lençóis (Chapada Diamantina), Pirenópolis, Morro de São Paulo, Itacaré, Trancoso, Caldas Novas, Olinda, Aracaju, Vitória.
   - **Exterior (50):** Buenos Aires, Santiago, Punta Cana, Orlando, Miami, Nova York, Fort Lauderdale, Lisboa, Porto, Paris, Roma, Florença, Veneza, Milão, Madri, Barcelona, Sevilha, Londres, Edimburgo, Amsterdã, Berlim, Praga, Viena, Budapeste, Zurique, Atenas, Istambul, Dubai, Cancún, Cidade do México, Lima, Cusco, Bariloche, Mendoza, Montevidéu, Punta del Este, Bogotá, Cartagena, San Andrés, Las Vegas, Los Angeles, São Francisco, Toronto, Tóquio, Seul, Bangkok, Cairo, Cidade do Cabo, Marrakech, Nice.
3. **Regiões:** quando o Nominatim diz que o destino é estado, região, condado, província ou ilha, o Explorar trata como **região**.
   - Raio = metade da diagonal da área que o Nominatim devolve, entre 15 e 80 km.
   - Os mais famosos da região inteira aparecem primeiro, e o cartão mostra a **cidade** no lugar do bairro ("Florença", "Siena").
   - O roteiro já junta o que fica perto, então cada dia fica numa parte da região. Se os escolhidos ficarem a mais de 60 km um do outro, o roteiro avisa: "Região grande: vale dormir em 2 lugares diferentes".
4. **Tamanho da pilha:** vagas = dias × lugares por dia (do ritmo), e pilha = vagas × 2,5, com **no mínimo 15 e no máximo 40** cartões.
   - Exemplos: 4 dias no Equilibrado dá 12 vagas e 30 cartões. 2 dias no Tranquilo dá 4 vagas e 15 cartões.
   - Se a cidade tem menos lugares que isso, mostra o que tem.
   - O 2,5 é uma **hipótese**: a pessoa costuma querer ~1 a cada 3. Medir a taxa real de "quero" e ajustar.
5. **Entrada pela Nova viagem: entra já.** Quem chega por um vídeo quer **deslizar primeiro**, não montar viagem. Então "Começar explorando" é a primeira opção da Nova viagem: cria a viagem com o destino e os dias, sem pedir nome, moeda nem comboio (dá pra preencher depois em Configurações). A entrada pela aba Lugares também fica.
6. **Crédito das fotos e dos dados** (é o que a licença das fotos pede: autor, licença e link):
   - **No cartão:** uma linha pequena no canto da foto, "Foto: Autor · CC BY-SA", cortada com "…" se for longa.
   - **No "Ver mais":** o crédito completo, com link pra página da foto no Commons e pra licença.
   - **Rodapé da tela Explorar:** "Dados: Wikidata, Wikipédia e © OpenStreetMap".
   - Fotos em domínio público ou CC0 mostram só "Foto: Wikimedia Commons".
   - É o mesmo jeito dos apps que usam foto de terceiros. O Google também exige crédito visível nas fotos do Places.

## Dicas pra implementar
- **Ordem:** banco → `packages/core/src/explorar.ts` (regras puras e testadas) → Edge Function → web → mobile.
- **`packages/core/src/explorar.ts` (sem rede):**
  - tipo → estilos e tipo → tempo médio e melhor hora;
  - montar a pilha (filtrar por estilo e orçamento, ordenar por fama e tirar o que já é lugar da viagem);
  - o "redutor" do deslizar (quero, passo, não abro mão, desfazer);
  - trecho a pé entre dois pontos (reaproveitar `distanciaEmMetros` do `ferramentas.ts`).
- **Roteiro:** reaproveitar `montarDiasPelosVotos` (`packages/core/src/montar-dias.ts`) e só acrescentar o parâmetro de ritmo.
- **Edge Function:** copiar o jeito da `supabase/functions/atualizar-exigencias` (chamada externa, gravação com chave de serviço, agendamento por pg_cron).
- **Armadilhas que o teste de 02/11/2026 mostrou:**
  - o Overpass público trava e bloqueia com poucas consultas pesadas. **Nunca ao vivo.** Se usar, só na preparação, com tempo-limite e servidor reserva;
  - a busca da Wikidata "perto deste ponto" sem filtro de tipo traz conceitos (Império Romano, campeonatos). Use **lista de tipos que contam** (com `wdt:P31/wdt:P279*`), não lista de exclusão;
  - a Wikidata e o Nominatim exigem `User-Agent` com contato. O Nominatim permite 1 consulta por segundo;
  - no Commons, só funcionam miniaturas de tamanho padrão (330, 500, 960, 1280).
- **UX:** seguir o protótipo, principalmente o cartão de baixo parado, a troca sem animação e os botões com nome. Tamanho mínimo de toque: 44 px.
- **Testes:** PGlite pra `explorar_escolhas` (só eu vejo as minhas) e pro catálogo (só a função escreve). Testes puros pro `explorar.ts`.
- **Licenças:**
  - Wikidata é CC0 (pode guardar à vontade);
  - texto da Wikipédia é CC BY-SA (citar a fonte com link);
  - fotos do Commons têm licença por foto (guardar autor e licença);
  - OpenStreetMap é ODbL (crédito "© OpenStreetMap").
