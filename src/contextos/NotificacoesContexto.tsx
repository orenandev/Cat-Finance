import { CircleAlert, CircleCheck, Info, X } from 'lucide-react'
import { createContext, type ReactNode, use, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { ouvirAvisos } from '@/lib/avisos'
import { cx } from '@/lib/classes'

type TipoNotificacao = 'sucesso' | 'erro' | 'info'

interface Notificacao {
  id: number
  tipo: TipoNotificacao
  mensagem: string
}

interface ApiNotificacoes {
  sucesso: (mensagem: string) => void
  erro: (mensagem: string) => void
  info: (mensagem: string) => void
}

const NotificacoesContexto = createContext<ApiNotificacoes | null>(null)

const icones = { sucesso: CircleCheck, erro: CircleAlert, info: Info }
const cores = { sucesso: 'text-receita', erro: 'text-despesa', info: 'text-marca' }

export function ProvedorNotificacoes({ children }: { children: ReactNode }) {
  const [notificacoes, setNotificacoes] = useState<Notificacao[]>([])
  const proximoId = useRef(0)

  const remover = useCallback((id: number) => {
    setNotificacoes((atuais) => atuais.filter((notificacao) => notificacao.id !== id))
  }, [])

  const adicionar = useCallback(
    (tipo: TipoNotificacao, mensagem: string) => {
      const id = ++proximoId.current
      setNotificacoes((atuais) => [...atuais.slice(-3), { id, tipo, mensagem }])
      window.setTimeout(() => remover(id), tipo === 'erro' ? 6000 : 3800)
    },
    [remover],
  )

  useEffect(() => ouvirAvisos(adicionar), [adicionar])

  const api = useMemo<ApiNotificacoes>(
    () => ({
      sucesso: (mensagem) => adicionar('sucesso', mensagem),
      erro: (mensagem) => adicionar('erro', mensagem),
      info: (mensagem) => adicionar('info', mensagem),
    }),
    [adicionar],
  )

  return (
    <NotificacoesContexto value={api}>
      {children}
      <div
        aria-live="polite"
        className="pointer-events-none fixed inset-x-0 bottom-0 z-[60] flex flex-col items-center gap-2 p-4 sm:items-end"
      >
        {notificacoes.map(({ id, tipo, mensagem }) => {
          const Icone = icones[tipo]
          return (
            <div
              key={id}
              role={tipo === 'erro' ? 'alert' : 'status'}
              className="animate-surgir pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-xl border border-borda bg-superficie px-4 py-3 shadow-flutuante"
            >
              <Icone size={18} className={cx('mt-0.5 shrink-0', cores[tipo])} />
              <p className="flex-1 text-sm text-texto">{mensagem}</p>
              <button
                type="button"
                onClick={() => remover(id)}
                aria-label="Dispensar"
                className="text-texto-fraco hover:text-texto"
              >
                <X size={15} />
              </button>
            </div>
          )
        })}
      </div>
    </NotificacoesContexto>
  )
}

export function useNotificacoes() {
  const contexto = use(NotificacoesContexto)
  if (!contexto) throw new Error('useNotificacoes precisa estar dentro de ProvedorNotificacoes')
  return contexto
}
