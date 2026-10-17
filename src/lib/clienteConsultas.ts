import { MutationCache, QueryCache, QueryClient } from '@tanstack/react-query'
import { emitirAviso } from './avisos'
import { mensagemErro } from './erros'

declare module '@tanstack/react-query' {
  interface Register {
    mutationMeta: {
      sucesso?: string
      silencioso?: boolean
    }
  }
}

function deveRepetir(tentativas: number, erro: unknown) {
  const status = typeof erro === 'object' && erro && 'status' in erro ? Number((erro as { status: unknown }).status) : 0
  if (status >= 400 && status < 500) return false
  return tentativas < 2
}

export const clienteConsultas = new QueryClient({
  queryCache: new QueryCache({
    onError: (erro, consulta) => {
      if (consulta.state.data !== undefined) emitirAviso('erro', mensagemErro(erro, 'Não foi possível atualizar os dados.'))
    },
  }),
  mutationCache: new MutationCache({
    onSuccess: (_dados, _variaveis, _contexto, mutacao) => {
      if (mutacao.meta?.sucesso) emitirAviso('sucesso', mutacao.meta.sucesso)
    },
    onError: (erro, _variaveis, _contexto, mutacao) => {
      if (!mutacao.meta?.silencioso) emitirAviso('erro', mensagemErro(erro))
    },
  }),
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      gcTime: 10 * 60_000,
      refetchOnWindowFocus: true,
      retry: deveRepetir,
    },
    mutations: {
      retry: false,
    },
  },
})
