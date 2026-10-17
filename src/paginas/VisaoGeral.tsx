import { Building2, Plus, TrendingDown, TrendingUp, Users, Wallet } from 'lucide-react'
import { useState } from 'react'
import { CartaoEmpresa } from '@/componentes/financeiro/CartaoEmpresa'
import { CartaoIndicador } from '@/componentes/financeiro/CartaoIndicador'
import { GraficoEvolucao, type SerieGrafico } from '@/componentes/financeiro/GraficoEvolucao'
import { ProximasRecorrencias } from '@/componentes/financeiro/ProximasRecorrencias'
import { CabecalhoPagina } from '@/componentes/layout/CabecalhoPagina'
import { SeletorPeriodo } from '@/componentes/layout/SeletorPeriodo'
import { Segmentado } from '@/componentes/ui/Abas'
import { Botao } from '@/componentes/ui/Botao'
import { Cartao } from '@/componentes/ui/Cartao'
import { EstadoVazio, Esqueleto } from '@/componentes/ui/Diversos'
import { usePerfil } from '@/consultas/perfil'
import { useResumoPeriodo } from '@/consultas/resumos'
import { useAcoes } from '@/contextos/AcoesContexto'
import { usePeriodo } from '@/contextos/PeriodoContexto'
import { useTema } from '@/contextos/TemaContexto'
import { type Granularidade, granularidadeSugerida, opcoesGranularidade } from '@/lib/periodos'

function saudacao() {
  const hora = new Date().getHours()
  if (hora < 12) return 'Bom dia'
  if (hora < 18) return 'Boa tarde'
  return 'Boa noite'
}

export default function VisaoGeral() {
  const { periodo } = usePeriodo()
  const { data: resumo, isPending } = useResumoPeriodo(periodo.inicio, periodo.fim)
  const { data: perfil } = usePerfil()
  const { escuro } = useTema()
  const acoes = useAcoes()
  const [granularidadeEscolhida, setGranularidade] = useState<Granularidade | null>(null)
  const granularidade = granularidadeEscolhida ?? granularidadeSugerida(periodo)

  const series: SerieGrafico[] = [
    { chave: 'das_empresas', rotulo: 'Das empresas', cor: escuro ? '#8fd46a' : '#7cc04f', forma: 'barra' },
    { chave: 'despesas', rotulo: 'Despesas', cor: escuro ? '#f87171' : '#e23b3b', forma: 'barra' },
    { chave: 'receitas', rotulo: 'Receitas', cor: escuro ? '#34d399' : '#0f9f6e', forma: 'barra' },
    { chave: 'resultado', rotulo: 'Resultado', cor: escuro ? '#eef1ec' : '#131512', forma: 'linha' },
  ]

  const resultado = resumo ? resumo.receitas - resumo.despesas + resumo.vindo_empresas : undefined
  const empresas = (resumo?.empresas ?? []).filter((empresa) => !empresa.arquivada)
  const primeiroNome = perfil?.nome?.split(' ')[0]

  return (
    <>
      <CabecalhoPagina
        titulo="Visão geral"
        descricao={
          primeiroNome
            ? `${saudacao()}, ${primeiroNome}. Seu resultado pessoal somando o que vem das empresas e trabalhos.`
            : 'Seu resultado pessoal somando o que vem das empresas e trabalhos.'
        }
        acoes={
          <>
            <SeletorPeriodo />
            <Botao tamanho="sm" icone={Plus} onClick={() => acoes.novoLancamento()} className="hidden sm:inline-flex">
              Lançamento
            </Botao>
          </>
        }
      />

      <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
        <CartaoIndicador rotulo="Resultado pessoal" valor={resultado} icone={Wallet} tom="primaria" destaque moeda={perfil?.moeda} />
        <CartaoIndicador rotulo="Receitas pessoais" valor={resumo?.receitas} icone={TrendingUp} tom="receita" moeda={perfil?.moeda} />
        <CartaoIndicador rotulo="Despesas pessoais" valor={resumo?.despesas} icone={TrendingDown} tom="despesa" moeda={perfil?.moeda} />
        <CartaoIndicador rotulo="Vindo das empresas" valor={resumo?.vindo_empresas} icone={Users} moeda={perfil?.moeda} />
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
        <Cartao
          titulo="Evolução do resultado pessoal"
          acao={<Segmentado rotulo="Agrupar por" opcoes={opcoesGranularidade} ativo={granularidade} aoMudar={setGranularidade} />}
        >
          {isPending || !resumo ? (
            <Esqueleto className="h-[270px]" />
          ) : (
            <GraficoEvolucao dados={resumo.serie} series={series} granularidade={granularidade} />
          )}
        </Cartao>
        <ProximasRecorrencias />
      </div>

      <section className="mt-8">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold">Empresas e trabalhos</h2>
          <Botao variante="secundaria" tamanho="sm" icone={Plus} onClick={acoes.novaEmpresa}>
            Nova empresa/trabalho
          </Botao>
        </div>

        {isPending ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <Esqueleto className="h-48 rounded-2xl" />
            <Esqueleto className="h-48 rounded-2xl" />
          </div>
        ) : empresas.length === 0 ? (
          <Cartao>
            <EstadoVazio
              icone={Building2}
              titulo="Você ainda não cadastrou empresas ou trabalhos"
              descricao="Separe o caixa de cada negócio, controle folha de pagamento e custos fixos, e veja quanto do lucro vem para você."
              acao={
                <Botao icone={Plus} onClick={acoes.novaEmpresa}>
                  Criar a primeira
                </Botao>
              }
            />
          </Cartao>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {empresas.map((empresa) => (
              <CartaoEmpresa key={empresa.id} empresa={empresa} />
            ))}
          </div>
        )}
      </section>
    </>
  )
}
