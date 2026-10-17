import type { Moeda } from '@/tipos/dominio'

const localidades: Record<Moeda, string> = { BRL: 'pt-BR', USD: 'en-US', EUR: 'de-DE' }
const formatadoresMoeda = new Map<string, Intl.NumberFormat>()

function obterFormatador(moeda: Moeda, compacto: boolean) {
  const chave = `${moeda}:${compacto}`
  let formatador = formatadoresMoeda.get(chave)
  if (!formatador) {
    formatador = new Intl.NumberFormat(compacto ? 'pt-BR' : localidades[moeda], {
      style: 'currency',
      currency: moeda,
      notation: compacto ? 'compact' : 'standard',
      maximumFractionDigits: compacto ? 1 : 2,
      minimumFractionDigits: compacto ? 0 : 2,
    })
    formatadoresMoeda.set(chave, formatador)
  }
  return formatador
}

export function formatarMoeda(valor: number, moeda: Moeda = 'BRL') {
  return obterFormatador(moeda, false).format(Number.isFinite(valor) ? valor : 0)
}

export function formatarMoedaCompacta(valor: number, moeda: Moeda = 'BRL') {
  return obterFormatador(moeda, true).format(Number.isFinite(valor) ? valor : 0)
}

const formatadorPercentual = new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 2 })

export function formatarPercentual(valor: number) {
  return `${formatadorPercentual.format(valor)}%`
}

export function paraData(iso: string) {
  const [ano, mes, dia] = iso.slice(0, 10).split('-').map(Number)
  return new Date(ano!, (mes ?? 1) - 1, dia ?? 1)
}

export function paraIso(data: Date) {
  const ano = data.getFullYear()
  const mes = String(data.getMonth() + 1).padStart(2, '0')
  const dia = String(data.getDate()).padStart(2, '0')
  return `${ano}-${mes}-${dia}`
}

export function hojeIso() {
  return paraIso(new Date())
}

const formatadorDataCurta = new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: '2-digit' })
const formatadorDataLonga = new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })
const formatadorMes = new Intl.DateTimeFormat('pt-BR', { month: 'long', year: 'numeric' })
const formatadorMesCurto = new Intl.DateTimeFormat('pt-BR', { month: 'short' })
const formatadorRelativo = new Intl.RelativeTimeFormat('pt-BR', { numeric: 'auto' })

export function formatarDataCurta(iso: string) {
  return formatadorDataCurta.format(paraData(iso))
}

export function formatarData(iso: string) {
  return formatadorDataLonga.format(paraData(iso)).replace('.', '')
}

export function formatarMes(iso: string) {
  const texto = formatadorMes.format(paraData(iso))
  return texto.charAt(0).toUpperCase() + texto.slice(1)
}

export function formatarMesCurto(iso: string) {
  return formatadorMesCurto.format(paraData(iso)).replace('.', '')
}

export function formatarRelativo(instante: string) {
  const segundos = Math.round((new Date(instante).getTime() - Date.now()) / 1000)
  const unidades: [Intl.RelativeTimeFormatUnit, number][] = [
    ['year', 31_536_000],
    ['month', 2_592_000],
    ['day', 86_400],
    ['hour', 3_600],
    ['minute', 60],
  ]
  for (const [unidade, duracao] of unidades) {
    if (Math.abs(segundos) >= duracao) return formatadorRelativo.format(Math.round(segundos / duracao), unidade)
  }
  return 'agora mesmo'
}

export function iniciais(nome: string) {
  return nome
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((parte) => parte.charAt(0).toUpperCase())
    .join('')
}

export function normalizarBusca(texto: string) {
  return texto.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase()
}
