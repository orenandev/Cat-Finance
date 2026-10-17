import { useMemo } from 'react'
import {
  Bar,
  CartesianGrid,
  ComposedChart,
  Line,
  ResponsiveContainer,
  Tooltip,
  type TooltipContentProps,
  type TooltipValueType,
  XAxis,
  YAxis,
} from 'recharts'
import { useTema } from '@/contextos/TemaContexto'
import { formatarMoeda, formatarMoedaCompacta } from '@/lib/formatacao'
import { agruparSerie, type Granularidade } from '@/lib/periodos'

export interface SerieGrafico {
  chave: string
  rotulo: string
  cor: string
  forma: 'barra' | 'linha'
}

interface PropsGraficoEvolucao<T extends { data: string }> {
  dados: T[]
  series: SerieGrafico[]
  granularidade: Granularidade
  altura?: number
}

function Dica({ active, payload, label }: TooltipContentProps<TooltipValueType, string | number>) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-xl border border-borda bg-superficie px-3 py-2.5 text-xs shadow-flutuante">
      <p className="mb-1.5 font-medium text-texto">{label}</p>
      <ul className="space-y-1">
        {payload.map((item) => (
          <li key={String(item.dataKey)} className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full" style={{ backgroundColor: item.color }} />
            <span className="text-texto-suave">{item.name}</span>
            <span className="numero ml-auto pl-4 font-medium text-texto">{formatarMoeda(Number(item.value))}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}

export function GraficoEvolucao<T extends { data: string }>({ dados, series, granularidade, altura = 240 }: PropsGraficoEvolucao<T>) {
  const { escuro } = useTema()
  const campos = useMemo(() => series.map((serie) => serie.chave as keyof T), [series])
  const pontos = useMemo(() => agruparSerie(dados, granularidade, campos), [dados, granularidade, campos])
  const corGrade = escuro ? '#252a37' : '#e8ebf1'
  const corEixo = escuro ? '#6c7286' : '#8a90a3'

  return (
    <div>
      <div style={{ height: altura }} className="-ml-2">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={pontos} margin={{ top: 8, right: 8, bottom: 0, left: 0 }} barGap={2}>
            <CartesianGrid vertical={false} stroke={corGrade} strokeDasharray="3 4" />
            <XAxis
              dataKey="rotulo"
              tickLine={false}
              axisLine={{ stroke: corGrade }}
              tick={{ fontSize: 11, fill: corEixo }}
              minTickGap={18}
              tickMargin={8}
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              tick={{ fontSize: 11, fill: corEixo }}
              tickFormatter={(valor: number) => formatarMoedaCompacta(valor)}
              width={64}
            />
            <Tooltip content={Dica} cursor={{ fill: escuro ? 'rgba(255,255,255,0.04)' : 'rgba(17,24,39,0.04)' }} />
            {series.map((serie) =>
              serie.forma === 'barra' ? (
                <Bar key={serie.chave} dataKey={serie.chave} name={serie.rotulo} fill={serie.cor} radius={[4, 4, 0, 0]} maxBarSize={14} />
              ) : (
                <Line
                  key={serie.chave}
                  dataKey={serie.chave}
                  name={serie.rotulo}
                  stroke={serie.cor}
                  strokeWidth={2}
                  type="monotone"
                  dot={false}
                  activeDot={{ r: 4, strokeWidth: 0 }}
                />
              ),
            )}
          </ComposedChart>
        </ResponsiveContainer>
      </div>
      <ul className="mt-3 flex flex-wrap justify-center gap-x-4 gap-y-1">
        {series.map((serie) => (
          <li key={serie.chave} className="flex items-center gap-1.5 text-[11px]" style={{ color: serie.cor }}>
            <span className="h-2 w-2 rounded-full" style={{ backgroundColor: serie.cor }} />
            {serie.rotulo}
          </li>
        ))}
      </ul>
    </div>
  )
}
