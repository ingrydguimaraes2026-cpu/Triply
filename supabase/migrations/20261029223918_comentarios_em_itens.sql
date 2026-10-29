-- Spec 027: comentários em qualquer item (gasto, lugar, opção de hospedagem).
-- Uma conversa curta dentro do item, em vez de um chat separado.
--
-- Cada comentário aponta pra exatamente UM item, com chave estrangeira de verdade:
-- apagar o item apaga os comentários junto (cascade), sem gatilho de limpeza.
-- Quem vê o comentário = quem vê o item. Num gasto pessoal, só quem lançou (a RLS de `gastos` vale dentro do exists).
--
-- Pra desfazer:
--   drop table public.comentarios_item; drop function privado.preencher_viagem_do_comentario();

create table public.comentarios_item (
  id uuid primary key default gen_random_uuid(),
  viagem_id uuid not null references public.viagens (id) on delete cascade,
  gasto_id uuid references public.gastos (id) on delete cascade,
  lugar_id uuid references public.lugares (id) on delete cascade,
  hospedagem_id uuid references public.hospedagens (id) on delete cascade,
  autor uuid not null default auth.uid() references public.perfis (id) on delete cascade,
  texto text not null check (char_length(btrim(texto)) between 1 and 1000),
  criado_em timestamptz not null default now(),
  -- Exatamente um alvo
  check (num_nonnulls(gasto_id, lugar_id, hospedagem_id) = 1)
);

create index on public.comentarios_item (viagem_id);
create index on public.comentarios_item (gasto_id, criado_em) where gasto_id is not null;
create index on public.comentarios_item (lugar_id, criado_em) where lugar_id is not null;
create index on public.comentarios_item (hospedagem_id, criado_em) where hospedagem_id is not null;
create index on public.comentarios_item (autor);

-- A viagem vem do item (quem comenta não escolhe). Roda com os direitos de quem comenta:
-- se a pessoa não enxerga o item (ex.: gasto pessoal de outro), ele "não existe".
create or replace function privado.preencher_viagem_do_comentario()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  v_viagem uuid;
begin
  if new.gasto_id is not null then
    select viagem_id into v_viagem from public.gastos where id = new.gasto_id;
  elsif new.lugar_id is not null then
    select viagem_id into v_viagem from public.lugares where id = new.lugar_id;
  elsif new.hospedagem_id is not null then
    select viagem_id into v_viagem from public.hospedagens where id = new.hospedagem_id;
  end if;
  if v_viagem is null then
    raise exception 'Esse item não existe ou você não tem acesso a ele.' using hint = 'TR_COMENTARIO_SEM_ITEM';
  end if;
  new.viagem_id := v_viagem;
  return new;
end;
$$;

create trigger preencher_viagem before insert on public.comentarios_item
for each row execute function privado.preencher_viagem_do_comentario();

alter table public.comentarios_item enable row level security;

-- Vê quem é do comboio E enxerga o item (o gasto pessoal fica escondido pela RLS de gastos)
create policy "comentarios_item: ver (quem vê o item)" on public.comentarios_item for select to authenticated
using (
  privado.e_membro(viagem_id)
  and (gasto_id is null or exists (select 1 from public.gastos g where g.id = gasto_id))
);

create policy "comentarios_item: comentar (quem vê o item)" on public.comentarios_item for insert to authenticated
with check (
  autor = (select auth.uid())
  and privado.e_membro(viagem_id)
  and (gasto_id is null or exists (select 1 from public.gastos g where g.id = gasto_id))
);

-- Sem editar: apaga e escreve de novo. Apaga quem escreveu ou o ADM.
create policy "comentarios_item: apagar (autor ou ADM)" on public.comentarios_item for delete to authenticated
using (autor = (select auth.uid()) or privado.e_adm(viagem_id));
