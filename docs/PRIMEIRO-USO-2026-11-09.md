# Primeiro uso: onde a pessoa nova se perde (09/11/2026)

**De onde veio:** a Ingryd entrou pelo celular em `norti-viagem.vercel.app`. Gostou da estética, mas disse que "uma pessoa comum iniciando no app ia ficar um pouco confusa". O Victor parou as coisas novas até resolver isso.

**Como foi feito:** percorri pelo código o caminho de quem chega (sem conta de teste, as telas logadas não foram abertas). A tela de entrar foi vista no ar, a 375 px.

## O que confunde (do mais grave pro menos grave)

1. **Cria a viagem e cai num baralho de lugares.** No jeito rápido, depois de "Escolher os lugares" a pessoa vai direto pro Explorar (`NovaViagem.tsx:158`), sem ver a tela da viagem, sem saber que dá pra chamar o grupo. O nome do botão também não diz que a viagem já foi criada.
2. **Três coisas com cara de "carimbo" na mesma tela:** "Próximo carimbo", "Passaporte do comboio (0 de 6)" e "Carimbos" (um por cidade). São ideias diferentes com nomes parecidos.
3. **Um assunto, vários nomes:**
   - Passagens, Transporte, Deslocamento e Chegar são a mesma coisa.
   - Reservas, Dormir, Hospedagem e Noites também.
   - Contas, Gastos e Financeiro também.
4. **Convidar está espalhado:** "+ Convidar", "Chamar a galera" (2 vezes no mesmo cartão), "Comboio". O Roteiro diz "chame a galera" e não tem o botão.
5. **"Tudo da viagem" esconde e despeja:** no celular só abre pelo "..." da capa e mostra uns 20 itens de uma vez (Cofre, Orçamento combinado, Datas em comum, Cheguei bem...).
6. **Palavras de dentro:** comboio, ADM, Cofre, "Não abro mão", "começar sonhando", Norti (aparece sem apresentar).
7. **Inglês e texto de computador:** Matches, match, Feed, post, Splitwise, "Clique" (no celular), teclas de atalho do baralho aparecendo no celular.

## Consertos propostos (só com o que já existe, nada novo)

| # | Conserto | Onde |
|---|---|---|
| A | Depois de criar a viagem, abrir a **tela da viagem** com um passo claro ("Chamar a galera" ou "Escolher os lugares"), não o baralho direto | app e site, criar viagem |
| B | **Um só "carimbo"** na tela da viagem: juntar "Próximo carimbo" e "Passaporte" num cartão "Próximo passo" e deixar "Carimbos" só para os lugares | aba Viagem |
| C | **Um nome por assunto**, igual às abas: Reservas → Transporte e Hospedagem; Contas. Trocar "deslocamento" por "transporte" no texto da tela | textos |
| D | **Glossário de tela:** "comboio" vira "grupo" ou "galera"; ADM vira "quem organiza"; Matches vira "Todo mundo quer"; Feed/post viram "Fotos" e "Publicar" | textos |
| E | **Convidar sempre igual:** um botão "Chamar a galera" (um só texto), e ele aparece onde a tela pede o grupo (Roteiro sozinho, Viagem) | Viagem, Roteiro |
| F | **"Tudo da viagem" enxuto:** atalhos em cima e os cartões fechados (ou só os que têm algo) | Tudo da viagem |
| G | Login: trocar "do comboio" por algo que diga o que é ("o mapa das viagens da sua galera") | login |
| H | Detalhes: "Clique" → "Toque" no celular, esconder teclas de atalho no celular | textos |

**Ordem sugerida:** A, B, D, C, E (mudam a primeira impressão), depois F, G, H. Tudo nasce no app e o site acompanha.

**Pra confirmar com a Ingryd:** em que tela ela pensou "e agora?"; que palavra não entendeu; o que esperava ver logo depois de criar a viagem.
