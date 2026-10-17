# Catfinance

Controle financeiro pessoal, de empresas e trabalhos em um só lugar: visão consolidada, folha de pagamento, custos fixos, recorrências automáticas e API para bots.

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

1. **Authentication → URL Configuration**
   - Site URL: `https://SEU-DOMINIO.vercel.app`
   - Redirect URLs: `http://localhost:5173/auth/retorno` e `https://SEU-DOMINIO.vercel.app/auth/retorno`
2. **Authentication → Email Templates**: em *Confirm signup* e *Reset password*, cole o conteúdo de `supabase/templates/codigo-confirmacao.html` e `supabase/templates/codigo-recuperacao.html`. Eles usam `{{ .Token }}` para enviar o código de 6 dígitos.
3. **Authentication → Providers**
   - Google: crie credenciais OAuth no Google Cloud com o callback `https://tvgxhqkkvnebpiishfkv.supabase.co/auth/v1/callback`.
   - Discord: crie um app no Discord Developer Portal com o mesmo callback.
4. **Authentication → Settings**: habilite *Manual linking* (vincular Google/Discord à conta existente), senha mínima de 8 caracteres com letras maiúsculas, minúsculas e números.
5. **Authentication → SMTP**: configure um SMTP próprio (Resend, SES, Postmark…). O SMTP padrão do Supabase só envia para membros da organização e tem limite baixo por hora.
6. **Edge Functions → Secrets** (opcional): `ORIGENS_PERMITIDAS=https://SEU-DOMINIO.vercel.app` restringe o CORS da função `excluir-conta`.

## Deploy na Vercel

1. Importe o repositório na Vercel (o `vercel.json` já define build, rewrites de SPA e cabeçalhos de segurança).
2. Em *Environment Variables*, adicione `VITE_SUPABASE_URL` e `VITE_SUPABASE_PUBLISHABLE_KEY`.
3. Depois do primeiro deploy, atualize o Site URL e os Redirect URLs no Supabase com o domínio final.

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
