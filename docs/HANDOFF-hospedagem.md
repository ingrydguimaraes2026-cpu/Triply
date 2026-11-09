# HANDOFF: Hospedagem nova (pedido do Victor, 08/11/2026)

Branch `monorepo-split`, commits locais, **sem push** (push só quando o Victor pedir).

## O pedido
"Com base nas reuniões, temos que melhorar a hospedagem. Está horrível." A tela atual (app: `apps/mobile/app/hospedagem.tsx`, agora também dentro da aba **Reservas** → Hospedagem) é uma lista por destino com status ("Falta escolher", "Bate-e-volta"), botões Airbnb/Booking/Maps, as opções com preço e coração (voto), e "Adicionar opção".

## O que as reuniões mostram (Humana → Capturas: 22/10, 27/10, 28/10, 06/11)
Como o Victor e a Ingryd escolhem onde dormir, na prática:
- **Comparam opções por preço, distância da estação e check-in tardio.** A reunião de 27/10 foi quase toda sobre Veneza: "comparando hospedagens por preço, proximidade da estação e possibilidade de check-in tardio".
- **A estação manda.** "Tem que pegar um Airbnb em Veneza perto da estação de trem por causa do horário que a gente vai sair de Como." "Se for de trem, da estação de trem para o Airbnb direto."
- **Check-in à noite é a preocupação.** Chegam de madrugada em Veneza (ônibus de Como 22:20). "A gente não precisa se preocupar com o check-in, que vai até meia-noite." Pendente: "a confirmação do check-in noturno em Tirano".
- **Dia de check-out com malas:** "check-out em Tirano, levar as malas para um guarda-volumes em Como, passear e seguir à noite para Veneza". Tarefa: "verificar o guarda-volumes da Milano Centrale e opções em Como".
- **Nem todo destino precisa de cama:** Mônaco virou bate-e-volta, Bernina é passeio de um dia, Milão é passagem. Em Mônaco, "dormir lá no fim de semana do GP ficou pra pesquisa".
- **Escolha provisória:** "a escolha do Airbnb ficou provisória, sem reserva ou datas fechadas".
- **Pediram o total:** "Adicionar ao aplicativo a exibição do valor total gasto em hospedagem."
- Tarefas que saíram das reuniões: "pesquisar hospedagens em Nice e Tirano", "definir onde dormir na quarta-feira" (a partir de Veneza).

Ou seja: a pergunta deles não é "qual Airbnb é mais bonito", e sim **"onde dormimos cada noite, perto de onde chegamos, e conseguimos entrar no horário?"**.

## Onde está hoje (pra não refazer)
- Tabela `hospedagens` (opções por destino, votos em `hospedagem_votos`, `escolhida`, check-in e check-out, `hora_checkin_limite`, contato do anfitrião). Core: `packages/core/src/hospedagem.ts` (`montarHospedagem`, `resumoDaHospedagem`, `buscarOpcoesDeHospedagem`, `votarNaHospedagem`, `escolherHospedagem`).
- Avisos do dia (spec 122b, `packages/core/src/avisos-do-dia.ts`): já avisam "chega depois do check-in" (com botão pro anfitrião) e "malas no dia" (guarda-volumes), lendo a casa escolhida.
- Specs antigas: `011-hospedagem`, `063-vibe-da-hospedagem`, `068-quem-dorme-onde`, `060-malas-e-dia-de-passagem`, `120-hoje-com-reservas-do-grupo`. Pesquisa: `docs/pesquisa-hospedagem.md`.
- Aba Reservas: `apps/mobile/app/viagem/[id]/(abas)/reservas.tsx` mostra `TelaDeHospedagem naAba` (exportada de `hospedagem.tsx`).

## Ideia de rumo (pra validar com o Victor antes de codar)
1. **Por noite, não por destino:** uma linha do tempo das noites ("seg 7 · Tirano", "ter 8 · Tirano", "qua 9 · Veneza (chega 1h)"). Noite sem cama fica em destaque; bate-e-volta e passagem nem aparecem como pendência.
2. **Cada opção mostra o que eles comparam:** preço total e por pessoa, **distância a pé da estação** de chegada (vem do deslocamento do dia, spec 122), **check-in até que horas** contra a hora em que chegam (verde ou vermelho), e o voto.
3. **Pôr opção sem digitar:** colar o link do Airbnb/Booking e o app preencher (ou buscar pelo nome). Decidido em 08/11 que **print e link não agradam pro transporte**, então confirmar antes se pra hospedagem vale.
4. **Total da hospedagem** (pedido nas reuniões) e quanto já foi pago.
5. **Dia de check-out:** se o próximo deslocamento é bem depois, sugerir guarda-volumes perto da estação (já existe no aviso do dia).
6. Mesmas regras de permissão da spec 122: membro sugere opção e vota; ADM escolhe e marca como reservado/pago.

## Andamento
- 09/11: spec 123 e protótipo `docs/design/hospedagem-v2.html` escritos. Esperando o OK do Victor pra codar.

## Próximo passo exato
1. Ler `AGENTS.md`, este HANDOFF, `docs/RUMO.md` e a spec 011.
2. Escrever a **spec 123 (hospedagem por noite)** com o que entra e o que não entra, e um protótipo HTML em `docs/design/` (como foi o `transporte-v3.html`). Mostrar pro Victor antes de codar.
3. Depois de aprovada: core (função pura + teste), app (aba Reservas → Hospedagem) e, se precisar, migration nova.

## Cuidados
- O Victor reclama de tela complexa: **mostrar antes de perguntar**, poucos campos à vista e o resto em "Mais detalhes" (ver como ficou o Novo deslocamento, spec 122).
- Não rodar prettier (o projeto não tem config; quebra o estilo).
- Não salvar dado de teste na Eurotrip sem pedir. Não mexer em permissões da viagem sem pedir.
- Na Eurotrip, o Victor (Paulo victor) é **membro**; a ADM é a Ingryd.
