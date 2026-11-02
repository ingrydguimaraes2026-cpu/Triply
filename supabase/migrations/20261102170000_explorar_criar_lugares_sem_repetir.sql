-- Corrige o "Montar" do Explorar quando a pessoa já tem 3 "não abro mão" no destino.
-- A trava de "no máximo 3" (trigger antes de inserir) dispara antes do "on conflict do nothing",
-- então rodar a função de novo (resumo + montar, ou "Refazer") dava erro. Agora só grava o que ainda não existe.

create or replace function public.explorar_criar_lugares(p_destino uuid)
returns setof uuid
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_viagem uuid;
  r record;
  v_lugar uuid;
begin
  select viagem_id into v_viagem from public.destinos where id = p_destino;
  if v_viagem is null or not privado.e_membro(v_viagem) then
    raise exception 'Você não está nesta viagem' using errcode = '42501';
  end if;

  for r in
    select e.escolha, c.*
    from public.explorar_escolhas e
    join public.catalogo_lugares c on c.id = e.catalogo_lugar_id
    where e.usuario_id = auth.uid() and e.destino_id = p_destino and e.escolha in ('quero', 'nao_abro_mao')
    order by (e.escolha = 'nao_abro_mao') desc, c.fama desc
  loop
    -- Já existe na viagem? (mesmo item da Wikidata, ou mesmo nome no mesmo destino)
    select l.id into v_lugar from public.lugares l
    where l.viagem_id = v_viagem
      and ((r.wikidata is not null and l.wikidata = r.wikidata)
        or (l.destino_id = p_destino and lower(l.nome) = lower(r.nome)))
    limit 1;

    if v_lugar is null then
      insert into public.lugares (viagem_id, destino_id, tipo, nome, link, observacao, latitude, longitude, endereco, wikidata)
      values (v_viagem, p_destino, 'passeio', left(r.nome, 120), r.link_wikipedia, r.por_que, r.latitude, r.longitude, left(r.bairro, 200), r.wikidata)
      returning id into v_lugar;
    end if;

    if not exists (select 1 from public.lugar_votos v where v.lugar_id = v_lugar and v.usuario_id = auth.uid()) then
      insert into public.lugar_votos (lugar_id) values (v_lugar) on conflict do nothing;
    end if;
    if r.escolha = 'nao_abro_mao'
      and not exists (select 1 from public.lugar_prioridades p where p.lugar_id = v_lugar and p.usuario_id = auth.uid()) then
      insert into public.lugar_prioridades (lugar_id) values (v_lugar) on conflict do nothing;
    end if;
    return next v_lugar;
  end loop;
end;
$$;
