-- Spec 013 (revisão): boletim do câmbio 2x por dia (12h e 20h), sem precisar de meta.
--
-- O que esta migration faz:
-- 1. A meta em `metas_cambio` vira OPCIONAL: a linha agora quer dizer "quero receber o boletim desta moeda
--    nesta viagem". Se a pessoa também puser uma meta, chega o aviso extra de "bateu a meta".
-- 2. `ultimo_valor`: a cotação (com IOF) mandada no último boletim, pra dizer "subiu/caiu R$ X desde o último aviso".
-- 3. `boletim_em`: quando foi o último boletim.
--
-- Não apaga nem muda dado nenhum: quem já tinha meta continua com ela.
-- Regras de acesso (RLS) continuam as mesmas: cada um só vê e mexe na própria linha.
--
-- Pra desfazer (só funciona se ninguém tiver linha sem meta):
--   alter table public.metas_cambio drop column boletim_em, drop column ultimo_valor;
--   alter table public.metas_cambio alter column meta set not null;

alter table public.metas_cambio alter column meta drop not null;

alter table public.metas_cambio
  add column ultimo_valor numeric(10, 4) check (ultimo_valor > 0 and ultimo_valor < 1000),
  add column boletim_em timestamptz;
