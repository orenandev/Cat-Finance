type TipoLancamento = 'receita' | 'despesa'

interface ReferenciaNomeada {
  id: string
  nome: string
}

interface CategoriaReferencia extends ReferenciaNomeada {
  tipo: TipoLancamento
}

export interface LancamentoInterpretado {
  tipo: TipoLancamento
  valor: number
  descricao: string
  data: string
  empresa_id: string | null
  categoria_id: string | null
}

const PALAVRAS_RECEITA = ['recebi', 'ganhei', 'vendi', 'entrou', 'receita', 'recebimento', 'faturei', 'pix recebido']
const PALAVRAS_DESPESA = ['gastei', 'paguei', 'comprei', 'gasto', 'despesa', 'saiu', 'pagamento', 'conta de']

const PISTAS_CATEGORIA: Record<string, string[]> = {
  'alimentacao': ['mercado', 'ifood', 'restaurante', 'lanche', 'padaria', 'almoco', 'jantar', 'cafe', 'pizza', 'acougue'],
  'transporte': ['uber', '99', 'gasolina', 'combustivel', 'onibus', 'metro', 'estacionamento', 'pedagio', 'taxi'],
  'moradia': ['aluguel', 'luz', 'energia', 'agua', 'internet', 'condominio', 'gas', 'iptu'],
  'assinaturas': ['netflix', 'spotify', 'assinatura', 'prime', 'youtube', 'disney', 'hbo', 'icloud'],
  'saude': ['farmacia', 'remedio', 'medico', 'consulta', 'exame', 'academia', 'dentista', 'plano de saude'],
  'educacao': ['curso', 'livro', 'faculdade', 'escola', 'mensalidade'],
  'lazer': ['cinema', 'bar', 'show', 'viagem', 'jogo', 'festa', 'passeio'],
  'impostos': ['imposto', 'das', 'inss', 'darf', 'ipva'],
  'marketing': ['anuncio', 'ads', 'trafego', 'impulsionamento'],
  'fornecedores': ['fornecedor', 'estoque', 'materia prima'],
  'salario': ['salario', 'holerite'],
  'freelance': ['freela', 'freelance', 'job', 'projeto'],
  'vendas': ['venda', 'vendi', 'pedido'],
  'investimentos': ['dividendo', 'rendimento', 'juros', 'investimento'],
}

export function normalizar(texto: string) {
  return texto.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase().trim()
}

function escaparRegex(texto: string) {
  return texto.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function contemPalavra(texto: string, palavra: string) {
  return new RegExp(`(^|[^a-z0-9])${escaparRegex(palavra)}([^a-z0-9]|$)`).test(texto)
}

function extrairValor(texto: string): { valor: number; trecho: string } | null {
  const candidatos = [
    ...texto.matchAll(/(?<![\d/.,])(r\$\s*)?(\d{1,3}(?:\.\d{3})+(?:,\d{1,2})?|\d+(?:[.,]\d{1,2})?)\s*(k|mil)?(?![\d/])/gi),
  ]
  const correspondencia =
    candidatos.find((candidato) => candidato[1]) ??
    candidatos.find((candidato) => /[.,]\d{1,2}$/.test(candidato[2] ?? '')) ??
    candidatos[0]
  if (!correspondencia?.[2]) return null

  const bruto = correspondencia[2]
  const numero = bruto.includes(',')
    ? Number(bruto.replace(/\./g, '').replace(',', '.'))
    : /^\d{1,3}(\.\d{3})+$/.test(bruto)
      ? Number(bruto.replace(/\./g, ''))
      : Number(bruto)

  const multiplicador = correspondencia[3] ? 1000 : 1
  const valor = Math.round(numero * multiplicador * 100) / 100
  if (!Number.isFinite(valor) || valor <= 0) return null
  return { valor, trecho: correspondencia[0] }
}

const formatadorDataBrasil = new Intl.DateTimeFormat('en-CA', {
  timeZone: 'America/Sao_Paulo',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
})

export function hojeNoBrasil() {
  return formatadorDataBrasil.format(new Date())
}

function formatarDataIso(data: Date) {
  return data.toISOString().slice(0, 10)
}

function extrairData(textoNormalizado: string, hoje: Date): { data: string; trecho: string | null } {
  const deslocamentos: [string, number][] = [['anteontem', -2], ['ontem', -1], ['hoje', 0], ['amanha', 1]]
  for (const [palavra, dias] of deslocamentos) {
    if (contemPalavra(textoNormalizado, palavra)) {
      const data = new Date(hoje)
      data.setUTCDate(data.getUTCDate() + dias)
      return { data: formatarDataIso(data), trecho: palavra }
    }
  }

  const explicita = textoNormalizado.match(/\b(\d{1,2})\/(\d{1,2})(?:\/(\d{2,4}))?\b/)
  if (explicita) {
    const dia = Number(explicita[1])
    const mes = Number(explicita[2])
    const anoBruto = explicita[3] ? Number(explicita[3]) : hoje.getUTCFullYear()
    const ano = anoBruto < 100 ? 2000 + anoBruto : anoBruto
    const data = new Date(Date.UTC(ano, mes - 1, dia))
    if (data.getUTCMonth() === mes - 1 && data.getUTCDate() === dia) {
      return { data: formatarDataIso(data), trecho: explicita[0] }
    }
  }

  return { data: formatarDataIso(hoje), trecho: null }
}

function encontrarPorNome<T extends ReferenciaNomeada>(lista: T[], termo: string) {
  const alvo = normalizar(termo)
  return (
    lista.find((item) => normalizar(item.nome) === alvo) ??
    lista.find((item) => normalizar(item.nome).replace(/\s+/g, '').startsWith(alvo.replace(/[-_]/g, '')))
  )
}

export function interpretarTexto(
  texto: string,
  contexto: { empresas: ReferenciaNomeada[]; categorias: CategoriaReferencia[]; hoje?: Date },
): LancamentoInterpretado | null {
  const hoje = contexto.hoje ?? new Date(`${hojeNoBrasil()}T00:00:00Z`)
  const textoNormalizado = normalizar(texto)

  const { data, trecho: trechoData } = extrairData(textoNormalizado, hoje)
  const valorExtraido = extrairValor(trechoData ? textoNormalizado.replace(trechoData, ' ') : textoNormalizado)
  if (!valorExtraido) return null

  const ehReceita = PALAVRAS_RECEITA.some((palavra) => contemPalavra(textoNormalizado, palavra)) || /^\s*\+/.test(texto)
  const ehDespesa = PALAVRAS_DESPESA.some((palavra) => contemPalavra(textoNormalizado, palavra)) || /^\s*-/.test(texto)
  const tipo: TipoLancamento = ehReceita && !ehDespesa ? 'receita' : 'despesa'

  const marcacao = texto.match(/#([\p{L}\p{N}_-]{2,40})/u)
  const empresa = marcacao?.[1] ? encontrarPorNome(contexto.empresas, marcacao[1]) : undefined

  const textoCategorias = normalizar(texto.replace(/#[\p{L}\p{N}_-]+/gu, ' '))
  const categoriasDoTipo = contexto.categorias.filter((categoria) => categoria.tipo === tipo)
  const categoriaDireta = categoriasDoTipo.find((categoria) => contemPalavra(textoCategorias, normalizar(categoria.nome)))
  const categoriaPista = categoriasDoTipo.find((categoria) => {
    const nome = normalizar(categoria.nome)
    return Object.entries(PISTAS_CATEGORIA).some(
      ([chave, pistas]) => nome.startsWith(chave) && pistas.some((pista) => contemPalavra(textoCategorias, pista)),
    )
  })
  const categoria = categoriaDireta ?? categoriaPista

  const palavrasIgnoradas = new Set([
    ...PALAVRAS_RECEITA,
    ...PALAVRAS_DESPESA,
    'de', 'do', 'da', 'dos', 'das', 'no', 'na', 'em', 'com', 'por', 'pra', 'para', 'r$', 'reais', 'real',
    ...(trechoData ? [trechoData] : []),
  ])
  let descricao = texto
    .replace(new RegExp(escaparRegex(valorExtraido.trecho.trim()), 'i'), ' ')
    .replace(/#[\p{L}\p{N}_-]+/gu, ' ')
    .replace(/^\s*[+-]/, ' ')
    .split(/\s+/)
    .filter((palavra) => palavra && !palavrasIgnoradas.has(normalizar(palavra)))
    .join(' ')
    .trim()

  if (!descricao) descricao = categoria?.nome ?? (tipo === 'receita' ? 'Receita via API' : 'Despesa via API')
  descricao = (descricao.charAt(0).toUpperCase() + descricao.slice(1)).slice(0, 140)

  return {
    tipo,
    valor: valorExtraido.valor,
    descricao,
    data,
    empresa_id: empresa?.id ?? null,
    categoria_id: categoria?.id ?? null,
  }
}
