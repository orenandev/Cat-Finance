import { RefreshCw } from 'lucide-react'
import { useEffect } from 'react'
import { Link, useRouteError } from 'react-router-dom'
import { Logo } from '@/componentes/ui/Diversos'
import { ehErroDeVersaoAntiga, recarregarParaNovaVersao } from '@/lib/atualizacaoVersao'

export function ErroRota() {
  const erro = useRouteError()
  const versaoAntiga = ehErroDeVersaoAntiga(erro)

  useEffect(() => {
    if (versaoAntiga) recarregarParaNovaVersao()
  }, [versaoAntiga])

  return (
    <div className="grid min-h-dvh place-items-center bg-fundo px-4 text-center">
      <div className="max-w-sm">
        <Logo tamanho={64} className="mx-auto" />
        <h1 className="mt-6 text-lg font-semibold">
          {versaoAntiga ? 'Temos uma versão nova do Catfinance' : 'Algo saiu do lugar'}
        </h1>
        <p className="mt-1 text-sm text-texto-suave">
          {versaoAntiga
            ? 'Recarregue a página para continuar de onde parou.'
            : 'Um erro inesperado aconteceu. Recarregue a página ou volte ao início.'}
        </p>
        <div className="mt-6 flex flex-col justify-center gap-2 sm:flex-row">
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-primaria px-4 text-sm font-medium text-primaria-contraste hover:bg-primaria-forte"
          >
            <RefreshCw size={15} />
            Recarregar
          </button>
          <Link
            to="/"
            reloadDocument
            className="inline-flex h-10 items-center justify-center rounded-xl border border-borda bg-superficie px-4 text-sm font-medium text-texto hover:bg-superficie-2"
          >
            Voltar ao início
          </Link>
        </div>
      </div>
    </div>
  )
}
