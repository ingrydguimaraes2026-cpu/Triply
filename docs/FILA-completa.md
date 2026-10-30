# Fila completa: tudo que falta, uma task atrás da outra

**Atualizado:** 30/10/2026 · **Base:** `reports/Catálogo de funcionalidades da plataforma.md` (141 itens) + `docs/ideias-de-outros-apps.md` (ideias novas)

Este é o **roteiro de execução**. Ele substitui a ordem das ondas na hora de escolher a próxima task: pega a **primeira linha não feita** e vai. O `docs/FILA-onda-1.md` continua valendo para o detalhe das tasks da Onda 1.

## Placar
| | Itens |
|---|---|
| Catálogo original | 141 |
| Ideias novas de outros apps | 6 (C11, C12, D13, E11, E12, I12) |
| Já prontos (antes + Onda 1 na web) | 34 |
| **A fazer** | **113** (112 na fila, com a M2 dividida em 2 linhas; o G8 fica guardado) |

Já prontos: B1 C1 C2 D1 D2 D3 E1 E2 E3 E4 F1 H1 H2 H3 H4 H5 I1 K1 M1 (antes) · A1 A5 B2 B3 B7 D6 E5 E6 F2 G1 G2 G3 G5 I4 I6 (Onda 1, specs 018 a 031).

## Como usar
1. Pega a primeira linha com status **a fazer**. Se ela tem 🔒, pula e segue (está esperando decisão do Victor).
2. Escreve a spec em `docs/specs/` (modelo `_modelo.md`), implementa (banco → core → web → mobile), testa pelos critérios, atualiza o status **aqui** e no `docs/specs/README.md`, commita.
3. Ideia nova de outro app: registra em `docs/ideias-de-outros-apps.md`, dá um código e encaixa aqui na fase certa.

Legenda: **Tam.** P/M/G como no catálogo · 🔒 = decisão do Victor antes de codar · ◐ = já existe um pedaço

## Por que nessa ordem
- **Fase 1:** fecha a Onda 1 (o que já está começado).
- **Fase 2:** leva pro app mobile tudo que só existe na web. Sem isso, a fila só cresce de um lado.
- **Fase 3:** itens P de impacto alto, sem decisão pendente. Muita entrega rápida.
- **Fase 4:** o modo **Hoje** e as ideias de "durante a viagem" (lote 1 de outros apps).
- **Fase 5:** itens M que mudam o planejamento (decidir juntos, agenda, mapa, transportes).
- **Fase 6:** dinheiro avançado (depende das decisões de H7/F3).
- **Fase 7:** plataforma (tempo real, offline completo, histórico, acessibilidade).
- **Fase 8:** IA, memórias e o que é grande ou caro (APIs pagas, nativo).

---

## Fase 1 · Fechar a Onda 1
| Nº | Cód. | Task | Tam. | Status |
|---|---|---|---|---|
| 1 | B5 | Lembretes (push antes de trem, check-out, encontro) · spec 032 | M | ✅ feito (web) · banco a aplicar |
| 2 | G4 | Preferências de notificação por tipo (completa o sino da 031) · spec 033 | P | ✅ feito (web) · banco a aplicar |
| 3 | D4 | Situação e preço do trajeto + "lançar como gasto" | P | ✅ feito (web) · spec 035 · banco a aplicar |
| 4 | M6 | Calendário da viagem (ICS) no Google/Apple | P | ✅ feito (web) · spec 036 |
| 5 | J3 | Botão de emergência (número local, consulado, seguro) | P | ✅ feito (web) · spec 037 |
| 6 | I2 | Nacionalidade no perfil (sem número de documento) | P | ✅ feito (web) · spec 038 · banco a aplicar |
| 7 | I3 | Validade do passaporte com alerta de 6 meses | P | ✅ feito (web) · spec 038 · banco a aplicar |
| 8 | I5 | Seguro viagem (apólice, telefone 24 h, quem está coberto) | P | ✅ feito (web) · spec 039 · banco a aplicar |
| 9 | M3 | Offline de leitura · spec 034 | G | ✅ feito (web) · spec 034 |
| 10 | F3 | Pessoa sem app · spec 030 🔒 | P | a fazer |
| 11 | H7 | Marcar acerto como pago 🔒 | P | a fazer |
| 12 | N1 | Fechamento da viagem 🔒 | P | a fazer |

## Fase 2 · Paridade do app mobile
| Nº | Cód. | Task | Tam. | Status |
|---|---|---|---|---|
| 13 | M2 | Levar pro mobile: convidado, avisos, tarefas, enquetes, votos, clima, ponto de encontro (018 a 024) ◐ | G | a fazer |
| 14 | M2 | Levar pro mobile: compartilhar, guia da casa, comentários, cofre/bilhete, agenda, sino, lembretes (025 a 032) ◐ | G | a fazer |

## Fase 3 · Rápidos de alto impacto
| Nº | Cód. | Task | Tam. | Status |
|---|---|---|---|---|
| 15 | C5 | Abrir no app de navegação (Maps, Waze, Apple, Citymapper) ◐ | P | ✅ feito (web) · spec 040 |
| 16 | D13 | Pedir corrida comparando Uber, Bolt, Free Now (ideia: Bolt) | P | ✅ feito (web) · spec 040 |
| 17 | E10 | Prazo de cancelamento grátis da reserva + lembrete | P | ✅ feito (web) · spec 041 · banco a aplicar |
| 18 | G6 | Resumo da noite (push 21h com o "amanhã") | P | ✅ feito (servidor) · spec 042 · banco a aplicar |
| 19 | G7 | Menções `@nome` em comentário e tarefa | P | ✅ feito (web) · spec 043 |
| 20 | A7 | Decisões registradas (enquete encerrada vira decisão) | P | ✅ feito (web) · spec 044 · banco a aplicar |
| 21 | A3 | Orçamento combinado (faixa secreta de cada um) | P | ✅ feito (web) · spec 045 · banco a aplicar |
| 22 | A8 | Modo rascunho ("sonhando"), viagem sem destino fechado ◐ | P | ✅ feito (web) · spec 046 |
| 23 | I9 | Ficha do país (tomada, gorjeta, fuso, emergência, internet) | P | ✅ feito (web) · spec 047 |
| 24 | I12 | Internet no destino: lembrete do eSIM antes de embarcar (ideia: Holafly) | P | ✅ feito (web) · spec 047 |
| 25 | I8 | Itens do grupo ("quem leva o adaptador") | P | ✅ feito (web) · spec 048 · banco a aplicar |
| 26 | I11 | Contagem e progresso ("faltam 23 dias · 78% pronto") | P | ✅ feito (web) · spec 049 |
| 27 | I10 | Lista de compras com "lançar como gasto" | P | ✅ feito (web) · spec 048 · banco a aplicar |
| 28 | F6 | Contatos de emergência e saúde (visível só pra quem a pessoa escolher) | P | ✅ feito (web) · spec 050 · banco a aplicar |
| 29 | F5 | Ficha da pessoa (alergias, restrições, aniversário) ◐ | P | ✅ feito (web) · spec 050 · banco a aplicar |
| 30 | F9 | "Cheguei bem" | P | ✅ feito (web) · spec 051 · banco a aplicar |
| 31 | H13 | Gastos planejados e recorrentes | P | ✅ feito (web) · spec 057 · banco a aplicar |
| 32 | H14 | Meu orçamento pessoal ◐ | P | ✅ feito (web) · spec 056 · banco a aplicar |
| 33 | H16 | Exportar gastos (CSV, PDF, Splitwise) | P | ✅ feito (web) · spec 052 |
| 34 | M9 | Busca na viagem (um campo acha tudo) | P | ✅ feito (web) · spec 053 |
| 35 | M12 | Modo escuro | P | adiado pro fim: 309 cores fixas no CSS, precisa revisão visual |
| 36 | N2 | Arquivar viagem | P | ✅ feito (web) · spec 054 · banco a aplicar |
| 37 | N3 | Repetir com o mesmo comboio | P | ✅ feito (web) · spec 055 · banco a aplicar |
| 38 | N7 | Perfil viajante (dados que se repetem entre viagens) | P | ✅ coberto por 038 (passaporte) + 050 (ficha da pessoa); modelo de mala fica com I7 |

## Fase 4 · Modo Hoje e "durante a viagem"
| Nº | Cód. | Task | Tam. | Status |
|---|---|---|---|---|
| 39 | J1 | Tela Hoje (agora, próximo item, onde dormimos, encontro, clima) ◐ | M | ✅ feito (web) · spec 058 |
| 40 | J2 | Conversor de moeda na mão ◐ | P | ✅ feito (web) · spec 059 |
| 41 | J4 | Mostrar pro motorista (endereço no idioma local, tela cheia) | P | ✅ feito (web) · spec 059 |
| 42 | J6 | Gorjeta e divisão de conta pelo costume do país | P | ✅ feito (web) · spec 059 |
| 43 | E8 | Malas antes do check-in (guarda-volumes na hospedagem) ◐ | P | ✅ feito (web) · spec 060 · banco a aplicar |
| 44 | E12 | Busca pronta de guarda-volumes perto (ideia: Nannybag) | P | ✅ feito (web) · spec 059 |
| 45 | J5 | Dia de passagem (guarda-volumes + horário-limite + último trem) ◐ | P | ✅ feito (web) · spec 060 |
| 46 | C11 | Banheiro grátis perto, dados do OpenStreetMap (ideia: Flush) | P | ✅ feito (web) · spec 059 |
| 47 | C12 | Achar e reservar restaurante (TheFork / Maps) no destino (ideia: TheFork) | P | ✅ feito (web) · spec 059 |
| 48 | C8 | Perto de mim (lugares salvos mais próximos) | P | ✅ feito (web) · spec 061 |
| 49 | C10 | "Já fomos" (marcar lugar como visitado) | P | ✅ feito (web) · spec 061 · banco a aplicar |
| 50 | D12 | Transfer de chegada (aeroporto/estação → hospedagem) | P | ✅ feito (web) · spec 062 · banco a aplicar |
| 51 | E11 | Vibe e etiquetas da opção de hospedagem + hostel na busca (ideia: Hostelworld) | P | ✅ feito (web) · spec 063 · banco a aplicar |

## Fase 5 · Planejar melhor (itens M)
| Nº | Cód. | Task | Tam. | Status |
|---|---|---|---|---|
| 52 | C3 | Lugares no mapa (pins por tipo e dia) | M | parcial: lugares já guardam coordenada (spec 064); falta o mapa com pins (junto do C9) |
| 53 | C4 | Buscar lugar com autocompletar | M | ✅ feito (web) · spec 064 · banco a aplicar |
| 54 | A2 | Datas em comum (cada um pinta os dias livres) | M | ✅ feito (web) · spec 065 · banco a aplicar |
| 55 | A6 | "Não abro mão" (3 obrigatórios por pessoa) | M | ✅ feito (web) · spec 066 · banco a aplicar |
| 56 | A4 | Destinos candidatos com voto | M | ✅ feito (web) · spec 075 · banco a aplicar |
| 57 | B8 | Arrastar entre dias | M | ✅ feito (web) · spec 071 (setas ‹ ›, sem arrastar) |
| 58 | B6 | Tempo entre compromissos (avisa quando não dá tempo) | M | ✅ feito (web) · spec 077 (sem API de rota: avisa sobreposição e folga curta) |
| 59 | B4 | Programação em paralelo (trilhas no mesmo dia) | M | ✅ feito (web) · spec 070 · banco a aplicar |
| 60 | B9 | Sugestão de ordem (menos deslocamento) ◐ | M | ✅ feito (web) · spec 076 |
| 61 | D5 | Quem vai em cada trajeto + "meu itinerário" | M | ✅ feito (web) · spec 067 · banco a aplicar |
| 62 | D8 | Conexões e estações (várias pernas) | M | ✅ feito (web) · spec 074 · banco a aplicar |
| 63 | D9 | Último trem para a base | M | parcial (web) · spec 080: hora da volta e aviso; horário real do último trem fica com D10 |
| 64 | D11 | Carro alugado e rodízio de motorista | M | ✅ feito (web) · spec 073 · banco a aplicar |
| 65 | E7 | Quem dorme onde | M | ✅ feito (web) · spec 068 · banco a aplicar |
| 66 | E9 | Prévia do link da opção (foto, título, preço) | M | ✅ feito (web + função) · spec 072 · banco a aplicar |
| 67 | F7 | Permissões simples do ADM | M | ✅ feito (web) · spec 078 · banco a aplicar (troca policies: revisar) |
| 68 | I7 | Mala individual com modelo pelo clima | M | ✅ feito (web) · spec 069 · banco a aplicar |
| 69 | C7 | Importar lista do Google Maps | M | ✅ feito (web) · spec 079 (CSV do Google Takeout) |

## Fase 6 · Dinheiro avançado
| Nº | Cód. | Task | Tam. | Status |
|---|---|---|---|---|
| 70 | F4 | Núcleos (casal, família) 🔒 | M | a fazer |
| 71 | H9 | Divisão por pesos e por item | M | ✅ feito (web) · spec 081 |
| 72 | H8 | Caixa do comboio (só registro) 🔒 | M | a fazer |
| 73 | H11 | Câmbio congelado e meio de pagamento no gasto | M | ✅ feito (web) · spec 083 · banco a aplicar (cotação só registro) |
| 74 | H12 | Dinheiro na mão (espécie por pessoa) | M | ✅ feito (web) · spec 083 · banco a aplicar |
| 75 | H15 | Relatórios | M | ✅ feito (web) · spec 082 |
| 76 | H6 | Saldo das contas globais (spec 015) ◐ | G | a fazer |
| 77 | H17 | Promover movimento da conta a gasto | M | a fazer |

## Fase 7 · Plataforma
| Nº | Cód. | Task | Tam. | Status |
|---|---|---|---|---|
| 78 | M5 | Tempo real (Supabase Realtime) | M | a fazer |
| 79 | M4 | Gravar offline (fila com regra de conflito) ◐ | G | a fazer |
| 80 | M8 | Histórico e lixeira de 30 dias | M | a fazer |
| 81 | M7 | Exportar a viagem em PDF | M | a fazer |
| 82 | M11 | Privacidade e LGPD (excluir conta, baixar meus dados) ◐ | M | a fazer |
| 83 | M10 | Acessibilidade e modo simples | M | a fazer |
| 84 | M15 | Outros idiomas (inglês, espanhol) | M | a fazer |
| 85 | N4 | Duplicar viagem e templates | M | a fazer |

## Fase 8 · IA, memórias e itens grandes
| Nº | Cód. | Task | Tam. | Status |
|---|---|---|---|---|
| 86 | L1 | Importar reserva (print/PDF/e-mail → item revisado) | M | a fazer |
| 87 | L2 | E-mail próprio da viagem | M | a fazer |
| 88 | H10 | Foto do recibo com leitura automática | M | a fazer |
| 89 | L3 | Detector de furos ◐ | M | a fazer |
| 90 | L8 | Gasto por frase ou voz | M | a fazer |
| 91 | L4 | Sugestões de lugares por destino | M | a fazer |
| 92 | L7 | Eventos e feriados nas datas | M | a fazer |
| 93 | L5 | Montar o dia pelos votos | G | a fazer |
| 94 | L6 | Assistente do comboio (aplicar / descartar) | G | a fazer |
| 95 | C6 | Colar link de rede social → lugar salvo | G | a fazer |
| 96 | K2 | Álbum por dia e destino ◐ | P | a fazer |
| 97 | K3 | Melhores fotos ◐ | P | a fazer |
| 98 | K5 | Baixar tudo (zip) | P | a fazer |
| 99 | K9 | Marcar pessoas nas fotos | P | a fazer |
| 100 | K6 | Diário da viagem | M | a fazer |
| 101 | K4 | Fotos no mapa | M | a fazer |
| 102 | K7 | Retrospectiva | G | a fazer |
| 103 | K8 | Livro da viagem (PDF) | G | a fazer |
| 104 | N5 | Mapa de onde já fui | M | a fazer |
| 105 | N6 | Estatísticas do viajante | M | a fazer |
| 106 | N8 | Indicar lugares pra um amigo | P | a fazer |
| 107 | D7 | Status do voo ao vivo (API paga) | M | a fazer |
| 108 | D10 | Horários reais de trem e ônibus (API) | G | a fazer |
| 109 | C9 | Mapa offline do destino | G | a fazer |
| 110 | J7 | Frases úteis com áudio | M | a fazer |
| 111 | F8 | Localização ao vivo temporária | G | a fazer |
| 112 | M14 | Carteira do celular (Apple/Google Wallet) | M | a fazer |
| 113 | M13 | Widgets e Live Activities | G | a fazer |

**Fora da fila de propósito:** G8 Bot de WhatsApp (custo da API oficial; avaliar depois) e tudo da seção "O que NÃO vamos fazer" do `docs/ROADMAP.md`.

---

## Decisões travadas (🔒) — perguntas pro Victor
- **F3 Pessoa sem app:** entra no saldo (alguém cobre por ela) ou é só nome na divisão? Vira membro normal quando cria conta?
- **H7 Acerto pago / N1 Fechamento:** quem recebe precisa confirmar? O saldo zera na hora? Guarda histórico?
- **F4 Núcleos / H8 Caixa:** dependem da resposta de H7 (mudam como o saldo é calculado).
