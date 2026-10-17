import { ArrowRight, Mail, User } from 'lucide-react'
import { type FormEvent, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { BotoesProvedores, Divisor } from '@/componentes/autenticacao/BotoesProvedores'
import { CampoSenha } from '@/componentes/autenticacao/CampoSenha'
import { LayoutAutenticacao } from '@/componentes/autenticacao/LayoutAutenticacao'
import { Botao } from '@/componentes/ui/Botao'
import { Campo } from '@/componentes/ui/Campo'
import { urlRetorno } from '@/lib/autenticacao'
import { cx } from '@/lib/classes'
import { guardarEmailPendente } from '@/lib/armazenamentoSessao'
import { mensagemErro } from '@/lib/erros'
import { supabase } from '@/lib/supabase'
import { type ErrosFormulario, esquemaCadastro, validarFormulario } from '@/validacao/esquemas'

export default function CriarConta() {
  const navegar = useNavigate()
  const [formulario, setFormulario] = useState({ nome: '', email: '', senha: '', confirmacao: '', termos: false })
  const [erros, setErros] = useState<ErrosFormulario>({})
  const [erroGeral, setErroGeral] = useState<string | null>(null)
  const [enviando, setEnviando] = useState(false)

  function alterar<K extends keyof typeof formulario>(campo: K, valor: (typeof formulario)[K]) {
    setFormulario((atual) => ({ ...atual, [campo]: valor }))
    if (erros[campo]) setErros(({ [campo]: _removido, ...resto }) => resto)
  }

  async function enviar(evento: FormEvent) {
    evento.preventDefault()
    setErroGeral(null)
    const validacao = validarFormulario(esquemaCadastro, formulario)
    if (!validacao.sucesso) {
      setErros(validacao.erros)
      return
    }
    setEnviando(true)

    const { nome, email, senha } = validacao.dados
    const { data, error } = await supabase.auth.signUp({
      email,
      password: senha,
      options: {
        emailRedirectTo: urlRetorno(),
        data: { nome, full_name: nome, termos_aceitos: true },
      },
    })

    setEnviando(false)
    if (error) {
      setErroGeral(mensagemErro(error))
      return
    }

    if (data.session) {
      navegar('/', { replace: true })
      return
    }

    guardarEmailPendente(email)
    navegar('/verificar-email', { state: { email } })
  }

  return (
    <LayoutAutenticacao
      titulo="Crie sua conta"
      subtitulo="Leva menos de um minuto. Sem cartão de crédito."
      rodape={
        <>
          Já tem uma conta?{' '}
          <Link to="/entrar" className="font-medium text-primaria-texto hover:underline">
            Entrar
          </Link>
        </>
      }
    >
      <BotoesProvedores />
      <Divisor texto="ou cadastre com e-mail" />

      <form onSubmit={enviar} noValidate className="flex flex-col gap-4">
        <Campo
          rotulo="Nome"
          autoComplete="name"
          placeholder="Como podemos te chamar?"
          value={formulario.nome}
          onChange={(evento) => alterar('nome', evento.target.value)}
          prefixo={<User size={16} />}
          erro={erros.nome}
          autoFocus
        />
        <Campo
          rotulo="E-mail"
          type="email"
          autoComplete="email"
          placeholder="voce@exemplo.com"
          value={formulario.email}
          onChange={(evento) => alterar('email', evento.target.value)}
          prefixo={<Mail size={16} />}
          erro={erros.email}
        />
        <CampoSenha
          rotulo="Senha"
          autoComplete="new-password"
          placeholder="Mínimo de 8 caracteres"
          value={formulario.senha}
          onChange={(evento) => alterar('senha', evento.target.value)}
          erro={erros.senha}
          medidor
        />
        <CampoSenha
          rotulo="Confirmar senha"
          autoComplete="new-password"
          placeholder="Repita a senha"
          value={formulario.confirmacao}
          onChange={(evento) => alterar('confirmacao', evento.target.value)}
          erro={erros.confirmacao}
        />

        <label className="flex cursor-pointer items-start gap-3 text-[13px] leading-5 text-texto-suave">
          <input
            type="checkbox"
            checked={formulario.termos}
            onChange={(evento) => alterar('termos', evento.target.checked)}
            className={cx('mt-0.5 h-4 w-4 shrink-0 accent-[var(--marca)]', erros.termos && 'outline outline-despesa')}
          />
          <span>
            Li e aceito os{' '}
            <Link to="/termos" target="_blank" className="font-medium text-primaria-texto hover:underline">
              Termos de uso
            </Link>{' '}
            e a{' '}
            <Link to="/privacidade" target="_blank" className="font-medium text-primaria-texto hover:underline">
              Política de privacidade
            </Link>
            , incluindo o tratamento dos meus dados conforme a LGPD.
          </span>
        </label>
        {erros.termos && <p className="-mt-2 text-xs text-despesa">{erros.termos}</p>}

        {erroGeral && (
          <p role="alert" className="rounded-xl bg-despesa-suave px-3.5 py-2.5 text-sm text-despesa">
            {erroGeral}
          </p>
        )}

        <Botao type="submit" tamanho="lg" carregando={enviando} iconeDireita={ArrowRight} larguraTotal className="mt-2">
          Criar conta
        </Botao>
      </form>
    </LayoutAutenticacao>
  )
}
