import type { ReactNode } from 'react'

interface PropsCabecalhoPagina {
  titulo: ReactNode
  descricao?: ReactNode
  acoes?: ReactNode
  icone?: ReactNode
}

export function CabecalhoPagina({ titulo, descricao, acoes, icone }: PropsCabecalhoPagina) {
  return (
    <header className="mb-6 flex flex-col gap-4 sm:mb-8 sm:flex-row sm:items-start sm:justify-between">
      <div className="flex min-w-0 items-center gap-3.5">
        {icone}
        <div className="min-w-0">
          <h1 className="truncate text-xl font-semibold tracking-tight sm:text-[22px]">{titulo}</h1>
          {descricao && <p className="mt-0.5 text-[13px] text-texto-suave">{descricao}</p>}
        </div>
      </div>
      {acoes && <div className="flex flex-wrap items-center gap-2">{acoes}</div>}
    </header>
  )
}
