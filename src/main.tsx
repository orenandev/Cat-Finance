import { QueryClientProvider } from '@tanstack/react-query'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import { ProvedorConfirmacao } from './contextos/ConfirmacaoContexto'
import { ProvedorNotificacoes } from './contextos/NotificacoesContexto'
import { ProvedorSessao } from './contextos/SessaoContexto'
import { ProvedorTema } from './contextos/TemaContexto'
import { clienteConsultas } from './lib/clienteConsultas'
import './index.css'

const raiz = document.getElementById('root')
if (!raiz) throw new Error('Elemento #root não encontrado')

createRoot(raiz).render(
  <StrictMode>
    <QueryClientProvider client={clienteConsultas}>
      <ProvedorTema>
        <ProvedorNotificacoes>
          <ProvedorSessao>
            <ProvedorConfirmacao>
              <App />
            </ProvedorConfirmacao>
          </ProvedorSessao>
        </ProvedorNotificacoes>
      </ProvedorTema>
    </QueryClientProvider>
  </StrictMode>,
)
