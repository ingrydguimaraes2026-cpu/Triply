-- Estrutura inicial do banco do Together.
-- Regra geral: quem está no comboio de uma viagem vê os dados dela.
-- Só o ADM mexe em destinos, trajetos, orçamento e convites.
-- Gasto "pessoal" só quem lançou vê.

-- ============================================================
-- Perfis (um por usuário do login)
-- ============================================================
create table public.perfis (
  id uuid primary key references auth.users (id) on delete cascade,
  nome text,
  avatar_url text,
  criado_em timestamptz not null default now()
);

-- Cria o perfil sozinho quando alguém faz login pela primeira vez
create function public.criar_perfil()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.perfis (id, nome, avatar_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name', split_part(new.email, '@', 1)),
    new.raw_user_meta_data ->> 'avatar_url'
  );
  return new;
end;
$$;

create trigger ao_criar_usuario
after insert on auth.users
for each row execute function public.criar_perfil();

-- ============================================================
-- Viagens e comboio
-- ============================================================
create table public.viagens (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  data_inicio date,
  data_fim date,
  moeda_principal char(3) not null default 'EUR',
  criado_por uuid not null default auth.uid() references public.perfis (id),
  criado_em timestamptz not null default now(),
  check (data_fim is null or data_inicio is null or data_fim >= data_inicio)
);

create table public.comboio_membros (
  viagem_id uuid not null references public.viagens (id) on delete cascade,
  usuario_id uuid not null references public.perfis (id) on delete cascade,
  papel text not null default 'membro' check (papel in ('adm', 'membro')),
  entrou_em timestamptz not null default now(),
  primary key (viagem_id, usuario_id)
);
create index on public.comboio_membros (usuario_id);

-- Funções de ajuda pras regras de acesso (security definer evita loop nas regras)
create function public.e_membro(p_viagem uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.comboio_membros
    where viagem_id = p_viagem and usuario_id = (select auth.uid())
  );
$$;

create function public.e_adm(p_viagem uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.comboio_membros
    where viagem_id = p_viagem and usuario_id = (select auth.uid()) and papel = 'adm'
  );
$$;

-- Quem cria a viagem vira ADM do comboio automaticamente
create function public.criador_vira_adm()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.comboio_membros (viagem_id, usuario_id, papel)
  values (new.id, new.criado_por, 'adm');
  return new;
end;
$$;

create trigger ao_criar_viagem
after insert on public.viagens
for each row execute function public.criador_vira_adm();

-- Convites por link
create table public.convites (
  codigo text primary key default encode(extensions.gen_random_bytes(9), 'hex'),
  viagem_id uuid not null references public.viagens (id) on delete cascade,
  criado_por uuid not null default auth.uid() references public.perfis (id),
  expira_em timestamptz not null default now() + interval '7 days',
  criado_em timestamptz not null default now()
);
create index on public.convites (viagem_id);

-- Entrar no comboio usando o código do convite
create function public.aceitar_convite(p_codigo text)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_viagem uuid;
begin
  if (select auth.uid()) is null then
    raise exception 'Faça login antes de aceitar o convite';
  end if;

  select viagem_id into v_viagem
  from public.convites
  where codigo = p_codigo and expira_em > now();

  if v_viagem is null then
    raise exception 'Convite inválido ou expirado';
  end if;

  insert into public.comboio_membros (viagem_id, usuario_id, papel)
  values (v_viagem, (select auth.uid()), 'membro')
  on conflict do nothing;

  return v_viagem;
end;
$$;

-- ============================================================
-- Destinos e trajetos
-- ============================================================
create table public.destinos (
  id uuid primary key default gen_random_uuid(),
  viagem_id uuid not null references public.viagens (id) on delete cascade,
  nome text not null,
  pais text,
  latitude double precision,
  longitude double precision,
  ordem int not null default 0,
  chegada date,
  saida date
);
create index on public.destinos (viagem_id, ordem);

create table public.trajetos (
  id uuid primary key default gen_random_uuid(),
  viagem_id uuid not null references public.viagens (id) on delete cascade,
  origem_id uuid references public.destinos (id) on delete set null,
  destino_id uuid references public.destinos (id) on delete set null,
  meio text not null default 'trem' check (meio in ('trem', 'onibus', 'aviao', 'carro', 'barco', 'a_pe', 'outro')),
  partida timestamptz,
  chegada timestamptz,
  bate_e_volta boolean not null default false,
  observacao text
);
create index on public.trajetos (viagem_id);
create index on public.trajetos (origem_id);
create index on public.trajetos (destino_id);

-- ============================================================
-- Financeiro
-- ============================================================
create table public.orcamentos (
  id uuid primary key default gen_random_uuid(),
  viagem_id uuid not null references public.viagens (id) on delete cascade,
  categoria text not null check (categoria in ('transporte', 'hospedagem', 'alimentacao', 'passeios', 'comprinhas', 'outros')),
  valor_meta numeric(12, 2) not null check (valor_meta >= 0),
  moeda char(3) not null default 'EUR',
  unique (viagem_id, categoria)
);

create table public.gastos (
  id uuid primary key default gen_random_uuid(),
  viagem_id uuid not null references public.viagens (id) on delete cascade,
  pago_por uuid not null references public.perfis (id),
  criado_por uuid not null default auth.uid() references public.perfis (id),
  descricao text not null,
  valor numeric(12, 2) not null check (valor > 0),
  moeda char(3) not null default 'EUR',
  categoria text not null default 'outros' check (categoria in ('transporte', 'hospedagem', 'alimentacao', 'passeios', 'comprinhas', 'outros')),
  pessoal boolean not null default false,
  data date not null default current_date,
  criado_em timestamptz not null default now()
);
create index on public.gastos (viagem_id, data);
create index on public.gastos (pago_por);
create index on public.gastos (criado_por);

-- Quanto cada pessoa deve de um gasto dividido
create table public.gasto_divisoes (
  gasto_id uuid not null references public.gastos (id) on delete cascade,
  usuario_id uuid not null references public.perfis (id) on delete cascade,
  valor numeric(12, 2) not null check (valor >= 0),
  primary key (gasto_id, usuario_id)
);
create index on public.gasto_divisoes (usuario_id);

-- Compras de moeda (ex.: real → euro). A cotação é calculada sozinha.
create table public.compras_cambio (
  id uuid primary key default gen_random_uuid(),
  viagem_id uuid not null references public.viagens (id) on delete cascade,
  usuario_id uuid not null default auth.uid() references public.perfis (id),
  moeda_origem char(3) not null default 'BRL',
  moeda_destino char(3) not null default 'EUR',
  valor_origem numeric(12, 2) not null check (valor_origem > 0),
  valor_destino numeric(12, 2) not null check (valor_destino > 0),
  cotacao numeric(12, 6) generated always as (valor_origem / valor_destino) stored,
  data date not null default current_date,
  criado_em timestamptz not null default now()
);
create index on public.compras_cambio (viagem_id);
create index on public.compras_cambio (usuario_id);

-- ============================================================
-- Fotos (o arquivo fica no Storage, aqui só o registro)
-- ============================================================
create table public.fotos (
  id uuid primary key default gen_random_uuid(),
  viagem_id uuid not null references public.viagens (id) on delete cascade,
  destino_id uuid references public.destinos (id) on delete set null,
  enviada_por uuid not null default auth.uid() references public.perfis (id),
  caminho text not null unique, -- caminho no bucket "fotos": <viagem_id>/<arquivo>
  legenda text,
  criado_em timestamptz not null default now()
);
create index on public.fotos (viagem_id, destino_id);
create index on public.fotos (enviada_por);

-- ============================================================
-- Regras de acesso (RLS)
-- ============================================================
alter table public.perfis enable row level security;
alter table public.viagens enable row level security;
alter table public.comboio_membros enable row level security;
alter table public.convites enable row level security;
alter table public.destinos enable row level security;
alter table public.trajetos enable row level security;
alter table public.orcamentos enable row level security;
alter table public.gastos enable row level security;
alter table public.gasto_divisoes enable row level security;
alter table public.compras_cambio enable row level security;
alter table public.fotos enable row level security;

-- Perfis: vejo o meu e o de quem viaja comigo
create policy "perfis: ver" on public.perfis for select to authenticated
using (
  id = (select auth.uid())
  or exists (
    select 1 from public.comboio_membros m
    where m.usuario_id = perfis.id and public.e_membro(m.viagem_id)
  )
);
create policy "perfis: editar o meu" on public.perfis for update to authenticated
using (id = (select auth.uid())) with check (id = (select auth.uid()));

-- Viagens
create policy "viagens: ver" on public.viagens for select to authenticated
using (public.e_membro(id) or criado_por = (select auth.uid()));
create policy "viagens: criar" on public.viagens for insert to authenticated
with check (criado_por = (select auth.uid()));
create policy "viagens: editar (adm)" on public.viagens for update to authenticated
using (public.e_adm(id)) with check (public.e_adm(id));
create policy "viagens: apagar (adm)" on public.viagens for delete to authenticated
using (public.e_adm(id));

-- Comboio
create policy "comboio: ver" on public.comboio_membros for select to authenticated
using (public.e_membro(viagem_id));
create policy "comboio: adicionar (adm)" on public.comboio_membros for insert to authenticated
with check (public.e_adm(viagem_id));
create policy "comboio: mudar papel (adm)" on public.comboio_membros for update to authenticated
using (public.e_adm(viagem_id)) with check (public.e_adm(viagem_id));
create policy "comboio: remover (adm ou sair)" on public.comboio_membros for delete to authenticated
using (public.e_adm(viagem_id) or usuario_id = (select auth.uid()));

-- Convites (só ADM)
create policy "convites: ver (adm)" on public.convites for select to authenticated
using (public.e_adm(viagem_id));
create policy "convites: criar (adm)" on public.convites for insert to authenticated
with check (public.e_adm(viagem_id) and criado_por = (select auth.uid()));
create policy "convites: apagar (adm)" on public.convites for delete to authenticated
using (public.e_adm(viagem_id));

-- Destinos, trajetos e orçamentos: comboio vê, ADM edita
create policy "destinos: ver" on public.destinos for select to authenticated using (public.e_membro(viagem_id));
create policy "destinos: criar (adm)" on public.destinos for insert to authenticated with check (public.e_adm(viagem_id));
create policy "destinos: editar (adm)" on public.destinos for update to authenticated using (public.e_adm(viagem_id)) with check (public.e_adm(viagem_id));
create policy "destinos: apagar (adm)" on public.destinos for delete to authenticated using (public.e_adm(viagem_id));

create policy "trajetos: ver" on public.trajetos for select to authenticated using (public.e_membro(viagem_id));
create policy "trajetos: criar (adm)" on public.trajetos for insert to authenticated with check (public.e_adm(viagem_id));
create policy "trajetos: editar (adm)" on public.trajetos for update to authenticated using (public.e_adm(viagem_id)) with check (public.e_adm(viagem_id));
create policy "trajetos: apagar (adm)" on public.trajetos for delete to authenticated using (public.e_adm(viagem_id));

create policy "orcamentos: ver" on public.orcamentos for select to authenticated using (public.e_membro(viagem_id));
create policy "orcamentos: criar (adm)" on public.orcamentos for insert to authenticated with check (public.e_adm(viagem_id));
create policy "orcamentos: editar (adm)" on public.orcamentos for update to authenticated using (public.e_adm(viagem_id)) with check (public.e_adm(viagem_id));
create policy "orcamentos: apagar (adm)" on public.orcamentos for delete to authenticated using (public.e_adm(viagem_id));

-- Gastos: comboio vê os da viagem; pessoal só quem lançou
create policy "gastos: ver" on public.gastos for select to authenticated
using (
  public.e_membro(viagem_id)
  and (not pessoal or criado_por = (select auth.uid()))
);
create policy "gastos: lançar" on public.gastos for insert to authenticated
with check (
  public.e_membro(viagem_id)
  and criado_por = (select auth.uid())
  and exists (select 1 from public.comboio_membros m where m.viagem_id = gastos.viagem_id and m.usuario_id = gastos.pago_por)
  and (not pessoal or pago_por = (select auth.uid()))
);
create policy "gastos: editar (quem lançou)" on public.gastos for update to authenticated
using (criado_por = (select auth.uid()))
with check (
  criado_por = (select auth.uid())
  and public.e_membro(viagem_id)
  and (not pessoal or pago_por = (select auth.uid()))
);
create policy "gastos: apagar (quem lançou ou adm)" on public.gastos for delete to authenticated
using (criado_por = (select auth.uid()) or (not pessoal and public.e_adm(viagem_id)));

-- Divisões seguem o gasto
create policy "divisoes: ver" on public.gasto_divisoes for select to authenticated
using (exists (select 1 from public.gastos g where g.id = gasto_id));
create policy "divisoes: criar" on public.gasto_divisoes for insert to authenticated
with check (exists (select 1 from public.gastos g where g.id = gasto_id and g.criado_por = (select auth.uid())));
create policy "divisoes: editar" on public.gasto_divisoes for update to authenticated
using (exists (select 1 from public.gastos g where g.id = gasto_id and g.criado_por = (select auth.uid())))
with check (exists (select 1 from public.gastos g where g.id = gasto_id and g.criado_por = (select auth.uid())));
create policy "divisoes: apagar" on public.gasto_divisoes for delete to authenticated
using (exists (select 1 from public.gastos g where g.id = gasto_id and g.criado_por = (select auth.uid())));

-- Câmbio: comboio vê; cada um lança e edita as suas compras
create policy "cambio: ver" on public.compras_cambio for select to authenticated using (public.e_membro(viagem_id));
create policy "cambio: lançar" on public.compras_cambio for insert to authenticated
with check (public.e_membro(viagem_id) and usuario_id = (select auth.uid()));
create policy "cambio: editar a minha" on public.compras_cambio for update to authenticated
using (usuario_id = (select auth.uid())) with check (usuario_id = (select auth.uid()) and public.e_membro(viagem_id));
create policy "cambio: apagar a minha" on public.compras_cambio for delete to authenticated
using (usuario_id = (select auth.uid()));

-- Fotos: comboio vê e posta; apaga quem enviou ou o ADM
create policy "fotos: ver" on public.fotos for select to authenticated using (public.e_membro(viagem_id));
create policy "fotos: enviar" on public.fotos for insert to authenticated
with check (
  public.e_membro(viagem_id)
  and enviada_por = (select auth.uid())
  and split_part(caminho, '/', 1) = viagem_id::text
);
create policy "fotos: editar legenda" on public.fotos for update to authenticated
using (enviada_por = (select auth.uid())) with check (enviada_por = (select auth.uid()));
create policy "fotos: apagar" on public.fotos for delete to authenticated
using (enviada_por = (select auth.uid()) or public.e_adm(viagem_id));

-- ============================================================
-- Storage: bucket privado de fotos, organizado por viagem (<viagem_id>/<arquivo>)
-- Até 1 MB por foto (o site comprime antes de enviar), só jpeg/webp.
-- ============================================================
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('fotos', 'fotos', false, 1048576, array['image/jpeg', 'image/webp']);

create policy "storage fotos: ver" on storage.objects for select to authenticated
using (bucket_id = 'fotos' and public.e_membro(((storage.foldername(name))[1])::uuid));
create policy "storage fotos: enviar" on storage.objects for insert to authenticated
with check (bucket_id = 'fotos' and public.e_membro(((storage.foldername(name))[1])::uuid));
create policy "storage fotos: apagar" on storage.objects for delete to authenticated
using (
  bucket_id = 'fotos'
  and (owner_id = (select auth.uid())::text or public.e_adm(((storage.foldername(name))[1])::uuid))
);

-- Funções internas não devem ser chamadas por visitantes sem login
revoke execute on function public.criar_perfil() from public, anon, authenticated;
revoke execute on function public.criador_vira_adm() from public, anon, authenticated;
revoke execute on function public.aceitar_convite(text) from public, anon;
revoke execute on function public.e_membro(uuid) from public, anon;
revoke execute on function public.e_adm(uuid) from public, anon;
