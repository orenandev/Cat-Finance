const CHAVE = 'catfinance:recarregado-em'
const INTERVALO_MINIMO = 15_000

export function ehErroDeVersaoAntiga(erro: unknown) {
  const mensagem = erro instanceof Error ? erro.message : String(erro ?? '')
  return /dynamically imported module|importing a module script failed|error loading dynamically|preload css/i.test(mensagem)
}

export function recarregarParaNovaVersao() {
  try {
    const ultimo = Number(sessionStorage.getItem(CHAVE) ?? 0)
    if (Date.now() - ultimo < INTERVALO_MINIMO) return false
    sessionStorage.setItem(CHAVE, String(Date.now()))
  } catch {
    return false
  }
  window.location.reload()
  return true
}

export function monitorarNovasVersoes() {
  window.addEventListener('vite:preloadError', (evento) => {
    if (recarregarParaNovaVersao()) evento.preventDefault()
  })
}
