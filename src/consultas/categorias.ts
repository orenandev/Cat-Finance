import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useMemo } from 'react'
import { garantir } from '@/lib/erros'
import { supabase } from '@/lib/supabase'
import type { Categoria } from '@/tipos/dominio'
import { chaves } from './chaves'

export function useCategorias() {
  const consulta = useQuery({
    queryKey: chaves.categorias,
    queryFn: async () =>
      garantir(await supabase.from('categorias').select('id, nome, tipo, cor').order('nome').returns<Categoria[]>()),
    staleTime: 5 * 60_000,
  })

  const porId = useMemo(() => new Map((consulta.data ?? []).map((categoria) => [categoria.id, categoria])), [consulta.data])
  return { ...consulta, porId }
}

export function useSalvarCategoria() {
  const cliente = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, ...dados }: Omit<Categoria, 'id'> & { id?: string }) => {
      const consulta = id
        ? supabase.from('categorias').update(dados).eq('id', id)
        : supabase.from('categorias').insert(dados)
      return garantir(await consulta.select('id, nome, tipo, cor').single<Categoria>())
    },
    onSuccess: () => cliente.invalidateQueries({ queryKey: chaves.categorias }),
    meta: { sucesso: 'Categoria salva.' },
  })
}

export function useExcluirCategoria() {
  const cliente = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => garantir(await supabase.from('categorias').delete().eq('id', id)),
    onSuccess: () => {
      cliente.invalidateQueries({ queryKey: chaves.categorias })
      cliente.invalidateQueries({ queryKey: chaves.lancamentos })
    },
    meta: { sucesso: 'Categoria removida.' },
  })
}
