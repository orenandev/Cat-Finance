import { Link } from 'react-router-dom'
import { Logo } from '@/componentes/ui/Diversos'

export default function NaoEncontrada() {
  return (
    <div className="grid min-h-dvh place-items-center bg-fundo px-4 text-center">
      <div>
        <Logo tamanho={72} className="mx-auto" />
        <p className="numero mt-6 text-5xl font-semibold tracking-tight text-primaria-texto">404</p>
        <h1 className="mt-2 text-lg font-semibold">O gato derrubou esta página da mesa</h1>
        <p className="mt-1 text-sm text-texto-suave">O endereço não existe ou foi movido.</p>
        <Link to="/" className="mt-6 inline-flex h-10 items-center rounded-xl bg-primaria px-4 text-sm font-medium text-primaria-contraste">
          Voltar ao início
        </Link>
      </div>
    </div>
  )
}
