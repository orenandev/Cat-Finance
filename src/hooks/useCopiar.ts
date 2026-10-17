import { useEffect, useRef, useState } from 'react'

export function useCopiar() {
  const [copiado, setCopiado] = useState(false)
  const temporizador = useRef<number | undefined>(undefined)

  useEffect(() => () => window.clearTimeout(temporizador.current), [])

  async function copiar(texto: string) {
    try {
      await navigator.clipboard.writeText(texto)
      setCopiado(true)
      window.clearTimeout(temporizador.current)
      temporizador.current = window.setTimeout(() => setCopiado(false), 1800)
    } catch {
      setCopiado(false)
    }
  }

  return { copiado, copiar }
}
