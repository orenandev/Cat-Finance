import { Cookie } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router-dom'

const CHAVE = 'catfinance:aviso-armazenamento'

function jaVisto() {
  try {
    return localStorage.getItem(CHAVE) === '1'
  } catch {
    return true
  }
}

export function AvisoArmazenamento() {
  const [visivel, setVisivel] = useState(() => !jaVisto())
  if (!visivel) return null

  function fechar() {
    try {
      localStorage.setItem(CHAVE, '1')
    } finally {
      setVisivel(false)
    }
  }

  return (
    <div
      role="region"
      aria-label="Aviso de armazenamento"
      className="animate-surgir fixed inset-x-3 bottom-3 z-50 mx-auto flex max-w-xl flex-col gap-3 rounded-2xl border border-borda bg-superficie p-4 shadow-flutuante sm:flex-row sm:items-center"
    >
      <Cookie size={20} className="hidden shrink-0 text-marca sm:block" />
      <p className="flex-1 text-xs leading-relaxed text-texto-suave">
        Usamos apenas armazenamento essencial para manter você conectado e lembrar suas preferências. Nada de rastreadores
        ou anúncios.{' '}
        <Link to="/privacidade" className="font-medium text-primaria-texto hover:underline">
          Saiba mais
        </Link>
      </p>
      <button
        type="button"
        onClick={fechar}
        className="h-9 shrink-0 rounded-xl bg-primaria px-4 text-xs font-medium text-primaria-contraste hover:bg-primaria-forte"
      >
        Entendi
      </button>
    </div>
  )
}
