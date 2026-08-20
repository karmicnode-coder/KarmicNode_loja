import Stripe from 'stripe'

const stripeKey = process.env.STRIPE_SECRET_KEY
const stripe = stripeKey ? new Stripe(stripeKey) : null

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  // Sem chave Stripe configurada: devolve lista vazia em vez de rebentar a função.
  // O frontend já tem um catálogo estático de reserva (fallback) para este caso.
  if (!stripe) {
    res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate')
    return res.status(200).json({ products: [] })
  }

  try {
    const stripeProducts = await stripe.products.list({
      active: true,
      expand: ['data.default_price'],
      limit: 100,
    })

    const products = stripeProducts.data
      .filter(p => p.default_price)
      .map((p, index) => {
        const price = p.default_price
        const meta = p.metadata || {}

        let specs = []
        try { specs = meta.specs ? JSON.parse(meta.specs) : [] } catch {}

        return {
          id: index + 1,
          stripeId: typeof price === 'object' ? price.id : price,
          name: p.name,
          category: meta.category || 'Geral',
          tags: meta.tags ? meta.tags.split(',').map(t => t.trim()) : [],
          price: typeof price === 'object' && price.unit_amount ? price.unit_amount / 100 : 0,
          originalPrice: meta.original_price ? parseFloat(meta.original_price) : undefined,
          badge: meta.badge || undefined,
          badgeColor: (meta.badge_color === 'bordo' ? 'bordo' : meta.badge_color === 'gold' ? 'gold' : undefined),
          rating: meta.rating ? parseFloat(meta.rating) : 4.5,
          reviews: meta.reviews ? parseInt(meta.reviews) : 0,
          stock: meta.stock ? parseInt(meta.stock) : 99,
          image: p.images?.[0] || '',
          images: p.images || [],
          description: p.description || '',
          specs,
        }
      })

    res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate')
    res.status(200).json({ products })
  } catch (err) {
    console.error('Erro ao obter produtos da Stripe:', err?.message || err)
    // Falha graciosamente: o frontend usa o catálogo estático de reserva.
    res.status(200).json({ products: [], error: 'stripe_unavailable' })
  }
}
