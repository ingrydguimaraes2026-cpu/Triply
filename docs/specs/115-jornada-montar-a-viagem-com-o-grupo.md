# 115. Jornada nova: montar a viagem com o grupo

**Fase:** 2 · **Tamanho:** G · **Depende de:** 114 (Explorar) · **Status:** Rascunho (pra Victor e Ingryd aprovarem)

## Objetivo
Quem abre o Tripwave pela primeira vez sai com **um roteiro de verdade, montado com o grupo**, sem se perder. O app não só organiza a viagem que a pessoa já tem na cabeça: ele **ajuda a montar** o roteiro, a partir do destino e do que cada um quer fazer.

## Por que
Teste do Victor em 02/11/2026, no site: "eu, que sou o criador, estou me sentindo perdido". O que o código mostra hoje:
1. **A Nova viagem é um formulário** (destinos na ordem → datas → nome e moeda → convite) e termina numa viagem vazia.
2. **A viagem vazia tem 15 itens no menu**, todos com o mesmo peso. Hoje, Fotos e Retrospectiva aparecem antes de a viagem existir.
3. **Ninguém diz qual é o próximo passo.** A Overview resume tudo, mas não puxa pra nenhuma ação.
4. **Escolher lugares tem 3 caminhos que se sobrepõem:**
   - o Explorar, escondido dentro de Lugares;
   - as Sugestões;
   - o "Montar dias".
5. **Quem é convidado cai no mesmo labirinto** e não sabe o que esperam dele.
6. **O app parte do pressuposto de que o grupo já sabe o roteiro.** A maioria só tem um "Europa em junho, uns 10 dias".

## A jornada nova (resumo)
1. **Desejo:** "Pra onde vocês querem ir?" e "Quantos dias?". Datas, nome e moeda ficam pra depois.
2. **Galera:** o convite vem logo depois, com a frase "chame quem vai e deixe cada um escolher o que quer fazer".
3. **Cada um escolhe:** cada pessoa desliza os lugares do destino (o Explorar), no próprio celular.
4. **O app monta:** o roteiro dia a dia sai das escolhas de todos.
   - O que mais gente quis entra primeiro.
   - O "não abro mão" de cada um é garantido.
   - O que fica perto vai pro mesmo dia.
5. **Ajustar e seguir:** trocar, tirar e pôr na agenda. Depois disso o cartão de **próximo passo** leva pra hospedagem, transporte e gastos.

## Inclui (em etapas, uma de cada vez, um commit por etapa)

| # | Etapa | O que muda |
|---|---|---|
| 1 | **Nova viagem pelo desejo** | Passo 1: "Pra onde?" (uma ou mais cidades/países). Passo 2: "Quantos dias?" (número, datas opcionais). Cria a viagem e cai direto no **Explorar** do primeiro destino. Nome automático ("Paris · jun 2027"), moeda pelo país; os dois editáveis depois. É a Decisão 5 da spec 114, estendida. |
| 2 | **Cartão "Próximo passo"** | No topo da viagem, um cartão só, que muda conforme o que falta (ver tabela abaixo). Regra pura no core, testada. |
| 3 | **Menu por fase** | Antes da viagem: Roteiro, Comboio, Hospedagem, Transportes, Financeiro. Durante: Hoje no topo. Depois: Retrospectiva e Livro. O resto vai pra "Mais". |
| 4 | **Explorar vira "Roteiro"** | Item próprio no menu (não mais escondido em Lugares). As Sugestões e o "Montar dias" passam a ser partes dele. A aba Lugares continua como lista do que já foi salvo. |
| 5 | **Convidado entra pelo que é dele** | O link de convite leva pra "Escolha o que você quer fazer em Paris" (Explorar), com uma frase de quem convidou. Sem passar pela Overview. |
| 6 | **Roteiro do grupo** | No Explorar: "3 de 5 já escolheram" e o botão "Montar com as escolhas de todos". Botão "Lembrar quem falta" (compartilha o link de novo; aviso automático fica pra depois). |
| 7 | **Vários destinos** | Com mais de um destino: o app sugere quantos dias em cada um (pelo tamanho do catálogo e pelas escolhas) e a ordem (o que fica perto em sequência). |

### Cartão "Próximo passo" (etapa 2)
Mostra o primeiro item que ainda falta, nesta ordem:

| Falta | Cartão |
|---|---|
| Ninguém escolheu lugares | "Escolha o que você quer fazer em {destino}" → Explorar |
| Só eu escolhi | "Chame a galera pra escolher também" → convite |
| Alguns escolheram | "{n} de {total} já escolheram. Montar o roteiro?" → montar |
| Sem roteiro na agenda | "Seu roteiro está pronto. Põe na agenda?" |
| Sem datas | "Quando vocês vão?" → datas |
| Sem hospedagem escolhida | "Onde vocês vão dormir em {destino}?" → Hospedagem |
| Sem trajeto entre destinos | "Como vocês vão de {A} pra {B}?" → Transportes |
| Durante a viagem | "Hoje: {primeiro item da agenda}" → Hoje |
| Depois da viagem | "Fechem as contas" ou "Vejam a retrospectiva" |

## Não inclui (fica pra depois)
- **"Não sei pra onde ir"** (sugerir destinos por vibe, época e orçamento). É o maior pedaço e vira a spec 116. Por enquanto, quem não sabe digita uma região ("Nordeste", "Europa") ou escolhe numa lista curta de destinos populares (os 100 da pré-carga).
- Explorar de restaurantes (o catálogo hoje é só de passeios).
- Tela nova no app mobile. Primeiro o site; o app copia quando a jornada estiver aprovada.
- Mudar regras de dinheiro ou do banco além do que a etapa 6 pede.

## Telas
- **Nova viagem (etapa 1):** mesma moldura de cartão sobre o mapa (spec 113), só 2 passos. Botão principal "Começar a escolher". Link pequeno "Já tenho tudo planejado" leva pro formulário completo de hoje.
- **Topo da viagem (etapa 2):** o cartão fica acima de tudo na Overview, cor couro, com 1 frase e 1 botão. Sem cartão quando não falta nada.
- **Menu (etapa 3):** no máximo 6 itens visíveis + "Mais". No celular, a barra de baixo segue a mesma ordem.
- **Explorar do convidado (etapa 5):** cabeçalho "{quem convidou} chamou você pra {viagem}. Escolha o que quer fazer em {destino}."
- **Vazio:** destino sem lugares no catálogo mostra "Ainda não temos lugares de {destino}. Adicione os seus" (lugar manual) em vez de uma tela em branco.

## Dados
- **Já existe e é usado:** `catalogo_cidades`, `catalogo_lugares`, `explorar_escolhas`, `explorar_criar_lugares` (escolhas viram lugares, curtidas e prioridades), `lugar_votos`, `lugar_prioridades`, `montarDiasPelosVotos` (já soma os votos de todos).
- **Etapa 6 precisa de 1 função nova no banco:** quantas pessoas do comboio já escolheram em cada destino (só o número, sem mostrar as escolhas de ninguém, porque `explorar_escolhas` é "só eu vejo"). Migration nova, com confirmação antes de aplicar.
- Etapas 1 a 5 e 7: nada muda no banco.

## Quem pode o quê
| Ação | ADM | Membro |
|---|---|---|
| Criar a viagem pelo desejo | ✅ (quem cria vira ADM) | — |
| Deslizar e ver as próprias escolhas | ✅ | ✅ |
| Ver quantos já escolheram | ✅ | ✅ |
| "Montar com as escolhas de todos" e pôr na agenda | ✅ | ❌ (vê o roteiro, sugere) |
| Mudar destinos e dias | ✅ | ❌ |

## Critérios de aceite
- [ ] **Teste do criador:** alguém que nunca viu o app cria uma viagem e chega a um roteiro dia a dia em **menos de 3 minutos, sem ajuda**. Fazer com o Victor e com a Ingryd.
- [ ] **Teste do convidado:** abrindo o link de convite, a pessoa chega no Explorar do destino sem passar por outra tela, e as escolhas dela aparecem no roteiro do grupo.
- [ ] O cartão "Próximo passo" sempre mostra uma ação só e muda quando ela é feita.
- [ ] Antes da viagem, o menu mostra no máximo 6 itens + "Mais".
- [ ] "Já tenho tudo planejado" continua criando a viagem do jeito de hoje (nada se perde).
- [ ] Funciona em 360px sem rolar pro lado.
- [ ] `npm run build` e `npm run lint` passam; testes do core verdes (regra do próximo passo e dos dias por destino).

## Perguntas em aberto
1. **Nome do item no menu:** "Roteiro", "Montar roteiro" ou "Explorar"? Proposta: **"Roteiro"** (é o que a pessoa quer; Explorar é o jeito).
2. **Datas:** pedir já no passo 2 (opcional) ou só no cartão "Quando vocês vão?"? Proposta: **opcional no passo 2**, porque quem já sabe não quer voltar depois.
3. **Quem monta o roteiro do grupo:** só o ADM ou qualquer um? Proposta: **só o ADM põe na agenda**; qualquer um vê a prévia.
4. **Esperar todo mundo escolher?** Proposta: o ADM pode montar quando quiser; o cartão só avisa quantos faltam.
5. **Ordem das etapas:** proposta 1 → 2 → 4 → 5 → 6 → 3 → 7 (o menu por fase por último, porque mexe em tudo).

## Dicas pra implementar
- **Etapa 1:** `apps/web/src/pages/NovaViagem.tsx` (hoje 4 passos: `destinos | datas | nome | comboio`). Manter o formulário de hoje atrás do "Já tenho tudo planejado". Nome e moeda automáticos: `codigoDoPais` já existe no core.
- **Etapa 2:** regra pura `proximoPasso(...)` num arquivo novo `packages/core/src/proximo-passo.ts`, com teste em `apps/web/tests/`. A tela só mostra.
- **Etapa 3:** menu em `apps/web/src/pages/viagem/ViagemLayout.tsx` (spec 113). Fase da viagem: antes / durante / depois, pelas datas.
- **Etapa 4:** rota `explorar` já existe (`router.tsx`). `SugestoesDoDestino` e `MontarDias` já leem o mesmo catálogo/votos.
- **Etapa 5:** `apps/web/src/pages/Convite.tsx` → depois de entrar, redirecionar pro Explorar do primeiro destino.
- **Etapa 6:** função `security definer` que devolve `count(distinct usuario_id)` por destino, só pra quem é do comboio.
- **Etapa 7:** reaproveitar `distanciaKm` e `regiaoEspalhada` do `explorar.ts`.
