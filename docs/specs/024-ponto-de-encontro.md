# 024. Ponto de encontro

**Fase:** 2 · **Tamanho:** P · **Depende de:** 007 (comboio) · **Status:** Em andamento

## Objetivo
Deixar o comboio combinar **onde e que horas se encontrar** ("portão 3 da estação, 9h"), com um link que abre o lugar no mapa. Resolve uma das maiores dores: horários descumpridos e gente perdida no meio do passeio.

## Por que
- **Pesquisa de mercado (out/2026):** horários descumpridos aparece em 36,3% das viagens em grupo.
- Hoje isso vira mensagem solta no WhatsApp e some. No app, fica fixo e todo mundo vê igual.

## Como funciona
- Uma tabela `pontos_de_encontro` guarda, por viagem: o **local** (texto), o **quando** (data e hora, opcional), uma **observação** (opcional) e **coordenadas** (opcionais, pro mapa).
- Todo o comboio vê e cria. Quem criou ou o ADM edita e apaga.
- Cada ponto tem um link que abre no **Google Maps** (pelas coordenadas, ou buscando pelo nome do local).

## Inclui
- **Core (`@together/core`):** `buscarPontosDeEncontro`, `criarPontoDeEncontro`, `editarPontoDeEncontro`, `apagarPontoDeEncontro` e `linkDoMapa`.
- **Web (Overview):** cartão "Ponto de encontro" com a lista (local, horário, observação, link pro mapa) e um formulário pra adicionar (local, observação e data/hora).
- **Mobile (tela da viagem):** o mesmo cartão. O horário é definido no site por enquanto (como o prazo das tarefas); no app dá pra criar com local + observação e abrir o mapa.

## Não inclui (fica pra depois)
- Mapa embutido na tela (hoje é um link que abre o Google Maps). Um mapa dentro do app é um item à parte.
- Lembrete/push antes do horário combinado — é o item #11 (Lembretes).
- Escolher o ponto a partir de um lugar já salvo do roteiro (dá pra ligar depois).
- Seletor de data/hora nativo no app (por isso o horário fica no site por ora).

## Dados
- **Migration nova** (`20261029170000_ponto_de_encontro.sql`):
  - Tabela `pontos_de_encontro` (`local`, `quando`, `observacao`, `latitude`, `longitude`, `criado_por`, `criado_em`, `atualizado_em`).
  - Gatilho: viagem e autor não mudam; `atualizado_em` acompanha a edição.
  - RLS: comboio vê e cria; autor ou ADM editam e apagam.
- **Tipos:** `pontos_de_encontro` adicionado à mão em `packages/core/src/database.ts`. Depois de aplicar a migration, gerar de novo.

## Quem pode o quê
| Ação | ADM | Membro (autor) | Membro (outro) | Convidado (membro) | Estranho |
|---|---|---|---|---|---|
| Ver os pontos | sim | sim | sim | sim | não |
| Criar | sim | sim | sim | sim | não |
| Editar / apagar | qualquer um | o próprio | não | o próprio | não |

## Critérios de aceite
- [ ] Na Overview (e no app), aparece o cartão "Ponto de encontro" com a lista e o formulário.
- [ ] Qualquer membro cria um ponto; some pra quem não é do comboio.
- [ ] Clicar no local abre o Google Maps (coordenadas quando houver, senão busca pelo nome).
- [ ] Quem criou ou o ADM apaga; outro membro não consegue (nem chamando o banco direto).
- [ ] Não dá pra trocar a viagem nem o autor de um ponto (nem pelo banco).
- [ ] `npm run build`, `npm run lint` e os testes passam.

## Dicas pra implementar
- **Core:** `packages/core/src/dados.ts` (seção "Ponto de encontro"). `linkDoMapa` monta a URL do Google Maps.
- **Web:** `src/features/encontro/PontoDeEncontro.tsx` (+ `encontro.css`), montado na Overview.
- **Mobile:** `src/ui/PontoDeEncontro.tsx`, montado em `app/viagem/[id].tsx`.
- **Testes:** `apps/web/tests/banco-specs.test.mjs`, seção "024" (espelha a RLS de tarefas/avisos).
- **Referência:** a migration e as telas espelham os avisos (019) e as tarefas (020).
