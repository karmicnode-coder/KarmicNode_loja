import Stripe from 'stripe'

const stripeKey = process.env.STRIPE_SECRET_KEY
const stripe = stripeKey ? new Stripe(stripeKey) : null

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  if (!stripe) {
    return res.status(503).json({ error: 'Pagamentos indisponíveis de momento. Tente mais tarde.' })
  }

  const { items, origin } = req.body || {}

  if (!items || items.length === 0) {
    return res.status(400).json({ error: 'No items' })
  }

  try {
    const line_items = items.map((item) => {
      if (item.stripeId) {
        return { price: item.stripeId, quantity: item.qty }
      }
      return {
        price_data: {
          currency: 'eur',
          product_data: {
            name: item.name,
            images: item.image ? [item.image] : [],
          },
          unit_amount: Math.round(item.price * 100),
        },
        quantity: item.qty,
      }
    })

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items,
      mode: 'payment',
      success_url: `${origin}?pagamento=sucesso`,
      cancel_url: `${origin}?pagamento=cancelado`,
    })

    res.status(200).json({ url: session.url })
  } catch (err) {
    console.error('Erro ao criar sessão de checkout Stripe:', err?.message || err)
    res.status(500).json({ error: 'Não foi possível iniciar o pagamento. Tente novamente.' })
  }
}
