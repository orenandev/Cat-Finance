import { CalendarCheck, CheckCircle2, FileSpreadsheet, RefreshCw, RotateCcw, Trash2, Users, X } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Botao } from '@/componentes/ui/Botao'
import { Campo } from '@/componentes/ui/Campo'
import { Cartao } from '@/componentes/ui/Cartao'
import { Distintivo, EstadoVazio, Esqueleto } from '@/componentes/ui/Diversos'
import { Modal } from '@/componentes/ui/Modal'
import {
  useAtualizarItemFolha,
  useExcluirFolha,
  useFolhas,
  useGerarFolha,
  useItensFolha,
  usePagarFolha,
  useReabrirFolha,
  useRemoverItemFolha,
} from '@/consultas/equipe'
import { useConfirmacao } from '@/contextos/ConfirmacaoContexto'
import { cx } from '@/lib/classes'
import { formatarData, formatarMes, formatarMoeda, hojeIso } from '@/lib/formatacao'
import type { Empresa, ItemFolha } from '@/tipos/dominio'

const formatadorEntrada = new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

function EntradaValor({
  valor,
  aoConfirmar,
  desabilitado,
  rotulo,
}: {
  valor: number
  aoConfirmar: (valor: number) => void
  desabilitado?: boolean
  rotulo: string
}) {
  const [local, setLocal] = useState(valor)

  return (
    <input
      aria-label={rotulo}
      inputMode="numeric"
      disabled={desabilitado}
      value={formatadorEntrada.format(local)}
      onChange={(evento) => setLocal(Number(evento.target.value.replace(/\D/g, '').slice(0, 12) || '0') / 100)}
      onBlur={() => local !== valor && aoConfirmar(local)}
      onKeyDown={(evento) => evento.key === 'Enter' && evento.currentTarget.blur()}
      className="numero h-8 w-full min-w-0 rounded-lg border border-transparent bg-superficie-2 px-2 text-right text-xs outline-none transition-colors hover:border-borda focus:border-marca focus:bg-superficie disabled:bg-transparent disabled:hover:border-transparent"
    />
  )
}

function competenciaAtual() {
  return `${hojeIso().slice(0, 7)}-01`
}

export function AbaFolha({ empresa }: { empresa: Empresa }) {
  const [competencia, setCompetencia] = useState(competenciaAtual)
  const [modalPagamento, setModalPagamento] = useState(false)
  const [dataPagamento, setDataPagamento] = useState(hojeIso)
  const { data: folhas = [], isPending: carregandoFolhas } = useFolhas(empresa.id)
  const folha = useMemo(() => folhas.find((item) => item.competencia === competencia), [folhas, competencia])
  const { data: itens = [], isPending: carregandoItens } = useItensFolha(folha?.id)

  const gerar = useGerarFolha(empresa.id)
  const pagar = usePagarFolha(empresa.id)
  const reabrir = useReabrirFolha(empresa.id)
  const excluir = useExcluirFolha(empresa.id)
  const atualizarItem = useAtualizarItemFolha(empresa.id, folha?.id ?? '')
  const removerItem = useRemoverItemFolha(empresa.id, folha?.id ?? '')
  const confirmar = useConfirmacao()

  const paga = folha?.status === 'paga'
  const totais = itens.reduce(
    (soma, item) => ({
      base: soma.base + Number(item.salario_base),
      adicionais: soma.adicionais + Number(item.adicionais),
      descontos: soma.descontos + Number(item.descontos),
      liquido: soma.liquido + Number(item.liquido),
    }),
    { base: 0, adicionais: 0, descontos: 0, liquido: 0 },
  )

  function salvarItem(item: ItemFolha, alteracao: Partial<Pick<ItemFolha, 'salario_base' | 'adicionais' | 'descontos'>>) {
    atualizarItem.mutate({
      id: item.id,
      salario_base: Number(item.salario_base),
      adicionais: Number(item.adicionais),
      descontos: Number(item.descontos),
      ...alteracao,
    })
  }

  async function confirmarReabertura() {
    if (!folha) return
    const confirmado = await confirmar({
      titulo: 'Reabrir folha?',
      descricao: 'O lançamento de despesa gerado no pagamento será estornado e a folha voltará a ser editável.',
      confirmar: 'Reabrir',
    })
    if (confirmado) reabrir.mutate(folha.id)
  }

  async function confirmarExclusao() {
    if (!folha) return
    const confirmado = await confirmar({
      titulo: 'Excluir esta folha?',
      descricao: `A folha de ${formatarMes(folha.competencia)} e seus itens serão removidos.`,
      confirmar: 'Excluir',
      perigo: true,
    })
    if (confirmado) excluir.mutate(folha.id)
  }

  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_260px]">
      <div className="flex min-w-0 flex-col gap-4">
        <div className="flex flex-col gap-3 rounded-2xl border border-borda bg-superficie p-4 shadow-cartao sm:flex-row sm:items-end sm:justify-between sm:p-5">
          <Campo
            rotulo="Competência"
            type="month"
            value={competencia.slice(0, 7)}
            onChange={(evento) => evento.target.value && setCompetencia(`${evento.target.value}-01`)}
            classeMoldura="sm:w-48"
          />
          <div className="flex flex-wrap gap-2">
            {!paga && (
              <Botao
                variante={folha ? 'secundaria' : 'primaria'}
                icone={folha ? RefreshCw : FileSpreadsheet}
                carregando={gerar.isPending}
                onClick={() => gerar.mutate(competencia)}
              >
                {folha ? 'Incluir novos da equipe' : 'Gerar folha'}
              </Botao>
            )}
            {folha && !paga && (
              <Botao icone={CheckCircle2} disabled={totais.liquido <= 0} onClick={() => setModalPagamento(true)}>
                Pagar folha
              </Botao>
            )}
            {paga && (
              <Botao variante="secundaria" icone={RotateCcw} carregando={reabrir.isPending} onClick={confirmarReabertura}>
                Reabrir
              </Botao>
            )}
          </div>
        </div>

        <Cartao
          titulo={`Folha de ${formatarMes(competencia)}`}
          descricao={
            folha
              ? paga
                ? `Paga em ${formatarData(folha.paga_em!)} e lançada como despesa da empresa.`
                : 'Ajuste adicionais (horas extras, bônus) e descontos (faltas, adiantamentos) antes de pagar.'
              : undefined
          }
          acao={folha && <Distintivo tom={paga ? 'receita' : 'alerta'}>{paga ? 'Paga' : 'Aberta'}</Distintivo>}
          semPreenchimento
          className="overflow-hidden"
        >
          {carregandoFolhas || (folha && carregandoItens) ? (
            <Esqueleto className="m-5 h-40" />
          ) : !folha ? (
            <EstadoVazio
              icone={FileSpreadsheet}
              titulo="Nenhuma folha para esta competência"
              descricao="Gere a folha para puxar automaticamente todas as pessoas ativas da equipe com seus salários."
              acao={
                <Botao icone={FileSpreadsheet} carregando={gerar.isPending} onClick={() => gerar.mutate(competencia)}>
                  Gerar folha
                </Botao>
              }
            />
          ) : itens.length === 0 ? (
            <EstadoVazio
              icone={Users}
              titulo="A folha está vazia"
              descricao="Cadastre pessoas ativas na aba Equipe e clique em “Incluir novos da equipe”."
              acao={
                <Botao variante="secundaria" icone={Trash2} onClick={confirmarExclusao}>
                  Excluir folha vazia
                </Botao>
              }
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[620px] text-xs">
                <thead>
                  <tr className="border-y border-borda bg-superficie-2 text-left text-[11px] text-texto-suave">
                    <th className="px-4 py-2 font-medium sm:px-5">Pessoa</th>
                    <th className="w-28 px-2 py-2 text-right font-medium">Base</th>
                    <th className="w-28 px-2 py-2 text-right font-medium">Adicionais</th>
                    <th className="w-28 px-2 py-2 text-right font-medium">Descontos</th>
                    <th className="w-28 px-2 py-2 text-right font-medium">Líquido</th>
                    <th className="w-10" />
                  </tr>
                </thead>
                <tbody>
                  {itens.map((item) => (
                    <tr key={item.id} className="border-b border-borda last:border-b-0">
                      <td className="px-4 py-2 sm:px-5">
                        <p className="truncate font-medium text-texto">{item.nome}</p>
                        {item.cargo && <p className="truncate text-[11px] text-texto-fraco">{item.cargo}</p>}
                      </td>
                      <td className="px-2 py-2">
                        <EntradaValor key={`b${item.salario_base}`} rotulo={`Base de ${item.nome}`} valor={Number(item.salario_base)} desabilitado={paga} aoConfirmar={(valor) => salvarItem(item, { salario_base: valor })} />
                      </td>
                      <td className="px-2 py-2">
                        <EntradaValor key={`a${item.adicionais}`} rotulo={`Adicionais de ${item.nome}`} valor={Number(item.adicionais)} desabilitado={paga} aoConfirmar={(valor) => salvarItem(item, { adicionais: valor })} />
                      </td>
                      <td className="px-2 py-2">
                        <EntradaValor key={`d${item.descontos}`} rotulo={`Descontos de ${item.nome}`} valor={Number(item.descontos)} desabilitado={paga} aoConfirmar={(valor) => salvarItem(item, { descontos: valor })} />
                      </td>
                      <td className="numero px-2 py-2 text-right font-semibold">{formatarMoeda(Number(item.liquido))}</td>
                      <td className="pr-3">
                        {!paga && (
                          <button
                            type="button"
                            aria-label={`Remover ${item.nome} desta folha`}
                            onClick={() => removerItem.mutate(item.id)}
                            className="rounded-md p-1 text-texto-fraco hover:bg-despesa-suave hover:text-despesa"
                          >
                            <X size={14} />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="border-t border-borda bg-superficie-2 font-semibold">
                    <td className="px-4 py-3 sm:px-5">Total</td>
                    <td className="numero px-2 py-3 text-right">{formatarMoeda(totais.base)}</td>
                    <td className="numero px-2 py-3 text-right text-receita">{formatarMoeda(totais.adicionais)}</td>
                    <td className="numero px-2 py-3 text-right text-despesa">{formatarMoeda(totais.descontos)}</td>
                    <td className="numero px-2 py-3 text-right text-primaria-texto">{formatarMoeda(totais.liquido)}</td>
                    <td />
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </Cartao>
      </div>

      <Cartao titulo="Histórico" className="h-fit">
        {carregandoFolhas ? (
          <Esqueleto className="h-32" />
        ) : folhas.length === 0 ? (
          <p className="text-xs text-texto-fraco">Nenhuma folha gerada ainda.</p>
        ) : (
          <ul className="-mx-2 flex flex-col">
            {folhas.map((item) => (
              <li key={item.id}>
                <button
                  type="button"
                  onClick={() => setCompetencia(item.competencia)}
                  className={cx(
                    'flex w-full items-center gap-2 rounded-lg px-2 py-2 text-left transition-colors',
                    item.competencia === competencia ? 'bg-primaria-suave' : 'hover:bg-superficie-2',
                  )}
                >
                  <CalendarCheck size={14} className={item.status === 'paga' ? 'text-receita' : 'text-alerta'} />
                  <span className="flex-1 text-xs">{formatarMes(item.competencia)}</span>
                  <span className="numero text-xs font-medium">{formatarMoeda(Number(item.total))}</span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </Cartao>

      <Modal
        aberto={modalPagamento}
        aoFechar={() => setModalPagamento(false)}
        titulo="Confirmar pagamento da folha"
        descricao={`Será criada uma despesa de ${formatarMoeda(totais.liquido)} no caixa de ${empresa.nome}.`}
        largura="sm"
        rodape={
          <>
            <Botao variante="secundaria" onClick={() => setModalPagamento(false)}>
              Cancelar
            </Botao>
            <Botao
              icone={CheckCircle2}
              carregando={pagar.isPending}
              onClick={() =>
                folha &&
                pagar.mutate(
                  { folhaId: folha.id, data: dataPagamento },
                  { onSuccess: () => setModalPagamento(false) },
                )
              }
            >
              Confirmar pagamento
            </Botao>
          </>
        }
      >
        <Campo rotulo="Data do pagamento" type="date" value={dataPagamento} onChange={(evento) => setDataPagamento(evento.target.value)} />
      </Modal>
    </div>
  )
}
