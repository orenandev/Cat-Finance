import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { garantir } from '@/lib/erros'
import { supabase } from '@/lib/supabase'
import type { FolhaPagamento, Funcionario, ItemFolha } from '@/tipos/dominio'
import { chaves } from './chaves'
import { invalidarFinanceiro } from './lancamentos'

const COLUNAS_FUNCIONARIO = 'id, empresa_id, nome, cargo, tipo_contrato, salario, dia_pagamento, admitido_em, ativo'
const COLUNAS_FOLHA = 'id, empresa_id, competencia, status, total, paga_em'
const COLUNAS_ITEM = 'id, folha_id, funcionario_id, nome, cargo, salario_base, adicionais, descontos, liquido'

export type DadosFuncionario = Omit<Funcionario, 'id'>

export function useFuncionarios(empresaId: string) {
  return useQuery({
    queryKey: chaves.funcionarios(empresaId),
    queryFn: async () =>
      garantir(
        await supabase
          .from('funcionarios')
          .select(COLUNAS_FUNCIONARIO)
          .eq('empresa_id', empresaId)
          .order('ativo', { ascending: false })
          .order('nome')
          .returns<Funcionario[]>(),
      ),
  })
}

export function useSalvarFuncionario(empresaId: string) {
  const cliente = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, ...dados }: Partial<DadosFuncionario> & { id?: string }) => {
      const consulta = id
        ? supabase.from('funcionarios').update(dados).eq('id', id)
        : supabase.from('funcionarios').insert({ ...dados, empresa_id: empresaId })
      return garantir(await consulta.select(COLUNAS_FUNCIONARIO).single<Funcionario>())
    },
    onSuccess: () => {
      cliente.invalidateQueries({ queryKey: chaves.funcionarios(empresaId) })
      cliente.invalidateQueries({ queryKey: chaves.resumosEmpresa })
    },
  })
}

export function useExcluirFuncionario(empresaId: string) {
  const cliente = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => garantir(await supabase.from('funcionarios').delete().eq('id', id)),
    onSuccess: () => {
      cliente.invalidateQueries({ queryKey: chaves.funcionarios(empresaId) })
      cliente.invalidateQueries({ queryKey: chaves.resumosEmpresa })
    },
    meta: { sucesso: 'Pessoa removida da equipe.' },
  })
}

export function useFolhas(empresaId: string) {
  return useQuery({
    queryKey: chaves.folhas(empresaId),
    queryFn: async () =>
      garantir(
        await supabase
          .from('folhas_pagamento')
          .select(COLUNAS_FOLHA)
          .eq('empresa_id', empresaId)
          .order('competencia', { ascending: false })
          .limit(36)
          .returns<FolhaPagamento[]>(),
      ),
  })
}

export function useItensFolha(folhaId: string | undefined) {
  return useQuery({
    queryKey: chaves.itensFolha(folhaId ?? ''),
    enabled: Boolean(folhaId),
    queryFn: async () =>
      garantir(
        await supabase
          .from('itens_folha')
          .select(COLUNAS_ITEM)
          .eq('folha_id', folhaId!)
          .order('nome')
          .returns<ItemFolha[]>(),
      ),
  })
}

export function useGerarFolha(empresaId: string) {
  const cliente = useQueryClient()
  return useMutation({
    mutationFn: async (competencia: string) =>
      garantir(await supabase.rpc('gerar_folha', { p_empresa: empresaId, p_competencia: competencia })) as string,
    onSuccess: (folhaId) => {
      cliente.invalidateQueries({ queryKey: chaves.folhas(empresaId) })
      cliente.invalidateQueries({ queryKey: chaves.itensFolha(folhaId) })
    },
  })
}

export function useAtualizarItemFolha(empresaId: string, folhaId: string) {
  const cliente = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, ...dados }: Pick<ItemFolha, 'id' | 'salario_base' | 'adicionais' | 'descontos'>) =>
      garantir(await supabase.from('itens_folha').update(dados).eq('id', id)),
    onSuccess: () => {
      cliente.invalidateQueries({ queryKey: chaves.itensFolha(folhaId) })
      cliente.invalidateQueries({ queryKey: chaves.folhas(empresaId) })
    },
  })
}

export function useRemoverItemFolha(empresaId: string, folhaId: string) {
  const cliente = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => garantir(await supabase.from('itens_folha').delete().eq('id', id)),
    onSuccess: () => {
      cliente.invalidateQueries({ queryKey: chaves.itensFolha(folhaId) })
      cliente.invalidateQueries({ queryKey: chaves.folhas(empresaId) })
    },
  })
}

export function usePagarFolha(empresaId: string) {
  const cliente = useQueryClient()
  return useMutation({
    mutationFn: async ({ folhaId, data }: { folhaId: string; data: string }) =>
      garantir(await supabase.rpc('pagar_folha', { p_folha: folhaId, p_data: data })),
    onSuccess: () => {
      cliente.invalidateQueries({ queryKey: chaves.folhas(empresaId) })
      invalidarFinanceiro(cliente)
    },
    meta: { sucesso: 'Folha paga e lançada como despesa da empresa.' },
  })
}

export function useReabrirFolha(empresaId: string) {
  const cliente = useQueryClient()
  return useMutation({
    mutationFn: async (folhaId: string) => garantir(await supabase.rpc('reabrir_folha', { p_folha: folhaId })),
    onSuccess: () => {
      cliente.invalidateQueries({ queryKey: chaves.folhas(empresaId) })
      invalidarFinanceiro(cliente)
    },
    meta: { sucesso: 'Folha reaberta. O lançamento de pagamento foi estornado.' },
  })
}

export function useExcluirFolha(empresaId: string) {
  const cliente = useQueryClient()
  return useMutation({
    mutationFn: async (folhaId: string) => garantir(await supabase.from('folhas_pagamento').delete().eq('id', folhaId)),
    onSuccess: () => cliente.invalidateQueries({ queryKey: chaves.folhas(empresaId) }),
    meta: { sucesso: 'Folha excluída.' },
  })
}
