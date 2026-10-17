import { ArrowLeft, ArrowRight, Mail, RotateCw } from 'lucide-react'
import { type FormEvent, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { CampoSenha } from '@/componentes/autenticacao/CampoSenha'
import { LayoutAutenticacao } from '@/componentes/autenticacao/LayoutAutenticacao'
import { Botao } from '@/componentes/ui/Botao'
import { Campo } from '@/componentes/ui/Campo'
import { CampoCodigo } from '@/componentes/ui/CampoCodigo'
import { useNotificacoes } from '@/contextos/NotificacoesContexto'
import { useContagem } from '@/hooks/useContagem'
import { mensagemErro } from '@/lib/erros'
import { supabase } from '@/lib/supabase'
import { type ErrosFormulario, esquemaEmail, esquemaNovaSenha, validarFormulario } from '@/validacao/esquemas'

type Etapa = 'email' | 'codigo' | 'senha'

const textos: Record<Etapa, { titulo: string; subtitulo: string }> = {
  email: { titulo: 'Recuperar acesso', subtitulo: 'Informe seu e-mail e enviaremos um código de verificação.' },
  codigo: { titulo: 'Digite o código', subtitulo: 'Se existir uma conta com esse e-mail, o código chega em instantes.' },
  senha: { titulo: 'Crie uma nova senha', subtitulo: 'Escolha uma senha forte que você ainda não usou aqui.' },
}

export default function RecuperarSenha() {
  const navegar = useNavigate()
  const notificacoes = useNotificacoes()
  const contagem = useContagem()
  const [etapa, setEtapa] = useState<Etapa>('email')
  const [email, setEmail] = useState('')
  const [codigo, setCodigo] = useState('')
  const [senhas, setSenhas] = useState({ senha: '', confirmacao: '' })
  const [erros, setErros] = useState<ErrosFormulario>({})
  const [carregando, setCarregando] = useState(false)

  async function enviarCodigo(evento?: FormEvent) {
    evento?.preventDefault()
    const validacao = esquemaEmail.safeParse(email)
    if (!validacao.success) {
      setErros({ email: validacao.error.issues[0]?.message ?? 'E-mail inválido.' })
      return
    }
    setErros({})
    setCarregando(true)
    const { error } = await supabase.auth.resetPasswordForEmail(validacao.data)
    setCarregando(false)
    if (error) {
      setErros({ geral: mensagemErro(error) })
      return
    }
    setEmail(validacao.data)
    contagem.iniciar(60)
    setEtapa('codigo')
  }

  async function verificarCodigo(token: string) {
    if (carregando) return
    setCarregando(true)
    const { error } = await supabase.auth.verifyOtp({ email, token, type: 'recovery' })
    setCarregando(false)
    if (error) {
      setErros({ codigo: mensagemErro(error, 'Código inválido.') })
      setCodigo('')
      return
    }
    setErros({})
    setEtapa('senha')
  }

  async function salvarSenha(evento: FormEvent) {
    evento.preventDefault()
    const validacao = validarFormulario(esquemaNovaSenha, senhas)
    if (!validacao.sucesso) {
      setErros(validacao.erros)
      return
    }
    setCarregando(true)
    const { error } = await supabase.auth.updateUser({ password: validacao.dados.senha })
    setCarregando(false)
    if (error) {
      setErros({ geral: mensagemErro(error) })
      return
    }
    notificacoes.sucesso('Senha alterada com sucesso.')
    navegar('/', { replace: true })
  }

  return (
    <LayoutAutenticacao
      titulo={textos[etapa].titulo}
      subtitulo={textos[etapa].subtitulo}
      rodape={
        <Link to="/entrar" className="inline-flex items-center gap-1.5 font-medium text-primaria-texto hover:underline">
          <ArrowLeft size={14} /> Voltar para o login
        </Link>
      }
    >
      {etapa === 'email' && (
        <form onSubmit={enviarCodigo} noValidate className="flex flex-col gap-4">
          <Campo
            rotulo="E-mail"
            type="email"
            autoComplete="email"
            placeholder="voce@exemplo.com"
            value={email}
            onChange={(evento) => setEmail(evento.target.value)}
            prefixo={<Mail size={16} />}
            erro={erros.email}
            autoFocus
          />
          {erros.geral && <p className="text-sm text-despesa">{erros.geral}</p>}
          <Botao type="submit" tamanho="lg" larguraTotal carregando={carregando} iconeDireita={ArrowRight}>
            Enviar código
          </Botao>
        </form>
      )}

      {etapa === 'codigo' && (
        <div className="flex flex-col gap-5">
          <CampoCodigo valor={codigo} aoMudar={setCodigo} aoCompletar={verificarCodigo} erro={Boolean(erros.codigo)} desabilitado={carregando} />
          {erros.codigo && <p className="text-center text-sm text-despesa">{erros.codigo}</p>}
          <Botao tamanho="lg" larguraTotal carregando={carregando} disabled={codigo.length < 6} onClick={() => verificarCodigo(codigo)}>
            Continuar
          </Botao>
          <Botao variante="fantasma" icone={RotateCw} disabled={contagem.ativo || carregando} onClick={() => enviarCodigo()}>
            {contagem.ativo ? `Reenviar em ${contagem.restante}s` : 'Reenviar código'}
          </Botao>
        </div>
      )}

      {etapa === 'senha' && (
        <form onSubmit={salvarSenha} noValidate className="flex flex-col gap-4">
          <CampoSenha
            rotulo="Nova senha"
            autoComplete="new-password"
            value={senhas.senha}
            onChange={(evento) => setSenhas((atual) => ({ ...atual, senha: evento.target.value }))}
            erro={erros.senha}
            medidor
            autoFocus
          />
          <CampoSenha
            rotulo="Confirmar nova senha"
            autoComplete="new-password"
            value={senhas.confirmacao}
            onChange={(evento) => setSenhas((atual) => ({ ...atual, confirmacao: evento.target.value }))}
            erro={erros.confirmacao}
          />
          {erros.geral && <p className="text-sm text-despesa">{erros.geral}</p>}
          <Botao type="submit" tamanho="lg" larguraTotal carregando={carregando}>
            Salvar nova senha
          </Botao>
        </form>
      )}
    </LayoutAutenticacao>
  )
}
