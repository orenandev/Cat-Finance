import { z } from 'npm:zod@4.1.12'

const dataIso = z.iso.date({ error: 'Use o formato AAAA-MM-DD.' })

export const esquemaNovoLancamento = z.strictObject({
  tipo: z.enum(['receita', 'despesa']),
  valor: z.number().positive().max(999_999_999_999).multipleOf(0.01),
  descricao: z.string().trim().min(1).max(140),
  data: dataIso.optional(),
  empresa_id: z.uuid().nullable().optional(),
  categoria_id: z.uuid().nullable().optional(),
  pago: z.boolean().optional(),
  observacoes: z.string().trim().max(500).optional(),
})

export const esquemaLancamentoTexto = z.strictObject({
  texto: z.string().trim().min(2).max(280),
  empresa_id: z.uuid().nullable().optional(),
})

export const esquemaFiltroLancamentos = z.object({
  inicio: dataIso.optional(),
  fim: dataIso.optional(),
  empresa_id: z.union([z.uuid(), z.literal('pessoal')]).optional(),
  tipo: z.enum(['receita', 'despesa']).optional(),
  limite: z.coerce.number().int().min(1).max(100).default(50),
  pagina: z.coerce.number().int().min(1).max(1000).default(1),
})

export const esquemaPeriodo = z.object({
  inicio: dataIso.optional(),
  fim: dataIso.optional(),
})

export type NovoLancamento = z.infer<typeof esquemaNovoLancamento>

export function formatarErrosValidacao(erro: z.ZodError) {
  return erro.issues.map((problema) => ({
    campo: problema.path.join('.') || null,
    mensagem: problema.message,
  }))
}
