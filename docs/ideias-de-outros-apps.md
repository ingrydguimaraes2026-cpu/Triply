# Ideias de outros apps

Registro dos apps que aparecem em vídeos/prints que o Victor ou a Ingryd mandam. Para cada app: o que ele faz (como a pessoa descreveu), o que a gente tira dele e qual item da fila (`docs/FILA-completa.md`) ele vira ou reforça.

Regra: o Together **não copia** o app. Ou a gente **liga** pra ele (botão que abre o app com a busca pronta, como já fazemos com Airbnb/Booking) ou resolve **a dor por trás** dentro do comboio.

Os códigos novos (C11, D13...) continuam a numeração do `reports/Catálogo de funcionalidades da plataforma.md`.

---

## Lote 1 · 30/10/2026 · TikTok "apps que ninguém te conta mas ajudam a economizar em viagem"

| App | O que a pessoa contou | O que a gente tira | Item |
|---|---|---|---|
| **Hostelworld** | Achou os hostels lá; as avaliações ajudaram a escolher lugar seguro e bem localizado; dava pra ver a "vibe" (mais social ou mais tranquilo). | Hostel como mais um botão na busca pronta da Hospedagem. Na opção do comboio, etiquetas rápidas: social/tranquilo, seguro, bem localizado, e a nota do site. | **E11** novo · reforça E1 e E9 |
| **Flush** | Na Europa se paga 1 a 2 € pra usar banheiro; o app mostra os públicos/grátis perto e evita andar sem rumo. | "Banheiro grátis perto": dados abertos do OpenStreetMap (`amenity=toilets`, `fee=no`), no mapa e no modo Hoje. Sem conta, sem custo de API. | **C11** novo · reforça C8 e J1 |
| **TheFork** | Restaurantes perto; descobriu lugares bons; desconto reservando antes pelo app. | Botão "achar restaurante" no destino/lugar do tipo comida, abrindo TheFork (e Google Maps) com a cidade pronta; o lugar salvo guarda o link da reserva e o horário vira item da agenda. | **C12** novo · reforça L4 e B5 |
| **Bolt** | Na Europa é mais barato que Uber; vale comparar antes de pedir corrida. | Botão "pedir corrida" no lugar, na hospedagem e no ponto de encontro com Uber, Bolt e Free Now já com o destino, pra comparar. A corrida vira gasto rápido. | **D13** novo · reforça C5 e J4 |
| **Holafly** (eSIM) | Chegou no aeroporto com internet; não perdeu tempo com chip físico; fácil de ativar. | "Internet no destino" na preparação: lembrete de comprar e instalar o eSIM **antes** de embarcar, por país (vira tarefa automática). Sem afiliado por enquanto. | **I12** novo · reforça I9 e I11 |
| **Nannybag** | Guarda mala; mostra o locker mais perto, preço e horário que fecha; melhor que depender da hospedagem. | Busca pronta de guarda-volumes (Nannybag, Bounce, Radical Storage) perto da estação/hospedagem no dia de passagem e antes do check-in. | **E12** novo · reforça E8 e J5 |

**O que esse lote ensina:** as dores são de **durante a viagem** (banheiro, comida, corrida, mala, internet). Isso puxa o **modo Hoje (J1)** pra frente: ele é o lugar natural desses botões.
