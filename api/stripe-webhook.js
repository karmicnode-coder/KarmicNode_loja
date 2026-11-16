// ═══════════════════════════════════════════════════════════════
// KARMIC NODE — POST /api/stripe-webhook
// 1. Verifica a assinatura do Stripe (rejeita tudo o que não venha do Stripe).
// 2. Quando o pagamento está CONFIRMADO, marca a encomenda como paga no Supabase e baixa o stock.
// 3. Envia UM aviso ao dono da loja pelo Formspree (sem morada/telefone/NIF).
// Nunca envia em pagamentos falhados/expirados. Eventos repetidos não geram emails repetidos.
// ═══════════════════════════════════════════════════════════════
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

export const config = { api: { bodyParser: false } }; // o Stripe exige o corpo em bruto

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: '2024-06-20' });
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });
const eur = (c) => new Intl.NumberFormat('pt-PT', { style: 'currency', currency: 'EUR' }).format((c || 0) / 100);
const METHOD_LABEL = { card: 'Cartão', multibanco: 'Multibanco', mb_way: 'MB WAY', paypal: 'PayPal', link: 'Link' };

async function rawBody(req) {
  const chunks = [];
  for await (const ch of req) chunks.push(typeof ch === 'string' ? Buffer.from(ch) : ch);
  return Buffer.concat(chunks);
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  let event;
  try {
    event = stripe.webhooks.constructEvent(await rawBody(req), req.headers['stripe-signature'], process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error('[webhook] assinatura inválida:', err.message);
    return res.status(400).send('Assinatura inválida');
  }

  try {
    const s = event.data.object;
    switch (event.type) {
      case 'checkout.session.completed':
        if (s.payment_status === 'paid') await onPaid(s, event.id);
        else await markOrder(s, { status: 'awaiting_payment' }); // Multibanco: referência gerada, ainda não pago
        break;
      case 'checkout.session.async_payment_succeeded':
        await onPaid(s, event.id);
        break;
      case 'checkout.session.async_payment_failed':
        await markOrder(s, { status: 'payment_failed' });
        break;
      case 'checkout.session.expired':
        await markOrder(s, { status: 'expired' });
        break;
      case 'charge.refunded':
        await supabase.from('orders').update({ status: 'refunded', refunded_at: new Date().toISOString(), refund_amount_cents: s.amount_refunded })
          .eq('stripe_payment_intent', s.payment_intent);
        break;
      default:
        break;
    }
    return res.status(200).json({ received: true });
  } catch (err) {
    console.error('[webhook] erro a processar', event.type, err);
    return res.status(500).json({ error: 'Erro interno' }); // o Stripe volta a tentar
  }
}

function orderNoOf(s) { return (s.metadata && s.metadata.order_no) || s.client_reference_id || null; }

async function markOrder(s, patch) {
  const no = orderNoOf(s);
  if (!no) return;
  await supabase.from('orders').update(patch).eq('order_no', no).neq('status', 'paid');
}

async function onPaid(s, eventId) {
  const no = orderNoOf(s);
  if (!no) { console.error('[webhook] sessão sem order_no', s.id); return; }

  // Método efetivamente usado
  let method = (s.payment_method_types || [])[0] || 'card';
  try {
    if (s.payment_intent) {
      const pi = await stripe.paymentIntents.retrieve(s.payment_intent, { expand: ['latest_charge'] });
      method = (pi.latest_charge && pi.latest_charge.payment_method_details && pi.latest_charge.payment_method_details.type) || method;
    }
  } catch (e) { /* mantém o método por omissão */ }

  // 1. Marcar como paga (só uma vez) — o update condicional garante que eventos repetidos não passam daqui
  const { data: updated, error } = await supabase.from('orders')
    .update({ status: 'paid', paid_at: new Date().toISOString(), stripe_session_id: s.id, stripe_payment_intent: s.payment_intent, total_cents: s.amount_total, payment_method: method, last_event_id: eventId })
    .eq('order_no', no).neq('status', 'paid')
    .select('order_no, customer_email, items, total_cents, created_at, notified_at')
    .maybeSingle();
  if (error) throw error;
  if (!updated) return; // já estava paga → evento repetido, nada a fazer

  // 2. Baixar stock (não bloqueia o aviso se falhar)
  try {
    for (const l of updated.items || []) {
      await supabase.rpc('decrement_stock', { p_sku: l.sku, p_qty: l.qty });
    }
  } catch (e) { console.error('[webhook] stock', e.message); }

  // 3. Aviso ao dono da loja (uma única vez)
  if (updated.notified_at) return;
  const ok = await notifyOwner({ ...updated, method });
  if (ok) await supabase.from('orders').update({ notified_at: new Date().toISOString() }).eq('order_no', no).is('notified_at', null);
}

async function notifyOwner(o) {
  const endpoint = process.env.FORMSPREE_ORDER_ENDPOINT;
  if (!endpoint) { console.warn('[webhook] FORMSPREE_ORDER_ENDPOINT em falta'); return false; }
  const items = o.items || [];
  const pecas = items.map((l) => `${l.qty}× ${[l.name, l.color, l.size && l.size !== 'Único' ? l.size : null].filter(Boolean).join(' · ')} — ${eur(l.unit_cents * l.qty)}${l.note ? ` · ✦ ${l.note}` : ''}`).join('\n');
  const payload = {
    _subject: `Nova encomenda paga · #${o.order_no} · ${eur(o.total_cents)}`,
    _replyto: o.customer_email,
    encomenda: o.order_no,
    data: new Date().toLocaleString('pt-PT', { timeZone: 'Europe/Lisbon' }),
    total: eur(o.total_cents),
    metodo: METHOD_LABEL[o.method] || o.method,
    pecas,
    personalizacao: items.some((l) => l.custom) ? 'Sim — ver o design no painel' : 'Não',
    cliente_email: o.customer_email,
    painel: `${(process.env.ADMIN_URL || '').replace(/\/$/, '')}/encomendas/${o.order_no}`,
  };
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), 8000);
  try {
    const r = await fetch(endpoint, { method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'application/json' }, body: JSON.stringify(payload), signal: ctrl.signal });
    if (!r.ok) { console.error('[webhook] Formspree respondeu', r.status); return false; }
    return true;
  } catch (e) {
    console.error('[webhook] Formspree falhou', e.message); // não faz falhar o webhook
    return false;
  } finally { clearTimeout(t); }
}
