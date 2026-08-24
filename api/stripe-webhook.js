// ─── STRIPE WEBHOOK HANDLER ───────────────────────────────────────────────
// Recebe eventos do Stripe (pagamento concluído, falhado, reembolsado).
// Faz:
//   1. Valida assinatura Stripe (segurança CRÍTICA)
//   2. Ao checkout.session.completed → atualiza stock + envia email confirmação
//   3. Ao payment_intent.payment_failed → logga para follow-up
//   4. Ao charge.refunded → devolve stock + email
//
// SETUP:
//   1. No dashboard Stripe: Developers > Webhooks > Add endpoint
//      URL: https://karmicnode.com/api/stripe-webhook
//      Events: checkout.session.completed, payment_intent.payment_failed, charge.refunded
//   2. Copia o "Signing secret" e mete em STRIPE_WEBHOOK_SECRET no Vercel
//
// Env vars:
//   STRIPE_SECRET_KEY
//   STRIPE_WEBHOOK_SECRET
//   RESEND_API_KEY (opcional — para email de confirmação)
//
import Stripe from 'stripe'

const stripeKey = process.env.STRIPE_SECRET_KEY
const stripe = stripeKey ? new Stripe(stripeKey, { apiVersion: '2024-06-20' }) : null

// IMPORTANTE no Vercel: precisa raw body para verificar assinatura Stripe
export const config = {
  api: {
    bodyParser: false,
  },
}

// Helper para ler raw body
async function readRawBody(req) {
  const chunks = []
  for await (const chunk of req) chunks.push(chunk)
  return Buffer.concat(chunks)
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()

  if (!stripe) {
    console.error('[webhook] STRIPE_SECRET_KEY não configurado')
    return res.status(503).json({ error: 'Stripe não configurado' })
  }

  const sig = req.headers['stripe-signature']
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET

  if (!webhookSecret) {
    console.error('[webhook] STRIPE_WEBHOOK_SECRET não configurado')
    return res.status(500).json({ error: 'Webhook secret missing' })
  }

  let event
  try {
    const rawBody = await readRawBody(req)
    event = stripe.webhooks.constructEvent(rawBody, sig, webhookSecret)
  } catch (err) {
    console.error('[webhook] Assinatura inválida:', err.message)
    return res.status(400).send(`Webhook Error: ${err.message}`)
  }

  try {
    switch (event.type) {

      case 'checkout.session.completed': {
        const session = event.data.object
        console.log('[webhook] Checkout completed:', session.id)

        const full = await stripe.checkout.sessions.retrieve(session.id, {
          expand: ['line_items.data.price.product', 'customer', 'total_details.breakdown'],
        })

        // 1. Atualizar stock (implementar quando tiveres DB — Supabase/Vercel KV/etc.)
        for (const li of full.line_items.data) {
          const sku = li.price?.product?.metadata?.sku
          if (sku) {
            console.log(`[stock] Decrement ${sku} by ${li.quantity}`)
            // TODO: chamar DB
          }
        }

        // 2. Enviar email de confirmação (via Resend)
        if (process.env.RESEND_API_KEY && full.customer_details?.email) {
          try {
            await sendOrderEmail(full)
          } catch (e) {
            console.error('[webhook] Falha ao enviar email:', e)
          }
        }

        // 3. Guardar encomenda em DB (opcional — recomendado)

        break
      }

      case 'payment_intent.payment_failed': {
        const intent = event.data.object
        console.warn('[webhook] Pagamento falhou:', intent.id, intent.last_payment_error?.message)
        break
      }

      case 'charge.refunded': {
        const charge = event.data.object
        console.log('[webhook] Refund emitido:', charge.id)
        break
      }

      case 'checkout.session.expired': {
        const session = event.data.object
        console.log('[webhook] Sessão expirada:', session.id)
        break
      }

      default:
        console.log(`[webhook] Evento não tratado: ${event.type}`)
    }

    return res.status(200).json({ received: true })

  } catch (err) {
    console.error('[webhook] Erro no handler:', err)
    return res.status(500).json({ error: err.message })
  }
}

// ─── Email de confirmação (Resend) ────────────────────────────────────────
async function sendOrderEmail(session) {
  const RESEND_URL = 'https://api.resend.com/emails'
  const items = session.line_items.data.map(li => ({
    name: li.description || li.price?.product?.name || 'Item',
    qty: li.quantity,
    total: (li.amount_total / 100).toFixed(2),
  }))
  const subtotal = ((session.amount_subtotal || 0) / 100).toFixed(2)
  const tax = ((session.total_details?.amount_tax || 0) / 100).toFixed(2)
  const shipping = ((session.total_details?.amount_shipping || 0) / 100).toFixed(2)
  const discount = ((session.total_details?.amount_discount || 0) / 100).toFixed(2)
  const total = (session.amount_total / 100).toFixed(2)

  const html = renderOrderEmail({
    orderId: session.id.slice(-8).toUpperCase(),
    customerName: session.customer_details?.name || 'Cliente',
    email: session.customer_details.email,
    items, subtotal, tax, shipping, discount, total,
    shippingAddress: session.shipping_details?.address,
    isEN: session.metadata?.locale === 'en',
  })

  const res = await fetch(RESEND_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: 'Karmic Node <encomendas@karmicnode.com>',
      to: [session.customer_details.email],
      bcc: ['karmicnode@gmail.com'],
      subject: (session.metadata?.locale === 'en')
        ? `Karmic Node — Order confirmation #${session.id.slice(-8).toUpperCase()}`
        : `Karmic Node — Confirmação de encomenda #${session.id.slice(-8).toUpperCase()}`,
      html,
    }),
  })
  if (!res.ok) {
    const t = await res.text()
    throw new Error('Resend error: ' + res.status + ' ' + t)
  }
}

// Template HTML — Karmic Node identity
function renderOrderEmail({ orderId, customerName, items, subtotal, tax, shipping, discount, total, shippingAddress, isEN }) {
  const t = isEN ? {
    hi: `Hi ${customerName},`,
    thanks: 'Thank you for your order.',
    orderRef: 'Order',
    items: 'Items',
    subtotal: 'Subtotal',
    tax: 'VAT (23%)',
    shipping: 'Shipping',
    discount: 'Discount',
    total: 'Total',
    shipTo: 'Ship to',
    footer: 'Karmic Node · Cartaxo, Portugal · karmicnode@gmail.com',
    intro: 'We\'ve received your payment and are getting your order ready. You\'ll get a tracking email once it ships.',
  } : {
    hi: `Olá ${customerName},`,
    thanks: 'Obrigado pela sua encomenda.',
    orderRef: 'Encomenda',
    items: 'Artigos',
    subtotal: 'Subtotal',
    tax: 'IVA (23%)',
    shipping: 'Envio',
    discount: 'Desconto',
    total: 'Total',
    shipTo: 'Enviar para',
    footer: 'Karmic Node · Cartaxo, Portugal · karmicnode@gmail.com',
    intro: 'Recebemos o seu pagamento e estamos a preparar a sua encomenda. Enviaremos um email com o tracking assim que sair.',
  }

  const itemsHtml = items.map(i =>
    `<tr><td style="padding:12px 0;border-bottom:1px solid #2b2926;color:#F5F2ED">${i.name} × ${i.qty}</td>` +
    `<td style="padding:12px 0;border-bottom:1px solid #2b2926;text-align:right;color:#F5F2ED;font-family:'Cormorant Garamond',serif;font-size:16px;font-weight:600">${i.total} €</td></tr>`
  ).join('')

  const address = shippingAddress
    ? `${shippingAddress.line1 || ''}<br/>${shippingAddress.line2 ? shippingAddress.line2 + '<br/>' : ''}${shippingAddress.postal_code || ''} ${shippingAddress.city || ''}<br/>${shippingAddress.country || ''}`
    : ''

  return `<!doctype html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#0B0B0C;font-family:'Inter',-apple-system,sans-serif;color:#F5F2ED">
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#0B0B0C">
  <tr><td align="center" style="padding:40px 20px">
    <table role="presentation" width="580" cellspacing="0" cellpadding="0" style="max-width:580px">
      <!-- Header -->
      <tr><td style="padding:24px 32px;border-bottom:1px solid #2b2926">
        <div style="font-family:'Cormorant Garamond',Georgia,serif;font-size:24px;letter-spacing:.14em;text-transform:uppercase;color:#F5F2ED">
          Karmic<span style="color:#B08D57">·</span>Node
        </div>
        <div style="font-size:11px;letter-spacing:.24em;text-transform:uppercase;color:#B08D57;margin-top:4px">${t.orderRef} #${orderId}</div>
      </td></tr>
      <!-- Body -->
      <tr><td style="padding:36px 32px 24px">
        <h1 style="font-family:'Cormorant Garamond',Georgia,serif;font-size:32px;font-weight:500;margin:0 0 14px;color:#F5F2ED">${t.hi}</h1>
        <p style="font-size:15px;line-height:1.65;color:#d9d4cb;margin:0 0 6px">${t.thanks}</p>
        <p style="font-size:14px;line-height:1.65;color:#a7a7a7;margin:0 0 26px">${t.intro}</p>
      </td></tr>
      <!-- Items table -->
      <tr><td style="padding:0 32px">
        <div style="font-size:10px;letter-spacing:.22em;text-transform:uppercase;color:#B08D57;font-weight:600;margin-bottom:10px">${t.items}</div>
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0">${itemsHtml}</table>
      </td></tr>
      <!-- Totals -->
      <tr><td style="padding:20px 32px 8px">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="font-size:14px">
          <tr><td style="padding:5px 0;color:#a7a7a7">${t.subtotal}</td><td style="padding:5px 0;text-align:right;color:#d9d4cb">${subtotal} €</td></tr>
          ${parseFloat(discount) > 0 ? `<tr><td style="padding:5px 0;color:#B08D57">− ${t.discount}</td><td style="padding:5px 0;text-align:right;color:#B08D57">-${discount} €</td></tr>` : ''}
          <tr><td style="padding:5px 0;color:#a7a7a7">${t.tax}</td><td style="padding:5px 0;text-align:right;color:#d9d4cb">${tax} €</td></tr>
          <tr><td style="padding:5px 0;color:#a7a7a7">${t.shipping}</td><td style="padding:5px 0;text-align:right;color:#d9d4cb">${parseFloat(shipping) === 0 ? '<span style="color:#B08D57">Grátis</span>' : shipping + ' €'}</td></tr>
          <tr><td style="padding:14px 0 0;border-top:1px solid #2b2926;font-size:12px;letter-spacing:.18em;text-transform:uppercase;color:#F5F2ED">${t.total}</td>
              <td style="padding:14px 0 0;border-top:1px solid #2b2926;text-align:right;font-family:'Cormorant Garamond',serif;font-size:26px;font-weight:600;color:#B08D57">${total} €</td></tr>
        </table>
      </td></tr>
      ${address ? `
      <tr><td style="padding:28px 32px 8px">
        <div style="font-size:10px;letter-spacing:.22em;text-transform:uppercase;color:#B08D57;font-weight:600;margin-bottom:8px">${t.shipTo}</div>
        <div style="font-size:14px;line-height:1.6;color:#d9d4cb">${address}</div>
      </td></tr>` : ''}
      <!-- Footer -->
      <tr><td style="padding:34px 32px 24px;border-top:1px solid #2b2926;text-align:center">
        <div style="font-size:11px;color:#7a7570">${t.footer}</div>
      </td></tr>
    </table>
  </td></tr>
</table>
</body></html>`
}
