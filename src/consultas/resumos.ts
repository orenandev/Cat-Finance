import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { garantir } from '@/lib/erros'
import { supabase } from '@/lib/supabase'
import type { ResumoEmpresa, ResumoPeriodo, TipoLancamento } from '@/tipos/dominio'
import { chaves } from './chaves'

export function useResumoPeriodo(inicio: string, fim: string) {
  return useQuery({
    queryKey: chaves.resumo(inicio, fim),
    queryFn: async () =>
      garantir(await supabase.rpc('resumo_periodo', { p_inicio: inicio, p_fim: fim })) as ResumoPeriodo,
    placeholderData: keepPreviousData,
  })
}

export interface TotalCategoria {
  tipo: TipoLancamento
  categoria_id: string | null
  nome: string
  cor: string
  total: number
  quantidade: number
}

export function useTotaisCategoria(inicio: string, fim: string, empresaId: string | null = null) {
  return useQuery({
    queryKey: [...chaves.resumos, 'categorias', inicio, fim, empresaId],
    queryFn: async () =>
      garantir(
        await supabase.rpc('totais_por_categoria', { p_inicio: inicio, p_fim: fim, p_empresa: empresaId }),
      ) as TotalCategoria[],
    placeholderData: keepPreviousData,
  })
}

export function useResumoEmpresa(empresaId: string, inicio: string, fim: string) {
  return useQuery({
    queryKey: chaves.resumoEmpresa(empresaId, inicio, fim),
    queryFn: async () =>
      garantir(
        await supabase.rpc('resumo_empresa', { p_empresa: empresaId, p_inicio: inicio, p_fim: fim }),
      ) as ResumoEmpresa,
    placeholderData: keepPreviousData,
  })
}
