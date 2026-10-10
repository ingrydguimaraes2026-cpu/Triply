# Migrations

Arquivos SQL que criam e alteram as tabelas do banco no Supabase, em ordem (o nome começa com data e hora).

- `20261010120000_estrutura_inicial.sql`: tabelas (perfis, viagens, comboio, convites, destinos, trajetos, orçamentos, gastos, câmbio, fotos), regras de acesso (RLS) e o bucket de fotos.
- `20261010121000_ajustes_seguranca.sql`: esconde as funções de checagem de acesso da API e adiciona índices.

Regra geral de acesso: quem está no comboio vê a viagem; o ADM edita destinos, trajetos, orçamento e convites; gasto "pessoal" só quem lançou vê.

Mudou o banco? Crie um arquivo novo aqui (nunca edite um antigo) e gere os tipos de novo em `src/types/database.ts`.
