import { Bot, CircleDashed, MoreHorizontal, Pencil, Receipt, Repeat, Search, Trash2, Users } from 'lucide-react'
import { useDeferredValue, useMemo, useState } from 'react'
import { Segmentado } from '@/componentes/ui/Abas'
import { Botao } from '@/componentes/ui/Botao'
import { Campo, Selecao } from '@/componentes/ui/Campo'
import { Distintivo, EstadoVazio, Esqueleto, PontoCor } from '@/componentes/ui/Diversos'
import { ItemMenu, Popover } from '@/componentes/ui/Popover'
import { useCategorias } from '@/consultas/categorias'
import { useEmpresas } from '@/consultas/empresas'
import { type FiltroLancamentos, useAlternarPagamento, useExcluirLancamento, useLancamentos } from '@/consultas/lancamentos'
import { useAcoes } from '@/contextos/AcoesContexto'
import { useConfirmacao } from '@/contextos/ConfirmacaoContexto'
import { cx } from '@/lib/classes'
import { formatarData, formatarMoeda } from '@/lib/formatacao'
import type { Lancamento, TipoLancamento } from '@/tipos/dominio'

interface PropsListaLancamentos {
  escopo: FiltroLancamentos['escopo']
  inicio: string
  fim: string
  mostrarOrigem?: boolean
}

const iconesOrigem = { recorrencia: Repeat, folha: Users, api: Bot } as const
const rotulosOrigem = { recorrencia: 'Recorrente', folha: 'Folha', api: 'API' } as const

function agruparPorDia(itens: Lancamento[]) {
  const grupos = new Map<string, Lancamento[]>()
  for (const item of itens) {
    const lista = grupos.get(item.data)
    if (lista) lista.push(item)
    else grupos.set(item.data, [item])
  }
  return [...grupos.entries()]
}

export function ListaLancamentos({ escopo, inicio, fim, mostrarOrigem }: PropsListaLancamentos) {
  const [tipo, setTipo] = useState<TipoLancamento | 'todos'>('todos')
  const [categoriaId, setCategoriaId] = useState('')
  const [busca, setBusca] = useState('')
  const buscaAdiada = useDeferredValue(busca)

  const filtro = useMemo<FiltroLancamentos>(
    () => ({
      escopo,
      inicio,
      fim,
      tipo: tipo === 'todos' ? undefined : tipo,
      categoriaId: categoriaId || undefined,
      busca: buscaAdiada.trim() || undefined,
    }),
    [escopo, inicio, fim, tipo, categoriaId, buscaAdiada],
  )

  const consulta = useLancamentos(filtro)
  const { data: categorias = [], porId } = useCategorias()
  const { data: empresas = [] } = useEmpresas()
  const nomesEmpresas = useMemo(() => new Map(empresas.map((empresa) => [empresa.id, empresa.nome])), [empresas])
  const acoes = useAcoes()
  const confirmar = useConfirmacao()
  const excluir = useExcluirLancamento()
  const alternarPagamento = useAlternarPagamento()

  const itens = useMemo(() => consulta.data?.pages.flatMap((pagina) => pagina.itens) ?? [], [consulta.data])
  const total = consulta.data?.pages[0]?.total ?? 0
  const grupos = useMemo(() => agruparPorDia(itens), [itens])

  async function remover(lancamento: Lancamento) {
    const confirmado = await confirmar({
      titulo: 'Excluir lançamento?',
      descricao:
        lancamento.origem === 'folha'
          ? 'Este lançamento veio de uma folha de pagamento. Prefira reabrir a folha para estornar.'
          : `"${lancamento.descricao}" será removido permanentemente.`,
      confirmar: 'Excluir',
      perigo: true,
    })
    if (confirmado) excluir.mutate(lancamento.id)
  }

  return (
    <div>
      <div className="flex flex-col gap-3 border-b border-borda p-4 sm:flex-row sm:items-center sm:px-5">
        <Campo
          aria-label="Buscar lançamentos"
          placeholder="Buscar descrição…"
          value={busca}
          onChange={(evento) => setBusca(evento.target.value)}
          prefixo={<Search size={15} />}
          classeMoldura="flex-1"
          className="h-9"
          maxLength={60}
        />
        <div className="flex items-center gap-2">
          <Selecao
            aria-label="Filtrar por categoria"
            value={categoriaId}
            onChange={(evento) => setCategoriaId(evento.target.value)}
            className="h-9 text-xs"
            classeMoldura="min-w-0 flex-1 sm:w-44 sm:flex-none"
          >
            <option value="">Todas as categorias</option>
            {categorias
              .filter((categoria) => tipo === 'todos' || categoria.tipo === tipo)
              .map((categoria) => (
                <option key={categoria.id} value={categoria.id}>
                  {categoria.nome}
                </option>
              ))}
          </Selecao>
          <Segmentado
            rotulo="Tipo"
            ativo={tipo}
            aoMudar={(valor) => {
              setTipo(valor)
              setCategoriaId('')
            }}
            opcoes={[
              { valor: 'todos', rotulo: 'Todos' },
              { valor: 'receita', rotulo: 'Entradas' },
              { valor: 'despesa', rotulo: 'Saídas' },
            ]}
          />
        </div>
      </div>

      {consulta.isPending ? (
        <div className="space-y-3 p-5">
          {[0, 1, 2, 3].map((indice) => (
            <Esqueleto key={indice} className="h-12" />
          ))}
        </div>
      ) : itens.length === 0 ? (
        <EstadoVazio
          icone={Receipt}
          titulo={filtro.busca || filtro.tipo || filtro.categoriaId ? 'Nada encontrado com esses filtros' : 'Nenhum lançamento no período'}
          descricao="Registre entradas e saídas para acompanhar seu dinheiro."
          acao={
            <Botao
              tamanho="sm"
              onClick={() => acoes.novoLancamento({ empresa_id: escopo === 'pessoal' || escopo === 'todos' ? null : escopo })}
            >
              Novo lançamento
            </Botao>
          }
        />
      ) : (
        <>
          {grupos.map(([data, lancamentos]) => (
            <section key={data}>
              <h3 className="border-b border-borda bg-superficie-2 px-4 py-1.5 text-[11px] font-medium text-texto-suave sm:px-5">
                {formatarData(data)}
              </h3>
              <ul>
                {lancamentos.map((lancamento) => {
                  const categoria = lancamento.categoria_id ? porId.get(lancamento.categoria_id) : undefined
                  const IconeOrigem = lancamento.origem !== 'manual' ? iconesOrigem[lancamento.origem] : null
                  return (
                    <li
                      key={lancamento.id}
                      className="group flex items-center gap-3 border-b border-borda px-4 py-3 last:border-b-0 sm:px-5"
                    >
                      <button
                        type="button"
                        onClick={() => acoes.editarLancamento(lancamento)}
                        className="flex min-w-0 flex-1 items-center gap-3 text-left"
                      >
                        <span
                          className={cx(
                            'grid h-9 w-9 shrink-0 place-items-center rounded-xl text-sm font-semibold',
                            lancamento.tipo === 'receita' ? 'bg-receita-suave text-receita' : 'bg-despesa-suave text-despesa',
                          )}
                        >
                          {lancamento.tipo === 'receita' ? '+' : '−'}
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-[13px] font-medium text-texto">{lancamento.descricao}</span>
                          <span className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] text-texto-fraco">
                            {categoria && (
                              <span className="flex items-center gap-1">
                                <PontoCor cor={categoria.cor} />
                                {categoria.nome}
                              </span>
                            )}
                            {mostrarOrigem && (
                              <span>{lancamento.empresa_id ? nomesEmpresas.get(lancamento.empresa_id) : 'Pessoal'}</span>
                            )}
                            {IconeOrigem && (
                              <Distintivo>
                                <IconeOrigem size={10} />
                                {rotulosOrigem[lancamento.origem as keyof typeof rotulosOrigem]}
                              </Distintivo>
                            )}
                            {!lancamento.pago && (
                              <Distintivo tom="alerta">
                                <CircleDashed size={10} />
                                Pendente
                              </Distintivo>
                            )}
                          </span>
                        </span>
                      </button>
                      <span
                        className={cx(
                          'numero shrink-0 text-[13px] font-semibold',
                          lancamento.tipo === 'receita' ? 'text-receita' : 'text-despesa',
                          !lancamento.pago && 'opacity-60',
                        )}
                      >
                        {lancamento.tipo === 'receita' ? '+' : '−'} {formatarMoeda(Number(lancamento.valor))}
                      </span>
                      <Popover
                        gatilho={({ alternar }) => (
                          <button
                            type="button"
                            onClick={alternar}
                            aria-label="Ações do lançamento"
                            className="rounded-lg p-1.5 text-texto-fraco hover:bg-superficie-3 hover:text-texto"
                          >
                            <MoreHorizontal size={16} />
                          </button>
                        )}
                      >
                        {(fechar) => (
                          <>
                            <ItemMenu
                              aoClicar={() => {
                                fechar()
                                acoes.editarLancamento(lancamento)
                              }}
                            >
                              <Pencil size={14} /> Editar
                            </ItemMenu>
                            <ItemMenu
                              aoClicar={() => {
                                fechar()
                                alternarPagamento.mutate({ id: lancamento.id, pago: !lancamento.pago })
                              }}
                            >
                              <CircleDashed size={14} />
                              {lancamento.pago ? 'Marcar como pendente' : lancamento.tipo === 'receita' ? 'Marcar como recebido' : 'Marcar como pago'}
                            </ItemMenu>
                            <ItemMenu
                              perigo
                              aoClicar={() => {
                                fechar()
                                remover(lancamento)
                              }}
                            >
                              <Trash2 size={14} /> Excluir
                            </ItemMenu>
                          </>
                        )}
                      </Popover>
                    </li>
                  )
                })}
              </ul>
            </section>
          ))}
          <footer className="flex items-center justify-between gap-3 px-4 py-3 text-xs text-texto-fraco sm:px-5">
            <span>
              {itens.length} de {total} lançamentos
            </span>
            {consulta.hasNextPage && (
              <Botao variante="secundaria" tamanho="sm" carregando={consulta.isFetchingNextPage} onClick={() => consulta.fetchNextPage()}>
                Carregar mais
              </Botao>
            )}
          </footer>
        </>
      )}
    </div>
  )
}
