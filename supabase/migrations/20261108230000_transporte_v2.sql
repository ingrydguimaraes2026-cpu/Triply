-- Spec 121 (Transporte v2): cada um lança a própria chegada e saída; trecho do grupo continua do ADM.
--
-- 1. `trajetos.tipo`: 'chegada' (como a pessoa chega na viagem), 'saida' (como vai embora) ou 'trecho'
--    (entre destinos, do grupo). Os trajetos que já existem ficam 'trecho'.
-- 2. `trajetos.criado_por`: quem lançou (padrão: quem está logado). Os antigos ficam sem (só o ADM mexe).
-- 3. `meio` aceita 'carona'; `lugares_livres` (carro e carona: quantos lugares sobram, 0 a 8).
-- 4. `caminho` (121c): paradas e linha do trem/ônibus, guardadas pra não buscar toda vez.
-- 5. RLS: membro (com conta, não convidado anônimo) cria chegada/saída em nome dele, edita e apaga o que
--    ele lançou; ADM (ou membro liberado em "transportes") continua mexendo em tudo.
--    Passageiros: quem lançou o trajeto também pode pôr e tirar gente do comboio nele.
--
-- Pra desfazer:
--   drop policy "trajetos: criar (adm, liberado ou a própria chegada)" on public.trajetos; (e as outras 2, e as 2 de passageiros)
--   recriar as políticas antigas de 20261031070000_permissoes_simples.sql e 20261030235000_passageiros.sql
--   alter table public.trajetos drop column tipo, drop column criado_por, drop column lugares_livres, drop column caminho;
--   alter table public.trajetos drop constraint trajetos_meio_check; e recriar sem 'carona'

alter table public.trajetos
  add column tipo text not null default 'trecho' check (tipo in ('chegada', 'saida', 'trecho')),
  add column criado_por uuid default auth.uid() references public.perfis (id) on delete set null,
  add column lugares_livres smallint check (lugares_livres is null or lugares_livres between 0 and 8),
  add column caminho jsonb check (caminho is null or jsonb_typeof(caminho) = 'object');

create index on public.trajetos (criado_por);

alter table public.trajetos drop constraint trajetos_meio_check;
alter table public.trajetos add constraint trajetos_meio_check
  check (meio in ('trem', 'onibus', 'aviao', 'carro', 'carona', 'barco', 'a_pe', 'outro'));

-- Quem lançou não muda depois
create function privado.manter_criado_por()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.criado_por := old.criado_por;
  return new;
end;
$$;

create trigger manter_criado_por before update of criado_por on public.trajetos
for each row execute function privado.manter_criado_por();

-- Membro com conta (convidado anônimo da web leve não lança transporte)
create function privado.membro_com_conta(p_viagem uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select privado.e_membro(p_viagem)
    and not coalesce(((select auth.jwt()) ->> 'is_anonymous')::boolean, false);
$$;

drop policy "trajetos: criar (adm ou liberado)" on public.trajetos;
drop policy "trajetos: editar (adm ou liberado)" on public.trajetos;
drop policy "trajetos: apagar (adm ou liberado)" on public.trajetos;

create policy "trajetos: criar (adm, liberado ou a própria chegada)" on public.trajetos for insert to authenticated
  with check (
    privado.pode_editar(viagem_id, 'transportes')
    or (tipo in ('chegada', 'saida') and criado_por = (select auth.uid()) and privado.membro_com_conta(viagem_id))
  );

create policy "trajetos: editar (adm, liberado ou quem lançou)" on public.trajetos for update to authenticated
  using (privado.pode_editar(viagem_id, 'transportes') or (criado_por = (select auth.uid()) and privado.membro_com_conta(viagem_id)))
  with check (
    privado.pode_editar(viagem_id, 'transportes')
    or (tipo in ('chegada', 'saida') and criado_por = (select auth.uid()) and privado.membro_com_conta(viagem_id))
  );

create policy "trajetos: apagar (adm, liberado ou quem lançou)" on public.trajetos for delete to authenticated
  using (privado.pode_editar(viagem_id, 'transportes') or (criado_por = (select auth.uid()) and privado.membro_com_conta(viagem_id)));

drop policy "passageiros: pôr (ADM ou a própria pessoa)" on public.trajeto_passageiros;
drop policy "passageiros: tirar (ADM ou a própria pessoa)" on public.trajeto_passageiros;

create policy "passageiros: pôr (ADM, quem lançou ou a própria pessoa)" on public.trajeto_passageiros for insert to authenticated
  with check (exists (
    select 1 from public.trajetos t
    where t.id = trajeto_passageiros.trajeto_id
      and (
        privado.e_adm(t.viagem_id)
        or (t.criado_por = (select auth.uid()) and privado.membro_com_conta(t.viagem_id))
        or (trajeto_passageiros.usuario_id = (select auth.uid()) and privado.e_membro(t.viagem_id))
      )
  ));

create policy "passageiros: tirar (ADM, quem lançou ou a própria pessoa)" on public.trajeto_passageiros for delete to authenticated
  using (exists (
    select 1 from public.trajetos t
    where t.id = trajeto_passageiros.trajeto_id
      and (
        privado.e_adm(t.viagem_id)
        or t.criado_por = (select auth.uid())
        or trajeto_passageiros.usuario_id = (select auth.uid())
      )
  ));
