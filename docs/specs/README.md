# Specs: o que vamos construir

Cada arquivo aqui é um "envelope" de uma funcionalidade: o que é, por que existe, o que entra e o que não entra, quais telas e tabelas usa, e como saber que ficou pronto.

**Antes de começar qualquer funcionalidade, leia a spec dela.** Se algo não estiver claro ou precisar mudar, combine com o Victor e atualize a spec primeiro.

**O plano das próximas funcionalidades (em ondas) está no [`docs/ROADMAP.md`](../ROADMAP.md).** Cada item de lá vira uma spec aqui antes de codar.

Foco agora: **só o app**. Infraestrutura (banco de testes separado, publicar na internet, testes automáticos no GitHub, e-mail próprio) fica pra depois.

## Roteiro

| # | Spec | Fase | Tamanho | Depende de | Status |
|---|---|---|---|---|---|
| — | Editar o roteiro (era o PR #3) | 1 | M | — | Pronto pra testar |
| 001 | [Datas de cada destino](001-datas-dos-destinos.md) | 1 | P | PR #3 | Pronto pra testar |
| 002 | [Financeiro: gastos e divisão](002-financeiro-gastos-e-divisao.md) | 1 | G | — | Pronto pra testar |
| 003 | [Financeiro: orçamento e câmbio](003-financeiro-orcamento-e-cambio.md) | 1 | M | 002 | Pronto pra testar |
| 004 | [Transportes](004-transportes.md) | 1 | G | 001 | Pronto pra testar |
| 005 | [Fotos](005-fotos.md) | 1 | M | — | Pronto pra testar |
| 006 | [Overview com dados reais](006-overview-com-dados-reais.md) | 2 | P | 002, 003, 004, 005 | Pronto pra testar |
| 007 | [Gestão do comboio](007-gestao-do-comboio.md) | 2 | P | — | Pronto pra testar |
| 008 | [Minhas viagens e perfil](008-minhas-viagens-e-perfil.md) | 2 | M | — | Pronto pra testar |
| 009 | [Lançamento rápido de gasto](009-lancamento-rapido-de-gasto.md) | 2 | M | 002 | Pronto pra testar |
| 010 | [Documentos de entrada](010-documentos-de-entrada.md) | 2 | M | 001 | Pronto pra testar |
| 011 | [Hospedagem](011-hospedagem.md) | 2 | M | 001 | Pronto pra testar |
| 012 | [Termômetro do câmbio](012-termometro-do-cambio.md) | 2 | P | 003 | Pronto pra testar |
| 013 | [Boletim do câmbio no celular](013-avisos-de-cambio.md) | 2 | M | 012 | Pronto pra testar |
| 014 | [Feed de fotos do comboio](014-feed-de-fotos.md) | 2 | G | 005, 013 | Pronto pra testar |
| 015 | [Saldo da viagem por e-mail (Wise e Nomad)](015-saldo-por-email.md) | 3 | G | 002, 003, 013 | A fazer |
| 016 | [Lugares de cada destino](016-lugares-dos-destinos.md) (passeios, comida, guarda-volumes) | 2 | M | 001 | Pronto pra testar |
| 011+ | [Hospedagem: horário de check-in/out](011-hospedagem.md#atualização-de-23102026-horário-de-check-in-e-check-out) | 2 | P | 011 | Pronto pra testar |
| 017 | [Arquitetura: monorepo, core e app mobile](017-arquitetura-monorepo-e-mobile.md) | 3 | G | app atual | Em andamento |
| 018 | [Convidado sem conta](018-convidado-sem-conta.md) (entra pelo link só com o nome) | 2 | M | 007 | Em andamento |
| 019 | [Avisos do ADM](019-avisos-do-adm.md) (recado fixado no topo da viagem) | 2 | P | 007 | Em andamento |
| 020 | [Tarefas com responsável](020-tarefas-com-responsavel.md) (quem fica com o quê, com prazo) | 2 | P | 007 | Em andamento |
| 021 | [Enquete rápida](021-enquetes-rapidas.md) (pergunta com opções pra decidir junto) | 2 | P | 007 | Em andamento |
| 022 | [Votos em lugares](022-votos-em-lugares.md) (curtir passeios e comidas) | 2 | P | 016 | Em andamento |
| 023 | [Clima por dia](023-clima-por-dia.md) (previsão do tempo em cada dia do roteiro) | 2 | P | 001 | Em andamento |
| 024 | [Ponto de encontro](024-ponto-de-encontro.md) (onde e que horas se encontrar, com mapa) | 2 | P | 007 | Em andamento |
| 025 | [Compartilhar no WhatsApp](025-compartilhar-no-whatsapp.md) (link que abre direto no item) | 2 | P | — | Em andamento |
| 026 | [Endereço e guia da casa](026-guia-da-casa.md) (Wi-Fi, código da porta, regras) | 2 | P | 011 | Pronto pra testar (web) |
| 027 | [Comentários em qualquer item](027-comentarios-em-itens.md) (gasto, lugar e hospedagem) | 2 | M | 002, 011, 016 | Pronto pra testar (web) |
| 028 | [Cofre da viagem + bilhete no trajeto](028-cofre-e-bilhete.md) (PDFs e fotos de reservas) | 2 | M | 004 | Pronto pra testar (web) |
| 029 | [Agenda do dia](029-agenda-do-dia.md) (trajetos, chegadas e eventos por dia, com hora) | 2 | G | 003, 004 | Pronto pra testar (web) |
| 031 | [Central de notificações](031-central-de-notificacoes.md) (sino com o que o comboio fez desde a última visita) | 2 | M | várias | Pronto pra testar (web) |
| 032 | [Lembretes no celular](032-lembretes.md) (1 h antes de trajeto e encontro) | 2 | M | 004, 013, 024 | Pronto pra testar (web) · banco não aplicado |
| 033 | [Preferências de aviso](033-preferencias-de-aviso.md) (o que cada um recebe no celular) | 2 | P | 032 | Pronto pra testar (web) · banco não aplicado |
| 035 | [Situação e preço do trajeto](035-situacao-e-preco-do-trajeto.md) (sugestão/reservado/comprado + lançar como gasto) | 2 | P | 002, 004 | Pronto pra testar (web) · banco não aplicado |
| 036 | [Calendário da viagem](036-calendario-da-viagem.md) (.ics pro Google/iPhone/Outlook) | 2 | P | 029 | Pronto pra testar (web) |
| 037 | [Botão de emergência](037-emergencia.md) (números do país, hospital, consulado) | 2 | P | 010 | Pronto pra testar (web) |
| 038 | [Passaporte: nacionalidade e validade](038-passaporte-e-nacionalidade.md) (aviso de 6 meses) | 2 | P | 008, 010 | Pronto pra testar (web) · banco não aplicado |
| 039 | [Seguro viagem](039-seguro-viagem.md) (telefone 24 h na Emergência, quem está coberto) | 2 | P | 037 | Pronto pra testar (web) · banco não aplicado |
| 034 | [Offline de leitura](034-offline-de-leitura.md) (o que já abriu abre sem internet) | 2 | G | PWA | Pronto pra testar (web publicado) |
| 040 | [Ir até o lugar e pedir corrida](040-ir-e-pedir-corrida.md) (Maps, Waze, Apple, Citymapper, Uber, Bolt, FREENOW) | 2 | P | 016, 024 | Pronto pra testar (web) |
| 041 | [Prazo de cancelamento grátis](041-prazo-de-cancelamento.md) (contagem + lembrete 2 dias antes) | 2 | P | 011, 032 | Pronto pra testar (web) · banco não aplicado |
| 042 | [Resumo da noite](042-resumo-da-noite.md) (push às 21h com o amanhã) | 2 | P | 029, 032 | Pronto pra testar (servidor) · banco não aplicado |
| 043 | [Menções @nome](043-mencoes.md) (destaque + aviso no celular) | 2 | P | 027 | Pronto pra testar (web) |
| 044 | [Decisões registradas](044-decisoes-registradas.md) (enquete fechada vira decisão) | 2 | P | 021 | Pronto pra testar (web) · banco não aplicado |
| 045 | [Orçamento combinado](045-orcamento-combinado.md) (faixa secreta de cada um, faixa comum pro comboio) | 2 | P | 003 | Pronto pra testar (web) · banco não aplicado |
| 046 | [Modo sonhando](046-modo-sonhando.md) (criar a viagem antes de saber o destino) | 2 | P | 021, 045 | Pronto pra testar (web) |
| 047 | [Ficha do país + internet no destino](047-ficha-do-pais.md) (tomada, gorjeta, idioma, eSIM) | 2 | P | 010, 020 | Pronto pra testar (web) |
| 048 | [Listas do comboio](048-listas-do-comboio.md) (quem leva + compras com lançar como gasto) | 2 | P | 002 | Pronto pra testar (web) · banco não aplicado |
| 049 | [Contagem e progresso](049-contagem-e-progresso.md) ("faltam 23 dias · 78% pronto") | 2 | P | 006, 035 | Pronto pra testar (web) |
| 050 | [Ficha da pessoa + emergência e saúde](050-ficha-da-pessoa.md) (alergias, aniversário, saúde só pra quem liberar) | 2 | P | 007, 008 | Pronto pra testar (web) · banco não aplicado |
| 051 | ["Cheguei bem"](051-cheguei-bem.md) (um toque avisa o comboio) | 2 | P | 013 | Pronto pra testar (web) · banco não aplicado |
| 052 | [Exportar gastos](052-exportar-gastos.md) (planilha e Splitwise) | 2 | P | 002 | Pronto pra testar (web) |
| 053 | [Busca na viagem](053-busca-na-viagem.md) (um campo acha tudo) | 2 | P | várias | Pronto pra testar (web) |
| 054 | [Arquivar viagem](054-arquivar-viagem.md) (some só da minha lista) | 2 | P | 008 | Pronto pra testar (web) · banco não aplicado |
| 055 | [Repetir com o mesmo comboio](055-repetir-comboio.md) (nova viagem já com as pessoas) | 2 | P | 007 | Pronto pra testar (web) · banco não aplicado |
| 056 | [Meu orçamento pessoal](056-meu-orcamento.md) (minha parte + pessoais, quanto sobra por dia) | 2 | P | 003 | Pronto pra testar (web) · banco não aplicado |
| 057 | [Gastos planejados e recorrentes](057-pagamentos-previstos.md) ("A pagar", fora dos acertos até pagar) | 2 | P | 002 | Pronto pra testar (web) · banco não aplicado |
| 058 | [Tela Hoje](058-tela-hoje.md) (agora, próximo, onde dormimos, encontro) | 2 | M | 029, 040 | Pronto pra testar (web) |
| 059 | [Ferramentas do dia](059-ferramentas-do-dia.md) (conversor, gorjeta, motorista, banheiro, restaurante, malas) | 2 | P | 058 | Pronto pra testar (web) |
| 060 | [Malas antes do check-in + dia de passagem](060-malas-e-dia-de-passagem.md) (na Hospedagem e na Hoje) | 2 | P | 011, 058 | Pronto pra testar (web) · banco não aplicado |
| 061 | ["Já fomos" e "Perto de mim"](061-ja-fomos-e-perto-de-mim.md) (Lugares) | 2 | P | 016, 040 | Pronto pra testar (web) · banco não aplicado |
| 062 | [Transfer de chegada](062-como-chegar.md) ("como chegar" no guia e na Hoje) | 2 | P | 026, 058 | Pronto pra testar (web) · banco não aplicado |
| 063 | [Vibe da hospedagem + hostels](063-vibe-da-hospedagem.md) (etiquetas, nota, busca de hostels) | 2 | P | 011 | Pronto pra testar (web) · banco não aplicado |
| 064 | [Buscar lugar com autocompletar](064-buscar-lugar.md) (sugestões reais, guarda onde fica) | 2 | M | 016 | Pronto pra testar (web) · banco não aplicado |
| 065 | [Datas em comum](065-datas-em-comum.md) (cada um pinta os dias livres) | 2 | M | 007 | Pronto pra testar (web) · banco não aplicado |
| 066 | ["Não abro mão"](066-nao-abro-mao.md) (3 obrigatórios por pessoa por destino) | 2 | M | 022 | Pronto pra testar (web) · banco não aplicado |
| 067 | [Quem vai em cada trajeto](067-quem-vai-no-trajeto.md) (+ "meu itinerário" e lembrete só pra quem vai) | 2 | M | 004, 032 | Pronto pra testar (web) · banco não aplicado |
| 068 | [Quem dorme onde](068-quem-dorme-onde.md) (quartos, vagas, sorteio) | 2 | M | 011 | Pronto pra testar (web) · banco não aplicado |
| 069 | [Minha mala](069-mala-individual.md) (checklist pessoal com modelo pelo clima) | 2 | M | 048 | Pronto pra testar (web) · banco não aplicado |
| 070 | [Programação em paralelo](070-programacao-em-paralelo.md) (evento só de parte do comboio) | 2 | M | 029 | Pronto pra testar (web) · banco não aplicado |
| 071 | [Mover evento entre dias](071-mover-entre-dias.md) (setas ‹ › na Agenda) | 2 | P | 029 | Pronto pra testar (web) |
| 072 | [Prévia do link](072-previa-do-link.md) (título e foto da opção de hospedagem) | 2 | M | 011 | Pronto pra testar (web + função) · banco não aplicado |
| 073 | [Carro e rodízio de motorista](073-carro-e-rodizio.md) (quem dirige, km estimados) | 2 | M | 004 | Pronto pra testar (web) · banco não aplicado |
| 074 | [Conexões e estações](074-conexoes.md) (escalas com alerta de conexão curta) | 2 | M | 004 | Pronto pra testar (web) · banco não aplicado |
| 075 | [Destinos candidatos](075-destinos-candidatos.md) ("Pra onde vamos?" com voto) | 2 | M | 046 | Pronto pra testar (web) · banco não aplicado |
| 076 | [Sugestão de ordem do roteiro](076-sugestao-de-ordem.md) (menos km, com a fonte) | 2 | M | PR #3 | Pronto pra testar (web) |
| 077 | [Tempo entre compromissos](077-tempo-entre-compromissos.md) (avisa sobreposição e folga curta) | 2 | M | 029 | Pronto pra testar (web) |
| 078 | [Permissões simples](078-permissoes-simples.md) (roteiro, transportes, orçamento pro comboio) | 2 | M | 007 | Pronto pra testar (web) · banco não aplicado |
| 079 | [Importar lista do Google Maps](079-importar-do-maps.md) (CSV do Takeout) | 2 | M | 016 | Pronto pra testar (web) |
| 080 | [Volta pra base no bate-e-volta](080-volta-pra-base.md) (na Hoje, com atalho do último trem) | 2 | P | 058 | Pronto pra testar (web) · parcial |
| 081 | [Divisão por pesos e por item](081-divisao-por-pesos-e-itens.md) (casal, criança, conta de restaurante) | 2 | M | 002 | Pronto pra testar (web) |
| 082 | [Relatórios do Financeiro](082-relatorios.md) (por dia, por pessoa, custo por pessoa por dia) | 2 | M | 002 | Pronto pra testar (web) |
| 083 | [Meio de pagamento e dinheiro na mão](083-meio-de-pagamento-e-dinheiro-na-mao.md) (cartão/conta/dinheiro, cotação do dia) | 2 | M | 003 | Pronto pra testar (web) · banco não aplicado |
| 084 | [Movimento da carteira vira gasto](084-movimento-da-carteira-vira-gasto.md) | 2 | Pronto pra testar (web) · banco não aplicado |
| 085 | [Tempo real](085-tempo-real.md) | 7 | Pronto pra testar (web) · banco não aplicado |
| 086 | [Marcações sem internet](086-marcacoes-sem-internet.md) | 7 | Pronto pra testar (web) · sem banco |
| 087 | [Histórico e lixeira](087-historico-e-lixeira.md) | 7 | Pronto pra testar (web) · banco não aplicado |
| 088 | [A viagem em PDF](088-viagem-em-pdf.md) | 7 | Pronto pra testar (web) · sem banco |

Tamanho: **P** = poucos dias, **M** = cerca de uma semana, **G** = mais de uma semana.

A ordem da Fase 1 é uma sugestão. 002 e 005 não dependem de nada e podem começar a qualquer momento.

## Decisões tomadas nas perguntas em aberto (out/2026)

Na implementação, valeram as sugestões que as próprias specs davam:

- **001:** saída antes da chegada bloqueia o salvar; data fora do período só avisa, com o botão "Usar como período da viagem".
- **002:** a sobra dos centavos fica com quem pagou; gasto pessoal entra só no total de quem lançou; ainda sem "marcar como acertado".
- **003:** orçamento do comboio inteiro (a tela mostra por pessoa); comprinhas pessoais não contam; conversão pela cotação média do comboio e, sem compra registrada, pela cotação de hoje (Frankfurter).
- **004:** bate-e-volta vira 2 trajetos (a volta é criada junto); membro ainda não sugere trajeto.
- **005:** 5 fotos por destino, somando o comboio inteiro; ao chegar no limite, bloqueia (apaga uma pra pôr outra). Regra garantida no banco. *Substituída pela 014: virou feed, sem limite por lugar.*
- **007:** fotos e gastos de quem sai ficam na viagem, com o nome da pessoa.
- **008:** o app abre na viagem que está acontecendo agora; senão, na mais recente. Mudar a moeda só muda a exibição (os gastos não são convertidos).
- **009:** moeda padrão = a última usada; o botão "+" aparece só no celular.

## Fase 3: ideias guardadas (ainda sem spec)

- **Sugestão de ordem do roteiro.** A estrutura já existe em `src/features/destinos/ordem.ts` (`SugestaoDeOrdem`).
- **Horários reais de trem e ônibus** por uma API de transporte, pra preencher os trajetos.
- ~~Ler e-mails do banco pra lançar gastos sozinho~~ → virou a [spec 015](015-saldo-por-email.md).
- **Retrospectiva da viagem**: resumo com mapa, gastos e as melhores fotos no fim.
- **Nome definitivo do app** e domínio.

## Como usar uma spec

1. Leia a spec inteira e as **perguntas em aberto**. Resolva as perguntas com o Victor antes de codar.
2. Mude o status aqui pra "Em andamento".
3. Trabalhe na sua branch, um pedaço de cada vez.
4. Use os **critérios de aceite** como roteiro de teste antes de abrir o PR.
5. No PR, cite a spec (ex.: "Implementa a spec 002"). Quando entrar na `main`, mude o status pra "Feito".

Pra uma spec nova, copie o [`_modelo.md`](_modelo.md).
