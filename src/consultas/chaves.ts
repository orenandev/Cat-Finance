import type { FiltroLancamentos } from './lancamentos'

export const chaves = {
  perfil: (id: string) => ['perfil', id] as const,
  empresas: ['empresas'] as const,
  categorias: ['categorias'] as const,
  resumos: ['resumo'] as const,
  resumo: (inicio: string, fim: string) => ['resumo', inicio, fim] as const,
  resumosEmpresa: ['resumo-empresa'] as const,
  resumoEmpresa: (id: string, inicio: string, fim: string) => ['resumo-empresa', id, inicio, fim] as const,
  lancamentos: ['lancamentos'] as const,
  listaLancamentos: (filtro: FiltroLancamentos) => ['lancamentos', filtro] as const,
  recorrencias: ['recorrencias'] as const,
  funcionarios: (empresaId: string) => ['funcionarios', empresaId] as const,
  folhas: (empresaId: string) => ['folhas', empresaId] as const,
  itensFolha: (folhaId: string) => ['itens-folha', folhaId] as const,
  chavesApi: ['chaves-api'] as const,
  registrosApi: ['registros-api'] as const,
}
