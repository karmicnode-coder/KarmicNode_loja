// ─── STRIPE CHECKOUT SESSION ──────────────────────────────────────────────
// Cria uma Checkout Session Stripe hospedada com:
// - Cartões (Visa/MC/Amex), Multibanco, PayPal
// - IVA 23% adicionado no checkout
// - Portes de envio (grátis > 150€, senão 4.99€ Continente / 9.99€ Ilhas / etc.)
// - Códigos de desconto Stripe + cartões oferta
// - Metadata de personalização (Customizer V2) por linha
// - Envio para PT Continente, PT Ilhas, ES, resto da UE
//
// Env vars necessárias:
//   STRIPE_SECRET_KEY  = sk_test_... (test) ou sk_live_... (produção)
//   NEXT_PUBLIC_SITE_URL (opcional) = fallback para success/cancel URLs
//
import Stripe from 'stripe'

const stripeKey = process.env.STRIPE_SECRET_KEY
const stripe = stripeKey ? new Stripe(stripeKey, { apiVersion: '2024-06-20' }) : null

// Países onde envias
const ALLOWED_COUNTRIES = [
  'PT',  // Portugal (Continental + Ilhas)
  'ES',  // Espanha
  'FR', 'DE', 'IT', 'NL', 'BE', 'LU', 'AT',  // UE central
  'IE', 'DK', 'FI', 'SE',  // UE norte
  'PL', 'CZ', 'SK', 'HU', 'SI', 'HR', 'RO', 'BG', 'EE', 'LV', 'LT', 'GR', 'CY', 'MT',  // resto da UE
]

// Envio: grátis acima de 150€ (subtotal antes de IVA)
const SHIPPING_THRESHOLD_CENTS = 15000  // 150.00 €

// Opções de envio (em cêntimos, incluem IVA na taxa)
const SHIPPING_RATES = {
  pt_continental: {
    display_name: 'Portugal Continental (CTT/DPD, 24-48h)',
    fixed_amount: { amount: 499, currency: 'eur' },  // 4.99 €
    delivery_estimate: {
      minimum: { unit: 'business_day', value: 1 },
      maximum: { unit: 'business_day', value: 2 },
    },
  },
  pt_ilhas: {
    display_name: 'Portugal Ilhas — Açores/Madeira (CTT, 3-5 dias)',
    fixed_amount: { amount: 999, currency: 'eur' },  // 9.99 €
    delivery_estimate: {
      minimum: { unit: 'business_day', value: 3 },
      maximum: { unit: 'business_day', value: 5 },
    },
  },
  es_spain: {
    display_name: 'Espanha (2-4 dias úteis)',
    fixed_amount: { amount: 699, currency: 'eur' },  // 6.99 €
    delivery_estimate: {
      minimum: { unit: 'business_day', value: 2 },
      maximum: { unit: 'business_day', value: 4 },
    },
  },
  eu_standard: {
    display_name: 'Resto da UE (4-7 dias úteis)',
    fixed_amount: { amount: 1499, currency: 'eur' },  // 14.99 €
    delivery_estimate: {
      minimum: { unit: 'business_day', value: 4 },
      maximum: { unit: 'business_day', value: 7 },
    },
  },
  free: {
    display_name: 'Envio grátis (encomenda > 150€)',
    fixed_amount: { amount: 0, currency: 'eur' },
    delivery_estimate: {
      minimum: { unit: 'business_day', value: 1 },
      maximum: { unit: 'business_day', value: 3 },
    },
  },
}

export default async function handler(req, res) {
  // CORS básico (só se o front estiver noutro domínio)
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
  if (req.method === 'OPTIONS') return res.status(200).end()

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  if (!stripe) {
    return res.status(503).json({ error: 'Pagamentos indisponíveis de momento. Tente mais tarde.' })
  }

  try {
    const { items, origin, locale, promo_code } = req.body || {}

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'Carrinho vazio' })
    }

    // Construir line_items
    // Estratégia híbrida:
    //   - Se o item tiver stripeId (e não for personalizado) → usa o Price existente do Stripe
    //   - Se não tiver → cria price_data dinâmico (personalizações, etc.)
    // IVA 23% adicionado via automatic_tax
    const line_items = items.map((item) => {
      const qty = Math.max(1, parseInt(item.qty) || 1)

      // Metadata para personalização (Customizer V2)
      const metadata = {}
      if (item._customization) {
        const c = item._customization
        Object.entries(c).forEach(([k, v]) => {
          metadata[`custom_${k}`.slice(0, 40)] = String(v).slice(0, 490)
        })
      }
      if (item.sku) metadata.sku = String(item.sku)
      if (item.category) metadata.category = String(item.category)
      // Cartão-presente: o webhook usa este campo para ativar a linha em
      // gift_cards (estado 'pending' → 'active') quando o pagamento é confirmado.
      if (item.giftCardCode) metadata.gift_card_code = String(item.giftCardCode)

      if (item.stripeId && !item._customization) {
        return {
          price: item.stripeId,
          quantity: qty,
        }
      }

      const productName = item.name
      const description = item._customization
        ? `Personalizado — ${item.category || 'Karmic Node Atelier'}`
        : (item.description || '').slice(0, 250) || undefined

      return {
        price_data: {
          currency: 'eur',
          product_data: {
            name: productName,
            description,
            images: item.image && item.image.startsWith('http') ? [item.image] : [],
            metadata,
          },
          unit_amount: Math.round(parseFloat(item.price) * 100),
        },
        quantity: qty,
      }
    })

    // Origin fallback
    const siteOrigin = origin || process.env.NEXT_PUBLIC_SITE_URL || 'https://karmicnode.com'

    // Configurar shipping_options
    const shipping_options = [
      { shipping_rate_data: { type: 'fixed_amount', ...SHIPPING_RATES.pt_continental } },
      { shipping_rate_data: { type: 'fixed_amount', ...SHIPPING_RATES.pt_ilhas } },
      { shipping_rate_data: { type: 'fixed_amount', ...SHIPPING_RATES.es_spain } },
      { shipping_rate_data: { type: 'fixed_amount', ...SHIPPING_RATES.eu_standard } },
    ]

    // Se o subtotal do carrinho já ultrapassa o threshold, adiciona também opção grátis
    const subtotalCents = items.reduce((s, i) => s + Math.round(parseFloat(i.price) * 100) * (parseInt(i.qty) || 1), 0)
    if (subtotalCents >= SHIPPING_THRESHOLD_CENTS) {
      shipping_options.unshift({ shipping_rate_data: { type: 'fixed_amount', ...SHIPPING_RATES.free } })
    }

    const sessionConfig = {
      // Nota: MB WAY requer ativação manual no dashboard Stripe (Settings > Payment methods)
      //       para uma conta portuguesa. Apple Pay/Google Pay são automáticos com 'card'
      //       quando o domínio está verificado.
      payment_method_types: [
        'card',
        'multibanco',
        'paypal',
      ],

      line_items,
      mode: 'payment',

      // IVA 23% automático (precisa Stripe Tax ativado no dashboard)
      automatic_tax: { enabled: true },

      billing_address_collection: 'required',
      shipping_address_collection: {
        allowed_countries: ALLOWED_COUNTRIES,
      },
      shipping_options,

      phone_number_collection: { enabled: true },

      consent_collection: {
        promotions: 'auto',
        terms_of_service: 'required',
      },
      custom_text: {
        terms_of_service_acceptance: {
          message: 'Ao pagar aceito os [Termos e Condições](' + siteOrigin + '/termos) e [Política de Privacidade](' + siteOrigin + '/privacidade) da Karmic Node.',
        },
      },

      allow_promotion_codes: true,

      locale: locale === 'en' ? 'en' : 'pt',

      success_url: `${siteOrigin}/?pagamento=sucesso&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${siteOrigin}/?pagamento=cancelado`,

      metadata: {
        source: 'karmic-node-loja',
        items_count: String(items.length),
        has_customization: String(items.some(i => i._customization)),
        locale: locale || 'pt',
      },

      expires_at: Math.floor(Date.now() / 1000) + 30 * 60,
    }

    // Se veio um código promo direto do carrinho, aplica (e remove allow_promotion_codes,
    // pois o Stripe não permite os dois em simultâneo)
    if (promo_code) {
      try {
        const promoCodes = await stripe.promotionCodes.list({ code: promo_code, active: true, limit: 1 })
        if (promoCodes.data.length) {
          sessionConfig.discounts = [{ promotion_code: promoCodes.data[0].id }]
          delete sessionConfig.allow_promotion_codes
        }
      } catch (e) {
        console.error('[checkout] Erro ao aplicar promo_code:', e?.message || e)
        // continua sem o desconto em vez de falhar o checkout todo
      }
    }

    const session = await stripe.checkout.sessions.create(sessionConfig)

    return res.status(200).json({
      url: session.url,
      session_id: session.id,
    })

  } catch (err) {
    console.error('[Stripe checkout] Erro:', err)
    return res.status(500).json({
      error: err.message || 'Erro ao criar sessão de pagamento',
      code: err.code,
    })
  }
}
