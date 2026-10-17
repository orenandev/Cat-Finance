import { MoreHorizontal, Pencil, Plus, Trash2, UserRound, Users } from 'lucide-react'
import { useState } from 'react'
import { ModalFuncionario } from '@/componentes/empresa/ModalFuncionario'
import { Botao } from '@/componentes/ui/Botao'
import { Cartao } from '@/componentes/ui/Cartao'
import { Avatar, Distintivo, EstadoVazio, Esqueleto } from '@/componentes/ui/Diversos'
import { ItemMenu, Popover } from '@/componentes/ui/Popover'
import { useExcluirFuncionario, useFuncionarios } from '@/consultas/equipe'
import { useConfirmacao } from '@/contextos/ConfirmacaoContexto'
import { cx } from '@/lib/classes'
import { formatarMoeda } from '@/lib/formatacao'
import { rotulosContrato } from '@/lib/rotulos'
import type { Empresa, Funcionario } from '@/tipos/dominio'

export function AbaEquipe({ empresa }: { empresa: Empresa }) {
  const { data: funcionarios = [], isPending } = useFuncionarios(empresa.id)
  const excluir = useExcluirFuncionario(empresa.id)
  const confirmar = useConfirmacao()
  const [modal, setModal] = useState<{ aberto: boolean; funcionario?: Funcionario }>({ aberto: false })

  const ativos = funcionarios.filter((funcionario) => funcionario.ativo)
  const folhaMensal = ativos.reduce((soma, funcionario) => soma + Number(funcionario.salario), 0)

  async function remover(funcionario: Funcionario) {
    const confirmado = await confirmar({
      titulo: `Remover ${funcionario.nome}?`,
      descricao: 'O cadastro será excluído. Folhas já geradas mantêm o nome e os valores. Para manter o histórico, prefira desativar.',
      confirmar: 'Remover',
      perigo: true,
    })
    if (confirmado) excluir.mutate(funcionario.id)
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4">
        <div className="rounded-2xl border border-borda bg-superficie p-4 shadow-cartao">
          <p className="text-xs text-texto-suave">Pessoas ativas</p>
          <p className="numero mt-1 text-xl font-semibold">{ativos.length}</p>
        </div>
        <div className="rounded-2xl border border-borda bg-superficie p-4 shadow-cartao">
          <p className="text-xs text-texto-suave">Folha mensal estimada</p>
          <p className="numero mt-1 text-xl font-semibold text-despesa">{formatarMoeda(folhaMensal)}</p>
        </div>
        <div className="col-span-2 flex items-center justify-center rounded-2xl border border-dashed border-borda-forte p-4 sm:col-span-1">
          <Botao icone={Plus} onClick={() => setModal({ aberto: true })}>
            Adicionar pessoa
          </Botao>
        </div>
      </div>

      <Cartao titulo="Equipe" semPreenchimento className="overflow-hidden">
        {isPending ? (
          <Esqueleto className="m-5 h-32" />
        ) : funcionarios.length === 0 ? (
          <EstadoVazio
            icone={Users}
            titulo="Nenhuma pessoa na equipe"
            descricao="Cadastre funcionários, prestadores ou estagiários para gerar a folha de pagamento automaticamente."
            acao={
              <Botao tamanho="sm" icone={Plus} onClick={() => setModal({ aberto: true })}>
                Adicionar pessoa
              </Botao>
            }
          />
        ) : (
          <ul>
            {funcionarios.map((funcionario) => (
              <li
                key={funcionario.id}
                className={cx('flex items-center gap-3 border-b border-borda px-4 py-3 last:border-b-0 sm:px-5', !funcionario.ativo && 'opacity-55')}
              >
                <button
                  type="button"
                  onClick={() => setModal({ aberto: true, funcionario })}
                  className="flex min-w-0 flex-1 items-center gap-3 text-left"
                >
                  <Avatar nome={funcionario.nome} tamanho={36} />
                  <span className="min-w-0">
                    <span className="block truncate text-[13px] font-medium">{funcionario.nome}</span>
                    <span className="mt-0.5 flex flex-wrap items-center gap-2 text-[11px] text-texto-fraco">
                      <Distintivo tom="primaria">{rotulosContrato[funcionario.tipo_contrato]}</Distintivo>
                      {funcionario.cargo && <span>{funcionario.cargo}</span>}
                      <span>Paga dia {funcionario.dia_pagamento}</span>
                      {!funcionario.ativo && <Distintivo>Inativo</Distintivo>}
                    </span>
                  </span>
                </button>
                <span className="numero text-[13px] font-semibold">{formatarMoeda(Number(funcionario.salario))}</span>
                <Popover
                  gatilho={({ alternar }) => (
                    <button
                      type="button"
                      onClick={alternar}
                      aria-label="Ações"
                      className="rounded-lg p-1.5 text-texto-fraco hover:bg-superficie-3 hover:text-texto"
                    >
                      <MoreHorizontal size={16} />
                    </button>
                  )}
                >
                  {(fechar) => (
                    <>
                      <ItemMenu
                        aoClicar={() => {
                          fechar()
                          setModal({ aberto: true, funcionario })
                        }}
                      >
                        <Pencil size={14} /> Editar
                      </ItemMenu>
                      <ItemMenu
                        perigo
                        aoClicar={() => {
                          fechar()
                          remover(funcionario)
                        }}
                      >
                        <Trash2 size={14} /> Remover
                      </ItemMenu>
                    </>
                  )}
                </Popover>
              </li>
            ))}
          </ul>
        )}
      </Cartao>

      <p className="flex items-center gap-2 text-[11px] text-texto-fraco">
        <UserRound size={12} />
        Guardamos apenas nome, cargo e valores. Não registre CPF ou dados sensíveis desnecessários.
      </p>

      <ModalFuncionario
        aberto={modal.aberto}
        aoFechar={() => setModal({ aberto: false })}
        empresaId={empresa.id}
        funcionario={modal.funcionario}
      />
    </div>
  )
}
