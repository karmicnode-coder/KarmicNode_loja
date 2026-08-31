// ─── PRINTFUL — CRIAR ENCOMENDA DE FULFILLMENT ────────────────────────────
// POST /api/printful/order  { order_id: <uuid da tabela orders> }
// Lê a encomenda + linhas (order_items com source='printful') em Supabase e
// cria a respetiva encomenda de produção na Printful (dropshipping real).
// Grava printful_order_id/printful_status de volta na tabela `orders`.
//
// Protegido por ADMIN_API_SECRET (header x-admin-secret) — chamado a partir
// do Admin Panel, nunca automaticamente a partir do checkout público (dá
// controlo humano antes de gastar dinheiro real em produção).
//
// Env vars necessárias:
//   PRINTFUL_API_KEY, PRINTFUL_STORE_ID (opcional)
//   SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
//   ADMIN_API_SECRET
//
// Sem PRINTFUL_API_KEY ou sem a encomenda ter linhas source='printful',
// devolve erro honesto — nunca cria uma encomenda de fulfillment fictícia.

import { createClient } from '@supabase/supabase-js'

const PRINTFUL_BASE = 'https://api.printful.com'

const supabaseUrl = process.env.SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
const supabaseAdmin = (supabaseUrl && supabaseServiceKey)
  ? createClient(supabaseUrl, supabaseServiceKey, { auth: { persistSession: false } })
  : null

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  if (req.method === 'OPTIONS') return res.status(200).end()
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const adminSecret = process.env.ADMIN_API_SECRET
  if (adminSecret && req.headers['x-admin-secret'] !== adminSecret) {
    return res.status(401).json({ error: 'Não autorizado.' })
  }

  const apiKey = process.env.PRINTFUL_API_KEY
  if (!apiKey) {
    return res.status(503).json({ error: 'Printful não configurado (PRINTFUL_API_KEY em falta).' })
  }
  if (!supabaseAdmin) {
    return res.status(503).json({ error: 'Supabase (service role) não configurado — não é possível ler a encomenda.' })
  }

  try {
    const { order_id } = req.body || {}
    if (!order_id) return res.status(400).json({ error: 'order_id em falta' })

    const { data: order, error: orderErr } = await supabaseAdmin
      .from('orders').select('*').eq('id', order_id).single()
    if (orderErr || !order) return res.status(404).json({ error: 'Encomenda não encontrada' })

    const { data: items, error: itemsErr } = await supabaseAdmin
      .from('order_items').select('*').eq('order_id', order_id).eq('source', 'printful')
    if (itemsErr) throw itemsErr
    if (!items || items.length === 0) {
      return res.status(400).json({ error: 'Esta encomenda não tem linhas com source=\'printful\' — nada para enviar à Printful.' })
    }

    const addr = order.shipping_address || {}
    const printfulOrderPayload = {
      external_id: order.order_number || order.id,
      recipient: {
        name: order.customer_name || order.customer_email,
        address1: addr.line1 || '',
        address2: addr.line2 || '',
        city: addr.city || '',
        zip: addr.postal_code || '',
        country_code: addr.country || 'PT',
        email: order.customer_email,
        phone: order.customer_phone || undefined,
      },
      items: items.map(i => ({
        // variant_id da Printful tem de estar guardado em custom_design.printful_variant_id
        // quando a linha foi criada (Customizer/checkout) — sem isso não há como
        // mapear para o catálogo Printful, e falha explicitamente (honesto).
        variant_id: i.custom_design?.printful_variant_id,
        quantity: i.quantity,
        retail_price: (i.unit_price_cents / 100).toFixed(2),
        name: i.product_name,
      })),
    }

    const missingVariant = printfulOrderPayload.items.find(i => !i.variant_id)
    if (missingVariant) {
      return res.status(400).json({ error: `Linha "${missingVariant.name}" não tem variant_id Printful associado — não é possível enviar para produção.` })
    }

    const headers = { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' }
    if (process.env.PRINTFUL_STORE_ID) headers['X-PF-Store-Id'] = process.env.PRINTFUL_STORE_ID

    const r = await fetch(`${PRINTFUL_BASE}/orders`, {
      method: 'POST', headers, body: JSON.stringify(printfulOrderPayload),
    })
    const data = await r.json()

    if (!r.ok) {
      return res.status(r.status).json({ error: data?.error?.message || `Printful respondeu ${r.status}` })
    }

    await supabaseAdmin.from('orders').update({
      printful_order_id: String(data.result.id),
      printful_status: data.result.status,
      updated_at: new Date().toISOString(),
    }).eq('id', order_id)

    return res.status(200).json({ ok: true, printful_order_id: data.result.id, status: data.result.status })
  } catch (err) {
    console.error('[printful/order] Erro:', err)
    return res.status(500).json({ error: err.message || 'Erro ao criar encomenda na Printful' })
  }
}
