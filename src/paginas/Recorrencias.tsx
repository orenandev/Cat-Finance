import { ArrowLeftRight, Plus } from 'lucide-react'
import { useMemo, useState } from 'react'
import { ListaRecorrencias } from '@/componentes/financeiro/ListaRecorrencias'
import { CabecalhoPagina } from '@/componentes/layout/CabecalhoPagina'
import { Segmentado } from '@/componentes/ui/Abas'
import { Botao } from '@/componentes/ui/Botao'
import { Cartao } from '@/componentes/ui/Cartao'
import { EstadoVazio, Esqueleto } from '@/componentes/ui/Diversos'
import { equivalenteMensal, useRecorrencias } from '@/consultas/recorrencias'
import { useAcoes } from '@/contextos/AcoesContexto'
import { formatarMoeda } from '@/lib/formatacao'

type Filtro = 'todas' | 'pessoal' | 'empresas'

export default function Recorrencias() {
  const { data: recorrencias = [], isPending } = useRecorrencias()
  const acoes = useAcoes()
  const [filtro, setFiltro] = useState<Filtro>('todas')

  const filtradas = useMemo(
    () =>
      recorrencias.filter((recorrencia) =>
        filtro === 'todas' ? true : filtro === 'pessoal' ? !recorrencia.empresa_id : Boolean(recorrencia.empresa_id),
      ),
    [recorrencias, filtro],
  )

  const totais = useMemo(() => {
    let entradas = 0
    let saidas = 0
    for (const recorrencia of filtradas) {
      if (!recorrencia.ativa) continue
      if (recorrencia.tipo === 'receita') entradas += equivalenteMensal(recorrencia)
      else saidas += equivalenteMensal(recorrencia)
    }
    return { entradas, saidas, saldo: entradas - saidas }
  }, [filtradas])

  return (
    <>
      <CabecalhoPagina
        titulo="Recorrências"
        descricao="Salários, assinaturas, aluguel e tudo que se repete — lançado automaticamente na data certa."
        acoes={
          <Botao tamanho="sm" icone={Plus} onClick={() => acoes.novaRecorrencia()}>
            Nova recorrência
          </Botao>
        }
      />

      <div className="grid grid-cols-3 gap-3 sm:gap-4">
        {[
          { rotulo: 'Entradas/mês', valor: totais.entradas, cor: 'text-receita' },
          { rotulo: 'Saídas/mês', valor: totais.saidas, cor: 'text-despesa' },
          { rotulo: 'Saldo/mês', valor: totais.saldo, cor: totais.saldo < 0 ? 'text-despesa' : 'text-primaria-texto' },
        ].map((item) => (
          <div key={item.rotulo} className="rounded-2xl border border-borda bg-superficie p-3 shadow-cartao sm:p-5">
            <p className="text-[11px] text-texto-suave sm:text-xs">{item.rotulo}</p>
            <p className={`numero mt-1 truncate text-sm font-semibold sm:text-xl ${item.cor}`}>{formatarMoeda(item.valor)}</p>
          </div>
        ))}
      </div>

      <Cartao
        titulo="Todas as recorrências"
        acao={
          <Segmentado
            rotulo="Filtrar"
            ativo={filtro}
            aoMudar={setFiltro}
            opcoes={[
              { valor: 'todas', rotulo: 'Todas' },
              { valor: 'pessoal', rotulo: 'Pessoal' },
              { valor: 'empresas', rotulo: 'Empresas' },
            ]}
          />
        }
        semPreenchimento
        className="mt-4 overflow-hidden"
      >
        {isPending ? (
          <Esqueleto className="m-5 h-40" />
        ) : filtradas.length === 0 ? (
          <EstadoVazio
            icone={ArrowLeftRight}
            titulo="Nenhuma recorrência por aqui"
            descricao="Cadastre uma vez e o Catfinance lança sozinho todo mês, semana ou ano."
            acao={
              <Botao tamanho="sm" icone={Plus} onClick={() => acoes.novaRecorrencia()}>
                Criar recorrência
              </Botao>
            }
          />
        ) : (
          <div className="border-t border-borda">
            <ListaRecorrencias recorrencias={filtradas} mostrarOrigem />
          </div>
        )}
      </Cartao>
    </>
  )
}
