import { CircleAlert } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { CarregandoTela } from '@/componentes/ui/Diversos'
import { useSessao } from '@/contextos/SessaoContexto'
import { consumirDestinoRetorno } from '@/lib/armazenamentoSessao'

const mensagensErro: Record<string, string> = {
  access_denied: 'Você cancelou a autorização com o provedor.',
  identity_already_exists: 'Essa conta externa já está vinculada a outro usuário do Catfinance.',
  server_error: 'O provedor retornou um erro. Tente novamente em instantes.',
}

export default function Retorno() {
  const navegar = useNavigate()
  const { sessao, carregando } = useSessao()
  const [erro] = useState(() => {
    const parametros = new URLSearchParams(window.location.search + window.location.hash.replace(/^#/, '&'))
    const codigo = parametros.get('error_code') ?? parametros.get('error')
    if (!codigo) return null
    return mensagensErro[codigo] ?? 'Não foi possível concluir a autenticação.'
  })

  useEffect(() => {
    if (erro || carregando) return
    if (sessao) {
      navegar(consumirDestinoRetorno(), { replace: true })
      return
    }
    const temporizador = window.setTimeout(() => navegar('/entrar', { replace: true }), 8000)
    return () => window.clearTimeout(temporizador)
  }, [erro, carregando, sessao, navegar])

  if (!erro) return <CarregandoTela />

  return (
    <div className="grid min-h-dvh place-items-center bg-fundo px-4">
      <div className="w-full max-w-sm rounded-2xl border border-borda bg-superficie p-6 text-center shadow-cartao">
        <CircleAlert className="mx-auto text-despesa" size={28} />
        <h1 className="mt-3 text-base font-semibold">Falha na autenticação</h1>
        <p className="mt-1 text-sm text-texto-suave">{erro}</p>
        <Link
          to={sessao ? '/configuracoes' : '/entrar'}
          replace
          className="mt-5 inline-flex h-10 items-center rounded-xl bg-primaria px-4 text-sm font-medium text-primaria-contraste"
        >
          {sessao ? 'Voltar às configurações' : 'Voltar ao login'}
        </Link>
      </div>
    </div>
  )
}
