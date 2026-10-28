# Migrations

Arquivos SQL que criam e alteram as tabelas do banco no Supabase, em ordem (o nome começa com data e hora).

- `20261010120000_estrutura_inicial.sql`: tabelas (perfis, viagens, comboio, convites, destinos, trajetos, orçamentos, gastos, câmbio, fotos), regras de acesso (RLS) e o bucket de fotos.
- `20261010121000_ajustes_seguranca.sql`: esconde as funções de checagem de acesso da API e adiciona índices.
- `20261013182836_salvar_roteiro.sql`: cria a função `salvar_roteiro` (salva o roteiro inteiro numa transação só: apaga só os destinos removidos, insere os novos e grava a ordem; recusa edição desatualizada com o erro `TR409`). Só cria a função: não mexe em tabelas, regras RLS nem dados. Testada em `tests/salvar-roteiro.test.mjs`. Pra desfazer: `drop function public.salvar_roteiro(uuid, jsonb, uuid[]);`

- `20261018120000_salvar_gasto.sql` (specs 002/009): coluna `gastos.rascunho` e função `salvar_gasto` (gasto + divisões, tudo ou nada; o id pode vir do celular pra não duplicar).
- `20261018120100_datas_no_roteiro.sql` (spec 001): `salvar_roteiro` passa a gravar `chegada` e `saida`; saída antes da chegada é recusada.
- `20261018120200_link_reserva.sql` (spec 004): coluna `trajetos.link_reserva`.
- `20261018120300_limite_fotos.sql` (spec 005): no máximo 5 fotos por destino (a 014 tira esse limite).
- `20261018120400_comboio_sempre_com_adm.sql` (spec 007): a viagem nunca fica sem ADM; quem saiu continua com o nome visível nos gastos e fotos.
- `20261018120500_avatares.sql` (spec 008): bucket público `avatares` (cada um só mexe na própria pasta).
- `20261018130000_documentos_status.sql` (spec 010): tabela `documentos_status` (cada um marca o próprio checklist; o comboio vê).
- `20261018140000_hospedagens.sql` (spec 011): tabelas `hospedagens` e `hospedagem_votos`, função `escolher_hospedagem` (só o ADM marca a escolhida; uma por destino).
- `20261018150000_avisos_cambio.sql` (spec 013): tabelas `metas_cambio` e `push_inscricoes`, função `registrar_push` (aparelhos que recebem notificação).
- `20261018160000_boletim_cambio.sql` (spec 013): boletim do câmbio às 12h e 20h; a meta vira opcional, entram `ultimo_valor` e `boletim_em`.
- `20261018170000_feed_de_fotos.sql` (spec 014): tabelas `posts`, `curtidas` e `comentarios`; `fotos` ganha `post_id` e `ordem`; sai o limite de 5 por lugar, entra o de 10 fotos por post.
- `20261019120000_saldo_por_email.sql` (spec 015): carteira de euro por pessoa a partir de e-mails do Wise/Nomad. Cria `public.carteiras` e `public.movimentos_carteira`; funções `minha_conexao_gmail`, `saldo_euro_do_comboio` e a view `carteiras_com_saldo`. Quem escreve movimento é a Edge Function (service role); cada um só lê a própria carteira.
- `20261019130000_gmail_refresh_token.sql` e `20261019140000_gmail_contas_public.sql` (spec 015, ajustes): a conexão do Gmail (`gmail_contas`) acabou no schema `public` com RLS **sem política** pro cliente (o navegador não toca na tabela; só a Edge Function, que ignora RLS). Guarda o refresh token direto na coluna (o schema `public` com RLS fechada já protege; dá pra endurecer com Vault depois). Funções Edge: `conectar-gmail`, `ler-carteiras` (cron) e `desconectar-gmail`.
- `20261023040125_lugares.sql` (spec 016): tabela `lugares` (passeios, comida e guarda-volumes de cada destino; o comboio adiciona, quem criou ou o ADM edita e apaga).
- `20261023040133_horario_hospedagem.sql` (spec 011): `hospedagens` ganha `hora_checkin` e `hora_checkout` (opcionais).

As 6 de 18/10 são testadas em `tests/banco-specs.test.mjs`; as de 23/10, em `tests/lugares.test.mjs`.

Atenção: no Supabase, as duas primeiras aparecem registradas com outro número (`20261010152403` e `20261010152424`), porque o número é o momento em que foram aplicadas. As outras usam o mesmo número nos dois lugares.

Regra geral de acesso: quem está no comboio vê a viagem; o ADM edita destinos, trajetos, orçamento e convites; gasto "pessoal" só quem lançou vê.

Mudou o banco? Crie um arquivo novo aqui (nunca edite um antigo) e gere os tipos de novo em `src/types/database.ts`.
