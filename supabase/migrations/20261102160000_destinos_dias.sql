-- Vários destinos (spec 115, etapa 7): quantos dias a viagem passa em cada destino quando ainda não tem datas.
-- Quando o destino ganha chegada e saída, as datas valem mais que este número.
-- Só adiciona uma coluna: as regras de acesso de destinos (RLS) continuam as mesmas.

alter table public.destinos
  add column dias smallint check (dias between 1 and 60);

comment on column public.destinos.dias is 'Dias planejados no destino (sem datas ainda). Spec 115.';
