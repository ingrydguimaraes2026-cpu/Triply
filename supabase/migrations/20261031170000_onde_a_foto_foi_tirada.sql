-- Spec 108 (K4): onde a foto foi tirada. Só quando a pessoa marca "mostrar no mapa" ao postar.
--
-- O que muda:
-- - `fotos.latitude` e `fotos.longitude` (opcionais). Quem lê é quem já lê a foto (comboio).
--
-- Pra desfazer:
--   alter table public.fotos drop column latitude, drop column longitude;

alter table public.fotos
  add column latitude double precision check (latitude is null or latitude between -90 and 90),
  add column longitude double precision check (longitude is null or longitude between -180 and 180),
  add constraint fotos_ponto_completo check ((latitude is null) = (longitude is null));
