import { Monitor, Moon, Sun } from 'lucide-react'
import { CabecalhoPagina } from '@/componentes/layout/CabecalhoPagina'
import { Cartao } from '@/componentes/ui/Cartao'
import { Esqueleto } from '@/componentes/ui/Diversos'
import { usePerfil } from '@/consultas/perfil'
import { type PreferenciaTema, useTema } from '@/contextos/TemaContexto'
import { cx } from '@/lib/classes'
import { SecaoCategorias } from './SecaoCategorias'
import { SecaoContas } from './SecaoContas'
import { SecaoPerfil } from './SecaoPerfil'
import { SecaoPrivacidade } from './SecaoPrivacidade'
import { SecaoSeguranca } from './SecaoSeguranca'

const temas: { valor: PreferenciaTema; rotulo: string; Icone: typeof Sun }[] = [
  { valor: 'claro', rotulo: 'Claro', Icone: Sun },
  { valor: 'escuro', rotulo: 'Escuro', Icone: Moon },
  { valor: 'sistema', rotulo: 'Sistema', Icone: Monitor },
]

function SecaoAparencia() {
  const { preferencia, definir } = useTema()
  return (
    <Cartao titulo="Aparência">
      <div role="radiogroup" aria-label="Tema" className="grid grid-cols-3 gap-2">
        {temas.map(({ valor, rotulo, Icone }) => (
          <button
            key={valor}
            type="button"
            role="radio"
            aria-checked={preferencia === valor}
            onClick={() => definir(valor)}
            className={cx(
              'flex flex-col items-center gap-2 rounded-xl border p-3 text-xs font-medium transition-all',
              preferencia === valor ? 'border-marca bg-primaria-suave text-primaria-texto' : 'border-borda text-texto-suave hover:bg-superficie-2',
            )}
          >
            <Icone size={18} />
            {rotulo}
          </button>
        ))}
      </div>
    </Cartao>
  )
}

export default function Configuracoes() {
  const { data: perfil, isPending } = usePerfil()

  return (
    <>
      <CabecalhoPagina titulo="Configurações" descricao="Perfil, contas conectadas, segurança e privacidade." />
      <div className="flex flex-col gap-4">
        {isPending || !perfil ? <Esqueleto className="h-72 rounded-2xl" /> : <SecaoPerfil key={perfil.id} perfil={perfil} />}
        <SecaoContas />
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_280px]">
          <SecaoCategorias />
          <SecaoAparencia />
        </div>
        <SecaoSeguranca />
        <SecaoPrivacidade />
      </div>
    </>
  )
}
