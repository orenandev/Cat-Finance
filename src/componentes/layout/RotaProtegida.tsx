import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { CarregandoTela } from '@/componentes/ui/Diversos'
import { useSessao } from '@/contextos/SessaoContexto'

export function RotaProtegida() {
  const { sessao, carregando } = useSessao()
  const local = useLocation()

  if (carregando) return <CarregandoTela />
  if (!sessao) return <Navigate to="/entrar" replace state={{ de: local.pathname }} />
  return <Outlet />
}

export function RotaVisitante() {
  const { sessao, carregando } = useSessao()
  if (carregando) return <CarregandoTela />
  if (sessao) return <Navigate to="/" replace />
  return <Outlet />
}
