import { CalendarClock } from 'lucide-react'
import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { Cartao } from '@/componentes/ui/Cartao'
import { EstadoVazio, Esqueleto } from '@/componentes/ui/Diversos'
import { useEmpresas } from '@/consultas/empresas'
import { useRecorrencias } from '@/consultas/recorrencias'
import { cx } from '@/lib/classes'
import { formatarDataCurta, formatarMoeda, paraData, paraIso } from '@/lib/formatacao'

interface Ocorrencia {
  chave: string
  data: string
  descricao: string
  valor: number
  tipo: 'receita' | 'despesa'
  origem: string
}

const PASSOS = { semanal: [0, 7], quinzenal: [0, 14], mensal: [1, 0], trimestral: [3, 0], anual: [12, 0] } as const

export function ProximasRecorrencias({ empresaId, dias = 30 }: { empresaId?: string; dias?: number }) {
  const { data: recorrencias, isPending } = useRecorrencias()
  const { data: empresas = [] } = useEmpresas()

  const ocorrencias = useMemo(() => {
    const hoje = new Date()
    const limite = paraIso(new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate() + dias))
    const nomes = new Map(empresas.map((empresa) => [empresa.id, empresa.nome]))
    const lista: Ocorrencia[] = []

    for (const recorrencia of recorrencias ?? []) {
      if (!recorrencia.ativa) continue
      if (empresaId && recorrencia.empresa_id !== empresaId) continue

      const [meses, diasPasso] = PASSOS[recorrencia.frequencia]
      const inicio = paraData(recorrencia.inicio_em)
      for (let indice = recorrencia.ocorrencias; indice < recorrencia.ocorrencias + 12; indice++) {
        const data = new Date(inicio.getFullYear(), inicio.getMonth() + meses * indice, inicio.getDate() + diasPasso * indice)
        if (meses && data.getDate() !== inicio.getDate()) data.setDate(0)
        const iso = paraIso(data)
        if (iso > limite || (recorrencia.fim_em && iso > recorrencia.fim_em)) break
        lista.push({
          chave: `${recorrencia.id}-${indice}`,
          data: iso,
          descricao: recorrencia.descricao,
          valor: Number(recorrencia.valor),
          tipo: recorrencia.tipo,
          origem: recorrencia.empresa_id ? (nomes.get(recorrencia.empresa_id) ?? 'Empresa') : 'Pessoal',
        })
      }
    }

    return lista.sort((a, b) => a.data.localeCompare(b.data)).slice(0, 8)
  }, [recorrencias, empresas, empresaId, dias])

  return (
    <Cartao
      titulo="Próximos lançamentos recorrentes"
      acao={
        <Link to="/recorrencias" className="text-xs font-medium text-primaria-texto hover:underline">
          Ver todos
        </Link>
      }
      className="flex flex-col"
    >
      {isPending ? (
        <div className="space-y-3">
          {[0, 1, 2].map((indice) => (
            <Esqueleto key={indice} className="h-10" />
          ))}
        </div>
      ) : ocorrencias.length === 0 ? (
        <EstadoVazio icone={CalendarClock} titulo={`Nenhum lançamento recorrente nos próximos ${dias} dias.`} compacto />
      ) : (
        <ul className="-mx-1 flex flex-col">
          {ocorrencias.map((ocorrencia) => (
            <li key={ocorrencia.chave} className="flex items-center gap-3 rounded-lg px-1 py-2">
              <span className="grid w-11 shrink-0 place-items-center rounded-lg bg-superficie-2 py-1 text-center">
                <span className="numero text-[11px] font-semibold text-texto">{formatarDataCurta(ocorrencia.data)}</span>
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-[13px] text-texto">{ocorrencia.descricao}</p>
                <p className="truncate text-[11px] text-texto-fraco">{ocorrencia.origem}</p>
              </div>
              <span className={cx('numero text-[13px] font-medium', ocorrencia.tipo === 'receita' ? 'text-receita' : 'text-despesa')}>
                {ocorrencia.tipo === 'receita' ? '+' : '−'}
                {formatarMoeda(ocorrencia.valor)}
              </span>
            </li>
          ))}
        </ul>
      )}
    </Cartao>
  )
}
