# 002. Financeiro: gastos e divisão

**Fase:** 1 · **Tamanho:** G · **Depende de:** — · **Status:** A fazer

## Objetivo
O comboio registra quanto gastou, quem pagou e como dividir. O app mostra quem deve quanto pra quem. Gastos pessoais (as "comprinhas") ficam visíveis só pra quem lançou.

## Por que
É a parte que mais pesa no dia a dia da viagem. Do áudio: "você pagou o café todo e tanto". No benchmark, o Tricount e o Splitwise vivem disso. Na viagem real de vocês, o dinheiro ficava numa conta só, com dois cartões.

## Inclui
- **Lançar gasto:** descrição, valor, moeda, categoria, data, quem pagou e o tipo (do comboio ou pessoal).
- **Dividir o gasto** entre quem participou:
  - igual entre todos (o padrão);
  - igual só entre alguns;
  - valores diferentes por pessoa.
- **Lista de gastos** por dia, com filtro por categoria e por "só meus pessoais".
- **Editar e apagar** gasto.
- **Saldo de cada pessoa** e "quem deve pra quem", com o menor número de pagamentos possível.

## Não inclui
- Orçamento e câmbio (spec 003).
- Converter moedas pros totais. Nesta spec, o total é mostrado separado por moeda (ex.: "€ 320 + R$ 150").
- Marcar uma dívida como paga. Pode virar uma spec curta depois.
- Lançamento rápido pelo celular (spec 009).

## Telas
- **Financeiro → "Lançar gasto"** abre um formulário. No celular é uma gaveta que sobe de baixo.
  - Valor primeiro, em campo grande; moeda já vem com a da viagem.
  - Descrição e categoria (os 6 ícones que já existem na tela).
  - "Quem pagou?" mostra os avatares do comboio, com você já marcado.
  - "Dividir com": todos marcados por padrão. Um botão "valores diferentes" abre os campos por pessoa.
  - Interruptor "Pessoal (só eu vejo)": quando ligado, esconde o "quem pagou" e o "dividir".
- **Financeiro → lista:** os gastos agrupados por dia, com ícone da categoria, quem pagou e valor. Os pessoais têm um selo "só você vê".
- **Financeiro → "Acertos":** "Ingryd deve € 23,50 pro Victor". Uma linha por pagamento necessário.
- **Estados:** sem gastos (já existe), carregando e erro ao salvar.

## Dados (já existem no banco)
- **`gastos`:** `viagem_id`, `pago_por`, `criado_por`, `descricao`, `valor`, `moeda`, `categoria` (transporte, hospedagem, alimentacao, passeios, comprinhas, outros), `pessoal`, `data`.
- **`gasto_divisoes`:** `gasto_id`, `usuario_id`, `valor` (quanto cada um deve daquele gasto).
- **Regras que o banco já garante:**
  - gasto pessoal só aparece pra quem lançou;
  - só quem lançou edita;
  - quem lançou ou o ADM apaga (o ADM não apaga os pessoais dos outros);
  - "quem pagou" tem que ser do comboio.
- **Sugestão:** criar uma função no banco `salvar_gasto(gasto, divisoes)` pra gravar o gasto e as divisões juntos ("tudo ou nada"), igual ao `salvar_roteiro`.

## Quem pode o quê
| Ação | ADM | Membro |
|---|---|---|
| Lançar gasto do comboio | sim | sim |
| Lançar gasto pessoal | sim | sim |
| Editar gasto | só os que lançou | só os que lançou |
| Apagar gasto do comboio | qualquer um | só os que lançou |
| Ver gasto pessoal de outra pessoa | não | não |

## Critérios de aceite
- [ ] Lançar "Café, € 12, pago pela Ingryd, dividido igual entre 2" → acertos mostram "Victor deve € 6 pra Ingryd".
- [ ] Lançar um gasto pessoal → o outro membro não vê (testar logado com as duas contas).
- [ ] Divisão com valores diferentes que não somam o total mostra erro e não salva.
- [ ] Editar o valor de um gasto atualiza os acertos.
- [ ] Apagar um gasto some da lista e dos acertos.
- [ ] Gastos em € e R$ aparecem com o total separado por moeda.
- [ ] Funciona no celular (375 px) com uma mão só: o formulário cabe na tela sem rolar muito.

## Perguntas em aberto
- Centavos: arredondar a divisão igual pra quem? (Sugestão: a sobra vai pra quem pagou.)
- O gasto pessoal entra no total da viagem de quem lançou? (Sugestão: sim, mas só pra essa pessoa.)
- Precisa de "acertado" (marcar dívida como paga) já na primeira versão?

## Dicas pra implementar
- Tela: `src/pages/viagem/Financeiro.tsx` (o `TODO (Ingryd)` no topo). Lógica: `src/features/financeiro/api.ts` e `hooks.ts`.
- Faça o cálculo dos acertos numa função pura (`src/features/financeiro/acertos.ts`) e teste igual ao `ordem.ts`, com `tests/*.test.mjs`.
- Dinheiro: guarde e calcule em centavos (número inteiro) e só formate na tela com `Intl.NumberFormat('pt-BR', { style: 'currency', currency })`.
- Peças prontas: `Cartao`, `EstadoVazio`, `CabecalhoPagina`, `Avatar` em `src/components/ui/`.
