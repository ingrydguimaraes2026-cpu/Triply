-- Spec 031: central de notificações (o sino com o que mudou desde a última visita).
--
-- O que esta migration faz:
-- 1. Tabela `atividades_viagem`: um registro por coisa nova na viagem (gasto, enquete, aviso,
--    lugar, foto, comentário…). Quem grava é o banco, por gatilho; ninguém grava na mão.
-- 2. Tabela `atividades_vistas`: até quando cada pessoa já viu as novidades de cada viagem.
-- 3. Gatilhos nas tabelas de origem chamando `privado.registrar_atividade()`.
--
-- Privacidade: gasto pessoal e comentário em gasto pessoal NÃO entram no log.
--
-- Quem pode:
-- - todo mundo do comboio vê as atividades da viagem;
-- - cada um vê e muda só o próprio "visto até";
-- - ninguém insere, edita ou apaga atividade (só o gatilho insere; apagar a viagem apaga tudo).
--
-- Pra desfazer:
--   drop trigger registrar_atividade on (cada tabela abaixo);
--   drop function privado.registrar_atividade();
--   drop table public.atividades_vistas; drop table public.atividades_viagem;

create table public.atividades_viagem (
  id uuid primary key default gen_random_uuid(),
  viagem_id uuid not null references public.viagens (id) on delete cascade,
  autor uuid references public.perfis (id) on delete set null,
  tipo text not null check (
    tipo in (
      'gasto', 'enquete', 'aviso', 'ponto', 'tarefa', 'lugar', 'hospedagem', 'hospedagem_escolhida',
      'post', 'comentario_gasto', 'comentario_lugar', 'comentario_hospedagem', 'evento', 'trajeto',
      'arquivo', 'membro'
    )
  ),
  alvo_id uuid, -- id do item (gasto, lugar…), pra abrir direto nele
  titulo text check (char_length(titulo) <= 200), -- nome curto do item, já cortado
  criado_em timestamptz not null default now()
);

create index on public.atividades_viagem (viagem_id, criado_em desc);
create index on public.atividades_viagem (autor);

create table public.atividades_vistas (
  viagem_id uuid not null references public.viagens (id) on delete cascade,
  usuario_id uuid not null default auth.uid() references public.perfis (id) on delete cascade,
  visto_em timestamptz not null default now(),
  primary key (viagem_id, usuario_id)
);

create index on public.atividades_vistas (usuario_id);

-- Grava a atividade. security definer: quem usa o app não tem permissão de inserir no log.
create function privado.registrar_atividade()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_tipo text;
  v_autor uuid;
  v_titulo text;
  v_alvo uuid;
begin
  case tg_table_name
    when 'gastos' then
      if new.pessoal then
        return null;
      end if;
      v_tipo := 'gasto'; v_autor := new.criado_por; v_titulo := new.descricao; v_alvo := new.id;
    when 'enquetes' then
      v_tipo := 'enquete'; v_autor := new.criado_por; v_titulo := new.pergunta; v_alvo := new.id;
    when 'avisos' then
      v_tipo := 'aviso'; v_autor := new.criado_por; v_titulo := new.texto; v_alvo := new.id;
    when 'pontos_de_encontro' then
      v_tipo := 'ponto'; v_autor := new.criado_por; v_titulo := new.local; v_alvo := new.id;
    when 'tarefas' then
      v_tipo := 'tarefa'; v_autor := new.criado_por; v_titulo := new.titulo; v_alvo := new.id;
    when 'lugares' then
      v_tipo := 'lugar'; v_autor := new.criado_por; v_titulo := new.nome; v_alvo := new.id;
    when 'hospedagens' then
      if tg_op = 'UPDATE' then
        v_tipo := 'hospedagem_escolhida'; v_autor := (select auth.uid());
      else
        v_tipo := 'hospedagem'; v_autor := new.criado_por;
      end if;
      v_titulo := new.nome; v_alvo := new.id;
    when 'posts' then
      v_tipo := 'post'; v_autor := new.autor; v_titulo := new.legenda; v_alvo := new.id;
    when 'comentarios_item' then
      if new.gasto_id is not null then
        if exists (select 1 from public.gastos g where g.id = new.gasto_id and g.pessoal) then
          return null;
        end if;
        v_tipo := 'comentario_gasto'; v_alvo := new.gasto_id;
      elsif new.lugar_id is not null then
        v_tipo := 'comentario_lugar'; v_alvo := new.lugar_id;
      else
        v_tipo := 'comentario_hospedagem'; v_alvo := new.hospedagem_id;
      end if;
      v_autor := new.autor; v_titulo := new.texto;
    when 'eventos_agenda' then
      v_tipo := 'evento'; v_autor := new.criado_por; v_titulo := new.titulo; v_alvo := new.id;
    when 'trajetos' then
      v_tipo := 'trajeto'; v_autor := (select auth.uid()); v_alvo := new.id;
      v_titulo := coalesce((select d.nome from public.destinos d where d.id = new.origem_id), '?')
        || ' → ' || coalesce((select d.nome from public.destinos d where d.id = new.destino_id), '?');
    when 'arquivos_viagem' then
      v_tipo := 'arquivo'; v_autor := new.enviado_por; v_titulo := new.nome; v_alvo := new.id;
    when 'comboio_membros' then
      v_tipo := 'membro'; v_autor := new.usuario_id; v_alvo := new.usuario_id;
    else
      return null;
  end case;

  insert into public.atividades_viagem (viagem_id, autor, tipo, alvo_id, titulo)
  values (new.viagem_id, v_autor, v_tipo, v_alvo, left(v_titulo, 200));
  return null;
end;
$$;

revoke execute on function privado.registrar_atividade() from public, anon, authenticated;

create trigger registrar_atividade after insert on public.gastos
for each row execute function privado.registrar_atividade();
create trigger registrar_atividade after insert on public.enquetes
for each row execute function privado.registrar_atividade();
create trigger registrar_atividade after insert on public.avisos
for each row execute function privado.registrar_atividade();
create trigger registrar_atividade after insert on public.pontos_de_encontro
for each row execute function privado.registrar_atividade();
create trigger registrar_atividade after insert on public.tarefas
for each row execute function privado.registrar_atividade();
create trigger registrar_atividade after insert on public.lugares
for each row execute function privado.registrar_atividade();
create trigger registrar_atividade after insert on public.hospedagens
for each row execute function privado.registrar_atividade();
-- O ADM escolheu a hospedagem
create trigger registrar_atividade_escolhida after update of escolhida on public.hospedagens
for each row when (new.escolhida and not old.escolhida) execute function privado.registrar_atividade();
create trigger registrar_atividade after insert on public.posts
for each row execute function privado.registrar_atividade();
create trigger registrar_atividade after insert on public.comentarios_item
for each row execute function privado.registrar_atividade();
create trigger registrar_atividade after insert on public.eventos_agenda
for each row execute function privado.registrar_atividade();
create trigger registrar_atividade after insert on public.trajetos
for each row execute function privado.registrar_atividade();
create trigger registrar_atividade after insert on public.arquivos_viagem
for each row execute function privado.registrar_atividade();
create trigger registrar_atividade after insert on public.comboio_membros
for each row execute function privado.registrar_atividade();

alter table public.atividades_viagem enable row level security;

create policy "atividades: ver (comboio)" on public.atividades_viagem for select to authenticated
using (privado.e_membro(viagem_id));

alter table public.atividades_vistas enable row level security;

create policy "vistas: ver a minha" on public.atividades_vistas for select to authenticated
using (usuario_id = (select auth.uid()));

create policy "vistas: criar a minha" on public.atividades_vistas for insert to authenticated
with check (usuario_id = (select auth.uid()) and privado.e_membro(viagem_id));

create policy "vistas: mudar a minha" on public.atividades_vistas for update to authenticated
using (usuario_id = (select auth.uid()))
with check (usuario_id = (select auth.uid()) and privado.e_membro(viagem_id));
