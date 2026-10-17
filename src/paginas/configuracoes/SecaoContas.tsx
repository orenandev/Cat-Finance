import type { UserIdentity } from '@supabase/supabase-js'
import { useQueryClient } from '@tanstack/react-query'
import { Mail } from 'lucide-react'
import { useState } from 'react'
import { Botao } from '@/componentes/ui/Botao'
import { Cartao } from '@/componentes/ui/Cartao'
import { Distintivo } from '@/componentes/ui/Diversos'
import { chaves } from '@/consultas/chaves'
import { useConfirmacao } from '@/contextos/ConfirmacaoContexto'
import { useNotificacoes } from '@/contextos/NotificacoesContexto'
import { useUsuario } from '@/contextos/SessaoContexto'
import { guardarDestinoRetorno } from '@/lib/armazenamentoSessao'
import { escoposProvedor, type ProvedorExterno, provedores, urlRetorno } from '@/lib/autenticacao'
import { mensagemErro } from '@/lib/erros'
import { supabase } from '@/lib/supabase'

export function SecaoContas() {
  const usuario = useUsuario()
  const notificacoes = useNotificacoes()
  const confirmar = useConfirmacao()
  const cliente = useQueryClient()
  const [processando, setProcessando] = useState<string | null>(null)
  const identidades = usuario.identities ?? []
  const temEmail = identidades.some((identidade) => identidade.provider === 'email')

  async function conectar(provedor: ProvedorExterno) {
    setProcessando(provedor)
    guardarDestinoRetorno('/configuracoes')
    const { error } = await supabase.auth.linkIdentity({
      provider: provedor,
      options: { redirectTo: urlRetorno(), scopes: escoposProvedor(provedor) },
    })
    if (error) {
      notificacoes.erro(mensagemErro(error, 'Não foi possível iniciar a vinculação.'))
      setProcessando(null)
    }
  }

  async function desconectar(identidade: UserIdentity, nome: string) {
    if (identidades.length <= 1) {
      notificacoes.erro('Você precisa manter pelo menos uma forma de entrar.')
      return
    }
    const confirmado = await confirmar({
      titulo: `Desconectar ${nome}?`,
      descricao: `Você não poderá mais entrar usando ${nome}. Pode reconectar quando quiser.`,
      confirmar: 'Desconectar',
      perigo: true,
    })
    if (!confirmado) return
    setProcessando(identidade.provider)
    const { error } = await supabase.auth.unlinkIdentity(identidade)
    setProcessando(null)
    if (error) {
      notificacoes.erro(mensagemErro(error))
      return
    }
    await supabase.auth.refreshSession()
    cliente.invalidateQueries({ queryKey: chaves.perfil(usuario.id) })
    notificacoes.sucesso(`${nome} desconectado.`)
  }

  return (
    <Cartao titulo="Contas conectadas" descricao="Entre com qualquer uma delas — tudo vai para a mesma conta.">
      <ul className="flex flex-col divide-y divide-borda">
        <li className="flex items-center gap-3 py-3 first:pt-0">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-superficie-3 text-texto-suave">
            <Mail size={17} />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-[13px] font-medium">E-mail e senha</p>
            <p className="truncate text-xs text-texto-fraco">{usuario.email}</p>
          </div>
          <Distintivo tom={temEmail ? 'receita' : 'neutro'}>{temEmail ? 'Ativo' : 'Defina uma senha abaixo'}</Distintivo>
        </li>
        {provedores.map(({ id, nome, Icone }) => {
          const identidade = identidades.find((item) => item.provider === id)
          const detalhe = identidade?.identity_data?.email ?? identidade?.identity_data?.full_name ?? identidade?.identity_data?.name
          return (
            <li key={id} className="flex items-center gap-3 py-3 last:pb-0">
              <span className="grid h-9 w-9 place-items-center rounded-xl bg-superficie-3">
                <Icone />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-[13px] font-medium">{nome}</p>
                <p className="truncate text-xs text-texto-fraco">{identidade ? String(detalhe ?? 'Conectado') : 'Não conectado'}</p>
              </div>
              {identidade ? (
                <Botao variante="secundaria" tamanho="sm" carregando={processando === id} onClick={() => desconectar(identidade, nome)}>
                  Desconectar
                </Botao>
              ) : (
                <Botao tamanho="sm" carregando={processando === id} onClick={() => conectar(id)}>
                  Conectar
                </Botao>
              )}
            </li>
          )
        })}
      </ul>
    </Cartao>
  )
}
