-- Spec 120a: "Hoje" com as reservas do grupo. NÃO APLICADA: esperando o Victor confirmar.
-- O que muda, em português simples:
-- 1. O arquivo do cofre pode ficar "amarrado" à hospedagem ou a um item da agenda
--    (hoje só amarra a trajeto). É o que faz o "ver reserva" da casa e do ingresso.
-- 2. A hospedagem ganha o contato do anfitrião (telefone ou nome), pra mostrar no "Onde dormimos".
-- 3. O trajeto ganha "quem vai buscar" (uma pessoa do comboio), pro bloco "quem chega hoje".
-- Nenhuma tabela nova; as regras de acesso (RLS) continuam as mesmas das tabelas.

alter table public.arquivos_viagem
  add column hospedagem_id uuid references public.hospedagens (id) on delete set null,
  add column evento_id uuid references public.eventos_agenda (id) on delete set null;

create index on public.arquivos_viagem (hospedagem_id) where hospedagem_id is not null;
create index on public.arquivos_viagem (evento_id) where evento_id is not null;

alter table public.hospedagens
  add column contato_anfitriao text check (char_length(contato_anfitriao) <= 120);

alter table public.trajetos
  add column quem_busca_id uuid references public.perfis (id) on delete set null;

create index on public.trajetos (quem_busca_id) where quem_busca_id is not null;

-- O arquivo só amarra em coisa da mesma viagem (amplia a conferência da spec 028)
create or replace function privado.conferir_trajeto_do_arquivo()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if tg_op = 'UPDATE' and (new.viagem_id <> old.viagem_id or new.enviado_por <> old.enviado_por or new.caminho <> old.caminho) then
    raise exception 'Não dá pra mudar a viagem, o arquivo nem quem enviou.' using hint = 'TR_ARQUIVO_FIXO';
  end if;
  if new.trajeto_id is not null
     and not exists (select 1 from public.trajetos t where t.id = new.trajeto_id and t.viagem_id = new.viagem_id) then
    raise exception 'Esse trajeto não é desta viagem.' using hint = 'TR_ARQUIVO_TRAJETO';
  end if;
  if new.hospedagem_id is not null
     and not exists (select 1 from public.hospedagens h where h.id = new.hospedagem_id and h.viagem_id = new.viagem_id) then
    raise exception 'Essa hospedagem não é desta viagem.' using hint = 'TR_ARQUIVO_HOSPEDAGEM';
  end if;
  if new.evento_id is not null
     and not exists (select 1 from public.eventos_agenda e where e.id = new.evento_id and e.viagem_id = new.viagem_id) then
    raise exception 'Esse item da agenda não é desta viagem.' using hint = 'TR_ARQUIVO_EVENTO';
  end if;
  return new;
end;
$$;

-- Quem vai buscar tem que estar no comboio da viagem
create or replace function privado.conferir_quem_busca()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.quem_busca_id is not null
     and not exists (select 1 from public.comboio_membros m where m.viagem_id = new.viagem_id and m.usuario_id = new.quem_busca_id) then
    raise exception 'Quem vai buscar precisa estar no comboio.' using hint = 'TR_QUEM_BUSCA';
  end if;
  return new;
end;
$$;

create trigger conferir_quem_busca before insert or update of quem_busca_id on public.trajetos
for each row execute function privado.conferir_quem_busca();
