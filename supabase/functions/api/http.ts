export const cabecalhosCors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, x-api-key, content-type',
  'Access-Control-Max-Age': '86400',
}

const cabecalhosSeguranca = {
  'Content-Type': 'application/json; charset=utf-8',
  'Cache-Control': 'no-store',
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'no-referrer',
}

export class ErroApi extends Error {
  constructor(
    readonly status: number,
    readonly codigo: string,
    mensagem: string,
    readonly detalhes?: unknown,
  ) {
    super(mensagem)
  }
}

export function responder(status: number, corpo: unknown, extras: Record<string, string> = {}) {
  return new Response(status === 204 ? null : JSON.stringify(corpo), {
    status,
    headers: { ...cabecalhosCors, ...cabecalhosSeguranca, ...extras },
  })
}

export function responderErro(erro: ErroApi, extras: Record<string, string> = {}) {
  return responder(
    erro.status,
    { erro: { codigo: erro.codigo, mensagem: erro.message, ...(erro.detalhes ? { detalhes: erro.detalhes } : {}) } },
    extras,
  )
}

const LIMITE_CORPO_BYTES = 8 * 1024

export async function lerCorpoJson(requisicao: Request): Promise<unknown> {
  const tipo = requisicao.headers.get('content-type') ?? ''
  if (!tipo.includes('application/json')) {
    throw new ErroApi(415, 'tipo_invalido', 'Envie o corpo como application/json.')
  }
  const declarado = Number(requisicao.headers.get('content-length') ?? 0)
  if (declarado > LIMITE_CORPO_BYTES) {
    throw new ErroApi(413, 'corpo_grande', 'O corpo da requisição excede 8 KB.')
  }
  const bruto = await requisicao.text()
  if (new TextEncoder().encode(bruto).byteLength > LIMITE_CORPO_BYTES) {
    throw new ErroApi(413, 'corpo_grande', 'O corpo da requisição excede 8 KB.')
  }
  try {
    return JSON.parse(bruto)
  } catch {
    throw new ErroApi(400, 'json_invalido', 'JSON malformado.')
  }
}

export async function gerarHash(valor: string) {
  const bytes = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(valor))
  return Array.from(new Uint8Array(bytes), (byte) => byte.toString(16).padStart(2, '0')).join('')
}
