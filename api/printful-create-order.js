// ═══════════════════════════════════════════════════════════════
// KARMIC NODE — /api/printful/create-order
// ═══════════════════════════════════════════════════════════════
// Envia encomenda para Printful (produção sob demanda)
// ═══════════════════════════════════════════════════════════════

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);
const PRINTFUL_API = 'https://api.printful.com';
const PRINTFUL_TOKEN = process.env.PRINTFUL_API_TOKEN;
const PRINTFUL_STORE_ID = process.env.PRINTFUL_STORE_ID;

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  try {
    const { order_id } = req.body;

    // Buscar order
    const { data: order, error } = await supabase.from('orders').select('*').eq('id', order_id).single();
    if (error || !order) return res.status(404).json({ error: 'Order not found' });

    // Só processar items que sejam Printful (com _printful_variant_id ou customização)
    const printfulItems = (order.items || []).filter(i => i.printful_variant_id || i._customization);
    if (printfulItems.length === 0) return res.status(200).json({ ok: true, skipped: true });

    // Construir payload Printful
    const payload = {
      external_id: `KN-${order.id}`,
      shipping: 'STANDARD',
      recipient: {
        name: order.customer_name,
        address1: order.shipping_address?.line1,
        address2: order.shipping_address?.line2,
        city: order.shipping_address?.city,
        state_code: order.shipping_address?.state,
        country_code: order.shipping_address?.country || 'PT',
        zip: order.shipping_address?.postal_code,
        email: order.customer_email,
      },
      items: printfulItems.map(item => ({
        variant_id: item.printful_variant_id,
        quantity: item.quantity,
        files: item._customization?.print_files || [],
        options: item._customization?.print_options || [],
        name: item.name,
        retail_price: (item.price_cents / 100).toFixed(2),
      })),
      retail_costs: {
        currency: 'EUR',
        subtotal: (order.subtotal_cents / 100).toFixed(2),
        discount: (order.discount_cents / 100).toFixed(2),
        shipping: (order.shipping_cents / 100).toFixed(2),
        tax: (order.vat_cents / 100).toFixed(2),
      },
      packing_slip: {
        email: 'karmicnode@gmail.com',
        phone: '',
        message: 'Obrigado por escolheres a Karmic Node ✦',
        logo_url: 'https://karmicnode.pt/assets/logo-karmic-node.png',
        store_name: 'Karmic Node',
      },
    };

    // Chamar Printful
    const response = await fetch(`${PRINTFUL_API}/orders`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${PRINTFUL_TOKEN}`,
        'X-PF-Store-Id': PRINTFUL_STORE_ID,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const result = await response.json();
    if (!response.ok) throw new Error(result.error?.message || 'Printful error');

    // Guardar printful_order_id no Supabase
    await supabase.from('orders').update({
      printful_order_id: result.result?.id,
      printful_status: result.result?.status,
      fulfillment_at: new Date().toISOString(),
    }).eq('id', order_id);

    return res.status(200).json({ ok: true, printful_id: result.result?.id });
  } catch (error) {
    console.error('[Printful Error]', error);
    return res.status(500).json({ error: error.message });
  }
}
