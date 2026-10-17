export type TipoLancamento = 'receita' | 'despesa'
export type TipoEntidade = 'empresa' | 'trabalho'
export type Frequencia = 'semanal' | 'quinzenal' | 'mensal' | 'trimestral' | 'anual'
export type OrigemLancamento = 'manual' | 'recorrencia' | 'folha' | 'api'
export type TipoContrato = 'clt' | 'pj' | 'estagio' | 'freelancer' | 'temporario'
export type StatusFolha = 'aberta' | 'paga'
export type EscopoApi = 'lancamentos:ler' | 'lancamentos:escrever' | 'resumo:ler' | 'empresas:ler'
export type Moeda = 'BRL' | 'USD' | 'EUR'

export interface Perfil {
  id: string
  nome: string | null
  usuario: string
  avatar_url: string | null
  moeda: Moeda
  termos_aceitos_em: string | null
  criado_em: string
}

export interface Empresa {
  id: string
  nome: string
  tipo: TipoEntidade
  cor: string
  icone: string
  participacao: number
  documento: string | null
  descricao: string | null
  meta_mensal: number | null
  arquivada: boolean
  criado_em: string
}

export interface Categoria {
  id: string
  nome: string
  tipo: TipoLancamento
  cor: string
}

export interface Lancamento {
  id: string
  empresa_id: string | null
  categoria_id: string | null
  recorrencia_id: string | null
  folha_id: string | null
  tipo: TipoLancamento
  descricao: string
  valor: number
  data: string
  pago: boolean
  origem: OrigemLancamento
  observacoes: string | null
  criado_em: string
}

export interface Recorrencia {
  id: string
  empresa_id: string | null
  categoria_id: string | null
  tipo: TipoLancamento
  descricao: string
  valor: number
  frequencia: Frequencia
  inicio_em: string
  fim_em: string | null
  ocorrencias: number
  proxima_em: string
  custo_fixo: boolean
  ativa: boolean
}

export interface Funcionario {
  id: string
  empresa_id: string
  nome: string
  cargo: string | null
  tipo_contrato: TipoContrato
  salario: number
  dia_pagamento: number
  admitido_em: string | null
  ativo: boolean
}

export interface FolhaPagamento {
  id: string
  empresa_id: string
  competencia: string
  status: StatusFolha
  total: number
  paga_em: string | null
}

export interface ItemFolha {
  id: string
  folha_id: string
  funcionario_id: string | null
  nome: string
  cargo: string | null
  salario_base: number
  adicionais: number
  descontos: number
  liquido: number
}

export interface ChaveApi {
  id: string
  nome: string
  prefixo: string
  escopos: EscopoApi[]
  empresa_padrao_id: string | null
  ultimo_uso_em: string | null
  expira_em: string | null
  revogada_em: string | null
  criado_em: string
}

export interface RegistroApi {
  id: number
  chave_id: string | null
  metodo: string
  rota: string
  status: number
  criado_em: string
}

export interface PontoSerie {
  data: string
  receitas: number
  despesas: number
  das_empresas: number
  resultado: number
}

export interface ResumoEmpresaLista {
  id: string
  nome: string
  tipo: TipoEntidade
  cor: string
  icone: string
  participacao: number
  arquivada: boolean
  receitas: number
  despesas: number
  lucro: number
  para_voce: number
}

export interface ResumoPeriodo {
  receitas: number
  despesas: number
  vindo_empresas: number
  empresas: ResumoEmpresaLista[]
  serie: PontoSerie[]
}

export interface ResumoEmpresa {
  receitas: number
  despesas: number
  participacao: number
  custos_fixos_mensais: number
  folha_mensal: number
  funcionarios_ativos: number
  por_categoria: { tipo: TipoLancamento; nome: string; cor: string; total: number }[]
  serie: { data: string; receitas: number; despesas: number; lucro: number }[]
}
