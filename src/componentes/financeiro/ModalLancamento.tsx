import { type FormEvent, useState } from 'react'
import { Segmentado } from '@/componentes/ui/Abas'
import { Botao } from '@/componentes/ui/Botao'
import { AreaTexto, Campo, Selecao } from '@/componentes/ui/Campo'
import { CampoMoeda } from '@/componentes/ui/CampoMoeda'
import { Interruptor } from '@/componentes/ui/Interruptor'
import { Modal } from '@/componentes/ui/Modal'
import { useCategorias } from '@/consultas/categorias'
import { useEmpresas } from '@/consultas/empresas'
import { useSalvarLancamento } from '@/consultas/lancamentos'
import { useSalvarRecorrencia } from '@/consultas/recorrencias'
import { useNotificacoes } from '@/contextos/NotificacoesContexto'
import { hojeIso } from '@/lib/formatacao'
import { rotulosFrequencia } from '@/lib/rotulos'
import type { Frequencia, Lancamento, TipoLancamento } from '@/tipos/dominio'
import { type ErrosFormulario, esquemaLancamento, validarFormulario } from '@/validacao/esquemas'
import { SeletorTipo } from './SeletorTipo'

export interface PadraoLancamento {
  tipo?: TipoLancamento
  empresa_id?: string | null
}

interface PropsModalLancamento {
  aberto: boolean
  aoFechar: () => void
  lancamento?: Lancamento | null
  padrao?: PadraoLancamento
}

function estadoInicial(lancamento?: Lancamento | null, padrao?: PadraoLancamento) {
  return {
    tipo: lancamento?.tipo ?? padrao?.tipo ?? 'despesa',
    descricao: lancamento?.descricao ?? '',
    valor: lancamento ? Number(lancamento.valor) : 0,
    data: lancamento?.data ?? hojeIso(),
    pago: lancamento?.pago ?? true,
    empresa_id: lancamento ? lancamento.empresa_id : (padrao?.empresa_id ?? null),
    categoria_id: lancamento?.categoria_id ?? null,
    observacoes: lancamento?.observacoes ?? '',
  }
}

export function ModalLancamento({ aberto, aoFechar, lancamento, padrao }: PropsModalLancamento) {
  return (
    <Modal
      aberto={aberto}
      aoFechar={aoFechar}
      titulo={lancamento ? 'Editar lançamento' : 'Novo lançamento'}
      descricao={lancamento ? undefined : 'Registre uma entrada ou saída de dinheiro.'}
    >
      {aberto && <FormularioLancamento key={lancamento?.id ?? 'novo'} lancamento={lancamento} padrao={padrao} aoConcluir={aoFechar} />}
    </Modal>
  )
}

function FormularioLancamento({
  lancamento,
  padrao,
  aoConcluir,
}: {
  lancamento?: Lancamento | null
  padrao?: PadraoLancamento
  aoConcluir: () => void
}) {
  const [formulario, setFormulario] = useState(() => estadoInicial(lancamento, padrao))
  const [recorrente, setRecorrente] = useState(false)
  const [frequencia, setFrequencia] = useState<Frequencia>('mensal')
  const [erros, setErros] = useState<ErrosFormulario>({})
  const { data: empresas = [] } = useEmpresas()
  const { data: categorias = [] } = useCategorias()
  const salvarLancamento = useSalvarLancamento()
  const salvarRecorrencia = useSalvarRecorrencia()
  const notificacoes = useNotificacoes()

  const categoriasDoTipo = categorias.filter((categoria) => categoria.tipo === formulario.tipo)
  const empresasAtivas = empresas.filter((empresa) => !empresa.arquivada || empresa.id === formulario.empresa_id)
  const bloqueadoPorOrigem = lancamento?.origem === 'folha'

  function alterar<K extends keyof typeof formulario>(campo: K, valor: (typeof formulario)[K]) {
    setFormulario((atual) => ({ ...atual, [campo]: valor }))
  }

  async function enviar(evento: FormEvent) {
    evento.preventDefault()
    const validacao = validarFormulario(esquemaLancamento, formulario)
    if (!validacao.sucesso) {
      setErros(validacao.erros)
      return
    }
    setErros({})
    const dados = validacao.dados

    try {
      if (recorrente && !lancamento) {
        await salvarRecorrencia.mutateAsync({
          tipo: dados.tipo,
          descricao: dados.descricao,
          valor: dados.valor,
          frequencia,
          inicio_em: dados.data,
          fim_em: null,
          empresa_id: dados.empresa_id,
          categoria_id: dados.categoria_id,
          custo_fixo: Boolean(dados.empresa_id) && dados.tipo === 'despesa',
          ativa: true,
        })
        notificacoes.sucesso('Recorrência criada. Os lançamentos serão gerados automaticamente.')
      } else {
        await salvarLancamento.mutateAsync({ id: lancamento?.id, ...dados })
        notificacoes.sucesso(lancamento ? 'Lançamento atualizado.' : 'Lançamento registrado.')
      }
      aoConcluir()
    } catch {
      return
    }
  }

  return (
    <form onSubmit={enviar} noValidate className="flex flex-col gap-4">
      <SeletorTipo
        valor={formulario.tipo}
        aoMudar={(tipo) => setFormulario((atual) => ({ ...atual, tipo, categoria_id: null }))}
      />

      <CampoMoeda
        rotulo="Valor"
        valor={formulario.valor}
        aoMudar={(valor) => alterar('valor', valor)}
        erro={erros.valor}
        destaque={formulario.tipo}
        autoFocus={!lancamento}
      />

      <Campo
        rotulo="Descrição"
        placeholder={formulario.tipo === 'despesa' ? 'Ex.: Mercado do mês' : 'Ex.: Pagamento do cliente'}
        value={formulario.descricao}
        onChange={(evento) => alterar('descricao', evento.target.value)}
        maxLength={140}
        erro={erros.descricao}
      />

      <div className="grid gap-4 sm:grid-cols-2">
        <Campo
          rotulo="Data"
          type="date"
          value={formulario.data}
          onChange={(evento) => alterar('data', evento.target.value)}
          erro={erros.data}
        />
        <Selecao
          rotulo="Categoria"
          value={formulario.categoria_id ?? ''}
          onChange={(evento) => alterar('categoria_id', evento.target.value || null)}
        >
          <option value="">Sem categoria</option>
          {categoriasDoTipo.map((categoria) => (
            <option key={categoria.id} value={categoria.id}>
              {categoria.nome}
            </option>
          ))}
        </Selecao>
      </div>

      <Selecao
        rotulo="Onde lançar"
        value={formulario.empresa_id ?? ''}
        onChange={(evento) => alterar('empresa_id', evento.target.value || null)}
        disabled={bloqueadoPorOrigem}
        dica={
          formulario.empresa_id
            ? 'Entra no caixa da empresa e afeta o lucro distribuído para você.'
            : 'Entra direto nas suas finanças pessoais.'
        }
      >
        <option value="">Pessoal</option>
        {empresasAtivas.map((empresa) => (
          <option key={empresa.id} value={empresa.id}>
            {empresa.nome}
          </option>
        ))}
      </Selecao>

      <Interruptor
        rotulo={formulario.tipo === 'despesa' ? 'Já foi pago' : 'Já foi recebido'}
        descricao="Lançamentos pendentes não entram nos totais até serem confirmados."
        ligado={formulario.pago}
        aoMudar={(pago) => alterar('pago', pago)}
      />

      {!lancamento && (
        <div className="rounded-xl border border-borda bg-superficie-2 p-3.5">
          <Interruptor
            rotulo="Repetir automaticamente"
            descricao="Cria uma recorrência que lança este valor sozinha."
            ligado={recorrente}
            aoMudar={setRecorrente}
          />
          {recorrente && (
            <div className="mt-3">
              <Segmentado
                rotulo="Frequência"
                ativo={frequencia}
                aoMudar={setFrequencia}
                opcoes={(Object.keys(rotulosFrequencia) as Frequencia[]).map((valor) => ({ valor, rotulo: rotulosFrequencia[valor] }))}
              />
            </div>
          )}
        </div>
      )}

      <AreaTexto
        rotulo="Observações"
        placeholder="Opcional"
        value={formulario.observacoes ?? ''}
        onChange={(evento) => alterar('observacoes', evento.target.value)}
        maxLength={500}
        rows={2}
      />

      <div className="flex flex-col-reverse gap-2 pt-1 sm:flex-row sm:justify-end">
        <Botao variante="secundaria" onClick={aoConcluir}>
          Cancelar
        </Botao>
        <Botao type="submit" carregando={salvarLancamento.isPending || salvarRecorrencia.isPending}>
          {lancamento ? 'Salvar alterações' : recorrente ? 'Criar recorrência' : 'Registrar'}
        </Botao>
      </div>
    </form>
  )
}
