<div align="center">

<img src="public/logo.png" alt="Catfinance" width="140" />

# 🐱 Catfinance

**Gestão financeira afiada como as garras de um gato.**

Controle pessoal, de empresas e de trabalhos em um só lugar: visão consolidada, folha de pagamento, custos fixos, recorrências automáticas e uma API para registrar gastos direto pelo bot. 💸

![React](https://img.shields.io/badge/React_19-20232a?style=for-the-badge&logo=react&logoColor=61dafb)
![Vite](https://img.shields.io/badge/Vite-1b1b1f?style=for-the-badge&logo=vite&logoColor=ffd62e)
![TypeScript](https://img.shields.io/badge/TypeScript-3178c6?style=for-the-badge&logo=typescript&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_4-0f172a?style=for-the-badge&logo=tailwindcss&logoColor=38bdf8)
![Supabase](https://img.shields.io/badge/Supabase-1c1c1c?style=for-the-badge&logo=supabase&logoColor=3ecf8e)
![Vercel](https://img.shields.io/badge/Vercel-000000?style=for-the-badge&logo=vercel&logoColor=white)

`😺 /ᐠ｡ꞈ｡ᐟ\ 😸`

</div>

---

## 🐾 Sumário

- [✨ Funcionalidades](#-funcionalidades)
- [🧶 Stack](#-stack)
- [🗂️ Estrutura do projeto](#️-estrutura-do-projeto)
- [🛡️ Segurança](#️-segurança)
- [🚀 Rodando localmente](#-rodando-localmente)
- [🐈 Configurando o Supabase](#-configurando-o-supabase)
- [▲ Deploy na Vercel](#-deploy-na-vercel)
- [🤖 API para bots](#-api-para-bots)
- [⚖️ LGPD](#️-lgpd)

---

## ✨ Funcionalidades

| | Recurso | O que faz |
| :-: | --- | --- |
| 📊 | **Visão geral** | Resultado pessoal somando o que vem das empresas, gráfico de evolução por dia, semana ou mês e próximos lançamentos recorrentes |
| 👤 | **Pessoal** | Receitas e despesas pessoais com busca, filtros, categorias e gráfico de distribuição |
| 🏢 | **Empresas e trabalhos** | Caixa separado por negócio, com participação no lucro (“para você”), margem, meta mensal e ponto de equilíbrio |
| 👥 | **Equipe e folha** | Cadastro de equipe, geração da folha do mês com adicionais e descontos, pagamento lançado como despesa e reabertura com estorno |
| 🔁 | **Recorrências** | Salários, aluguel, assinaturas e custos fixos lançados automaticamente todo dia pelo `pg_cron` |
| 🔑 | **Integrações** | Chaves de API com escopos, validade e revogação, documentação embutida e histórico de requisições |
| 🤖 | **Lançamento por texto** | `"gastei 42,90 no mercado ontem #padaria"` vira um lançamento com valor, data, categoria e empresa |
| 🌗 | **Tema claro e escuro** | Paleta preto e branco com verde de dinheiro, totalmente responsiva |
| 🔒 | **Privacidade** | Exportação de todos os dados em JSON e exclusão definitiva da conta |

> [!TIP]
> Aperte <kbd>N</kbd> em qualquer tela para abrir um novo lançamento. 🐾

---

## 🧶 Stack

- ⚛️ **Front-end:** React 19, Vite, TypeScript, Tailwind CSS 4, TanStack Query, React Router, Recharts, Zod
- 🟢 **Back-end:** Supabase com Postgres, Row Level Security, Auth, Edge Functions (Deno) e `pg_cron`
- ▲ **Hospedagem:** Vercel, com cabeçalhos de segurança e CSP definidos em `vercel.json`

---

## 🗂️ Estrutura do projeto

```text
📦 catfinance
├── 📁 public                 logo, favicon e tema inicial
├── 📁 src
│   ├── 📁 componentes        interface (ui, layout, financeiro, empresa, autenticação)
│   ├── 📁 config             nome e contatos da marca
│   ├── 📁 consultas          hooks do TanStack Query por domínio
│   ├── 📁 contextos          sessão, tema, período, ações, notificações
│   ├── 📁 lib                supabase, formatação, períodos, erros
│   ├── 📁 paginas            telas da aplicação
│   ├── 📁 tipos              tipos do domínio
│   └── 📁 validacao          esquemas Zod dos formulários
└── 📁 supabase
    ├── 📁 functions          api (bots) e excluir-conta
    └── 📁 migrations         tabelas, RLS, funções e agendamentos
```

---

## 🛡️ Segurança

- 🧱 **RLS em todas as tabelas**, com políticas por dono (`dono_id = auth.uid()`)
- 🔗 **Chaves estrangeiras compostas** (`id, dono_id`) impedem referências entre contas diferentes
- 🚫 Papel `anon` sem acesso às tabelas, e permissões de coluna restritas no perfil e nas chaves
- 🔐 **Chaves de API** guardadas apenas como hash SHA-256, com escopos, expiração e revogação
- ⏱️ **Limite de 60 requisições por minuto** por chave, mais bloqueio por IP após tentativas inválidas
- ✅ Validação com Zod no front-end e na API, e restrições `check` no banco
- 🧾 CSP, HSTS, `X-Frame-Options` e `Permissions-Policy` configurados na Vercel

---

## 🚀 Rodando localmente

> [!NOTE]
> Requer Node.js 20 ou superior e um projeto no Supabase.

```bash
git clone https://github.com/orenandev/Controle-Financeiro.git
cd Controle-Financeiro
npm install
cp .env.example .env.local
npm run dev
```

Preencha o `.env.local` com os dados do seu projeto:

```env
VITE_SUPABASE_URL=https://SEU-PROJETO.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...
```

| Comando | 🐱 |
| --- | --- |
| `npm run dev` | servidor de desenvolvimento em `http://localhost:5173` |
| `npm run build` | checagem de tipos e build de produção |
| `npm run lint` | análise estática com oxlint |

---

## 🐈 Configurando o Supabase

1. 🆕 Crie um projeto em [supabase.com](https://supabase.com) (a região `sa-east-1` fica mais perto do Brasil).
2. 🔗 Vincule e aplique as migrations com a [Supabase CLI](https://supabase.com/docs/guides/local-development/cli/getting-started):

   ```bash
   npx supabase link --project-ref SEU_PROJECT_REF
   npx supabase db push
   ```

3. ⚡ Publique as Edge Functions:

   ```bash
   npx supabase functions deploy api --no-verify-jwt
   npx supabase functions deploy excluir-conta
   ```

4. ✉️ Em **Authentication → Sign In / Providers → Email**, desligue **Confirm email** para a conta ser liberada assim que é criada.
5. 🌐 Em **Authentication → URL Configuration**, defina o **Site URL** com o domínio do seu deploy.
6. 🧩 *(opcional)* Em **Edge Functions → Secrets**, defina `ORIGENS_PERMITIDAS=https://seu-dominio` para restringir o CORS da função `excluir-conta`.

| Migration | Conteúdo |
| --- | --- |
| `esquema_inicial` | Tabelas, índices, gatilhos, RLS e políticas |
| `funcoes_negocio` | Resumos, folha, recorrências, chaves de API e exportação LGPD |
| `agendamentos` | Jobs do `pg_cron` para recorrências e limpeza da API |
| `fuso_horario` | Banco no fuso `America/Sao_Paulo` |

---

## ▲ Deploy na Vercel

1. Importe o repositório na Vercel. O `vercel.json` já define build, rotas de SPA e cabeçalhos.
2. Em **Settings → Environment Variables**, adicione `VITE_SUPABASE_URL` e `VITE_SUPABASE_PUBLISHABLE_KEY` como **Config** (a chave publicável é feita para ficar no navegador, quem protege os dados é o RLS).
3. Sempre que alterar as variáveis, faça um **Redeploy** para que o build as inclua.

> [!WARNING]
> Nunca coloque a chave `service_role` em variáveis com prefixo `VITE_`. Ela só deve existir nas Edge Functions, onde o Supabase a injeta automaticamente. 🙀

---

## 🤖 API para bots

**Base:** `https://SEU-PROJETO.supabase.co/functions/v1/api/v1`

Envie a chave criada na tela **Integrações** no cabeçalho `x-api-key`.

| Método | Rota | Escopo | Descrição |
| :-: | --- | --- | --- |
| 🟣 `POST` | `/lancamentos/texto` | `lancamentos:escrever` | Registra a partir de texto livre |
| 🟣 `POST` | `/lancamentos` | `lancamentos:escrever` | Registra um lançamento estruturado |
| 🔴 `DELETE` | `/lancamentos/:id` | `lancamentos:escrever` | Exclui um lançamento criado pela API |
| 🟢 `GET` | `/lancamentos` | `lancamentos:ler` | Lista com filtros `inicio`, `fim`, `tipo`, `empresa_id`, `pagina` |
| 🟢 `GET` | `/categorias` | `lancamentos:ler` | Lista as categorias |
| 🟢 `GET` | `/resumo` | `resumo:ler` | Receitas, despesas, lucro das empresas e resultado |
| 🟢 `GET` | `/empresas` | `empresas:ler` | Lista empresas e trabalhos |

```bash
curl -X POST "https://SEU-PROJETO.supabase.co/functions/v1/api/v1/lancamentos/texto" \
  -H "x-api-key: $CATFINANCE_API_KEY" \
  -H "content-type: application/json" \
  -d '{"texto": "gastei 42,90 no mercado ontem #padaria"}'
```

O interpretador entende valores como `42,90`, `1.250,00`, `3k` e `R$ 99`, datas como `hoje`, `ontem` e `10/10`, a marcação `#empresa` e palavras como *gastei*, *paguei*, *recebi* e *vendi*. A tela de Integrações traz exemplos prontos em cURL, JavaScript e um bot de Discord com Components V2. 🐾

---

## ⚖️ LGPD

O app inclui Política de Privacidade e Termos de Uso, exportação dos dados (art. 18, V) e exclusão da conta. Os contatos exibidos nesses documentos ficam em `src/config/marca.ts`.

---

<div align="center">

```text
  /\_/\
 ( o.o )   feito com muito ☕ e alguns 🐟
  > ^ <
```

**Catfinance** · 🐱 · 💸 · 🐾

</div>
