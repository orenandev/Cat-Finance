import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useEffect } from 'react'
import { garantir } from '@/lib/erros'
import { supabase } from '@/lib/supabase'
import type { Recorrencia } from '@/tipos/dominio'
import { chaves } from './chaves'
import { invalidarFinanceiro } from './lancamentos'

const COLUNAS =
  'id, empresa_id, categoria_id, tipo, descricao, valor, frequencia, inicio_em, fim_em, ocorrencias, proxima_em, custo_fixo, ativa'

export type DadosRecorrencia = Pick<
  Recorrencia,
  'empresa_id' | 'categoria_id' | 'tipo' | 'descricao' | 'valor' | 'frequencia' | 'inicio_em' | 'fim_em' | 'custo_fixo' | 'ativa'
>

const fatoresMensais: Record<Recorrencia['frequencia'], number> = {
  semanal: 52 / 12,
  quinzenal: 26 / 12,
  mensal: 1,
  trimestral: 1 / 3,
  anual: 1 / 12,
}

export function equivalenteMensal(recorrencia: Pick<Recorrencia, 'valor' | 'frequencia'>) {
  return Number(recorrencia.valor) * fatoresMensais[recorrencia.frequencia]
}

export function useRecorrencias() {
  return useQuery({
    queryKey: chaves.recorrencias,
    queryFn: async () =>
      garantir(
        await supabase
          .from('recorrencias')
          .select(COLUNAS)
          .order('ativa', { ascending: false })
          .order('proxima_em')
          .returns<Recorrencia[]>(),
      ),
  })
}

export function useSalvarRecorrencia() {
  const cliente = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, ...dados }: Partial<DadosRecorrencia> & { id?: string }) => {
      const consulta = id
        ? supabase.from('recorrencias').update(dados).eq('id', id)
        : supabase.from('recorrencias').insert(dados)
      const salva = garantir(await consulta.select(COLUNAS).single<Recorrencia>())
      await supabase.rpc('sincronizar_recorrencias')
      return salva
    },
    onSuccess: () => {
      cliente.invalidateQueries({ queryKey: chaves.recorrencias })
      invalidarFinanceiro(cliente)
    },
  })
}

export function useExcluirRecorrencia() {
  const cliente = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => garantir(await supabase.from('recorrencias').delete().eq('id', id)),
    onSuccess: () => {
      cliente.invalidateQueries({ queryKey: chaves.recorrencias })
      invalidarFinanceiro(cliente)
    },
    meta: { sucesso: 'Recorrência removida. Lançamentos já gerados foram mantidos.' },
  })
}

export function useSincronizacaoRecorrencias(ativo: boolean) {
  const cliente = useQueryClient()
  useEffect(() => {
    if (!ativo) return
    let cancelado = false
    supabase.rpc('sincronizar_recorrencias').then(({ data, error }) => {
      if (cancelado || error || !data) return
      cliente.invalidateQueries({ queryKey: chaves.recorrencias })
      invalidarFinanceiro(cliente)
    })
    return () => {
      cancelado = true
    }
  }, [ativo, cliente])
}
