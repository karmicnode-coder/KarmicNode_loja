// ─── Supabase Client ───────────────────────────────────────────────────────
// Cliente único partilhado por toda a app (Auth, Karma Points, Wishlist,
// Reviews, Admin Panel, AI Chatbot, etc.)
//
// IMPORTANTE: até que VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY sejam
// configuradas (ver .env.example), este cliente fica "inerte": as chamadas
// de rede falham silenciosamente (capturadas pelos try/catch dos hooks) e a
// app continua a funcionar em modo 100% catálogo estático / sem login.
// Nenhuma funcionalidade core (loja, carrinho, checkout Stripe) depende
// deste cliente.
import { createClient, type SupabaseClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey)

if (!isSupabaseConfigured && import.meta.env.DEV) {
  // eslint-disable-next-line no-console
  console.warn(
    '[supabase] VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY não configuradas. ' +
    'Auth, Karma Points, Wishlist na nuvem, Admin Panel, etc. ficam inertes ' +
    'até serem definidas (ver .env.example).'
  )
}

// Cria sempre uma instância válida do cliente (mesmo com credenciais
// fictícias) para que todas as chamadas `supabase.from(...)` no código não
// precisem de verificar null — falham de forma controlada em vez de dar
// erro de "cannot read property of null".
export const supabase: SupabaseClient = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder-anon-key',
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  }
)

// Nome fixo do email admin (usado em RLS e no Admin Panel front-end)
export const ADMIN_EMAIL = 'karmicnode@gmail.com'
