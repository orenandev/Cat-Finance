import { ArrowRight } from 'lucide-react'
import { Link } from 'react-router-dom'
import { IconeEmpresa } from '@/componentes/ui/Diversos'
import { cx } from '@/lib/classes'
import { formatarMoeda, formatarMoedaCompacta, formatarPercentual } from '@/lib/formatacao'
import type { ResumoEmpresaLista } from '@/tipos/dominio'

export function CartaoEmpresa({ empresa }: { empresa: ResumoEmpresaLista }) {
  const margem = empresa.receitas > 0 ? Math.max(0, Math.min(1, empresa.lucro / empresa.receitas)) : 0

  return (
    <Link
      to={`/empresas/${empresa.id}`}
      className="group flex flex-col rounded-2xl border border-borda bg-superficie p-4 shadow-cartao transition-all hover:-translate-y-0.5 hover:border-borda-forte hover:shadow-flutuante"
    >
      <div className="flex items-center gap-3">
        <IconeEmpresa cor={empresa.cor} icone={empresa.icone} />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-texto">{empresa.nome}</p>
          <p className="truncate text-[11px] text-texto-suave">{formatarPercentual(Number(empresa.participacao))} do lucro para você</p>
        </div>
        <ArrowRight size={16} className="text-texto-fraco transition-transform group-hover:translate-x-0.5 group-hover:text-texto" />
      </div>

      <dl className="mt-4 grid grid-cols-3 gap-2 text-[11px]">
        <div>
          <dt className="text-texto-suave">Receitas</dt>
          <dd className="numero mt-0.5 font-medium text-receita">{formatarMoedaCompacta(empresa.receitas)}</dd>
        </div>
        <div>
          <dt className="text-texto-suave">Despesas</dt>
          <dd className="numero mt-0.5 font-medium text-despesa">{formatarMoedaCompacta(empresa.despesas)}</dd>
        </div>
        <div>
          <dt className="text-texto-suave">Lucro</dt>
          <dd className={cx('numero mt-0.5 font-medium', empresa.lucro < 0 ? 'text-despesa' : 'text-texto')}>
            {formatarMoedaCompacta(empresa.lucro)}
          </dd>
        </div>
      </dl>

      <div className="mt-4 flex items-center justify-between rounded-xl bg-superficie-2 px-3 py-2.5 text-xs">
        <span className="text-texto-suave">Para você</span>
        <span className={cx('numero font-semibold', empresa.para_voce < 0 ? 'text-despesa' : 'text-primaria-texto')}>
          {formatarMoeda(empresa.para_voce)}
        </span>
      </div>

      <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-superficie-3" title={`Margem de ${Math.round(margem * 100)}%`}>
        <div className="h-full rounded-full bg-receita transition-[width] duration-500" style={{ width: `${margem * 100}%` }} />
      </div>
    </Link>
  )
}
