create extension if not exists pgcrypto with schema extensions;

create schema if not exists privado;
revoke all on schema privado from public, anon, authenticated;

create type public.tipo_lancamento as enum ('receita', 'despesa');
create type public.tipo_entidade as enum ('empresa', 'trabalho');
create type public.frequencia_recorrencia as enum ('semanal', 'quinzenal', 'mensal', 'trimestral', 'anual');
create type public.origem_lancamento as enum ('manual', 'recorrencia', 'folha', 'api');
create type public.tipo_contrato as enum ('clt', 'pj', 'estagio', 'freelancer', 'temporario');
create type public.status_folha as enum ('aberta', 'paga');

create or replace function privado.definir_atualizado_em()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.atualizado_em := now();
  return new;
end;
$$;

create table public.perfis (
  id uuid primary key references auth.users (id) on delete cascade,
  nome text check (char_length(nome) <= 120),
  usuario text not null unique check (usuario ~ '^[a-z0-9_.]{3,30}$'),
  avatar_url text check (avatar_url is null or (avatar_url ~ '^https://' and char_length(avatar_url) <= 1024)),
  moeda char(3) not null default 'BRL' check (moeda in ('BRL', 'USD', 'EUR')),
  termos_aceitos_em timestamptz,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);

create table public.empresas (
  id uuid primary key default gen_random_uuid(),
  dono_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  nome text not null check (char_length(btrim(nome)) between 1 and 80),
  tipo public.tipo_entidade not null default 'empresa',
  cor text not null default 'esmeralda' check (cor ~ '^[a-z]{3,16}$'),
  icone text not null default 'building-2' check (icone ~ '^[a-z0-9-]{1,32}$'),
  participacao numeric(5, 2) not null default 100 check (participacao > 0 and participacao <= 100),
  documento text check (char_length(documento) <= 20),
  descricao text check (char_length(descricao) <= 280),
  meta_mensal numeric(14, 2) check (meta_mensal >= 0),
  arquivada boolean not null default false,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now(),
  unique (id, dono_id)
);

create table public.categorias (
  id uuid primary key default gen_random_uuid(),
  dono_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  nome text not null check (char_length(btrim(nome)) between 1 and 40),
  tipo public.tipo_lancamento not null,
  cor text not null default 'ardosia' check (cor ~ '^[a-z]{3,16}$'),
  criado_em timestamptz not null default now(),
  unique (dono_id, tipo, nome),
  unique (id, dono_id)
);

create table public.funcionarios (
  id uuid primary key default gen_random_uuid(),
  dono_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  empresa_id uuid not null,
  nome text not null check (char_length(btrim(nome)) between 1 and 120),
  cargo text check (char_length(cargo) <= 80),
  tipo_contrato public.tipo_contrato not null default 'clt',
  salario numeric(14, 2) not null check (salario >= 0 and salario <= 99999999),
  dia_pagamento smallint not null default 5 check (dia_pagamento between 1 and 31),
  admitido_em date,
  ativo boolean not null default true,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now(),
  foreign key (empresa_id, dono_id) references public.empresas (id, dono_id) on delete cascade,
  unique (id, dono_id)
);

create table public.recorrencias (
  id uuid primary key default gen_random_uuid(),
  dono_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  empresa_id uuid,
  categoria_id uuid,
  tipo public.tipo_lancamento not null,
  descricao text not null check (char_length(btrim(descricao)) between 1 and 140),
  valor numeric(14, 2) not null check (valor > 0 and valor <= 999999999999),
  frequencia public.frequencia_recorrencia not null default 'mensal',
  inicio_em date not null default current_date,
  fim_em date,
  ocorrencias integer not null default 0 check (ocorrencias >= 0),
  proxima_em date not null default current_date,
  custo_fixo boolean not null default false,
  ativa boolean not null default true,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now(),
  check (fim_em is null or fim_em >= inicio_em),
  foreign key (empresa_id, dono_id) references public.empresas (id, dono_id) on delete cascade,
  foreign key (categoria_id, dono_id) references public.categorias (id, dono_id) on delete set null (categoria_id),
  unique (id, dono_id)
);

create table public.folhas_pagamento (
  id uuid primary key default gen_random_uuid(),
  dono_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  empresa_id uuid not null,
  competencia date not null check (extract(day from competencia) = 1),
  status public.status_folha not null default 'aberta',
  total numeric(14, 2) not null default 0,
  paga_em date,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now(),
  foreign key (empresa_id, dono_id) references public.empresas (id, dono_id) on delete cascade,
  unique (empresa_id, competencia),
  unique (id, dono_id)
);

create table public.itens_folha (
  id uuid primary key default gen_random_uuid(),
  dono_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  folha_id uuid not null,
  funcionario_id uuid,
  nome text not null check (char_length(btrim(nome)) between 1 and 120),
  cargo text check (char_length(cargo) <= 80),
  salario_base numeric(14, 2) not null check (salario_base >= 0),
  adicionais numeric(14, 2) not null default 0 check (adicionais >= 0),
  descontos numeric(14, 2) not null default 0 check (descontos >= 0),
  liquido numeric(14, 2) generated always as (salario_base + adicionais - descontos) stored,
  criado_em timestamptz not null default now(),
  check (salario_base + adicionais - descontos >= 0),
  foreign key (folha_id, dono_id) references public.folhas_pagamento (id, dono_id) on delete cascade,
  foreign key (funcionario_id, dono_id) references public.funcionarios (id, dono_id) on delete set null (funcionario_id),
  unique (folha_id, funcionario_id)
);

create table public.lancamentos (
  id uuid primary key default gen_random_uuid(),
  dono_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  empresa_id uuid,
  categoria_id uuid,
  recorrencia_id uuid,
  folha_id uuid,
  tipo public.tipo_lancamento not null,
  descricao text not null check (char_length(btrim(descricao)) between 1 and 140),
  valor numeric(14, 2) not null check (valor > 0 and valor <= 999999999999),
  data date not null default current_date,
  pago boolean not null default true,
  origem public.origem_lancamento not null default 'manual',
  observacoes text check (char_length(observacoes) <= 500),
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now(),
  foreign key (empresa_id, dono_id) references public.empresas (id, dono_id) on delete cascade,
  foreign key (categoria_id, dono_id) references public.categorias (id, dono_id) on delete set null (categoria_id),
  foreign key (recorrencia_id, dono_id) references public.recorrencias (id, dono_id) on delete set null (recorrencia_id),
  foreign key (folha_id, dono_id) references public.folhas_pagamento (id, dono_id) on delete cascade,
  unique (recorrencia_id, data)
);

create table public.chaves_api (
  id uuid primary key default gen_random_uuid(),
  dono_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  nome text not null check (char_length(btrim(nome)) between 1 and 60),
  prefixo text not null unique,
  hash text not null unique,
  escopos text[] not null default array['lancamentos:ler', 'lancamentos:escrever', 'resumo:ler'],
  empresa_padrao_id uuid,
  ultimo_uso_em timestamptz,
  expira_em timestamptz,
  revogada_em timestamptz,
  criado_em timestamptz not null default now(),
  check (escopos <@ array['lancamentos:ler', 'lancamentos:escrever', 'resumo:ler', 'empresas:ler']),
  check (cardinality(escopos) > 0),
  foreign key (empresa_padrao_id, dono_id) references public.empresas (id, dono_id) on delete set null (empresa_padrao_id)
);

create table public.registros_api (
  id bigint generated always as identity primary key,
  dono_id uuid not null references auth.users (id) on delete cascade,
  chave_id uuid references public.chaves_api (id) on delete set null,
  metodo text not null,
  rota text not null,
  status smallint not null,
  criado_em timestamptz not null default now()
);

create table privado.limites_api (
  chave_id uuid not null references public.chaves_api (id) on delete cascade,
  janela timestamptz not null,
  contagem integer not null default 0,
  primary key (chave_id, janela)
);

create index empresas_dono_idx on public.empresas (dono_id);
create index categorias_dono_idx on public.categorias (dono_id);
create index funcionarios_empresa_idx on public.funcionarios (empresa_id);
create index funcionarios_dono_idx on public.funcionarios (dono_id);
create index recorrencias_dono_proxima_idx on public.recorrencias (dono_id, proxima_em) where ativa;
create index recorrencias_processamento_idx on public.recorrencias (proxima_em) where ativa;
create index recorrencias_empresa_idx on public.recorrencias (empresa_id);
create index recorrencias_categoria_idx on public.recorrencias (categoria_id);
create index folhas_dono_idx on public.folhas_pagamento (dono_id);
create index itens_folha_folha_idx on public.itens_folha (folha_id);
create index itens_folha_funcionario_idx on public.itens_folha (funcionario_id);
create index itens_folha_dono_idx on public.itens_folha (dono_id);
create index lancamentos_dono_data_idx on public.lancamentos (dono_id, data desc);
create index lancamentos_empresa_data_idx on public.lancamentos (empresa_id, data desc);
create index lancamentos_categoria_idx on public.lancamentos (categoria_id);
create index lancamentos_folha_idx on public.lancamentos (folha_id);
create index chaves_api_dono_idx on public.chaves_api (dono_id);
create index chaves_api_empresa_idx on public.chaves_api (empresa_padrao_id);
create index registros_api_dono_idx on public.registros_api (dono_id, criado_em desc);
create index registros_api_chave_idx on public.registros_api (chave_id);
create index registros_api_criado_idx on public.registros_api (criado_em);
create index limites_api_janela_idx on privado.limites_api (janela);

create trigger perfis_atualizado_em before update on public.perfis
  for each row execute function privado.definir_atualizado_em();
create trigger empresas_atualizado_em before update on public.empresas
  for each row execute function privado.definir_atualizado_em();
create trigger funcionarios_atualizado_em before update on public.funcionarios
  for each row execute function privado.definir_atualizado_em();
create trigger folhas_atualizado_em before update on public.folhas_pagamento
  for each row execute function privado.definir_atualizado_em();
create trigger lancamentos_atualizado_em before update on public.lancamentos
  for each row execute function privado.definir_atualizado_em();

create or replace function public.data_ocorrencia(p_inicio date, p_frequencia public.frequencia_recorrencia, p_indice integer)
returns date
language sql
immutable
set search_path = ''
as $$
  select (p_inicio + case p_frequencia
    when 'semanal' then make_interval(weeks => p_indice)
    when 'quinzenal' then make_interval(weeks => 2 * p_indice)
    when 'mensal' then make_interval(months => p_indice)
    when 'trimestral' then make_interval(months => 3 * p_indice)
    when 'anual' then make_interval(years => p_indice)
  end)::date
$$;

create or replace function privado.preparar_recorrencia()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if tg_op = 'UPDATE' and (new.inicio_em is distinct from old.inicio_em or new.frequencia is distinct from old.frequencia) then
    new.ocorrencias := 0;
    while public.data_ocorrencia(new.inicio_em, new.frequencia, new.ocorrencias) < current_date and new.ocorrencias < 1000 loop
      new.ocorrencias := new.ocorrencias + 1;
    end loop;
  end if;
  new.proxima_em := public.data_ocorrencia(new.inicio_em, new.frequencia, new.ocorrencias);
  if new.fim_em is not null and new.proxima_em > new.fim_em then
    new.ativa := false;
  end if;
  new.atualizado_em := now();
  return new;
end;
$$;

create trigger recorrencias_preparar before insert or update on public.recorrencias
  for each row execute function privado.preparar_recorrencia();

create or replace function privado.criar_perfil_usuario()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_base text;
  v_avatar text;
begin
  v_base := regexp_replace(lower(split_part(coalesce(new.email, ''), '@', 1)), '[^a-z0-9_.]', '', 'g');
  if char_length(v_base) < 3 then
    v_base := 'gato' || v_base;
  end if;
  v_base := left(v_base, 22);
  v_avatar := coalesce(new.raw_user_meta_data ->> 'avatar_url', new.raw_user_meta_data ->> 'picture');

  insert into public.perfis (id, nome, usuario, avatar_url, termos_aceitos_em)
  values (
    new.id,
    left(coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name', new.raw_user_meta_data ->> 'nome'), 120),
    v_base || '_' || substr(replace(new.id::text, '-', ''), 1, 6),
    case when v_avatar ~ '^https://' and char_length(v_avatar) <= 1024 then v_avatar end,
    case when (new.raw_user_meta_data ->> 'termos_aceitos')::boolean is true then now() end
  );

  insert into public.categorias (dono_id, nome, tipo, cor)
  values
    (new.id, 'Salário', 'receita', 'esmeralda'),
    (new.id, 'Freelance', 'receita', 'ciano'),
    (new.id, 'Vendas', 'receita', 'azul'),
    (new.id, 'Investimentos', 'receita', 'verde'),
    (new.id, 'Outras receitas', 'receita', 'ardosia'),
    (new.id, 'Moradia', 'despesa', 'laranja'),
    (new.id, 'Alimentação', 'despesa', 'ambar'),
    (new.id, 'Transporte', 'despesa', 'azul'),
    (new.id, 'Saúde', 'despesa', 'rosa'),
    (new.id, 'Lazer', 'despesa', 'rosa'),
    (new.id, 'Educação', 'despesa', 'ciano'),
    (new.id, 'Assinaturas', 'despesa', 'grafite'),
    (new.id, 'Impostos', 'despesa', 'vermelho'),
    (new.id, 'Folha de pagamento', 'despesa', 'esmeralda'),
    (new.id, 'Fornecedores', 'despesa', 'ambar'),
    (new.id, 'Marketing', 'despesa', 'laranja'),
    (new.id, 'Outras despesas', 'despesa', 'ardosia');

  return new;
end;
$$;

create trigger ao_criar_usuario after insert on auth.users
  for each row execute function privado.criar_perfil_usuario();

create or replace function privado.sincronizar_avatar_usuario()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_avatar text := coalesce(new.raw_user_meta_data ->> 'avatar_url', new.raw_user_meta_data ->> 'picture');
  v_nome text := coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name');
begin
  update public.perfis
  set
    avatar_url = coalesce(avatar_url, case when v_avatar ~ '^https://' and char_length(v_avatar) <= 1024 then v_avatar end),
    nome = coalesce(nome, left(v_nome, 120))
  where id = new.id
    and (avatar_url is null or nome is null);
  return new;
end;
$$;

create trigger ao_atualizar_metadados_usuario after update of raw_user_meta_data on auth.users
  for each row
  when (old.raw_user_meta_data is distinct from new.raw_user_meta_data)
  execute function privado.sincronizar_avatar_usuario();

create or replace function privado.proteger_folha_paga()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  v_folha uuid := coalesce(new.folha_id, old.folha_id);
begin
  if exists (select 1 from public.folhas_pagamento where id = v_folha and status = 'paga') then
    raise exception 'A folha já foi paga. Reabra a folha para editar.' using errcode = 'P0001';
  end if;
  return coalesce(new, old);
end;
$$;

create trigger itens_folha_proteger before insert or update or delete on public.itens_folha
  for each row execute function privado.proteger_folha_paga();

create or replace function privado.recalcular_total_folha()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_folha uuid := coalesce(new.folha_id, old.folha_id);
begin
  update public.folhas_pagamento
  set total = coalesce((select sum(liquido) from public.itens_folha where folha_id = v_folha), 0)
  where id = v_folha;
  return null;
end;
$$;

create trigger itens_folha_total after insert or update or delete on public.itens_folha
  for each row execute function privado.recalcular_total_folha();

alter table public.perfis enable row level security;
alter table public.empresas enable row level security;
alter table public.categorias enable row level security;
alter table public.funcionarios enable row level security;
alter table public.recorrencias enable row level security;
alter table public.folhas_pagamento enable row level security;
alter table public.itens_folha enable row level security;
alter table public.lancamentos enable row level security;
alter table public.chaves_api enable row level security;
alter table public.registros_api enable row level security;
alter table privado.limites_api enable row level security;

create policy "perfis_ler_proprio" on public.perfis
  for select to authenticated using (id = (select auth.uid()));
create policy "perfis_atualizar_proprio" on public.perfis
  for update to authenticated using (id = (select auth.uid())) with check (id = (select auth.uid()));

do $$
declare
  v_tabela text;
begin
  foreach v_tabela in array array['empresas', 'categorias', 'funcionarios', 'recorrencias', 'folhas_pagamento', 'itens_folha', 'lancamentos']
  loop
    execute format('create policy %I on public.%I for select to authenticated using (dono_id = (select auth.uid()))', v_tabela || '_ler_proprio', v_tabela);
    execute format('create policy %I on public.%I for insert to authenticated with check (dono_id = (select auth.uid()))', v_tabela || '_inserir_proprio', v_tabela);
    execute format('create policy %I on public.%I for update to authenticated using (dono_id = (select auth.uid())) with check (dono_id = (select auth.uid()))', v_tabela || '_atualizar_proprio', v_tabela);
    execute format('create policy %I on public.%I for delete to authenticated using (dono_id = (select auth.uid()))', v_tabela || '_excluir_proprio', v_tabela);
  end loop;
end;
$$;

create policy "chaves_api_ler_proprio" on public.chaves_api
  for select to authenticated using (dono_id = (select auth.uid()));
create policy "chaves_api_atualizar_proprio" on public.chaves_api
  for update to authenticated using (dono_id = (select auth.uid())) with check (dono_id = (select auth.uid()));
create policy "chaves_api_excluir_proprio" on public.chaves_api
  for delete to authenticated using (dono_id = (select auth.uid()));

create policy "registros_api_ler_proprio" on public.registros_api
  for select to authenticated using (dono_id = (select auth.uid()));

revoke all on all tables in schema public from anon;
revoke all on all sequences in schema public from anon;
revoke insert, delete on public.perfis from authenticated;
revoke update on public.perfis from authenticated;
grant update (nome, usuario, avatar_url, moeda, termos_aceitos_em) on public.perfis to authenticated;
revoke insert, update on public.chaves_api from authenticated;
grant update (nome, empresa_padrao_id) on public.chaves_api to authenticated;
revoke insert, update, delete on public.registros_api from authenticated;
revoke update on public.folhas_pagamento from authenticated;

drop policy "folhas_pagamento_atualizar_proprio" on public.folhas_pagamento;
drop policy "folhas_pagamento_excluir_proprio" on public.folhas_pagamento;
create policy "folhas_pagamento_excluir_aberta" on public.folhas_pagamento
  for delete to authenticated using (dono_id = (select auth.uid()) and status = 'aberta');
alter default privileges in schema public revoke all on tables from anon;
alter default privileges in schema public revoke execute on functions from anon, public;
