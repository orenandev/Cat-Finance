import {
  ArrowLeftRight,
  LayoutGrid,
  LogOut,
  Moon,
  Plug,
  Plus,
  Settings,
  Sun,
  User,
  type LucideIcon,
} from 'lucide-react'
import { NavLink } from 'react-router-dom'
import { Avatar, Esqueleto, IconeEmpresa, Logo } from '@/componentes/ui/Diversos'
import { ItemMenu, Popover } from '@/componentes/ui/Popover'
import { marca } from '@/config/marca'
import { useEmpresas } from '@/consultas/empresas'
import { usePerfil } from '@/consultas/perfil'
import { useAcoes } from '@/contextos/AcoesContexto'
import { useSessao } from '@/contextos/SessaoContexto'
import { useTema } from '@/contextos/TemaContexto'
import { cx } from '@/lib/classes'

function ItemNavegacao({ para, icone: Icone, rotulo, fim }: { para: string; icone: LucideIcon; rotulo: string; fim?: boolean }) {
  return (
    <NavLink
      to={para}
      end={fim}
      className={({ isActive }) =>
        cx(
          'flex h-9 items-center gap-2.5 rounded-lg px-2.5 text-[13px] transition-colors',
          isActive ? 'bg-superficie-3 font-medium text-texto' : 'text-texto-suave hover:bg-superficie-3/60 hover:text-texto',
        )
      }
    >
      <Icone size={16} strokeWidth={1.9} />
      {rotulo}
    </NavLink>
  )
}

export function BarraLateral() {
  const { data: empresas, isPending } = useEmpresas()
  const { data: perfil } = usePerfil()
  const { usuario, sair } = useSessao()
  const { escuro, alternar } = useTema()
  const acoes = useAcoes()
  const ativas = (empresas ?? []).filter((empresa) => !empresa.arquivada)
  const nomeExibicao = perfil?.nome || usuario?.email || ''

  return (
    <div className="flex h-full flex-col bg-lateral">
      <div className="flex h-16 items-center gap-2.5 px-4">
        <Logo tamanho={30} />
        <span className="text-[15px] font-semibold tracking-tight">{marca.nome}</span>
        <span className="ml-auto h-2 w-2 rounded-full bg-receita" title="Sincronizado" />
      </div>

      <nav className="flex flex-1 flex-col gap-0.5 overflow-y-auto px-3 pb-3">
        <ItemNavegacao para="/" icone={LayoutGrid} rotulo="Visão geral" fim />
        <ItemNavegacao para="/pessoal" icone={User} rotulo="Pessoal" />

        <div className="mt-6 mb-1.5 flex items-center justify-between px-2.5">
          <span className="text-[10.5px] font-semibold tracking-[0.06em] text-texto-fraco uppercase">Empresas e trabalhos</span>
          <button
            type="button"
            onClick={acoes.novaEmpresa}
            aria-label="Nova empresa ou trabalho"
            className="rounded-md p-0.5 text-texto-fraco hover:bg-superficie-3 hover:text-texto"
          >
            <Plus size={14} />
          </button>
        </div>

        {isPending ? (
          <div className="flex flex-col gap-2 px-2.5 py-1">
            <Esqueleto className="h-6" />
            <Esqueleto className="h-6 w-3/4" />
          </div>
        ) : (
          ativas.map((empresa) => (
            <NavLink
              key={empresa.id}
              to={`/empresas/${empresa.id}`}
              className={({ isActive }) =>
                cx(
                  'flex h-9 items-center gap-2.5 rounded-lg px-2.5 text-[13px] transition-colors',
                  isActive ? 'bg-superficie-3 font-medium text-texto' : 'text-texto-suave hover:bg-superficie-3/60 hover:text-texto',
                )
              }
            >
              <IconeEmpresa cor={empresa.cor} icone={empresa.icone} tamanho="sm" />
              <span className="truncate">{empresa.nome}</span>
            </NavLink>
          ))
        )}

        <button
          type="button"
          onClick={acoes.novaEmpresa}
          className="mt-1 flex h-9 items-center gap-2.5 rounded-lg border border-borda px-2.5 text-[13px] text-texto-suave transition-colors hover:border-borda-forte hover:text-texto"
        >
          <Plus size={15} />
          Nova empresa/trabalho
        </button>

        <div className="mt-auto flex flex-col gap-0.5 pt-6">
          <ItemNavegacao para="/recorrencias" icone={ArrowLeftRight} rotulo="Recorrências" />
          <ItemNavegacao para="/integracoes" icone={Plug} rotulo="Integrações" />
          <ItemNavegacao para="/configuracoes" icone={Settings} rotulo="Configurações" />
        </div>
      </nav>

      <div className="flex items-center gap-2 border-t border-borda px-3 py-3">
        <Popover
          alinhamento="inicio"
          lado="cima"
          className="w-56"
          gatilho={({ alternar: alternarMenu }) => (
            <button
              type="button"
              onClick={alternarMenu}
              className="flex min-w-0 items-center gap-2 rounded-lg p-1 text-left hover:bg-superficie-3"
            >
              <Avatar nome={nomeExibicao} url={perfil?.avatar_url} tamanho={26} />
              <span className="truncate text-xs text-texto-suave">@{perfil?.usuario ?? '…'}</span>
            </button>
          )}
        >
          {(fechar) => (
            <>
              <div className="border-b border-borda px-3 py-2">
                <p className="truncate text-[13px] font-medium">{nomeExibicao}</p>
                <p className="truncate text-xs text-texto-fraco">{usuario?.email}</p>
              </div>
              <div className="pt-1">
                <ItemMenu
                  perigo
                  aoClicar={() => {
                    fechar()
                    sair()
                  }}
                >
                  <LogOut size={14} />
                  Sair
                </ItemMenu>
              </div>
            </>
          )}
        </Popover>

        <button
          type="button"
          onClick={alternar}
          className="ml-auto flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-xs text-texto-suave hover:bg-superficie-3 hover:text-texto"
          aria-label={escuro ? 'Ativar tema claro' : 'Ativar tema escuro'}
        >
          {escuro ? <Moon size={14} /> : <Sun size={14} />}
          {escuro ? 'Escuro' : 'Claro'}
        </button>
      </div>
    </div>
  )
}
