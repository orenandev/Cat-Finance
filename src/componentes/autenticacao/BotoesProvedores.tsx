import { useState } from 'react'
import { useNotificacoes } from '@/contextos/NotificacoesContexto'
import { escoposProvedor, type ProvedorExterno, provedores, urlRetorno } from '@/lib/autenticacao'
import { mensagemErro } from '@/lib/erros'
import { supabase } from '@/lib/supabase'

export function BotoesProvedores() {
  const [carregando, setCarregando] = useState<ProvedorExterno | null>(null)
  const notificacoes = useNotificacoes()

  async function entrarCom(provedor: ProvedorExterno) {
    setCarregando(provedor)
    const { error } = await supabase.auth.signInWithOAuth({
      provider: provedor,
      options: {
        redirectTo: urlRetorno(),
        scopes: escoposProvedor(provedor),
      },
    })
    if (error) {
      notificacoes.erro(mensagemErro(error, 'Não foi possível conectar com o provedor.'))
      setCarregando(null)
    }
  }

  return (
    <div className="grid grid-cols-2 gap-3">
      {provedores.map(({ id, nome, Icone }) => (
        <button
          key={id}
          type="button"
          onClick={() => entrarCom(id)}
          disabled={carregando !== null}
          className="flex h-11 items-center justify-center gap-2.5 rounded-xl border border-borda bg-superficie text-sm font-medium text-texto shadow-cartao transition-colors hover:bg-superficie-2 disabled:opacity-60"
        >
          <Icone />
          {carregando === id ? 'Abrindo…' : nome}
        </button>
      ))}
    </div>
  )
}

export function Divisor({ texto }: { texto: string }) {
  return (
    <div className="my-6 flex items-center gap-3 text-xs text-texto-fraco">
      <span className="h-px flex-1 bg-borda" />
      {texto}
      <span className="h-px flex-1 bg-borda" />
    </div>
  )
}
