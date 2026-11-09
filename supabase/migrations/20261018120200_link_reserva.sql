-- Spec 004: transportes.
--
-- O que esta migration faz: coluna nova (opcional) `trajetos.link_reserva`, pro link da passagem/reserva.
-- As regras de acesso continuam as mesmas (comboio vê, ADM edita).
--
-- Pra desfazer: alter table public.trajetos drop column link_reserva;

alter table public.trajetos
  add column link_reserva text check (link_reserva is null or (char_length(link_reserva) <= 500 and link_reserva ~* '^https?://'));
