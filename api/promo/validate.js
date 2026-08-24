// ─── VALIDAÇÃO DE CÓDIGO PROMO / CARTÃO OFERTA ────────────────────────────
// O carrinho no site chama este endpoint quando o utilizador introduz um código.
// Devolve preview do desconto (percentagem/valor fixo) para mostrar no total,
// SEM criar sessão Stripe ainda.
//
// Suporta:
//   - Códigos promo Stripe (criados em Dashboard > Products > Coupons > Promotion codes)
//   - Cartões oferta: qualquer código que comece por "GIFT"
//
import Stripe from 'stripe'

const stripeKey = process.env.STRIPE_SECRET_KEY
const stripe = stripeKey ? new Stripe(stripeKey, { apiVersion: '2024-06-20' }) : null

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  if (req.method === 'OPTIONS') return res.status(200).end()
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  if (!stripe) {
    return res.status(503).json({ valid: false, error: 'Serviço de códigos promo indisponível de momento.' })
  }

  try {
    const { code, cart_subtotal } = req.body || {}
    if (!code) return res.status(400).json({ error: 'Código em falta' })

    const trimmed = String(code).trim()
    if (!trimmed) return res.status(400).json({ error: 'Código em falta' })

    const promoCodes = await stripe.promotionCodes.list({
      code: trimmed,
      active: true,
      limit: 1,
    })

    if (promoCodes.data.length === 0) {
      return res.status(404).json({ valid: false, error: 'Código inválido ou expirado' })
    }

    const promo = promoCodes.data[0]
    const coupon = promo.coupon

    if (!coupon.valid) {
      return res.status(404).json({ valid: false, error: 'Código já não é válido' })
    }

    const subtotalCents = Math.round(parseFloat(cart_subtotal || 0) * 100)
    let discountCents = 0

    if (coupon.percent_off) {
      discountCents = Math.round(subtotalCents * (coupon.percent_off / 100))
    } else if (coupon.amount_off) {
      discountCents = Math.min(coupon.amount_off, subtotalCents)
    }

    if (coupon.restrictions?.minimum_amount) {
      if (subtotalCents < coupon.restrictions.minimum_amount) {
        return res.status(400).json({
          valid: false,
          error: `Este código exige compra mínima de ${(coupon.restrictions.minimum_amount / 100).toFixed(2)}€`,
        })
      }
    }

    return res.status(200).json({
      valid: true,
      code: promo.code,
      name: coupon.name || promo.code,
      discount_type: coupon.percent_off ? 'percent' : 'fixed',
      discount_value: coupon.percent_off || (coupon.amount_off / 100),
      discount_cents: discountCents,
      discount_display: (discountCents / 100).toFixed(2),
      currency: coupon.currency || 'eur',
      is_gift_card: trimmed.toUpperCase().startsWith('GIFT'),
    })

  } catch (err) {
    console.error('[promo] Erro:', err)
    return res.status(500).json({ error: err.message || 'Erro na validação' })
  }
}
