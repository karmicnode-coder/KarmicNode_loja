// ═══════════════════════════════════════════════════════════════
// KARMIC NODE — /api/checkout
// ═══════════════════════════════════════════════════════════════
// Cria Stripe Checkout Session multi-método (Card, MBWay, MB, PayPal, Apple, Google)
// Aceita: line_items, delivery_address, promo_code, karma_points_to_redeem
// ═══════════════════════════════════════════════════════════════

import Stripe from 'stripe';

// Instanciação defensiva: se faltar a env var, não rebenta o módulo inteiro
// (o que dava 500 genérico em todas as rotas) — devolve erro claro ao cliente.
const stripe = process.env.STRIPE_SECRET_KEY
  ? new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: '2024-06-20' })
  : null;

// Cálculo de portes por zona (PT usa os valores da loja — ver store/core.js CFG)
const SHIPPING_RATES = {
  'PT': { name: 'Portugal Continental', price_cents: 495, free_from_cents: 6000, days: '3-6' },
  'PT-M': { name: 'Madeira', price_cents: 795, free_from_cents: 20000, days: '5-8' },
  'PT-A': { name: 'Açores', price_cents: 895, free_from_cents: 20000, days: '5-8' },
  'ES': { name: 'Espanha', price_cents: 695, free_from_cents: 18000, days: '4-7' },
  'FR': { name: 'França', price_cents: 895, free_from_cents: 20000, days: '5-8' },
  'DE': { name: 'Alemanha', price_cents: 995, free_from_cents: 20000, days: '5-9' },
  'IT': { name: 'Itália', price_cents: 995, free_from_cents: 20000, days: '5-9' },
  'GB': { name: 'Reino Unido', price_cents: 1195, free_from_cents: 25000, days: '6-10' },
  'EU': { name: 'Europa (outros)', price_cents: 1295, free_from_cents: 22000, days: '5-10' },
  'WORLD': { name: 'Resto do mundo', price_cents: 1895, free_from_cents: 30000, days: '10-15' },
};

const VAT_RATE = 0.23; // IVA Portugal — já incluído nos preços da loja (ver store/checkout.js "IVA incluído")

export default async function handler(req, res) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  if (!stripe) {
    console.error('[Checkout] STRIPE_SECRET_KEY não configurada no Vercel.');
    return res.status(503).json({ error: 'Pagamentos indisponíveis de momento. Tenta novamente mais tarde.' });
  }

  try {
    const {
      items,              // [{ id, name, price, qty, image, customization? }]
      customer_email,
      country = 'PT',
      promo_code,
      user_id,
      lang = 'pt',
      success_url,
      cancel_url,
    } = req.body;

    if (!items || !items.length) {
      return res.status(400).json({ error: 'No items in cart' });
    }

    // ── Cálculos ──
    let subtotal_cents = 0;
    items.forEach(item => {
      subtotal_cents += Math.round(item.price * 100) * (item.qty || 1);
    });

    // Aplicar código promo (se válido)
    let discount_cents = 0;
    let promo_applied = null;
    if (promo_code) {
      const promo = await validatePromo(promo_code, subtotal_cents);
      if (promo.valid) {
        discount_cents = promo.discount_cents;
        promo_applied = promo;
      }
    }

    // Portes
    const zone = SHIPPING_RATES[country] || SHIPPING_RATES.EU;
    const subtotal_after_discount = subtotal_cents - discount_cents;
    const shipping_cents = subtotal_after_discount >= zone.free_from_cents ? 0 : zone.price_cents;

    // Os preços da loja já incluem IVA (23%) — não se soma por cima (problema #3 do pacote).
    // Calculado só para registo/fatura: preço × 23/123.
    const total_cents = subtotal_after_discount + shipping_cents;
    const vat_cents = Math.round(total_cents * 23 / 123);

    // ── Line items Stripe ──
    const line_items = items.map(item => ({
      price_data: {
        currency: 'eur',
        product_data: {
          name: item.name,
          images: item.image ? [item.image] : [],
          metadata: {
            sku: item.sku || String(item.id),
            customization: item.customization ? JSON.stringify(item.customization).slice(0, 500) : '',
          },
        },
        unit_amount: Math.round(item.price * 100),
      },
      quantity: item.qty || 1,
    }));

    // Adicionar linha de portes (se aplicável)
    if (shipping_cents > 0) {
      line_items.push({
        price_data: {
          currency: 'eur',
          product_data: { name: `Portes — ${zone.name} (${zone.days} dias)` },
          unit_amount: shipping_cents,
        },
        quantity: 1,
      });
    }

    // IVA incluído nos preços — sem linha extra (problema #3 do pacote).

    // ── Métodos de pagamento ──
    // Padrão: card, apple_pay, google_pay (via card)
    const payment_method_types = ['card'];
    // MBWay + Multibanco: só se cliente PT
    if (country.startsWith('PT')) {
      payment_method_types.push('multibanco');
      // MBWay em breve nos payment_method_types quando GA
    }
    // PayPal, Klarna
    payment_method_types.push('paypal', 'klarna');

    // Discounts
    const discounts = [];
    if (discount_cents > 0 && promo_applied) {
      // Criar coupon dinâmico
      const coupon = await stripe.coupons.create({
        amount_off: discount_cents,
        currency: 'eur',
        duration: 'once',
        name: `Promo ${promo_code}`,
      });
      discounts.push({ coupon: coupon.id });
    }

    // ── Criar Session ──
    const session = await stripe.checkout.sessions.create({
      payment_method_types,
      line_items,
      mode: 'payment',
      customer_email,
      success_url: success_url || `${req.headers.origin}/sucesso?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: cancel_url || `${req.headers.origin}/`,
      shipping_address_collection: {
        allowed_countries: ['PT', 'ES', 'FR', 'DE', 'IT', 'GB', 'BE', 'NL', 'LU', 'AT', 'IE', 'SE', 'DK', 'FI'],
      },
      billing_address_collection: 'auto',
      allow_promotion_codes: false, // usamos nossos próprios
      discounts,
      locale: lang === 'en' ? 'en' : 'pt-PT',
      metadata: {
        user_id: user_id || 'guest',
        promo_code: promo_code || '',
        item_count: String(items.length),
        subtotal_cents: String(subtotal_cents),
        discount_cents: String(discount_cents),
        shipping_cents: String(shipping_cents),
        vat_cents: String(vat_cents),
        total_cents: String(total_cents),
      },
      shipping_options: [
        {
          shipping_rate_data: {
            type: 'fixed_amount',
            fixed_amount: { amount: 0, currency: 'eur' }, // Já incluído nos line_items
            display_name: `${zone.name} — ${zone.days} dias`,
            delivery_estimate: {
              minimum: { unit: 'business_day', value: parseInt(zone.days.split('-')[0]) },
              maximum: { unit: 'business_day', value: parseInt(zone.days.split('-')[1]) },
            },
          },
        },
      ],
    });

    return res.status(200).json({
      id: session.id,
      url: session.url,
      totals: {
        subtotal_cents,
        discount_cents,
        shipping_cents,
        vat_cents,
        total_cents,
      },
    });
  } catch (error) {
    console.error('[Checkout Error]', error);
    return res.status(500).json({ error: error.message });
  }
}

// ── Validação de promo (mock — em produção lê do Supabase) ──
// Códigos alinhados com store/core.js PROMOS (problema #5 do pacote).
async function validatePromo(code, subtotal_cents) {
  const MOCK_PROMOS = {
    'WELCOME10': { discount_percent: 10, min_cents: 3000 },
    'KARMIC15': { discount_percent: 15, min_cents: 8000 },
  };
  const p = MOCK_PROMOS[code.toUpperCase()];
  if (!p) return { valid: false };
  if (p.min_cents && subtotal_cents < p.min_cents) return { valid: false, err: 'Valor mínimo não atingido' };
  const discount = p.discount_percent
    ? Math.round(subtotal_cents * p.discount_percent / 100)
    : 0;
  return { valid: true, discount_cents: discount, code, ...p };
}
