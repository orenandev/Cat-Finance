import { Archive, ArchiveRestore, Pencil, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Botao } from '@/componentes/ui/Botao'
import { Campo } from '@/componentes/ui/Campo'
import { Cartao } from '@/componentes/ui/Cartao'
import { Modal } from '@/componentes/ui/Modal'
import { useExcluirEmpresa, useSalvarEmpresa } from '@/consultas/empresas'
import { useAcoes } from '@/contextos/AcoesContexto'
import { useNotificacoes } from '@/contextos/NotificacoesContexto'
import { formatarMoeda, formatarPercentual } from '@/lib/formatacao'
import type { Empresa } from '@/tipos/dominio'

function Linha({ rotulo, valor }: { rotulo: string; valor: string }) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-borda py-2.5 text-sm last:border-b-0">
      <dt className="text-texto-suave">{rotulo}</dt>
      <dd className="truncate text-right font-medium">{valor}</dd>
    </div>
  )
}

export function AbaAjustes({ empresa }: { empresa: Empresa }) {
  const acoes = useAcoes()
  const navegar = useNavigate()
  const notificacoes = useNotificacoes()
  const salvar = useSalvarEmpresa()
  const excluir = useExcluirEmpresa()
  const [confirmandoExclusao, setConfirmandoExclusao] = useState(false)
  const [nomeDigitado, setNomeDigitado] = useState('')

  function alternarArquivamento() {
    salvar.mutate(
      { id: empresa.id, arquivada: !empresa.arquivada },
      {
        onSuccess: () =>
          notificacoes.sucesso(empresa.arquivada ? 'Empresa restaurada.' : 'Empresa arquivada. Ela some do menu, mas o histórico continua.'),
      },
    )
  }

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Cartao
        titulo="Dados"
        acao={
          <Botao variante="secundaria" tamanho="sm" icone={Pencil} onClick={() => acoes.editarEmpresa(empresa)}>
            Editar
          </Botao>
        }
      >
        <dl>
          <Linha rotulo="Nome" valor={empresa.nome} />
          <Linha rotulo="Tipo" valor={empresa.tipo === 'empresa' ? 'Empresa' : 'Trabalho'} />
          <Linha rotulo="Sua participação" valor={formatarPercentual(Number(empresa.participacao))} />
          <Linha rotulo="Meta mensal" valor={empresa.meta_mensal ? formatarMoeda(Number(empresa.meta_mensal)) : '—'} />
          {empresa.tipo === 'empresa' && <Linha rotulo="CNPJ" valor={empresa.documento || '—'} />}
        </dl>
        {empresa.descricao && <p className="mt-3 text-xs text-texto-suave">{empresa.descricao}</p>}
      </Cartao>

      <div className="flex flex-col gap-4">
        <Cartao titulo={empresa.arquivada ? 'Restaurar' : 'Arquivar'}>
          <p className="text-[13px] text-texto-suave">
            {empresa.arquivada
              ? 'Traga a empresa de volta para o menu e para os novos lançamentos.'
              : 'Esconde do menu lateral e dos formulários, mantendo lançamentos e relatórios.'}
          </p>
          <Botao
            variante="secundaria"
            icone={empresa.arquivada ? ArchiveRestore : Archive}
            className="mt-4"
            carregando={salvar.isPending}
            onClick={alternarArquivamento}
          >
            {empresa.arquivada ? 'Restaurar empresa' : 'Arquivar empresa'}
          </Botao>
        </Cartao>

        <Cartao titulo="Zona de perigo" className="border-despesa/30">
          <p className="text-[13px] text-texto-suave">
            Excluir apaga a empresa, todos os lançamentos, custos fixos, equipe e folhas dela. Não dá para desfazer.
          </p>
          <Botao variante="perigo" icone={Trash2} className="mt-4" onClick={() => setConfirmandoExclusao(true)}>
            Excluir definitivamente
          </Botao>
        </Cartao>
      </div>

      <Modal
        aberto={confirmandoExclusao}
        aoFechar={() => {
          setConfirmandoExclusao(false)
          setNomeDigitado('')
        }}
        titulo={`Excluir ${empresa.nome}?`}
        descricao="Essa ação é permanente."
        largura="sm"
        rodape={
          <>
            <Botao variante="secundaria" onClick={() => setConfirmandoExclusao(false)}>
              Cancelar
            </Botao>
            <Botao
              variante="perigo"
              disabled={nomeDigitado.trim() !== empresa.nome.trim()}
              carregando={excluir.isPending}
              onClick={() =>
                excluir.mutate(empresa.id, {
                  onSuccess: () => {
                    setConfirmandoExclusao(false)
                    navegar('/', { replace: true })
                  },
                })
              }
            >
              Excluir
            </Botao>
          </>
        }
      >
        <Campo
          rotulo={`Digite "${empresa.nome}" para confirmar`}
          value={nomeDigitado}
          onChange={(evento) => setNomeDigitado(evento.target.value)}
          autoComplete="off"
        />
      </Modal>
    </div>
  )
}
