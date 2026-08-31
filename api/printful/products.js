// ─── PRINTFUL — LISTA DE PRODUTOS (Print-on-Demand) ───────────────────────
// GET /api/printful/products → lista os "sync products" da loja Printful
// ligada (produtos que já sincronizaste no dashboard Printful com a tua
// loja). Chamada real à API do Printful — não simulada.
//
// Env vars necessárias:
//   PRINTFUL_API_KEY  = token de API (Printful dashboard > Stores > API)
//   PRINTFUL_STORE_ID = ID da loja (necessário só se o token for multi-loja)
//
// Sem estas variáveis, devolve 503 de forma honesta — nunca inventa produtos.
// Nenhum SKU do catálogo estático atual (ALL_PRODUCTS em src/App.tsx) está
// marcado como proveniente do Printful, por isso este endpoint fica
// infraestrutura pronta mas dormente até um produto real ser ligado.

const PRINTFUL_BASE = 'https://api.printful.com'

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  if (req.method === 'OPTIONS') return res.status(200).end()
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' })

  const apiKey = process.env.PRINTFUL_API_KEY
  const storeId = process.env.PRINTFUL_STORE_ID

  if (!apiKey) {
    return res.status(503).json({
      configured: false,
      products: [],
      error: 'Printful não configurado (PRINTFUL_API_KEY em falta). Integração inerte.',
    })
  }

  try {
    const headers = { Authorization: `Bearer ${apiKey}` }
    if (storeId) headers['X-PF-Store-Id'] = storeId

    const r = await fetch(`${PRINTFUL_BASE}/store/products`, { headers })
    const data = await r.json()

    if (!r.ok) {
      return res.status(r.status).json({
        configured: true,
        products: [],
        error: data?.error?.message || `Printful respondeu ${r.status}`,
      })
    }

    const products = (data.result || []).map(p => ({
      id: p.id,
      external_id: p.external_id,
      name: p.name,
      variants: p.variants,
      synced: p.synced,
      thumbnail_url: p.thumbnail_url,
      is_ignored: p.is_ignored,
    }))

    return res.status(200).json({ configured: true, products })
  } catch (err) {
    console.error('[printful/products] Erro:', err)
    return res.status(500).json({ configured: true, products: [], error: err.message || 'Erro ao contactar a API do Printful' })
  }
}
