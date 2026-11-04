# Teste do réveillon: 5 grupos reais no app

*03/11/2026. Plano de produto, sem código. Liga com `JORNADA.md` (a aposta central) e `PRECO.md` (vontade de pagar).*

## Por que esse teste

Nenhum grupo real usou o Tripwave até hoje. Tudo que sabemos vem de pesquisa, benchmark e do nosso próprio uso. O réveillon 2026/27 é a maior janela do ano pra viagem com amigos (benchmark: o pico vai de 26/12 a 04/01). Se 5 grupos não usam o app numa viagem que eles já vão fazer, nada mais importa.

## A pergunta que o teste responde

1. **Principal:** o grupo usa o Tripwave pra **fechar a conta** da viagem (sinal, gastos, acerto) em vez do zap + planilha + Splitwise? (aposta do dinheiro, `JORNADA.md`)
2. **Secundária:** o grupo volta ao app sem a gente pedir? Em que fase?
3. **Secundária:** alguém toca no Passe? Alguém paga?

**O que o teste NÃO responde:** se o app faz a viagem "sair do papel". Esses grupos já decidiram destino. Pra isso, ver "Grupos extras" no fim.

---

## Quem são os 5 grupos

**Perfil**
- Viagem marcada entre 26/12/2026 e 04/01/2027, de 3 a 7 noites.
- De 4 a 10 pessoas. Pelo menos 1 grupo com família (59,1% viajam em família, Imaginadora, em `reports/`).
- Tem gasto compartilhado de verdade (casa alugada, carro, mercado). Nacional ou internacional, tanto faz. Ideal: 1 internacional, pra testar câmbio e documentos.
- Um **organizador** que topa uma conversa de 30 minutos antes e outra depois.
- Ainda **não pagaram tudo**: tem sinal, compras ou divisão pela frente.

**De onde tirar**
| Fonte | Quantos | Cuidado |
|---|---|---|
| Lista de espera (`lista_espera`) | 3 | Victor puxa os e-mails no painel e manda o convite (texto abaixo). São os mais honestos: não nos conhecem. |
| Amigos de amigos (não amigos diretos) | 2 | Amigo direto mente pra agradar (regra do Mom Test). Pedir indicação: "conhece alguém que vai viajar em grupo no réveillon?". |
| Reserva | +2 | Recrutar 7 pra sobrarem 5. Grupo some, viagem cancela. |

Amigos próximos do Victor e da Ingryd: só se faltar gente, e anotar que o dado é mais fraco.

**Convite (e-mail ou DM, curto)**
> Oi! Você entrou na lista de espera do Tripwave. Estamos procurando 5 grupos que vão viajar juntos no réveillon pra usar o app antes de todo mundo, de graça. Em troca, a gente quer 2 conversas de 30 min com quem está organizando (uma agora, outra na volta). Vocês vão viajar em grupo no réveillon? Quantas pessoas, e pra onde?

Sem prometer nada além disso. Sem brinde que mude o comportamento (ex.: não pagar a casa de ninguém).

---

## O que cada grupo precisa fazer

| Quando | Quem | O quê |
|---|---|---|
| Até 27/11 | Organizador | Conversa "antes" (30 min). Instalar o app, criar a viagem com destino, datas e casa. |
| Até 27/11 | Organizador | Mandar o link de convite no grupo do zap. **A gente não manda por ele.** |
| Dezembro | Todos | Usar o que fizer sentido: votar, montar roteiro, lançar o sinal e os gastos planejados. |
| 26/12 a 04/01 | Todos | Viajar. Lançar os gastos onde quiserem (no app ou não: isso é o que medimos). |
| Até 15/01 | Organizador (+ 1 pessoa do grupo, se der) | Conversa "depois" (30 min). |

**O que a gente faz:** uma call de 15 min de ajuda na criação da viagem, se o organizador pedir. Depois disso, **nada de empurrar**: sem lembrete pessoal, sem "vocês já lançaram?". Só respondemos dúvida e consertamos bug. Se a gente empurrar, mede o nosso esforço, não o app.

**Canal de suporte:** um grupo de zap por organizador, com o Victor ou a Ingryd. Tudo que eles perguntarem ali é dado: anotar.

---

## O que medir

### Pelo banco (Victor, só leitura, no painel)
Uma consulta por grupo, toda segunda de dezembro e no fim:

| Métrica | De onde vem | Sinal bom (meta do teste, não do mercado) |
|---|---|---|
| % do comboio que entrou pelo link | membros da viagem / pessoas do grupo (perguntar na conversa) | 70% ou mais |
| Pessoas que abriram o app na semana | último acesso / ações por usuário | 3 ou mais por grupo em dezembro |
| Gastos lançados | tabela de gastos, por viagem | **a maioria** dos gastos do grupo (comparar com o que contam na conversa depois) |
| Quem lançou | autor de cada gasto | mais de 1 pessoa (se só o organizador lança, é planilha com outra cara) |
| Decisões no app | `candidato_votos`, `explorar_escolhas`, matches, enquetes | pelo menos a hospedagem ou o roteiro |
| Acerto | saldos depois da volta | conta fechada em até 7 dias depois da volta |
| Interesse no Passe | `interesse_no_passe` (`viu` / `quis`, por `origem`) | ver `PRECO.md` |
| Volta sozinho | nova viagem criada pelo comboio até 31/01 | 1 grupo ou mais |

Antes de começar: apagar as linhas de teste em `interesse_no_passe` (anotadas no `docs/HANDOFF-ux-definitiva.md`).

### Pela conversa
- Quanto dos gastos ficou **fora** do app, e por quê.
- O momento em que alguém abriu o app **sem ninguém pedir**.
- O que mandaram no zap que podia estar no app (e vice-versa).

### Diário curto (Victor e Ingryd)
Uma linha por dia de teste em `docs/produto/teste-reveillon/diario.md`: o que aconteceu, bug, pergunta de usuário. Sem interpretar na hora.

---

## Roteiro de conversa: ANTES (Mom Test)

**Regras**
- Falar do **passado e do concreto**, não do futuro ("da última viagem", não "você usaria?").
- **Não mostrar o app** nos primeiros 20 minutos. Não explicar a ideia.
- Elogio não vale nada. Anotar **o que fizeram**, não o que acham.
- Uma pessoa pergunta, a outra anota (se der, Victor e Ingryd juntos).

**Perguntas (escolher, não ler todas)**
1. Me conta como começou essa viagem do réveillon. Quem deu a ideia? Quanto tempo do "bora" até decidir?
2. Como vocês escolheram o lugar e a casa? Onde rolou essa conversa?
3. Quem pagou a casa? Como os outros pagaram a parte deles? Já pagaram todos?
4. Na última viagem em grupo: como vocês dividiram os gastos? O que deu errado?
5. Teve alguém que demorou pra pagar? Como foi cobrar?
6. Que apps ou planilhas vocês usaram? Pagaram por algum? Por que pararam de usar?
7. **Posso ver?** (a planilha, a enquete do zap, o print do Splitwise). Mostrar vale mais que contar.
8. Qual foi a parte mais chata de organizar? Quanto tempo você gastou nisso?
9. Tem mais alguém no grupo que organiza junto com você?

**Sinais pra anotar**
- Já pagou por alguma ferramenta de viagem ou de divisão? (prova de dor)
- Fez planilha ou gambiarra própria? (prova de dor)
- Fala do pix com emoção (raiva, vergonha, piada)? (dor forte)
- "Ah, a gente se vira no zap" sem nenhuma reclamação: dor fraca. Anotar também.

Só nos últimos 10 minutos: mostrar o app e criar a viagem juntos.

---

## Roteiro de conversa: DEPOIS (Mom Test)

**Regras:** as mesmas. Abrir o app junto, na viagem deles, e pedir pra pessoa **mostrar**.

**Perguntas**
1. Me conta como foi a viagem. Qual foi o momento mais caótico?
2. Como ficou a conta? Já está todo mundo quite? Quem ainda deve?
3. Me mostra onde vocês lançaram os gastos. Teve gasto que ficou fora? Por quê?
4. Teve alguma hora que você abriu o app sem ninguém pedir? O que você foi fazer?
5. Teve alguma hora que vocês voltaram pro zap, pra planilha ou pro Splitwise? O que faltou?
6. Quem do grupo **não** entrou no app? Por quê? (se der, falar com essa pessoa também)
7. Você mandou o link do app pra alguém de fora do grupo? Pra quem?
8. Vocês já falaram da próxima viagem? Onde estão combinando?
9. Você tocou em algum cadeado (Passe)? O que você esperava encontrar?

**O teste de dinheiro (não perguntar "você pagaria?")**
No fim, fazer uma oferta de verdade:
> "Pro carnaval, o Passe da viagem vai custar R$ X pro grupo inteiro (o que entra: ...). Se quiser garantir agora, é por Pix, e a gente devolve se não lançar até lá."

- Quem paga: sinal forte.
- Quem pede pra avisar quando lançar: sinal médio.
- "Legal, depois eu vejo": sinal nenhum.
O valor de R$ X sai do `PRECO.md`. Isso é pré-venda, não cobrança no app: o app ainda não cobra (spec 118).

**Sinais pra anotar**
- O que eles **fizeram**: gastos lançados, conta fechada, nova viagem criada.
- Frases exatas que servem de texto de marketing ("pela primeira vez ninguém ficou devendo").
- Pedidos que se repetem em 2 grupos ou mais.

---

## Datas

| Quando | O quê |
|---|---|
| Ter 03/11 a Dom 08/11 | Recrutar: e-mail pra lista de espera + pedir indicação. Meta: 7 grupos aceitos. |
| Seg 09/11 a Sex 20/11 | Conversas "antes" (30 min cada). |
| Seg 16/11 a Sex 27/11 | Organizadores criam a viagem e mandam o link no zap. **App precisa estar no celular deles** (ver riscos). |
| Seg 30/11 a Qua 23/12 | Uso livre. Toda segunda: consulta do banco + 1 linha no diário. Só bug crítico entra no app. |
| Sáb 26/12 a Seg 04/01 | Viagens. Ninguém mexe no app (sem deploy, sem migration). Suporte só por zap. |
| Ter 05/01 a Sex 15/01 | Conversas "depois" + oferta de pré-venda do Passe. |
| Ter 19/01 | Decisão (abaixo), escrita em `docs/produto/RESULTADO-REVEILLON.md`. |

---

## Como decidir no dia 19/01

Barra combinada **antes** do teste, pra não mudar depois (hipótese, ajustar se o Victor quiser):

| Resultado | O que significa | Próximo passo |
|---|---|---|
| 3 ou mais grupos fecharam a conta no app e lançaram a maioria dos gastos | A aposta do dinheiro se sustenta | Fazer o pacote do dinheiro (acerto pago, fechamento, sinal) e abrir mais grupos no carnaval |
| 1 ou 2 grupos | Funciona pra alguns: descobrir o que esses têm de diferente | Repetir com 5 grupos no carnaval, focado no perfil que funcionou |
| Nenhum grupo usou além da primeira semana | O problema não é o que achamos, ou o app não resolve | Parar de construir funcionalidade. Rever a aposta com as conversas |
| Alguém pagou a pré-venda | Tem vontade de pagar | Escrever a spec 118 com o preço testado |

---

## Riscos

1. **O app não chegar no celular a tempo.** O Expo precisa de TestFlight (iPhone) e de build pro Android (ver `docs/HANDOFF-ux-definitiva.md`: falta testar no iPhone e o EAS). Plano B: o organizador usa o app e o resto do grupo entra pelo **site** (abrir o convite sem instalar é o papel do site, regra "mobile primeiro"). Definir até 13/11.
2. **Bug no meio da viagem.** Congelar o app em 23/12. Antes disso, testar o fluxo inteiro com uma viagem falsa de 4 pessoas (Victor, Ingryd e mais 2).
3. **Grupo pequeno demais pra concluir.** 5 grupos não é estatística. O que vale é o comportamento repetido e as frases das conversas.
4. **A gente empurrar.** Se a gente lembrar o grupo de usar, o teste mede a gente. Regra: zero lembrete pessoal.
5. **Privacidade.** São dados reais de gente real. Ninguém de fora vê. Prints só com o rosto e o nome cobertos, e com permissão, se forem pro marketing.

---

## Grupos extras: testar o "antes do antes"

O réveillon não testa a fase 0. Se a viagem rascunho ("Bora?", `JORNADA.md`) ficar pronta até janeiro:
- Recrutar 2 ou 3 grupos que **ainda não decidiram** o carnaval 2027 (sáb 06/02 a qua 10/02/2027).
- Pergunta: o "Bora?" vira viagem com data, destino e sinal pago em até 3 semanas?
- Mesmo roteiro de conversa, com foco nas perguntas 1 e 2 do "antes".
