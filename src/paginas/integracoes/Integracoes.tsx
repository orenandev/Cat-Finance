import { Activity, Ban, BookOpen, Bot, Code2, KeyRound, Plus, Terminal, Trash2 } from 'lucide-react'
import { useMemo, useState } from 'react'
import { CabecalhoPagina } from '@/componentes/layout/CabecalhoPagina'
import { Segmentado } from '@/componentes/ui/Abas'
import { BlocoCodigo } from '@/componentes/ui/BlocoCodigo'
import { Botao } from '@/componentes/ui/Botao'
import { Cartao } from '@/componentes/ui/Cartao'
import { Distintivo, EstadoVazio, Esqueleto } from '@/componentes/ui/Diversos'
import { useEmpresas } from '@/consultas/empresas'
import { useChavesApi, useExcluirChaveApi, useRegistrosApi, useRevogarChaveApi } from '@/consultas/integracoes'
import { useConfirmacao } from '@/contextos/ConfirmacaoContexto'
import { cx } from '@/lib/classes'
import { formatarData, formatarRelativo } from '@/lib/formatacao'
import { rotulosEscopo } from '@/lib/rotulos'
import { urlFuncoes } from '@/lib/supabase'
import type { ChaveApi } from '@/tipos/dominio'
import { gerarExemplos, type LinguagemExemplo, rotas } from './exemplos'
import { ModalNovaChave } from './ModalNovaChave'

function situacao(chave: ChaveApi) {
  if (chave.revogada_em) return { rotulo: 'Revogada', tom: 'despesa' as const }
  if (chave.expira_em && new Date(chave.expira_em) < new Date()) return { rotulo: 'Expirada', tom: 'alerta' as const }
  return { rotulo: 'Ativa', tom: 'receita' as const }
}

const coresMetodo: Record<string, string> = {
  GET: 'bg-receita-suave text-receita',
  POST: 'bg-primaria-suave text-primaria-texto',
  DELETE: 'bg-despesa-suave text-despesa',
}

export default function Integracoes() {
  const { data: chaves = [], isPending } = useChavesApi()
  const { data: registros = [], isPending: carregandoRegistros } = useRegistrosApi()
  const { data: empresas = [] } = useEmpresas()
  const revogar = useRevogarChaveApi()
  const excluir = useExcluirChaveApi()
  const confirmar = useConfirmacao()
  const [modalAberto, setModalAberto] = useState(false)
  const [linguagem, setLinguagem] = useState<LinguagemExemplo>('curl')

  const urlBase = `${urlFuncoes}/api/v1`
  const exemplos = useMemo(() => gerarExemplos(urlBase), [urlBase])
  const nomesChaves = useMemo(() => new Map(chaves.map((chave) => [chave.id, chave.nome])), [chaves])

  async function confirmarRevogacao(chave: ChaveApi) {
    const confirmado = await confirmar({
      titulo: `Revogar "${chave.nome}"?`,
      descricao: 'Qualquer bot ou automação usando esta chave para de funcionar imediatamente.',
      confirmar: 'Revogar',
      perigo: true,
    })
    if (confirmado) revogar.mutate(chave.id)
  }

  async function confirmarExclusao(chave: ChaveApi) {
    const confirmado = await confirmar({
      titulo: `Excluir "${chave.nome}"?`,
      descricao: 'A chave e o vínculo com o histórico de uso serão removidos.',
      confirmar: 'Excluir',
      perigo: true,
    })
    if (confirmado) excluir.mutate(chave.id)
  }

  return (
    <>
      <CabecalhoPagina
        titulo="Integrações"
        descricao="Conecte bots, atalhos e automações ao Catfinance com chaves de API."
        acoes={
          <Botao tamanho="sm" icone={Plus} onClick={() => setModalAberto(true)}>
            Nova chave
          </Botao>
        }
      />

      <Cartao titulo="Chaves de API" descricao="Até 10 chaves ativas. Limite de 60 requisições por minuto por chave." semPreenchimento className="overflow-hidden">
        {isPending ? (
          <Esqueleto className="m-5 h-24" />
        ) : chaves.length === 0 ? (
          <EstadoVazio
            icone={KeyRound}
            titulo="Nenhuma chave criada"
            descricao="Gere uma chave para registrar gastos pelo Discord, WhatsApp, Telegram, Atalhos do iPhone ou qualquer sistema."
            acao={
              <Botao tamanho="sm" icone={Plus} onClick={() => setModalAberto(true)}>
                Gerar primeira chave
              </Botao>
            }
          />
        ) : (
          <ul className="border-t border-borda">
            {chaves.map((chave) => {
              const estado = situacao(chave)
              const empresaPadrao = empresas.find((empresa) => empresa.id === chave.empresa_padrao_id)
              return (
                <li key={chave.id} className="flex flex-col gap-3 border-b border-borda px-4 py-3.5 last:border-b-0 sm:flex-row sm:items-center sm:px-5">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-[13px] font-medium">{chave.nome}</span>
                      <Distintivo tom={estado.tom}>{estado.rotulo}</Distintivo>
                    </div>
                    <code className="mt-1 block font-mono text-[11px] text-texto-fraco">cat_live_{chave.prefixo}_••••••••</code>
                    <div className="mt-1.5 flex flex-wrap gap-1">
                      {chave.escopos.map((escopo) => (
                        <Distintivo key={escopo}>{rotulosEscopo[escopo].titulo}</Distintivo>
                      ))}
                    </div>
                  </div>
                  <div className="text-[11px] text-texto-fraco sm:text-right">
                    <p>{chave.ultimo_uso_em ? `Usada ${formatarRelativo(chave.ultimo_uso_em)}` : 'Nunca usada'}</p>
                    <p>{chave.expira_em ? `Expira em ${formatarData(chave.expira_em.slice(0, 10))}` : 'Sem expiração'}</p>
                    <p>Padrão: {empresaPadrao?.nome ?? 'Pessoal'}</p>
                  </div>
                  <div className="flex gap-2">
                    {!chave.revogada_em && (
                      <Botao variante="secundaria" tamanho="sm" icone={Ban} onClick={() => confirmarRevogacao(chave)}>
                        Revogar
                      </Botao>
                    )}
                    <Botao variante="fantasma" tamanho="icone" aria-label="Excluir chave" onClick={() => confirmarExclusao(chave)}>
                      <Trash2 size={15} />
                    </Botao>
                  </div>
                </li>
              )
            })}
          </ul>
        )}
      </Cartao>

      <div className="mt-4 grid gap-4 xl:grid-cols-[minmax(0,1fr)_320px]">
        <Cartao
          titulo={
            <span className="flex items-center gap-2">
              <BookOpen size={15} /> Como usar
            </span>
          }
          descricao="Envie a chave no cabeçalho x-api-key. Todas as respostas são JSON."
        >
          <div className="mb-4 flex items-center gap-2 overflow-x-auto rounded-xl border border-borda bg-superficie-2 px-3 py-2">
            <span className="text-[11px] font-medium text-texto-suave">Base</span>
            <code className="font-mono text-[11px] whitespace-nowrap text-texto">{urlBase}</code>
          </div>

          <ul className="mb-5 flex flex-col gap-1.5">
            {rotas.map((rota) => (
              <li key={`${rota.metodo}${rota.caminho}`} className="flex flex-wrap items-center gap-2 text-xs">
                <span className={cx('w-14 rounded-md py-0.5 text-center font-mono text-[10px] font-semibold', coresMetodo[rota.metodo])}>
                  {rota.metodo}
                </span>
                <code className="font-mono text-texto">{rota.caminho}</code>
                <span className="text-texto-fraco">— {rota.descricao}</span>
              </li>
            ))}
          </ul>

          <div className="mb-3">
            <Segmentado
              rotulo="Exemplo"
              ativo={linguagem}
              aoMudar={setLinguagem}
              opcoes={[
                { valor: 'curl', rotulo: 'cURL' },
                { valor: 'javascript', rotulo: 'JavaScript' },
                { valor: 'discord', rotulo: 'Bot Discord' },
              ]}
            />
          </div>
          <BlocoCodigo codigo={exemplos[linguagem]} />
          {linguagem === 'discord' && (
            <p className="mt-2 flex items-center gap-1.5 text-[11px] text-texto-fraco">
              <Bot size={12} /> Usa Components V2 do discord.js (v14.19+). Registre o comando /gasto com uma opção de texto obrigatória.
            </p>
          )}
          {linguagem === 'curl' && (
            <p className="mt-2 flex items-center gap-1.5 text-[11px] text-texto-fraco">
              <Terminal size={12} /> Use #nome-da-empresa no texto para lançar direto numa empresa.
            </p>
          )}
          {linguagem === 'javascript' && (
            <p className="mt-2 flex items-center gap-1.5 text-[11px] text-texto-fraco">
              <Code2 size={12} /> Nunca exponha a chave no navegador. Use em servidores, bots ou funções.
            </p>
          )}
        </Cartao>

        <Cartao
          titulo={
            <span className="flex items-center gap-2">
              <Activity size={15} /> Atividade recente
            </span>
          }
          className="h-fit"
        >
          {carregandoRegistros ? (
            <Esqueleto className="h-40" />
          ) : registros.length === 0 ? (
            <p className="text-xs text-texto-fraco">Nenhuma requisição registrada ainda.</p>
          ) : (
            <ul className="flex flex-col gap-2.5">
              {registros.map((registro) => (
                <li key={registro.id} className="flex items-center gap-2 text-[11px]">
                  <span
                    className={cx(
                      'h-1.5 w-1.5 shrink-0 rounded-full',
                      registro.status < 300 ? 'bg-receita' : registro.status < 500 ? 'bg-alerta' : 'bg-despesa',
                    )}
                  />
                  <span className="font-mono text-texto-suave">{registro.metodo}</span>
                  <span className="min-w-0 flex-1 truncate font-mono">{registro.rota}</span>
                  <span className="shrink-0 text-texto-fraco" title={registro.chave_id ? nomesChaves.get(registro.chave_id) : undefined}>
                    {formatarRelativo(registro.criado_em)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Cartao>
      </div>

      <ModalNovaChave aberto={modalAberto} aoFechar={() => setModalAberto(false)} />
    </>
  )
}
