# Migrations

Arquivos SQL que criam e alteram as tabelas do banco no Supabase, em ordem (o nome começa com data e hora).

- `20261010120000_estrutura_inicial.sql`: tabelas (perfis, viagens, comboio, convites, destinos, trajetos, orçamentos, gastos, câmbio, fotos), regras de acesso (RLS) e o bucket de fotos.
- `20261010121000_ajustes_seguranca.sql`: esconde as funções de checagem de acesso da API e adiciona índices.
- `20261013182836_salvar_roteiro.sql`: cria a função `salvar_roteiro` (salva o roteiro inteiro numa transação só: apaga só os destinos removidos, insere os novos e grava a ordem; recusa edição desatualizada com o erro `TR409`). Só cria a função: não mexe em tabelas, regras RLS nem dados. Testada em `tests/salvar-roteiro.test.mjs`. Pra desfazer: `drop function public.salvar_roteiro(uuid, jsonb, uuid[]);`

- `20261018120000_salvar_gasto.sql` (specs 002/009): coluna `gastos.rascunho` e função `salvar_gasto` (gasto + divisões, tudo ou nada; o id pode vir do celular pra não duplicar).
- `20261018120100_datas_no_roteiro.sql` (spec 001): `salvar_roteiro` passa a gravar `chegada` e `saida`; saída antes da chegada é recusada.
- `20261018120200_link_reserva.sql` (spec 004): coluna `trajetos.link_reserva`.
- `20261018120300_limite_fotos.sql` (spec 005): no máximo 5 fotos por destino.
- `20261018120400_comboio_sempre_com_adm.sql` (spec 007): a viagem nunca fica sem ADM; quem saiu continua com o nome visível nos gastos e fotos.
- `20261018120500_avatares.sql` (spec 008): bucket público `avatares` (cada um só mexe na própria pasta).

As 6 de 18/10 são testadas em `tests/banco-specs.test.mjs`.

Atenção: no Supabase, as duas primeiras aparecem registradas com outro número (`20261010152403` e `20261010152424`), porque o número é o momento em que foram aplicadas. A `salvar_roteiro` usa o mesmo número nos dois lugares.

Regra geral de acesso: quem está no comboio vê a viagem; o ADM edita destinos, trajetos, orçamento e convites; gasto "pessoal" só quem lançou vê.

Mudou o banco? Crie um arquivo novo aqui (nunca edite um antigo) e gere os tipos de novo em `src/types/database.ts`.
