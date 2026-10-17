import { ArrowLeft } from 'lucide-react'
import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { Logo } from '@/componentes/ui/Diversos'
import { marca } from '@/config/marca'

interface Secao {
  id: string
  titulo: string
  conteudo: ReactNode
}

export function LayoutLegal({ titulo, resumo, secoes }: { titulo: string; resumo: string; secoes: Secao[] }) {
  return (
    <div className="min-h-dvh bg-fundo">
      <header className="sticky top-0 z-10 border-b border-borda bg-fundo/85 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-4xl items-center gap-3 px-4 sm:px-6">
          <Link to="/" className="flex items-center gap-2.5">
            <Logo tamanho={28} />
            <span className="text-sm font-semibold">{marca.nome}</span>
          </Link>
          <Link to="/" className="ml-auto flex items-center gap-1.5 text-xs text-texto-suave hover:text-texto">
            <ArrowLeft size={14} /> Voltar
          </Link>
        </div>
      </header>

      <main className="mx-auto grid max-w-4xl gap-10 px-4 py-10 sm:px-6 lg:grid-cols-[200px_minmax(0,1fr)]">
        <nav aria-label="Seções" className="hidden lg:block">
          <ul className="sticky top-24 flex flex-col gap-1.5 text-xs">
            {secoes.map((secao) => (
              <li key={secao.id}>
                <a href={`#${secao.id}`} className="text-texto-suave hover:text-texto">
                  {secao.titulo}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        <article className="min-w-0">
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">{titulo}</h1>
          <p className="mt-2 text-sm text-texto-suave">Última atualização: {marca.atualizacaoDocumentos}</p>
          <p className="mt-6 rounded-2xl border border-borda bg-superficie p-4 text-sm leading-relaxed text-texto-suave shadow-cartao">
            {resumo}
          </p>

          {secoes.map((secao) => (
            <section key={secao.id} id={secao.id} className="mt-10 scroll-mt-20">
              <h2 className="text-base font-semibold">{secao.titulo}</h2>
              <div className="mt-3 space-y-3 text-sm leading-relaxed text-texto-suave [&_li]:ml-5 [&_li]:list-disc [&_strong]:text-texto">
                {secao.conteudo}
              </div>
            </section>
          ))}
        </article>
      </main>
    </div>
  )
}
