# Lançamento até o Carnaval (10/11/2026 a 10/02/2027)

*Plano pedido pelo Victor em 10/11/2026.*

O [`RUMO`](../RUMO.md) continua mandando no **o quê** (passaporte da galera, "Hoje", base sem coisa nova). Este plano diz **quando**. Até o Carnaval, ele passa na frente da `FILA-completa.md`.

## Em uma frase

> **Parar de construir, ir pra loja, levar grupos reais no réveillon e cobrar até o Carnaval.**

O atraso não é falta de funcionalidade. É que ninguém de fora usou ainda.

## Onde estamos (10/11/2026)

- **Gente:** 1 pessoa na lista de espera, 12 contas (quase todas de teste), 15 viagens. Nenhum grupo real usou.
- **Loja:** o app não está na App Store nem no Google Play.
- **Pronto pra testar (muito):** passaporte da galera (118a a 118d e 118f), "Hoje" (120), Passagens (122), Hospedagem por noite e mapa (123 e 124), retrospectiva, livro em PDF (106), convite web leve.
- **Falta pra loja** (conferido no código):
  - identificador do app no iOS e no Android (`app.json` não tem `bundleIdentifier` nem `package`);
  - configuração de build da Expo (não existe `apps/mobile/eas.json`);
  - páginas de **Termos de uso** e **Política de privacidade** (a tela de login cita as duas, mas não existem no site);
  - **excluir conta dentro do app** (hoje só no site; a função `excluir-conta` já está no ar);
  - **Entrar com Apple** (o app tem "Entrar com Google" e a Apple costuma exigir as duas);
  - decidir o "Confirm email" (ver `docs/HANDOFF-contas-de-teste.md`).
- **Função `ler-reserva`** (print ou PDF da reserva vira item no "Hoje"): está no código, mas não foi publicada.

## Regras até o Carnaval

1. **Nada de funcionalidade nova, spec nova nem redesenho.** Só conserto, acabamento do primeiro uso e o que a loja exigir.
2. **Site: só conserto.** O espelho do app no site para onde está.
3. **Uma frente de dev por vez.** Sessões paralelas: terminar o que está no meio ou arquivar.
4. **Os princípios do RUMO valem:** grátis pro grupo, cobrança só depois do primeiro carimbo ou da primeira retrospectiva, o dinheiro da viagem nunca passa pela Norti.
5. **Toda segunda, olhar os números** (seção "Números").

## Calendário

A coluna "Quem" é sugestão.

### Etapa 1 · 10 a 23/11 · Pronto pra loja

| O quê | Quem | Pronto quando |
|---|---|---|
| **Hoje, 10/11:** pedir o número D-U-N-S do CNPJ (grátis, pela página de consulta da Apple; demora alguns dias). As duas lojas pedem esse número pra conta de empresa. | Victor | Número D-U-N-S recebido |
| Criar as contas de desenvolvedor **no CNPJ** (decidido em 10/11): Apple (US$ 99 por ano) e Google Play (US$ 25, uma vez). | Victor | Contas ativas |
| Perguntar ao contador se o CNPJ (atividade e regime) cobre receber da Apple e do Google pela venda do app. | Victor | Resposta do contador |
| Escolher o identificador do app (ex.: `app.norti`). **Não muda depois.** Ligar o EAS (a build na nuvem da Expo). | Victor | `eas.json` e `app.json` com o identificador |
| Páginas `/termos` e `/privacidade` no site. As lojas pedem o link. | Victor (Claude escreve o rascunho) | Links abrindo no navegador |
| Excluir conta dentro do app (Perfil). | Victor | Conta de teste excluída pelo app |
| Entrar com Apple no app. | Victor | Login pelo iPhone funcionando |
| Decidir o "Confirm email". | Victor | Decisão anotada no HANDOFF |
| **Primeiro uso sem ajuda:** a Ingryd cria uma viagem do zero no celular e anota onde travou. Consertar só isso. | Ingryd, depois Victor | Ela cria a viagem e convida sem perguntar nada |
| Publicar a `ler-reserva` (se o custo da IA couber). | Victor | Print de reserva vira item no "Hoje" |
| Primeira build no **TestFlight** (iPhone) e no **teste interno do Google**. | Victor | Victor e Ingryd com o app instalado pela loja de teste |

### Etapa 2 · 17 a 27/11 · Grupos do réveillon

Roteiro completo em [`TESTE-REVEILLON.md`](TESTE-REVEILLON.md) (a parte de recrutar, conversar e não empurrar continua valendo).

| O quê | Quem | Pronto quando |
|---|---|---|
| Recrutar 7 grupos pra sobrarem 5. A lista de espera só tem 1 pessoa, então: amigos de amigos, colegas de trabalho e de faculdade, um post pedindo. | Ingryd | 7 organizadores toparam |
| Conversa "antes" (30 min) com cada organizador. | Ingryd (Victor junto, se der) | Anotações no doc do teste |
| O organizador cria a viagem e manda o convite no grupo do zap dele. | Organizadores | Até **27/11** |
| Colocar os grupos no TestFlight e no teste do Google. Com a conta no CNPJ, o Google não exige o teste de 12 pessoas por 14 dias. | Victor | Grupos com o app instalado |

### Etapa 3 · 28/11 a 20/12 · Lojas e conteúdo

| O quê | Quem | Pronto quando |
|---|---|---|
| Mandar pra revisão da Apple **até 15/12** (a Apple costuma pausar as revisões perto do Natal). | Victor | Aprovado |
| Google: mandar pra publicação junto com a Apple, até 15/12. | Victor | No ar |
| TikTok e Reels sem rosto, **1 vídeo por dia a partir de 01/12**. Tema: "Réveillon 2027 carimbado". Os vídeos saem de `docs/marketing/video/`. | Ingryd | 20 vídeos no ar até 20/12 |
| Grupo VIP no WhatsApp pro lançamento. | Ingryd | Grupo criado e divulgado nos vídeos |
| Conserto só do que os grupos acharem. | Victor | Nada travando os grupos |
| **Gráfica do caderno impresso:** preço de custo, prazo e frete. Teste: imprimir o livro (spec 106) de uma viagem nossa. | Ingryd | Um caderno impresso na mão |

### Etapa 4 · 26/12 a 05/01 · Réveillon

- Os grupos viajam. **A gente não empurra** (regra do teste).
- Plantão de bug: alguém olha o zap de suporte 1 vez por dia.
- **01 a 05/01** é o momento de postar o mapa e a retrospectiva. Repostar o que os grupos postarem (com permissão).

### Etapa 5 · 06 a 31/01 · Primeiro dinheiro e assinatura

| O quê | Quem | Pronto quando |
|---|---|---|
| Conversas "depois" com os organizadores. | Ingryd | Até 15/01 |
| **Pré-venda do caderno impresso** pros grupos do réveillon, por Pix e na mão (sem código): o livro em PDF que já existe vai pra gráfica. Produto físico pode ser cobrado fora da loja (as regras da Apple e do Google só obrigam a compra dentro do app pra coisa digital). | Ingryd e Victor | Primeiro Pix recebido |
| **Assinatura do organizador:** escrever a spec (o que entra, pela lista do RUMO), definir o preço e ligar a cobrança na loja. Precisa descongelar a parte de pagamento da spec 119. | Victor | Spec aprovada |
| Apple: aceitar o contrato de apps pagos, informar banco e dados fiscais e entrar no programa de pequenas empresas (a Apple fica com 15% em vez de 30%). **Começar em 06/01:** demora dias. O Google já cobra 15% de quem está começando. | Victor | Contratos ativos |
| Mandar a versão com assinatura pra revisão **até 25/01**. | Victor | Aprovada |
| Vídeos de "Carnaval carimbado" (a janela do Carnaval vai de 26/12 a 25/01, pelo RUMO). | Ingryd | 1 por dia |

### Etapa 6 · 06 a 10/02 · Carnaval

- Primeiro Carnaval com a assinatura ligada. O paywall só aparece depois do primeiro carimbo ou da primeira retrospectiva.

### Depois (fevereiro a junho)

- Feriados: Páscoa (28/03), Tiradentes (21/04), Corpus Christi (27/05) e as férias de julho.
- Afiliados (eSIM, seguro, passeios): só se o Victor descongelar. Hoje estão parados junto com a spec 119.

## Pontos de decisão

| Quando | Pergunta | Se sim | Se não |
|---|---|---|---|
| 27/11 | Temos 5 grupos com viagem criada? | Segue | Usar amigos próximos e anotar que o dado é mais fraco |
| 20/12 | O app foi aprovado nas duas lojas? | Lançamento aberto no réveillon | Réveillon pelo TestFlight e pelo teste do Google; lançamento aberto em janeiro |
| 15/01 | Os sinais do RUMO apareceram? (7 de 10 convidados topam sem instalar; metade das viagens com 3 carimbos sem digitar; 30% dos grupos postam) | Ligar a assinatura | Consertar o que travou antes de cobrar |
| 15/01 | Algum grupo pagou o caderno? (barra do `PRECO.md`: 2 de 5 quiseram, 1 pagou) | Seguir com o caderno | Repensar o que é pago |
| 15/03 | Quantos organizadores pagam? | Aumentar o conteúdo e os vídeos | Rever o preço e o momento do paywall |

## Números (olhar toda segunda)

- Contas novas (fora as de teste `teste+…@teste.norti.app`).
- Viagens novas com 2 pessoas ou mais.
- Convidados que toparam pelo link sem instalar.
- Carimbos que saíram sem ninguém digitar.
- Retrospectivas e mapas compartilhados.
- Cadernos vendidos e assinantes.

## Conta de guardanapo (hipótese, não é projeção)

Assinatura imaginada de R$ 9,90 por mês. Menos 15% da loja e o imposto, sobram uns R$ 7,80 por assinante.

- Pra R$ 1.500 por mês: uns **190 assinantes**.
- Se 3 em cada 100 organizadores pagarem: uns **6 mil organizadores usando**.

Ou seja: o trabalho que mais pesa é fazer gente chegar (vídeo, convite, post), não construir tela. Nenhum desses números foi medido. Não usar em pitch (regra do `PRECO.md`).

## Cuidados com as lojas (conferir na hora de criar as contas: as regras mudam)

**Decisão (10/11/2026): as duas contas ficam no CNPJ do Victor.** O que isso traz:
- na loja, o vendedor aparece com a razão social do CNPJ, não "Norti" (o nome do app continua Norti);
- a Apple pede um site público ligado à empresa; um e-mail no domínio ajuda na verificação;
- o dinheiro das vendas cai na conta do CNPJ.

- **Google Play, conta pessoal nova:** antes de publicar, precisa de um teste fechado com pelo menos 12 pessoas por 14 dias seguidos. **Conta de empresa** (CNPJ e número D-U-N-S, que é grátis mas demora alguns dias) não tem essa exigência.
- **Apple, conta de empresa:** também pede o D-U-N-S. Na loja aparece o nome da empresa em vez do nome da pessoa.
- **Apple:** o app precisa de excluir conta lá dentro e, com "Entrar com Google", costuma exigir uma opção como "Entrar com Apple".
- **As duas:** link de privacidade, prints da loja, descrição em português (palavras do RUMO: "mapa de viagens com amigos", "passaporte de viagem", "roteiro de viagem com amigos", "retrospectiva da viagem") e uma conta de teste pra quem revisa. Mandar um vídeo curto do app nas notas da revisão da Apple ajuda (anotado em `docs/benchmark-2026-11/04-x-e-lojas.md`).
