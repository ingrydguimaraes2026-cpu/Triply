-- Spec 038: nacionalidade e validade do passaporte (I2 + I3).
--
-- Regra que não muda (spec 010): NUNCA guardar número nem foto de documento. Aqui só:
--   - os países do(s) passaporte(s) da pessoa (código ISO, ex.: {BR, IT}) e
--   - a data de validade do passaporte principal.
--
-- O que esta migration faz:
-- 1. Tabela `documentos_pessoais`: uma linha por pessoa. Só a própria pessoa vê e mexe (RLS).
-- 2. Função `alertas_de_passaporte(viagem)`: pra quem é do comboio, devolve QUEM está com o passaporte
--    vencendo antes de 6 meses depois da volta (ou sem validade informada), SEM mostrar a data.
--    Assim o ADM sabe quem precisa renovar sem ver dado pessoal dos outros.
--
-- Pra desfazer:
--   drop function public.alertas_de_passaporte(uuid);
--   drop table public.documentos_pessoais;

create table public.documentos_pessoais (
  usuario_id uuid primary key default auth.uid() references public.perfis (id) on delete cascade,
  nacionalidades text[] not null default '{}'
    check (cardinality(nacionalidades) <= 3 and array_to_string(nacionalidades, ',') ~ '^([A-Z]{2}(,[A-Z]{2})*)?$'),
  passaporte_validade date check (passaporte_validade between date '2000-01-01' and date '2100-12-31'),
  atualizado_em timestamptz not null default now()
);

alter table public.documentos_pessoais enable row level security;

create policy "cada um vê os próprios documentos" on public.documentos_pessoais
  for select to authenticated using (usuario_id = (select auth.uid()));
create policy "cada um cria os próprios documentos" on public.documentos_pessoais
  for insert to authenticated with check (usuario_id = (select auth.uid()));
create policy "cada um muda os próprios documentos" on public.documentos_pessoais
  for update to authenticated using (usuario_id = (select auth.uid())) with check (usuario_id = (select auth.uid()));
create policy "cada um apaga os próprios documentos" on public.documentos_pessoais
  for delete to authenticated using (usuario_id = (select auth.uid()));

grant select, insert, update, delete on public.documentos_pessoais to authenticated;

-- situacao: 'vence' (vence antes de volta + 6 meses) ou 'sem_data' (não informou)
create function public.alertas_de_passaporte(p_viagem uuid)
returns table (usuario_id uuid, situacao text)
language sql
stable
security definer
set search_path = ''
as $$
  select m.usuario_id,
    case when d.passaporte_validade is null then 'sem_data' else 'vence' end
  from public.comboio_membros m
  join public.viagens v on v.id = m.viagem_id
  left join public.documentos_pessoais d on d.usuario_id = m.usuario_id
  where m.viagem_id = p_viagem
    -- só quem é do comboio pergunta
    and exists (select 1 from public.comboio_membros eu where eu.viagem_id = p_viagem and eu.usuario_id = (select auth.uid()))
    and (
      d.passaporte_validade is null
      or d.passaporte_validade < (coalesce(v.data_fim, v.data_inicio, current_date) + interval '6 months')::date
    );
$$;

revoke execute on function public.alertas_de_passaporte(uuid) from public, anon;
grant execute on function public.alertas_de_passaporte(uuid) to authenticated;
