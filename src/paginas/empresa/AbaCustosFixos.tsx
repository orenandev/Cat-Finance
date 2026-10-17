import { Plus, Repeat } from 'lucide-react'
import { ListaRecorrencias } from '@/componentes/financeiro/ListaRecorrencias'
import { Botao } from '@/componentes/ui/Botao'
import { Cartao } from '@/componentes/ui/Cartao'
import { EstadoVazio, Esqueleto } from '@/componentes/ui/Diversos'
import { equivalenteMensal, useRecorrencias } from '@/consultas/recorrencias'
import { useAcoes } from '@/contextos/AcoesContexto'
import { formatarMoeda } from '@/lib/formatacao'
import type { Empresa } from '@/tipos/dominio'

export function AbaCustosFixos({ empresa }: { empresa: Empresa }) {
  const { data, isPending } = useRecorrencias()
  const acoes = useAcoes()
  const daEmpresa = (data ?? []).filter((recorrencia) => recorrencia.empresa_id === empresa.id)
  const custosFixos = daEmpresa.filter((recorrencia) => recorrencia.tipo === 'despesa' && recorrencia.custo_fixo)
  const outras = daEmpresa.filter((recorrencia) => !(recorrencia.tipo === 'despesa' && recorrencia.custo_fixo))
  const totalMensal = custosFixos
    .filter((recorrencia) => recorrencia.ativa)
    .reduce((soma, recorrencia) => soma + equivalenteMensal(recorrencia), 0)

  const adicionar = () => acoes.novaRecorrencia({ empresa_id: empresa.id, tipo: 'despesa', custo_fixo: true })

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3 rounded-2xl border border-borda bg-superficie p-4 shadow-cartao sm:flex-row sm:items-center sm:justify-between sm:p-5">
        <div>
          <p className="text-xs text-texto-suave">Total de custos fixos por mês</p>
          <p className="numero mt-1 text-2xl font-semibold text-despesa">{formatarMoeda(totalMensal)}</p>
          <p className="mt-0.5 text-[11px] text-texto-fraco">Valores semanais, trimestrais e anuais convertidos para o equivalente mensal.</p>
        </div>
        <Botao icone={Plus} onClick={adicionar}>
          Novo custo fixo
        </Botao>
      </div>

      <Cartao titulo="Custos fixos" descricao="Aluguel, sistemas, contador, internet… tudo que se repete." semPreenchimento className="overflow-hidden">
        {isPending ? (
          <Esqueleto className="m-5 h-32" />
        ) : custosFixos.length === 0 ? (
          <EstadoVazio
            icone={Repeat}
            titulo="Nenhum custo fixo cadastrado"
            descricao="Cadastre os gastos que se repetem para saber o ponto de equilíbrio da empresa."
            acao={
              <Botao tamanho="sm" icone={Plus} onClick={adicionar}>
                Adicionar
              </Botao>
            }
          />
        ) : (
          <ListaRecorrencias recorrencias={custosFixos} />
        )}
      </Cartao>

      {outras.length > 0 && (
        <Cartao titulo="Outras recorrências da empresa" semPreenchimento className="overflow-hidden">
          <ListaRecorrencias recorrencias={outras} />
        </Cartao>
      )}
    </div>
  )
}
