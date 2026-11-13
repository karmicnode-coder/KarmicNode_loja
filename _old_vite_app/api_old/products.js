// ─── LISTA DE PRODUTOS STRIPE ─────────────────────────────────────────────
// GET /api/products → lista todos os produtos ativos no Stripe (com preço + metadata)
// Se STRIPE_SECRET_KEY não estiver definido ou não houver produtos, devolve array vazio
// (o site cai no catálogo estático embutido em src/App.tsx — ALL_PRODUCTS).
//
import Stripe from 'stripe'

const stripeKey = process.env.STRIPE_SECRET_KEY
const stripe = stripeKey ? new Stripe(stripeKey, { apiVersion: '2024-06-20' }) : null

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  if (req.method === 'OPTIONS') return res.status(200).end()
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' })

  if (!stripe) {
    // Modo dev / sem Stripe configurado — o frontend usa o catálogo estático de reserva.
    res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate')
    return res.status(200).json({ products: [], source: 'fallback' })
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
        let specsEn = []
        try { specs = meta.specs ? JSON.parse(meta.specs) : [] } catch {}
        try { specsEn = meta.specs_en ? JSON.parse(meta.specs_en) : [] } catch {}

        return {
          id: index + 1,
          sku: meta.sku || p.id,
          stripeId: typeof price === 'object' ? price.id : price,
          name: p.name,
          nameEn: meta.name_en || undefined,
          category: meta.category || 'Geral',
          categoryEn: meta.category_en || undefined,
          subcategory: meta.subcategory || undefined,
          subcategoryEn: meta.subcategory_en || undefined,
          vertical: meta.vertical || undefined,
          customizable: meta.customizable === 'true',
          tags: meta.tags ? meta.tags.split(',').map(t => t.trim()) : [],
          price: typeof price === 'object' && price.unit_amount ? price.unit_amount / 100 : 0,
          originalPrice: meta.original_price ? parseFloat(meta.original_price) : null,
          badge: meta.badge || null,
          badgeColor: meta.badge_color === 'bordo' ? 'bordo' : meta.badge_color === 'gold' ? 'gold' : 'bordo',
          rating: meta.rating ? parseFloat(meta.rating) : 4.5,
          reviews: meta.reviews ? parseInt(meta.reviews) : 0,
          stock: meta.stock ? parseInt(meta.stock) : 99,
          image: p.images?.[0] || '',
          images: p.images || [],
          description: p.description || '',
          descriptionEn: meta.description_en || undefined,
          specs,
          specsEn,
        }
      })

    res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate=300')
    return res.status(200).json({ products, source: 'stripe' })

  } catch (err) {
    console.error('[products] Erro:', err)
    return res.status(200).json({ products: [], source: 'error', error: err.message })
  }
}
