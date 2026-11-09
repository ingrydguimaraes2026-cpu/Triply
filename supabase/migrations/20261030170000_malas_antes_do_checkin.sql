-- Spec 060: malas antes do check-in (E8). A hospedagem guarda as malas antes do check-in / depois do check-out?
--
-- O que esta migration faz (só acrescenta):
-- 1. `hospedagens.guarda_malas`: 'sim', 'nao' ou 'perguntar' (null = ninguém informou).
-- 2. `hospedagens.guarda_malas_obs`: detalhe curto ("até 22h", "€ 5 por mala").
-- RLS da tabela continua igual.
--
-- Pra desfazer:
--   alter table public.hospedagens drop column guarda_malas, drop column guarda_malas_obs;

alter table public.hospedagens
  add column guarda_malas text check (guarda_malas in ('sim', 'nao', 'perguntar')),
  add column guarda_malas_obs text check (guarda_malas_obs is null or char_length(trim(guarda_malas_obs)) between 1 and 120);
