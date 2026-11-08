-- Spec 118d: "Há 1 ano vocês estavam em Floripa". No aniversário de um carimbo, o celular avisa
-- (entre 10h e 21h de Brasília) e no máximo 1 aviso de lembrança por pessoa por dia.
--
-- 1. Preferência de aviso ganha o tipo 'lembrancas' (dá pra desligar no Perfil).
-- 2. Tabela `avisos_de_lembranca`: quem já recebeu a lembrança no dia (a trava do 1 por dia).
-- 3. Função `lembrancas_a_avisar()`: a função "lembretes" (service role, a cada 5 min) chama, recebe
--    uma lembrança por pessoa (a mais recente: 1 ano antes de 2 anos) e já marca o dia como avisado.
--    29/02 lembra em 28/02 quando o ano não é bissexto. Viagem antiga (só o mês) lembra no dia 1.
--
-- Pra desfazer:
--   drop function public.lembrancas_a_avisar();
--   drop table public.avisos_de_lembranca;
--   alter table public.preferencias_aviso drop constraint preferencias_aviso_tipo_check;
--   alter table public.preferencias_aviso add constraint preferencias_aviso_tipo_check check (tipo in ('lembretes', 'fotos', 'resumo'));

alter table public.preferencias_aviso drop constraint preferencias_aviso_tipo_check;
alter table public.preferencias_aviso add constraint preferencias_aviso_tipo_check
  check (tipo in ('lembretes', 'fotos', 'resumo', 'lembrancas'));

create table public.avisos_de_lembranca (
  usuario_id uuid not null references public.perfis (id) on delete cascade,
  dia date not null,
  viagem_id uuid references public.viagens (id) on delete set null,
  enviado_em timestamptz not null default now(),
  primary key (usuario_id, dia)
);
create index on public.avisos_de_lembranca (viagem_id);

-- Só a função do servidor mexe aqui (RLS ligada e sem política = ninguém do app lê nem grava)
alter table public.avisos_de_lembranca enable row level security;

create function public.lembrancas_a_avisar()
returns table (usuario_id uuid, viagem_id uuid, data date, anos int, lugares text[], so_o_mes boolean, sozinho boolean)
language sql
security definer
set search_path = ''
as $$
  with agora as (
    select (now() at time zone 'America/Sao_Paulo') as local
  ),
  hoje as (
    select a.local::date as dia,
           (make_date(extract(year from a.local)::int, 3, 1) - 1) as fim_de_fevereiro
    from agora a
    where extract(hour from a.local) between 10 and 20
  ),
  -- Carimbos que fazem aniversário hoje, agrupados por viagem e dia
  aniversarios as (
    select c.viagem_id, c.data,
           (extract(year from h.dia) - extract(year from c.data))::int as anos,
           array_agg(c.nome order by c.liberado_em) as lugares,
           v.tipo = 'antiga' as so_o_mes
    from public.carimbos c
    join public.viagens v on v.id = c.viagem_id
    cross join hoje h
    where c.data < make_date(extract(year from h.dia)::int, 1, 1)
      and (to_char(c.data, 'MM-DD') = to_char(h.dia, 'MM-DD')
           or (to_char(c.data, 'MM-DD') = '02-29' and h.dia = h.fim_de_fevereiro and extract(day from h.fim_de_fevereiro) = 28))
    group by c.viagem_id, c.data, h.dia, v.tipo
  ),
  -- Uma por pessoa: a mais recente; quem desligou "lembranças" ou já recebeu hoje fica de fora
  escolhidas as (
    select distinct on (m.usuario_id)
           m.usuario_id, a.viagem_id, a.data, a.anos, a.lugares, a.so_o_mes,
           (select count(*) from public.comboio_membros m2 where m2.viagem_id = a.viagem_id) = 1 as sozinho
    from aniversarios a
    join public.comboio_membros m on m.viagem_id = a.viagem_id
    cross join hoje h
    where not exists (select 1 from public.preferencias_aviso p where p.usuario_id = m.usuario_id and p.tipo = 'lembrancas' and not p.ligado)
      and not exists (select 1 from public.avisos_de_lembranca l where l.usuario_id = m.usuario_id and l.dia = h.dia)
    order by m.usuario_id, a.anos, cardinality(a.lugares) desc
  ),
  marcadas as (
    insert into public.avisos_de_lembranca (usuario_id, dia, viagem_id)
    select e.usuario_id, h.dia, e.viagem_id from escolhidas e cross join hoje h
    on conflict do nothing
    returning usuario_id
  )
  select e.usuario_id, e.viagem_id, e.data, e.anos, e.lugares, e.so_o_mes, e.sozinho
  from marcadas mk
  join escolhidas e on e.usuario_id = mk.usuario_id;
$$;

revoke execute on function public.lembrancas_a_avisar() from public, anon, authenticated;
grant execute on function public.lembrancas_a_avisar() to service_role;
