import { useCallback, useEffect, useState } from 'react'

export function useContagem(segundosIniciais = 0) {
  const [restante, setRestante] = useState(segundosIniciais)

  useEffect(() => {
    if (restante <= 0) return
    const temporizador = window.setTimeout(() => setRestante((atual) => atual - 1), 1000)
    return () => window.clearTimeout(temporizador)
  }, [restante])

  const iniciar = useCallback((segundos: number) => setRestante(segundos), [])

  return { restante, ativo: restante > 0, iniciar }
}
