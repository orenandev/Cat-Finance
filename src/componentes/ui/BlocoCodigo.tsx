import { Check, Copy } from 'lucide-react'
import { useCopiar } from '@/hooks/useCopiar'
import { cx } from '@/lib/classes'

export function BlocoCodigo({ codigo, className }: { codigo: string; className?: string }) {
  const { copiado, copiar } = useCopiar()
  return (
    <div className={cx('relative rounded-xl border border-borda bg-[#0f1117] text-[#d8dcea]', className)}>
      <button
        type="button"
        onClick={() => copiar(codigo)}
        aria-label="Copiar código"
        className="absolute top-2 right-2 flex items-center gap-1 rounded-lg bg-white/8 px-2 py-1 text-[11px] text-white/70 transition-colors hover:bg-white/15 hover:text-white"
      >
        {copiado ? <Check size={12} /> : <Copy size={12} />}
        {copiado ? 'Copiado' : 'Copiar'}
      </button>
      <pre className="max-h-[420px] overflow-auto p-4 pr-20 font-mono text-[12px] leading-relaxed">
        <code>{codigo}</code>
      </pre>
    </div>
  )
}
