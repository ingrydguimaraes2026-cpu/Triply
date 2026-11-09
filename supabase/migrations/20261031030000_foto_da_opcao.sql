-- Spec 072: prévia do link (E9). A opção de hospedagem guarda a foto que veio do link.
--
-- O que esta migration faz (só acrescenta):
-- 1. `hospedagens.foto_url`: endereço https da foto (não guardamos a imagem, só o link dela).
--
-- Pra desfazer:
--   alter table public.hospedagens drop column foto_url;

alter table public.hospedagens
  add column foto_url text check (foto_url is null or (foto_url ~ '^https://' and char_length(foto_url) <= 1000));
