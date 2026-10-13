# Specs: o que vamos construir

Cada arquivo aqui é um "envelope" de uma funcionalidade: o que é, por que existe, o que entra e o que não entra, quais telas e tabelas usa, e como saber que ficou pronto.

**Antes de começar qualquer funcionalidade, leia a spec dela.** Se algo não estiver claro ou precisar mudar, combine com o Victor e atualize a spec primeiro.

Foco agora: **só o app**. Infraestrutura (banco de testes separado, publicar na internet, testes automáticos no GitHub, e-mail próprio) fica pra depois.

## Roteiro

| # | Spec | Fase | Tamanho | Depende de | Status |
|---|---|---|---|---|---|
| — | Editar o roteiro (PR #3) | 1 | M | — | Em revisão |
| 001 | [Datas de cada destino](001-datas-dos-destinos.md) | 1 | P | PR #3 | A fazer |
| 002 | [Financeiro: gastos e divisão](002-financeiro-gastos-e-divisao.md) | 1 | G | — | A fazer |
| 003 | [Financeiro: orçamento e câmbio](003-financeiro-orcamento-e-cambio.md) | 1 | M | 002 | A fazer |
| 004 | [Transportes](004-transportes.md) | 1 | G | 001 | A fazer |
| 005 | [Fotos](005-fotos.md) | 1 | M | — | A fazer |
| 006 | [Overview com dados reais](006-overview-com-dados-reais.md) | 2 | P | 002, 003, 004, 005 | A fazer |
| 007 | [Gestão do comboio](007-gestao-do-comboio.md) | 2 | P | — | A fazer |
| 008 | [Minhas viagens e perfil](008-minhas-viagens-e-perfil.md) | 2 | M | — | A fazer |
| 009 | [Lançamento rápido de gasto](009-lancamento-rapido-de-gasto.md) | 2 | M | 002 | A fazer |

Tamanho: **P** = poucos dias, **M** = cerca de uma semana, **G** = mais de uma semana.

A ordem da Fase 1 é uma sugestão. 002 e 005 não dependem de nada e podem começar a qualquer momento.

## Fase 3: ideias guardadas (ainda sem spec)

- **Sugestão de ordem do roteiro.** A estrutura já existe em `src/features/destinos/ordem.ts` (`SugestaoDeOrdem`).
- **Horários reais de trem e ônibus** por uma API de transporte, pra preencher os trajetos.
- **Ler e-mails do banco** pra lançar gastos sozinho (ideia do áudio, precisa pensar em privacidade).
- **Retrospectiva da viagem**: resumo com mapa, gastos e as melhores fotos no fim.
- **Nome definitivo do app** e domínio.

## Como usar uma spec

1. Leia a spec inteira e as **perguntas em aberto**. Resolva as perguntas com o Victor antes de codar.
2. Mude o status aqui pra "Em andamento".
3. Trabalhe na sua branch, um pedaço de cada vez.
4. Use os **critérios de aceite** como roteiro de teste antes de abrir o PR.
5. No PR, cite a spec (ex.: "Implementa a spec 002"). Quando entrar na `main`, mude o status pra "Feito".

Pra uma spec nova, copie o [`_modelo.md`](_modelo.md).
