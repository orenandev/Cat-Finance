import { Menu, Plus, X } from 'lucide-react'
import { Suspense, useEffect, useState } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { Esqueleto, Logo } from '@/componentes/ui/Diversos'
import { marca } from '@/config/marca'
import { useSincronizacaoRecorrencias } from '@/consultas/recorrencias'
import { ProvedorAcoes, useAcoes } from '@/contextos/AcoesContexto'
import { ProvedorPeriodo } from '@/contextos/PeriodoContexto'
import { BarraLateral } from './BarraLateral'

function CarregandoPagina() {
  return (
    <div className="flex flex-col gap-4">
      <Esqueleto className="h-8 w-48" />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[0, 1, 2, 3].map((indice) => (
          <Esqueleto key={indice} className="h-24 rounded-2xl" />
        ))}
      </div>
      <Esqueleto className="h-80 rounded-2xl" />
    </div>
  )
}

function BotaoFlutuante() {
  const acoes = useAcoes()
  return (
    <button
      type="button"
      onClick={() => acoes.novoLancamento()}
      aria-label="Novo lançamento"
      className="fixed right-4 bottom-[max(1rem,env(safe-area-inset-bottom))] z-30 grid h-14 w-14 place-items-center rounded-2xl bg-primaria text-primaria-contraste shadow-flutuante transition-transform active:scale-95 lg:hidden"
    >
      <Plus size={24} />
    </button>
  )
}

export function LayoutAplicacao() {
  const local = useLocation()
  const [menuAbertoEm, setMenuAbertoEm] = useState<string | null>(null)
  const menuAberto = menuAbertoEm === local.pathname
  const setMenuAberto = (aberto: boolean) => setMenuAbertoEm(aberto ? local.pathname : null)
  useSincronizacaoRecorrencias(true)

  useEffect(() => {
    window.scrollTo({ top: 0 })
  }, [local.pathname])

  useEffect(() => {
    if (!menuAberto) return
    const aoTeclar = (evento: KeyboardEvent) => evento.key === 'Escape' && setMenuAbertoEm(null)
    window.addEventListener('keydown', aoTeclar)
    return () => window.removeEventListener('keydown', aoTeclar)
  }, [menuAberto])

  return (
    <ProvedorPeriodo>
      <ProvedorAcoes>
        <div className="min-h-dvh lg:pl-[248px]">
          <aside className="fixed inset-y-0 left-0 z-30 hidden w-[248px] border-r border-borda lg:block">
            <BarraLateral />
          </aside>

          <header className="sticky top-0 z-20 flex h-14 items-center gap-3 border-b border-borda bg-fundo/85 px-4 backdrop-blur lg:hidden">
            <button
              type="button"
              onClick={() => setMenuAberto(true)}
              aria-label="Abrir menu"
              className="-ml-1.5 rounded-lg p-1.5 text-texto-suave hover:bg-superficie-3"
            >
              <Menu size={20} />
            </button>
            <Logo tamanho={26} />
            <span className="text-sm font-semibold">{marca.nome}</span>
          </header>

          {menuAberto && (
            <div className="fixed inset-0 z-40 lg:hidden" role="dialog" aria-modal="true" aria-label="Menu">
              <button
                type="button"
                aria-label="Fechar menu"
                className="absolute inset-0 bg-black/40 backdrop-blur-[2px]"
                onClick={() => setMenuAberto(false)}
              />
              <div className="animate-deslizar absolute inset-y-0 left-0 w-[280px] max-w-[85vw] border-r border-borda shadow-flutuante">
                <BarraLateral />
                <button
                  type="button"
                  onClick={() => setMenuAberto(false)}
                  aria-label="Fechar menu"
                  className="absolute top-4 right-3 rounded-lg p-1.5 text-texto-fraco hover:bg-superficie-3"
                >
                  <X size={18} />
                </button>
              </div>
            </div>
          )}

          <main className="mx-auto w-full max-w-[1000px] px-4 pt-6 pb-28 sm:px-6 sm:pt-10 lg:px-8 lg:pb-16">
            <Suspense fallback={<CarregandoPagina />}>
              <Outlet />
            </Suspense>
          </main>

          <BotaoFlutuante />
        </div>
      </ProvedorAcoes>
    </ProvedorPeriodo>
  )
}
