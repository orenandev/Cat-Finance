import { z } from 'zod'

const textoObrigatorio = (rotulo: string, maximo: number) =>
  z.string().trim().min(1, `Informe ${rotulo}.`).max(maximo, `Use no máximo ${maximo} caracteres.`)

const dataIso = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Data inválida.')

export const esquemaEmail = z.string().trim().toLowerCase().pipe(z.email('Informe um e-mail válido.').max(254))

export const esquemaSenha = z
  .string()
  .min(8, 'A senha precisa de pelo menos 8 caracteres.')
  .max(72, 'Use no máximo 72 caracteres.')
  .regex(/[a-z]/, 'Inclua uma letra minúscula.')
  .regex(/[A-Z]/, 'Inclua uma letra maiúscula.')
  .regex(/\d/, 'Inclua um número.')

export const esquemaEntrar = z.object({
  email: esquemaEmail,
  senha: z.string().min(1, 'Informe sua senha.').max(72),
})

export const esquemaCadastro = z
  .object({
    nome: textoObrigatorio('seu nome', 120),
    email: esquemaEmail,
    senha: esquemaSenha,
    confirmacao: z.string(),
    termos: z.literal(true, { error: 'Você precisa aceitar os termos para continuar.' }),
  })
  .refine((dados) => dados.senha === dados.confirmacao, { path: ['confirmacao'], message: 'As senhas não conferem.' })

export const esquemaNovaSenha = z
  .object({ senha: esquemaSenha, confirmacao: z.string() })
  .refine((dados) => dados.senha === dados.confirmacao, { path: ['confirmacao'], message: 'As senhas não conferem.' })

export const esquemaEmpresa = z.object({
  nome: textoObrigatorio('o nome', 80),
  tipo: z.enum(['empresa', 'trabalho']),
  cor: z.string().regex(/^[a-z]{3,16}$/),
  icone: z.string().regex(/^[a-z0-9-]{1,32}$/),
  participacao: z.number({ error: 'Informe um percentual.' }).gt(0, 'Deve ser maior que 0%.').max(100, 'Máximo de 100%.'),
  documento: z
    .string()
    .trim()
    .max(20)
    .transform((valor) => valor.replace(/[^\d./-]/g, '') || null)
    .nullable(),
  descricao: z.string().trim().max(280).transform((valor) => valor || null).nullable(),
  meta_mensal: z.number().min(0).max(999_999_999_999).nullable(),
})

export const esquemaLancamento = z.object({
  tipo: z.enum(['receita', 'despesa']),
  descricao: textoObrigatorio('uma descrição', 140),
  valor: z.number().positive('Informe um valor maior que zero.').max(999_999_999_999),
  data: dataIso,
  pago: z.boolean(),
  empresa_id: z.uuid().nullable(),
  categoria_id: z.uuid().nullable(),
  observacoes: z.string().trim().max(500).transform((valor) => valor || null).nullable(),
})

export const esquemaRecorrencia = z
  .object({
    tipo: z.enum(['receita', 'despesa']),
    descricao: textoObrigatorio('uma descrição', 140),
    valor: z.number().positive('Informe um valor maior que zero.').max(999_999_999_999),
    frequencia: z.enum(['semanal', 'quinzenal', 'mensal', 'trimestral', 'anual']),
    inicio_em: dataIso,
    fim_em: dataIso.nullable(),
    empresa_id: z.uuid().nullable(),
    categoria_id: z.uuid().nullable(),
    custo_fixo: z.boolean(),
    ativa: z.boolean(),
  })
  .refine((dados) => !dados.fim_em || dados.fim_em >= dados.inicio_em, {
    path: ['fim_em'],
    message: 'O fim deve ser depois do início.',
  })

export const esquemaFuncionario = z.object({
  nome: textoObrigatorio('o nome', 120),
  cargo: z.string().trim().max(80).transform((valor) => valor || null).nullable(),
  tipo_contrato: z.enum(['clt', 'pj', 'estagio', 'freelancer', 'temporario']),
  salario: z.number().min(0).max(99_999_999),
  dia_pagamento: z.number().int().min(1, 'Entre 1 e 31.').max(31, 'Entre 1 e 31.'),
  admitido_em: dataIso.nullable(),
  ativo: z.boolean(),
})

export const esquemaPerfil = z.object({
  nome: z.string().trim().max(120).transform((valor) => valor || null).nullable(),
  usuario: z
    .string()
    .trim()
    .toLowerCase()
    .regex(/^[a-z0-9_.]{3,30}$/, 'Use de 3 a 30 caracteres: letras, números, ponto ou sublinhado.'),
  moeda: z.enum(['BRL', 'USD', 'EUR']),
})

export const esquemaCategoria = z.object({
  nome: textoObrigatorio('o nome', 40),
  tipo: z.enum(['receita', 'despesa']),
  cor: z.string().regex(/^[a-z]{3,16}$/),
})

export const esquemaChaveApi = z.object({
  nome: textoObrigatorio('um nome', 60),
  escopos: z.array(z.enum(['lancamentos:ler', 'lancamentos:escrever', 'resumo:ler', 'empresas:ler'])).min(1, 'Escolha ao menos uma permissão.'),
  empresaPadraoId: z.uuid().nullable(),
  expiraEm: z.string().nullable(),
})

export type ErrosFormulario = Record<string, string>

export function validarFormulario<T extends z.ZodType>(
  esquema: T,
  dados: unknown,
): { sucesso: true; dados: z.output<T> } | { sucesso: false; erros: ErrosFormulario } {
  const resultado = esquema.safeParse(dados)
  if (resultado.success) return { sucesso: true, dados: resultado.data }
  const erros: ErrosFormulario = {}
  for (const problema of resultado.error.issues) {
    const campo = problema.path.join('.') || '_'
    erros[campo] ??= problema.message
  }
  return { sucesso: false, erros }
}

export function forcaSenha(senha: string) {
  let pontos = 0
  if (senha.length >= 8) pontos++
  if (senha.length >= 12) pontos++
  if (/[a-z]/.test(senha) && /[A-Z]/.test(senha)) pontos++
  if (/\d/.test(senha)) pontos++
  if (/[^A-Za-z0-9]/.test(senha)) pontos++
  return Math.min(4, pontos)
}
