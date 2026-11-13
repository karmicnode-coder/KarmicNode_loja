// ─── Karma Points helper ─────────────────────────────────────────────────
// Cliente fino sobre a função RPC `award_karma` + tabelas `karma_profiles`/
// `karma_history`/`user_karma_summary` (ver supabase/schema.sql secção 13).
// Fica inerte (não faz nada, não rebenta) quando Supabase não está
// configurado — segue o mesmo padrão do resto da app.
import { supabase, isSupabaseConfigured } from './supabase'

export type KarmaActionKey =
  | 'signup' | 'daily_login' | 'purchase' | 'review' | 'referral'
  | 'design_saved' | 'design_shared' | 'social_follow' | 'wishlist_add'
  | 'profile_complete' | 'birthday_bonus' | 'streak_7' | 'streak_30' | 'newsletter_signup' | 'partnership_apply'

export const KARMA_ACTION_POINTS: Record<KarmaActionKey, number> = {
  signup: 50,
  daily_login: 5,
  purchase: 100, // + 1pt por € (calculado pelo caller quando souber o valor)
  review: 25,
  referral: 200,
  design_saved: 15,
  design_shared: 30,
  social_follow: 20,
  wishlist_add: 5,
  profile_complete: 50,
  birthday_bonus: 100,
  streak_7: 50,
  streak_30: 300,
  newsletter_signup: 25,
  partnership_apply: 50,
}

/** Atribui pontos de karma ao utilizador autenticado atual. Silencioso se não configurado/autenticado. */
export async function awardKarma(action: KarmaActionKey, extraPoints = 0, metadata: Record<string, unknown> = {}): Promise<void> {
  if (!isSupabaseConfigured) return
  try {
    const { data: userData } = await supabase.auth.getUser()
    const user = userData?.user
    if (!user) return
    const points = (KARMA_ACTION_POINTS[action] || 0) + extraPoints
    if (points === 0) return
    await supabase.rpc('award_karma', {
      p_user_id: user.id,
      p_action: action,
      p_points: points,
      p_metadata: metadata,
    })
  } catch {
    // silencioso — karma nunca deve bloquear o fluxo principal da app
  }
}

export interface KarmaProfileLite {
  total_points: number
  lifetime_points: number
  current_level: string
  points_to_next_level: number
  next_level: string
}

export async function fetchKarmaSummary(userId: string): Promise<KarmaProfileLite | null> {
  if (!isSupabaseConfigured) return null
  try {
    const { data } = await supabase.from('user_karma_summary').select('*').eq('user_id', userId).single()
    return (data as any) || null
  } catch {
    return null
  }
}
