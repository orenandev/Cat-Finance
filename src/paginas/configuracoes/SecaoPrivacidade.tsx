import { Download, FileText, ShieldCheck, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Botao } from '@/componentes/ui/Botao'
import { Campo } from '@/componentes/ui/Campo'
import { Cartao } from '@/componentes/ui/Cartao'
import { Modal } from '@/componentes/ui/Modal'
import { marca } from '@/config/marca'
import { useNotificacoes } from '@/contextos/NotificacoesContexto'
import { useSessao } from '@/contextos/SessaoContexto'
import { mensagemErro } from '@/lib/erros'
import { hojeIso } from '@/lib/formatacao'
import { supabase } from '@/lib/supabase'

const FRASE_CONFIRMACAO = 'EXCLUIR MINHA CONTA'

export function SecaoPrivacidade() {
  const { sair } = useSessao()
  const notificacoes = useNotificacoes()
  const [exportando, setExportando] = useState(false)
  const [modalExclusao, setModalExclusao] = useState(false)
  const [frase, setFrase] = useState('')
  const [excluindo, setExcluindo] = useState(false)
  const [erroExclusao, setErroExclusao] = useState<string | null>(null)

  async function exportar() {
    setExportando(true)
    const { data, error } = await supabase.rpc('exportar_dados')
    setExportando(false)
    if (error) {
      notificacoes.erro(mensagemErro(error))
      return
    }
    const arquivo = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(arquivo)
    const link = document.createElement('a')
    link.href = url
    link.download = `catfinance-meus-dados-${hojeIso()}.json`
    link.click()
    URL.revokeObjectURL(url)
    notificacoes.sucesso('Exportação concluída.')
  }

  async function excluirConta() {
    setExcluindo(true)
    setErroExclusao(null)
    const { error } = await supabase.functions.invoke('excluir-conta', { body: { confirmacao: frase } })
    setExcluindo(false)
    if (error) {
      const corpo = await (error as { context?: Response }).context?.json?.().catch(() => null)
      setErroExclusao(corpo?.erro ?? 'Não foi possível excluir a conta agora.')
      return
    }
    await sair()
    notificacoes.info('Sua conta e todos os dados foram excluídos. Até a próxima!')
  }

  return (
    <Cartao titulo="Privacidade e dados (LGPD)" descricao="Você é dono dos seus dados. Exporte ou apague quando quiser.">
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-[13px] font-medium">Portabilidade</p>
            <p className="text-xs text-texto-suave">Baixe um arquivo JSON com todas as suas informações (art. 18, V da LGPD).</p>
          </div>
          <Botao variante="secundaria" icone={Download} carregando={exportando} onClick={exportar}>
            Exportar meus dados
          </Botao>
        </div>

        <div className="flex flex-wrap gap-2 text-xs">
          <Link to="/privacidade" target="_blank" className="flex items-center gap-1.5 rounded-lg border border-borda px-3 py-2 hover:bg-superficie-2">
            <ShieldCheck size={13} /> Política de privacidade
          </Link>
          <Link to="/termos" target="_blank" className="flex items-center gap-1.5 rounded-lg border border-borda px-3 py-2 hover:bg-superficie-2">
            <FileText size={13} /> Termos de uso
          </Link>
          <a href={`mailto:${marca.emailPrivacidade}`} className="flex items-center gap-1.5 rounded-lg border border-borda px-3 py-2 hover:bg-superficie-2">
            Falar com o encarregado (DPO)
          </a>
        </div>

        <div className="flex flex-col gap-3 rounded-xl border border-despesa/30 bg-despesa-suave/40 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-[13px] font-medium text-despesa">Excluir conta</p>
            <p className="text-xs text-texto-suave">Apaga permanentemente sua conta, empresas, lançamentos e chaves de API.</p>
          </div>
          <Botao variante="perigo" icone={Trash2} onClick={() => setModalExclusao(true)}>
            Excluir conta
          </Botao>
        </div>
      </div>

      <Modal
        aberto={modalExclusao}
        aoFechar={() => {
          setModalExclusao(false)
          setFrase('')
          setErroExclusao(null)
        }}
        titulo="Excluir sua conta?"
        descricao="Todos os dados serão apagados de forma irreversível."
        largura="sm"
        rodape={
          <>
            <Botao variante="secundaria" onClick={() => setModalExclusao(false)}>
              Cancelar
            </Botao>
            <Botao variante="perigo" disabled={frase !== FRASE_CONFIRMACAO} carregando={excluindo} onClick={excluirConta}>
              Excluir para sempre
            </Botao>
          </>
        }
      >
        <div className="flex flex-col gap-3">
          <p className="text-[13px] text-texto-suave">
            Recomendamos exportar seus dados antes. Por segurança, é preciso ter entrado nas últimas 12 horas.
          </p>
          <Campo
            rotulo={`Digite ${FRASE_CONFIRMACAO} para confirmar`}
            value={frase}
            onChange={(evento) => setFrase(evento.target.value)}
            autoComplete="off"
            erro={erroExclusao}
          />
        </div>
      </Modal>
    </Cartao>
  )
}
