import { formatarDataCurta, formatarMesCurto, paraData, paraIso } from './formatacao'

export type ChavePeriodo = 'este-mes' | 'mes-passado' | 'ultimos-30' | 'ultimos-90' | 'este-ano' | 'personalizado'
export type Granularidade = 'dia' | 'semana' | 'mes'

export interface Periodo {
  chave: ChavePeriodo
  inicio: string
  fim: string
}

export const rotulosPeriodo: Record<ChavePeriodo, string> = {
  'este-mes': 'Este mês',
  'mes-passado': 'Mês passado',
  'ultimos-30': 'Últimos 30 dias',
  'ultimos-90': 'Últimos 90 dias',
  'este-ano': 'Este ano',
  personalizado: 'Personalizado',
}

export const opcoesGranularidade: { valor: Granularidade; rotulo: string }[] = [
  { valor: 'dia', rotulo: 'Dia' },
  { valor: 'semana', rotulo: 'Semana' },
  { valor: 'mes', rotulo: 'Mês' },
]

export function calcularPeriodo(chave: Exclude<ChavePeriodo, 'personalizado'>, referencia = new Date()): Periodo {
  const ano = referencia.getFullYear()
  const mes = referencia.getMonth()
  const dia = referencia.getDate()

  switch (chave) {
    case 'este-mes':
      return { chave, inicio: paraIso(new Date(ano, mes, 1)), fim: paraIso(new Date(ano, mes + 1, 0)) }
    case 'mes-passado':
      return { chave, inicio: paraIso(new Date(ano, mes - 1, 1)), fim: paraIso(new Date(ano, mes, 0)) }
    case 'ultimos-30':
      return { chave, inicio: paraIso(new Date(ano, mes, dia - 29)), fim: paraIso(referencia) }
    case 'ultimos-90':
      return { chave, inicio: paraIso(new Date(ano, mes, dia - 89)), fim: paraIso(referencia) }
    case 'este-ano':
      return { chave, inicio: paraIso(new Date(ano, 0, 1)), fim: paraIso(new Date(ano, 11, 31)) }
  }
}

export function granularidadeSugerida(periodo: Periodo): Granularidade {
  const dias = (paraData(periodo.fim).getTime() - paraData(periodo.inicio).getTime()) / 86_400_000
  if (dias > 120) return 'mes'
  if (dias > 45) return 'semana'
  return 'dia'
}

function chaveBalde(iso: string, granularidade: Granularidade) {
  if (granularidade === 'dia') return iso
  if (granularidade === 'mes') return `${iso.slice(0, 7)}-01`
  const data = paraData(iso)
  const deslocamento = (data.getDay() + 6) % 7
  data.setDate(data.getDate() - deslocamento)
  return paraIso(data)
}

export function agruparSerie<T extends { data: string }>(
  serie: T[],
  granularidade: Granularidade,
  campos: readonly (keyof T)[],
): (T & { rotulo: string })[] {
  const baldes = new Map<string, T>()

  for (const ponto of serie) {
    const chave = chaveBalde(ponto.data, granularidade)
    const atual = baldes.get(chave)
    if (!atual) {
      baldes.set(chave, { ...ponto, data: chave })
      continue
    }
    for (const campo of campos) {
      ;(atual[campo] as number) = Number(atual[campo]) + Number(ponto[campo])
    }
  }

  return [...baldes.values()].map((ponto) => ({
    ...ponto,
    rotulo: granularidade === 'mes' ? formatarMesCurto(ponto.data) : formatarDataCurta(ponto.data),
  }))
}
