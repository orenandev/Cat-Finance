create or replace function privado.processar_recorrencias(p_dono uuid default null, p_ate date default current_date)
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_recorrencia public.recorrencias%rowtype;
  v_data date;
  v_gerados integer := 0;
  v_guarda integer;
begin
  for v_recorrencia in
    select *
    from public.recorrencias
    where ativa
      and proxima_em <= p_ate
      and (p_dono is null or dono_id = p_dono)
    for update skip locked
  loop
    v_guarda := 0;
    v_data := v_recorrencia.proxima_em;

    while v_data <= p_ate
      and (v_recorrencia.fim_em is null or v_data <= v_recorrencia.fim_em)
      and v_guarda < 400
    loop
      insert into public.lancamentos (dono_id, empresa_id, categoria_id, recorrencia_id, tipo, descricao, valor, data, origem)
      values (
        v_recorrencia.dono_id,
        v_recorrencia.empresa_id,
        v_recorrencia.categoria_id,
        v_recorrencia.id,
        v_recorrencia.tipo,
        v_recorrencia.descricao,
        v_recorrencia.valor,
        v_data,
        'recorrencia'
      )
      on conflict (recorrencia_id, data) do nothing;

      v_gerados := v_gerados + 1;
      v_guarda := v_guarda + 1;
      v_recorrencia.ocorrencias := v_recorrencia.ocorrencias + 1;
      v_data := public.data_ocorrencia(v_recorrencia.inicio_em, v_recorrencia.frequencia, v_recorrencia.ocorrencias);
    end loop;

    update public.recorrencias
    set ocorrencias = v_recorrencia.ocorrencias
    where id = v_recorrencia.id;
  end loop;

  return v_gerados;
end;
$$;

create or replace function public.sincronizar_recorrencias()
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_dono uuid := (select auth.uid());
begin
  if v_dono is null then
    raise exception 'Sessão inválida' using errcode = '42501';
  end if;
  return privado.processar_recorrencias(v_dono, current_date);
end;
$$;

create or replace function privado.validar_periodo(p_inicio date, p_fim date)
returns void
language plpgsql
immutable
set search_path = ''
as $$
begin
  if p_inicio is null or p_fim is null or p_fim < p_inicio or p_fim - p_inicio > 1830 then
    raise exception 'Período inválido' using errcode = '22023';
  end if;
end;
$$;

create or replace function public.resumo_periodo(p_inicio date, p_fim date)
returns jsonb
language plpgsql
stable
security invoker
set search_path = ''
as $$
declare
  v_dono uuid := (select auth.uid());
  v_resumo jsonb;
begin
  if v_dono is null then
    raise exception 'Sessão inválida' using errcode = '42501';
  end if;
  perform privado.validar_periodo(p_inicio, p_fim);

  with base as (
    select
      l.empresa_id,
      l.tipo,
      l.valor,
      l.data,
      case
        when l.empresa_id is null then 0
        else (case l.tipo when 'receita' then l.valor else -l.valor end) * e.participacao / 100
      end as parcela
    from public.lancamentos l
    left join public.empresas e on e.id = l.empresa_id
    where l.dono_id = v_dono
      and l.pago
      and l.data between p_inicio and p_fim
  ),
  por_empresa as (
    select
      e.id,
      e.nome,
      e.tipo,
      e.cor,
      e.icone,
      e.participacao,
      e.arquivada,
      e.criado_em,
      coalesce(sum(b.valor) filter (where b.tipo = 'receita'), 0) as receitas,
      coalesce(sum(b.valor) filter (where b.tipo = 'despesa'), 0) as despesas,
      coalesce(sum(b.parcela), 0) as para_voce
    from public.empresas e
    left join base b on b.empresa_id = e.id
    where e.dono_id = v_dono
    group by e.id
  ),
  serie as (
    select
      d::date as data,
      coalesce(sum(b.valor) filter (where b.empresa_id is null and b.tipo = 'receita'), 0) as receitas,
      coalesce(sum(b.valor) filter (where b.empresa_id is null and b.tipo = 'despesa'), 0) as despesas,
      coalesce(sum(b.parcela), 0) as das_empresas
    from generate_series(p_inicio, p_fim, interval '1 day') d
    left join base b on b.data = d::date
    group by d
  )
  select jsonb_build_object(
    'receitas', coalesce((select sum(valor) from base where empresa_id is null and tipo = 'receita'), 0),
    'despesas', coalesce((select sum(valor) from base where empresa_id is null and tipo = 'despesa'), 0),
    'vindo_empresas', coalesce((select sum(parcela) from base), 0),
    'empresas', coalesce((
      select jsonb_agg(
        jsonb_build_object(
          'id', x.id,
          'nome', x.nome,
          'tipo', x.tipo,
          'cor', x.cor,
          'icone', x.icone,
          'participacao', x.participacao,
          'arquivada', x.arquivada,
          'receitas', x.receitas,
          'despesas', x.despesas,
          'lucro', x.receitas - x.despesas,
          'para_voce', x.para_voce
        )
        order by x.criado_em
      )
      from por_empresa x
    ), '[]'::jsonb),
    'serie', coalesce((
      select jsonb_agg(
        jsonb_build_object(
          'data', s.data,
          'receitas', s.receitas,
          'despesas', s.despesas,
          'das_empresas', s.das_empresas,
          'resultado', s.receitas - s.despesas + s.das_empresas
        )
        order by s.data
      )
      from serie s
    ), '[]'::jsonb)
  )
  into v_resumo;

  return v_resumo;
end;
$$;

create or replace function public.resumo_empresa(p_empresa uuid, p_inicio date, p_fim date)
returns jsonb
language plpgsql
stable
security invoker
set search_path = ''
as $$
declare
  v_dono uuid := (select auth.uid());
  v_empresa public.empresas%rowtype;
  v_resumo jsonb;
begin
  if v_dono is null then
    raise exception 'Sessão inválida' using errcode = '42501';
  end if;
  perform privado.validar_periodo(p_inicio, p_fim);

  select * into v_empresa from public.empresas where id = p_empresa and dono_id = v_dono;
  if not found then
    raise exception 'Empresa não encontrada' using errcode = 'P0002';
  end if;

  with base as (
    select l.tipo, l.valor, l.data, l.categoria_id
    from public.lancamentos l
    where l.dono_id = v_dono
      and l.empresa_id = p_empresa
      and l.pago
      and l.data between p_inicio and p_fim
  ),
  serie as (
    select
      d::date as data,
      coalesce(sum(b.valor) filter (where b.tipo = 'receita'), 0) as receitas,
      coalesce(sum(b.valor) filter (where b.tipo = 'despesa'), 0) as despesas
    from generate_series(p_inicio, p_fim, interval '1 day') d
    left join base b on b.data = d::date
    group by d
  ),
  por_categoria as (
    select
      b.tipo,
      coalesce(c.nome, 'Sem categoria') as nome,
      coalesce(c.cor, 'ardosia') as cor,
      sum(b.valor) as total
    from base b
    left join public.categorias c on c.id = b.categoria_id
    group by b.tipo, c.nome, c.cor
  )
  select jsonb_build_object(
    'receitas', coalesce((select sum(valor) from base where tipo = 'receita'), 0),
    'despesas', coalesce((select sum(valor) from base where tipo = 'despesa'), 0),
    'participacao', v_empresa.participacao,
    'custos_fixos_mensais', coalesce((
      select sum(
        r.valor * case r.frequencia
          when 'semanal' then 52.0 / 12
          when 'quinzenal' then 26.0 / 12
          when 'mensal' then 1
          when 'trimestral' then 1.0 / 3
          when 'anual' then 1.0 / 12
        end
      )
      from public.recorrencias r
      where r.empresa_id = p_empresa and r.dono_id = v_dono and r.ativa and r.tipo = 'despesa' and r.custo_fixo
    ), 0),
    'folha_mensal', coalesce((
      select sum(f.salario)
      from public.funcionarios f
      where f.empresa_id = p_empresa and f.dono_id = v_dono and f.ativo
    ), 0),
    'funcionarios_ativos', (
      select count(*)
      from public.funcionarios f
      where f.empresa_id = p_empresa and f.dono_id = v_dono and f.ativo
    ),
    'por_categoria', coalesce((
      select jsonb_agg(jsonb_build_object('tipo', pc.tipo, 'nome', pc.nome, 'cor', pc.cor, 'total', pc.total) order by pc.total desc)
      from por_categoria pc
    ), '[]'::jsonb),
    'serie', coalesce((
      select jsonb_agg(
        jsonb_build_object('data', s.data, 'receitas', s.receitas, 'despesas', s.despesas, 'lucro', s.receitas - s.despesas)
        order by s.data
      )
      from serie s
    ), '[]'::jsonb)
  )
  into v_resumo;

  return v_resumo;
end;
$$;

create or replace function public.totais_por_categoria(p_inicio date, p_fim date, p_empresa uuid default null)
returns table (tipo public.tipo_lancamento, categoria_id uuid, nome text, cor text, total numeric, quantidade bigint)
language plpgsql
stable
security invoker
set search_path = ''
as $$
begin
  perform privado.validar_periodo(p_inicio, p_fim);

  return query
  select
    l.tipo,
    l.categoria_id,
    coalesce(c.nome, 'Sem categoria'),
    coalesce(c.cor, 'ardosia'),
    sum(l.valor),
    count(*)
  from public.lancamentos l
  left join public.categorias c on c.id = l.categoria_id
  where l.dono_id = (select auth.uid())
    and l.pago
    and l.data between p_inicio and p_fim
    and l.empresa_id is not distinct from p_empresa
  group by l.tipo, l.categoria_id, c.nome, c.cor
  order by sum(l.valor) desc;
end;
$$;

create or replace function public.gerar_folha(p_empresa uuid, p_competencia date)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_dono uuid := (select auth.uid());
  v_competencia date := date_trunc('month', p_competencia)::date;
  v_folha public.folhas_pagamento%rowtype;
begin
  if v_dono is null then
    raise exception 'Sessão inválida' using errcode = '42501';
  end if;
  if not exists (select 1 from public.empresas where id = p_empresa and dono_id = v_dono) then
    raise exception 'Empresa não encontrada' using errcode = 'P0002';
  end if;
  if v_competencia < date '2000-01-01' or v_competencia > (current_date + interval '1 year') then
    raise exception 'Competência inválida' using errcode = '22023';
  end if;

  insert into public.folhas_pagamento (dono_id, empresa_id, competencia)
  values (v_dono, p_empresa, v_competencia)
  on conflict (empresa_id, competencia) do nothing;

  select * into v_folha
  from public.folhas_pagamento
  where empresa_id = p_empresa and competencia = v_competencia and dono_id = v_dono;

  if v_folha.status = 'aberta' then
    insert into public.itens_folha (dono_id, folha_id, funcionario_id, nome, cargo, salario_base)
    select v_dono, v_folha.id, f.id, f.nome, f.cargo, f.salario
    from public.funcionarios f
    where f.empresa_id = p_empresa
      and f.dono_id = v_dono
      and f.ativo
      and (f.admitido_em is null or f.admitido_em < (v_competencia + interval '1 month'))
    on conflict (folha_id, funcionario_id) do nothing;
  end if;

  return v_folha.id;
end;
$$;

create or replace function public.pagar_folha(p_folha uuid, p_data date default current_date)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_dono uuid := (select auth.uid());
  v_folha public.folhas_pagamento%rowtype;
  v_categoria uuid;
  v_lancamento uuid;
begin
  if v_dono is null then
    raise exception 'Sessão inválida' using errcode = '42501';
  end if;

  select * into v_folha
  from public.folhas_pagamento
  where id = p_folha and dono_id = v_dono
  for update;

  if not found then
    raise exception 'Folha não encontrada' using errcode = 'P0002';
  end if;
  if v_folha.status = 'paga' then
    raise exception 'Esta folha já foi paga' using errcode = 'P0001';
  end if;
  if v_folha.total <= 0 then
    raise exception 'A folha não possui valores a pagar' using errcode = 'P0001';
  end if;

  select id into v_categoria
  from public.categorias
  where dono_id = v_dono and tipo = 'despesa' and nome = 'Folha de pagamento'
  limit 1;

  insert into public.lancamentos (dono_id, empresa_id, categoria_id, folha_id, tipo, descricao, valor, data, origem)
  values (
    v_dono,
    v_folha.empresa_id,
    v_categoria,
    v_folha.id,
    'despesa',
    'Folha de pagamento ' || to_char(v_folha.competencia, 'MM/YYYY'),
    v_folha.total,
    coalesce(p_data, current_date),
    'folha'
  )
  returning id into v_lancamento;

  update public.folhas_pagamento
  set status = 'paga', paga_em = coalesce(p_data, current_date)
  where id = v_folha.id;

  return v_lancamento;
end;
$$;

create or replace function public.reabrir_folha(p_folha uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_dono uuid := (select auth.uid());
begin
  if v_dono is null then
    raise exception 'Sessão inválida' using errcode = '42501';
  end if;

  update public.folhas_pagamento
  set status = 'aberta', paga_em = null
  where id = p_folha and dono_id = v_dono and status = 'paga';

  if not found then
    raise exception 'Folha não encontrada ou já aberta' using errcode = 'P0002';
  end if;

  delete from public.lancamentos
  where folha_id = p_folha and dono_id = v_dono and origem = 'folha';
end;
$$;

create or replace function public.criar_chave_api(
  p_nome text,
  p_escopos text[],
  p_empresa_padrao uuid default null,
  p_expira_em timestamptz default null
)
returns table (id uuid, chave text, prefixo text)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_dono uuid := (select auth.uid());
  v_prefixo text;
  v_chave text;
  v_id uuid;
begin
  if v_dono is null then
    raise exception 'Sessão inválida' using errcode = '42501';
  end if;
  if p_nome is null or char_length(btrim(p_nome)) not between 1 and 60 then
    raise exception 'Nome da chave inválido' using errcode = '22023';
  end if;
  if p_expira_em is not null and p_expira_em <= now() then
    raise exception 'A expiração deve ser futura' using errcode = '22023';
  end if;
  if (
    select count(*)
    from public.chaves_api c
    where c.dono_id = v_dono and c.revogada_em is null and (c.expira_em is null or c.expira_em > now())
  ) >= 10 then
    raise exception 'Limite de 10 chaves ativas atingido' using errcode = 'P0001';
  end if;
  if p_empresa_padrao is not null and not exists (
    select 1 from public.empresas e where e.id = p_empresa_padrao and e.dono_id = v_dono
  ) then
    raise exception 'Empresa não encontrada' using errcode = 'P0002';
  end if;

  v_prefixo := encode(extensions.gen_random_bytes(4), 'hex');
  v_chave := 'cat_live_' || v_prefixo || '_' || encode(extensions.gen_random_bytes(24), 'hex');

  insert into public.chaves_api (dono_id, nome, prefixo, hash, escopos, empresa_padrao_id, expira_em)
  values (
    v_dono,
    btrim(p_nome),
    v_prefixo,
    encode(extensions.digest(v_chave, 'sha256'), 'hex'),
    (select array_agg(distinct e) from unnest(p_escopos) e),
    p_empresa_padrao,
    p_expira_em
  )
  returning chaves_api.id into v_id;

  return query select v_id, v_chave, v_prefixo;
end;
$$;

create or replace function public.revogar_chave_api(p_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.chaves_api
  set revogada_em = now()
  where id = p_id and dono_id = (select auth.uid()) and revogada_em is null;

  if not found then
    raise exception 'Chave não encontrada' using errcode = 'P0002';
  end if;
end;
$$;

create or replace function public.api_autenticar(p_hash text, p_limite integer default 60)
returns table (
  chave_id uuid,
  dono_id uuid,
  escopos text[],
  empresa_padrao_id uuid,
  permitido boolean,
  restantes integer,
  reinicia_em timestamptz
)
language plpgsql
security definer
set search_path = ''
as $$
#variable_conflict use_column
declare
  v_chave public.chaves_api%rowtype;
  v_janela timestamptz := date_trunc('minute', now());
  v_contagem integer;
begin
  if p_hash !~ '^[0-9a-f]{64}$' then
    return;
  end if;

  select * into v_chave
  from public.chaves_api c
  where c.hash = p_hash
    and c.revogada_em is null
    and (c.expira_em is null or c.expira_em > now());

  if not found then
    return;
  end if;

  insert into privado.limites_api as l (chave_id, janela, contagem)
  values (v_chave.id, v_janela, 1)
  on conflict (chave_id, janela) do update set contagem = l.contagem + 1
  returning l.contagem into v_contagem;

  if v_chave.ultimo_uso_em is null or v_chave.ultimo_uso_em < now() - interval '1 minute' then
    update public.chaves_api set ultimo_uso_em = now() where id = v_chave.id;
  end if;

  return query select
    v_chave.id,
    v_chave.dono_id,
    v_chave.escopos,
    v_chave.empresa_padrao_id,
    v_contagem <= p_limite,
    greatest(p_limite - v_contagem, 0),
    v_janela + interval '1 minute';
end;
$$;

create or replace function public.exportar_dados()
returns jsonb
language plpgsql
stable
security invoker
set search_path = ''
as $$
declare
  v_dono uuid := (select auth.uid());
begin
  if v_dono is null then
    raise exception 'Sessão inválida' using errcode = '42501';
  end if;

  return jsonb_build_object(
    'exportado_em', now(),
    'perfil', (select to_jsonb(p) from public.perfis p where p.id = v_dono),
    'empresas', coalesce((select jsonb_agg(to_jsonb(e)) from public.empresas e where e.dono_id = v_dono), '[]'::jsonb),
    'categorias', coalesce((select jsonb_agg(to_jsonb(c)) from public.categorias c where c.dono_id = v_dono), '[]'::jsonb),
    'lancamentos', coalesce((select jsonb_agg(to_jsonb(l) order by l.data) from public.lancamentos l where l.dono_id = v_dono), '[]'::jsonb),
    'recorrencias', coalesce((select jsonb_agg(to_jsonb(r)) from public.recorrencias r where r.dono_id = v_dono), '[]'::jsonb),
    'funcionarios', coalesce((select jsonb_agg(to_jsonb(f)) from public.funcionarios f where f.dono_id = v_dono), '[]'::jsonb),
    'folhas_pagamento', coalesce((select jsonb_agg(to_jsonb(fp)) from public.folhas_pagamento fp where fp.dono_id = v_dono), '[]'::jsonb),
    'itens_folha', coalesce((select jsonb_agg(to_jsonb(i)) from public.itens_folha i where i.dono_id = v_dono), '[]'::jsonb),
    'chaves_api', coalesce((
      select jsonb_agg(to_jsonb(k) - 'hash')
      from public.chaves_api k
      where k.dono_id = v_dono
    ), '[]'::jsonb)
  );
end;
$$;

create or replace function privado.limpar_dados_api()
returns void
language sql
security definer
set search_path = ''
as $$
  delete from privado.limites_api where janela < now() - interval '1 hour';
  delete from public.registros_api where criado_em < now() - interval '90 days';
$$;

revoke all on all functions in schema privado from public, anon, authenticated;
revoke execute on function public.data_ocorrencia(date, public.frequencia_recorrencia, integer) from public, anon;
revoke execute on function public.sincronizar_recorrencias() from public, anon;
revoke execute on function public.resumo_periodo(date, date) from public, anon;
revoke execute on function public.resumo_empresa(uuid, date, date) from public, anon;
revoke execute on function public.totais_por_categoria(date, date, uuid) from public, anon;
revoke execute on function public.gerar_folha(uuid, date) from public, anon;
revoke execute on function public.pagar_folha(uuid, date) from public, anon;
revoke execute on function public.reabrir_folha(uuid) from public, anon;
revoke execute on function public.criar_chave_api(text, text[], uuid, timestamptz) from public, anon;
revoke execute on function public.revogar_chave_api(uuid) from public, anon;
revoke execute on function public.api_autenticar(text, integer) from public, anon, authenticated;
revoke execute on function public.exportar_dados() from public, anon;

grant usage on schema privado to authenticated;
grant execute on function privado.validar_periodo(date, date) to authenticated;
grant execute on function public.data_ocorrencia(date, public.frequencia_recorrencia, integer) to authenticated;
grant execute on function public.sincronizar_recorrencias() to authenticated;
grant execute on function public.resumo_periodo(date, date) to authenticated;
grant execute on function public.resumo_empresa(uuid, date, date) to authenticated;
grant execute on function public.totais_por_categoria(date, date, uuid) to authenticated;
grant execute on function public.gerar_folha(uuid, date) to authenticated;
grant execute on function public.pagar_folha(uuid, date) to authenticated;
grant execute on function public.reabrir_folha(uuid) to authenticated;
grant execute on function public.criar_chave_api(text, text[], uuid, timestamptz) to authenticated;
grant execute on function public.revogar_chave_api(uuid) to authenticated;
grant execute on function public.exportar_dados() to authenticated;
grant execute on function public.api_autenticar(text, integer) to service_role;
