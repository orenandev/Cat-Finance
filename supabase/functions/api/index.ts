import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import { createClient, type SupabaseClient } from 'jsr:@supabase/supabase-js@2'
import type { z } from 'npm:zod@4.1.12'
import {
  esquemaFiltroLancamentos,
  esquemaLancamentoTexto,
  esquemaNovoLancamento,
  esquemaPeriodo,
  formatarErrosValidacao,
  type NovoLancamento,
} from './esquemas.ts'
import { ErroApi, cabecalhosCors, gerarHash, lerCorpoJson, responder, responderErro } from './http.ts'
import { hojeNoBrasil, interpretarTexto } from './interpretador.ts'

type Escopo = 'lancamentos:ler' | 'lancamentos:escrever' | 'resumo:ler' | 'empresas:ler'

interface Credencial {
  chave_id: string
  dono_id: string
  escopos: Escopo[]
  empresa_padrao_id: string | null
  permitido: boolean
  restantes: number
  reinicia_em: string
}

interface Contexto {
  credencial: Credencial
  banco: SupabaseClient
  url: URL
  requisicao: Request
}

const LIMITE_POR_MINUTO = 60
const LIMITE_FALHAS_POR_IP = 20
const PERIODO_MAXIMO_DIAS = 366
const COLUNAS_LANCAMENTO = 'id, tipo, descricao, valor, data, pago, origem, empresa_id, categoria_id, observacoes, criado_em'

const banco = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, {
  auth: { persistSession: false, autoRefreshToken: false },
})

const falhasPorIp = new Map<string, { contagem: number; expiraEm: number }>()

function registrarFalha(ip: string) {
  const agora = Date.now()
  const atual = falhasPorIp.get(ip)
  if (!atual || atual.expiraEm < agora) {
    falhasPorIp.set(ip, { contagem: 1, expiraEm: agora + 60_000 })
  } else {
    atual.contagem += 1
  }
  if (falhasPorIp.size > 5000) {
    for (const [chave, valor] of falhasPorIp) if (valor.expiraEm < agora) falhasPorIp.delete(chave)
  }
}

function ipBloqueado(ip: string) {
  const atual = falhasPorIp.get(ip)
  return Boolean(atual && atual.expiraEm > Date.now() && atual.contagem >= LIMITE_FALHAS_POR_IP)
}

function extrairChave(requisicao: Request) {
  const direta = requisicao.headers.get('x-api-key')
  if (direta) return direta.trim()
  const autorizacao = requisicao.headers.get('authorization') ?? ''
  return autorizacao.toLowerCase().startsWith('bearer ') ? autorizacao.slice(7).trim() : null
}

async function autenticar(requisicao: Request, ip: string): Promise<Credencial> {
  if (ipBloqueado(ip)) {
    throw new ErroApi(429, 'muitas_falhas', 'Muitas tentativas inválidas. Aguarde um minuto.')
  }

  const chave = extrairChave(requisicao)
  if (!chave || !/^cat_live_[0-9a-f]{8}_[0-9a-f]{48}$/.test(chave)) {
    registrarFalha(ip)
    throw new ErroApi(401, 'nao_autenticado', 'Informe uma chave de API válida no cabeçalho x-api-key.')
  }

  const { data, error } = await banco.rpc('api_autenticar', { p_hash: await gerarHash(chave), p_limite: LIMITE_POR_MINUTO })
  if (error) throw new ErroApi(500, 'erro_interno', 'Não foi possível validar a chave.')

  const credencial = (data as Credencial[] | null)?.[0]
  if (!credencial) {
    registrarFalha(ip)
    throw new ErroApi(401, 'nao_autenticado', 'Chave de API inválida, expirada ou revogada.')
  }
  return credencial
}

function exigirEscopo(credencial: Credencial, escopo: Escopo) {
  if (!credencial.escopos.includes(escopo)) {
    throw new ErroApi(403, 'escopo_insuficiente', `Esta chave não possui o escopo ${escopo}.`)
  }
}

function validar<T extends z.ZodType>(esquema: T, valor: unknown): z.infer<T> {
  const resultado = esquema.safeParse(valor)
  if (!resultado.success) {
    throw new ErroApi(422, 'dados_invalidos', 'Os dados enviados são inválidos.', formatarErrosValidacao(resultado.error))
  }
  return resultado.data
}

function resolverPeriodo(inicio?: string, fim?: string) {
  const fimFinal = fim ?? hojeNoBrasil()
  const inicioFinal = inicio ?? `${fimFinal.slice(0, 7)}-01`
  const dias = (Date.parse(fimFinal) - Date.parse(inicioFinal)) / 86_400_000
  if (dias < 0 || dias > PERIODO_MAXIMO_DIAS) {
    throw new ErroApi(422, 'periodo_invalido', `O período deve ter entre 0 e ${PERIODO_MAXIMO_DIAS} dias.`)
  }
  return { inicio: inicioFinal, fim: fimFinal }
}

async function garantirReferencias(contexto: Contexto, empresaId: string | null, categoriaId: string | null) {
  const { dono_id } = contexto.credencial
  const [empresa, categoria] = await Promise.all([
    empresaId
      ? contexto.banco.from('empresas').select('id').eq('id', empresaId).eq('dono_id', dono_id).maybeSingle()
      : Promise.resolve({ data: true, error: null }),
    categoriaId
      ? contexto.banco.from('categorias').select('id').eq('id', categoriaId).eq('dono_id', dono_id).maybeSingle()
      : Promise.resolve({ data: true, error: null }),
  ])
  if (!empresa.data) throw new ErroApi(404, 'empresa_inexistente', 'Empresa não encontrada.')
  if (!categoria.data) throw new ErroApi(404, 'categoria_inexistente', 'Categoria não encontrada.')
}

async function inserirLancamento(contexto: Contexto, dados: NovoLancamento) {
  const empresaId = dados.empresa_id === undefined ? contexto.credencial.empresa_padrao_id : dados.empresa_id
  await garantirReferencias(contexto, empresaId, dados.categoria_id ?? null)

  const { data, error } = await contexto.banco
    .from('lancamentos')
    .insert({
      dono_id: contexto.credencial.dono_id,
      empresa_id: empresaId,
      categoria_id: dados.categoria_id ?? null,
      tipo: dados.tipo,
      descricao: dados.descricao,
      valor: dados.valor,
      data: dados.data ?? hojeNoBrasil(),
      pago: dados.pago ?? true,
      observacoes: dados.observacoes ?? null,
      origem: 'api',
    })
    .select(COLUNAS_LANCAMENTO)
    .single()

  if (error) throw new ErroApi(400, 'falha_insercao', 'Não foi possível registrar o lançamento.')
  return data
}

async function listarLancamentos(contexto: Contexto) {
  exigirEscopo(contexto.credencial, 'lancamentos:ler')
  const filtros = validar(esquemaFiltroLancamentos, Object.fromEntries(contexto.url.searchParams))
  const periodo = resolverPeriodo(filtros.inicio, filtros.fim)
  const deslocamento = (filtros.pagina - 1) * filtros.limite

  let consulta = contexto.banco
    .from('lancamentos')
    .select(COLUNAS_LANCAMENTO, { count: 'exact' })
    .eq('dono_id', contexto.credencial.dono_id)
    .gte('data', periodo.inicio)
    .lte('data', periodo.fim)
    .order('data', { ascending: false })
    .order('criado_em', { ascending: false })
    .range(deslocamento, deslocamento + filtros.limite - 1)

  if (filtros.tipo) consulta = consulta.eq('tipo', filtros.tipo)
  if (filtros.empresa_id === 'pessoal') consulta = consulta.is('empresa_id', null)
  else if (filtros.empresa_id) consulta = consulta.eq('empresa_id', filtros.empresa_id)

  const { data, error, count } = await consulta
  if (error) throw new ErroApi(500, 'erro_interno', 'Falha ao consultar lançamentos.')
  return responder(200, { dados: data, paginacao: { pagina: filtros.pagina, limite: filtros.limite, total: count ?? 0 } })
}

async function criarLancamento(contexto: Contexto) {
  exigirEscopo(contexto.credencial, 'lancamentos:escrever')
  const dados = validar(esquemaNovoLancamento, await lerCorpoJson(contexto.requisicao))
  return responder(201, { dados: await inserirLancamento(contexto, dados) })
}

async function criarLancamentoPorTexto(contexto: Contexto) {
  exigirEscopo(contexto.credencial, 'lancamentos:escrever')
  const entrada = validar(esquemaLancamentoTexto, await lerCorpoJson(contexto.requisicao))
  const { dono_id } = contexto.credencial

  const [empresas, categorias] = await Promise.all([
    contexto.banco.from('empresas').select('id, nome').eq('dono_id', dono_id).eq('arquivada', false),
    contexto.banco.from('categorias').select('id, nome, tipo').eq('dono_id', dono_id),
  ])
  if (empresas.error || categorias.error) throw new ErroApi(500, 'erro_interno', 'Falha ao carregar referências.')

  const interpretado = interpretarTexto(entrada.texto, { empresas: empresas.data, categorias: categorias.data })
  if (!interpretado) {
    throw new ErroApi(422, 'texto_nao_entendido', 'Não encontrei um valor no texto. Exemplo: "gastei 42,90 no mercado ontem #minhaempresa".')
  }

  const lancamento = await inserirLancamento(contexto, {
    ...interpretado,
    empresa_id: entrada.empresa_id !== undefined ? entrada.empresa_id : interpretado.empresa_id ?? undefined,
  })
  return responder(201, { dados: lancamento, interpretado })
}

async function excluirLancamento(contexto: Contexto, id: string) {
  exigirEscopo(contexto.credencial, 'lancamentos:escrever')
  if (!/^[0-9a-f-]{36}$/i.test(id)) throw new ErroApi(400, 'id_invalido', 'Identificador inválido.')

  const { data, error } = await contexto.banco
    .from('lancamentos')
    .delete()
    .eq('id', id)
    .eq('dono_id', contexto.credencial.dono_id)
    .eq('origem', 'api')
    .select('id')
    .maybeSingle()

  if (error) throw new ErroApi(500, 'erro_interno', 'Falha ao excluir o lançamento.')
  if (!data) throw new ErroApi(404, 'nao_encontrado', 'Lançamento não encontrado ou não criado via API.')
  return responder(204, null)
}

async function listarEmpresas(contexto: Contexto) {
  exigirEscopo(contexto.credencial, 'empresas:ler')
  const { data, error } = await contexto.banco
    .from('empresas')
    .select('id, nome, tipo, participacao, arquivada')
    .eq('dono_id', contexto.credencial.dono_id)
    .order('criado_em')
  if (error) throw new ErroApi(500, 'erro_interno', 'Falha ao consultar empresas.')
  return responder(200, { dados: data })
}

async function listarCategorias(contexto: Contexto) {
  exigirEscopo(contexto.credencial, 'lancamentos:ler')
  const { data, error } = await contexto.banco
    .from('categorias')
    .select('id, nome, tipo')
    .eq('dono_id', contexto.credencial.dono_id)
    .order('tipo')
    .order('nome')
  if (error) throw new ErroApi(500, 'erro_interno', 'Falha ao consultar categorias.')
  return responder(200, { dados: data })
}

async function obterResumo(contexto: Contexto) {
  exigirEscopo(contexto.credencial, 'resumo:ler')
  const filtros = validar(esquemaPeriodo, Object.fromEntries(contexto.url.searchParams))
  const periodo = resolverPeriodo(filtros.inicio, filtros.fim)
  const { dono_id } = contexto.credencial

  const [lancamentos, empresas] = await Promise.all([
    contexto.banco
      .from('lancamentos')
      .select('tipo, valor, empresa_id')
      .eq('dono_id', dono_id)
      .eq('pago', true)
      .gte('data', periodo.inicio)
      .lte('data', periodo.fim)
      .limit(20_000),
    contexto.banco.from('empresas').select('id, nome, participacao').eq('dono_id', dono_id),
  ])
  if (lancamentos.error || empresas.error) throw new ErroApi(500, 'erro_interno', 'Falha ao calcular o resumo.')

  const porEmpresa = new Map(
    empresas.data.map((empresa) => [empresa.id, { ...empresa, receitas: 0, despesas: 0 }]),
  )
  let receitas = 0
  let despesas = 0

  for (const lancamento of lancamentos.data) {
    const valor = Number(lancamento.valor)
    const empresa = lancamento.empresa_id ? porEmpresa.get(lancamento.empresa_id) : undefined
    if (empresa) {
      if (lancamento.tipo === 'receita') empresa.receitas += valor
      else empresa.despesas += valor
    } else if (lancamento.tipo === 'receita') receitas += valor
    else despesas += valor
  }

  const arredondar = (valor: number) => Math.round(valor * 100) / 100
  const listaEmpresas = [...porEmpresa.values()].map((empresa) => {
    const lucro = empresa.receitas - empresa.despesas
    return {
      id: empresa.id,
      nome: empresa.nome,
      receitas: arredondar(empresa.receitas),
      despesas: arredondar(empresa.despesas),
      lucro: arredondar(lucro),
      para_voce: arredondar((lucro * Number(empresa.participacao)) / 100),
    }
  })
  const vindoEmpresas = listaEmpresas.reduce((total, empresa) => total + empresa.para_voce, 0)

  return responder(200, {
    dados: {
      periodo,
      receitas: arredondar(receitas),
      despesas: arredondar(despesas),
      vindo_empresas: arredondar(vindoEmpresas),
      resultado: arredondar(receitas - despesas + vindoEmpresas),
      empresas: listaEmpresas,
    },
  })
}

async function rotear(contexto: Contexto) {
  const caminho = contexto.url.pathname.replace(/^.*?\/api(?=\/|$)/, '').replace(/\/+$/, '') || '/'
  const metodo = contexto.requisicao.method

  if (metodo === 'GET' && caminho === '/v1/resumo') return obterResumo(contexto)
  if (metodo === 'GET' && caminho === '/v1/empresas') return listarEmpresas(contexto)
  if (metodo === 'GET' && caminho === '/v1/categorias') return listarCategorias(contexto)
  if (metodo === 'GET' && caminho === '/v1/lancamentos') return listarLancamentos(contexto)
  if (metodo === 'POST' && caminho === '/v1/lancamentos') return criarLancamento(contexto)
  if (metodo === 'POST' && caminho === '/v1/lancamentos/texto') return criarLancamentoPorTexto(contexto)

  const exclusao = caminho.match(/^\/v1\/lancamentos\/([^/]+)$/)
  if (metodo === 'DELETE' && exclusao?.[1]) return excluirLancamento(contexto, exclusao[1])

  throw new ErroApi(404, 'rota_inexistente', 'Rota não encontrada.')
}

Deno.serve(async (requisicao) => {
  if (requisicao.method === 'OPTIONS') return new Response(null, { status: 204, headers: cabecalhosCors })

  const url = new URL(requisicao.url)
  const ip = requisicao.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'desconhecido'
  let credencial: Credencial | null = null
  let resposta: Response

  try {
    credencial = await autenticar(requisicao, ip)
    const cabecalhosLimite = {
      'X-RateLimit-Limit': String(LIMITE_POR_MINUTO),
      'X-RateLimit-Remaining': String(credencial.restantes),
      'X-RateLimit-Reset': String(Math.ceil(Date.parse(credencial.reinicia_em) / 1000)),
    }

    if (!credencial.permitido) {
      resposta = responderErro(new ErroApi(429, 'limite_excedido', 'Limite de requisições por minuto excedido.'), {
        ...cabecalhosLimite,
        'Retry-After': String(Math.max(1, Math.ceil((Date.parse(credencial.reinicia_em) - Date.now()) / 1000))),
      })
    } else {
      resposta = await rotear({ credencial, banco, url, requisicao })
      for (const [nome, valor] of Object.entries(cabecalhosLimite)) resposta.headers.set(nome, valor)
    }
  } catch (erro) {
    if (erro instanceof ErroApi) {
      resposta = responderErro(erro)
    } else {
      console.error('falha_nao_tratada', erro instanceof Error ? erro.message : erro)
      resposta = responderErro(new ErroApi(500, 'erro_interno', 'Erro interno inesperado.'))
    }
  }

  if (credencial) {
    const registro = banco.from('registros_api').insert({
      dono_id: credencial.dono_id,
      chave_id: credencial.chave_id,
      metodo: requisicao.method,
      rota: url.pathname.replace(/^.*?\/api/, '').slice(0, 120) || '/',
      status: resposta.status,
    })
    EdgeRuntime.waitUntil(Promise.resolve(registro).then(() => undefined))
  }

  return resposta
})
