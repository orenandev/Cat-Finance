import { TrendingDown, TrendingUp } from 'lucide-react'
import { cx } from '@/lib/classes'
import type { TipoLancamento } from '@/tipos/dominio'

export function SeletorTipo({ valor, aoMudar }: { valor: TipoLancamento; aoMudar: (tipo: TipoLancamento) => void }) {
  const opcoes = [
    { tipo: 'despesa' as const, rotulo: 'Despesa', Icone: TrendingDown, ativo: 'border-despesa bg-despesa-suave text-despesa' },
    { tipo: 'receita' as const, rotulo: 'Receita', Icone: TrendingUp, ativo: 'border-receita bg-receita-suave text-receita' },
  ]
  return (
    <div role="radiogroup" aria-label="Tipo" className="grid grid-cols-2 gap-2">
      {opcoes.map(({ tipo, rotulo, Icone, ativo }) => (
        <button
          key={tipo}
          type="button"
          role="radio"
          aria-checked={valor === tipo}
          onClick={() => aoMudar(tipo)}
          className={cx(
            'flex h-11 items-center justify-center gap-2 rounded-xl border text-sm font-medium transition-all',
            valor === tipo ? ativo : 'border-borda bg-superficie text-texto-suave hover:bg-superficie-2',
          )}
        >
          <Icone size={16} />
          {rotulo}
        </button>
      ))}
    </div>
  )
}
