-- Spec 032: lembretes no celular (push) 1 hora antes de trajetos e do ponto de encontro.
--
-- O que esta migration faz:
-- 1. Tabela `lembretes_enviados`: o que já foi lembrado (tipo + item + horário). Garante que
--    cada lembrete sai uma vez só, mesmo que a função rode de novo. Se o horário mudar, lembra de novo.
-- 2. Função `public.lembretes_a_enviar()`: devolve os lembretes que vencem agora (partida/encontro
--    nos próximos 60 min) E já marca como enviados, numa tacada só. Só o servidor (service_role) chama.
--
-- O agendamento (pg_cron chamando a função "lembretes" a cada 5 min) fica fora da migration, igual
-- aos outros jobs (boletim-cambio, ler-carteiras): ver docs/specs/032-lembretes.md.
--
-- Pra desfazer:
--   drop function public.lembretes_a_enviar(interval);
--   drop table public.lembretes_enviados;

create table public.lembretes_enviados (
  tipo text not null check (tipo in ('trajeto', 'ponto')),
  alvo_id uuid not null,
  horario timestamptz not null, -- o horário lembrado
  enviado_em timestamptz not null default now(),
  primary key (tipo, alvo_id, horario)
);

-- Sem policies: ninguém do app lê nem grava (só a função abaixo, como dona da tabela)
alter table public.lembretes_enviados enable row level security;

create function public.lembretes_a_enviar(p_antecedencia interval default interval '60 minutes')
returns table (tipo text, alvo_id uuid, viagem_id uuid, titulo text, horario timestamptz, meio text)
language sql
security definer
set search_path = ''
as $$
  with candidatos as (
    select 'trajeto'::text as tipo, t.id as alvo_id, t.viagem_id,
      coalesce(o.nome, '?') || ' → ' || coalesce(d.nome, '?') as titulo, t.partida as horario, t.meio
    from public.trajetos t
    left join public.destinos o on o.id = t.origem_id
    left join public.destinos d on d.id = t.destino_id
    where t.partida > now() and t.partida <= now() + p_antecedencia
    union all
    select 'ponto', p.id, p.viagem_id, p.local, p.quando, null
    from public.pontos_de_encontro p
    where p.quando > now() and p.quando <= now() + p_antecedencia
  ),
  novos as (
    insert into public.lembretes_enviados (tipo, alvo_id, horario)
    select c.tipo, c.alvo_id, c.horario from candidatos c
    on conflict do nothing
    returning lembretes_enviados.tipo, lembretes_enviados.alvo_id, lembretes_enviados.horario
  )
  select c.tipo, c.alvo_id, c.viagem_id, c.titulo, c.horario, c.meio
  from candidatos c
  join novos n on n.tipo = c.tipo and n.alvo_id = c.alvo_id and n.horario = c.horario;
$$;

revoke execute on function public.lembretes_a_enviar(interval) from public, anon, authenticated;
