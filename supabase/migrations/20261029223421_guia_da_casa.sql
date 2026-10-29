-- Spec 026: endereço e guia da casa na hospedagem.
-- Só adiciona colunas opcionais em `hospedagens` (aditiva). As policies da spec 011 continuam valendo:
-- o comboio vê; quem criou a opção ou o ADM edita.
--
-- Pra desfazer:
--   alter table public.hospedagens drop column endereco, drop column wifi_rede, drop column wifi_senha,
--     drop column codigo_porta, drop column regras_casa;

alter table public.hospedagens
  add column endereco text check (endereco is null or char_length(endereco) <= 300),
  add column wifi_rede text check (wifi_rede is null or char_length(wifi_rede) <= 100),
  add column wifi_senha text check (wifi_senha is null or char_length(wifi_senha) <= 100),
  add column codigo_porta text check (codigo_porta is null or char_length(codigo_porta) <= 50),
  add column regras_casa text check (regras_casa is null or char_length(regras_casa) <= 1000);
