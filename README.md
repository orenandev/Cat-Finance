# Catfinance

Controle financeiro pessoal, de empresas e trabalhos em um só lugar: visão consolidada, folha de pagamento, custos fixos, recorrências automáticas e API para bots.

Produção: https://catfinancer.vercel.app

## Stack

- React 19 + Vite + TypeScript, Tailwind CSS 4, TanStack Query, Recharts
- Supabase (Postgres com RLS, Auth, Edge Functions, pg_cron)
- Hospedagem na Vercel

## Rodando localmente

```bash
npm install
cp .env.example .env.local
npm run dev
```

Preencha `.env.local` com a URL do projeto e a chave publicável (`sb_publishable_...`).

## Banco de dados

As migrations ficam em `supabase/migrations` e já foram aplicadas no projeto `catfinance` (`tvgxhqkkvnebpiishfkv`, região São Paulo):

| Migration | Conteúdo |
| --- | --- |
| `esquema_inicial` | Tabelas, índices, gatilhos, RLS e políticas por dono |
| `funcoes_negocio` | Resumos, folha de pagamento, recorrências, chaves de API, exportação LGPD |
| `agendamentos` | Jobs do pg_cron (recorrências diárias e limpeza da API) |
| `fuso_horario` | Banco no fuso `America/Sao_Paulo` |

Todas as tabelas têm RLS habilitado. Cada registro carrega `dono_id` e as chaves estrangeiras compostas impedem referências entre contas diferentes.

## Configuração do Supabase (painel)

O login é feito apenas com e-mail e senha, sem confirmação por e-mail.

1. **Authentication → Sign In / Providers → Email**: desligue **Confirm email** para a conta ser liberada assim que é criada.
2. **Authentication → URL Configuration**: Site URL `https://catfinancer.vercel.app`.
3. **Edge Functions → Secrets** (opcional): `ORIGENS_PERMITIDAS=https://catfinancer.vercel.app` restringe o CORS da função `excluir-conta`.

## Deploy na Vercel

1. Importe o repositório na Vercel (o `vercel.json` já define build, rewrites de SPA e cabeçalhos de segurança).
2. Em *Environment Variables*, adicione `VITE_SUPABASE_URL` e `VITE_SUPABASE_PUBLISHABLE_KEY`.
3. Sempre que mudar as variáveis, faça um *Redeploy* para que o build as inclua.

## API para bots

Base: `https://tvgxhqkkvnebpiishfkv.supabase.co/functions/v1/api/v1`

Autenticação pelo cabeçalho `x-api-key` com chaves geradas em **Integrações**. Limite de 60 requisições por minuto por chave; as chaves são armazenadas apenas como hash SHA-256.

| Método | Rota | Escopo |
| --- | --- | --- |
| POST | `/lancamentos/texto` | `lancamentos:escrever` |
| POST | `/lancamentos` | `lancamentos:escrever` |
| DELETE | `/lancamentos/:id` | `lancamentos:escrever` |
| GET | `/lancamentos` | `lancamentos:ler` |
| GET | `/categorias` | `lancamentos:ler` |
| GET | `/resumo` | `resumo:ler` |
| GET | `/empresas` | `empresas:ler` |

Exemplo de texto livre: `"gastei 42,90 no mercado ontem #padaria"` — o valor, a data, a categoria e a empresa são identificados automaticamente.

## Dados da marca e LGPD

Nome, e-mails de contato e do encarregado (DPO) ficam em `src/config/marca.ts` e são usados na Política de Privacidade e nos Termos de Uso. Substitua os e-mails pelos reais antes de publicar.
