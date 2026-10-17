import { createContext, type ReactNode, use, useEffect, useMemo, useState } from 'react'
import { ModalEmpresa } from '@/componentes/financeiro/ModalEmpresa'
import { ModalLancamento, type PadraoLancamento } from '@/componentes/financeiro/ModalLancamento'
import { ModalRecorrencia } from '@/componentes/financeiro/ModalRecorrencia'
import type { Empresa, Lancamento, Recorrencia, TipoLancamento } from '@/tipos/dominio'

interface ApiAcoes {
  novoLancamento: (padrao?: PadraoLancamento) => void
  editarLancamento: (lancamento: Lancamento) => void
  novaEmpresa: () => void
  editarEmpresa: (empresa: Empresa) => void
  novaRecorrencia: (padrao?: { empresa_id?: string | null; tipo?: TipoLancamento; custo_fixo?: boolean }) => void
  editarRecorrencia: (recorrencia: Recorrencia) => void
}

type Estado =
  | { tipo: 'nenhum' }
  | { tipo: 'lancamento'; lancamento?: Lancamento; padrao?: PadraoLancamento }
  | { tipo: 'empresa'; empresa?: Empresa }
  | { tipo: 'recorrencia'; recorrencia?: Recorrencia; padrao?: Parameters<ApiAcoes['novaRecorrencia']>[0] }

const AcoesContexto = createContext<ApiAcoes | null>(null)

function estaDigitando(alvo: EventTarget | null) {
  const elemento = alvo as HTMLElement | null
  return Boolean(elemento?.closest('input, textarea, select, [contenteditable="true"], dialog[open]'))
}

export function ProvedorAcoes({ children }: { children: ReactNode }) {
  const [estado, setEstado] = useState<Estado>({ tipo: 'nenhum' })
  const fechar = () => setEstado({ tipo: 'nenhum' })

  const api = useMemo<ApiAcoes>(
    () => ({
      novoLancamento: (padrao) => setEstado({ tipo: 'lancamento', padrao }),
      editarLancamento: (lancamento) => setEstado({ tipo: 'lancamento', lancamento }),
      novaEmpresa: () => setEstado({ tipo: 'empresa' }),
      editarEmpresa: (empresa) => setEstado({ tipo: 'empresa', empresa }),
      novaRecorrencia: (padrao) => setEstado({ tipo: 'recorrencia', padrao }),
      editarRecorrencia: (recorrencia) => setEstado({ tipo: 'recorrencia', recorrencia }),
    }),
    [],
  )

  useEffect(() => {
    function aoTeclar(evento: KeyboardEvent) {
      if (evento.metaKey || evento.ctrlKey || evento.altKey || estaDigitando(evento.target)) return
      if (evento.key === 'n' || evento.key === 'N') {
        evento.preventDefault()
        api.novoLancamento()
      }
    }
    window.addEventListener('keydown', aoTeclar)
    return () => window.removeEventListener('keydown', aoTeclar)
  }, [api])

  return (
    <AcoesContexto value={api}>
      {children}
      <ModalLancamento
        aberto={estado.tipo === 'lancamento'}
        aoFechar={fechar}
        lancamento={estado.tipo === 'lancamento' ? estado.lancamento : null}
        padrao={estado.tipo === 'lancamento' ? estado.padrao : undefined}
      />
      <ModalEmpresa aberto={estado.tipo === 'empresa'} aoFechar={fechar} empresa={estado.tipo === 'empresa' ? estado.empresa : null} />
      <ModalRecorrencia
        aberto={estado.tipo === 'recorrencia'}
        aoFechar={fechar}
        recorrencia={estado.tipo === 'recorrencia' ? estado.recorrencia : null}
        padrao={estado.tipo === 'recorrencia' ? estado.padrao : undefined}
      />
    </AcoesContexto>
  )
}

export function useAcoes() {
  const contexto = use(AcoesContexto)
  if (!contexto) throw new Error('useAcoes precisa estar dentro de ProvedorAcoes')
  return contexto
}
