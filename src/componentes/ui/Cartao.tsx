import type { HTMLAttributes, ReactNode } from 'react'
import { cx } from '@/lib/classes'

interface PropsCartao extends HTMLAttributes<HTMLElement> {
  titulo?: ReactNode
  descricao?: ReactNode
  acao?: ReactNode
  semPreenchimento?: boolean
}

export function Cartao({ titulo, descricao, acao, semPreenchimento, className, children, ...props }: PropsCartao) {
  return (
    <section
      className={cx('rounded-2xl border border-borda bg-superficie shadow-cartao', !semPreenchimento && 'p-4 sm:p-5', className)}
      {...props}
    >
      {(titulo || acao) && (
        <header className={cx('mb-4 flex items-start justify-between gap-3', semPreenchimento && 'px-4 pt-4 sm:px-5 sm:pt-5')}>
          <div className="min-w-0">
            {titulo && <h2 className="text-sm font-semibold text-texto">{titulo}</h2>}
            {descricao && <p className="mt-0.5 text-xs text-texto-suave">{descricao}</p>}
          </div>
          {acao}
        </header>
      )}
      {children}
    </section>
  )
}
