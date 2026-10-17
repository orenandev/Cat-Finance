import { ArrowRight, Mail } from 'lucide-react'
import { type FormEvent, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { BotoesProvedores, Divisor } from '@/componentes/autenticacao/BotoesProvedores'
import { CampoSenha } from '@/componentes/autenticacao/CampoSenha'
import { LayoutAutenticacao } from '@/componentes/autenticacao/LayoutAutenticacao'
import { Botao } from '@/componentes/ui/Botao'
import { Campo } from '@/componentes/ui/Campo'
import { guardarEmailPendente } from '@/lib/armazenamentoSessao'
import { mensagemErro } from '@/lib/erros'
import { supabase } from '@/lib/supabase'
import { type ErrosFormulario, esquemaEntrar, validarFormulario } from '@/validacao/esquemas'

export default function Entrar() {
  const navegar = useNavigate()
  const local = useLocation()
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [erros, setErros] = useState<ErrosFormulario>({})
  const [erroGeral, setErroGeral] = useState<string | null>(null)
  const [enviando, setEnviando] = useState(false)

  const destino = (local.state as { de?: string } | null)?.de ?? '/'

  async function enviar(evento: FormEvent) {
    evento.preventDefault()
    setErroGeral(null)
    const validacao = validarFormulario(esquemaEntrar, { email, senha })
    if (!validacao.sucesso) {
      setErros(validacao.erros)
      return
    }
    setErros({})
    setEnviando(true)

    const { error } = await supabase.auth.signInWithPassword({
      email: validacao.dados.email,
      password: validacao.dados.senha,
    })

    if (error) {
      setEnviando(false)
      if (/email not confirmed/i.test(error.message)) {
        guardarEmailPendente(validacao.dados.email)
        await supabase.auth.resend({ type: 'signup', email: validacao.dados.email })
        navegar('/verificar-email', { state: { email: validacao.dados.email } })
        return
      }
      setErroGeral(mensagemErro(error))
      return
    }

    navegar(destino.startsWith('/') && !destino.startsWith('//') ? destino : '/', { replace: true })
  }

  return (
    <LayoutAutenticacao
      titulo="Bem-vindo de volta"
      subtitulo="Entre para ver como estão suas finanças hoje."
      rodape={
        <>
          Ainda não tem conta?{' '}
          <Link to="/criar-conta" className="font-medium text-primaria-texto hover:underline">
            Criar conta grátis
          </Link>
        </>
      }
    >
      <BotoesProvedores />
      <Divisor texto="ou entre com e-mail" />

      <form onSubmit={enviar} noValidate className="flex flex-col gap-4">
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
        <CampoSenha
          rotulo="Senha"
          autoComplete="current-password"
          placeholder="Sua senha"
          value={senha}
          onChange={(evento) => setSenha(evento.target.value)}
          erro={erros.senha}
          acessorio={
            <Link to="/recuperar-senha" className="text-xs font-medium text-primaria-texto hover:underline">
              Esqueci a senha
            </Link>
          }
        />

        {erroGeral && (
          <p role="alert" className="rounded-xl bg-despesa-suave px-3.5 py-2.5 text-sm text-despesa">
            {erroGeral}
          </p>
        )}

        <Botao type="submit" tamanho="lg" carregando={enviando} iconeDireita={ArrowRight} larguraTotal className="mt-2">
          Entrar
        </Botao>
      </form>
    </LayoutAutenticacao>
  )
}
