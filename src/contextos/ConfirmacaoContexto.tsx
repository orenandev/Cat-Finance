import { createContext, type ReactNode, use, useCallback, useRef, useState } from 'react'
import { Botao } from '@/componentes/ui/Botao'
import { Modal } from '@/componentes/ui/Modal'

interface OpcoesConfirmacao {
  titulo: string
  descricao?: string
  confirmar?: string
  perigo?: boolean
}

type Confirmar = (opcoes: OpcoesConfirmacao) => Promise<boolean>

const ConfirmacaoContexto = createContext<Confirmar | null>(null)

export function ProvedorConfirmacao({ children }: { children: ReactNode }) {
  const [opcoes, setOpcoes] = useState<OpcoesConfirmacao | null>(null)
  const resolver = useRef<((resposta: boolean) => void) | null>(null)

  const confirmar = useCallback<Confirmar>((novasOpcoes) => {
    resolver.current?.(false)
    setOpcoes(novasOpcoes)
    return new Promise<boolean>((resolve) => {
      resolver.current = resolve
    })
  }, [])

  function responder(resposta: boolean) {
    resolver.current?.(resposta)
    resolver.current = null
    setOpcoes(null)
  }

  return (
    <ConfirmacaoContexto value={confirmar}>
      {children}
      <Modal
        aberto={Boolean(opcoes)}
        aoFechar={() => responder(false)}
        titulo={opcoes?.titulo ?? ''}
        largura="sm"
        rodape={
          <>
            <Botao variante="secundaria" onClick={() => responder(false)}>
              Cancelar
            </Botao>
            <Botao variante={opcoes?.perigo ? 'perigo' : 'primaria'} onClick={() => responder(true)} autoFocus>
              {opcoes?.confirmar ?? 'Confirmar'}
            </Botao>
          </>
        }
      >
        <p className="text-sm text-texto-suave">{opcoes?.descricao}</p>
      </Modal>
    </ConfirmacaoContexto>
  )
}

export function useConfirmacao() {
  const contexto = use(ConfirmacaoContexto)
  if (!contexto) throw new Error('useConfirmacao precisa estar dentro de ProvedorConfirmacao')
  return contexto
}
