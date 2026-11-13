// ═══════════════════════════════════════════════════════════════
// KARMIC NODE — /api/create-order-email
// ═══════════════════════════════════════════════════════════════
// Envia email de confirmação branded via Resend
// ═══════════════════════════════════════════════════════════════

import { Resend } from 'resend';
import { createClient } from '@supabase/supabase-js';

const resend = new Resend(process.env.RESEND_API_KEY);
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  try {
    const { order_id, type = 'confirmation' } = req.body;

    // Buscar order do Supabase
    const { data: order, error } = await supabase.from('orders').select('*').eq('id', order_id).single();
    if (error || !order) return res.status(404).json({ error: 'Order not found' });

    // Template a usar
    const templates = {
      confirmation: buildConfirmationEmail,
      shipped: buildShippedEmail,
      delivered: buildDeliveredEmail,
      karma_earned: buildKarmaEmail,
      welcome: buildWelcomeEmail,
      abandoned_cart: buildAbandonedCartEmail,
    };
    const templateFn = templates[type];
    if (!templateFn) return res.status(400).json({ error: 'Unknown email type' });

    const { subject, html, text } = templateFn(order);

    const result = await resend.emails.send({
      from: process.env.RESEND_FROM || 'Karmic Node <encomendas@karmicnode.com>',
      to: order.customer_email,
      subject,
      html,
      text,
      reply_to: 'karmicnode@gmail.com',
    });

    return res.status(200).json({ ok: true, id: result.id });
  } catch (error) {
    console.error('[Email Error]', error);
    return res.status(500).json({ error: error.message });
  }
}

// ═══════════════════════════════════════════════════════════════
// TEMPLATES DE EMAIL (HTML Premium Karmic Node)
// ═══════════════════════════════════════════════════════════════

const BASE_STYLES = `
  body { margin: 0; padding: 0; background: #0B0B0C; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }
  .container { max-width: 600px; margin: 0 auto; background: #F5F2ED; }
  .header { background: linear-gradient(135deg, #0B0B0C, #1a0d0f); padding: 40px 30px; text-align: center; }
  .logo { font-family: 'Georgia', serif; font-size: 28px; color: #B08D57; letter-spacing: 4px; font-weight: 500; margin: 0; }
  .tagline { color: #B08D5799; font-size: 10px; letter-spacing: 6px; text-transform: uppercase; margin-top: 8px; }
  .content { padding: 40px 30px; color: #0B0B0C; }
  h1 { font-family: 'Georgia', serif; font-size: 30px; font-weight: 500; margin: 0 0 20px; color: #0B0B0C; }
  h2 { font-family: 'Georgia', serif; font-size: 20px; margin: 30px 0 12px; color: #8B1E2D; }
  p { line-height: 1.6; font-size: 15px; margin: 0 0 16px; }
  .btn { display: inline-block; background: #8B1E2D; color: #F5F2ED !important; padding: 14px 32px; text-decoration: none; font-size: 12px; letter-spacing: 3px; text-transform: uppercase; font-weight: 700; margin: 20px 0; }
  .btn-gold { background: #B08D57; color: #0B0B0C !important; }
  .card { background: #ffffff; border: 1px solid #e5ddd0; padding: 24px; margin: 20px 0; }
  .item { display: table; width: 100%; padding: 12px 0; border-bottom: 1px solid #e5ddd0; }
  .item-name { font-weight: 500; }
  .item-details { color: #666; font-size: 13px; margin-top: 4px; }
  .item-price { text-align: right; font-weight: 600; color: #B08D57; }
  .total-row { display: flex; justify-content: space-between; padding: 8px 0; font-size: 14px; }
  .total-row.grand { font-family: 'Georgia', serif; font-size: 22px; font-weight: 600; color: #8B1E2D; border-top: 2px solid #8B1E2D; padding-top: 14px; margin-top: 8px; }
  .footer { background: #0B0B0C; color: #B08D5799; padding: 30px; text-align: center; font-size: 12px; }
  .footer a { color: #B08D57; text-decoration: none; }
  .karma-badge { display: inline-block; background: linear-gradient(135deg, #B08D57, #8B1E2D); color: #fff; padding: 6px 14px; font-size: 11px; letter-spacing: 2px; text-transform: uppercase; font-weight: 700; }
`;

function baseWrapper(subject, contentHtml) {
  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${subject}</title>
<style>${BASE_STYLES}</style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1 class="logo">KARMIC · NODE</h1>
      <p class="tagline">MODA COM ALMA · CARTAXO</p>
    </div>
    <div class="content">
      ${contentHtml}
    </div>
    <div class="footer">
      <p>Karmic Node · Cartaxo, Portugal</p>
      <p><a href="mailto:karmicnode@gmail.com">karmicnode@gmail.com</a> · <a href="${process.env.SITE_URL || 'https://karmicnode.com'}">${(process.env.SITE_URL || 'karmicnode.com').replace(/^https?:\/\//, '')}</a></p>
      <p style="margin-top: 20px; font-size: 10px; letter-spacing: 3px;">© 2026 KARMIC NODE · POWER IN MOTION</p>
    </div>
  </div>
</body>
</html>`;
}

function formatEuro(cents) {
  return `€${(cents / 100).toFixed(2)}`;
}

function buildConfirmationEmail(order) {
  const items = order.items || [];
  const itemsHtml = items.map(i => `
    <div class="item">
      <div style="display: table-cell; width: 70%;">
        <div class="item-name">${i.name}</div>
        <div class="item-details">Quantidade: ${i.quantity}</div>
      </div>
      <div style="display: table-cell; width: 30%;" class="item-price">${formatEuro(i.price_cents * i.quantity)}</div>
    </div>
  `).join('');

  const contentHtml = `
    <h1>Encomenda <em style="color:#B08D57;">confirmada</em>.</h1>
    <p>Olá <strong>${order.customer_name || 'cliente'}</strong>,</p>
    <p>Recebemos o teu pedido <strong>#${String(order.id).slice(0, 8)}</strong>. Vamos começar a preparar tudo com o cuidado que a Karmic Node tem por marca de água.</p>

    <div class="card">
      <h2 style="margin-top:0;">Detalhes da encomenda</h2>
      ${itemsHtml}
      <div style="margin-top: 20px;">
        <div class="total-row"><span>Subtotal</span><span>${formatEuro(order.subtotal_cents)}</span></div>
        ${order.discount_cents > 0 ? `<div class="total-row" style="color:#4caf50;"><span>Desconto (${order.promo_code || 'Promo'})</span><span>-${formatEuro(order.discount_cents)}</span></div>` : ''}
        <div class="total-row"><span>Portes</span><span>${order.shipping_cents === 0 ? 'GRÁTIS' : formatEuro(order.shipping_cents)}</span></div>
        <div class="total-row"><span>IVA (23%)</span><span>${formatEuro(order.vat_cents)}</span></div>
        <div class="total-row grand"><span>Total</span><span>${formatEuro(order.total_cents)}</span></div>
      </div>
    </div>

    <h2>Envio</h2>
    <p><strong>${order.shipping_address?.line1 || ''}</strong><br>
    ${order.shipping_address?.postal_code || ''} ${order.shipping_address?.city || ''}<br>
    ${order.shipping_address?.country || ''}</p>
    <p><em>Prazo estimado: 3-6 dias úteis (Portugal Continental).</em></p>

    <p style="text-align: center;">
      <a href="${process.env.SITE_URL || 'https://karmicnode.com'}/conta" class="btn">Ver encomenda</a>
    </p>

    <p style="margin-top: 30px; color: #666; font-size: 13px;">
      Se tiveres alguma dúvida, responde a este email ou fala com o KIN no site.<br>
      <em>— Rafael & Rodrigo, Karmic Node.</em>
    </p>
  `;

  return {
    subject: `Encomenda confirmada · #${String(order.id).slice(0, 8)}`,
    html: baseWrapper('Encomenda confirmada', contentHtml),
    text: `Encomenda #${String(order.id).slice(0, 8)} confirmada. Total: ${formatEuro(order.total_cents)}. Ver detalhes: ${process.env.SITE_URL || 'https://karmicnode.com'}/conta`,
  };
}

function buildShippedEmail(order) {
  const contentHtml = `
    <h1>A tua encomenda <em style="color:#B08D57;">está a caminho</em>.</h1>
    <p>Olá <strong>${order.customer_name || 'cliente'}</strong>,</p>
    <p>Boas notícias — a tua encomenda <strong>#${String(order.id).slice(0, 8)}</strong> saiu para entrega.</p>
    <div class="card">
      ${order.tracking_number ? `
        <p><strong>Número de tracking:</strong> ${order.tracking_number}</p>
        <p><strong>Transportadora:</strong> ${order.carrier || 'CTT Expresso'}</p>
        <p style="text-align: center; margin-top: 20px;">
          <a href="${order.tracking_url || '#'}" class="btn btn-gold">Seguir encomenda</a>
        </p>
      ` : `<p>Vais receber o número de tracking em breve.</p>`}
    </div>
    <p>Prazo estimado: 3-6 dias úteis.</p>
  `;
  return {
    subject: `A tua encomenda saiu para entrega · #${String(order.id).slice(0, 8)}`,
    html: baseWrapper('Encomenda enviada', contentHtml),
    text: `Encomenda #${String(order.id).slice(0, 8)} enviada.`,
  };
}

function buildDeliveredEmail(order) {
  const contentHtml = `
    <h1>Entregue. <em style="color:#B08D57;">Bom uso.</em></h1>
    <p>Olá <strong>${order.customer_name || 'cliente'}</strong>,</p>
    <p>A tua encomenda <strong>#${String(order.id).slice(0, 8)}</strong> foi entregue. Esperamos que gostes.</p>
    <div class="card">
      <h2 style="margin-top:0;">Podes ajudar-nos?</h2>
      <p>Uma avaliação sincera vale ouro para nós — e ganhas <strong>+25 Karma Points</strong>.</p>
      <p style="text-align: center;">
        <a href="${process.env.SITE_URL || 'https://karmicnode.com'}/ajuda" class="btn">Deixar avaliação</a>
      </p>
    </div>
    <p>Se algo não estiver como esperavas, fala connosco. Resolvemos.</p>
  `;
  return {
    subject: `Entregue · #${String(order.id).slice(0, 8)}`,
    html: baseWrapper('Encomenda entregue', contentHtml),
    text: `Encomenda #${String(order.id).slice(0, 8)} entregue.`,
  };
}

function buildWelcomeEmail(order) {
  const site = process.env.SITE_URL || 'https://karmicnode.com';
  const contentHtml = `
    <h1>Bem-vindo à <em style="color:#B08D57;">Karmic</em>.</h1>
    <p>Olá <strong>${order.customer_name || 'amigo'}</strong>,</p>
    <p>Obrigado por te juntares à Karmic Node.</p>
    <div class="card">
      <h2 style="margin-top:0;">O que fazer agora?</h2>
      <ul style="line-height: 1.8;">
        <li>Explora a <a href="${site}/loja/roupa">Roupa</a></li>
        <li>Vê a secção <a href="${site}/loja/casa">Casa</a></li>
        <li>Personaliza uma peça em <a href="${site}/personalizar">Personalizar</a></li>
      </ul>
    </div>
    <p>Se tiveres perguntas, escreve-nos — respondemos em menos de 24h úteis.</p>
  `;
  return {
    subject: '✦ Bem-vindo à Karmic Node',
    html: baseWrapper('Bem-vindo', contentHtml),
    text: 'Bem-vindo à Karmic Node.',
  };
}

// NOTA: carrinho abandonado fica desligado até haver consentimento RGPD explícito (ver PROMPT_GENSPARK_CODE.md secção 5).
function buildAbandonedCartEmail(order) {
  const site = process.env.SITE_URL || 'https://karmicnode.com';
  const contentHtml = `
    <h1>Deixaste algo <em style="color:#B08D57;">à espera</em>.</h1>
    <p>Notámos que ainda tens itens no carrinho. Continuam lá, sempre que quiseres.</p>
    <div class="card">
      <h2 style="margin-top:0;">Para desbloquear a compra hoje:</h2>
      <p style="text-align: center; font-size: 20px; font-family: Georgia; color: #8B1E2D;">
        Código: <strong>WELCOME10</strong>
      </p>
      <p style="text-align: center;">10% de desconto — compras acima de 30 €.</p>
      <p style="text-align: center;">
        <a href="${site}/loja" class="btn">Voltar à loja</a>
      </p>
    </div>
  `;
  return {
    subject: '10% para completar a tua encomenda',
    html: baseWrapper('Volta e leva 10%', contentHtml),
    text: 'Deixaste itens no carrinho. Código WELCOME10 dá 10% off.',
  };
}
