// ═══════════════════════════════════════════════════════════════
// KARMIC NODE — POST /api/checkout
// Cria a sessão do Stripe Checkout. Os PREÇOS SÃO CALCULADOS AQUI (servidor),
// a partir do catálogo (_catalog.js). O preço que vem do navegador é ignorado.
// Responde { url } com a página segura do Stripe.
// ═══════════════════════════════════════════════════════════════
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';
import { CATALOG, SHIPPING, ISLANDS, PROMOS, unitPrice } from './_catalog.js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: '2024-06-20' });
const supabase = process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY
  ? createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } })
  : null;

const SITE = (process.env.SITE_URL || '').replace(/\/$/, '');
const clean = (s, n = 120) => String(s || '').replace(/[\u0000-\u001F\u007F<>]/g, '').replace(/\s+/g, ' ').trim().slice(0, n);
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

// Métodos de pagamento: ativa no painel do Stripe e lista-os aqui (ex.: "card,multibanco,mb_way,paypal")
const METHODS = (process.env.STRIPE_PAYMENT_METHODS || 'card,multibanco').split(',').map((s) => s.trim()).filter(Boolean);

export default async function handler(req, res) {
  // Só a própria loja pode chamar este endpoint
  const origin = req.headers.origin || '';
  if (SITE && origin && origin !== SITE) return res.status(403).json({ error: 'Origem não permitida.' });
  if (SITE) res.setHeader('Access-Control-Allow-Origin', SITE);
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Idempotency-Key');
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Método não permitido.' });

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
    const items = Array.isArray(body.items) ? body.items.slice(0, 30) : [];
    if (!items.length) return res.status(400).json({ error: 'O carrinho está vazio.' });

    const email = clean(body.customer_email, 120).toLowerCase();
    if (!EMAIL_RE.test(email)) return res.status(400).json({ error: 'Email inválido.' });

    // ── 1. Linhas com preço do servidor ──
    let subtotal = 0;
    const lines = [];
    const orderLines = [];
    for (const it of items) {
      const p = CATALOG[it.id];
      if (!p) return res.status(400).json({ error: 'Produto inexistente no carrinho.' });
      const qty = Math.max(1, Math.min(10, parseInt(it.qty, 10) || 1));
      if (typeof p.stock === 'number' && p.stock < qty) return res.status(409).json({ error: `Sem stock suficiente de “${p.name}”.` });
      const color = p.colors.includes(it.color) ? it.color : null;
      const size = p.sizes.includes(it.size) ? it.size : null;
      const unit = unitPrice({ id: it.id, design: it.design });
      const note = clean(it.note, 140);
      subtotal += unit * qty;
      const label = [p.name, color, size && size !== 'Único' ? size : null].filter(Boolean).join(' · ');
      lines.push({
        price_data: {
          currency: 'eur',
          unit_amount: unit,
          product_data: { name: label, description: note ? `Personalização: ${note}`.slice(0, 300) : undefined, metadata: { id: it.id, sku: p.sku } },
        },
        quantity: qty,
      });
      orderLines.push({ id: it.id, sku: p.sku, name: p.name, color, size, qty, unit_cents: unit, note, custom: !!(it.design && it.design.views) });
    }

    // ── 2. Desconto (validado aqui) ──
    let discount = 0, promoCode = null;
    const code = clean(body.promo_code, 24).toUpperCase();
    if (code && PROMOS[code] && subtotal >= PROMOS[code].min_cents) {
      discount = Math.round(subtotal * PROMOS[code].pct / 100);
      promoCode = code;
    }

    // ── 3. Portes ──
    const method = SHIPPING[body.shipping_method] ? body.shipping_method : 'std';
    const region = ['PT', 'PT-M', 'PT-A'].includes(body.country) ? body.country : 'PT';
    const after = subtotal - discount;
    let ship = SHIPPING[method];
    if (method === 'std' && ISLANDS[region]) ship = { ...ship, ...ISLANDS[region], label: 'CTT · ' + ISLANDS[region].label };
    const shipCents = ship.free_from != null && after >= ship.free_from ? 0 : ship.cents;

    // ── 4. Dados do cliente (só para a encomenda; nunca dados de cartão) ──
    const c = body.customer || {};
    const customer = {
      name: clean(c.name, 80), phone: clean(c.phone, 15).replace(/\D/g, ''),
      address: clean(c.address), address2: clean(c.address2), zip: /^\d{4}-\d{3}$/.test(c.zip) ? c.zip : '',
      city: clean(c.city, 60), nif: /^\d{9}$/.test(c.nif || '') ? c.nif : null, newsletter: !!c.newsletter,
    };
    if (method !== 'pickup' && (!customer.address || !customer.zip)) return res.status(400).json({ error: 'Falta a morada de entrega.' });

    // ── 5. Encomenda pendente no Supabase (os dados longos ficam aqui; o Stripe só leva a referência) ──
    const orderNo = 'KN-' + Date.now().toString(36).toUpperCase().slice(-6);
    if (supabase) {
      const { error } = await supabase.from('orders').insert({
        order_no: orderNo, status: 'pending', customer_email: email, customer_name: customer.name,
        shipping_address: method === 'pickup' ? null : { line1: customer.address, line2: customer.address2, zip: customer.zip, city: customer.city, region },
        phone: customer.phone, nif: customer.nif, shipping_method: method, payment_method: clean(body.payment_method, 20),
        items: orderLines, designs: items.map((i) => (i.design && i.design.views ? { id: i.id, design: i.design } : null)).filter(Boolean),
        subtotal_cents: subtotal, discount_cents: discount, shipping_cents: shipCents, total_cents: after + shipCents,
        promo_code: promoCode, newsletter: customer.newsletter, currency: 'eur',
      });
      if (error) console.error('[checkout] insert pending order', error.message);
    }

    // ── 6. Sessão Stripe ──
    const discounts = [];
    if (discount > 0) {
      const coupon = await stripe.coupons.create({ amount_off: discount, currency: 'eur', duration: 'once', name: `Código ${promoCode}`, max_redemptions: 1 });
      discounts.push({ coupon: coupon.id });
    }
    const base = SITE || origin;
    const idem = clean(req.headers['idempotency-key'], 80) || undefined;
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: METHODS,
      line_items: lines,
      discounts,
      customer_email: email,
      locale: 'pt',
      client_reference_id: orderNo,
      shipping_options: [{ shipping_rate_data: { type: 'fixed_amount', display_name: ship.label, fixed_amount: { amount: shipCents, currency: 'eur' } } }],
      phone_number_collection: { enabled: false },
      success_url: `${base}/#/sucesso?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${base}/#/checkout`,
      metadata: { order_no: orderNo, shipping_method: method, region, promo_code: promoCode || '' },
      payment_intent_data: { metadata: { order_no: orderNo } },
      expires_at: Math.floor(Date.now() / 1000) + 60 * 60, // 1 hora
    }, idem ? { idempotencyKey: idem } : undefined);

    if (supabase) await supabase.from('orders').update({ stripe_session_id: session.id }).eq('order_no', orderNo);
    return res.status(200).json({ url: session.url, order_no: orderNo });
  } catch (err) {
    console.error('[checkout]', err);
    const msg = err && err.type === 'StripeIdempotencyError' ? 'Pedido repetido. Recarrega a página e tenta de novo.' : 'Não foi possível iniciar o pagamento.';
    return res.status(500).json({ error: msg });
  }
}
