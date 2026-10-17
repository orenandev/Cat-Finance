import { type FormEvent, useState } from 'react'
import { Botao } from '@/componentes/ui/Botao'
import { Campo, Selecao } from '@/componentes/ui/Campo'
import { CampoMoeda } from '@/componentes/ui/CampoMoeda'
import { Interruptor } from '@/componentes/ui/Interruptor'
import { Modal } from '@/componentes/ui/Modal'
import { useSalvarFuncionario } from '@/consultas/equipe'
import { useNotificacoes } from '@/contextos/NotificacoesContexto'
import { rotulosContrato } from '@/lib/rotulos'
import type { Funcionario, TipoContrato } from '@/tipos/dominio'
import { type ErrosFormulario, esquemaFuncionario, validarFormulario } from '@/validacao/esquemas'

interface PropsModalFuncionario {
  aberto: boolean
  aoFechar: () => void
  empresaId: string
  funcionario?: Funcionario | null
}

export function ModalFuncionario({ aberto, aoFechar, empresaId, funcionario }: PropsModalFuncionario) {
  return (
    <Modal
      aberto={aberto}
      aoFechar={aoFechar}
      titulo={funcionario ? 'Editar pessoa' : 'Adicionar à equipe'}
      descricao="Os dados entram automaticamente na próxima folha gerada."
    >
      {aberto && (
        <FormularioFuncionario key={funcionario?.id ?? 'novo'} empresaId={empresaId} funcionario={funcionario} aoConcluir={aoFechar} />
      )}
    </Modal>
  )
}

function FormularioFuncionario({
  empresaId,
  funcionario,
  aoConcluir,
}: {
  empresaId: string
  funcionario?: Funcionario | null
  aoConcluir: () => void
}) {
  const salvar = useSalvarFuncionario(empresaId)
  const notificacoes = useNotificacoes()
  const [erros, setErros] = useState<ErrosFormulario>({})
  const [formulario, setFormulario] = useState({
    nome: funcionario?.nome ?? '',
    cargo: funcionario?.cargo ?? '',
    tipo_contrato: funcionario?.tipo_contrato ?? ('clt' as TipoContrato),
    salario: funcionario ? Number(funcionario.salario) : 0,
    dia_pagamento: funcionario?.dia_pagamento ?? 5,
    admitido_em: funcionario?.admitido_em ?? null,
    ativo: funcionario?.ativo ?? true,
  })

  function alterar<K extends keyof typeof formulario>(campo: K, valor: (typeof formulario)[K]) {
    setFormulario((atual) => ({ ...atual, [campo]: valor }))
  }

  async function enviar(evento: FormEvent) {
    evento.preventDefault()
    const validacao = validarFormulario(esquemaFuncionario, formulario)
    if (!validacao.sucesso) {
      setErros(validacao.erros)
      return
    }
    try {
      await salvar.mutateAsync({ id: funcionario?.id, ...validacao.dados })
      notificacoes.sucesso(funcionario ? 'Dados atualizados.' : `${validacao.dados.nome} entrou para a equipe.`)
      aoConcluir()
    } catch {
      return
    }
  }

  return (
    <form onSubmit={enviar} noValidate className="flex flex-col gap-4">
      <Campo
        rotulo="Nome"
        placeholder="Nome completo"
        value={formulario.nome}
        onChange={(evento) => alterar('nome', evento.target.value)}
        maxLength={120}
        erro={erros.nome}
        autoFocus
      />
      <div className="grid gap-4 sm:grid-cols-2">
        <Campo
          rotulo="Cargo"
          placeholder="Ex.: Atendente"
          value={formulario.cargo ?? ''}
          onChange={(evento) => alterar('cargo', evento.target.value)}
          maxLength={80}
        />
        <Selecao
          rotulo="Contrato"
          value={formulario.tipo_contrato}
          onChange={(evento) => alterar('tipo_contrato', evento.target.value as TipoContrato)}
        >
          {(Object.keys(rotulosContrato) as TipoContrato[]).map((tipo) => (
            <option key={tipo} value={tipo}>
              {rotulosContrato[tipo]}
            </option>
          ))}
        </Selecao>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <CampoMoeda rotulo="Salário / valor mensal" valor={formulario.salario} aoMudar={(valor) => alterar('salario', valor)} erro={erros.salario} maximo={99_999_999} />
        <Campo
          rotulo="Dia de pagamento"
          type="number"
          min={1}
          max={31}
          value={formulario.dia_pagamento}
          onChange={(evento) => alterar('dia_pagamento', evento.target.valueAsNumber)}
          erro={erros.dia_pagamento}
        />
      </div>
      <Campo
        rotulo="Data de admissão"
        type="date"
        value={formulario.admitido_em ?? ''}
        onChange={(evento) => alterar('admitido_em', evento.target.value || null)}
        dica="Opcional. Pessoas admitidas depois da competência não entram na folha."
      />
      <Interruptor
        rotulo="Ativo na equipe"
        descricao="Desative para manter o histórico sem incluir em novas folhas."
        ligado={formulario.ativo}
        aoMudar={(ativo) => alterar('ativo', ativo)}
      />

      <div className="flex flex-col-reverse gap-2 pt-1 sm:flex-row sm:justify-end">
        <Botao variante="secundaria" onClick={aoConcluir}>
          Cancelar
        </Botao>
        <Botao type="submit" carregando={salvar.isPending}>
          {funcionario ? 'Salvar' : 'Adicionar'}
        </Botao>
      </div>
    </form>
  )
}
