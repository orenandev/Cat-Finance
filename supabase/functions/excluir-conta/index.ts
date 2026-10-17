import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import { createClient } from 'jsr:@supabase/supabase-js@2'

const origensPermitidas = (Deno.env.get('ORIGENS_PERMITIDAS') ?? '')
  .split(',')
  .map((origem) => origem.trim())
  .filter(Boolean)

function cabecalhos(origem: string | null) {
  const permitida = origem && (origensPermitidas.length === 0 || origensPermitidas.includes(origem)) ? origem : 'null'
  return {
    'Access-Control-Allow-Origin': permitida,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'authorization, apikey, content-type, x-client-info',
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
    Vary: 'Origin',
  }
}

function responder(status: number, corpo: unknown, origem: string | null) {
  return new Response(JSON.stringify(corpo), { status, headers: cabecalhos(origem) })
}

const administrador = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, {
  auth: { persistSession: false, autoRefreshToken: false },
})

Deno.serve(async (requisicao) => {
  const origem = requisicao.headers.get('origin')

  if (requisicao.method === 'OPTIONS') return new Response(null, { status: 204, headers: cabecalhos(origem) })
  if (requisicao.method !== 'POST') return responder(405, { erro: 'Método não permitido.' }, origem)

  const token = requisicao.headers.get('authorization')?.replace(/^Bearer\s+/i, '')
  if (!token) return responder(401, { erro: 'Sessão ausente.' }, origem)

  const { data: autenticado, error: erroUsuario } = await administrador.auth.getUser(token)
  if (erroUsuario || !autenticado.user) return responder(401, { erro: 'Sessão inválida.' }, origem)

  let confirmacao: unknown
  try {
    confirmacao = (await requisicao.json())?.confirmacao
  } catch {
    return responder(400, { erro: 'Corpo inválido.' }, origem)
  }
  if (confirmacao !== 'EXCLUIR MINHA CONTA') {
    return responder(422, { erro: 'Confirmação incorreta.' }, origem)
  }

  const ultimoAcesso = Date.parse(autenticado.user.last_sign_in_at ?? '')
  if (!Number.isFinite(ultimoAcesso) || Date.now() - ultimoAcesso > 12 * 60 * 60 * 1000) {
    return responder(403, { erro: 'Por segurança, entre novamente antes de excluir a conta.' }, origem)
  }

  const { error } = await administrador.auth.admin.deleteUser(autenticado.user.id)
  if (error) {
    console.error('falha_exclusao_conta', error.message)
    return responder(500, { erro: 'Não foi possível excluir a conta agora.' }, origem)
  }

  return responder(200, { ok: true }, origem)
})
