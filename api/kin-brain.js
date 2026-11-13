// ═══════════════════════════════════════════════════════════════
// API ROUTE: /api/kin-brain
// ═══════════════════════════════════════════════════════════════
// Vercel serverless function — proxy para providers de LLM.
// API keys ficam SEMPRE server-side (nunca expostas ao browser).
//
// PROVIDERS SUPORTADOS:
//   - groq      (recomendado: grátis 6k req/dia · ultra rápido)
//   - openai    (pago: melhor qualidade PT, fine-tuning disponível)
//   - anthropic (pago: melhor escrita longa)
//   - mistral   (grátis limitado: 100% europeu, GDPR-first)
//
// USAGE: POST /api/kin-brain
// Body: { provider, systemPrompt, userMessage, history }
// Response: { text }
//
// ENV VARS necessárias no Vercel (só a que usares):
//   GROQ_API_KEY=gsk_...                (https://console.groq.com)
//   OPENAI_API_KEY=sk-...               (https://platform.openai.com)
//   ANTHROPIC_API_KEY=sk-ant-...        (https://console.anthropic.com)
//   MISTRAL_API_KEY=...                 (https://console.mistral.ai)
// ═══════════════════════════════════════════════════════════════

export default async function handler(req, res) {
  // CORS (permite chamadas de qualquer origem se hosted separado)
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { provider = 'groq', systemPrompt, userMessage, history = [] } = req.body || {};

  if (!systemPrompt || !userMessage) {
    return res.status(400).json({ error: 'Missing systemPrompt or userMessage' });
  }

  try {
    let text = '';

    // ─────────────────────────────────────────
    // GROQ (default recomendado — grátis + rápido)
    // ─────────────────────────────────────────
    if (provider === 'groq') {
      const apiKey = process.env.GROQ_API_KEY;
      if (!apiKey) {
        return res.status(500).json({
          error: 'GROQ_API_KEY not configured. Setup in Vercel env vars.',
          setup: 'https://console.groq.com/keys',
        });
      }

      const messages = [
        { role: 'system', content: systemPrompt },
        ...history.slice(-6),
        { role: 'user', content: userMessage },
      ];

      const r = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: 'llama-3.3-70b-versatile',  // melhor modelo grátis do Groq
          messages,
          max_tokens: 500,
          temperature: 0.6,
          top_p: 0.9,
        }),
      });
      if (!r.ok) {
        const errText = await r.text();
        return res.status(r.status).json({ error: 'Groq API error', detail: errText.slice(0, 200) });
      }
      const data = await r.json();
      text = data.choices?.[0]?.message?.content || '';
    }

    // ─────────────────────────────────────────
    // OPENAI (GPT-4o mini — melhor qualidade barata)
    // ─────────────────────────────────────────
    else if (provider === 'openai') {
      const apiKey = process.env.OPENAI_API_KEY;
      if (!apiKey) return res.status(500).json({ error: 'OPENAI_API_KEY not configured', setup: 'https://platform.openai.com/api-keys' });

      const messages = [
        { role: 'system', content: systemPrompt },
        ...history.slice(-6),
        { role: 'user', content: userMessage },
      ];

      const r = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages,
          max_tokens: 500,
          temperature: 0.6,
        }),
      });
      if (!r.ok) {
        const errText = await r.text();
        return res.status(r.status).json({ error: 'OpenAI API error', detail: errText.slice(0, 200) });
      }
      const data = await r.json();
      text = data.choices?.[0]?.message?.content || '';
    }

    // ─────────────────────────────────────────
    // ANTHROPIC (Claude 3.5 Haiku — melhor escrita)
    // ─────────────────────────────────────────
    else if (provider === 'anthropic') {
      const apiKey = process.env.ANTHROPIC_API_KEY;
      if (!apiKey) return res.status(500).json({ error: 'ANTHROPIC_API_KEY not configured', setup: 'https://console.anthropic.com/settings/keys' });

      const r = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model: 'claude-3-5-haiku-20241022',
          max_tokens: 500,
          system: systemPrompt,
          messages: [
            ...history.slice(-6),
            { role: 'user', content: userMessage },
          ],
        }),
      });
      if (!r.ok) {
        const errText = await r.text();
        return res.status(r.status).json({ error: 'Anthropic API error', detail: errText.slice(0, 200) });
      }
      const data = await r.json();
      text = data.content?.[0]?.text || '';
    }

    // ─────────────────────────────────────────
    // MISTRAL (europeu, GDPR-first)
    // ─────────────────────────────────────────
    else if (provider === 'mistral') {
      const apiKey = process.env.MISTRAL_API_KEY;
      if (!apiKey) return res.status(500).json({ error: 'MISTRAL_API_KEY not configured', setup: 'https://console.mistral.ai/api-keys' });

      const messages = [
        { role: 'system', content: systemPrompt },
        ...history.slice(-6),
        { role: 'user', content: userMessage },
      ];

      const r = await fetch('https://api.mistral.ai/v1/chat/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
        body: JSON.stringify({
          model: 'mistral-small-latest',
          messages,
          max_tokens: 500,
          temperature: 0.6,
        }),
      });
      if (!r.ok) {
        const errText = await r.text();
        return res.status(r.status).json({ error: 'Mistral API error', detail: errText.slice(0, 200) });
      }
      const data = await r.json();
      text = data.choices?.[0]?.message?.content || '';
    }

    else {
      return res.status(400).json({ error: 'Unknown provider: ' + provider, valid: ['groq', 'openai', 'anthropic', 'mistral'] });
    }

    return res.status(200).json({ text, provider });
  } catch (e) {
    console.error('[KIN Brain]', e);
    return res.status(500).json({ error: e.message || 'AI request failed' });
  }
}
