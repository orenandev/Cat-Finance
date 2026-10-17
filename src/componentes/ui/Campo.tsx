import type { InputHTMLAttributes, ReactNode, Ref, SelectHTMLAttributes, TextareaHTMLAttributes } from 'react'
import { useId } from 'react'
import { cx } from '@/lib/classes'

interface PropsMoldura {
  rotulo?: string
  erro?: string | null
  dica?: ReactNode
  id: string
  className?: string
  acessorio?: ReactNode
  children: ReactNode
}

export const estiloEntrada =
  'w-full rounded-xl border border-borda bg-superficie px-3.5 text-sm text-texto placeholder:text-texto-fraco transition-colors outline-none focus:border-marca focus:ring-4 focus:ring-marca/15 disabled:opacity-60 aria-[invalid=true]:border-despesa aria-[invalid=true]:focus:ring-despesa/12'

export function Moldura({ rotulo, erro, dica, id, className, acessorio, children }: PropsMoldura) {
  return (
    <div className={cx('flex flex-col gap-1.5', className)}>
      {(rotulo || acessorio) && (
        <div className="flex items-center justify-between gap-2">
          {rotulo && (
            <label htmlFor={id} className="text-[13px] font-medium text-texto">
              {rotulo}
            </label>
          )}
          {acessorio}
        </div>
      )}
      {children}
      {erro ? (
        <p id={`${id}-erro`} role="alert" className="text-xs text-despesa">
          {erro}
        </p>
      ) : (
        dica && (
          <p id={`${id}-dica`} className="text-xs text-texto-fraco">
            {dica}
          </p>
        )
      )}
    </div>
  )
}

interface PropsCampo extends InputHTMLAttributes<HTMLInputElement> {
  rotulo?: string
  erro?: string | null
  dica?: ReactNode
  prefixo?: ReactNode
  sufixo?: ReactNode
  acessorio?: ReactNode
  classeMoldura?: string
  ref?: Ref<HTMLInputElement>
}

export function Campo({ rotulo, erro, dica, prefixo, sufixo, acessorio, classeMoldura, className, id, ref, ...props }: PropsCampo) {
  const idGerado = useId()
  const idFinal = id ?? idGerado
  return (
    <Moldura rotulo={rotulo} erro={erro} dica={dica} id={idFinal} className={classeMoldura} acessorio={acessorio}>
      <div className="relative flex items-center">
        {prefixo && <span className="pointer-events-none absolute left-3.5 flex text-texto-fraco">{prefixo}</span>}
        <input
          ref={ref}
          id={idFinal}
          aria-invalid={Boolean(erro) || undefined}
          aria-describedby={erro ? `${idFinal}-erro` : dica ? `${idFinal}-dica` : undefined}
          className={cx(estiloEntrada, 'h-11', Boolean(prefixo) && 'pl-10', Boolean(sufixo) && 'pr-11', className)}
          {...props}
        />
        {sufixo && <span className="absolute right-2 flex items-center">{sufixo}</span>}
      </div>
    </Moldura>
  )
}

interface PropsSelecao extends SelectHTMLAttributes<HTMLSelectElement> {
  rotulo?: string
  erro?: string | null
  dica?: ReactNode
  classeMoldura?: string
  ref?: Ref<HTMLSelectElement>
}

export function Selecao({ rotulo, erro, dica, classeMoldura, className, id, children, ref, ...props }: PropsSelecao) {
  const idGerado = useId()
  const idFinal = id ?? idGerado
  return (
    <Moldura rotulo={rotulo} erro={erro} dica={dica} id={idFinal} className={classeMoldura}>
      <select
        ref={ref}
        id={idFinal}
        aria-invalid={Boolean(erro) || undefined}
        className={cx(
          estiloEntrada,
          'h-11 cursor-pointer appearance-none bg-[length:16px] bg-[right_0.75rem_center] bg-no-repeat pr-9',
          "bg-[url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%238a90a3' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E\")]",
          className,
        )}
        {...props}
      >
        {children}
      </select>
    </Moldura>
  )
}

interface PropsAreaTexto extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  rotulo?: string
  erro?: string | null
  dica?: ReactNode
  classeMoldura?: string
}

export function AreaTexto({ rotulo, erro, dica, classeMoldura, className, id, ...props }: PropsAreaTexto) {
  const idGerado = useId()
  const idFinal = id ?? idGerado
  return (
    <Moldura rotulo={rotulo} erro={erro} dica={dica} id={idFinal} className={classeMoldura}>
      <textarea
        id={idFinal}
        aria-invalid={Boolean(erro) || undefined}
        className={cx(estiloEntrada, 'min-h-20 resize-y py-2.5', className)}
        {...props}
      />
    </Moldura>
  )
}
