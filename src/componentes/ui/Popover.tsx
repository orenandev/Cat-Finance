import { type ReactNode, useEffect, useRef, useState } from 'react'
import { cx } from '@/lib/classes'

interface PropsPopover {
  gatilho: (controle: { aberto: boolean; alternar: () => void }) => ReactNode
  children: (fechar: () => void) => ReactNode
  alinhamento?: 'inicio' | 'fim'
  lado?: 'baixo' | 'cima'
  className?: string
}

export function Popover({ gatilho, children, alinhamento = 'fim', lado = 'baixo', className }: PropsPopover) {
  const [aberto, setAberto] = useState(false)
  const raiz = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!aberto) return
    function aoClicarFora(evento: PointerEvent) {
      if (!raiz.current?.contains(evento.target as Node)) setAberto(false)
    }
    function aoTeclar(evento: KeyboardEvent) {
      if (evento.key === 'Escape') setAberto(false)
    }
    document.addEventListener('pointerdown', aoClicarFora)
    document.addEventListener('keydown', aoTeclar)
    return () => {
      document.removeEventListener('pointerdown', aoClicarFora)
      document.removeEventListener('keydown', aoTeclar)
    }
  }, [aberto])

  return (
    <div ref={raiz} className="relative">
      {gatilho({ aberto, alternar: () => setAberto((atual) => !atual) })}
      {aberto && (
        <div
          className={cx(
            'animate-surgir absolute z-40 min-w-48 rounded-xl border border-borda bg-superficie p-1 shadow-flutuante',
            lado === 'baixo' ? 'top-full mt-2' : 'bottom-full mb-2',
            alinhamento === 'fim' ? 'right-0' : 'left-0',
            className,
          )}
        >
          {children(() => setAberto(false))}
        </div>
      )}
    </div>
  )
}

interface PropsItemMenu {
  aoClicar: () => void
  selecionado?: boolean
  perigo?: boolean
  children: ReactNode
}

export function ItemMenu({ aoClicar, selecionado, perigo, children }: PropsItemMenu) {
  return (
    <button
      type="button"
      onClick={aoClicar}
      className={cx(
        'flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-[13px] transition-colors',
        perigo ? 'text-despesa hover:bg-despesa-suave' : 'text-texto hover:bg-superficie-3',
        selecionado && 'bg-primaria-suave font-medium text-primaria-texto',
      )}
    >
      {children}
    </button>
  )
}
