-- Spec 111: exigências de entrada automáticas (passaporte × destino), atualizadas toda semana.
--
-- O que esta migration faz:
-- 1. `exigencias_de_entrada`: o que o passaporte X precisa pra entrar no país Y, por fonte
--    ('wikipedia' pro passaporte brasileiro, 'passport-index' pra todos). Quem está logado lê.
-- 2. `fontes_de_exigencias`: quando cada fonte foi lida, de quando são os dados e o último erro.
-- 3. `alertas_de_exigencias`: quando as fontes discordam entre si ou da tabela escrita à mão
--    (spec 010). Ninguém do app lê: o Victor confere por SQL.
-- 4. `public.trocar_exigencias(...)`: troca os dados de uma fonte numa tacada só (apaga + grava
--    na mesma transação). Só o servidor (service_role) chama, pela função "atualizar-exigencias".
--
-- O agendamento (pg_cron chamando a função toda segunda 6h UTC) fica fora da migration, igual
-- aos outros jobs: ver docs/specs/111-exigencias-automaticas.md.
--
-- Pra desfazer:
--   drop function public.trocar_exigencias(text, jsonb, date);
--   drop table public.alertas_de_exigencias;
--   drop table public.fontes_de_exigencias;
--   drop table public.exigencias_de_entrada;

create table public.exigencias_de_entrada (
  passaporte char(2) not null, -- ISO-2 do passaporte (ex.: 'BR')
  destino char(2) not null, -- ISO-2 do país de destino
  fonte text not null check (fonte in ('wikipedia', 'passport-index')),
  -- livre (circulação livre/RG), isento, na_chegada (visto na chegada), eta, evisa, visto, proibido
  tipo text not null check (tipo in ('livre', 'isento', 'na_chegada', 'eta', 'evisa', 'visto', 'proibido')),
  dias smallint check (dias > 0), -- quantos dias pode ficar, quando a fonte diz
  primary key (passaporte, destino, fonte)
);

-- A busca do app é "meus passaportes nestes destinos": a chave primária já começa por passaporte
alter table public.exigencias_de_entrada enable row level security;
create policy "logado lê as exigências" on public.exigencias_de_entrada
  for select to authenticated using (true);

create table public.fontes_de_exigencias (
  fonte text primary key check (fonte in ('wikipedia', 'passport-index')),
  lido_em timestamptz, -- última leitura que deu certo
  dados_de date, -- de quando são os dados (o que a fonte diz)
  linhas integer,
  erro text, -- último erro (null = a última tentativa deu certo)
  tentado_em timestamptz
);

alter table public.fontes_de_exigencias enable row level security;
create policy "logado lê as fontes" on public.fontes_de_exigencias
  for select to authenticated using (true);

create table public.alertas_de_exigencias (
  id bigint generated always as identity primary key,
  passaporte char(2) not null,
  destino char(2) not null,
  motivo text not null, -- ex.: 'wikipedia x passport-index', 'wikipedia x tabela do app'
  esperado text not null,
  encontrado text not null,
  criado_em timestamptz not null default now(),
  resolvido boolean not null default false
);

-- O mesmo alerta não repete toda semana enquanto ninguém resolver
create unique index alertas_de_exigencias_abertos
  on public.alertas_de_exigencias (passaporte, destino, motivo, encontrado)
  where not resolvido;

-- Sem policies: ninguém do app lê nem grava (só o servidor)
alter table public.alertas_de_exigencias enable row level security;

-- Troca tudo de uma fonte: p_dados = [{"passaporte":"BR","destino":"TH","tipo":"isento","dias":90}, ...]
create function public.trocar_exigencias(p_fonte text, p_dados jsonb, p_dados_de date)
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_linhas integer;
begin
  delete from public.exigencias_de_entrada where fonte = p_fonte;
  insert into public.exigencias_de_entrada (passaporte, destino, fonte, tipo, dias)
  select upper(d.passaporte), upper(d.destino), p_fonte, d.tipo, d.dias
  from jsonb_to_recordset(p_dados) as d(passaporte text, destino text, tipo text, dias smallint)
  on conflict do nothing;
  get diagnostics v_linhas = row_count;

  insert into public.fontes_de_exigencias (fonte, lido_em, dados_de, linhas, erro, tentado_em)
  values (p_fonte, now(), p_dados_de, v_linhas, null, now())
  on conflict (fonte) do update
    set lido_em = excluded.lido_em, dados_de = excluded.dados_de, linhas = excluded.linhas, erro = null, tentado_em = excluded.tentado_em;
  return v_linhas;
end;
$$;

revoke execute on function public.trocar_exigencias(text, jsonb, date) from public, anon, authenticated;
grant execute on function public.trocar_exigencias(text, jsonb, date) to service_role;
