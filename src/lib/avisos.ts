type TipoAviso = 'sucesso' | 'erro' | 'info'
type Ouvinte = (tipo: TipoAviso, mensagem: string) => void

const ouvintes = new Set<Ouvinte>()

export function ouvirAvisos(ouvinte: Ouvinte) {
  ouvintes.add(ouvinte)
  return () => {
    ouvintes.delete(ouvinte)
  }
}

export function emitirAviso(tipo: TipoAviso, mensagem: string) {
  for (const ouvinte of ouvintes) ouvinte(tipo, mensagem)
}
