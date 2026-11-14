// ═══════════════════════════════════════════════════════════════
// KARMIC NODE — catálogo server-side (fonte de verdade de preços)
// ═══════════════════════════════════════════════════════════════
// O browser NUNCA é fonte de confiança para preços. api/checkout.js usa
// isto para recalcular o preço de cada item a partir do SKU (catálogo
// embutido, gerado de data/catalog.json) + da personalização pedida
// (técnica de bordado/impressão, nº de elementos, imagem própria — ver
// public/store/studio-engine.js TECH e public/store/studio.js "preço").
// Se o browser mandar um `price` diferente, é ignorado.
// ═══════════════════════════════════════════════════════════════

import { CATALOG_DATA } from './catalog-data.js';

const BY_SKU = new Map(CATALOG_DATA.map(p => [p.sku.toUpperCase(), p]));

// Mesma tabela de preços de personalização que public/store/studio-engine.js
// TECH — tem de ficar sincronizada manualmente se o front mudar preços.
const TECH = {
  emb: { price: 12, extra: 8 },
  print: { price: 8, extra: 6 },
};

export function findBySku(sku) {
  if (!sku) return null;
  return BY_SKU.get(String(sku).toUpperCase()) || null;
}

// Calcula o preço unitário (em cêntimos) de uma linha do carrinho a
// partir do catálogo server-side + da personalização pedida pelo
// cliente — nunca a partir do `item.price` que vem do browser.
//
// item esperado: { sku, qty, customization?: { tech, views: { front:[], back:[] } } }
// Personalização simples (Personalizar): { customization: { extra_cents } } — texto
// bordado tem um acréscimo fixo (+8€) já conhecido e validado aqui também.
export function priceItemCents(item) {
  const product = findBySku(item.sku || item.id);
  if (!product) return null; // SKU desconhecido — rejeitar a linha

  let cents = Math.round(product.price * 100);

  const c = item.customization;
  if (c && c.views) {
    // Estúdio de personalização avançado (studio.js): preço = base + custo
    // por nº de elementos em cada vista + técnica, igual ao cálculo do
    // frontend em studio.js, mas recalculado aqui a partir do que o
    // cliente realmente enviou (não do total que o browser calculou).
    const tech = TECH[c.tech] || TECH.emb;
    const front = (c.views.front || []).length;
    const back = (c.views.back || []).length;
    const hasImg = [].concat(c.views.front || [], c.views.back || []).some(l => l && l.type === 'image');
    const costF = front ? tech.price + Math.max(0, front - 1) * 3 : 0;
    const costB = back ? tech.extra + Math.max(0, back - 1) * 3 : 0;
    cents += Math.round((costF + costB + (hasImg ? 4 : 0)) * 100);
  } else if (c && c.text_extra) {
    // Personalizar simples (store/checkout.js Personalize()): +8€ fixos
    // se houver texto bordado.
    cents += 800;
  }

  return Math.max(0, cents);
}
