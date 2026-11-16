// ═══════════════════════════════════════════════════════════════
// KARMIC NODE — GET /api/checkout-session?session_id=cs_...
// Usado pela página #/sucesso para mostrar o resultado. Devolve só o mínimo
// (sem morada nem dados pessoais além do email) e só para sessões desta loja.
// ═══════════════════════════════════════════════════════════════
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: '2024-06-20' });

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).end();
  const id = String(req.query.session_id || '');
  if (!/^cs_(test|live)_[A-Za-z0-9]+$/.test(id)) return res.status(400).json({ error: 'Sessão inválida.' });
  try {
    const s = await stripe.checkout.sessions.retrieve(id);
    if (!s.metadata || !s.metadata.order_no) return res.status(404).json({ error: 'Sessão desconhecida.' });
    res.setHeader('Cache-Control', 'no-store');
    return res.status(200).json({
      order_no: s.metadata.order_no,
      status: s.payment_status,            // 'paid' | 'unpaid' (Multibanco à espera) | 'no_payment_required'
      total_cents: s.amount_total,
      email: s.customer_details ? s.customer_details.email : s.customer_email,
    });
  } catch (e) {
    return res.status(404).json({ error: 'Sessão não encontrada.' });
  }
}
