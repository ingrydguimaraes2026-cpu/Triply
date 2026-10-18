# Migrations

Arquivos SQL que criam e alteram as tabelas do banco no Supabase, em ordem (o nome começa com data e hora).

- `20261010120000_estrutura_inicial.sql`: tabelas (perfis, viagens, comboio, convites, destinos, trajetos, orçamentos, gastos, câmbio, fotos), regras de acesso (RLS) e o bucket de fotos.
- `20261010121000_ajustes_seguranca.sql`: esconde as funções de checagem de acesso da API e adiciona índices.
- `20261013182836_salvar_roteiro.sql`: cria a função `salvar_roteiro` (salva o roteiro inteiro numa transação só: apaga só os destinos removidos, insere os novos e grava a ordem; recusa edição desatualizada com o erro `TR409`). Só cria a função: não mexe em tabelas, regras RLS nem dados. Testada em `tests/salvar-roteiro.test.mjs`. Pra desfazer: `drop function public.salvar_roteiro(uuid, jsonb, uuid[]);`

Atenção: no Supabase, as duas primeiras aparecem registradas com outro número (`20261010152403` e `20261010152424`), porque o número é o momento em que foram aplicadas. A `salvar_roteiro` usa o mesmo número nos dois lugares.

Regra geral de acesso: quem está no comboio vê a viagem; o ADM edita destinos, trajetos, orçamento e convites; gasto "pessoal" só quem lançou vê.

Mudou o banco? Crie um arquivo novo aqui (nunca edite um antigo) e gere os tipos de novo em `src/types/database.ts`.
