-- Spec 122a: deslocamentos no dia.
--
-- O que esta migration faz (só acrescenta, não apaga nada):
-- 1. `trajetos.de_texto` / `para_texto`: de onde e pra onde em texto livre ("Varenna", "Villa del Balbianello").
--    Assim um deslocamento não precisa ser entre dois destinos do roteiro. Coordenadas opcionais.
--    Os trajetos antigos ganham o nome do destino nesses campos (backfill).
-- 2. Opções pra comparar (122c): `grupo_opcoes` junta as opções do mesmo deslocamento; `escolhida` marca a que vale.
-- 3. Dados que pesam na decisão: `trocas`, `frequencia_min` (passa de quanto em quanto tempo) e `ultimo_do_dia`.
-- 4. Situação ganha 'decidido' (ex.: balsa que se compra no cais). Fica: sugestao (pra decidir), decidido, reservado, comprado.
-- 5. Meio ganha 'metro'.
-- As regras de acesso (RLS) não mudam.
--
-- Pra desfazer:
--   alter table public.trajetos drop column de_texto, drop column para_texto, drop column de_lat, drop column de_lon,
--     drop column para_lat, drop column para_lon, drop column grupo_opcoes, drop column escolhida,
--     drop column trocas, drop column frequencia_min, drop column ultimo_do_dia;
--   e recriar trajetos_situacao_check e trajetos_meio_check sem 'decidido' e 'metro'.

alter table public.trajetos
  add column de_texto text check (de_texto is null or char_length(trim(de_texto)) between 1 and 120),
  add column para_texto text check (para_texto is null or char_length(trim(para_texto)) between 1 and 120),
  add column de_lat double precision check (de_lat is null or de_lat between -90 and 90),
  add column de_lon double precision check (de_lon is null or de_lon between -180 and 180),
  add column para_lat double precision check (para_lat is null or para_lat between -90 and 90),
  add column para_lon double precision check (para_lon is null or para_lon between -180 and 180),
  add column grupo_opcoes uuid,
  add column escolhida boolean not null default true,
  add column trocas smallint check (trocas is null or trocas between 0 and 9),
  add column frequencia_min smallint check (frequencia_min is null or frequencia_min between 1 and 1440),
  add column ultimo_do_dia boolean not null default false;

create index on public.trajetos (grupo_opcoes) where grupo_opcoes is not null;

alter table public.trajetos drop constraint trajetos_situacao_check;
alter table public.trajetos add constraint trajetos_situacao_check
  check (situacao in ('sugestao', 'decidido', 'reservado', 'comprado'));

alter table public.trajetos drop constraint trajetos_meio_check;
alter table public.trajetos add constraint trajetos_meio_check
  check (meio in ('trem', 'onibus', 'metro', 'aviao', 'carro', 'carona', 'barco', 'a_pe', 'outro'));

-- Backfill: trajetos antigos ganham o nome (e as coordenadas) dos destinos
update public.trajetos t
set de_texto = d.nome, de_lat = d.latitude, de_lon = d.longitude
from public.destinos d
where d.id = t.origem_id and t.de_texto is null;

update public.trajetos t
set para_texto = d.nome, para_lat = d.latitude, para_lon = d.longitude
from public.destinos d
where d.id = t.destino_id and t.para_texto is null;
