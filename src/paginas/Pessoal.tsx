import { PiggyBank, Plus, TrendingDown, TrendingUp, Users } from 'lucide-react'
import { useState } from 'react'
import { CartaoIndicador } from '@/componentes/financeiro/CartaoIndicador'
import { DistribuicaoCategorias } from '@/componentes/financeiro/DistribuicaoCategorias'
import { GraficoEvolucao, type SerieGrafico } from '@/componentes/financeiro/GraficoEvolucao'
import { ListaLancamentos } from '@/componentes/financeiro/ListaLancamentos'
import { CabecalhoPagina } from '@/componentes/layout/CabecalhoPagina'
import { SeletorPeriodo } from '@/componentes/layout/SeletorPeriodo'
import { Segmentado } from '@/componentes/ui/Abas'
import { Botao } from '@/componentes/ui/Botao'
import { Cartao } from '@/componentes/ui/Cartao'
import { Esqueleto } from '@/componentes/ui/Diversos'
import { usePerfil } from '@/consultas/perfil'
import { useResumoPeriodo, useTotaisCategoria } from '@/consultas/resumos'
import { useAcoes } from '@/contextos/AcoesContexto'
import { usePeriodo } from '@/contextos/PeriodoContexto'
import { useTema } from '@/contextos/TemaContexto'
import { type Granularidade, granularidadeSugerida, opcoesGranularidade } from '@/lib/periodos'

export default function Pessoal() {
  const { periodo } = usePeriodo()
  const { data: resumo, isPending } = useResumoPeriodo(periodo.inicio, periodo.fim)
  const categorias = useTotaisCategoria(periodo.inicio, periodo.fim, null)
  const { data: perfil } = usePerfil()
  const { escuro } = useTema()
  const acoes = useAcoes()
  const [granularidadeEscolhida, setGranularidade] = useState<Granularidade | null>(null)
  const granularidade = granularidadeEscolhida ?? granularidadeSugerida(periodo)

  const series: SerieGrafico[] = [
    { chave: 'receitas', rotulo: 'Receitas', cor: escuro ? '#34d399' : '#0f9f6e', forma: 'barra' },
    { chave: 'despesas', rotulo: 'Despesas', cor: escuro ? '#f87171' : '#e23b3b', forma: 'barra' },
  ]

  const saldo = resumo ? resumo.receitas - resumo.despesas : undefined
  const taxaPoupanca = resumo && resumo.receitas > 0 ? Math.round(((resumo.receitas - resumo.despesas) / resumo.receitas) * 100) : null

  return (
    <>
      <CabecalhoPagina
        titulo="Pessoal"
        descricao="Suas entradas e saídas pessoais, fora do caixa das empresas."
        acoes={
          <>
            <SeletorPeriodo />
            <Botao tamanho="sm" icone={Plus} onClick={() => acoes.novoLancamento({ empresa_id: null })}>
              Lançamento
            </Botao>
          </>
        }
      />

      <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
        <CartaoIndicador
          rotulo="Saldo pessoal"
          valor={saldo}
          icone={PiggyBank}
          tom="primaria"
          destaque
          moeda={perfil?.moeda}
          rodape={taxaPoupanca !== null ? `Você guardou ${taxaPoupanca}% do que entrou` : undefined}
        />
        <CartaoIndicador rotulo="Receitas" valor={resumo?.receitas} icone={TrendingUp} tom="receita" moeda={perfil?.moeda} />
        <CartaoIndicador rotulo="Despesas" valor={resumo?.despesas} icone={TrendingDown} tom="despesa" moeda={perfil?.moeda} />
        <CartaoIndicador
          rotulo="Vindo das empresas"
          valor={resumo?.vindo_empresas}
          icone={Users}
          moeda={perfil?.moeda}
          rodape="Não incluso no saldo pessoal"
        />
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-[minmax(0,1fr)_300px]">
        <Cartao
          titulo="Entradas e saídas"
          acao={<Segmentado rotulo="Agrupar por" opcoes={opcoesGranularidade} ativo={granularidade} aoMudar={setGranularidade} />}
        >
          {isPending || !resumo ? (
            <Esqueleto className="h-[270px]" />
          ) : (
            <GraficoEvolucao dados={resumo.serie} series={series} granularidade={granularidade} />
          )}
        </Cartao>
        <DistribuicaoCategorias totais={categorias.data} carregando={categorias.isPending} />
      </div>

      <Cartao titulo="Lançamentos" semPreenchimento className="mt-4 overflow-hidden">
        <ListaLancamentos escopo="pessoal" inicio={periodo.inicio} fim={periodo.fim} />
      </Cartao>
    </>
  )
}
