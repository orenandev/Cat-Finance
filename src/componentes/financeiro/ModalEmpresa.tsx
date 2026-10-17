import { Briefcase, Building2 } from 'lucide-react'
import { type FormEvent, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Botao } from '@/componentes/ui/Botao'
import { AreaTexto, Campo } from '@/componentes/ui/Campo'
import { CampoMoeda } from '@/componentes/ui/CampoMoeda'
import { Modal } from '@/componentes/ui/Modal'
import { useSalvarEmpresa } from '@/consultas/empresas'
import { useNotificacoes } from '@/contextos/NotificacoesContexto'
import { corHex, icones, nomesCores, nomesIcones } from '@/lib/aparencia'
import { cx } from '@/lib/classes'
import type { Empresa, TipoEntidade } from '@/tipos/dominio'
import { type ErrosFormulario, esquemaEmpresa, validarFormulario } from '@/validacao/esquemas'

interface PropsModalEmpresa {
  aberto: boolean
  aoFechar: () => void
  empresa?: Empresa | null
}

export function ModalEmpresa({ aberto, aoFechar, empresa }: PropsModalEmpresa) {
  return (
    <Modal
      aberto={aberto}
      aoFechar={aoFechar}
      titulo={empresa ? 'Editar empresa ou trabalho' : 'Nova empresa ou trabalho'}
      descricao="Cada empresa tem seu próprio caixa, equipe, folha e custos fixos."
      largura="lg"
    >
      {aberto && <FormularioEmpresa key={empresa?.id ?? 'nova'} empresa={empresa} aoConcluir={aoFechar} />}
    </Modal>
  )
}

const tipos: { valor: TipoEntidade; rotulo: string; descricao: string; Icone: typeof Building2 }[] = [
  { valor: 'empresa', rotulo: 'Empresa', descricao: 'Negócio com caixa, equipe e custos', Icone: Building2 },
  { valor: 'trabalho', rotulo: 'Trabalho', descricao: 'Emprego, freela ou projeto', Icone: Briefcase },
]

function FormularioEmpresa({ empresa, aoConcluir }: { empresa?: Empresa | null; aoConcluir: () => void }) {
  const navegar = useNavigate()
  const notificacoes = useNotificacoes()
  const salvar = useSalvarEmpresa()
  const [erros, setErros] = useState<ErrosFormulario>({})
  const [formulario, setFormulario] = useState({
    nome: empresa?.nome ?? '',
    tipo: empresa?.tipo ?? ('empresa' as TipoEntidade),
    cor: empresa?.cor ?? 'esmeralda',
    icone: empresa?.icone ?? 'building-2',
    participacao: empresa ? Number(empresa.participacao) : 100,
    documento: empresa?.documento ?? '',
    descricao: empresa?.descricao ?? '',
    meta_mensal: empresa?.meta_mensal ?? null,
  })

  function alterar<K extends keyof typeof formulario>(campo: K, valor: (typeof formulario)[K]) {
    setFormulario((atual) => ({ ...atual, [campo]: valor }))
  }

  async function enviar(evento: FormEvent) {
    evento.preventDefault()
    const validacao = validarFormulario(esquemaEmpresa, formulario)
    if (!validacao.sucesso) {
      setErros(validacao.erros)
      return
    }
    try {
      const salva = await salvar.mutateAsync({ id: empresa?.id, ...validacao.dados })
      notificacoes.sucesso(empresa ? 'Alterações salvas.' : `${salva.nome} criada com sucesso!`)
      aoConcluir()
      if (!empresa) navegar(`/empresas/${salva.id}`)
    } catch {
      return
    }
  }

  return (
    <form onSubmit={enviar} noValidate className="flex flex-col gap-5">
      <div role="radiogroup" aria-label="Tipo" className="grid gap-2 sm:grid-cols-2">
        {tipos.map(({ valor, rotulo, descricao, Icone }) => (
          <button
            key={valor}
            type="button"
            role="radio"
            aria-checked={formulario.tipo === valor}
            onClick={() => {
              alterar('tipo', valor)
              if (formulario.icone === 'building-2' || formulario.icone === 'briefcase') {
                alterar('icone', valor === 'empresa' ? 'building-2' : 'briefcase')
              }
            }}
            className={cx(
              'flex items-center gap-3 rounded-xl border p-3 text-left transition-all',
              formulario.tipo === valor ? 'border-marca bg-primaria-suave/60 ring-4 ring-marca/10' : 'border-borda hover:bg-superficie-2',
            )}
          >
            <span className="grid h-9 w-9 place-items-center rounded-lg bg-superficie text-primaria-texto shadow-cartao">
              <Icone size={17} />
            </span>
            <span>
              <span className="block text-sm font-medium">{rotulo}</span>
              <span className="block text-xs text-texto-suave">{descricao}</span>
            </span>
          </button>
        ))}
      </div>

      <Campo
        rotulo="Nome"
        placeholder={formulario.tipo === 'empresa' ? 'Ex.: Padaria do Bairro' : 'Ex.: Freela de design'}
        value={formulario.nome}
        onChange={(evento) => alterar('nome', evento.target.value)}
        maxLength={80}
        erro={erros.nome}
        autoFocus
      />

      <div>
        <p className="mb-2 text-[13px] font-medium">Aparência</p>
        <div className="flex flex-col gap-3 rounded-xl border border-borda p-3">
          <div className="flex flex-wrap gap-2">
            {nomesCores.map((cor) => (
              <button
                key={cor}
                type="button"
                aria-label={`Cor ${cor}`}
                aria-pressed={formulario.cor === cor}
                onClick={() => alterar('cor', cor)}
                className={cx(
                  'h-7 w-7 rounded-full transition-transform hover:scale-110',
                  formulario.cor === cor && 'ring-2 ring-texto ring-offset-2 ring-offset-superficie',
                )}
                style={{ backgroundColor: corHex(cor) }}
              />
            ))}
          </div>
          <div className="flex flex-wrap gap-1.5">
            {nomesIcones.map((nome) => {
              const Icone = icones[nome]!
              const selecionado = formulario.icone === nome
              return (
                <button
                  key={nome}
                  type="button"
                  aria-label={`Ícone ${nome}`}
                  aria-pressed={selecionado}
                  onClick={() => alterar('icone', nome)}
                  className={cx(
                    'grid h-9 w-9 place-items-center rounded-lg transition-colors',
                    selecionado ? 'text-white' : 'text-texto-suave hover:bg-superficie-3',
                  )}
                  style={selecionado ? { backgroundColor: corHex(formulario.cor) } : undefined}
                >
                  <Icone size={17} />
                </button>
              )
            })}
          </div>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Campo
          rotulo="Sua participação no lucro"
          type="number"
          inputMode="decimal"
          min={0.01}
          max={100}
          step={0.01}
          value={Number.isFinite(formulario.participacao) ? formulario.participacao : ''}
          onChange={(evento) => alterar('participacao', evento.target.valueAsNumber)}
          sufixo={<span className="pr-2 text-sm text-texto-fraco">%</span>}
          erro={erros.participacao}
          dica="Quanto do lucro desta empresa vai para o seu resultado pessoal."
        />
        <CampoMoeda
          rotulo="Meta de faturamento mensal"
          valor={formulario.meta_mensal ?? 0}
          aoMudar={(valor) => alterar('meta_mensal', valor > 0 ? valor : null)}
          dica="Opcional. Mostramos o progresso no painel."
        />
      </div>

      {formulario.tipo === 'empresa' && (
        <Campo
          rotulo="CNPJ"
          placeholder="Opcional"
          inputMode="numeric"
          value={formulario.documento ?? ''}
          onChange={(evento) => alterar('documento', evento.target.value)}
          maxLength={20}
        />
      )}

      <AreaTexto
        rotulo="Descrição"
        placeholder="Opcional"
        value={formulario.descricao ?? ''}
        onChange={(evento) => alterar('descricao', evento.target.value)}
        maxLength={280}
        rows={2}
      />

      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <Botao variante="secundaria" onClick={aoConcluir}>
          Cancelar
        </Botao>
        <Botao type="submit" carregando={salvar.isPending}>
          {empresa ? 'Salvar alterações' : 'Criar'}
        </Botao>
      </div>
    </form>
  )
}
