# 001. Datas de cada destino

**Fase:** 1 · **Tamanho:** P · **Depende de:** editor do roteiro (PR #3) · **Status:** A fazer

## Objetivo
O ADM informa quando o grupo chega e quando sai de cada destino. Com isso o app sabe quantas noites vocês ficam em cada lugar e em que dia da viagem estão.

## Por que
Quase tudo depois depende disso: o "próximo trajeto", o aviso de bate-e-volta (spec 004), o dia de cada gasto e a contagem de diárias. Hoje só existe a data de início e fim da viagem inteira.

## Inclui
- Definir data de chegada e de saída de cada destino.
- Mostrar no roteiro: "12 – 15 nov · 3 noites".
- Avisos (sem bloquear):
  - a data está fora do período da viagem;
  - a saída é antes da chegada;
  - dois destinos se sobrepõem;
  - tem um "buraco" de dias sem destino.
- Se a viagem ainda não tem datas, oferecer usar a primeira chegada e a última saída como período da viagem.

## Não inclui
- Horário de chegada e saída (isso é do trajeto, spec 004).
- Reordenar sozinho pela data. O editor já avisa quando a ordem não bate com as datas.

## Telas
- **Overview → Roteiro → Editar:** cada destino ganha os campos "Chegada" e "Saída". Ficam no mesmo modo de edição do PR #3 e são salvos junto com o resto.
- **Overview → Roteiro (leitura):** mostra as datas e o número de noites. Sem datas, continua mostrando o país, como hoje.
- **Cabeçalho do mapa:** a contagem regressiva continua usando a data da viagem.

## Dados
- **Já existem:** colunas `chegada` e `saida` (tipo `date`) na tabela `destinos`.
- **Muda no banco:** a função `salvar_roteiro` hoje não grava datas, de propósito. Opções:
  - criar uma migration nova que aceite `chegada` e `saida` em cada item (recomendado: continua "tudo ou nada");
  - ou fazer um `update` separado só das datas. Mais simples, mas não é atômico.

## Quem pode o quê
| Ação | ADM | Membro |
|---|---|---|
| Ver datas | sim | sim |
| Editar datas | sim | não |

## Critérios de aceite
- [ ] O ADM coloca chegada e saída num destino, salva, atualiza a página e as datas continuam lá.
- [ ] O roteiro mostra "X noites" certinho (chegada 12, saída 15 = 3 noites).
- [ ] Saída antes da chegada mostra aviso e não deixa salvar.
- [ ] Data fora do período da viagem mostra aviso, mas deixa salvar.
- [ ] O membro vê as datas, mas não vê o botão de editar.
- [ ] Datas vazias continuam funcionando (destino sem data).

## Perguntas em aberto
- Saída antes da chegada: bloquear ou só avisar? (Sugestão: bloquear.)
- Se as datas dos destinos saírem do período da viagem, atualizar a viagem sozinha ou só avisar? (Sugestão: só avisar, com um botão "ajustar período".)

## Dicas pra implementar
- Editor: `src/features/destinos/EditorRoteiro.tsx`. Função do banco: nova migration em cima de `salvar_roteiro`.
- Datas em português: `src/lib/datas.ts` (`formatarData`, `formatarPeriodo`). Crie ali uma `contarNoites(chegada, saida)`.
- Datas do banco vêm como texto `"2026-11-12"`. Não converta pra `Date` sem cuidado, porque o fuso horário pode mudar o dia.
