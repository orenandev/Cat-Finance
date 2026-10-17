import type { LucideIcon } from 'lucide-react'
import { createElement, type ReactNode, useState } from 'react'
import { marca } from '@/config/marca'
import { corHex, iconeEmpresa } from '@/lib/aparencia'
import { cx } from '@/lib/classes'
import { iniciais } from '@/lib/formatacao'

export function Logo({ tamanho = 32, className }: { tamanho?: number; className?: string }) {
  const [falhou, setFalhou] = useState(false)
  if (falhou) {
    return (
      <span
        style={{ width: tamanho, height: tamanho }}
        className={cx('grid place-items-center rounded-[23%] bg-marca text-sm font-bold text-white', className)}
      >
        C
      </span>
    )
  }
  return (
    <img
      src={marca.logo}
      alt={marca.nome}
      width={tamanho}
      height={tamanho}
      onError={() => setFalhou(true)}
      className={cx('shrink-0 rounded-[23%] object-cover', className)}
    />
  )
}

export function Avatar({ nome, url, tamanho = 32 }: { nome: string; url?: string | null; tamanho?: number }) {
  const [falhou, setFalhou] = useState(false)
  if (url && !falhou) {
    return (
      <img
        src={url}
        alt=""
        width={tamanho}
        height={tamanho}
        referrerPolicy="no-referrer"
        onError={() => setFalhou(true)}
        className="shrink-0 rounded-full object-cover ring-1 ring-borda"
      />
    )
  }
  return (
    <span
      aria-hidden
      style={{ width: tamanho, height: tamanho, fontSize: tamanho * 0.38 }}
      className="grid shrink-0 place-items-center rounded-full bg-primaria-suave font-semibold text-primaria-texto"
    >
      {iniciais(nome) || '?'}
    </span>
  )
}

export function IconeEmpresa({ cor, icone, tamanho = 'md' }: { cor: string; icone: string; tamanho?: 'sm' | 'md' | 'lg' }) {
  const dimensoes = { sm: 'h-5 w-5 rounded-md', md: 'h-9 w-9 rounded-xl', lg: 'h-12 w-12 rounded-2xl' }[tamanho]
  const tamanhoIcone = { sm: 12, md: 17, lg: 22 }[tamanho]
  return (
    <span className={cx('grid shrink-0 place-items-center text-white', dimensoes)} style={{ backgroundColor: corHex(cor) }}>
      {createElement(iconeEmpresa(icone), { size: tamanhoIcone, strokeWidth: 2.2 })}
    </span>
  )
}

export function EstadoVazio({
  icone: Icone,
  titulo,
  descricao,
  acao,
  compacto,
}: {
  icone: LucideIcon
  titulo: string
  descricao?: string
  acao?: ReactNode
  compacto?: boolean
}) {
  return (
    <div className={cx('flex flex-col items-center justify-center text-center', compacto ? 'py-8' : 'py-14')}>
      <span className="grid h-11 w-11 place-items-center rounded-full bg-superficie-3 text-texto-suave">
        <Icone size={19} />
      </span>
      <p className="mt-3 max-w-xs text-sm font-medium text-texto">{titulo}</p>
      {descricao && <p className="mt-1 max-w-sm text-xs text-texto-suave">{descricao}</p>}
      {acao && <div className="mt-4">{acao}</div>}
    </div>
  )
}

export function Esqueleto({ className }: { className?: string }) {
  return <div className={cx('animate-brilho rounded-lg bg-superficie-3', className)} />
}

type TomDistintivo = 'neutro' | 'receita' | 'despesa' | 'primaria' | 'alerta'

const tons: Record<TomDistintivo, string> = {
  neutro: 'bg-superficie-3 text-texto-suave',
  receita: 'bg-receita-suave text-receita',
  despesa: 'bg-despesa-suave text-despesa',
  primaria: 'bg-primaria-suave text-primaria-texto',
  alerta: 'bg-alerta-suave text-alerta',
}

export function Distintivo({ tom = 'neutro', children }: { tom?: TomDistintivo; children: ReactNode }) {
  return (
    <span className={cx('inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[11px] font-medium', tons[tom])}>
      {children}
    </span>
  )
}

export function PontoCor({ cor }: { cor: string }) {
  return <span className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: corHex(cor) }} />
}

export function CarregandoTela() {
  return (
    <div className="grid min-h-dvh place-items-center bg-fundo">
      <div className="flex flex-col items-center gap-3">
        <Logo tamanho={48} className="animate-brilho" />
        <span className="text-xs text-texto-fraco">Carregando…</span>
      </div>
    </div>
  )
}
