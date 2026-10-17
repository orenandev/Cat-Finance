import { BarChart3, Building2, KeyRound, ShieldCheck } from 'lucide-react'
import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { Logo } from '@/componentes/ui/Diversos'
import { marca } from '@/config/marca'

const destaques = [
  { icone: BarChart3, texto: 'Visão consolidada do pessoal e de todas as suas empresas' },
  { icone: Building2, texto: 'Folha de pagamento, custos fixos e lucro por negócio' },
  { icone: KeyRound, texto: 'API e bots para lançar gastos em segundos' },
  { icone: ShieldCheck, texto: 'Dados isolados por conta e protegidos pela LGPD' },
]

interface PropsLayoutAutenticacao {
  titulo: string
  subtitulo?: ReactNode
  children: ReactNode
  rodape?: ReactNode
}

export function LayoutAutenticacao({ titulo, subtitulo, children, rodape }: PropsLayoutAutenticacao) {
  return (
    <div className="grid min-h-dvh bg-fundo lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)]">
      <aside className="relative hidden overflow-hidden bg-[#0e110e] p-12 text-white lg:flex lg:flex-col">
        <div className="absolute -top-40 -left-32 h-[28rem] w-[28rem] rounded-full bg-[#7cc04f]/25 blur-[120px]" />
        <div className="absolute -right-24 bottom-0 h-80 w-80 rounded-full bg-[#0f9f6e]/20 blur-[110px]" />

        <Link to="/" className="relative flex items-center gap-3">
          <Logo tamanho={40} />
          <span className="text-lg font-semibold tracking-tight">{marca.nome}</span>
        </Link>

        <div className="relative my-auto max-w-md">
          <h2 className="text-3xl leading-tight font-semibold tracking-tight">
            Seu dinheiro organizado com sete vidas de precisão.
          </h2>
          <p className="mt-3 text-sm text-white/65">{marca.slogan}</p>

          <ul className="mt-10 space-y-4">
            {destaques.map(({ icone: Icone, texto }) => (
              <li key={texto} className="flex items-center gap-3 text-sm text-white/85">
                <span className="grid h-8 w-8 place-items-center rounded-lg bg-white/10">
                  <Icone size={16} />
                </span>
                {texto}
              </li>
            ))}
          </ul>
        </div>

        <p className="relative text-xs text-white/40">
          © {new Date().getFullYear()} {marca.nome}
        </p>
      </aside>

      <main className="flex min-h-dvh flex-col px-4 py-8 sm:px-8">
        <div className="mx-auto flex w-full max-w-[400px] flex-1 flex-col justify-center">
          <Link to="/" className="mb-10 flex items-center gap-2.5 lg:hidden">
            <Logo tamanho={36} />
            <span className="text-base font-semibold tracking-tight">{marca.nome}</span>
          </Link>

          <h1 className="text-2xl font-semibold tracking-tight">{titulo}</h1>
          {subtitulo && <p className="mt-1.5 text-sm text-texto-suave">{subtitulo}</p>}

          <div className="mt-8">{children}</div>

          {rodape && <div className="mt-8 text-center text-sm text-texto-suave">{rodape}</div>}
        </div>

        <nav className="mx-auto mt-10 flex gap-4 text-xs text-texto-fraco">
          <Link to="/termos" className="hover:text-texto">
            Termos de uso
          </Link>
          <Link to="/privacidade" className="hover:text-texto">
            Privacidade e LGPD
          </Link>
        </nav>
      </main>
    </div>
  )
}
