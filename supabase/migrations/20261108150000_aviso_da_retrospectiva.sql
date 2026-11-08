-- Spec 118c: aviso no celular "a retrospectiva de Floripa está pronta", uma vez por viagem,
-- no dia seguinte ao fim da viagem (entre 10h e 21h de Brasília, pra não acordar ninguém).
--
-- 1. Tabela `avisos_de_retrospectiva`: viagens que já tiveram o aviso (uma linha por viagem).
-- 2. Função `retrospectivas_a_avisar()`: a função "lembretes" (service role, a cada 5 min) chama,
--    recebe as viagens que acabaram há até 2 dias e ainda não foram avisadas, e já marca como avisadas.
--    Viagem que acabou há mais tempo não recebe (assim, ao ligar, não sai aviso de viagem antiga).
--
-- Pra desfazer:
--   drop function public.retrospectivas_a_avisar();
--   drop table public.avisos_de_retrospectiva;

create table public.avisos_de_retrospectiva (
  viagem_id uuid primary key references public.viagens (id) on delete cascade,
  enviado_em timestamptz not null default now()
);

-- Só a função do servidor mexe aqui (RLS ligada e sem política = ninguém do app lê nem grava)
alter table public.avisos_de_retrospectiva enable row level security;

create function public.retrospectivas_a_avisar()
returns table (viagem_id uuid, nome text)
language sql
security definer
set search_path = ''
as $$
  with agora as (
    select (now() at time zone 'America/Sao_Paulo') as local
  ),
  prontas as (
    select v.id, v.nome
    from public.viagens v, agora a
    where extract(hour from a.local) between 10 and 20
      and v.data_fim is not null
      and v.data_fim < a.local::date
      and v.data_fim >= a.local::date - 2
      and not exists (select 1 from public.avisos_de_retrospectiva r where r.viagem_id = v.id)
  ),
  marcadas as (
    insert into public.avisos_de_retrospectiva (viagem_id)
    select id from prontas
    on conflict do nothing
    returning viagem_id
  )
  select m.viagem_id, p.nome
  from marcadas m
  join prontas p on p.id = m.viagem_id;
$$;

revoke execute on function public.retrospectivas_a_avisar() from public, anon, authenticated;
grant execute on function public.retrospectivas_a_avisar() to service_role;
