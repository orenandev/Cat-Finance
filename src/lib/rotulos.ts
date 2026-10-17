import type { EscopoApi, Frequencia, TipoContrato } from '@/tipos/dominio'

export const rotulosFrequencia: Record<Frequencia, string> = {
  semanal: 'Semanal',
  quinzenal: 'Quinzenal',
  mensal: 'Mensal',
  trimestral: 'Trimestral',
  anual: 'Anual',
}

export const rotulosContrato: Record<TipoContrato, string> = {
  clt: 'CLT',
  pj: 'PJ',
  estagio: 'Estágio',
  freelancer: 'Freelancer',
  temporario: 'Temporário',
}

export const rotulosEscopo: Record<EscopoApi, { titulo: string; descricao: string }> = {
  'lancamentos:escrever': { titulo: 'Registrar lançamentos', descricao: 'Criar e excluir lançamentos feitos pela API' },
  'lancamentos:ler': { titulo: 'Ler lançamentos', descricao: 'Listar lançamentos e categorias' },
  'resumo:ler': { titulo: 'Ler resumo', descricao: 'Saldo, receitas, despesas e lucro por empresa' },
  'empresas:ler': { titulo: 'Ler empresas', descricao: 'Listar empresas e trabalhos' },
}
