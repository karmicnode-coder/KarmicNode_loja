// ═══════════════════════════════════════════════════════════════
// KARMIC NODE — /api/printful/mockup
// ═══════════════════════════════════════════════════════════════
// Gera mockup foto-realista de um design personalizado
// ═══════════════════════════════════════════════════════════════

const PRINTFUL_API = 'https://api.printful.com';
const PRINTFUL_TOKEN = process.env.PRINTFUL_API_TOKEN;

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  try {
    const { product_id, variant_ids, design_url, position = 'front' } = req.body;

    // 1. Criar task de mockup generation
    const createRes = await fetch(`${PRINTFUL_API}/mockup-generator/create-task/${product_id}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${PRINTFUL_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        variant_ids,
        format: 'jpg',
        files: [
          {
            placement: position,
            image_url: design_url,
            position: {
              area_width: 1800,
              area_height: 2400,
              width: 1800,
              height: 1800,
              top: 300,
              left: 0,
            },
          },
        ],
      }),
    });

    const task = await createRes.json();
    if (!createRes.ok) throw new Error(task.error?.message || 'Task creation failed');

    const taskKey = task.result.task_key;

    // 2. Polling até estar pronto (máx 30s)
    let mockups = null;
    for (let i = 0; i < 30; i++) {
      await new Promise(r => setTimeout(r, 1000));
      const checkRes = await fetch(`${PRINTFUL_API}/mockup-generator/task?task_key=${taskKey}`, {
        headers: { 'Authorization': `Bearer ${PRINTFUL_TOKEN}` },
      });
      const check = await checkRes.json();
      if (check.result?.status === 'completed') {
        mockups = check.result.mockups;
        break;
      }
      if (check.result?.status === 'failed') throw new Error('Mockup generation failed');
    }

    if (!mockups) throw new Error('Mockup generation timeout');

    return res.status(200).json({ ok: true, mockups });
  } catch (error) {
    console.error('[Mockup Error]', error);
    return res.status(500).json({ error: error.message });
  }
}
