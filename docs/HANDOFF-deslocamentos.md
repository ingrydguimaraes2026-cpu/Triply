# HANDOFF: Deslocamentos no dia (spec 122)

Atualizado em 08/11/2026. Branch: `monorepo-split` (commits locais, **sem push**).

## Onde estamos
- **Pronto:** a spec [`docs/specs/122-deslocamentos-no-dia.md`](specs/122-deslocamentos-no-dia.md) e o protótipo [`docs/design/transporte-v3.html`](design/transporte-v3.html) (4 telas: o dia em horários, comparar, achar o jeito de ir, Passagens).
- **Feito (08/11):** 122a, 122b e 122c no app (banco aplicado). Ver "Como ficou" na spec.
- **Falta:** 122d (Passagens no lugar de Transportes, app e site).
- **De onde veio:** reuniões noturnas de planejamento da Eurotrip (22/10, 27/10, 28/10, 06/11 no Humana). Eles planejam o dia horário por horário e comparam opções por folga, último do dia, trocas e preço. A tela de Transportes atual (trecho por par de cidades) foi chamada de "meio inútil".

## Decisões já tomadas (08/11)
- Tudo dentro do Norti. **Nada** de botão pro Rome2rio, colar link ou mandar print.
- Achar o jeito de ir = cartões por meio, no estilo do Rome2rio (trem, ônibus, carro, táxi). Tocou, abrem os horários exatos (Transitous, grátis). Carro e táxi com preço "estimativa" (OSRM + conta por km). O que não tem dado (balsas e ônibus do Lago de Como) entra à mão, já pré-preenchido.
- Comparação Rome2rio x Transitous está na própria spec (122c).

## Perguntas ainda sem resposta (perguntar ao Victor antes da 122a)
1. Membro pode sugerir opção sem ser liberado? (proposta: sim)
2. Folga mínima: 30 min sem malas e 45 com malas?
3. Quem arruma os destinos da Eurotrip (Mônaco repetido; Bernina e Como como cidade)?

## Próximo passo exato
1. Ler `AGENTS.md`, `docs/RUMO.md`, a spec 122 e abrir o protótipo.
2. **122a:**
   - migration nova ampliando `trajetos`: `dia`, `de_texto`/`para_texto` e coordenadas, `situacao`, `grupo_opcoes`, `escolhida`, `ultimo_do_dia`, `frequencia_min`, `trocas`, `preco_pessoa`, `link`;
   - backfill dos trajetos antigos;
   - **pedir confirmação** antes de aplicar e gerar os tipos em `packages/core/src/database.ts`.
3. Mostrar os deslocamentos no dia (app primeiro; web no essencial).
4. Depois: 122b (avisos, função pura + teste), 122c (cartões e horários), 122d (Passagens no lugar de Transportes).

## Cuidados
- Não quebrar o que lê `trajetos`: Financeiro, "Hoje" (120), reservas (`salvarReserva`), caminho (121c).
- Transitous: os dados do Lago de Como (ferry, ônibus C30) não existem. Datas muito no futuro podem vir vazias; testar com datas próximas.
- `npm test` só uma vez, no fim, porque mexe em banco.
