-- Spec 085 (M5): tempo real. Mudança de outra pessoa aparece na hora, sem recarregar.
--
-- O que muda:
-- - Coloca as tabelas principais da viagem na "publicação" do Supabase Realtime
--   (é a lista de tabelas cujas mudanças o servidor transmite pro site).
-- - Quem recebe: o Realtime confere o RLS de cada pessoa. Só chega a mudança de uma linha
--   que ela já poderia ler (comboio da viagem; gasto pessoal só pro dono).
-- - Apagar (DELETE) chega só com o id, sem os dados da linha.
--
-- Não mexe em nenhuma tabela nem regra de acesso.
--
-- Pra desfazer:
--   alter publication supabase_realtime drop table public.viagens, public.destinos,
--     public.comboio_membros, public.gastos, public.trajetos, public.lugares,
--     public.hospedagens, public.eventos_agenda, public.posts;

do $$
declare
  t text;
begin
  -- No banco de testes (sem Realtime) a publicação não existe: não faz nada.
  if not exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    return;
  end if;
  foreach t in array array['viagens', 'destinos', 'comboio_membros', 'gastos', 'trajetos', 'lugares', 'hospedagens', 'eventos_agenda', 'posts']
  loop
    if not exists (
      select 1 from pg_publication_tables
      where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = t
    ) then
      execute format('alter publication supabase_realtime add table public.%I', t);
    end if;
  end loop;
end;
$$;
