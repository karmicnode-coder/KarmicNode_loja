// ═══════════════════════════════════════════════════════════════
// KARMIC NODE — /api/checkout
// ═══════════════════════════════════════════════════════════════
// Cria Stripe Checkout Session multi-método (Card, MBWay, MB, PayPal, Apple, Google)
// Aceita: line_items, delivery_address, promo_code, karma_points_to_redeem
// ═══════════════════════════════════════════════════════════════

import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';
import { priceItemCents } from './_lib/catalog.js';
import { validatePromoCode } from './_lib/promos.js';
import { uploadDesignThumb, uploadDesignJson } from './_lib/supabase-storage.js';

// Instanciação defensiva: se faltar a env var, não rebenta o módulo inteiro
// (o que dava 500 genérico em todas as rotas) — devolve erro claro ao cliente.
const stripe = process.env.STRIPE_SECRET_KEY
  ? new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: '2024-06-20' })
  : null;
// Supabase é opcional aqui — só usado para subir o PNG/JSON do design do
// Estúdio para o Storage antes de criar a sessão Stripe (problema #5 do
// pacote: nunca enviar base64 ao Stripe). Sem Supabase configurado, as linhas
// personalizadas vão para o Stripe sem imagem nenhuma (nunca base64).
const supabase = (process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_KEY)
  ? createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY)
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
      items,              // [{ id, sku, name, price, qty, image, color, size, note, customization? }]
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

    // ── Preço — SEMPRE recalculado no servidor (problema #2 do pacote) ──
    // O `item.price` que vem do browser é IGNORADO por completo: cada linha é
    // recalculada a partir do catálogo server-side (_lib/catalog.js) + da
    // personalização enviada (`item.customization`). Um SKU desconhecido
    // rejeita o pedido inteiro — nunca deixamos passar um preço arbitrário.
    const priced = [];
    for (const item of items) {
      const unit_cents = priceItemCents(item);
      if (unit_cents == null) {
        return res.status(400).json({ error: `Produto desconhecido: ${item.sku || item.id}` });
      }
      priced.push({ ...item, unit_cents });
    }

    let subtotal_cents = 0;
    priced.forEach(item => { subtotal_cents += item.unit_cents * (item.qty || 1); });

    // Aplicar código promo (se válido) — fonte única com api/promo-validate.js
    let discount_cents = 0;
    let promo_applied = null;
    if (promo_code) {
      const promo = validatePromoCode(promo_code, subtotal_cents);
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

    // ── Imagens/design — nunca base64 para o Stripe (problema #5 do pacote) ──
    // Se o item tiver uma miniatura do Estúdio (`item.image`, um data: URL do
    // canvas) e Supabase estiver configurado, sobe-se para o Storage ANTES de
    // criar a sessão e usa-se só o URL público resultante. Sem Supabase (ou
    // se o upload falhar), a linha segue para o Stripe SEM imagem nenhuma —
    // nunca com o base64 em bruto. O JSON completo do design (camadas) sobe
    // também, e o URL fica no metadata da linha para o webhook persistir em
    // order_items.custom_design depois do pagamento.
    const keyBase = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    for (let i = 0; i < priced.length; i++) {
      const item = priced[i];
      const isDataUrl = typeof item.image === 'string' && item.image.startsWith('data:');
      const keyHint = `${keyBase}-${i}`;
      item.image_url = isDataUrl && supabase ? await uploadDesignThumb(supabase, item.image, keyHint) : (isDataUrl ? null : item.image || null);
      item.design_json_url = (item.customization && item.customization.views && supabase)
        ? await uploadDesignJson(supabase, item.customization, keyHint)
        : null;
    }

    // ── Line items Stripe ──
    const line_items = priced.map(item => ({
      price_data: {
        currency: 'eur',
        product_data: {
          name: item.name,
          images: item.image_url ? [item.image_url] : [], // só URL público, nunca base64
          metadata: {
            sku: item.sku || String(item.id),
            color: item.color || '',
            size: item.size || '',
            note: (item.note || '').slice(0, 480),
            design_json_url: item.design_json_url || '',
            design_png_url: item.image_url || '',
          },
        },
        unit_amount: item.unit_cents,
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
    // PayPal, Klarna — só se ativados explicitamente via STRIPE_EXTRA_METHODS
    // (problema #7 do pacote: antes estavam sempre ligados, mesmo sem a conta
    // Stripe os ter ativado, o que rebentava a criação da sessão).
    const ALLOWED_EXTRA = ['klarna', 'paypal'];
    const extraMethods = (process.env.STRIPE_EXTRA_METHODS || '')
      .split(',').map(s => s.trim().toLowerCase()).filter(s => ALLOWED_EXTRA.includes(s));
    payment_method_types.push(...extraMethods);

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
