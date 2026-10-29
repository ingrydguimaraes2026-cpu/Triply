-- Hospedagem: horário-limite de check-in e self check-in.
--
-- Esta migration já estava aplicada no Supabase (projeto ltygqabtdbphtjscvuit) mas o
-- arquivo não tinha ido pro repositório (drift). Puxada do banco em 29/10/2026 pra
-- repo e remoto baterem de novo. Só adiciona colunas em `hospedagens` (aditiva).

alter table public.hospedagens
  add column hora_checkin_limite time,
  add column self_checkin boolean not null default false;
