import { PieChart as IconePizza } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Cell, Pie, PieChart, ResponsiveContainer } from 'recharts'
import { Segmentado } from '@/componentes/ui/Abas'
import { Cartao } from '@/componentes/ui/Cartao'
import { EstadoVazio, Esqueleto } from '@/componentes/ui/Diversos'
import type { TotalCategoria } from '@/consultas/resumos'
import { corHex } from '@/lib/aparencia'
import { formatarMoeda, formatarMoedaCompacta } from '@/lib/formatacao'
import type { TipoLancamento } from '@/tipos/dominio'

interface PropsDistribuicao {
  totais: { tipo: TipoLancamento; nome: string; cor: string; total: number }[] | TotalCategoria[] | undefined
  carregando?: boolean
}

export function DistribuicaoCategorias({ totais, carregando }: PropsDistribuicao) {
  const [tipo, setTipo] = useState<TipoLancamento>('despesa')

  const itens = useMemo(
    () => (totais ?? []).filter((item) => item.tipo === tipo).map((item) => ({ ...item, total: Number(item.total) })),
    [totais, tipo],
  )
  const soma = itens.reduce((acumulado, item) => acumulado + item.total, 0)

  return (
    <Cartao
      titulo="Por categoria"
      acao={
        <Segmentado
          rotulo="Tipo"
          ativo={tipo}
          aoMudar={setTipo}
          opcoes={[
            { valor: 'despesa', rotulo: 'Saídas' },
            { valor: 'receita', rotulo: 'Entradas' },
          ]}
        />
      }
    >
      {carregando ? (
        <Esqueleto className="h-56" />
      ) : itens.length === 0 ? (
        <EstadoVazio icone={IconePizza} titulo="Sem dados no período" compacto />
      ) : (
        <div className="flex flex-col gap-4">
          <div className="relative mx-auto h-40 w-40">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={itens} dataKey="total" nameKey="nome" innerRadius="70%" outerRadius="100%" paddingAngle={2} stroke="none">
                  {itens.map((item) => (
                    <Cell key={item.nome} fill={corHex(item.cor)} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-[10px] text-texto-fraco">Total</span>
              <span className="numero text-sm font-semibold">{formatarMoedaCompacta(soma)}</span>
            </div>
          </div>
          <ul className="flex flex-col gap-2">
            {itens.slice(0, 7).map((item) => {
              const parcela = soma > 0 ? item.total / soma : 0
              return (
                <li key={item.nome} className="text-xs">
                  <div className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full" style={{ backgroundColor: corHex(item.cor) }} />
                    <span className="flex-1 truncate text-texto">{item.nome}</span>
                    <span className="numero text-texto-suave">{formatarMoeda(item.total)}</span>
                  </div>
                  <div className="mt-1 ml-4 h-1 overflow-hidden rounded-full bg-superficie-3">
                    <div className="h-full rounded-full" style={{ width: `${parcela * 100}%`, backgroundColor: corHex(item.cor) }} />
                  </div>
                </li>
              )
            })}
          </ul>
        </div>
      )}
    </Cartao>
  )
}
