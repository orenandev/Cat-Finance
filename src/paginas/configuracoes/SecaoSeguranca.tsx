import { LogOut, ShieldCheck } from 'lucide-react'
import { type FormEvent, useState } from 'react'
import { CampoSenha } from '@/componentes/autenticacao/CampoSenha'
import { Botao } from '@/componentes/ui/Botao'
import { Cartao } from '@/componentes/ui/Cartao'
import { useConfirmacao } from '@/contextos/ConfirmacaoContexto'
import { useNotificacoes } from '@/contextos/NotificacoesContexto'
import { useSessao } from '@/contextos/SessaoContexto'
import { mensagemErro } from '@/lib/erros'
import { supabase } from '@/lib/supabase'
import { type ErrosFormulario, esquemaNovaSenha, validarFormulario } from '@/validacao/esquemas'

export function SecaoSeguranca() {
  const { sair } = useSessao()
  const notificacoes = useNotificacoes()
  const confirmar = useConfirmacao()
  const [senhas, setSenhas] = useState({ senha: '', confirmacao: '' })
  const [erros, setErros] = useState<ErrosFormulario>({})
  const [salvando, setSalvando] = useState(false)

  async function alterarSenha(evento: FormEvent) {
    evento.preventDefault()
    const validacao = validarFormulario(esquemaNovaSenha, senhas)
    if (!validacao.sucesso) {
      setErros(validacao.erros)
      return
    }
    setErros({})
    setSalvando(true)
    const { error } = await supabase.auth.updateUser({ password: validacao.dados.senha })
    setSalvando(false)
    if (error) {
      setErros({ senha: mensagemErro(error) })
      return
    }
    setSenhas({ senha: '', confirmacao: '' })
    notificacoes.sucesso('Senha atualizada.')
  }

  async function sairDeTudo() {
    const confirmado = await confirmar({
      titulo: 'Sair de todos os dispositivos?',
      descricao: 'Todas as sessões abertas, inclusive esta, serão encerradas.',
      confirmar: 'Sair de todos',
    })
    if (confirmado) await sair('global')
  }

  return (
    <Cartao titulo="Segurança" descricao="Senha e sessões ativas.">
      <form onSubmit={alterarSenha} noValidate className="grid gap-4 sm:grid-cols-2">
        <CampoSenha
          rotulo="Nova senha"
          autoComplete="new-password"
          value={senhas.senha}
          onChange={(evento) => setSenhas((atual) => ({ ...atual, senha: evento.target.value }))}
          erro={erros.senha}
          medidor
        />
        <CampoSenha
          rotulo="Confirmar nova senha"
          autoComplete="new-password"
          value={senhas.confirmacao}
          onChange={(evento) => setSenhas((atual) => ({ ...atual, confirmacao: evento.target.value }))}
          erro={erros.confirmacao}
        />
        <div className="sm:col-span-2 sm:flex sm:justify-end">
          <Botao type="submit" icone={ShieldCheck} carregando={salvando}>
            Atualizar senha
          </Botao>
        </div>
      </form>

      <div className="mt-5 flex flex-col gap-3 border-t border-borda pt-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-[13px] font-medium">Sessões</p>
          <p className="text-xs text-texto-suave">Perdeu um aparelho? Encerre todas as sessões de uma vez.</p>
        </div>
        <Botao variante="secundaria" icone={LogOut} onClick={sairDeTudo}>
          Sair de todos os dispositivos
        </Botao>
      </div>
    </Cartao>
  )
}
