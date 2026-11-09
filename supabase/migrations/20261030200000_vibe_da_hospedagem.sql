-- Spec 063: vibe e etiquetas da opção de hospedagem (E11, ideia do Hostelworld).
--
-- O que esta migration faz (só acrescenta):
-- 1. `hospedagens.etiquetas`: até 4 de uma lista fixa (social, tranquilo, seguro, bem localizado,
--    cozinha, família, barato).
-- 2. `hospedagens.nota`: a nota do site (0 a 10, uma casa decimal).
-- RLS da tabela continua igual.
--
-- Pra desfazer:
--   alter table public.hospedagens drop column etiquetas, drop column nota;

alter table public.hospedagens
  add column etiquetas text[] not null default '{}'
    check (cardinality(etiquetas) <= 4 and etiquetas <@ array['social', 'tranquilo', 'seguro', 'bem_localizado', 'cozinha', 'familia', 'barato']),
  add column nota numeric(3, 1) check (nota between 0 and 10);
