-- Spec 107 (F8): localização ao vivo temporária, só pro comboio.
--
-- O que muda:
-- - Tabela `localizacoes_ao_vivo`: a última posição de cada pessoa que escolheu compartilhar,
--   com hora pra acabar (`ate`, no máximo 8 horas pra frente).
-- - Passou do `ate`: ninguém vê mais (regra do banco) e a limpeza apaga.
-- - `privado.limpar_localizacoes()`: apaga as vencidas (rodar a cada 15 min no pg_cron).
--
-- Quem pode:
-- - ver: quem está no comboio, só enquanto não venceu;
-- - gravar/mudar/apagar: só a própria posição, e só quem está no comboio.
--
-- Agendamento (depois de aplicar):
--   select cron.schedule('limpar-localizacoes', '*/15 * * * *', 'select privado.limpar_localizacoes()');
--
-- Pra desfazer:
--   select cron.unschedule('limpar-localizacoes');
--   drop table public.localizacoes_ao_vivo;
--   drop function privado.limpar_localizacoes();
--   drop function privado.conferir_localizacao();

create table public.localizacoes_ao_vivo (
  viagem_id uuid not null references public.viagens (id) on delete cascade,
  usuario_id uuid not null default auth.uid() references public.perfis (id) on delete cascade,
  latitude double precision not null check (latitude between -90 and 90),
  longitude double precision not null check (longitude between -180 and 180),
  precisao_m int check (precisao_m is null or precisao_m >= 0),
  atualizado_em timestamptz not null default now(),
  ate timestamptz not null,
  primary key (viagem_id, usuario_id)
);

create index on public.localizacoes_ao_vivo (usuario_id);
create index on public.localizacoes_ao_vivo (ate);

alter table public.localizacoes_ao_vivo enable row level security;

create policy "localização: comboio vê enquanto vale" on public.localizacoes_ao_vivo for select to authenticated
using (ate > now() and privado.e_membro(viagem_id));

create policy "localização: gravar a minha" on public.localizacoes_ao_vivo for insert to authenticated
with check (usuario_id = (select auth.uid()) and privado.e_membro(viagem_id));

create policy "localização: mudar a minha" on public.localizacoes_ao_vivo for update to authenticated
using (usuario_id = (select auth.uid()))
with check (usuario_id = (select auth.uid()) and privado.e_membro(viagem_id));

create policy "localização: parar a minha" on public.localizacoes_ao_vivo for delete to authenticated
using (usuario_id = (select auth.uid()));

-- No máximo 8 horas de compartilhamento, e a hora do servidor manda
create function privado.conferir_localizacao()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.atualizado_em := now();
  if new.ate <= now() or new.ate > now() + interval '8 hours' then
    raise exception 'Compartilhe por até 8 horas.' using errcode = '23514';
  end if;
  return new;
end;
$$;

revoke execute on function privado.conferir_localizacao() from public, anon, authenticated;

create trigger conferir_localizacao before insert or update on public.localizacoes_ao_vivo
for each row execute function privado.conferir_localizacao();

create function privado.limpar_localizacoes()
returns void
language sql
security definer
set search_path = ''
as $$
  delete from public.localizacoes_ao_vivo where ate <= now();
$$;

revoke execute on function privado.limpar_localizacoes() from public, anon, authenticated;
