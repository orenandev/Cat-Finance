import { type QueryClient, useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { garantir } from '@/lib/erros'
import { supabase } from '@/lib/supabase'
import type { Lancamento, TipoLancamento } from '@/tipos/dominio'
import { chaves } from './chaves'

const COLUNAS = 'id, empresa_id, categoria_id, recorrencia_id, folha_id, tipo, descricao, valor, data, pago, origem, observacoes, criado_em'
const TAMANHO_PAGINA = 40

export interface FiltroLancamentos {
  escopo: 'pessoal' | 'todos' | string
  inicio: string
  fim: string
  tipo?: TipoLancamento
  categoriaId?: string
  busca?: string
}

export type DadosLancamento = Pick<
  Lancamento,
  'tipo' | 'descricao' | 'valor' | 'data' | 'pago' | 'empresa_id' | 'categoria_id' | 'observacoes'
>

export function invalidarFinanceiro(cliente: QueryClient) {
  cliente.invalidateQueries({ queryKey: chaves.lancamentos })
  cliente.invalidateQueries({ queryKey: chaves.resumos })
  cliente.invalidateQueries({ queryKey: chaves.resumosEmpresa })
}

function escaparBusca(texto: string) {
  return texto.replace(/[%_\\,()]/g, ' ').trim().slice(0, 60)
}

export function useLancamentos(filtro: FiltroLancamentos) {
  return useInfiniteQuery({
    queryKey: chaves.listaLancamentos(filtro),
    initialPageParam: 0,
    queryFn: async ({ pageParam }) => {
      let consulta = supabase
        .from('lancamentos')
        .select(COLUNAS, { count: 'exact' })
        .gte('data', filtro.inicio)
        .lte('data', filtro.fim)
        .order('data', { ascending: false })
        .order('criado_em', { ascending: false })
        .range(pageParam, pageParam + TAMANHO_PAGINA - 1)

      if (filtro.escopo === 'pessoal') consulta = consulta.is('empresa_id', null)
      else if (filtro.escopo !== 'todos') consulta = consulta.eq('empresa_id', filtro.escopo)
      if (filtro.tipo) consulta = consulta.eq('tipo', filtro.tipo)
      if (filtro.categoriaId) consulta = consulta.eq('categoria_id', filtro.categoriaId)
      const busca = filtro.busca ? escaparBusca(filtro.busca) : ''
      if (busca) consulta = consulta.ilike('descricao', `%${busca}%`)

      const { data, error, count } = await consulta.returns<Lancamento[]>()
      if (error) throw error
      return { itens: data, total: count ?? 0, proximo: pageParam + TAMANHO_PAGINA }
    },
    getNextPageParam: (ultima) => (ultima.proximo < ultima.total ? ultima.proximo : undefined),
  })
}

export function useSalvarLancamento() {
  const cliente = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, ...dados }: DadosLancamento & { id?: string }) => {
      const consulta = id
        ? supabase.from('lancamentos').update(dados).eq('id', id)
        : supabase.from('lancamentos').insert({ ...dados, origem: 'manual' })
      return garantir(await consulta.select(COLUNAS).single<Lancamento>())
    },
    onSuccess: () => invalidarFinanceiro(cliente),
  })
}

export function useAlternarPagamento() {
  const cliente = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, pago }: { id: string; pago: boolean }) =>
      garantir(await supabase.from('lancamentos').update({ pago }).eq('id', id)),
    onSuccess: () => invalidarFinanceiro(cliente),
  })
}

export function useExcluirLancamento() {
  const cliente = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => garantir(await supabase.from('lancamentos').delete().eq('id', id)),
    onSuccess: () => invalidarFinanceiro(cliente),
    meta: { sucesso: 'Lançamento excluído.' },
  })
}
