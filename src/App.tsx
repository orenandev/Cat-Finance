import { lazy, Suspense } from 'react'
import { createBrowserRouter, Outlet, RouterProvider } from 'react-router-dom'
import { AvisoArmazenamento } from '@/componentes/layout/AvisoArmazenamento'
import { LayoutAplicacao } from '@/componentes/layout/LayoutAplicacao'
import { RotaProtegida, RotaVisitante } from '@/componentes/layout/RotaProtegida'
import { CarregandoTela } from '@/componentes/ui/Diversos'

const Entrar = lazy(() => import('@/paginas/autenticacao/Entrar'))
const CriarConta = lazy(() => import('@/paginas/autenticacao/CriarConta'))
const VisaoGeral = lazy(() => import('@/paginas/VisaoGeral'))
const Pessoal = lazy(() => import('@/paginas/Pessoal'))
const PaginaEmpresa = lazy(() => import('@/paginas/empresa/PaginaEmpresa'))
const Recorrencias = lazy(() => import('@/paginas/Recorrencias'))
const Integracoes = lazy(() => import('@/paginas/integracoes/Integracoes'))
const Configuracoes = lazy(() => import('@/paginas/configuracoes/Configuracoes'))
const Privacidade = lazy(() => import('@/paginas/legal/Privacidade'))
const Termos = lazy(() => import('@/paginas/legal/Termos'))
const NaoEncontrada = lazy(() => import('@/paginas/NaoEncontrada'))

function Raiz() {
  return (
    <Suspense fallback={<CarregandoTela />}>
      <Outlet />
      <AvisoArmazenamento />
    </Suspense>
  )
}

const roteador = createBrowserRouter([
  {
    element: <Raiz />,
    children: [
      {
        element: <RotaVisitante />,
        children: [
          { path: '/entrar', element: <Entrar /> },
          { path: '/criar-conta', element: <CriarConta /> },
        ],
      },
      { path: '/privacidade', element: <Privacidade /> },
      { path: '/termos', element: <Termos /> },
      {
        element: <RotaProtegida />,
        children: [
          {
            element: <LayoutAplicacao />,
            children: [
              { index: true, element: <VisaoGeral /> },
              { path: '/pessoal', element: <Pessoal /> },
              { path: '/empresas/:id', element: <PaginaEmpresa /> },
              { path: '/recorrencias', element: <Recorrencias /> },
              { path: '/integracoes', element: <Integracoes /> },
              { path: '/configuracoes', element: <Configuracoes /> },
            ],
          },
        ],
      },
      { path: '*', element: <NaoEncontrada /> },
    ],
  },
])

export default function App() {
  return <RouterProvider router={roteador} />
}
