-- Spec 087 (M8): histórico (quem editou/apagou o quê) e lixeira de 30 dias.
--
-- O que muda:
-- 1. Tabela `historico_viagem`: um registro quando alguém EDITA ou APAGA um gasto, lugar,
--    trajeto ou evento da agenda. (Criar já fica em `atividades_viagem`, spec 031.)
--    Quando apaga, guarda uma cópia da linha em `antes` (no gasto, junto com a divisão).
--    Várias edições seguidas da mesma pessoa no mesmo item (10 min) viram um registro só.
-- 2. `public.restaurar_da_lixeira(id)`: põe de volta o que foi apagado há até 30 dias.
--    Se o destino ligado ao item não existe mais, o item volta sem destino.
-- 3. `privado.limpar_historico()`: apaga o que tem mais de 30 dias (rodar 1x por dia no pg_cron).
--
-- Privacidade: gasto pessoal fica no histórico só pra quem lançou (`privado_de`).
--
-- Quem pode:
-- - ver: quem está no comboio (gasto pessoal: só o dono);
-- - restaurar: quem apagou ou o ADM (gasto pessoal: só o dono);
-- - ninguém escreve no histórico na mão (só os gatilhos e a função de restaurar).
--
-- Agendamento (fazer no painel do Supabase, depois de aplicar):
--   select cron.schedule('limpar-historico', '17 4 * * *', 'select privado.limpar_historico()');
--
-- Pra desfazer:
--   select cron.unschedule('limpar-historico');
--   drop trigger historico_editou on public.gastos; (idem lugares, trajetos, eventos_agenda)
--   drop trigger historico_apagou on public.gastos; (idem)
--   drop function public.restaurar_da_lixeira(uuid);
--   drop function privado.limpar_historico();
--   drop function privado.registrar_historico();
--   drop table public.historico_viagem;

create table public.historico_viagem (
  id uuid primary key default gen_random_uuid(),
  viagem_id uuid not null references public.viagens (id) on delete cascade,
  tabela text not null check (tabela in ('gastos', 'lugares', 'trajetos', 'eventos_agenda')),
  linha_id uuid not null,
  acao text not null check (acao in ('editou', 'apagou', 'restaurou')),
  autor uuid references public.perfis (id) on delete set null,
  titulo text check (char_length(titulo) <= 200),
  antes jsonb, -- só quando apagou: a cópia pra restaurar
  privado_de uuid references public.perfis (id) on delete cascade, -- gasto pessoal: só o dono vê
  restaurado_em timestamptz,
  criado_em timestamptz not null default now()
);

create index on public.historico_viagem (viagem_id, criado_em desc);
create index on public.historico_viagem (linha_id);
create index on public.historico_viagem (autor);
create index on public.historico_viagem (privado_de);

alter table public.historico_viagem enable row level security;

create policy "historico: comboio vê" on public.historico_viagem for select to authenticated
using (
  privado.e_membro(viagem_id)
  and (privado_de is null or privado_de = (select auth.uid()))
);

-- Grava o histórico. security definer: o app não escreve nesta tabela.
create function privado.registrar_historico()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_linha jsonb := to_jsonb(coalesce(old, new));
  v_viagem uuid := (v_linha ->> 'viagem_id')::uuid;
  v_titulo text;
  v_privado uuid;
  v_antes jsonb;
  v_quem uuid := (select auth.uid());
begin
  -- Apagando a viagem inteira (cascata): não registra nada
  if not exists (select 1 from public.viagens v where v.id = v_viagem) then
    return coalesce(old, new);
  end if;

  case tg_table_name
    when 'gastos' then
      v_titulo := v_linha ->> 'descricao';
      if (v_linha ->> 'pessoal')::boolean then
        v_privado := (v_linha ->> 'criado_por')::uuid;
      end if;
    when 'lugares' then
      v_titulo := v_linha ->> 'nome';
    when 'eventos_agenda' then
      v_titulo := v_linha ->> 'titulo';
    when 'trajetos' then
      v_titulo := coalesce((select d.nome from public.destinos d where d.id = (v_linha ->> 'origem_id')::uuid), '?')
        || ' → ' || coalesce((select d.nome from public.destinos d where d.id = (v_linha ->> 'destino_id')::uuid), '?');
    else
      return coalesce(old, new);
  end case;

  if tg_op = 'DELETE' then
    v_antes := v_linha;
    if tg_table_name = 'gastos' then
      -- Gatilho BEFORE: a divisão ainda existe aqui (a cascata vem depois)
      v_antes := v_antes || jsonb_build_object('divisoes', coalesce(
        (select jsonb_agg(to_jsonb(d)) from public.gasto_divisoes d where d.gasto_id = old.id), '[]'::jsonb));
    end if;
    insert into public.historico_viagem (viagem_id, tabela, linha_id, acao, autor, titulo, antes, privado_de)
    values (v_viagem, tg_table_name, old.id, 'apagou', v_quem, left(v_titulo, 200), v_antes, v_privado);
    return old;
  end if;

  -- UPDATE: só registra se mudou alguma coisa
  if to_jsonb(old) = to_jsonb(new) then
    return null;
  end if;
  -- Mesma pessoa editando o mesmo item há menos de 10 min: só atualiza a hora
  update public.historico_viagem h
  set criado_em = now(), titulo = left(v_titulo, 200), privado_de = v_privado
  where h.linha_id = new.id and h.acao = 'editou' and h.autor is not distinct from v_quem
    and h.criado_em > now() - interval '10 minutes';
  if not found then
    insert into public.historico_viagem (viagem_id, tabela, linha_id, acao, autor, titulo, privado_de)
    values (v_viagem, tg_table_name, new.id, 'editou', v_quem, left(v_titulo, 200), v_privado);
  end if;
  return null;
end;
$$;

revoke execute on function privado.registrar_historico() from public, anon, authenticated;

create trigger historico_editou after update on public.gastos
for each row execute function privado.registrar_historico();
create trigger historico_apagou before delete on public.gastos
for each row execute function privado.registrar_historico();
create trigger historico_editou after update on public.lugares
for each row execute function privado.registrar_historico();
create trigger historico_apagou before delete on public.lugares
for each row execute function privado.registrar_historico();
create trigger historico_editou after update on public.trajetos
for each row execute function privado.registrar_historico();
create trigger historico_apagou before delete on public.trajetos
for each row execute function privado.registrar_historico();
create trigger historico_editou after update on public.eventos_agenda
for each row execute function privado.registrar_historico();
create trigger historico_apagou before delete on public.eventos_agenda
for each row execute function privado.registrar_historico();

-- Põe de volta o que foi apagado. Devolve o id do item restaurado.
create function public.restaurar_da_lixeira(p_id uuid)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  h public.historico_viagem;
  v_linha jsonb;
  v_chave text;
begin
  select * into h from public.historico_viagem where id = p_id;
  if h.id is null or h.acao <> 'apagou' or not privado.e_membro(h.viagem_id)
     or (h.privado_de is not null and h.privado_de <> (select auth.uid())) then
    raise exception 'Item não encontrado na lixeira.' using errcode = '42501';
  end if;
  if h.restaurado_em is not null then
    raise exception 'Esse item já foi restaurado.';
  end if;
  if h.criado_em < now() - interval '30 days' then
    raise exception 'Passou dos 30 dias da lixeira.';
  end if;
  if h.autor is distinct from (select auth.uid()) and not privado.e_adm(h.viagem_id) then
    raise exception 'Só quem apagou ou o ADM restaura.' using errcode = '42501';
  end if;

  v_linha := h.antes - 'divisoes';
  -- Destino apagado nesse meio tempo: volta sem destino
  foreach v_chave in array array['destino_id', 'origem_id'] loop
    if v_linha ? v_chave and v_linha ->> v_chave is not null
       and not exists (select 1 from public.destinos d where d.id = (v_linha ->> v_chave)::uuid) then
      v_linha := jsonb_set(v_linha, array[v_chave], 'null'::jsonb);
    end if;
  end loop;

  execute format('insert into public.%I select * from jsonb_populate_record(null::public.%I, $1)', h.tabela, h.tabela)
  using v_linha;

  if h.tabela = 'gastos' then
    insert into public.gasto_divisoes
    select * from jsonb_populate_recordset(null::public.gasto_divisoes, coalesce(h.antes -> 'divisoes', '[]'::jsonb));
  end if;

  update public.historico_viagem set restaurado_em = now() where id = h.id;
  insert into public.historico_viagem (viagem_id, tabela, linha_id, acao, autor, titulo, privado_de)
  values (h.viagem_id, h.tabela, h.linha_id, 'restaurou', (select auth.uid()), h.titulo, h.privado_de);
  return h.linha_id;
end;
$$;

revoke all on function public.restaurar_da_lixeira(uuid) from public, anon;
grant execute on function public.restaurar_da_lixeira(uuid) to authenticated;

create function privado.limpar_historico()
returns void
language sql
security definer
set search_path = ''
as $$
  delete from public.historico_viagem where criado_em < now() - interval '30 days';
$$;

revoke execute on function privado.limpar_historico() from public, anon, authenticated;
