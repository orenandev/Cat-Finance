import { Calendar, Check, ChevronDown } from 'lucide-react'
import { useState } from 'react'
import { Botao } from '@/componentes/ui/Botao'
import { Campo } from '@/componentes/ui/Campo'
import { ItemMenu, Popover } from '@/componentes/ui/Popover'
import { usePeriodo } from '@/contextos/PeriodoContexto'
import { formatarDataCurta } from '@/lib/formatacao'
import { type ChavePeriodo, rotulosPeriodo } from '@/lib/periodos'

const opcoes = ['este-mes', 'mes-passado', 'ultimos-30', 'ultimos-90', 'este-ano'] as const

export function SeletorPeriodo() {
  const { periodo, selecionar, personalizar } = usePeriodo()
  const [inicio, setInicio] = useState(periodo.inicio)
  const [fim, setFim] = useState(periodo.fim)

  const rotulo =
    periodo.chave === 'personalizado'
      ? `${formatarDataCurta(periodo.inicio)} – ${formatarDataCurta(periodo.fim)}`
      : rotulosPeriodo[periodo.chave as ChavePeriodo]

  return (
    <Popover
      gatilho={({ alternar, aberto }) => (
        <Botao variante="secundaria" tamanho="sm" icone={Calendar} iconeDireita={ChevronDown} onClick={alternar} aria-expanded={aberto}>
          {rotulo}
        </Botao>
      )}
      className="w-64"
    >
      {(fechar) => (
        <>
          {opcoes.map((chave) => (
            <ItemMenu
              key={chave}
              selecionado={periodo.chave === chave}
              aoClicar={() => {
                selecionar(chave)
                fechar()
              }}
            >
              <span className="flex-1">{rotulosPeriodo[chave]}</span>
              {periodo.chave === chave && <Check size={14} />}
            </ItemMenu>
          ))}
          <div className="mt-1 border-t border-borda p-2">
            <p className="mb-2 text-[11px] font-medium tracking-wide text-texto-fraco uppercase">Personalizado</p>
            <div className="grid grid-cols-2 gap-2">
              <Campo type="date" aria-label="Data inicial" value={inicio} onChange={(evento) => setInicio(evento.target.value)} className="h-9 px-2 text-xs" />
              <Campo type="date" aria-label="Data final" value={fim} onChange={(evento) => setFim(evento.target.value)} className="h-9 px-2 text-xs" />
            </div>
            <Botao
              tamanho="sm"
              larguraTotal
              className="mt-2"
              disabled={!inicio || !fim}
              onClick={() => {
                personalizar(inicio, fim)
                fechar()
              }}
            >
              Aplicar
            </Botao>
          </div>
        </>
      )}
    </Popover>
  )
}
