# Calendário: as 2 primeiras semanas de conteúdo (sem rosto)

*03/11/2026. Refeito depois da decisão da dupla: **ninguém mostra o rosto**. Base: `PESQUISA-SEM-ROSTO.md` (o que funciona sem aparecer), `CONTEUDO-INICIAL.md` (roteiros R1 a R8 e posts P1 a P8) e o tom de `NOME-E-VOZ.md`. Versão pra abrir no navegador: `calendario-2-semanas.html`.*

## Como funciona

**Os formatos (todos sem rosto e sem voz)**
| Código | Formato | Como é |
|---|---|---|
| **S** | Slideshow da dor | Carrossel de 6 slides: dor no slide 1, prints de conversa fictícia, **1 print real do app**, Norti no fim. Música em alta. |
| **T** | Tipos de amigo (carrossel) | 1 slide por tipo de amigo, Norti com a pose que combina. "Marca o seu" na legenda. |
| **Q** | Quiz (carrossel) | 1 pergunta por slide com a pontuação; o último dá o resultado. "Comenta seus pontos". |
| **D** | 2 lados | Tela dividida: "grupo do zap" (caos) x "grupo com a Norti" (calmo). Na semana 1 sai como imagem; vira vídeo animado só se ganhar. |
| **N** | Norti na trend (vídeo) | A Norti + texto em cima de um áudio em alta (R1). Único vídeo da semana 1. |

**Onde posta**
- **TikTok e Instagram:** o mesmo post nas duas redes, 1 conta em cada. Carrossel no TikTok é o "modo foto"; no Instagram, carrossel normal.
- **Shorts (YouTube):** só os vídeos (N e D animado). Carrossel não existe lá.
- **X:** 2 posts por dia nos perfis pessoais (texto e print, sem rosto). O `@tripwaveapp` reposta e responde.
- **Story no Instagram:** repost do dia + 1 enquete. Leva 1 minuto.

**Volume**
- **Semana 1:** 1 post por dia (TikTok + Instagram).
- **Semana 2:** 2 posts por dia: o formato vencedor de manhã e uma variação à noite.
- **X:** 2 por dia + 20 a 30 respostas, sempre.
- A 2ª conta de cada rede só abre quando um formato passar de 1.000 views com frequência. Cada conta posta uma **versão diferente** (outra ordem, outro gancho, outra imagem): o TikTok derruba do "Pra Você" o post copiado.

**Como os posts são montados (sem gravar nada)**
1. Uma planilha com 1 linha por post: código, gancho, texto de cada slide, pose da Norti, legenda.
2. Uma sessão do Claude monta os slides num modelo HTML (1080×1920, cores da marca, Norti em `norti/png/`) e exporta em PNG.
3. A dupla aprova, posta pelo próprio app da rede e escolhe a música em alta na hora. **Nada de postagem automática** (risco de perder a conta).

**Imagens**
- Prints do Tripwave e a Norti: são nossos, use à vontade.
- Fotos de fundo: bancos com licença livre (Unsplash, Pexels), sem rosto em destaque, ou fotos de viagem da própria dupla sem gente.
- Foto realista de pessoa gerada por IA: só com o rótulo de IA ligado no TikTok.
- **Nunca** foto de celebridade ou de outra conta.

**Datas**
- **Semana 0 (03 a 08/11): preparar.**
- **Semana 1 (09 a 15/11): testar 4 formatos** (S, T, Q e D) + 1 vídeo N.
- **Semana 2 (16 a 22/11): dobrar o que funcionou.**
- A contagem regressiva do réveillon (R6) começa em 01/12, no próximo calendário.

**Poses da Norti** (`norti/png/`, fundo transparente)
| Nome | Arquivo | Nome | Arquivo |
|---|---|---|---|
| Parada | `norti-idle.png` | Ops | `norti-oops.png` |
| Piscando | `norti-blink.png` | Dormindo | `norti-sleep.png` |
| Oi | `norti-wave.png` | Apontando | `norti-point.png` |
| Pensando | `norti-think.png` | Amor | `norti-love.png` |
| Comemorando | `norti-celebrate.png` | | |

**Links da lista de espera** (sempre com `?origem=`)
- TikTok: `tripwave.app/espera?origem=tiktok` · Instagram: `?origem=instagram` · X: `?origem=x` · Shorts: `?origem=shorts`
- Enquanto o domínio não existir, use o endereço no ar (hoje `together-viagem.vercel.app`).

**Regras de sempre**
- Números entre colchetes, como `[N]`, são o dado real do dia. Nunca inventar número.
- A piada é da situação, nunca de uma pessoa ou conversa real. Prints de conversa são fictícios.
- As falas da Norti são rascunho até a Ingryd fechar a personalidade dela.

---

## Semana 0 (03 a 08/11): preparar

| Quem | O quê | Até |
|---|---|---|
| Dupla | Criar `@tripwaveapp` (X) e `@tripwave.app` (Instagram e TikTok), com as bios de `CONTEUDO-INICIAL.md`. No TikTok, conta comercial (libera link na bio mais cedo) | qua 04/11 |
| Dupla | Registrar tripwave.app e tripwave.com.br | qua 04/11 |
| Victor | Colocar a `/espera` no ar e testar um cadastro de cada `?origem=` | qui 05/11 |
| Dupla | **Aquecer as contas novas**: 15 a 20 min por dia rolando o "Pra Você" de viagem e réveillon, curtindo e comentando. Ainda sem postar | qua a dom |
| Ingryd | Revisar piadas e bios; escolher 3 falas fixas da Norti | qui 05/11 |
| Victor | Tirar os prints do app que entram nos slides: acertos, roteiro, gastos, convite, Norti comemorando | qui 05/11 |
| Sessão do Claude | Montar o modelo de slide em HTML (1080×1920) e a planilha de posts | sex 06/11 |
| Dupla | **Lote 1:** gerar e aprovar os posts dos dias 1 a 7 + 2 reservas | sáb 07/11 |
| Dupla | Começar as 20 a 30 respostas por dia no X | a semana toda |

---

## Semana 1 (09 a 15/11): testar 4 formatos

Cada formato (S, T, Q, D) sai **pelo menos 2 vezes**. Na sexta, os números dizem qual ganha.

### Dia 1 · seg 09/11
- **Post:** S1 "A dor do Pix" (roteiro em `PESQUISA-SEM-ROSTO.md`).
- **X (Victor):** P1, apresentação da dupla. **Fixar.** Trocar a imagem por um print do app ou a ficha da Norti (sem foto da dupla).
- **X (Ingryd):** repost do P1: `é verdade. eu sou a que tá aprendendo 🙋‍♀️`
- **Story:** enquete "quem organiza a viagem do seu grupo?" → "eu 😩" / "nunca sou eu 😌".

### Dia 2 · ter 10/11
- **Post:** T1 "Tipos de amigo no réveillon" (carrossel com os 5 tipos do R2).
- **X (Victor):** P2, o problema.
- **X (Ingryd):** X1.
- **Story:** enquete "já ficou no prejuízo numa viagem com amigos?".

### Dia 3 · qua 11/11
- **Post:** D1 "2 lados: dividir a casa" (imagem dividida, ver abaixo).
- **X (Victor):** P3, o "em breve", com vídeo de tela do app (gravação da tela, sem rosto). Link na 1ª resposta.
- **X (Ingryd):** repost do P3.
- **Story:** adesivo de link da lista: "entra que é de graça".

### Dia 4 · qui 12/11
- **Post:** Q1 "Quantos pontos seu grupo faz?" (o R4 em carrossel).
- **X (Victor):** P4, a mascote (Agulha antiga ao lado da Norti).
- **X (Ingryd):** X2.
- **Story:** caixinha "quantos pontos vocês fizeram?".

### Dia 5 · sex 13/11
- **Post:** S2 "Checklist do réveillon com a galera" (o R7; é o post de salvar).
- **X (Victor):** P7, resumo da semana 1 com os números reais.
- **X (Ingryd):** P6, semana 1 aprendendo a programar.
- **Story:** bastidores (print do código ou da Norti).
- **Hoje:** decidir o vencedor (ver abaixo).

### Dia 6 · sáb 14/11
- **Post:** N1 "A Norti vendo o grupo decidir a casa" (o R1, vídeo; também no Shorts).
- **X (Victor):** P5, o nome.
- **X (Ingryd):** X15, a 1ª votação do "build in group".
- **Lote 2:** gerar os posts dos dias 8 a 14 com o vencedor.

### Dia 7 · dom 15/11
- **Post:** D2 "2 lados: cobrar o Pix".
- **X (Victor):** P8, pergunta pra comunidade (as respostas viram post).
- **X (Ingryd):** X4.
- **Story:** caixinha "a pior coisa que já rolou numa viagem com amigos".

### Sexta: decidir o vencedor
Anotar 24 h depois de cada post: views (TikTok e Instagram), compartilhamentos, salvamentos, comentários e **quantos perguntaram "que app é esse?"**.

Entradas na lista por rede (SQL Editor do Supabase):
```sql
select coalesce(origem, 'sem origem') as origem, count(*) as pessoas
from lista_espera
group by 1
order by 2 desc;
```

**Ganha** o formato com mais compartilhamentos + salvamentos. Na semana 2 ele ocupa a manhã dos 7 dias; o 2º colocado e as novidades ficam com a noite.

---

## Semana 2 (16 a 22/11): dobrar o que funcionou

Manhã = **do vencedor** (troque pela variação do formato que ganhou, no banco abaixo). A sugestão de cada dia vale se ninguém ganhar com folga.

| Dia | Manhã (vencedor) | Noite | X Victor | X Ingryd | Story |
|---|---|---|---|---|---|
| 8 · seg 16/11 | sugestão: S3 "Quanto custa o réveillon com a galera" | T2 "Tipos de amigo" (6 a 10) | X5 | X6 | enquete: planilha ou app? |
| 9 · ter 17/11 | sugestão: D3 "2 lados: decidir o roteiro" | R5 "POV: você organiza o réveillon" em carrossel | X7 (vídeo de tela dos acertos) | repost do X7 | repost + link da lista |
| 10 · qua 18/11 | sugestão: Q2 "Seu grupo sobrevive ao réveillon?" | S1b "A dor do mercado" | X8 | X9 | enquete: divide por quarto ou por cabeça? |
| 11 · qui 19/11 | sugestão: R8 "Como dividir a casa sem briga" em carrossel (**conferir a conta**) | D4 "2 lados: alguém desiste na véspera" | X10 (a mesma conta em texto) | X11 | caixinha: dúvidas de divisão |
| 12 · sex 20/11 | sugestão: T3 "Marca o amigo" (carrossel de frases) | N2 "Norti responde comentário" | P7, resumo da semana 2 | P6, semana 2 dela | bastidores |
| 13 · sáb 21/11 | sugestão: S4 "O grupo do zap em 5 prints" | variação livre do 2º colocado | X12 | X16, 2ª votação | gerar o lote 3 |
| 14 · dom 22/11 | sugestão: D5 "2 lados: a ceia" | T4 "Que tipo de amigo você é?" | X14 | repost do X14 | caixinha: que tipo de amigo você é? |

---

## Roteiros

### S. Slideshows (6 slides)
- **S1 "A dor do Pix":** em `PESQUISA-SEM-ROSTO.md`.
- **S1b "A dor do mercado":** 1 "o mercado do réveillon, dia 3 de janeiro:" · 2 print fictício "quanto deu?" · 3 "eu não bebo, não vou pagar a cerveja" · 4 "quem tem a nota?" · 5 **print real** da tela de gastos + Norti Apontando "anota na hora, divide no fim" · 6 Norti Oi + "lista de espera no perfil".
- **S2 "Checklist do réveillon":** os 8 slides do R7 em `CONTEUDO-INICIAL.md`.
- **S3 "Quanto custa o réveillon com a galera":** 1 "quanto custa o réveillon com 8 amigos?" · 2 casa · 3 mercado e bebida · 4 transporte · 5 total por pessoa + **print real** do resumo · 6 Norti Pensando "e quem pagou o quê?". **Usar números de exemplo e conferir as contas antes.**
- **S4 "O grupo do zap em 5 prints":** 5 prints fictícios do caos (40 links de Airbnb, enquete sem resposta, "quem vai mesmo?", "alguém fez a planilha?", "te faço o Pix amanhã") + slide final com o app e a Norti Comemorando.

### T. Tipos de amigo (carrossel)
- **T1:** os 5 tipos do R2.
- **T2:** os tipos 6 a 10 (banco abaixo).
- **T3 "Marca o amigo":** 1 frase por slide (as do R3 + banco).
- **T4 "Que tipo de amigo você é?":** 6 tipos, 1 por slide, "comenta o número do seu".

### Q. Quiz (carrossel)
- **Q1:** o R4. **Q2:** "Seu grupo sobrevive ao réveillon?" (banco). **Conferir que a soma dos pontos bate com as faixas do resultado.**

### D. 2 lados (imagem dividida; vídeo só se ganhar)
Esquerda "grupo do zap": bonequinhos em caos, mensagens voando. Direita "grupo com a Norti": tudo em ordem, Norti Comemorando. Estilo sempre igual; muda só a situação.
- **D1:** dividir a casa · **D2:** cobrar o Pix · **D3:** decidir o roteiro · **D4:** alguém desiste na véspera · **D5:** a ceia (quem leva o quê).

### N. Norti em vídeo
- **N1:** o R1 ("a Norti vendo o grupo decidir a casa").
- **N2 "Norti responde comentário":** resposta com vídeo a um comentário real (recurso nativo da rede): o comentário na tela, a Norti responde em texto com a pose que combina. Nunca expor ninguém.

---

## Banco de variações (pra repetir o vencedor)

**Tipos de amigo, 6 a 10**
6. O que chega dia 31 às 23h50 → Comemorando: "e ainda pergunta o que tem pra comer"
7. O que leva só gelo → Ops: "e divide igual"
8. O que quer ir pra 3 praias no mesmo dia → Pensando
9. O que manda áudio de 4 minutos → Dormindo
10. O que traz um amigo que ninguém conhece → Oi

**Marca o amigo**
- que diz "depois a gente acerta" e o depois nunca chega
- que reserva a casa sem perguntar ninguém
- que some quando chega a conta do mercado
- que leva caixa de som e só toca a playlist dele
- que confirma, desconfirma e confirma de novo

**Quiz**
- Q2 "Seu grupo sobrevive ao réveillon?": alguém com carro (+2) · alguém pagou do bolso e não cobrou (−2) · mais de 10 pessoas (−1) · já sabem quem dorme onde (+2) · alguém trouxe um amigo que ninguém conhece (−1).
- Q3 "Que tipo de organizador você é?": planilha, cobrança e prazo; o resultado diz o tipo (o calmo, o cobrador, o que faz tudo sozinho).

**2 lados**
- escolher quem dorme na sala · combinar o horário de sair · o carro que não cabe todo mundo · a foto do grupo (ninguém manda)

**Slideshow**
- "o que ninguém te conta sobre alugar casa no réveillon" · "5 combinados antes de fechar a casa" · "quanto cada um deve, sem planilha"

---

## Posts do X

Mesmo jeito dos P1 a P8: minúsculas, sem exagero, link só na 1ª resposta. **Nenhuma foto da dupla:** print, Norti ou gravação de tela.

### X1 (Ingryd)
```
coisa que eu aprendi essa semana: o "banco de dados" do app é tipo uma planilha gigante, só que com regras de quem pode ver cada linha.

o seu gasto pessoal da viagem? nem o dono do grupo vê.
```

### X2 (Ingryd)
```
pergunta sincera: no seu grupo, quem pagou a casa recebe tudo de volta?

ou sempre fica faltando aquele um
```

### X4 (Ingryd)
```
o que eu mais gosto no Tripwave até agora: a Norti dorme quando a viagem ainda não tem nada.

parece bobo, mas quem fez isso fui eu entendendo cada linha
```
(Só se for verdade pra ela. Senão, trocar por algo que ela fez.)

### X5 (Victor)
```
decisão de produto da semana: o Tripwave vai ser app primeiro, site depois.

motivo: quem viaja com a galera decide tudo pelo celular, no grupo. ninguém abre o notebook pra ver quanto deve.
```

### X6 (Ingryd)
```
semana 2.

ainda não entendo tudo que o código faz. mas já sei achar onde muda o texto de uma tela sem quebrar nada, e isso pra mim é muito
```

### X7 (Victor, com gravação da tela de acertos)
```
a tela que mais deu trabalho até agora: quem deve quanto pra quem no fim da viagem.

8 pessoas, 40 gastos, e no fim sai uma lista curta: fulano manda X pra ciclano, e acabou.
```
(Conferir que o exemplo do vídeo bate com o texto.)

### X8 (Victor)
```
a Apple demora pra aprovar app novo. a gente decidiu não esperar pra começar a falar dele.

se der errado, pelo menos vocês viram.
```

### X9 (Ingryd)
```
viagem com amigos tem 3 fases:

1. "vamos!!!"
2. "quem vai pagar o sinal?"
3. silêncio no grupo
```

### X10 (Victor, a conta do R8 em texto)
```
casa de R$ 6.000 no réveillon, 8 pessoas, 2 casais, 1 que só vai 2 noites.

por cabeça: [conta]
por quarto: [conta]

qual é o justo? (não tem resposta certa, tem briga)
```
(Mesmas contas do R8, conferidas.)

### X11 (Ingryd)
```
meu momento favorito construindo o app: quando o Victor fala "testa aí" e eu acho um erro que ele não viu
```

### X12 (Victor)
```
[N] pessoas na lista de espera em 2 semanas, sem anúncio e sem aparecer a cara de ninguém.

a rede que mais trouxe gente: [rede]. a que eu achava que ia trazer: [rede].
```

### X14 (Victor)
```
2 semanas falando do Tripwave em público. o que aprendi:

- [aprendizado 1, com número]
- [aprendizado 2]
- [o que vamos mudar]
```

### X15 (Ingryd, enquete: "build in group")
```
vocês decidem uma coisa do app essa semana.

quando alguém do grupo ainda não pagou a parte dele, a Norti deveria:
```
Opções da enquete: `avisar só ele` · `avisar o grupo todo` · `ficar quieta` · `mandar meme`

### X16 (Ingryd, enquete)
```
2ª votação do grupo: qual destino a gente usa no exemplo do app?
```
Opções: `Rio no réveillon` · `Jericoacoara` · `Gramado` · `Lisboa`
(Depois postar o resultado com o print do app usando o destino vencedor.)

---

## Depois das 2 semanas

1. Ler os números da semana 2 do mesmo jeito da sexta.
2. Se um formato passou de 1.000 views com frequência: abrir a 2ª conta de cada rede, com versões diferentes.
3. Se o D (2 lados) ganhou: fazer a versão em vídeo animado com a Norti (ferramentas em `PESQUISA-SEM-ROSTO.md`).
4. Montar o próximo calendário (semanas 3 e 4) com o vencedor + a contagem regressiva (R6) a partir de 01/12.
