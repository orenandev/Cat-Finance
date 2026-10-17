import { Archive, LayoutDashboard, Plus, Receipt, Repeat, Settings2, Users, Wallet } from 'lucide-react'
import { Navigate, useParams, useSearchParams } from 'react-router-dom'
import { ListaLancamentos } from '@/componentes/financeiro/ListaLancamentos'
import { CabecalhoPagina } from '@/componentes/layout/CabecalhoPagina'
import { SeletorPeriodo } from '@/componentes/layout/SeletorPeriodo'
import { Abas } from '@/componentes/ui/Abas'
import { Botao } from '@/componentes/ui/Botao'
import { Cartao } from '@/componentes/ui/Cartao'
import { Distintivo, Esqueleto, IconeEmpresa } from '@/componentes/ui/Diversos'
import { useEmpresa } from '@/consultas/empresas'
import { useAcoes } from '@/contextos/AcoesContexto'
import { usePeriodo } from '@/contextos/PeriodoContexto'
import { formatarPercentual } from '@/lib/formatacao'
import { AbaAjustes } from './AbaAjustes'
import { AbaCustosFixos } from './AbaCustosFixos'
import { AbaEquipe } from './AbaEquipe'
import { AbaFolha } from './AbaFolha'
import { AbaResumo } from './AbaResumo'

const abas = [
  { valor: 'resumo', rotulo: 'Resumo', icone: LayoutDashboard },
  { valor: 'lancamentos', rotulo: 'Lançamentos', icone: Receipt },
  { valor: 'custos', rotulo: 'Custos fixos', icone: Repeat },
  { valor: 'equipe', rotulo: 'Equipe', icone: Users },
  { valor: 'folha', rotulo: 'Folha de pagamento', icone: Wallet },
  { valor: 'ajustes', rotulo: 'Ajustes', icone: Settings2 },
] as const

type ValorAba = (typeof abas)[number]['valor']

export default function PaginaEmpresa() {
  const { id } = useParams<{ id: string }>()
  const [parametros, setParametros] = useSearchParams()
  const { data: empresa, isPending } = useEmpresa(id)
  const { periodo } = usePeriodo()
  const acoes = useAcoes()

  const abaParametro = parametros.get('aba')
  const aba: ValorAba = abas.some((item) => item.valor === abaParametro) ? (abaParametro as ValorAba) : 'resumo'

  if (isPending) {
    return (
      <div className="flex flex-col gap-4">
        <Esqueleto className="h-12 w-64" />
        <Esqueleto className="h-10" />
        <Esqueleto className="h-80 rounded-2xl" />
      </div>
    )
  }

  if (!empresa || !id) return <Navigate to="/" replace />

  const mostraPeriodo = aba === 'resumo' || aba === 'lancamentos'

  return (
    <>
      <CabecalhoPagina
        icone={<IconeEmpresa cor={empresa.cor} icone={empresa.icone} tamanho="lg" />}
        titulo={
          <span className="flex items-center gap-2">
            {empresa.nome}
            {empresa.arquivada && (
              <Distintivo>
                <Archive size={10} /> Arquivada
              </Distintivo>
            )}
          </span>
        }
        descricao={`${empresa.tipo === 'empresa' ? 'Empresa' : 'Trabalho'} · ${formatarPercentual(Number(empresa.participacao))} do lucro para você`}
        acoes={
          <>
            {mostraPeriodo && <SeletorPeriodo />}
            <Botao tamanho="sm" icone={Plus} onClick={() => acoes.novoLancamento({ empresa_id: empresa.id })}>
              Lançamento
            </Botao>
          </>
        }
      />

      <Abas
        abas={[...abas]}
        ativa={aba}
        aoMudar={(valor) => setParametros(valor === 'resumo' ? {} : { aba: valor }, { replace: true })}
        className="mb-6"
      />

      {aba === 'resumo' && <AbaResumo empresa={empresa} inicio={periodo.inicio} fim={periodo.fim} />}
      {aba === 'lancamentos' && (
        <Cartao semPreenchimento className="overflow-hidden">
          <ListaLancamentos escopo={empresa.id} inicio={periodo.inicio} fim={periodo.fim} />
        </Cartao>
      )}
      {aba === 'custos' && <AbaCustosFixos empresa={empresa} />}
      {aba === 'equipe' && <AbaEquipe empresa={empresa} />}
      {aba === 'folha' && <AbaFolha empresa={empresa} />}
      {aba === 'ajustes' && <AbaAjustes empresa={empresa} />}
    </>
  )
}
