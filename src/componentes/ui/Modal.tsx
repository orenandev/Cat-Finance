import { X } from 'lucide-react'
import { type ReactNode, useEffect, useId, useRef } from 'react'
import { cx } from '@/lib/classes'

interface PropsModal {
  aberto: boolean
  aoFechar: () => void
  titulo: string
  descricao?: string
  children: ReactNode
  rodape?: ReactNode
  largura?: 'sm' | 'md' | 'lg'
}

const larguras = { sm: 'sm:max-w-md', md: 'sm:max-w-lg', lg: 'sm:max-w-2xl' }

export function Modal({ aberto, aoFechar, titulo, descricao, children, rodape, largura = 'md' }: PropsModal) {
  const referencia = useRef<HTMLDialogElement>(null)
  const idTitulo = useId()

  useEffect(() => {
    const dialogo = referencia.current
    if (!dialogo) return
    if (aberto && !dialogo.open) {
      dialogo.showModal()
      document.documentElement.style.overflow = 'hidden'
    }
    if (!aberto && dialogo.open) dialogo.close()
    return () => {
      document.documentElement.style.overflow = ''
    }
  }, [aberto])

  return (
    <dialog
      ref={referencia}
      aria-labelledby={idTitulo}
      onCancel={(evento) => {
        evento.preventDefault()
        aoFechar()
      }}
      onClick={(evento) => {
        if (evento.target === evento.currentTarget) aoFechar()
      }}
      className={cx(
        'm-0 mt-auto w-full max-w-none bg-transparent p-0 text-texto backdrop:bg-black/40 backdrop:backdrop-blur-[2px]',
        'sm:m-auto sm:w-[calc(100%-2rem)]',
        larguras[largura],
      )}
    >
      {aberto && (
        <div className="animate-surgir flex max-h-[92dvh] flex-col rounded-t-2xl border border-borda bg-superficie shadow-flutuante sm:rounded-2xl">
          <header className="flex items-start justify-between gap-4 border-b border-borda px-5 py-4 sm:px-6">
            <div className="min-w-0">
              <h2 id={idTitulo} className="text-base font-semibold">
                {titulo}
              </h2>
              {descricao && <p className="mt-0.5 text-[13px] text-texto-suave">{descricao}</p>}
            </div>
            <button
              type="button"
              onClick={aoFechar}
              aria-label="Fechar"
              className="-mr-1 rounded-lg p-1.5 text-texto-fraco transition-colors hover:bg-superficie-3 hover:text-texto"
            >
              <X size={18} />
            </button>
          </header>
          <div className="overflow-y-auto px-5 py-5 sm:px-6">{children}</div>
          {rodape && (
            <footer className="flex flex-col-reverse gap-2 border-t border-borda px-5 py-4 sm:flex-row sm:justify-end sm:px-6">
              {rodape}
            </footer>
          )}
        </div>
      )}
    </dialog>
  )
}
