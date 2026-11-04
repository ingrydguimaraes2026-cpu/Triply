# Preço: hipótese pro Tripwave

> **Superado pelo RUMO (04/11/2026).** Este doc propõe o dinheiro ("ninguém fica devendo") como aposta central e o Passe por viagem. O Victor rejeitou os dois em `docs/RUMO.md`: a âncora é o **Passaporte da galera**, o Pix é só um detalhe do acerto e a cobrança é a **assinatura do organizador**. Use este arquivo só como histórico.

*03/11/2026. Sessão de produto, só documento.*

> **Isto é uma hipótese pra testar, não conselho financeiro nem projeção de receita.** Os números de mercado vêm de `reports/Mercado de apps de viagem em grupo.md` (com a fonte de lá). Todo número sem fonte é **hipótese nossa** e está marcado assim. Nada aqui foi testado com usuário: nenhum grupo real usou o app ainda.

## Em uma linha

O grupo usa tudo de graça. Um membro pode comprar o **Passe da viagem** e o comboio inteiro ganha os extras. Por fora, o app ganha **comissão** quando o grupo reserva pelos parceiros.

---

## 1. O que é sempre grátis (e por quê)

**Grátis, sem limite, pra todo o comboio:**
gastos, divisão, acertos, câmbio, votos, enquetes, match do comboio, Explorar, roteiro, fotos, documentos de entrada e offline de leitura.

Isso já está decidido no `docs/ROADMAP.md` ("Cobrar pelo básico do grupo: não fazer") e na spec 117 ("sempre grátis").

**Por quê:**
- O Splitwise limitou o grátis a cerca de 3 a 4 despesas por dia e virou reclamação pública. Viagem gera dezenas de gastos por dia (em `reports/`).
- No Wanderlog, a queixa é "o premium de quem paga não se estende ao grupo" (em `reports/`).
- A aposta do produto é o dinheiro do grupo (`JORNADA.md`). Se a conta do grupo tiver limite, a aposta morre.

**Regra:** nada que o grupo precisa pra **decidir, dividir ou se encontrar** fica atrás de cadeado.

---

## 2. Passe da viagem

### O que entra
Os extras com cadeado que a spec 117 já marca:
- **Mapa sem internet** do destino.
- **Reservas do e-mail** (importar reserva sem digitar).
- **Gasto pela foto do recibo.**
- **Livro da viagem em PDF** (e, no futuro, impresso e vídeo).
- Mais espaço pra fotos e o assistente de IA, quando existirem (em `reports/`).

### Como funciona
- **Um paga, o comboio inteiro usa.** Resolve a queixa do Wanderlog. Atenção: a pesquisa não achou nenhum app de consumidor que cobre assim, então é uma **aposta, não um padrão comprovado** (em `reports/`).
- **Vale por uma viagem:** da compra até 30 dias depois da última data (pra dar tempo do livro e do fechamento). *Hipótese.*
- **Dá pra dividir no próprio app:** quem compra lança o Passe como gasto do comboio. Num grupo de 6, cada um paga um pedaço pequeno. É a aposta do dinheiro usada a nosso favor. *Hipótese.*

### Quanto cobrar

**Referência do mercado** (em `reports/`):
| O que | Preço |
|---|---|
| Passe por viagem: Plan Harmony | US$ 6,99 |
| Passe por viagem: Lambus | US$ 8,99 |
| Passe por viagem: SwipeSights | US$ 12,99 |
| Assinatura anual: Wanderlog, TripIt, Splitwise | perto de US$ 40 a 50 |

**Hipótese de preço:** **R$ 29,90 por viagem, pro comboio inteiro.**
- Fica na faixa dos passes gringos, ajustado pra baixo pro Brasil. *Hipótese, sem pesquisa de preço no Brasil.*
- Dividido por 6 pessoas, vira uns R$ 5 por pessoa. Menos que qualquer item do mercado da casa. É o argumento na tela.
- **Testar 3 pontos**, não 1: **R$ 19,90 · R$ 29,90 · R$ 49,90.** O do meio é a aposta.

**Assinatura anual:** fica pra depois. Só faz sentido pra quem viaja 3 vezes ou mais por ano, e ainda não sabemos se esse público existe no app.

**Fora:** anúncio (em `reports/`: conflita com a experiência e não rende com público pequeno) e qualquer taxa sobre o Pix entre amigos (Pix entre pessoas físicas é gratuito e o app não guarda dinheiro de ninguém).

### Loja de apps
No app de celular, compra digital passa pela compra dentro do app (Apple e Google), e a loja fica com uma parte. Isso é a spec 118 (RevenueCat). **Conferir a taxa de cada loja e o programa pra pequenas empresas antes de fechar o preço.**

---

## 3. Quando a pessoa vê o preço

**Nunca:**
- no onboarding (spec 116);
- antes de convidar a galera;
- no meio de uma decisão do grupo (voto, match, gasto).

A primeira experiência tem que ser só grátis. Preço cedo assusta quem nem sabe se o grupo vai entrar.

**Só quando ela toca num cadeado**, no momento em que precisa do extra:

| Fase | Cadeado | Por que é um bom momento |
|---|---|---|
| Antes (perto do embarque) | Mapa sem internet, reservas do e-mail | Ansiedade de "e se ficar sem sinal lá?". Mais forte em viagem pra fora. |
| Durante | Gasto pela foto do recibo | Dor na hora: muito gasto, pouca paciência. |
| Depois (Lembranças) | Livro da viagem, vídeo | Pico de emoção. O Polarsteps tira a maior parte da receita de livros impressos (em `reports/`). |

**Aposta (hipótese):** o **depois** converte mais que o antes. Se o teste mostrar isso, o Passe vira "Lembranças da viagem" e o preço aparece no fim.

**Na tela do Passe:**
- O preço total e o preço dividido pelo comboio ("R$ 29,90 · R$ 5 por pessoa no seu comboio de 6").
- O que entra, em 4 linhas.
- "O resto continua grátis pra sempre."
- Hoje (spec 117) o botão diz "Em breve" e **não mostra preço**. Ver a seção 5.

---

## 4. Parceiros (comissão)

O app já tem a busca de hospedagem (Airbnb, Booking, Maps) e o item "Antes de embarcar" (passaportes, seguro, eSIM). É onde a comissão entra, sem anúncio genérico.

**O que a pesquisa diz** (em `reports/`):
| Parceiro | Comissão | Onde aparece no app |
|---|---|---|
| Passeios: GetYourGuide (Awin) | cerca de 7% | Roteiro e Explorar |
| Passeios: Viator | cerca de 8% | Roteiro e Explorar |
| eSIM: Airalo | a partir de 10% | Antes de embarcar |
| Seguro: Allianz Travel BR (Awin) | programa existe, % não levantado | Antes de embarcar (exigido no Schengen) |
| Hospedagem: Booking | **contraditório**: 25% a 40% da comissão dela, ou cerca de 4% via CJ desde 2025 | Busca de hospedagem |
| Hospedagem: Airbnb | programa de afiliados **não confirmado** | Busca de hospedagem |
| Agregador: Travelpayouts | mais de 100 marcas, site em português | Tudo acima num cadastro só |

**Hospedagem é o pedido do Victor, mas é o parceiro mais incerto.** A pesquisa diz que passeios pagam melhor que hotel e que uma reserva de grupo vale mais por clique do que num app individual. **Hipótese:** começar por Travelpayouts (um cadastro, vários parceiros) e confirmar Booking e Airbnb antes de contar com eles.

**Regras:**
- O link de parceiro aparece só quando o grupo já está fazendo aquilo (escolhendo casa, montando o dia, vendo documentos).
- Sempre escrito "link de parceiro". O grupo confia no app porque ele não empurra nada.
- A escolha do grupo nunca muda por causa da comissão (a ordem das opções é a do voto).

---

## 5. Como medir a vontade de pagar

### O que já existe: `interesse_no_passe`
Tabela da spec 117 (migration `20261102191000_interesse_no_passe.sql`, aplicada):
- `viagem_id`, `usuario_id`, `criado_em`;
- `origem`: de qual cadeado veio (`scan_recibo`, `mapa_offline`, `reservas_email`, `livro_pdf`, `livro_impresso`, `video`, `album`, `outro`);
- `acao`: `viu` (abriu a tela do Passe) ou `quis` (tocou no botão).

O app não lê o interesse dos outros: a conta é feita no painel do Supabase.

**Antes de medir:** apagar as linhas de teste do Victor (ver `docs/HANDOFF-ux-definitiva.md`).

### As contas (só leitura, no painel)

**Quantas viagens chegaram a querer o Passe:**
```sql
select
  count(distinct viagem_id) filter (where acao = 'viu')  as viagens_que_viram,
  count(distinct viagem_id) filter (where acao = 'quis') as viagens_que_quiseram
from interesse_no_passe;
```

**Qual cadeado puxa mais:**
```sql
select origem,
  count(*) filter (where acao = 'viu')  as viu,
  count(*) filter (where acao = 'quis') as quis
from interesse_no_passe
group by origem
order by quis desc;
```

**Em que fase da viagem a pessoa quis:**
```sql
select
  case
    when v.data_inicio is null or i.criado_em::date < v.data_inicio then 'antes'
    when i.criado_em::date <= v.data_fim then 'durante'
    else 'depois'
  end as fase,
  count(*) filter (where i.acao = 'quis') as quis
from interesse_no_passe i
join viagens v on v.id = i.viagem_id
group by 1;
```

A conta que importa é por **viagem**, não por pessoa: o Passe é do comboio.

### O limite dessa tabela
Tocar em "quero" sem ver preço é barato. Mede curiosidade, não pagamento. Por isso, a medição sobe em degraus:

| Degrau | Como | Sinal |
|---|---|---|
| 1. Viu | Abriu a tela do Passe (hoje) | Curiosidade |
| 2. Quis sem preço | Tocou no botão "Em breve" (hoje) | Interesse |
| 3. Quis com preço | A tela mostra o preço (um dos 3 pontos, sorteado por viagem) e grava qual preço a pessoa viu | **Vontade de pagar** |
| 4. Pagou a pré-venda | Oferta por Pix nas conversas do `TESTE-REVEILLON.md` | Compromisso |
| 5. Pagou na loja | Spec 118 | Receita |

O degrau 3 pede **uma mudança pequena no app e no banco** (mostrar o preço e gravar o preço visto, por exemplo uma coluna `preco_visto` em `interesse_no_passe`). Isso é código e migration: **fica pra uma sessão de dev**, com confirmação do Victor. Esta sessão não mexe.

### Barra pra decidir (hipótese)
Com os 5 grupos do réveillon, número não vale como estatística. A barra é de comportamento:
- **Seguir com o Passe** se pelo menos 2 dos 5 grupos tiverem alguém que **quis** e 1 que **pagou a pré-venda**.
- **Repensar o que entra no Passe** se muitos **viram** e ninguém **quis**: o cadeado está no lugar certo, mas o extra não vale.
- **Repensar o momento** se ninguém nem **viu**: o cadeado está escondido ou no momento errado.

Depois, com mais viagens (carnaval), comparar a taxa de "quis" entre R$ 19,90, R$ 29,90 e R$ 49,90.

---

## 6. Conta de bolso (fórmula, não projeção)

Receita de uma viagem =
**(chance de alguém comprar o Passe × preço do Passe, menos a parte da loja)**
\+ **(cliques em parceiro × chance de reservar × valor da reserva × comissão)**

Nenhum desses números existe ainda. A pesquisa avisa: **nenhuma fonte trouxe taxa de conversão de grátis pra pago** (em `reports/`). O teste do réveillon e o carnaval servem pra preencher a primeira parte. Não usar essa fórmula com números inventados em pitch nem em plano de negócio.

---

## O que fica pra depois
- Assinatura anual pra quem viaja muito.
- Livro impresso (receita principal do Polarsteps, em `reports/`).
- Modo organizador (excursões, despedidas, casamentos) com taxa por transação. O SquadTrip cobra 6% no grátis e 4% nos pagos (em `reports/`). Precisa de parceiro de pagamento autorizado; o app não guarda dinheiro.
