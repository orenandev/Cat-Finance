import { useRef } from 'react'
import { cx } from '@/lib/classes'

interface PropsCampoCodigo {
  valor: string
  aoMudar: (valor: string) => void
  aoCompletar?: (valor: string) => void
  tamanho?: number
  erro?: boolean
  desabilitado?: boolean
}

export function CampoCodigo({ valor, aoMudar, aoCompletar, tamanho = 6, erro, desabilitado }: PropsCampoCodigo) {
  const refs = useRef<(HTMLInputElement | null)[]>([])
  const digitos = Array.from({ length: tamanho }, (_, indice) => valor[indice] ?? '')

  function atualizar(novo: string) {
    const limpo = novo.replace(/\D/g, '').slice(0, tamanho)
    aoMudar(limpo)
    if (limpo.length === tamanho) aoCompletar?.(limpo)
    return limpo
  }

  function focar(indice: number) {
    refs.current[Math.max(0, Math.min(indice, tamanho - 1))]?.focus()
  }

  return (
    <div className="flex justify-between gap-2 sm:gap-3" role="group" aria-label="Código de verificação">
      {digitos.map((digito, indice) => (
        <input
          key={indice}
          ref={(elemento) => {
            refs.current[indice] = elemento
          }}
          value={digito}
          disabled={desabilitado}
          inputMode="numeric"
          autoComplete={indice === 0 ? 'one-time-code' : 'off'}
          aria-label={`Dígito ${indice + 1}`}
          maxLength={tamanho}
          autoFocus={indice === 0}
          onFocus={(evento) => evento.currentTarget.select()}
          onChange={(evento) => {
            const entrada = evento.target.value.replace(/\D/g, '')
            if (!entrada) return
            if (entrada.length > 1) {
              const limpo = atualizar(valor.slice(0, indice) + entrada)
              focar(limpo.length)
              return
            }
            const lista = digitos.slice()
            lista[indice] = entrada
            atualizar(lista.join(''))
            focar(indice + 1)
          }}
          onKeyDown={(evento) => {
            if (evento.key === 'Backspace') {
              evento.preventDefault()
              const lista = digitos.slice()
              if (lista[indice]) {
                lista[indice] = ''
                aoMudar(lista.join(''))
              } else {
                lista[indice - 1] = ''
                aoMudar(lista.join(''))
                focar(indice - 1)
              }
            }
            if (evento.key === 'ArrowLeft') focar(indice - 1)
            if (evento.key === 'ArrowRight') focar(indice + 1)
          }}
          onPaste={(evento) => {
            evento.preventDefault()
            const limpo = atualizar(evento.clipboardData.getData('text'))
            focar(limpo.length)
          }}
          className={cx(
            'numero h-14 w-full min-w-0 rounded-xl border bg-superficie text-center text-xl font-semibold text-texto outline-none transition-all',
            'focus:border-marca focus:ring-4 focus:ring-marca/15',
            erro ? 'border-despesa' : digito ? 'border-borda-forte' : 'border-borda',
          )}
        />
      ))}
    </div>
  )
}
