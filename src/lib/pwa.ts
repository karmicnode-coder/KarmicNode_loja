// ─── PWA helpers ─────────────────────────────────────────────────────────
// Registo do Service Worker, gestão do prompt de instalação (evento
// `beforeinstallprompt`) e subscrição push. Tudo com fallback silencioso
// em navegadores/contextos sem suporte (ex. Safari sem push, HTTP local).
import { supabase, isSupabaseConfigured } from './supabase'

export function registerServiceWorker(): void {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => {
      // silencioso — a app funciona sem SW, só perde o modo offline/push
    })
  })
}

// VAPID public key — injectada em build-time via VITE_VAPID_PUBLIC_KEY.
// Sem ela, a subscrição push fica inerte (mesmo padrão do resto da app).
const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY as string | undefined

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const rawData = window.atob(base64)
  const outputArray = new Uint8Array(rawData.length)
  for (let i = 0; i < rawData.length; ++i) outputArray[i] = rawData.charCodeAt(i)
  return outputArray
}

export async function isPushSupported(): Promise<boolean> {
  return typeof window !== 'undefined' && 'serviceWorker' in navigator && 'PushManager' in window && Boolean(VAPID_PUBLIC_KEY)
}

/** Pede permissão de notificações e subscreve push, guardando a subscrição no Supabase. */
export async function subscribeToPush(userId: string | undefined): Promise<{ ok: boolean; error?: string }> {
  if (!(await isPushSupported())) return { ok: false, error: 'Push não suportado neste navegador ou VAPID não configurado.' }
  try {
    const permission = await Notification.requestPermission()
    if (permission !== 'granted') return { ok: false, error: 'Permissão de notificações negada.' }

    const registration = await navigator.serviceWorker.ready
    let sub = await registration.pushManager.getSubscription()
    if (!sub) {
      sub = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY as string) as BufferSource,
      })
    }

    const json = sub.toJSON()
    if (isSupabaseConfigured && json.endpoint && json.keys) {
      await supabase.from('push_subscriptions').upsert({
        user_id: userId || null,
        endpoint: json.endpoint,
        p256dh_key: json.keys.p256dh,
        auth_key: json.keys.auth,
        user_agent: navigator.userAgent,
        active: true,
        last_used_at: new Date().toISOString(),
      }, { onConflict: 'endpoint' })
    }
    return { ok: true }
  } catch (e: any) {
    return { ok: false, error: e?.message || 'Erro ao subscrever notificações.' }
  }
}
