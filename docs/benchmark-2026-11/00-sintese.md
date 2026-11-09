# Benchmark 11/2026: síntese e proposta de rumo

Data: 03/11/2026. Pedido do Victor: "o app está ficando simples e substituível, o Roameo é melhor, no que estamos errando?".

Este arquivo junta as 4 partes. Os detalhes e as fontes estão nelas:
- [01 · Apps de viagem com IA](01-apps-com-ia.md): Roameo, Mindtrip, Layla, Airial e outros 7, com 51 fontes.
- [02 · Apps de grupo](02-apps-de-grupo.md): 21 apps, o que cresceu, o que morreu e por quê.
- [03 · Mercado brasileiro](03-mercado-brasil.md): como o grupo brasileiro planeja e paga, dores, calendário.
- [04 · X e App Store](04-x-e-lojas.md): ranking da loja, posts que viralizaram, timeline e salvos do Victor.
- [05 · Enxovaly destrinchado](05-enxovaly.md): como um "app de lista" fatura R$ 80 mil por mês, e o que copiar.

**Cuidado com os números:** vários vêm das próprias empresas ou de painéis de estimativa. Estão marcados nas partes.

---

## Em uma frase

**A ideia é boa e o mercado existe, mas construímos um canivete com 50 lâminas comuns.** Quem ganha neste nicho faz **uma coisa só, com um momento "uau" e um link que o grupo usa sem instalar**. E ninguém faz isso pro Brasil.

## O que a pesquisa mostrou (os 10 fatos que importam)

1. **O Brasil quer isso, agora.** O Roameo está em **13º no top grátis de Viagens da App Store BR**: é o único planejador no top 25, com nota 4,9 e 495 avaliações. Nos EUA ele tem só 25 avaliações. **O melhor mercado dele parece ser o nosso.** (04, 01)
2. **O público é jovem e viaja em grupo.**
   - 35% da Gen Z brasileira pretende viajar com amigos em 2026 (Booking).
   - No Carnaval 2026 do Rio, mais da metade das reservas do Airbnb foi de grupos de 3 ou mais. (03)
3. **A dor mais forte é dinheiro entre amigos.**
   - 61% já se arrependeram de emprestar dinheiro a amigo (Serasa).
   - 41% de quem pegou dinheiro com amigo ou parente diz que não devolveu (Datafolha, 2026).
   - Hoje um amigo paga a casa parcelada no cartão e vira cobrador dos outros. (03)
4. **Colar link do TikTok e deslizar em grupo já viraram coisa comum.** Airial, Roameo, Mindtrip e mais 3 fazem o primeiro; SwipeSights e TripRelay copiam o segundo. **Copiar o Roameo não basta.** (01)
5. **Ninguém leva o grupo do "decidimos" até o "pagamos".** Nenhum app pesquisado trata Pix, parcelado, réveillon, carnaval ou casa de praia com rateio. (01, 03)
6. **App de grupo que estoura tem uma regra: o convidado faz tudo sem instalar.**
   - Partiful: o convite é o anúncio, nota 5,0 com cerca de 283 mil avaliações.
   - Tricount e Doodle: o convidado age pelo link, sem conta.
   - Plan Harmony exige conta pra votar e apanha por isso. (02, 01)
7. **"Planejar viagem" é a ideia de startup que mais morre**, porque a pessoa planeja 1 ou 2 vezes por ano (Garry Tan, YC). O Troupe, o mais parecido com a gente, sumiu.
   - **O que faz voltar** é dinheiro pendente (Splitwise) ou memória (Polarsteps: 20 milhões de usuários, cresceu pelo "depois" da viagem, lucra com o livro impresso). (02)
8. **O que viraliza é o objeto que a pessoa posta, não a ferramenta.** Um print da lista de viagens do Wanderlog com a contagem "Em 1 mês" fez 283 mil views no X BR, com "que app é esse? quero!!" nos comentários. (04)
9. **O concorrente de verdade é o grupo do WhatsApp:** 97% abrem todo dia, 72% estão em grupo de amigos e ele tem enquete desde 2022. **Não dá pra brigar com ele; tem que abastecer ele.** (02, 03)
10. **Distribuição pesa mais que código.**
    - Apps pequenos chegam a US$ 5 a 42 mil por mês só com vídeo de TikTok sem rosto.
    - O formato "bonequinho em tela dividida" fez 94 milhões de views.
    - O Roameo sobe na loja pedindo avaliação antes do uso e cobrando cartão antes do valor. Isso dá nota, mas também reclamação. (04)

## No que estamos errando

| Erro | Evidência |
|---|---|
| **Largura sem profundidade:** 117 specs, umas 50 funções comuns | O Triplly (BR) tem quase a nossa lista (roteiro, mapa, chat, checklist, amigos) e está em 80º. Lista de funcionalidades não puxa download. (04) |
| **A meta é nossa, não do usuário** ("não sair do Together") | O grupo vive no WhatsApp; quem tentou trocar o grupo por chat próprio não pegou. (02) |
| **Sem momento "uau" no 1º minuto:** o onboarding parece cadastro e o app fica vazio até 4 pessoas entrarem | O Roameo abre com um jogo de deslizar e sai com roteiro pronto. (01) |
| **O convidado precisa do app** | Todos os casos de sucesso de grupo deixam o convidado agir pelo link. (02) |
| **A IA está espalhada em specs soltas** (093, 094, 097) | A IA genérica é o ponto fraco do Roameo e do Roterin ("chamar de IA é elogio"). A nossa tem que ser específica. (04, 01) |
| **Nada de Brasil de verdade** | É o buraco que nenhum concorrente cobre. (01, 03) |
| **Quase zero de distribuição** | "80% distribuição, 20% código". (04) |

## A proposta: uma coisa só, a melhor do Brasil

> **Norti: tira a viagem do grupo do WhatsApp e leva até o Pix pago.**
> O organizador para de ser o chato que cobra. O resto do grupo só toca no link.

O ciclo, em 4 passos (cada um já existe em parte no código):

1. **Começar em 30 segundos (o momento "uau").** O organizador cola o print do grupo, um link do Airbnb ou TikTok, ou escreve uma frase: "réveillon em Floripa, 8 amigos, R$ 2 mil cada".
   - A IA devolve um rascunho com destino, datas, 2 ou 3 casas, custo por pessoa em R$ e a pergunta pronta pro grupo.
   - Base que já existe: specs 093, 097 e 114.
2. **Decidir pelo link, sem instalar.** Vai um cartão pro WhatsApp. Cada amigo abre, diz se topa, vota na casa e nas datas e desliza os lugares.
   - Barra "faltam 2 votarem". O app manda o lembrete, não o organizador.
   - Base que já existe: convite, duelo da hospedagem, Explorar.
3. **Fechar e cobrar: o diferencial.** Fechou a casa, e cada um recebe a sua parte com **Pix copia-e-cola, prazo do sinal e parcelas** se a casa foi no cartão parcelado.
   - Lembrete automático e barra "faltam 2 pagarem".
   - O dinheiro **não passa por nós**: é Pix direto entre amigos, a lição da Hurb e da 123milhas.
   - Também: checagem básica contra golpe do aluguel falso.
   - Base que já existe: Contas, "jantar 84".
4. **Viver e lembrar: o que faz voltar e espalhar.**
   - Na viagem: gasto por frase ou voz e o placar de quem deve.
   - Antes: o **cartão de contagem regressiva** pra postar ("Floripa em 23 dias").
   - Depois: **a retrospectiva pros stories** ("Réveillon 2027: 8 amigos, R$ 14.200, 0 brigas"), que já convida pro Carnaval.
   - Base que já existe: specs 105, Fotos, carimbos.

**O que congelar:** todo o resto que não serve a esse ciclo. Isso inclui câmbio avançado, documentos de entrada, clima, cofre, guia da casa, calendário, central de notificações, comentários, ficha do país e frases úteis.
- Não é apagar: é esconder no app e parar de abrir spec nova fora do ciclo.
- O app fica com 4 telas fortes em vez de 15 médias.

**Por que dá pra ganhar do Roameo nisso:**
- Ele é caro, cobra antes, a IA dele é genérica e ele não tem Pix nem Brasil.
- **Nós seríamos grátis pro grupo, brasileiros e iríamos até o dinheiro.**
- E nada impede ter o deslizar também: já temos.

## Distribuição (tão importante quanto o produto)

- **Temporada agora:** os grupos estão fechando a casa do réveillon neste momento. A janela do Carnaval 2027 (6 a 10/02) vai de 26/12 a 25/01, e o acerto de contas de 1 a 5/01 é o momento de viralizar. (03)
  - **Campanha 1:** "Réveillon sem climão".
  - **Campanha 2:** "a retrospectiva do réveillon" nos stories.
- **TikTok sem rosto, em quantidade, em várias contas.** Formatos com as personas que achamos:
  - "o amigo que organiza vs o que só faz a mala";
  - "o grupo no dia 1 vs no dia 7";
  - "quem paga o Pix na hora vs quem some".
  - O vídeo feito com código (`docs/marketing/video/`) já mostra que dá pra produzir em escala.
- **Loja (ASO) em português:** "roteiro de viagem com amigos", "dividir casa de praia", "racha da viagem".
- **Lançar em grupos** (WhatsApp ou Telegram), como o Enxovaly: 120 assinaturas na 1ª hora.

## Riscos

- **Frequência baixa:** a pessoa viaja 1 ou 2 vezes por ano. A resposta é dinheiro pendente (faz voltar), retrospectiva (espalha) e várias viagens curtas (fim de semana, show, praia).
- **O Tropê** (BR) promete algo parecido, com IA no WhatsApp, mas ainda está no começo (1+ downloads no Google Play). Temos que ser mais rápidos e mais focados.
- **Conflito com o AGENTS.md (mobile primeiro):** o convidado agindo pelo link pede uma página web leve. Proposta: o app é do organizador; a web é só a página do convite, de votar e de pagar.
- **Não validado com gente de verdade.** Tudo acima é pesquisa de mesa.

## Próximos passos (proposta, pra decidir antes de codar)

1. **Esta semana:** achar **10 grupos fechando réveillon ou carnaval** (amigos, amigos de amigos, grupos). Perguntar:
   - como estão decidindo e cobrando;
   - o que deu briga;
   - se usariam um link que cobra por eles.
2. **Decidir o rumo** (Victor e Ingryd): aceitar ou ajustar a aposta e a lista do que congelar. Atualizar `docs/ROADMAP.md`, `docs/FILA-completa.md` e o AGENTS.md (seção 5).
3. **Protótipo do ciclo em 1 a 2 semanas:** frase ou print vira rascunho, link de voto sem instalar, Pix por pessoa com lembrete. Só isso, bem feito.
4. **Em paralelo:** 3 contas sem rosto e 1 vídeo por dia na temporada do réveillon.
