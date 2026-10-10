-- Ajustes apontados pelo verificador do Supabase.

-- As funções de checagem de acesso não precisam ficar expostas na API:
-- vão pra um schema privado (as regras de acesso continuam usando elas).
create schema if not exists privado;
grant usage on schema privado to authenticated;

alter function public.e_membro(uuid) set schema privado;
alter function public.e_adm(uuid) set schema privado;

-- Função criada pelo próprio Supabase: ninguém de fora precisa chamá-la
revoke execute on function public.rls_auto_enable() from public, anon, authenticated;

-- Índices que faltavam em chaves estrangeiras
create index on public.convites (criado_por);
create index on public.fotos (destino_id);
create index on public.viagens (criado_por);
