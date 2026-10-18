-- Specs 002 e 009: gastos.
--
-- O que esta migration faz:
-- 1. Coluna nova `gastos.rascunho`: gasto lançado rápido pelo celular, que a pessoa completa depois.
-- 2. Função `salvar_gasto`: grava o gasto e as divisões juntos ("tudo ou nada"), criando ou editando.
--    O `id` pode vir do celular (crypto.randomUUID), então mandar o mesmo gasto duas vezes
--    (ex.: sem internet, reenviando depois) não duplica.
-- Não muda as regras de acesso (RLS) existentes: a função roda com as permissões de quem chamou.
--
-- Pra desfazer:
--   drop function public.salvar_gasto(uuid, jsonb, jsonb);
--   alter table public.gastos drop column rascunho;

alter table public.gastos add column rascunho boolean not null default false;

-- p_gasto: { id?, descricao, valor, moeda, categoria, data, pago_por, pessoal, rascunho }
-- p_divisoes: [{ usuario_id, valor }] (ignorada quando o gasto é pessoal)
-- Os valores chegam como texto com 2 casas ("12.50") pra não perder centavo no caminho.
create function public.salvar_gasto(p_viagem uuid, p_gasto jsonb, p_divisoes jsonb default '[]')
returns uuid
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_id uuid := coalesce((p_gasto->>'id')::uuid, gen_random_uuid());
  v_eu uuid := (select auth.uid());
  v_valor numeric(12, 2);
  v_pessoal boolean := coalesce((p_gasto->>'pessoal')::boolean, false);
  v_pago_por uuid;
  v_descricao text := trim(coalesce(p_gasto->>'descricao', ''));
  v_soma numeric(12, 2);
  v_qtd int;
begin
  if v_eu is null or p_viagem is null or not privado.e_membro(p_viagem) then
    raise exception 'Só quem está no comboio pode lançar gastos' using errcode = '42501';
  end if;

  v_valor := (p_gasto->>'valor')::numeric(12, 2);
  if v_valor is null or v_valor <= 0 then
    raise exception 'O valor precisa ser maior que zero' using errcode = 'TR422';
  end if;
  if char_length(v_descricao) not between 1 and 200 then
    raise exception 'A descrição precisa ter de 1 a 200 letras' using errcode = 'TR422';
  end if;

  -- Gasto pessoal é sempre pago por quem lançou e não é dividido
  v_pago_por := case when v_pessoal then v_eu else coalesce((p_gasto->>'pago_por')::uuid, v_eu) end;

  if not v_pessoal then
    if p_divisoes is null or jsonb_typeof(p_divisoes) <> 'array' or jsonb_array_length(p_divisoes) = 0 then
      raise exception 'Escolha com quem dividir' using errcode = 'TR422';
    end if;
    select sum((e->>'valor')::numeric(12, 2)), count(*) into v_soma, v_qtd from jsonb_array_elements(p_divisoes) e;
    if v_soma <> v_valor then
      raise exception 'A divisão (%) não bate com o valor do gasto (%)', v_soma, v_valor using errcode = 'TR422';
    end if;
    if exists (select 1 from jsonb_array_elements(p_divisoes) e where (e->>'valor')::numeric < 0) then
      raise exception 'Ninguém pode dever valor negativo' using errcode = 'TR422';
    end if;
    if (select count(distinct e->>'usuario_id') from jsonb_array_elements(p_divisoes) e) <> v_qtd then
      raise exception 'Pessoa repetida na divisão' using errcode = 'TR422';
    end if;
    if exists (
      select 1 from jsonb_array_elements(p_divisoes) e
      where not exists (
        select 1 from public.comboio_membros m
        where m.viagem_id = p_viagem and m.usuario_id = (e->>'usuario_id')::uuid
      )
    ) then
      raise exception 'Só dá pra dividir com quem está no comboio' using errcode = 'TR422';
    end if;
  end if;

  -- Edita se já existe (só quem lançou consegue: regra RLS), senão cria
  update public.gastos set
    descricao = v_descricao,
    valor = v_valor,
    moeda = upper(coalesce(p_gasto->>'moeda', moeda)),
    categoria = coalesce(p_gasto->>'categoria', categoria),
    data = coalesce((p_gasto->>'data')::date, data),
    pago_por = v_pago_por,
    pessoal = v_pessoal,
    rascunho = coalesce((p_gasto->>'rascunho')::boolean, false)
  where id = v_id and viagem_id = p_viagem;

  if not found then
    insert into public.gastos (id, viagem_id, pago_por, criado_por, descricao, valor, moeda, categoria, pessoal, data, rascunho)
    values (
      v_id,
      p_viagem,
      v_pago_por,
      v_eu,
      v_descricao,
      v_valor,
      upper(coalesce(p_gasto->>'moeda', 'EUR')),
      coalesce(p_gasto->>'categoria', 'outros'),
      v_pessoal,
      coalesce((p_gasto->>'data')::date, current_date),
      coalesce((p_gasto->>'rascunho')::boolean, false)
    )
    on conflict (id) do nothing;
    if not found then
      -- O id existe mas não é desta pessoa (ou de outra viagem)
      raise exception 'Só quem lançou o gasto pode editar' using errcode = '42501';
    end if;
  end if;

  -- Divisões: troca todas
  delete from public.gasto_divisoes where gasto_id = v_id;
  if not v_pessoal then
    insert into public.gasto_divisoes (gasto_id, usuario_id, valor)
    select v_id, (e->>'usuario_id')::uuid, (e->>'valor')::numeric(12, 2)
    from jsonb_array_elements(p_divisoes) e;
  end if;

  return v_id;
end;
$$;

revoke execute on function public.salvar_gasto(uuid, jsonb, jsonb) from public, anon;
grant execute on function public.salvar_gasto(uuid, jsonb, jsonb) to authenticated;
