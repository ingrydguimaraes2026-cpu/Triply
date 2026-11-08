# 118. Passaporte da galera (a âncora)

**Fase:** 0 (vem antes de tudo) · **Tamanho:** G (dividida em 118a a 118f) · **Depende de:** 102, 105, 106, 108, 110, 117, 120 · **Status:** 118a com código pronto (08/11), banco a aplicar; 118b a 118f a fazer

> Esta spec é a âncora do produto. Leia antes o [`docs/RUMO.md`](../RUMO.md) e a [parte 09 do benchmark](../benchmark-2026-11/09-ancora-opcoes.md).
> **Substitui** a versão anterior da 118 ("o ciclo viagem sem climão", com a cobrança do Pix como âncora), rejeitada pelo Victor em 03/11/2026.

## Objetivo
"O mapa de todas as viagens e rolês da sua galera." Cada lugar onde alguém do grupo esteve vira um carimbo, sem digitar. O mapa do grupo acende, a retrospectiva sai pronta pra postar, e fora da viagem o app lembra do passado ("há 1 ano") e conta os dias pra próxima (widget).

## Por que
- Âncora que pega é um **objeto pronto, sem digitar, bonito pra virar print** (Polarsteps, Flighty Passport, Spotify Wrapped). Benchmark partes 06 e 08.
- Na Ásia, o hábito vem de **colecionar lugares com prova** (集章, 御朱印, 駅メモ, cidades que acendem). Parte 07.
- **Ninguém faz isso em grupo.** Been, Visited, Polarsteps e Google Fotos são individuais. Parte 09.
- Viagem é rara. Contar **rolê, show e bate-volta**, mais o "há 1 ano" e o widget, é o que dá frequência.
- **Já temos a base:** passaporte de selos (117), retrospectiva (105), livro (106), onde já fui (102), GPS da foto (108), avisos no app (110).

## Palavras desta spec
- **Galera:** a pessoa e todo mundo com quem ela já dividiu pelo menos uma viagem ou rolê no Tripwave.
- **Carimbo:** um lugar (cidade, praia, show) com data, arte e quem estava lá. É diferente dos **selos** da 117 (os 6 passos de planejar: Roteiro, Galera, Datas, Dormir, Chegar, Contas). Os selos continuam; na tela, chamar de "passos" pra não confundir.
- **Rolê:** viagem curta de 1 dia ou fim de semana, criada em 2 toques, sem planejar nada.

## Inclui (em 6 partes, cada uma entregável sozinha)

### 118a · Carimbo (o coração)
- Cada destino de uma viagem vira um carimbo **apagado** no começo.
- O carimbo é **liberado sozinho** quando alguém do grupo prova que esteve lá:
  - **localização:** com o app aberto, a pessoa está a até 15 km do destino, dentro das datas da viagem (só com permissão de localização "durante o uso", nada em segundo plano);
  - **foto:** uma foto postada na viagem tem GPS perto do destino (lê com a 108) ou foi tirada nas datas da viagem;
  - **"Hoje":** chegou no lugar do roteiro (o "Cheguei" do "Hoje", spec 120).
- Sem prova: qualquer um que estava lá toca em **"a gente esteve aqui"** (1 toque, sem digitar). O carimbo fica com o traço um pouco diferente ("de memória").
- Arte do carimbo: moldura redonda ou quadrada com o **nome do lugar, a data e um ícone do tipo** (praia, serra, cidade, show, festa), gerada no aparelho, nas cores do app. Arte ilustrada própria das 30 cidades mais buscadas do Brasil fica pra depois.
- Quando cai um carimbo: animação de carimbar (o "tum" da 117), a Norti comemora e aparece **"postar carimbo"** (imagem 9:16 com "feito com Tripwave").
- Cada carimbo mostra quem estava lá (rostos) e quem liberou primeiro.

### 118b · Mapa da galera
- No Início (fora da viagem): o **mapa com todos os carimbos da galera**. Cidades e países carimbados acendem; o resto fica apagado.
- Filtro simples: "eu", "a galera toda", ou um grupo de amigos (as pessoas de uma viagem).
- Números: lugares carimbados, viagens, rolês, dias juntos, km.
- **Disputa leve:** "quem carimbou mais este ano" entre a galera, com os 3 primeiros. Sem ranking público, sem gente desconhecida.
- "Postar mapa": imagem 9:16 do mapa aceso com os números.
- Reaproveita o mapa do "Onde já fui" (102), que passa a ler os carimbos.

### 118c · Retrospectiva que monta sozinha
- No fim da viagem, a retrospectiva (105) fica pronta sozinha, com aviso no celular: "a retrospectiva de Floripa está pronta".
- Entram os carimbos da viagem, o mapa percorrido, as 3 fotos mais curtidas, dias, pessoas e gasto por pessoa (só o do grupo).
- **Moldura por data:** Réveillon (viagem que passa por 31/12), Carnaval, São João, feriado prolongado; o resto usa a moldura padrão.
- **Legenda pronta** (IA invisível) que a pessoa pode trocar antes de postar.
- **Caderno:** o livro da viagem (106) em PDF, com os carimbos na capa.
- "Bora a próxima?" cria uma viagem nova com a mesma galera (055).

### 118d · "Há 1 ano"
- No dia em que faz 1 ano (ou 2, 3...) de um carimbo, aviso no celular: **"há 1 ano vocês estavam em Floripa"**, com a foto mais curtida.
- Tocar abre a lembrança: carimbo, fotos daquele dia, quem estava, e "postar".
- No Início, um cartão "neste dia" quando houver lembrança.
- No máximo 1 aviso por dia; dá pra desligar no Perfil.

### 118e · Widget da contagem
- Widget na tela do celular (iPhone e Android): **"Floripa em 23 dias"** com a foto de capa da viagem.
- Sem viagem marcada: mostra o último carimbo e "quantos lugares a galera já carimbou".
- Tocar no widget abre a viagem.

### 118f · Viagens antigas e rolês
- **Viagem antiga:** "a gente já foi pra..." com lugar, mês/ano e quem foi (convidar pela lista da galera ou pelo link). Vira carimbo "de memória" e acende o mapa.
- Dá pra pôr fotos antigas: se tiverem GPS e data (108), o lugar e o mês vêm sozinhos.
- **Rolê em 2 toques:** "rolê hoje" + lugar (praia, show, bate-volta). Sem roteiro, sem hospedagem. Na hora, o carimbo cai pela localização ou pela foto.
- Cada viagem antiga ou rolê conta no mapa, na disputa e no "há 1 ano".

## Não inclui (fica pra depois)
- Localização em segundo plano (rastrear o trajeto como o Polarsteps). Só com o app aberto, por privacidade (089).
- Arte ilustrada própria por cidade (começa com moldura + ícone).
- Livro impresso de verdade (só o PDF agora).
- Copiar a viagem de outro grupo (fase 2, opção B da parte 09).
- Ranking com desconhecidos ou mapa público.
- Live Activity (contagem na tela de bloqueio do iPhone).
- Vídeo animado da retrospectiva.

## Telas
- **Início (fora da viagem):** mapa da galera em cima, números, "quem carimbou mais", cartão "neste dia" (quando houver), próxima viagem com contagem, botões "nova viagem", "rolê hoje" e "a gente já foi pra...".
- **Viagem, aba Viagem:** os carimbos da viagem (apagados e acesos) ao lado dos passos da 117.
- **Carimbo aberto:** arte, data, rostos, como foi liberado, fotos daquele lugar, "postar".
- **Retrospectiva:** cartões com moldura, legenda editável, "postar" e "baixar caderno".
- **Widget:** pequeno (contagem) e médio (contagem + foto).
- Estados: sem viagem nenhuma ("seu mapa está vazio: conta onde a galera já foi" com o botão das viagens antigas), sem permissão de localização (explica e oferece liberar pela foto), sem internet (mostra o que está guardado).
- Tudo em 360px. Nada de emoji; ícones e selos do catálogo (`<Icone>`, `<Selo>`).

## Dados
- Usa: viagens, destinos, membros, fotos/posts (014, 108), gastos (só os do grupo), hospedagem.
- **Muda (migration nova, pedir confirmação antes):**
  - `carimbos`: viagem, destino (ou lugar livre do rolê), nome do lugar, latitude, longitude, tipo (praia, serra, cidade, show, festa), data, `liberado_por`, `como` (localização, foto, hoje, memória), `liberado_em`.
  - `viagens`: marca de tipo (viagem, rolê, antiga), se ainda não houver jeito de saber pelo que existe.
- **A localização exata da pessoa não é guardada.** O aparelho só compara com o destino e manda "estive aqui".
- RLS: quem está na viagem vê e libera os carimbos dela; o mapa da galera junta só viagens das quais a pessoa participa (nada de ver viagem alheia).
- "Há 1 ano" e widget: sem tabela nova (lê os carimbos e as viagens).

## Quem pode o quê
| Ação | ADM (organizador) | Membro | Convidado pelo link |
|---|---|---|---|
| Liberar carimbo (localização, foto, "Hoje") | sim | sim | não (só vê na vitrine) |
| "A gente esteve aqui" (sem prova) | sim | sim | não |
| Apagar carimbo errado | sim | não | não |
| Ver o mapa da galera | sim (o seu) | sim (o seu) | não |
| Criar rolê ou viagem antiga | sim | sim (vira ADM dela) | não |
| Postar carimbo, mapa ou retrospectiva | sim | sim | não |

## Critérios de aceite
- [ ] Viagem com 2 destinos: os 2 carimbos aparecem apagados antes da viagem.
- [ ] No dia da viagem, abrindo o app perto do destino (ou postando uma foto com GPS de lá), o carimbo cai sozinho com a animação, sem digitar nada.
- [ ] Sem prova, "a gente esteve aqui" libera o carimbo com o traço "de memória".
- [ ] "Postar carimbo" gera imagem 9:16 bonita com "feito com Tripwave".
- [ ] O mapa da galera acende os lugares de todas as minhas viagens e rolês, e mostra quem carimbou mais no ano.
- [ ] Viagem que passa por 31/12 ganha a moldura de Réveillon na retrospectiva, e a retrospectiva avisa sozinha quando fica pronta.
- [ ] Com um carimbo de 03/11/2025, no dia 03/11/2026 chega o aviso "há 1 ano vocês estavam em...".
- [ ] O widget mostra "Floripa em N dias" e atualiza a cada dia.
- [ ] "A gente já foi pra Paris em 2019" acende Paris no mapa em menos de 30 s.
- [ ] "Rolê hoje" + lugar cria o rolê em 2 toques.
- [ ] A localização exata não aparece em nenhuma tabela do banco.
- [ ] Tudo funciona em 360px.

## Perguntas em aberto
- O raio de 15 km serve pra praia e cidade grande? (proposta: 15 km pra cidade, 3 km pra lugar pontual tipo show)
- Rolê precisa de outra pessoa pra contar, ou rolê solo também vale? (proposta: vale; solo usa sem atrito)
- A disputa "quem carimbou mais" pode gerar climão? (proposta: só mostra os 3 primeiros, sem último lugar)
- O que fica grátis e o que é da assinatura do organizador? (proposta: carimbo e mapa grátis sempre; molduras especiais, caderno e viagens antigas ilimitadas na assinatura; decidir antes de cobrar)
- Widget precisa de build nativo (EAS) com código fora do Expo Go: quando fazer?

## Dicas pra implementar
- **Ordem sugerida:** 118a (com a 120, que libera o carimbo pelo "Hoje") → 118b → 118c → 118f → 118d → 118e.
- Regras (distância até o destino, datas, moldura por data, "há N anos", contagem) no `packages/core`, com teste, como o resto.
- GPS e data da foto: `packages/core/src/exif.ts` (108) já lê.
- Mapa: o do "Onde já fui" (102) e o da Overview; não criar outro.
- Animação de carimbar: `apps/mobile/src/ui/viagem/Passaporte.tsx` e `src/ui/movimento.ts` (117).
- Retrospectiva e caderno: `apps/mobile/app/retrospectiva.tsx` e `pdf-da-viagem.tsx`; regra do livro em `packages/core/src/livro.ts`.
- Avisos no celular ("há 1 ano", retrospectiva pronta): os avisos locais da 110.
- Widget: `react-native-android-widget` no Android e um alvo de widget no iOS (via config plugin, build EAS). Está como M13 na FILA.
- Ícones de tipo de lugar: catálogo do `@together/core` (`docs/design/ICONES.md`); nada de emoji.
