// ─── DETALHES DA ENCOMENDA ────────────────────────────────────────────────
// GET /api/order/:session_id → devolve resumo da encomenda para a página de sucesso.
// (Sem PII sensível — só o essencial para mostrar "obrigado + resumo".)
//
import Stripe from 'stripe'

const stripeKey = process.env.STRIPE_SECRET_KEY
const stripe = stripeKey ? new Stripe(stripeKey, { apiVersion: '2024-06-20' }) : null

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  if (req.method === 'OPTIONS') return res.status(200).end()
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' })

  if (!stripe) {
    return res.status(503).json({ error: 'Serviço indisponível de momento.' })
  }

  try {
    const { id } = req.query
    if (!id) return res.status(400).json({ error: 'Session ID missing' })

    const session = await stripe.checkout.sessions.retrieve(String(id), {
      expand: ['line_items.data.price.product', 'total_details.breakdown'],
    })

    if (session.payment_status !== 'paid') {
      return res.status(402).json({
        error: 'Pagamento ainda não concluído',
        status: session.payment_status,
      })
    }

    return res.status(200).json({
      order_id: session.id.slice(-8).toUpperCase(),
      status: session.payment_status,
      customer_name: session.customer_details?.name || null,
      customer_email: session.customer_details?.email || null,
      items: session.line_items.data.map(li => ({
        name: li.description || li.price?.product?.name || 'Item',
        qty: li.quantity,
        total: (li.amount_total / 100).toFixed(2),
        sku: li.price?.product?.metadata?.sku || null,
      })),
      subtotal: ((session.amount_subtotal || 0) / 100).toFixed(2),
      tax: ((session.total_details?.amount_tax || 0) / 100).toFixed(2),
      shipping: ((session.total_details?.amount_shipping || 0) / 100).toFixed(2),
      discount: ((session.total_details?.amount_discount || 0) / 100).toFixed(2),
      total: (session.amount_total / 100).toFixed(2),
      currency: session.currency,
      shipping_address: session.shipping_details?.address || null,
    })

  } catch (err) {
    console.error('[order] Erro:', err)
    return res.status(500).json({ error: err.message })
  }
}
