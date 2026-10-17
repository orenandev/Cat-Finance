import { Link } from 'react-router-dom'
import { marca } from '@/config/marca'
import { LayoutLegal } from './LayoutLegal'

export default function Termos() {
  return (
    <LayoutLegal
      titulo="Termos de Uso"
      resumo={`Ao criar uma conta no ${marca.nome}, você concorda com estes termos. O ${marca.nome} é uma ferramenta de organização financeira: ele não movimenta dinheiro, não é instituição financeira e não oferece consultoria de investimentos, contábil ou jurídica.`}
      secoes={[
        {
          id: 'servico',
          titulo: '1. O serviço',
          conteudo: (
            <p>
              O {marca.nome} permite registrar receitas e despesas pessoais e de empresas, controlar custos fixos, equipe,
              folhas de pagamento e recorrências, e integrar sistemas externos por meio de API. As informações exibidas
              dependem exclusivamente dos dados que você cadastra.
            </p>
          ),
        },
        {
          id: 'conta',
          titulo: '2. Sua conta',
          conteudo: (
            <ul>
              <li>Você deve ter 18 anos ou mais e fornecer informações verdadeiras.</li>
              <li>Você é responsável por manter sua senha e suas chaves de API em sigilo.</li>
              <li>Avise-nos imediatamente se suspeitar de acesso não autorizado à sua conta.</li>
              <li>Uma conta é pessoal e intransferível, mas pode reunir quantas empresas e trabalhos você quiser.</li>
            </ul>
          ),
        },
        {
          id: 'uso',
          titulo: '3. Uso aceitável',
          conteudo: (
            <>
              <p>É proibido:</p>
              <ul>
                <li>tentar acessar dados de outros usuários ou burlar mecanismos de segurança;</li>
                <li>sobrecarregar a API de forma abusiva ou contornar os limites de requisição;</li>
                <li>usar a plataforma para atividades ilícitas, lavagem de dinheiro ou fraude;</li>
                <li>cadastrar dados pessoais sensíveis de terceiros sem base legal adequada.</li>
              </ul>
            </>
          ),
        },
        {
          id: 'terceiros',
          titulo: '4. Dados de terceiros',
          conteudo: (
            <p>
              Ao cadastrar integrantes da sua equipe, você atua como controlador desses dados e declara possuir base legal
              para tratá-los. Recomendamos registrar apenas o necessário — nome, cargo e valores.
            </p>
          ),
        },
        {
          id: 'api',
          titulo: '5. API e integrações',
          conteudo: (
            <p>
              As chaves de API são de sua responsabilidade. Lançamentos criados por uma chave válida são considerados feitos
              por você. Podemos alterar limites e rotas da API com aviso prévio, preservando a compatibilidade sempre que
              possível.
            </p>
          ),
        },
        {
          id: 'responsabilidade',
          titulo: '6. Limitação de responsabilidade',
          conteudo: (
            <p>
              Empregamos as melhores práticas para manter o serviço disponível e seguro, mas ele é oferecido no estado em
              que se encontra. Os relatórios têm caráter informativo e não substituem orientação contábil, fiscal ou
              trabalhista profissional — especialmente quanto a encargos e obrigações da folha de pagamento.
            </p>
          ),
        },
        {
          id: 'encerramento',
          titulo: '7. Encerramento',
          conteudo: (
            <p>
              Você pode excluir sua conta a qualquer momento em Configurações. Podemos suspender contas que violem estes
              termos, comunicando o motivo sempre que possível.
            </p>
          ),
        },
        {
          id: 'privacidade',
          titulo: '8. Privacidade',
          conteudo: (
            <p>
              O tratamento de dados pessoais segue a nossa{' '}
              <Link to="/privacidade" className="text-primaria-texto underline">
                Política de Privacidade
              </Link>
              , elaborada conforme a LGPD.
            </p>
          ),
        },
        {
          id: 'foro',
          titulo: '9. Legislação e foro',
          conteudo: (
            <p>
              Estes termos são regidos pelas leis brasileiras, incluindo o Código de Defesa do Consumidor. Fica eleito o foro
              do domicílio do usuário para dirimir eventuais controvérsias. Contato:{' '}
              <a className="text-primaria-texto underline" href={`mailto:${marca.emailContato}`}>
                {marca.emailContato}
              </a>
              .
            </p>
          ),
        },
      ]}
    />
  )
}
