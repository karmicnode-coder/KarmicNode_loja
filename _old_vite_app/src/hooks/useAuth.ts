// ─── useAuth hook ────────────────────────────────────────────────────────
// Autenticação via Supabase (Magic Link + Google OAuth).
// Fica automaticamente "inerte" (user sempre null, loading false) quando
// as credenciais Supabase não estão configuradas — ver src/lib/supabase.ts.
import { useState, useEffect, useCallback } from 'react'
import type { User } from '@supabase/supabase-js'
import { supabase, isSupabaseConfigured, ADMIN_EMAIL } from '../lib/supabase'

export interface Profile {
  id: string
  email: string | null
  full_name: string | null
  avatar_url: string | null
  phone: string | null
  locale: 'pt' | 'en'
  is_admin: boolean
  newsletter_optin: boolean
  created_at: string
  updated_at: string
}

export interface UseAuthResult {
  user: User | null
  profile: Profile | null
  loading: boolean
  isAdmin: boolean
  isConfigured: boolean
  signInWithMagicLink: (email: string) => Promise<{ error: string | null }>
  signInWithGoogle: () => Promise<{ error: string | null }>
  signOut: () => Promise<void>
  refreshProfile: () => Promise<void>
}

export function useAuth(): UseAuthResult {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(isSupabaseConfigured)

  useEffect(() => {
    if (!isSupabaseConfigured) { setLoading(false); return }

    supabase.auth.getSession().then(({ data }) => {
      setUser(data.session?.user ?? null)
      setLoading(false)
    }).catch(() => setLoading(false))

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })
    return () => subscription.unsubscribe()
  }, [])

  const fetchProfile = useCallback(async (uid: string) => {
    try {
      const { data } = await supabase.from('profiles').select('*').eq('id', uid).single()
      setProfile((data as Profile) ?? null)
    } catch {
      setProfile(null)
    }
  }, [])

  useEffect(() => {
    if (!user || !isSupabaseConfigured) { setProfile(null); return }
    fetchProfile(user.id)
  }, [user, fetchProfile])

  const refreshProfile = useCallback(async () => {
    if (user) await fetchProfile(user.id)
  }, [user, fetchProfile])

  const signInWithMagicLink = useCallback(async (email: string) => {
    if (!isSupabaseConfigured) return { error: 'Supabase não configurado.' }
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: window.location.origin + '/conta' },
    })
    return { error: error?.message ?? null }
  }, [])

  const signInWithGoogle = useCallback(async () => {
    if (!isSupabaseConfigured) return { error: 'Supabase não configurado.' }
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin + '/conta' },
    })
    return { error: error?.message ?? null }
  }, [])

  const signOut = useCallback(async () => {
    if (!isSupabaseConfigured) return
    await supabase.auth.signOut()
    setUser(null)
    setProfile(null)
  }, [])

  const isAdmin = Boolean(profile?.is_admin) || user?.email === ADMIN_EMAIL

  return {
    user, profile, loading, isAdmin,
    isConfigured: isSupabaseConfigured,
    signInWithMagicLink, signInWithGoogle, signOut, refreshProfile,
  }
}
