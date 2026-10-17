import { Plus, X } from 'lucide-react'
import { type FormEvent, useState } from 'react'
import { Segmentado } from '@/componentes/ui/Abas'
import { Botao } from '@/componentes/ui/Botao'
import { Campo } from '@/componentes/ui/Campo'
import { Cartao } from '@/componentes/ui/Cartao'
import { Esqueleto } from '@/componentes/ui/Diversos'
import { ItemMenu, Popover } from '@/componentes/ui/Popover'
import { useCategorias, useExcluirCategoria, useSalvarCategoria } from '@/consultas/categorias'
import { useConfirmacao } from '@/contextos/ConfirmacaoContexto'
import { corHex, nomesCores } from '@/lib/aparencia'
import type { Categoria, TipoLancamento } from '@/tipos/dominio'
import { esquemaCategoria, validarFormulario } from '@/validacao/esquemas'

export function SecaoCategorias() {
  const { data: categorias = [], isPending } = useCategorias()
  const salvar = useSalvarCategoria()
  const excluir = useExcluirCategoria()
  const confirmar = useConfirmacao()
  const [tipo, setTipo] = useState<TipoLancamento>('despesa')
  const [nome, setNome] = useState('')
  const [cor, setCor] = useState('esmeralda')
  const [erro, setErro] = useState<string | null>(null)

  const visiveis = categorias.filter((categoria) => categoria.tipo === tipo)

  function adicionar(evento: FormEvent) {
    evento.preventDefault()
    const validacao = validarFormulario(esquemaCategoria, { nome, tipo, cor })
    if (!validacao.sucesso) {
      setErro(validacao.erros.nome ?? 'Dados inválidos.')
      return
    }
    setErro(null)
    salvar.mutate(validacao.dados, { onSuccess: () => setNome('') })
  }

  async function remover(categoria: Categoria) {
    const confirmado = await confirmar({
      titulo: `Remover "${categoria.nome}"?`,
      descricao: 'Lançamentos com esta categoria ficarão sem categoria. Nada será apagado.',
      confirmar: 'Remover',
      perigo: true,
    })
    if (confirmado) excluir.mutate(categoria.id)
  }

  return (
    <Cartao
      titulo="Categorias"
      descricao="Organize seus lançamentos do seu jeito."
      acao={
        <Segmentado
          rotulo="Tipo"
          ativo={tipo}
          aoMudar={setTipo}
          opcoes={[
            { valor: 'despesa', rotulo: 'Saídas' },
            { valor: 'receita', rotulo: 'Entradas' },
          ]}
        />
      }
    >
      {isPending ? (
        <Esqueleto className="h-24" />
      ) : (
        <ul className="flex flex-wrap gap-2">
          {visiveis.map((categoria) => (
            <li
              key={categoria.id}
              className="group flex items-center gap-1.5 rounded-full border border-borda bg-superficie-2 py-1 pr-1 pl-2.5 text-xs"
            >
              <Popover
                alinhamento="inicio"
                gatilho={({ alternar }) => (
                  <button
                    type="button"
                    onClick={alternar}
                    aria-label={`Mudar cor de ${categoria.nome}`}
                    className="h-2.5 w-2.5 rounded-full"
                    style={{ backgroundColor: corHex(categoria.cor) }}
                  />
                )}
              >
                {(fechar) => (
                  <div className="grid grid-cols-5 gap-1 p-1">
                    {nomesCores.map((opcao) => (
                      <ItemMenu
                        key={opcao}
                        aoClicar={() => {
                          fechar()
                          salvar.mutate({ id: categoria.id, nome: categoria.nome, tipo: categoria.tipo, cor: opcao })
                        }}
                      >
                        <span className="mx-auto h-4 w-4 rounded-full" style={{ backgroundColor: corHex(opcao) }} />
                      </ItemMenu>
                    ))}
                  </div>
                )}
              </Popover>
              <span>{categoria.nome}</span>
              <button
                type="button"
                onClick={() => remover(categoria)}
                aria-label={`Remover ${categoria.nome}`}
                className="rounded-full p-0.5 text-texto-fraco hover:bg-despesa-suave hover:text-despesa"
              >
                <X size={12} />
              </button>
            </li>
          ))}
        </ul>
      )}

      <form onSubmit={adicionar} noValidate className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-start">
        <div className="flex h-11 items-center gap-1.5 rounded-xl border border-borda px-3">
          {nomesCores.slice(0, 6).map((opcao) => (
            <button
              key={opcao}
              type="button"
              aria-label={`Cor ${opcao}`}
              aria-pressed={cor === opcao}
              onClick={() => setCor(opcao)}
              className={`h-4 w-4 rounded-full ${cor === opcao ? 'ring-2 ring-texto ring-offset-2 ring-offset-superficie' : ''}`}
              style={{ backgroundColor: corHex(opcao) }}
            />
          ))}
        </div>
        <Campo
          aria-label="Nome da nova categoria"
          placeholder={tipo === 'despesa' ? 'Nova categoria de saída' : 'Nova categoria de entrada'}
          value={nome}
          onChange={(evento) => setNome(evento.target.value)}
          maxLength={40}
          erro={erro}
          classeMoldura="flex-1"
        />
        <Botao type="submit" icone={Plus} carregando={salvar.isPending} className="h-11">
          Adicionar
        </Botao>
      </form>
    </Cartao>
  )
}
