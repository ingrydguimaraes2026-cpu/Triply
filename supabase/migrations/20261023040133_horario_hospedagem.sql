-- Spec 011 (atualização de 23/10/2026): horário de check-in e check-out da hospedagem.
--
-- O que esta migration faz: duas colunas novas e opcionais em `hospedagens`:
-- `hora_checkin` e `hora_checkout` (ex.: check-in a partir das 15h, check-out até as 10h).
-- Serve pra planejar a chegada tarde (Tirano ~22h) e a saída cedo (trem 9h).
-- As opções que já existem ficam com os horários vazios. Regras de acesso não mudam.
--
-- Pra desfazer:
--   alter table public.hospedagens drop column hora_checkin, drop column hora_checkout;

alter table public.hospedagens
  add column hora_checkin time,
  add column hora_checkout time;
