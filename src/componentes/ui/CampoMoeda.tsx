import { useId } from 'react'
import { cx } from '@/lib/classes'
import { estiloEntrada, Moldura } from './Campo'

interface PropsCampoMoeda {
  rotulo?: string
  valor: number
  aoMudar: (valor: number) => void
  erro?: string | null
  dica?: string
  maximo?: number
  autoFocus?: boolean
  classeMoldura?: string
  destaque?: 'receita' | 'despesa'
}

const formatador = new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

export function CampoMoeda({
  rotulo,
  valor,
  aoMudar,
  erro,
  dica,
  maximo = 999_999_999_999,
  autoFocus,
  classeMoldura,
  destaque,
}: PropsCampoMoeda) {
  const id = useId()

  return (
    <Moldura rotulo={rotulo} erro={erro} dica={dica} id={id} className={classeMoldura}>
      <div className="relative flex items-center">
        <span className="pointer-events-none absolute left-3.5 text-sm font-medium text-texto-fraco">R$</span>
        <input
          id={id}
          inputMode="numeric"
          autoComplete="off"
          autoFocus={autoFocus}
          aria-invalid={Boolean(erro) || undefined}
          value={formatador.format(valor)}
          onChange={(evento) => {
            const digitos = evento.target.value.replace(/\D/g, '').slice(0, 15)
            const centavos = Number(digitos || '0')
            aoMudar(Math.min(centavos / 100, maximo))
          }}
          className={cx(
            estiloEntrada,
            'numero h-11 pl-10 text-right font-semibold',
            destaque === 'receita' && 'text-receita',
            destaque === 'despesa' && 'text-despesa',
          )}
        />
      </div>
    </Moldura>
  )
}
