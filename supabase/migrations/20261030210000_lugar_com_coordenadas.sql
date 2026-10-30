-- Spec 064: buscar lugar com autocompletar (C4). Ao escolher uma sugestão, o lugar guarda onde fica.
--
-- O que esta migration faz (só acrescenta):
-- 1. `lugares.latitude`, `lugares.longitude` (opcionais) e `lugares.endereco` (texto curto da sugestão).
-- RLS da tabela continua igual.
--
-- Pra desfazer:
--   alter table public.lugares drop column latitude, drop column longitude, drop column endereco;

alter table public.lugares
  add column latitude double precision check (latitude is null or latitude between -90 and 90),
  add column longitude double precision check (longitude is null or longitude between -180 and 180),
  add column endereco text check (endereco is null or char_length(endereco) <= 200),
  add constraint lugares_coordenadas_juntas check ((latitude is null) = (longitude is null));
