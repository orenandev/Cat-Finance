import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { garantir } from '@/lib/erros'
import { supabase } from '@/lib/supabase'
import type { ChaveApi, EscopoApi, RegistroApi } from '@/tipos/dominio'
import { chaves } from './chaves'

interface NovaChave {
  nome: string
  escopos: EscopoApi[]
  empresaPadraoId: string | null
  expiraEm: string | null
}

interface ChaveCriada {
  id: string
  chave: string
  prefixo: string
}

export function useChavesApi() {
  return useQuery({
    queryKey: chaves.chavesApi,
    queryFn: async () =>
      garantir(
        await supabase
          .from('chaves_api')
          .select('id, nome, prefixo, escopos, empresa_padrao_id, ultimo_uso_em, expira_em, revogada_em, criado_em')
          .order('criado_em', { ascending: false })
          .returns<ChaveApi[]>(),
      ),
  })
}

export function useCriarChaveApi() {
  const cliente = useQueryClient()
  return useMutation({
    mutationFn: async (dados: NovaChave) => {
      const resultado = garantir(
        await supabase.rpc('criar_chave_api', {
          p_nome: dados.nome,
          p_escopos: dados.escopos,
          p_empresa_padrao: dados.empresaPadraoId,
          p_expira_em: dados.expiraEm,
        }),
      ) as ChaveCriada[]
      const criada = resultado[0]
      if (!criada) throw new Error('Não foi possível gerar a chave.')
      return criada
    },
    onSuccess: () => cliente.invalidateQueries({ queryKey: chaves.chavesApi }),
  })
}

export function useRevogarChaveApi() {
  const cliente = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => garantir(await supabase.rpc('revogar_chave_api', { p_id: id })),
    onSuccess: () => cliente.invalidateQueries({ queryKey: chaves.chavesApi }),
    meta: { sucesso: 'Chave revogada. Ela deixa de funcionar imediatamente.' },
  })
}

export function useExcluirChaveApi() {
  const cliente = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => garantir(await supabase.from('chaves_api').delete().eq('id', id)),
    onSuccess: () => cliente.invalidateQueries({ queryKey: chaves.chavesApi }),
    meta: { sucesso: 'Chave excluída.' },
  })
}

export function useRegistrosApi() {
  return useQuery({
    queryKey: chaves.registrosApi,
    queryFn: async () =>
      garantir(
        await supabase
          .from('registros_api')
          .select('id, chave_id, metodo, rota, status, criado_em')
          .order('criado_em', { ascending: false })
          .limit(25)
          .returns<RegistroApi[]>(),
      ),
    refetchInterval: 30_000,
  })
}
