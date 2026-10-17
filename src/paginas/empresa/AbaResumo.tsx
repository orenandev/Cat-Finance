import { Gauge, HandCoins, Scale, Target, TrendingDown, TrendingUp, Wallet } from 'lucide-react'
import { useState } from 'react'
import { CartaoIndicador } from '@/componentes/financeiro/CartaoIndicador'
import { DistribuicaoCategorias } from '@/componentes/financeiro/DistribuicaoCategorias'
import { GraficoEvolucao, type SerieGrafico } from '@/componentes/financeiro/GraficoEvolucao'
import { ProximasRecorrencias } from '@/componentes/financeiro/ProximasRecorrencias'
import { Segmentado } from '@/componentes/ui/Abas'
import { Cartao } from '@/componentes/ui/Cartao'
import { Esqueleto } from '@/componentes/ui/Diversos'
import { useResumoEmpresa } from '@/consultas/resumos'
import { usePeriodo } from '@/contextos/PeriodoContexto'
import { useTema } from '@/contextos/TemaContexto'
import { cx } from '@/lib/classes'
import { formatarMoeda } from '@/lib/formatacao'
import { type Granularidade, granularidadeSugerida, opcoesGranularidade } from '@/lib/periodos'
import type { Empresa } from '@/tipos/dominio'

function LinhaSaude({ icone: Icone, rotulo, valor, detalhe }: { icone: typeof Gauge; rotulo: string; valor: string; detalhe?: string }) {
  return (
    <li className="flex items-start gap-3">
      <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-superficie-2 text-texto-suave">
        <Icone size={15} />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-xs text-texto-suave">{rotulo}</p>
        <p className="numero text-sm font-semibold text-texto">{valor}</p>
        {detalhe && <p className="text-[11px] text-texto-fraco">{detalhe}</p>}
      </div>
    </li>
  )
}

export function AbaResumo({ empresa, inicio, fim }: { empresa: Empresa; inicio: string; fim: string }) {
  const { periodo } = usePeriodo()
  const { data: resumo, isPending } = useResumoEmpresa(empresa.id, inicio, fim)
  const { escuro } = useTema()
  const [granularidadeEscolhida, setGranularidade] = useState<Granularidade | null>(null)
  const granularidade = granularidadeEscolhida ?? granularidadeSugerida(periodo)

  const series: SerieGrafico[] = [
    { chave: 'receitas', rotulo: 'Receitas', cor: escuro ? '#34d399' : '#0f9f6e', forma: 'barra' },
    { chave: 'despesas', rotulo: 'Despesas', cor: escuro ? '#f87171' : '#e23b3b', forma: 'barra' },
    { chave: 'lucro', rotulo: 'Lucro', cor: escuro ? '#eef1ec' : '#131512', forma: 'linha' },
  ]

  const lucro = resumo ? resumo.receitas - resumo.despesas : undefined
  const paraVoce = lucro !== undefined ? (lucro * Number(empresa.participacao)) / 100 : undefined
  const margem = resumo && resumo.receitas > 0 ? ((resumo.receitas - resumo.despesas) / resumo.receitas) * 100 : null
  const custoMensal = resumo ? Number(resumo.custos_fixos_mensais) + Number(resumo.folha_mensal) : 0
  const meta = empresa.meta_mensal ? Number(empresa.meta_mensal) : null
  const progressoMeta = meta && resumo ? Math.min(100, (resumo.receitas / meta) * 100) : 0

  return (
    <>
      <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
        <CartaoIndicador rotulo="Receitas" valor={resumo?.receitas} icone={TrendingUp} tom="receita" />
        <CartaoIndicador rotulo="Despesas" valor={resumo?.despesas} icone={TrendingDown} tom="despesa" />
        <CartaoIndicador rotulo="Lucro" valor={lucro} icone={Scale} tom={lucro !== undefined && lucro < 0 ? 'despesa' : 'neutro'} />
        <CartaoIndicador rotulo="Para você" valor={paraVoce} icone={Wallet} tom="primaria" destaque />
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-[minmax(0,1fr)_300px]">
        <Cartao
          titulo="Evolução do caixa"
          acao={<Segmentado rotulo="Agrupar por" opcoes={opcoesGranularidade} ativo={granularidade} aoMudar={setGranularidade} />}
        >
          {isPending || !resumo ? (
            <Esqueleto className="h-[270px]" />
          ) : (
            <GraficoEvolucao dados={resumo.serie} series={series} granularidade={granularidade} />
          )}
        </Cartao>

        <Cartao titulo="Saúde do negócio">
          {isPending || !resumo ? (
            <Esqueleto className="h-56" />
          ) : (
            <ul className="flex flex-col gap-4">
              <LinhaSaude
                icone={Gauge}
                rotulo="Margem de lucro"
                valor={margem === null ? '—' : `${margem.toFixed(1).replace('.', ',')}%`}
                detalhe={margem === null ? 'Sem receitas no período' : margem < 10 ? 'Atenção: margem apertada' : 'Margem saudável'}
              />
              <LinhaSaude
                icone={HandCoins}
                rotulo="Custos fixos mensais"
                valor={formatarMoeda(Number(resumo.custos_fixos_mensais))}
                detalhe="Soma das recorrências marcadas como custo fixo"
              />
              <LinhaSaude
                icone={Wallet}
                rotulo="Folha mensal"
                valor={formatarMoeda(Number(resumo.folha_mensal))}
                detalhe={`${resumo.funcionarios_ativos} ${resumo.funcionarios_ativos === 1 ? 'pessoa ativa' : 'pessoas ativas'}`}
              />
              <LinhaSaude
                icone={Scale}
                rotulo="Ponto de equilíbrio"
                valor={`${formatarMoeda(custoMensal)}/mês`}
                detalhe="Faturamento mínimo para cobrir custos fixos e folha"
              />
              {meta && (
                <li>
                  <div className="flex items-center gap-3">
                    <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-superficie-2 text-texto-suave">
                      <Target size={15} />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs text-texto-suave">Meta de faturamento</p>
                      <p className="numero text-sm font-semibold">
                        {Math.round(progressoMeta)}% de {formatarMoeda(meta)}
                      </p>
                    </div>
                  </div>
                  <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-superficie-3">
                    <div
                      className={cx('h-full rounded-full transition-[width]', progressoMeta >= 100 ? 'bg-receita' : 'bg-marca')}
                      style={{ width: `${progressoMeta}%` }}
                    />
                  </div>
                </li>
              )}
            </ul>
          )}
        </Cartao>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <DistribuicaoCategorias totais={resumo?.por_categoria} carregando={isPending} />
        <ProximasRecorrencias empresaId={empresa.id} />
      </div>
    </>
  )
}
