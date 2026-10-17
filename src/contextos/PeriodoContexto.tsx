import { createContext, type ReactNode, use, useMemo, useState } from 'react'
import { calcularPeriodo, type ChavePeriodo, type Periodo } from '@/lib/periodos'

interface ApiPeriodo {
  periodo: Periodo
  selecionar: (chave: Exclude<ChavePeriodo, 'personalizado'>) => void
  personalizar: (inicio: string, fim: string) => void
}

const CHAVE = 'catfinance:periodo'
const PeriodoContexto = createContext<ApiPeriodo | null>(null)

function periodoInicial(): Periodo {
  try {
    const salvo = sessionStorage.getItem(CHAVE)
    if (salvo) {
      const dados = JSON.parse(salvo) as Periodo
      if (dados.chave === 'personalizado' && /^\d{4}-\d{2}-\d{2}$/.test(dados.inicio) && /^\d{4}-\d{2}-\d{2}$/.test(dados.fim)) {
        return dados
      }
      if (dados.chave !== 'personalizado') return calcularPeriodo(dados.chave)
    }
  } catch {
    return calcularPeriodo('este-mes')
  }
  return calcularPeriodo('este-mes')
}

function persistir(periodo: Periodo) {
  try {
    sessionStorage.setItem(CHAVE, JSON.stringify(periodo))
  } catch {
    return
  }
}

export function ProvedorPeriodo({ children }: { children: ReactNode }) {
  const [periodo, setPeriodo] = useState<Periodo>(periodoInicial)

  const api = useMemo<ApiPeriodo>(
    () => ({
      periodo,
      selecionar: (chave) => {
        const novo = calcularPeriodo(chave)
        setPeriodo(novo)
        persistir(novo)
      },
      personalizar: (inicio, fim) => {
        const novo: Periodo = inicio <= fim ? { chave: 'personalizado', inicio, fim } : { chave: 'personalizado', inicio: fim, fim: inicio }
        setPeriodo(novo)
        persistir(novo)
      },
    }),
    [periodo],
  )

  return <PeriodoContexto value={api}>{children}</PeriodoContexto>
}

export function usePeriodo() {
  const contexto = use(PeriodoContexto)
  if (!contexto) throw new Error('usePeriodo precisa estar dentro de ProvedorPeriodo')
  return contexto
}
