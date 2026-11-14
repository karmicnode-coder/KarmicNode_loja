// ═══════════════════════════════════════════════════════════════
// KARMIC NODE — /api/promo/validate
// ═══════════════════════════════════════════════════════════════
// Valida código promocional ou gift card
// ═══════════════════════════════════════════════════════════════

import { createClient } from '@supabase/supabase-js';

// Supabase é opcional aqui — sem ele caímos sempre no FALLBACK_PROMOS abaixo,
// que está alinhado com store/core.js PROMOS e api/checkout.js validatePromo.
const supabase = (process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_KEY)
  ? createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY)
  : null;

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).end();

  try {
    const { code, subtotal_cents = 0, user_id } = req.body;
    if (!code) return res.status(400).json({ valid: false, error: 'No code provided' });

    const normalizedCode = code.trim().toUpperCase();

    // 1. Verificar se é gift card (prefixo GC-) — precisa de Supabase configurado
    if (normalizedCode.startsWith('GC-')) {
      if (!supabase) return res.status(200).json({ valid: false, error: 'Gift cards indisponíveis de momento' });
      const { data: gc } = await supabase.from('gift_cards')
        .select('*').eq('code', normalizedCode).single();
      if (!gc) return res.status(200).json({ valid: false, error: 'Gift card não encontrado' });
      if (gc.balance_cents <= 0) return res.status(200).json({ valid: false, error: 'Gift card sem saldo' });
      if (gc.expires_at && new Date(gc.expires_at) < new Date()) {
        return res.status(200).json({ valid: false, error: 'Gift card expirado' });
      }
      return res.status(200).json({
        valid: true,
        type: 'gift_card',
        discount_cents: Math.min(gc.balance_cents, subtotal_cents),
        balance_remaining: gc.balance_cents - Math.min(gc.balance_cents, subtotal_cents),
        code: normalizedCode,
      });
    }

    // 2. Verificar promo code no Supabase (se configurado)
    const { data: promo } = supabase
      ? await supabase.from('promo_codes').select('*').eq('code', normalizedCode).eq('active', true).maybeSingle()
      : { data: null };

    if (!promo) {
      // Fallback: códigos hardcoded de emergência (podem ser removidos)
      const FALLBACK_PROMOS = {
        'BEMVINDO10': { discount_percent: 10, min_cents: 3000, name: 'Bem-vindo' },
        'KARMIC20': { discount_percent: 20, min_cents: 5000, name: 'Karmic' },
        'FRETEGRATIS': { discount_percent: 0, free_shipping: true, name: 'Portes grátis' },
        'NATAL25': { discount_percent: 25, min_cents: 10000, name: 'Natal' },
        'VOLTA10': { discount_percent: 10, min_cents: 2000, name: 'Volta' },
      };
      const fallback = FALLBACK_PROMOS[normalizedCode];
      if (!fallback) return res.status(200).json({ valid: false, error: 'Código inválido' });
      if (fallback.min_cents && subtotal_cents < fallback.min_cents) {
        return res.status(200).json({
          valid: false,
          error: `Mínimo €${(fallback.min_cents/100).toFixed(2)} para este código`,
        });
      }
      return res.status(200).json({
        valid: true,
        type: 'promo',
        discount_cents: Math.round(subtotal_cents * fallback.discount_percent / 100),
        free_shipping: !!fallback.free_shipping,
        name: fallback.name,
        code: normalizedCode,
      });
    }

    // 3. Validar promo do Supabase
    if (promo.expires_at && new Date(promo.expires_at) < new Date()) {
      return res.status(200).json({ valid: false, error: 'Código expirado' });
    }
    if (promo.max_uses && promo.uses_count >= promo.max_uses) {
      return res.status(200).json({ valid: false, error: 'Código esgotado' });
    }
    if (promo.min_subtotal_cents && subtotal_cents < promo.min_subtotal_cents) {
      return res.status(200).json({
        valid: false,
        error: `Mínimo €${(promo.min_subtotal_cents/100).toFixed(2)} para este código`,
      });
    }
    if (promo.user_specific && user_id && promo.user_id !== user_id) {
      return res.status(200).json({ valid: false, error: 'Código não válido para este utilizador' });
    }

    const discount_cents = promo.discount_type === 'percent'
      ? Math.round(subtotal_cents * promo.discount_value / 100)
      : promo.discount_value;

    return res.status(200).json({
      valid: true,
      type: 'promo',
      discount_cents,
      free_shipping: promo.free_shipping || false,
      name: promo.name,
      code: normalizedCode,
    });
  } catch (error) {
    console.error('[Promo Error]', error);
    return res.status(500).json({ valid: false, error: error.message });
  }
}
