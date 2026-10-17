import type { LucideIcon } from 'lucide-react'
import { cx } from '@/lib/classes'

interface Aba<T extends string> {
  valor: T
  rotulo: string
  icone?: LucideIcon
}

interface PropsAbas<T extends string> {
  abas: Aba<T>[]
  ativa: T
  aoMudar: (valor: T) => void
  className?: string
}

export function Abas<T extends string>({ abas, ativa, aoMudar, className }: PropsAbas<T>) {
  return (
    <div
      role="tablist"
      className={cx('-mx-4 flex gap-1 overflow-x-auto border-b border-borda px-4 sm:mx-0 sm:px-0', className)}
    >
      {abas.map(({ valor, rotulo, icone: Icone }) => {
        const selecionada = valor === ativa
        return (
          <button
            key={valor}
            role="tab"
            type="button"
            aria-selected={selecionada}
            onClick={() => aoMudar(valor)}
            className={cx(
              'relative flex shrink-0 items-center gap-2 px-3 py-2.5 text-sm font-medium transition-colors',
              selecionada ? 'text-texto' : 'text-texto-fraco hover:text-texto-suave',
            )}
          >
            {Icone && <Icone size={15} />}
            {rotulo}
            {selecionada && <span className="absolute inset-x-2 -bottom-px h-0.5 rounded-full bg-marca" />}
          </button>
        )
      })}
    </div>
  )
}

interface PropsSegmentado<T extends string> {
  opcoes: { valor: T; rotulo: string }[]
  ativo: T
  aoMudar: (valor: T) => void
  rotulo: string
}

export function Segmentado<T extends string>({ opcoes, ativo, aoMudar, rotulo }: PropsSegmentado<T>) {
  return (
    <div role="radiogroup" aria-label={rotulo} className="inline-flex rounded-xl border border-borda bg-superficie-2 p-0.5">
      {opcoes.map((opcao) => (
        <button
          key={opcao.valor}
          type="button"
          role="radio"
          aria-checked={opcao.valor === ativo}
          onClick={() => aoMudar(opcao.valor)}
          className={cx(
            'rounded-[10px] px-3 py-1.5 text-xs font-medium transition-all',
            opcao.valor === ativo ? 'bg-superficie text-texto shadow-cartao' : 'text-texto-fraco hover:text-texto',
          )}
        >
          {opcao.rotulo}
        </button>
      ))}
    </div>
  )
}
