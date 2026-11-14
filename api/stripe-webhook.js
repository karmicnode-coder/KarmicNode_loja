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
  // Ir buscar line items (com produtos)
  const items = await stripe.checkout.sessions.listLineItems(session.id, { limit: 100 });

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
