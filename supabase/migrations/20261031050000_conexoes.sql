-- Spec 074: conexões e estações (D8). Um trajeto pode ter escalas (troca de avião/trem) e o
-- terminal/estação de partida e chegada.
--
-- O que esta migration faz (só acrescenta):
-- 1. `trajetos.estacao_partida`, `trajetos.estacao_chegada`: "Terminal 2", "Milano Centrale".
-- 2. `trajetos.escalas`: lista (até 4) de { local, chegada, partida } em JSON, com horário ISO.
-- RLS de trajetos continua igual (o ADM edita).
--
-- Pra desfazer:
--   alter table public.trajetos drop column estacao_partida, drop column estacao_chegada, drop column escalas;

alter table public.trajetos
  add column estacao_partida text check (estacao_partida is null or char_length(trim(estacao_partida)) between 1 and 80),
  add column estacao_chegada text check (estacao_chegada is null or char_length(trim(estacao_chegada)) between 1 and 80),
  add column escalas jsonb not null default '[]'::jsonb
    check (jsonb_typeof(escalas) = 'array' and jsonb_array_length(escalas) <= 4);
