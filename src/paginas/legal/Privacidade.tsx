import { marca } from '@/config/marca'
import { LayoutLegal } from './LayoutLegal'

export default function Privacidade() {
  return (
    <LayoutLegal
      titulo="Política de Privacidade"
      resumo={`Em resumo: o ${marca.nome} coleta só o necessário para você controlar suas finanças, não vende seus dados, não exibe anúncios e permite que você exporte ou apague tudo a qualquer momento, conforme a Lei Geral de Proteção de Dados (Lei nº 13.709/2018).`}
      secoes={[
        {
          id: 'controlador',
          titulo: '1. Quem somos',
          conteudo: (
            <p>
              O {marca.controlador} é o controlador dos dados pessoais tratados nesta plataforma. Dúvidas, solicitações e
              reclamações sobre privacidade podem ser enviadas ao nosso encarregado pelo e-mail{' '}
              <a className="text-primaria-texto underline" href={`mailto:${marca.emailPrivacidade}`}>
                {marca.emailPrivacidade}
              </a>
              .
            </p>
          ),
        },
        {
          id: 'dados',
          titulo: '2. Quais dados coletamos',
          conteudo: (
            <ul>
              <li>
                <strong>Cadastro:</strong> nome, e-mail e senha (armazenada apenas como hash criptográfico).
              </li>
              <li>
                <strong>Dados financeiros que você informa:</strong> lançamentos, categorias, empresas, recorrências,
                integrantes de equipe (nome, cargo e valores) e folhas de pagamento.
              </li>
              <li>
                <strong>Integrações:</strong> nome das chaves de API, permissões, data de último uso e registro técnico das
                requisições (método, rota, status e horário), mantido por até 90 dias.
              </li>
              <li>
                <strong>Dados técnicos:</strong> registros de acesso exigidos pelo Marco Civil da Internet (Lei nº
                12.965/2014), como endereço IP e data/hora, guardados pelos nossos provedores de infraestrutura.
              </li>
            </ul>
          ),
        },
        {
          id: 'finalidades',
          titulo: '3. Para que usamos e bases legais',
          conteudo: (
            <ul>
              <li>
                <strong>Prestar o serviço</strong> (exibir relatórios, gerar recorrências e folhas, autenticar você) —
                execução de contrato (art. 7º, V).
              </li>
              <li>
                <strong>Segurança e prevenção a fraudes</strong> (limites de requisição, detecção de abuso) — legítimo
                interesse (art. 7º, IX) e proteção do crédito.
              </li>
              <li>
                <strong>Cumprir obrigações legais</strong>, como guarda de registros de acesso — obrigação legal (art. 7º,
                II).
              </li>
            </ul>
          ),
        },
        {
          id: 'compartilhamento',
          titulo: '4. Com quem compartilhamos',
          conteudo: (
            <>
              <p>Não vendemos nem alugamos dados pessoais. Compartilhamos apenas com operadores essenciais:</p>
              <ul>
                <li>
                  <strong>Supabase</strong> — banco de dados, autenticação e funções, com servidores na região de São Paulo.
                </li>
                <li>
                  <strong>Vercel</strong> — hospedagem da aplicação web.
                </li>
              </ul>
              <p>
                Alguns desses operadores podem processar dados fora do Brasil. Nesses casos, exigimos garantias adequadas
                nos termos do art. 33 da LGPD, como cláusulas contratuais padrão.
              </p>
            </>
          ),
        },
        {
          id: 'seguranca',
          titulo: '5. Como protegemos',
          conteudo: (
            <ul>
              <li>Isolamento por conta com Row Level Security: cada registro só pode ser lido pelo próprio dono.</li>
              <li>Tráfego sempre criptografado (HTTPS/TLS) e cabeçalhos de segurança rígidos no navegador.</li>
              <li>Chaves de API guardadas apenas como hash SHA-256, com escopos, expiração e revogação imediata.</li>
              <li>Limites de requisição e senhas com requisitos mínimos de segurança.</li>
            </ul>
          ),
        },
        {
          id: 'retencao',
          titulo: '6. Por quanto tempo guardamos',
          conteudo: (
            <p>
              Mantemos seus dados enquanto sua conta estiver ativa. Ao excluir a conta, todos os dados financeiros são
              apagados imediatamente de forma irreversível. Registros de acesso podem ser mantidos pelo prazo de 6 meses
              exigido pelo Marco Civil da Internet, e cópias de segurança são sobrescritas em ciclos de até 30 dias.
            </p>
          ),
        },
        {
          id: 'direitos',
          titulo: '7. Seus direitos',
          conteudo: (
            <>
              <p>Conforme o art. 18 da LGPD, você pode, a qualquer momento:</p>
              <ul>
                <li>confirmar a existência de tratamento e acessar seus dados;</li>
                <li>corrigir dados incompletos, inexatos ou desatualizados;</li>
                <li>solicitar anonimização, bloqueio ou eliminação de dados desnecessários;</li>
                <li>
                  obter a portabilidade dos dados — disponível em <strong>Configurações › Exportar meus dados</strong>;
                </li>
                <li>
                  eliminar seus dados — disponível em <strong>Configurações › Excluir conta</strong>;
                </li>
                <li>revogar consentimentos dados anteriormente;</li>
                <li>peticionar à Autoridade Nacional de Proteção de Dados (ANPD).</li>
              </ul>
            </>
          ),
        },
        {
          id: 'cookies',
          titulo: '8. Cookies e armazenamento local',
          conteudo: (
            <p>
              Usamos apenas armazenamento estritamente necessário no seu navegador: a sessão de login, a preferência de tema
              e o período selecionado. Não usamos cookies de publicidade nem ferramentas de rastreamento de terceiros.
            </p>
          ),
        },
        {
          id: 'menores',
          titulo: '9. Crianças e adolescentes',
          conteudo: <p>O serviço é destinado a maiores de 18 anos. Não coletamos intencionalmente dados de menores.</p>,
        },
        {
          id: 'alteracoes',
          titulo: '10. Alterações desta política',
          conteudo: (
            <p>
              Podemos atualizar esta política para refletir melhorias ou exigências legais. Mudanças relevantes serão
              comunicadas por e-mail ou dentro da plataforma com antecedência razoável.
            </p>
          ),
        },
      ]}
    />
  )
}
