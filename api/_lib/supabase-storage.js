// ═══════════════════════════════════════════════════════════════
// KARMIC NODE — upload de designs personalizados para o Storage
// ═══════════════════════════════════════════════════════════════
// Usado por api/checkout.js (antes de criar a sessão Stripe) para tirar
// imagens base64 do caminho do Stripe e do metadata — nunca se envia
// uma data: URL ao Stripe nem se tenta espremer um PNG inteiro dentro
// dos 500 caracteres de uma chave de metadata.
//
// Bucket esperado: "designs" (público para leitura, só o service_role
// escreve). Ver supabase/schema.sql secção 16 para o criar.
// Sem Supabase configurado, isto devolve sempre null — o checkout
// continua a funcionar, só sem pré-visualização de imagem no Stripe
// nem PNG associado à encomenda em order_items.design_png_url.
// ═══════════════════════════════════════════════════════════════

const BUCKET = 'designs';

function dataUrlToBuffer(dataUrl) {
  const m = /^data:([^;]+);base64,(.+)$/.exec(dataUrl || '');
  if (!m) return null;
  return { contentType: m[1], buffer: Buffer.from(m[2], 'base64') };
}

// Faz upload de um PNG (data: URL vindo do canvas do Estúdio) e devolve o
// URL público, ou null se não for possível (Supabase não configurado,
// string inválida, ou falha no upload — nunca rebenta o checkout por isto).
export async function uploadDesignThumb(supabase, dataUrl, keyHint) {
  if (!supabase || !dataUrl) return null;
  const parsed = dataUrlToBuffer(dataUrl);
  if (!parsed) return null;
  try {
    const path = `thumbs/${keyHint}-${Date.now()}.png`;
    const { error } = await supabase.storage.from(BUCKET).upload(path, parsed.buffer, {
      contentType: parsed.contentType || 'image/png',
      upsert: false,
    });
    if (error) { console.warn('[uploadDesignThumb]', error.message); return null; }
    const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
    return data?.publicUrl || null;
  } catch (e) {
    console.warn('[uploadDesignThumb]', e.message);
    return null;
  }
}

// Faz upload do JSON de design (camadas de texto/gráfico/imagem do
// Estúdio, tal como gerado por public/store/studio.js) como ficheiro à
// parte — pode conter imagens próprias em base64 (layer.type === 'image'),
// que nunca devem ir para o Stripe metadata nem para colunas de texto
// normais em BD. Devolve o URL público, ou null.
export async function uploadDesignJson(supabase, design, keyHint) {
  if (!supabase || !design) return null;
  try {
    const path = `designs/${keyHint}-${Date.now()}.json`;
    const body = Buffer.from(JSON.stringify(design), 'utf8');
    const { error } = await supabase.storage.from(BUCKET).upload(path, body, {
      contentType: 'application/json',
      upsert: false,
    });
    if (error) { console.warn('[uploadDesignJson]', error.message); return null; }
    const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
    return data?.publicUrl || null;
  } catch (e) {
    console.warn('[uploadDesignJson]', e.message);
    return null;
  }
}
