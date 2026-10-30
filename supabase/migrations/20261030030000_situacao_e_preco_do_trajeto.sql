-- Spec 035: situação e preço do trajeto (D4).
--
-- O que esta migration faz (só acrescenta, não apaga nada):
-- 1. `trajetos.situacao`: 'sugestao' (ainda pensando), 'reservado' (segurou, falta pagar) ou 'comprado'.
--    Trajetos que já existem ficam como 'sugestao'.
-- 2. `trajetos.preco` + `trajetos.moeda`: quanto custa o trajeto pro comboio inteiro. Preço exige moeda.
-- As regras de acesso (RLS) da tabela continuam as mesmas: o comboio vê, o ADM edita.
--
-- Pra desfazer:
--   alter table public.trajetos drop column situacao, drop column preco, drop column moeda;

alter table public.trajetos
  add column situacao text not null default 'sugestao' check (situacao in ('sugestao', 'reservado', 'comprado')),
  add column preco numeric(12, 2) check (preco >= 0 and preco < 1000000),
  add column moeda char(3) check (moeda ~ '^[A-Z]{3}$'),
  add constraint trajetos_preco_com_moeda check (preco is null or moeda is not null);
