// ─── PUSH NOTIFICATIONS — envio ────────────────────────────────────────
// POST /api/push/send → envia uma notificação push a um ou mais utilizadores
// (ou a todas as subscrições ativas, se nenhum user_id for indicado).
// Protegido por ADMIN_API_SECRET (ver .env.example) — nunca expor ao browser.
//
// Env vars necessárias:
//   VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY  (gerar com: npx web-push generate-vapid-keys)
//   SUPABASE_SERVICE_ROLE_KEY, VITE_SUPABASE_URL
//   ADMIN_API_SECRET (token simples para proteger este endpoint admin)
import webpush from 'web-push'
import { createClient } from '@supabase/supabase-js'

const vapidPublic = process.env.VAPID_PUBLIC_KEY
const vapidPrivate = process.env.VAPID_PRIVATE_KEY
const supabaseUrl = process.env.VITE_SUPABASE_URL
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
const adminSecret = process.env.ADMIN_API_SECRET

if (vapidPublic && vapidPrivate) {
  webpush.setVapidDetails('mailto:karmicnode@gmail.com', vapidPublic, vapidPrivate)
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  if (req.method === 'OPTIONS') return res.status(200).end()
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  if (!vapidPublic || !vapidPrivate || !supabaseUrl || !serviceKey) {
    return res.status(503).json({ error: 'Push notifications não configuradas (VAPID/Supabase em falta).' })
  }
  if (adminSecret && req.headers['x-admin-secret'] !== adminSecret) {
    return res.status(401).json({ error: 'Não autorizado.' })
  }

  try {
    const { title, body, url, userIds } = req.body || {}
    if (!title || !body) return res.status(400).json({ error: 'title e body são obrigatórios.' })

    const supabase = createClient(supabaseUrl, serviceKey)
    let query = supabase.from('push_subscriptions').select('id, endpoint, p256dh_key, auth_key, user_id').eq('active', true)
    if (Array.isArray(userIds) && userIds.length) query = query.in('user_id', userIds)

    const { data: subs, error } = await query
    if (error) throw error

    const payload = JSON.stringify({ title, body, url: url || '/' })
    const results = await Promise.allSettled(
      (subs || []).map((s) =>
        webpush.sendNotification(
          { endpoint: s.endpoint, keys: { p256dh: s.p256dh_key, auth: s.auth_key } },
          payload
        ).catch(async (err) => {
          // 410/404 = subscrição expirada/inválida — desativar
          if (err.statusCode === 410 || err.statusCode === 404) {
            await supabase.from('push_subscriptions').update({ active: false }).eq('id', s.id)
          }
          throw err
        })
      )
    )

    const sent = results.filter((r) => r.status === 'fulfilled').length
    const failed = results.length - sent
    return res.status(200).json({ sent, failed, total: results.length })
  } catch (err) {
    console.error('push/send error', err)
    return res.status(500).json({ error: 'Erro ao enviar notificações.' })
  }
}
