-- Lista de espera do Tripwave (página pública /espera, docs/marketing/ESTRATEGIA-REDES.md).
-- Qualquer pessoa, mesmo sem login, pode deixar o e-mail. Ninguém lê pelo app:
-- a lista só aparece no painel do Supabase (Table Editor), pra quem é dono do projeto.

create table public.lista_espera (
  id uuid primary key default gen_random_uuid(),
  email text not null
    check (length(email) <= 254 and email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
  -- De onde a pessoa veio (?origem=tiktok, x, instagram, amigo...). Serve pra saber qual rede traz mais gente.
  origem text check (origem is null or length(origem) <= 40),
  criado_em timestamptz not null default now()
);

-- O mesmo e-mail não entra duas vezes (maiúscula e minúscula contam igual)
create unique index lista_espera_email_unico on public.lista_espera (lower(email));

alter table public.lista_espera enable row level security;

-- Só pode INSERIR. Sem política de leitura, ninguém consegue ver a lista pelo site.
create policy "qualquer pessoa entra na lista de espera"
  on public.lista_espera
  for insert
  to anon, authenticated
  with check (true);

grant insert on table public.lista_espera to anon, authenticated;
