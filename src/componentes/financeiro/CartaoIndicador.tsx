import type { LucideIcon } from 'lucide-react'
import { Esqueleto } from '@/componentes/ui/Diversos'
import { cx } from '@/lib/classes'
import { formatarMoeda } from '@/lib/formatacao'
import type { Moeda } from '@/tipos/dominio'

type Tom = 'primaria' | 'receita' | 'despesa' | 'neutro'

interface PropsCartaoIndicador {
  rotulo: string
  valor: number | undefined
  icone: LucideIcon
  tom?: Tom
  destaque?: boolean
  moeda?: Moeda
  rodape?: string
}

const coresValor: Record<Tom, string> = {
  primaria: 'text-primaria-texto',
  receita: 'text-receita',
  despesa: 'text-despesa',
  neutro: 'text-texto',
}

export function CartaoIndicador({ rotulo, valor, icone: Icone, tom = 'neutro', destaque, moeda = 'BRL', rodape }: PropsCartaoIndicador) {
  return (
    <div
      className={cx(
        'rounded-2xl border p-4 shadow-cartao transition-colors sm:p-5',
        destaque ? 'border-marca/30 bg-primaria-suave' : 'border-borda bg-superficie',
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs text-texto-suave">{rotulo}</span>
        <Icone size={16} className={coresValor[tom]} strokeWidth={2} />
      </div>
      {valor === undefined ? (
        <Esqueleto className="mt-2.5 h-7 w-32" />
      ) : (
        <p className={cx('numero mt-1.5 truncate text-[22px] font-semibold', coresValor[tom])}>{formatarMoeda(valor, moeda)}</p>
      )}
      {rodape && <p className="mt-1 truncate text-[11px] text-texto-fraco">{rodape}</p>}
    </div>
  )
}
