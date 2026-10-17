import { createContext, type ReactNode, use, useCallback, useEffect, useMemo, useState } from 'react'

export type PreferenciaTema = 'claro' | 'escuro' | 'sistema'

interface ApiTema {
  preferencia: PreferenciaTema
  escuro: boolean
  definir: (preferencia: PreferenciaTema) => void
  alternar: () => void
}

const CHAVE = 'catfinance:tema'
const TemaContexto = createContext<ApiTema | null>(null)

function lerPreferencia(): PreferenciaTema {
  try {
    const salvo = localStorage.getItem(CHAVE)
    return salvo === 'claro' || salvo === 'escuro' ? salvo : 'sistema'
  } catch {
    return 'sistema'
  }
}

const consultaEscuro = () => window.matchMedia('(prefers-color-scheme: dark)')

export function ProvedorTema({ children }: { children: ReactNode }) {
  const [preferencia, setPreferencia] = useState<PreferenciaTema>(lerPreferencia)
  const [sistemaEscuro, setSistemaEscuro] = useState(() => consultaEscuro().matches)

  useEffect(() => {
    const consulta = consultaEscuro()
    const aoMudar = (evento: MediaQueryListEvent) => setSistemaEscuro(evento.matches)
    consulta.addEventListener('change', aoMudar)
    return () => consulta.removeEventListener('change', aoMudar)
  }, [])

  const escuro = preferencia === 'escuro' || (preferencia === 'sistema' && sistemaEscuro)

  useEffect(() => {
    document.documentElement.classList.toggle('dark', escuro)
  }, [escuro])

  const definir = useCallback((nova: PreferenciaTema) => {
    setPreferencia(nova)
    try {
      if (nova === 'sistema') localStorage.removeItem(CHAVE)
      else localStorage.setItem(CHAVE, nova)
    } catch {
      return
    }
  }, [])

  const api = useMemo<ApiTema>(
    () => ({ preferencia, escuro, definir, alternar: () => definir(escuro ? 'claro' : 'escuro') }),
    [preferencia, escuro, definir],
  )

  return <TemaContexto value={api}>{children}</TemaContexto>
}

export function useTema() {
  const contexto = use(TemaContexto)
  if (!contexto) throw new Error('useTema precisa estar dentro de ProvedorTema')
  return contexto
}
