-- Spec 015 (ajuste): guardar o refresh token do Gmail direto na tabela do schema `privado`,
-- em vez de um id de segredo do Vault. O schema `privado` não é exposto pela API, então o
-- token nunca chega ao navegador; só a Edge Function (service role) lê. Mais simples que o
-- Vault e já seguro pro nosso caso. (Dá pra endurecer com Vault depois, se quiser.)
--
-- Pra desfazer:
--   alter table privado.gmail_contas drop column refresh_token, add column token_secret_id uuid;

alter table privado.gmail_contas
  drop column token_secret_id,
  add column refresh_token text;
