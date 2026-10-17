import { type FormEvent, useState } from 'react'
import { Botao } from '@/componentes/ui/Botao'
import { Campo, Selecao } from '@/componentes/ui/Campo'
import { CampoMoeda } from '@/componentes/ui/CampoMoeda'
import { Interruptor } from '@/componentes/ui/Interruptor'
import { Modal } from '@/componentes/ui/Modal'
import { useCategorias } from '@/consultas/categorias'
import { useEmpresas } from '@/consultas/empresas'
import { useSalvarRecorrencia } from '@/consultas/recorrencias'
import { useNotificacoes } from '@/contextos/NotificacoesContexto'
import { hojeIso } from '@/lib/formatacao'
import { rotulosFrequencia } from '@/lib/rotulos'
import type { Frequencia, Recorrencia, TipoLancamento } from '@/tipos/dominio'
import { type ErrosFormulario, esquemaRecorrencia, validarFormulario } from '@/validacao/esquemas'
import { SeletorTipo } from './SeletorTipo'

interface PropsModalRecorrencia {
  aberto: boolean
  aoFechar: () => void
  recorrencia?: Recorrencia | null
  padrao?: { empresa_id?: string | null; tipo?: TipoLancamento; custo_fixo?: boolean }
}

export function ModalRecorrencia({ aberto, aoFechar, recorrencia, padrao }: PropsModalRecorrencia) {
  return (
    <Modal
      aberto={aberto}
      aoFechar={aoFechar}
      titulo={recorrencia ? 'Editar recorrência' : padrao?.custo_fixo ? 'Novo custo fixo' : 'Nova recorrência'}
      descricao="Lançamentos recorrentes são gerados automaticamente na data certa."
    >
      {aberto && (
        <FormularioRecorrencia key={recorrencia?.id ?? 'nova'} recorrencia={recorrencia} padrao={padrao} aoConcluir={aoFechar} />
      )}
    </Modal>
  )
}

function FormularioRecorrencia({
  recorrencia,
  padrao,
  aoConcluir,
}: {
  recorrencia?: Recorrencia | null
  padrao?: PropsModalRecorrencia['padrao']
  aoConcluir: () => void
}) {
  const { data: empresas = [] } = useEmpresas()
  const { data: categorias = [] } = useCategorias()
  const salvar = useSalvarRecorrencia()
  const notificacoes = useNotificacoes()
  const [erros, setErros] = useState<ErrosFormulario>({})
  const [formulario, setFormulario] = useState({
    tipo: recorrencia?.tipo ?? padrao?.tipo ?? ('despesa' as TipoLancamento),
    descricao: recorrencia?.descricao ?? '',
    valor: recorrencia ? Number(recorrencia.valor) : 0,
    frequencia: recorrencia?.frequencia ?? ('mensal' as Frequencia),
    inicio_em: recorrencia?.inicio_em ?? hojeIso(),
    fim_em: recorrencia?.fim_em ?? null,
    empresa_id: recorrencia ? recorrencia.empresa_id : (padrao?.empresa_id ?? null),
    categoria_id: recorrencia?.categoria_id ?? null,
    custo_fixo: recorrencia?.custo_fixo ?? padrao?.custo_fixo ?? false,
    ativa: recorrencia?.ativa ?? true,
  })

  function alterar<K extends keyof typeof formulario>(campo: K, valor: (typeof formulario)[K]) {
    setFormulario((atual) => ({ ...atual, [campo]: valor }))
  }

  async function enviar(evento: FormEvent) {
    evento.preventDefault()
    const validacao = validarFormulario(esquemaRecorrencia, formulario)
    if (!validacao.sucesso) {
      setErros(validacao.erros)
      return
    }
    try {
      await salvar.mutateAsync({ id: recorrencia?.id, ...validacao.dados })
      notificacoes.sucesso(recorrencia ? 'Recorrência atualizada.' : 'Recorrência criada.')
      aoConcluir()
    } catch {
      return
    }
  }

  const ehCustoDeEmpresa = Boolean(formulario.empresa_id) && formulario.tipo === 'despesa'

  return (
    <form onSubmit={enviar} noValidate className="flex flex-col gap-4">
      <SeletorTipo valor={formulario.tipo} aoMudar={(tipo) => setFormulario((atual) => ({ ...atual, tipo, categoria_id: null }))} />

      <div className="grid gap-4 sm:grid-cols-2">
        <CampoMoeda
          rotulo="Valor"
          valor={formulario.valor}
          aoMudar={(valor) => alterar('valor', valor)}
          erro={erros.valor}
          destaque={formulario.tipo}
          autoFocus={!recorrencia}
        />
        <Selecao
          rotulo="Frequência"
          value={formulario.frequencia}
          onChange={(evento) => alterar('frequencia', evento.target.value as Frequencia)}
        >
          {(Object.keys(rotulosFrequencia) as Frequencia[]).map((frequencia) => (
            <option key={frequencia} value={frequencia}>
              {rotulosFrequencia[frequencia]}
            </option>
          ))}
        </Selecao>
      </div>

      <Campo
        rotulo="Descrição"
        placeholder={formulario.tipo === 'despesa' ? 'Ex.: Aluguel do escritório' : 'Ex.: Salário'}
        value={formulario.descricao}
        onChange={(evento) => alterar('descricao', evento.target.value)}
        maxLength={140}
        erro={erros.descricao}
      />

      <div className="grid gap-4 sm:grid-cols-2">
        <Campo
          rotulo="Primeira ocorrência"
          type="date"
          value={formulario.inicio_em}
          onChange={(evento) => alterar('inicio_em', evento.target.value)}
          erro={erros.inicio_em}
          dica="Datas passadas geram os lançamentos retroativos."
        />
        <Campo
          rotulo="Termina em"
          type="date"
          value={formulario.fim_em ?? ''}
          onChange={(evento) => alterar('fim_em', evento.target.value || null)}
          erro={erros.fim_em}
          dica="Deixe vazio para não ter fim."
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Selecao
          rotulo="Onde lançar"
          value={formulario.empresa_id ?? ''}
          onChange={(evento) => {
            const empresaId = evento.target.value || null
            setFormulario((atual) => ({ ...atual, empresa_id: empresaId, custo_fixo: empresaId ? atual.custo_fixo : false }))
          }}
        >
          <option value="">Pessoal</option>
          {empresas
            .filter((empresa) => !empresa.arquivada || empresa.id === formulario.empresa_id)
            .map((empresa) => (
              <option key={empresa.id} value={empresa.id}>
                {empresa.nome}
              </option>
            ))}
        </Selecao>
        <Selecao
          rotulo="Categoria"
          value={formulario.categoria_id ?? ''}
          onChange={(evento) => alterar('categoria_id', evento.target.value || null)}
        >
          <option value="">Sem categoria</option>
          {categorias
            .filter((categoria) => categoria.tipo === formulario.tipo)
            .map((categoria) => (
              <option key={categoria.id} value={categoria.id}>
                {categoria.nome}
              </option>
            ))}
        </Selecao>
      </div>

      <div className="flex flex-col gap-3 rounded-xl border border-borda bg-superficie-2 p-3.5">
        {ehCustoDeEmpresa && (
          <Interruptor
            rotulo="Custo fixo da empresa"
            descricao="Entra no cálculo de custos fixos e ponto de equilíbrio."
            ligado={formulario.custo_fixo}
            aoMudar={(ligado) => alterar('custo_fixo', ligado)}
          />
        )}
        <Interruptor
          rotulo="Ativa"
          descricao="Pausar interrompe a geração de novos lançamentos."
          ligado={formulario.ativa}
          aoMudar={(ligado) => alterar('ativa', ligado)}
        />
      </div>

      <div className="flex flex-col-reverse gap-2 pt-1 sm:flex-row sm:justify-end">
        <Botao variante="secundaria" onClick={aoConcluir}>
          Cancelar
        </Botao>
        <Botao type="submit" carregando={salvar.isPending}>
          {recorrencia ? 'Salvar alterações' : 'Criar recorrência'}
        </Botao>
      </div>
    </form>
  )
}
