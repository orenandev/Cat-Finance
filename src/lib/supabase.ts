import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL
const chavePublica = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY

if (!url || !chavePublica) {
  throw new Error('Defina VITE_SUPABASE_URL e VITE_SUPABASE_PUBLISHABLE_KEY no arquivo .env')
}

export const supabase = createClient(url, chavePublica, {
  auth: {
    flowType: 'pkce',
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    storageKey: 'catfinance:sessao',
  },
  global: {
    headers: { 'x-client-info': 'catfinance-web' },
  },
})

export const urlFuncoes = `${url}/functions/v1`
