const CHAVE_EMAIL = 'catfinance:email-pendente'
const CHAVE_RETORNO = 'catfinance:retorno'

function ler(chave: string) {
  try {
    return sessionStorage.getItem(chave)
  } catch {
    return null
  }
}

function gravar(chave: string, valor: string | null) {
  try {
    if (valor === null) sessionStorage.removeItem(chave)
    else sessionStorage.setItem(chave, valor)
  } catch {
    return
  }
}

export function guardarEmailPendente(email: string) {
  gravar(CHAVE_EMAIL, email)
}

export function lerEmailPendente() {
  return ler(CHAVE_EMAIL) ?? ''
}

export function limparEmailPendente() {
  gravar(CHAVE_EMAIL, null)
}

export function guardarDestinoRetorno(caminho: string) {
  gravar(CHAVE_RETORNO, caminho)
}

export function consumirDestinoRetorno() {
  const destino = ler(CHAVE_RETORNO)
  gravar(CHAVE_RETORNO, null)
  return destino && destino.startsWith('/') && !destino.startsWith('//') ? destino : '/'
}
