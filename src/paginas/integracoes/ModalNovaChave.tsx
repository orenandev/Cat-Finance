import { Check, Copy, KeyRound, ShieldAlert } from 'lucide-react'
import { type FormEvent, useState } from 'react'
import { Botao } from '@/componentes/ui/Botao'
import { Campo, Selecao } from '@/componentes/ui/Campo'
import { Modal } from '@/componentes/ui/Modal'
import { useEmpresas } from '@/consultas/empresas'
import { useCopiar } from '@/hooks/useCopiar'
import { useCriarChaveApi } from '@/consultas/integracoes'
import { cx } from '@/lib/classes'
import { rotulosEscopo } from '@/lib/rotulos'
import type { EscopoApi } from '@/tipos/dominio'
import { type ErrosFormulario, esquemaChaveApi, validarFormulario } from '@/validacao/esquemas'

const validades = [
  { valor: '', rotulo: 'Sem expiração' },
  { valor: '30', rotulo: '30 dias' },
  { valor: '90', rotulo: '90 dias' },
  { valor: '365', rotulo: '1 ano' },
]

export function ModalNovaChave({ aberto, aoFechar }: { aberto: boolean; aoFechar: () => void }) {
  return (
    <Modal aberto={aberto} aoFechar={aoFechar} titulo="Nova chave de API" descricao="Use em bots, automações e atalhos para lançar sem abrir o app.">
      {aberto && <ConteudoNovaChave aoFechar={aoFechar} />}
    </Modal>
  )
}

function ConteudoNovaChave({ aoFechar }: { aoFechar: () => void }) {
  const { data: empresas = [] } = useEmpresas()
  const criar = useCriarChaveApi()
  const { copiado, copiar } = useCopiar()
  const [chaveGerada, setChaveGerada] = useState<string | null>(null)
  const [erros, setErros] = useState<ErrosFormulario>({})
  const [nome, setNome] = useState('')
  const [validade, setValidade] = useState('90')
  const [empresaPadraoId, setEmpresaPadraoId] = useState('')
  const [escopos, setEscopos] = useState<EscopoApi[]>(['lancamentos:escrever', 'lancamentos:ler', 'resumo:ler'])

  function alternarEscopo(escopo: EscopoApi) {
    setEscopos((atuais) => (atuais.includes(escopo) ? atuais.filter((item) => item !== escopo) : [...atuais, escopo]))
  }

  async function enviar(evento: FormEvent) {
    evento.preventDefault()
    const expiraEm = validade ? new Date(Date.now() + Number(validade) * 86_400_000).toISOString() : null
    const validacao = validarFormulario(esquemaChaveApi, { nome, escopos, empresaPadraoId: empresaPadraoId || null, expiraEm })
    if (!validacao.sucesso) {
      setErros(validacao.erros)
      return
    }
    try {
      const criada = await criar.mutateAsync(validacao.dados)
      setChaveGerada(criada.chave)
    } catch {
      return
    }
  }

  if (chaveGerada) {
    return (
      <div className="flex flex-col gap-4">
        <div className="flex items-start gap-3 rounded-xl border border-alerta/30 bg-alerta-suave p-3.5 text-[13px] text-texto">
          <ShieldAlert size={18} className="mt-0.5 shrink-0 text-alerta" />
          <p>
            Copie a chave agora. Por segurança, guardamos apenas um hash dela e <strong>não será possível vê-la novamente</strong>.
          </p>
        </div>
        <div className="flex items-center gap-2 rounded-xl border border-borda bg-superficie-2 p-2 pl-3.5">
          <KeyRound size={16} className="shrink-0 text-marca" />
          <code className="min-w-0 flex-1 truncate font-mono text-xs select-all">{chaveGerada}</code>
          <Botao tamanho="sm" variante={copiado ? 'secundaria' : 'primaria'} icone={copiado ? Check : Copy} onClick={() => copiar(chaveGerada)}>
            {copiado ? 'Copiada' : 'Copiar'}
          </Botao>
        </div>
        <Botao variante="secundaria" onClick={aoFechar} className="self-end">
          Já guardei a chave
        </Botao>
      </div>
    )
  }

  return (
    <form onSubmit={enviar} noValidate className="flex flex-col gap-4">
      <Campo
        rotulo="Nome"
        placeholder="Ex.: Bot do Discord"
        value={nome}
        onChange={(evento) => setNome(evento.target.value)}
        maxLength={60}
        erro={erros.nome}
        autoFocus
      />

      <fieldset>
        <legend className="mb-2 text-[13px] font-medium">Permissões</legend>
        <div className="grid gap-2 sm:grid-cols-2">
          {(Object.keys(rotulosEscopo) as EscopoApi[]).map((escopo) => {
            const marcado = escopos.includes(escopo)
            return (
              <label
                key={escopo}
                className={cx(
                  'flex cursor-pointer items-start gap-2.5 rounded-xl border p-3 transition-colors',
                  marcado ? 'border-marca bg-primaria-suave/50' : 'border-borda hover:bg-superficie-2',
                )}
              >
                <input type="checkbox" checked={marcado} onChange={() => alternarEscopo(escopo)} className="mt-0.5 accent-[var(--marca)]" />
                <span>
                  <span className="block text-[13px] font-medium">{rotulosEscopo[escopo].titulo}</span>
                  <span className="block text-[11px] text-texto-suave">{rotulosEscopo[escopo].descricao}</span>
                </span>
              </label>
            )
          })}
        </div>
        {erros.escopos && <p className="mt-1.5 text-xs text-despesa">{erros.escopos}</p>}
      </fieldset>

      <div className="grid gap-4 sm:grid-cols-2">
        <Selecao
          rotulo="Lançar por padrão em"
          value={empresaPadraoId}
          onChange={(evento) => setEmpresaPadraoId(evento.target.value)}
          dica="Usado quando a requisição não informa empresa."
        >
          <option value="">Pessoal</option>
          {empresas
            .filter((empresa) => !empresa.arquivada)
            .map((empresa) => (
              <option key={empresa.id} value={empresa.id}>
                {empresa.nome}
              </option>
            ))}
        </Selecao>
        <Selecao rotulo="Validade" value={validade} onChange={(evento) => setValidade(evento.target.value)}>
          {validades.map((opcao) => (
            <option key={opcao.valor} value={opcao.valor}>
              {opcao.rotulo}
            </option>
          ))}
        </Selecao>
      </div>

      <div className="flex flex-col-reverse gap-2 pt-1 sm:flex-row sm:justify-end">
        <Botao variante="secundaria" onClick={aoFechar}>
          Cancelar
        </Botao>
        <Botao type="submit" icone={KeyRound} carregando={criar.isPending}>
          Gerar chave
        </Botao>
      </div>
    </form>
  )
}
