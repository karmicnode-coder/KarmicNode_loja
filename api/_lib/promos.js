// ═══════════════════════════════════════════════════════════════
// KARMIC NODE — lista de promoções (fonte única, partilhada)
// ═══════════════════════════════════════════════════════════════
// Usada por api/checkout.js (aplicar desconto na sessão Stripe) e
// api/promo-validate.js (validação ao vivo no checkout, antes de pagar).
// Tem de estar sempre alinhada com public/store/core.js PROMOS — se
// mudares um código aqui, muda também lá (e vice-versa).
// ═══════════════════════════════════════════════════════════════

export const PROMOS = {
  WELCOME10: { discount_percent: 10, min_cents: 3000, label: '10% de boas-vindas' },
  KARMIC15: { discount_percent: 15, min_cents: 8000, label: '15% em compras acima de 80 €' },
};

export function validatePromoCode(code, subtotal_cents) {
  if (!code) return { valid: false, error: 'Escreve um código.' };
  const normalized = String(code).trim().toUpperCase();
  const p = PROMOS[normalized];
  if (!p) return { valid: false, error: 'Código inválido' };
  if (p.min_cents && subtotal_cents < p.min_cents) {
    return { valid: false, error: `Mínimo €${(p.min_cents / 100).toFixed(2)} para este código` };
  }
  const discount_cents = Math.round(subtotal_cents * p.discount_percent / 100);
  return { valid: true, discount_cents, code: normalized, name: p.label, ...p };
}
