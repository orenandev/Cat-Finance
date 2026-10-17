import { LoaderCircle, type LucideIcon } from 'lucide-react'
import type { ButtonHTMLAttributes, ReactNode, Ref } from 'react'
import { cx } from '@/lib/classes'

type Variante = 'primaria' | 'secundaria' | 'fantasma' | 'perigo' | 'contorno'
type Tamanho = 'sm' | 'md' | 'lg' | 'icone'

interface PropsBotao extends ButtonHTMLAttributes<HTMLButtonElement> {
  variante?: Variante
  tamanho?: Tamanho
  carregando?: boolean
  icone?: LucideIcon
  iconeDireita?: LucideIcon
  larguraTotal?: boolean
  children?: ReactNode
  ref?: Ref<HTMLButtonElement>
}

const variantes: Record<Variante, string> = {
  primaria: 'bg-primaria text-primaria-contraste hover:bg-primaria-forte shadow-cartao',
  secundaria: 'bg-superficie text-texto border border-borda hover:bg-superficie-2 shadow-cartao',
  contorno: 'border border-dashed border-borda-forte text-texto-suave hover:text-texto hover:border-marca hover:bg-primaria-suave/40',
  fantasma: 'text-texto-suave hover:text-texto hover:bg-superficie-3',
  perigo: 'bg-despesa text-white hover:brightness-110 shadow-cartao',
}

const tamanhos: Record<Tamanho, string> = {
  sm: 'h-8 px-3 text-xs gap-1.5 rounded-lg',
  md: 'h-10 px-4 text-sm gap-2 rounded-xl',
  lg: 'h-12 px-5 text-[15px] gap-2 rounded-xl',
  icone: 'h-9 w-9 rounded-lg',
}

export function Botao({
  variante = 'primaria',
  tamanho = 'md',
  carregando = false,
  icone: Icone,
  iconeDireita: IconeDireita,
  larguraTotal,
  className,
  children,
  disabled,
  type = 'button',
  ref,
  ...props
}: PropsBotao) {
  const tamanhoIcone = tamanho === 'sm' ? 14 : 16
  return (
    <button
      ref={ref}
      type={type}
      disabled={disabled || carregando}
      aria-busy={carregando || undefined}
      className={cx(
        'inline-flex shrink-0 items-center justify-center font-medium whitespace-nowrap transition-all duration-150 select-none',
        'disabled:pointer-events-none disabled:opacity-55 active:scale-[0.98]',
        variantes[variante],
        tamanhos[tamanho],
        larguraTotal && 'w-full',
        className,
      )}
      {...props}
    >
      {carregando ? (
        <LoaderCircle size={tamanhoIcone} className="animate-spin" />
      ) : (
        Icone && <Icone size={tamanhoIcone} strokeWidth={2} />
      )}
      {children}
      {IconeDireita && !carregando && <IconeDireita size={tamanhoIcone} strokeWidth={2} />}
    </button>
  )
}
