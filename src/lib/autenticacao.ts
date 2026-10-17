import { IconeDiscord, IconeGoogle } from '@/componentes/autenticacao/IconesProvedores'

export const provedores = [
  { id: 'google' as const, nome: 'Google', Icone: IconeGoogle },
  { id: 'discord' as const, nome: 'Discord', Icone: IconeDiscord },
]

export type ProvedorExterno = (typeof provedores)[number]['id']

export function urlRetorno() {
  return `${window.location.origin}/auth/retorno`
}

export function escoposProvedor(provedor: ProvedorExterno) {
  return provedor === 'discord' ? 'identify email' : undefined
}
