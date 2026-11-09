-- Spec 062: transfer de chegada (D12). "Como chegar" do aeroporto/estação até a hospedagem,
-- dentro do guia da casa.
--
-- O que esta migration faz (só acrescenta):
-- 1. `hospedagens.como_chegar`: instrução livre (opções, preço, onde pegar). Até 1000 caracteres.
-- RLS da tabela continua igual (editar: quem criou a opção ou o ADM).
--
-- Pra desfazer:
--   alter table public.hospedagens drop column como_chegar;

alter table public.hospedagens
  add column como_chegar text check (como_chegar is null or char_length(como_chegar) <= 1000);
