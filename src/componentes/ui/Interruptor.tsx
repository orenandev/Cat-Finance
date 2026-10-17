import { cx } from '@/lib/classes'

interface PropsInterruptor {
  ligado: boolean
  aoMudar: (ligado: boolean) => void
  rotulo: string
  descricao?: string
  desabilitado?: boolean
  ocultarRotulo?: boolean
}

export function Interruptor({ ligado, aoMudar, rotulo, descricao, desabilitado, ocultarRotulo }: PropsInterruptor) {
  const botao = (
    <button
      type="button"
      role="switch"
      aria-checked={ligado}
      aria-label={ocultarRotulo ? rotulo : undefined}
      disabled={desabilitado}
      onClick={() => aoMudar(!ligado)}
      className={cx(
        'relative inline-flex h-6 w-10 shrink-0 items-center rounded-full transition-colors disabled:opacity-50',
        ligado ? 'bg-marca' : 'bg-superficie-3 ring-1 ring-borda-forte ring-inset',
      )}
    >
      <span
        className={cx(
          'inline-block h-4.5 w-4.5 rounded-full bg-white shadow transition-transform',
          ligado ? 'translate-x-[19px]' : 'translate-x-[3px]',
        )}
      />
    </button>
  )

  if (ocultarRotulo) return botao

  return (
    <div className="flex items-center justify-between gap-4">
      <div className="min-w-0">
        <p className="text-sm font-medium text-texto">{rotulo}</p>
        {descricao && <p className="text-xs text-texto-suave">{descricao}</p>}
      </div>
      {botao}
    </div>
  )
}
