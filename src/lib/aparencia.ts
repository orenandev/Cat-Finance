import {
  Briefcase,
  Building2,
  Camera,
  Car,
  Coffee,
  Dumbbell,
  Hammer,
  HeartPulse,
  Laptop,
  type LucideIcon,
  Music,
  Palette,
  PawPrint,
  Rocket,
  Scissors,
  ShoppingBag,
  Store,
  Truck,
  Utensils,
  Wrench,
} from 'lucide-react'

export const paleta = {
  verde: '#65a30d',
  azul: '#2f7cf6',
  ciano: '#0ea5c6',
  esmeralda: '#10a37f',
  ambar: '#e3a008',
  laranja: '#f0782b',
  rosa: '#e8508a',
  vermelho: '#e23b3b',
  grafite: '#3f463e',
  ardosia: '#64748b',
} as const

export type CorPaleta = keyof typeof paleta

export const nomesCores = Object.keys(paleta) as CorPaleta[]

export function corHex(cor: string) {
  return paleta[cor as CorPaleta] ?? paleta.ardosia
}

export const icones: Record<string, LucideIcon> = {
  'building-2': Building2,
  briefcase: Briefcase,
  store: Store,
  laptop: Laptop,
  rocket: Rocket,
  'paw-print': PawPrint,
  coffee: Coffee,
  utensils: Utensils,
  'shopping-bag': ShoppingBag,
  truck: Truck,
  car: Car,
  hammer: Hammer,
  wrench: Wrench,
  camera: Camera,
  music: Music,
  palette: Palette,
  scissors: Scissors,
  dumbbell: Dumbbell,
  'heart-pulse': HeartPulse,
}

export const nomesIcones = Object.keys(icones)

export function iconeEmpresa(nome: string) {
  return icones[nome] ?? Building2
}
