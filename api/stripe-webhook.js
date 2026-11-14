// ═══════════════════════════════════════════════════════════════
// KARMIC NODE — /api/stripe-webhook
// ═══════════════════════════════════════════════════════════════
// Recebe eventos Stripe: cria order no Supabase, atribui Karma,
// dispara email confirmação, envia pedido para Printful.
// ═══════════════════════════════════════════════════════════════

import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

// Instanciação defensiva — sem isto, faltar QUALQUER env var rebenta o módulo
// inteiro no arranque e o Vercel devolve 500 sem log útil nenhum.
const stripe = process.env.STRIPE_SECRET_KEY
  ? new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: '2024-06-20' })
  : null;
// Supabase é opcional: sem ele a encomenda não fica persistida em BD, mas o
// pagamento Stripe em si continua a funcionar (fica só nos logs + no painel
// Stripe). Mesmo comportamento inerte do resto do projeto (ver .env.example).
const supabase = (process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_KEY)
  ? createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY)
  : null;

export const config = { api: { bodyParser: false } }; // Stripe precisa raw body

async function getRawBody(req) {
  const chunks = [];
  for await (const chunk of req) chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
  return Buffer.concat(chunks);
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  if (!stripe) {
    console.error('[Webhook] STRIPE_SECRET_KEY não configurada no Vercel.');
    return res.status(503).json({ error: 'Stripe não configurado' });
  }

  const sig = req.headers['stripe-signature'];
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    console.error('[Webhook] STRIPE_WEBHOOK_SECRET não configurada no Vercel.');
    return res.status(500).json({ error: 'Webhook secret missing' });
  }
  let event;

  try {
    const rawBody = await getRawBody(req);
    event = stripe.webhooks.constructEvent(rawBody, sig, webhookSecret);
  } catch (err) {
    console.error('[Webhook signature failed]', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object;
        await handleCheckoutCompleted(session);
        break;
      }
      case 'checkout.session.expired': {
        // Opcional: notificar user que a sessão expirou
        break;
      }
      case 'payment_intent.payment_failed': {
        // Opcional: registar falha para análise
        break;
      }
      case 'charge.refunded': {
        const charge = event.data.object;
        await handleRefund(charge);
        break;
      }
      default:
        // Ignorar eventos não relevantes
        break;
    }
    return res.status(200).json({ received: true });
  } catch (error) {
    console.error('[Webhook Handler Error]', error);
    return res.status(500).json({ error: error.message });
  }
}

async function handleCheckoutCompleted(session) {
  // Ir buscar line items COM metadata do produto (sku, cor, tamanho, nota,
  // URLs do design) — sem o expand abaixo, `price.product` vem só como ID e
  // perdíamos toda a informação que api/checkout.js guardou em product_data.metadata.
  const items = await stripe.checkout.sessions.listLineItems(session.id, {
    limit: 100,
    expand: ['data.price.product'],
  });

  const meta = session.metadata || {};
  const userId = meta.user_id !== 'guest' ? meta.user_id : null;

  // 1. Criar order no Supabase
  const { data: order, error: orderErr } = await supabase.from('orders').insert({
    stripe_session_id: session.id,
    stripe_payment_intent: session.payment_intent,
    user_id: userId,
    customer_email: session.customer_details?.email,
    customer_name: session.customer_details?.name,
    shipping_address: session.shipping_details?.address || null,
    billing_address: session.customer_details?.address || null,
    subtotal_cents: parseInt(meta.subtotal_cents || '0'),
    discount_cents: parseInt(meta.discount_cents || '0'),
    shipping_cents: parseInt(meta.shipping_cents || '0'),
    vat_cents: parseInt(meta.vat_cents || '0'),
    total_cents: session.amount_total,
    currency: session.currency,
    status: 'paid',
    payment_method: session.payment_method_types?.[0] || 'card',
    items: items.data.map(li => ({
      name: li.description,
      quantity: li.quantity,
      price_cents: li.price?.unit_amount,
    })),
    promo_code: meta.promo_code || null,
  }).select().single();

  if (orderErr) console.error('[Order insert error]', orderErr);

  // 2. Encomenda completa: um order_items por linha, com cor, tamanho, nota e
  // o design (JSON + PNG, já no Storage — nunca base64, ver api/checkout.js),
  // e decremento de stock por SKU (problema #3 do pacote). A linha de portes
  // não tem metadata.sku (é um custo, não um produto) — ignora-se aqui.
  if (order && supabase) {
    for (const li of items.data) {
      const productMeta = (li.price?.product && typeof li.price.product === 'object') ? (li.price.product.metadata || {}) : {};
      const sku = productMeta.sku;
      if (!sku) continue; // linha de portes ou produto sem SKU — não é um artigo da encomenda

      const variantParts = [productMeta.color, productMeta.size].filter(Boolean);
      const { error: itemErr } = await supabase.from('order_items').insert({
        order_id: order.id,
        product_sku: sku,
        product_name: li.description || sku,
        product_image: productMeta.design_png_url || null,
        variant: variantParts.join(' · ') || null,
        quantity: li.quantity || 1,
        unit_price_cents: li.price?.unit_amount || 0,
        total_cents: (li.price?.unit_amount || 0) * (li.quantity || 1),
        custom_design: {
          color: productMeta.color || null,
          size: productMeta.size || null,
          note: productMeta.note || null,
          design_json_url: productMeta.design_json_url || null,
          design_png_url: productMeta.design_png_url || null,
        },
        source: 'manual',
      });
      if (itemErr) console.error('[order_items insert error]', sku, itemErr);

      // Baixar stock — ignora em silêncio se a função RPC ou o SKU não existirem
      // (mesmo padrão defensivo do resto do projeto: nunca rebenta a encomenda
      // já paga por causa disto).
      const { error: stockErr } = await supabase.rpc('decrement_product_stock', {
        p_sku: sku,
        p_qty: li.quantity || 1,
      });
      if (stockErr) console.warn('[decrement_product_stock indisponível, a ignorar]', sku, stockErr.message);
    }
  }

  // Karma Points: a loja não mostra karma na interface (problema #11 do pacote).
  // Só atribui pontos se a função RPC existir no Supabase; ignora em silêncio se não existir.
  if (userId) {
    const pointsEarned = 100 + Math.floor(session.amount_total / 100);
    const { error: karmaErr } = await supabase.rpc('award_karma', {
      p_user_id: userId,
      p_action: 'purchase',
      p_points: pointsEarned,
      p_metadata: { order_id: order?.id, amount: session.amount_total },
    });
    if (karmaErr) console.warn('[award_karma indisponível, a ignorar]', karmaErr.message);
  }

  // Disparar email de confirmação
  try {
    await fetch(`${process.env.SITE_URL}/api/create-order-email`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ order_id: order?.id }),
    });
  } catch (e) {
    console.error('[Email dispatch failed]', e);
  }

  // Enviar para Printful (se items customizados) — nome de rota real do ficheiro (problema #1 do pacote)
  try {
    await fetch(`${process.env.SITE_URL}/api/printful-create-order`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ order_id: order?.id }),
    });
  } catch (e) {
    console.error('[Printful dispatch failed]', e);
  }
}

async function handleRefund(charge) {
  await supabase.from('orders').update({
    status: 'refunded',
    refunded_at: new Date().toISOString(),
    refund_amount_cents: charge.amount_refunded,
  }).eq('stripe_payment_intent', charge.payment_intent);
}
