// ═══════════════════════════════════════════════════════════════
// KARMIC NODE — /api/checkout-session
// ═══════════════════════════════════════════════════════════════
// Confirma o resultado real de uma Stripe Checkout Session depois do
// cliente ser redirecionado de volta (?session_id=...). A página de
// sucesso do frontend (store/checkout.js → Success) chama isto para
// mostrar uma confirmação baseada em dados reais do Stripe, não em
// algo que o browser inventou sozinho antes de pagar.
// ═══════════════════════════════════════════════════════════════

import Stripe from 'stripe';

const stripe = process.env.STRIPE_SECRET_KEY
  ? new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: '2024-06-20' })
  : null;

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  if (!stripe) {
    return res.status(503).json({ error: 'Pagamentos indisponíveis de momento.' });
  }

  try {
    const { session_id } = req.query;
    if (!session_id) return res.status(400).json({ error: 'session_id em falta' });

    const session = await stripe.checkout.sessions.retrieve(session_id, {
      expand: ['line_items', 'payment_intent'],
    });

    if (session.payment_status !== 'paid') {
      return res.status(200).json({ paid: false, status: session.payment_status });
    }

    return res.status(200).json({
      paid: true,
      id: session.id,
      customer_email: session.customer_details?.email || null,
      customer_name: session.customer_details?.name || null,
      shipping_address: session.shipping_details?.address || null,
      payment_method: session.payment_method_types?.[0] || 'card',
      currency: session.currency,
      amount_total: session.amount_total,
      amount_subtotal: session.amount_subtotal,
      total_details: session.total_details || null,
      metadata: session.metadata || {},
      line_items: (session.line_items?.data || []).map(li => ({
        name: li.description,
        quantity: li.quantity,
        amount_total: li.amount_total,
      })),
    });
  } catch (error) {
    console.error('[Checkout Session Error]', error);
    return res.status(500).json({ error: error.message });
  }
}
