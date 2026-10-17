import type { Session, User } from '@supabase/supabase-js'
import { useQueryClient } from '@tanstack/react-query'
import { createContext, type ReactNode, use, useEffect, useMemo, useState } from 'react'
import { supabase } from '@/lib/supabase'

interface ApiSessao {
  sessao: Session | null
  usuario: User | null
  carregando: boolean
  sair: (escopo?: 'local' | 'global') => Promise<void>
}

const SessaoContexto = createContext<ApiSessao | null>(null)

export function ProvedorSessao({ children }: { children: ReactNode }) {
  const [sessao, setSessao] = useState<Session | null>(null)
  const [carregando, setCarregando] = useState(true)
  const clienteConsultas = useQueryClient()

  useEffect(() => {
    let ativo = true

    supabase.auth.getSession().then(({ data }) => {
      if (!ativo) return
      setSessao(data.session)
      setCarregando(false)
    })

    const { data } = supabase.auth.onAuthStateChange((evento, novaSessao) => {
      setSessao(novaSessao)
      setCarregando(false)
      if (evento === 'SIGNED_OUT') clienteConsultas.clear()
    })

    return () => {
      ativo = false
      data.subscription.unsubscribe()
    }
  }, [clienteConsultas])

  const api = useMemo<ApiSessao>(
    () => ({
      sessao,
      usuario: sessao?.user ?? null,
      carregando,
      sair: async (escopo = 'local') => {
        await supabase.auth.signOut({ scope: escopo })
        clienteConsultas.clear()
      },
    }),
    [sessao, carregando, clienteConsultas],
  )

  return <SessaoContexto value={api}>{children}</SessaoContexto>
}

export function useSessao() {
  const contexto = use(SessaoContexto)
  if (!contexto) throw new Error('useSessao precisa estar dentro de ProvedorSessao')
  return contexto
}

export function useUsuario() {
  const { usuario } = useSessao()
  if (!usuario) throw new Error('useUsuario só pode ser usado em rotas autenticadas')
  return usuario
}
