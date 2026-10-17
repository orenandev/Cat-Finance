import { MailCheck, RotateCw } from 'lucide-react'
import { useState } from 'react'
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { LayoutAutenticacao } from '@/componentes/autenticacao/LayoutAutenticacao'
import { Botao } from '@/componentes/ui/Botao'
import { CampoCodigo } from '@/componentes/ui/CampoCodigo'
import { useNotificacoes } from '@/contextos/NotificacoesContexto'
import { useContagem } from '@/hooks/useContagem'
import { lerEmailPendente, limparEmailPendente } from '@/lib/armazenamentoSessao'
import { mensagemErro } from '@/lib/erros'
import { supabase } from '@/lib/supabase'

const MAXIMO_TENTATIVAS = 5

export default function VerificarEmail() {
  const navegar = useNavigate()
  const local = useLocation()
  const notificacoes = useNotificacoes()
  const email = (local.state as { email?: string } | null)?.email ?? lerEmailPendente()
  const [codigo, setCodigo] = useState('')
  const [erro, setErro] = useState<string | null>(null)
  const [verificando, setVerificando] = useState(false)
  const [reenviando, setReenviando] = useState(false)
  const [tentativas, setTentativas] = useState(0)
  const contagem = useContagem(60)

  if (!email) return <Navigate to="/criar-conta" replace />

  async function verificar(token: string) {
    if (verificando || tentativas >= MAXIMO_TENTATIVAS) return
    setVerificando(true)
    setErro(null)
    const { error } = await supabase.auth.verifyOtp({ email, token, type: 'email' })
    setVerificando(false)

    if (error) {
      setTentativas((atual) => atual + 1)
      setErro(mensagemErro(error, 'Código inválido.'))
      setCodigo('')
      return
    }

    limparEmailPendente()
    notificacoes.sucesso('E-mail confirmado! Bem-vindo ao Catfinance.')
    navegar('/', { replace: true })
  }

  async function reenviar() {
    setReenviando(true)
    const { error } = await supabase.auth.resend({ type: 'signup', email })
    setReenviando(false)
    if (error) {
      notificacoes.erro(mensagemErro(error))
      return
    }
    setTentativas(0)
    contagem.iniciar(60)
    notificacoes.info('Enviamos um novo código.')
  }

  const bloqueado = tentativas >= MAXIMO_TENTATIVAS

  return (
    <LayoutAutenticacao
      titulo="Confirme seu e-mail"
      subtitulo={
        <>
          Enviamos um código de 6 dígitos para <strong className="font-medium text-texto">{email}</strong>.
        </>
      }
      rodape={
        <>
          E-mail errado?{' '}
          <Link to="/criar-conta" className="font-medium text-primaria-texto hover:underline">
            Voltar ao cadastro
          </Link>
        </>
      }
    >
      <div className="mb-6 flex items-center gap-3 rounded-xl border border-borda bg-superficie p-3.5 text-[13px] text-texto-suave">
        <MailCheck size={18} className="shrink-0 text-marca" />
        Confira também a caixa de spam. Se você já tinha conta, basta entrar normalmente.
      </div>

      <form
        onSubmit={(evento) => {
          evento.preventDefault()
          if (codigo.length === 6) verificar(codigo)
        }}
        className="flex flex-col gap-5"
      >
        <CampoCodigo valor={codigo} aoMudar={(valor) => {
          setCodigo(valor)
          setErro(null)
        }} aoCompletar={verificar} erro={Boolean(erro)} desabilitado={verificando || bloqueado} />

        {(erro || bloqueado) && (
          <p role="alert" className="text-center text-sm text-despesa">
            {bloqueado ? 'Muitas tentativas incorretas. Solicite um novo código.' : erro}
          </p>
        )}

        <Botao type="submit" tamanho="lg" larguraTotal carregando={verificando} disabled={codigo.length < 6 || bloqueado}>
          Verificar código
        </Botao>

        <Botao variante="fantasma" icone={RotateCw} onClick={reenviar} disabled={contagem.ativo} carregando={reenviando}>
          {contagem.ativo ? `Reenviar em ${contagem.restante}s` : 'Reenviar código'}
        </Botao>
      </form>
    </LayoutAutenticacao>
  )
}
