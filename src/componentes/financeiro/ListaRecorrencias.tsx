import { MoreHorizontal, Pencil, Trash2 } from 'lucide-react'
import { Distintivo, PontoCor } from '@/componentes/ui/Diversos'
import { Interruptor } from '@/componentes/ui/Interruptor'
import { ItemMenu, Popover } from '@/componentes/ui/Popover'
import { useCategorias } from '@/consultas/categorias'
import { useEmpresas } from '@/consultas/empresas'
import { useExcluirRecorrencia, useSalvarRecorrencia } from '@/consultas/recorrencias'
import { useAcoes } from '@/contextos/AcoesContexto'
import { useConfirmacao } from '@/contextos/ConfirmacaoContexto'
import { cx } from '@/lib/classes'
import { formatarData, formatarMoeda } from '@/lib/formatacao'
import { rotulosFrequencia } from '@/lib/rotulos'
import type { Recorrencia } from '@/tipos/dominio'

export function ListaRecorrencias({ recorrencias, mostrarOrigem }: { recorrencias: Recorrencia[]; mostrarOrigem?: boolean }) {
  const { porId } = useCategorias()
  const { data: empresas = [] } = useEmpresas()
  const acoes = useAcoes()
  const confirmar = useConfirmacao()
  const salvar = useSalvarRecorrencia()
  const excluir = useExcluirRecorrencia()

  async function remover(recorrencia: Recorrencia) {
    const confirmado = await confirmar({
      titulo: 'Excluir recorrência?',
      descricao: `"${recorrencia.descricao}" deixará de gerar lançamentos. Os lançamentos já criados continuam no histórico.`,
      confirmar: 'Excluir',
      perigo: true,
    })
    if (confirmado) excluir.mutate(recorrencia.id)
  }

  return (
    <ul>
      {recorrencias.map((recorrencia) => {
        const categoria = recorrencia.categoria_id ? porId.get(recorrencia.categoria_id) : undefined
        const empresa = recorrencia.empresa_id ? empresas.find((item) => item.id === recorrencia.empresa_id) : undefined
        return (
          <li
            key={recorrencia.id}
            className={cx('flex items-center gap-3 border-b border-borda px-4 py-3 last:border-b-0 sm:px-5', !recorrencia.ativa && 'opacity-60')}
          >
            <button type="button" onClick={() => acoes.editarRecorrencia(recorrencia)} className="min-w-0 flex-1 text-left">
              <span className="block truncate text-[13px] font-medium text-texto">{recorrencia.descricao}</span>
              <span className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] text-texto-fraco">
                <Distintivo tom={recorrencia.tipo === 'receita' ? 'receita' : 'despesa'}>{rotulosFrequencia[recorrencia.frequencia]}</Distintivo>
                {recorrencia.ativa ? <span>Próxima: {formatarData(recorrencia.proxima_em)}</span> : <span>Pausada</span>}
                {categoria && (
                  <span className="flex items-center gap-1">
                    <PontoCor cor={categoria.cor} />
                    {categoria.nome}
                  </span>
                )}
                {mostrarOrigem && <span>{empresa?.nome ?? 'Pessoal'}</span>}
              </span>
            </button>
            <span
              className={cx('numero shrink-0 text-[13px] font-semibold', recorrencia.tipo === 'receita' ? 'text-receita' : 'text-despesa')}
            >
              {formatarMoeda(Number(recorrencia.valor))}
            </span>
            <Interruptor
              rotulo={recorrencia.ativa ? 'Pausar recorrência' : 'Ativar recorrência'}
              ocultarRotulo
              ligado={recorrencia.ativa}
              desabilitado={salvar.isPending}
              aoMudar={(ativa) => salvar.mutate({ id: recorrencia.id, ativa })}
            />
            <Popover
              gatilho={({ alternar }) => (
                <button
                  type="button"
                  onClick={alternar}
                  aria-label="Ações da recorrência"
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
                      acoes.editarRecorrencia(recorrencia)
                    }}
                  >
                    <Pencil size={14} /> Editar
                  </ItemMenu>
                  <ItemMenu
                    perigo
                    aoClicar={() => {
                      fechar()
                      remover(recorrencia)
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
  )
}
