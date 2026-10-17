import { Eye, EyeOff, Lock } from 'lucide-react'
import { type ComponentProps, useState } from 'react'
import { Campo } from '@/componentes/ui/Campo'
import { cx } from '@/lib/classes'
import { forcaSenha } from '@/validacao/esquemas'

interface PropsCampoSenha extends Omit<ComponentProps<typeof Campo>, 'type' | 'prefixo' | 'sufixo'> {
  medidor?: boolean
}

const rotulosForca = ['Muito fraca', 'Fraca', 'Razoável', 'Boa', 'Forte']
const coresForca = ['bg-despesa', 'bg-despesa', 'bg-alerta', 'bg-receita', 'bg-receita']

export function CampoSenha({ medidor, value, ...props }: PropsCampoSenha) {
  const [visivel, setVisivel] = useState(false)
  const senha = String(value ?? '')
  const forca = forcaSenha(senha)

  return (
    <div className="flex flex-col gap-2">
      <Campo
        {...props}
        value={value}
        type={visivel ? 'text' : 'password'}
        prefixo={<Lock size={16} />}
        sufixo={
          <button
            type="button"
            onClick={() => setVisivel((atual) => !atual)}
            aria-label={visivel ? 'Ocultar senha' : 'Mostrar senha'}
            className="rounded-lg p-2 text-texto-fraco hover:text-texto"
          >
            {visivel ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        }
      />
      {medidor && senha && (
        <div className="flex items-center gap-3" aria-live="polite">
          <div className="grid flex-1 grid-cols-4 gap-1">
            {[0, 1, 2, 3].map((indice) => (
              <span
                key={indice}
                className={cx('h-1 rounded-full transition-colors', indice < forca ? coresForca[forca] : 'bg-superficie-3')}
              />
            ))}
          </div>
          <span className="w-20 text-right text-[11px] text-texto-fraco">{rotulosForca[forca]}</span>
        </div>
      )}
    </div>
  )
}
