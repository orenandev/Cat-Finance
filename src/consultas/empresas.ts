import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { garantir } from '@/lib/erros'
import { supabase } from '@/lib/supabase'
import type { Empresa } from '@/tipos/dominio'
import { chaves } from './chaves'

const COLUNAS = 'id, nome, tipo, cor, icone, participacao, documento, descricao, meta_mensal, arquivada, criado_em'

export type DadosEmpresa = Omit<Empresa, 'id' | 'criado_em'>

export function useEmpresas() {
  return useQuery({
    queryKey: chaves.empresas,
    queryFn: async () =>
      garantir(await supabase.from('empresas').select(COLUNAS).order('criado_em').returns<Empresa[]>()),
    staleTime: 2 * 60_000,
  })
}

export function useEmpresa(id: string | undefined) {
  const consulta = useEmpresas()
  return { ...consulta, data: consulta.data?.find((empresa) => empresa.id === id) }
}

export function useSalvarEmpresa() {
  const cliente = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, ...dados }: Partial<DadosEmpresa> & { id?: string }) => {
      const consulta = id
        ? supabase.from('empresas').update(dados).eq('id', id)
        : supabase.from('empresas').insert(dados)
      return garantir(await consulta.select(COLUNAS).single<Empresa>())
    },
    onSuccess: () => {
      cliente.invalidateQueries({ queryKey: chaves.empresas })
      cliente.invalidateQueries({ queryKey: chaves.resumos })
      cliente.invalidateQueries({ queryKey: chaves.resumosEmpresa })
    },
  })
}

export function useExcluirEmpresa() {
  const cliente = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => garantir(await supabase.from('empresas').delete().eq('id', id)),
    onSuccess: () => cliente.invalidateQueries(),
    meta: { sucesso: 'Empresa excluída.' },
  })
}
