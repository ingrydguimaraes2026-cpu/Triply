-- Spec 041: prazo de cancelamento grátis da hospedagem (E10).
--
-- O que esta migration faz:
-- 1. `hospedagens.cancelamento_gratis_ate` (data): até quando dá pra cancelar sem pagar.
-- 2. Lembrete no celular (spec 032) 2 dias antes desse prazo, só pra hospedagem ESCOLHIDA:
--    - `lembretes_enviados.tipo` passa a aceitar 'cancelamento';
--    - `lembretes_a_enviar` é recriada com esse terceiro tipo (trajeto e ponto continuam iguais).
--
-- Pra desfazer:
--   recriar lembretes_a_enviar como na 20261030010000_lembretes.sql;
--   alter table public.lembretes_enviados drop constraint lembretes_enviados_tipo_check,
--     add constraint lembretes_enviados_tipo_check check (tipo in ('trajeto', 'ponto'));
--   alter table public.hospedagens drop column cancelamento_gratis_ate;

alter table public.hospedagens
  add column cancelamento_gratis_ate date check (cancelamento_gratis_ate between date '2000-01-01' and date '2100-12-31');

alter table public.lembretes_enviados drop constraint lembretes_enviados_tipo_check;
alter table public.lembretes_enviados
  add constraint lembretes_enviados_tipo_check check (tipo in ('trajeto', 'ponto', 'cancelamento'));

create or replace function public.lembretes_a_enviar(p_antecedencia interval default interval '60 minutes')
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
    union all
    -- Cancelamento grátis: avisa a partir de 2 dias antes do prazo (uma vez por prazo)
    select 'cancelamento', h.id, h.viagem_id, h.nome, h.cancelamento_gratis_ate::timestamptz, null
    from public.hospedagens h
    where h.escolhida
      and h.cancelamento_gratis_ate is not null
      and h.cancelamento_gratis_ate >= current_date
      and h.cancelamento_gratis_ate <= current_date + 2
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
