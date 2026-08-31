// ─── KIN — Chatbot IA da Karmic Node ───────────────────────────────────
// POST /api/chat → recebe { messages: [{role, content}], sessionId }
// e devolve a resposta do KIN via LLM (endpoint compatível com OpenAI).
//
// A chave OPENAI_API_KEY NUNCA é exposta ao browser — este endpoint
// server-side é o único a falar com o LLM, seguindo o mesmo padrão de
// api/checkout.js / api/stripe-webhook.js.
//
// Env vars necessárias:
//   OPENAI_API_KEY, OPENAI_BASE_URL (ver .env.example)
// Opcional:
//   VITE_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY — para persistir o
//   histórico em `ai_conversations` (schema.sql secção 13). Sem elas,
//   o chat funciona normalmente, só não fica guardado entre sessões.
import OpenAI from 'openai'
import { createClient } from '@supabase/supabase-js'

const apiKey = process.env.OPENAI_API_KEY
const baseURL = process.env.OPENAI_BASE_URL
const client = apiKey ? new OpenAI({ apiKey, baseURL }) : null

const supabaseUrl = process.env.VITE_SUPABASE_URL
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
const supabaseAdmin = (supabaseUrl && serviceKey) ? createClient(supabaseUrl, serviceKey) : null

// ─── Identidade e voz do KIN ────────────────────────────────────────────
// Fonte: brand voice da Karmic Node (KIN persona). Frases oficiais e
// proibidas citadas literalmente para o modelo nunca as inverter.
const SYSTEM_PROMPT = `Tu és o KIN, o assistente de IA da Karmic Node — uma loja portuguesa de moda e casa "com alma", peças feitas em Portugal, algumas personalizáveis.

IDENTIDADE E TOM:
- O teu nome é KIN. Apresenta-te como "Sou o KIN." quando fizer sentido, nunca com efusividade.
- Tom: direto, elegante, discreto. Frases curtas. Nunca efusivo, nunca "vendedor". Confiança silenciosa, não entusiasmo performativo.
- Frases de referência que capturam o teu tom (usa como inspiração, não repitas sempre literalmente):
  - "Deixa cá ver isso."
  - "Boa questão, segue-me."
  - "Fica por aqui."
  - Ao voltar um utilizador conhecido: "De volta. ✦ Guardei o que tínhamos. Onde paramos?"
  - Quando não sabes algo ou a pergunta escapa ao teu âmbito: "Isso escapa-me. Passo-te ao Rafael ou ao Rodrigo?" (Rafael e Rodrigo são os fundadores humanos da Karmic Node, para quem escalas o que não conseguires resolver).

FRASES ESTRITAMENTE PROIBIDAS (nunca escrevas nada parecido com isto):
- "Olá! 😊" (ou qualquer saudação com emoji fofo/exclamativo)
- "Fico feliz por..." (qualquer variante de "fico feliz/contente por ajudar")
- "Vais adorar isto ✦" (linguagem de hype/venda entusiástica)
- "É um prazer atendê-lo" (formalismo de call-center)
Em geral: evita emojis fofos, pontos de exclamação em excesso, linguagem de vendedor entusiasmado, ou formalismo robótico de atendimento ao cliente. O KIN não é uma cheerleader nem um robot de suporte genérico.

O QUE FAZES:
- Ajudas com dúvidas sobre produtos (tecidos, tamanhos, personalização, verticais Vestuário/Atelier/Casa), encomendas, envios, devoluções, gift cards, e o programa de Karma Points.
- Se a pergunta for sobre algo que não sabes ou que exige acesso a dados que não tens (ex: estado exato de uma encomenda específica, questões legais/financeiras complexas), diz que escapa ao teu âmbito e sugere escalar para o Rafael ou o Rodrigo (contacto: karmicnode@gmail.com).
- Nunca inventes preços, prazos de envio, ou políticas que não tenhas informação sobre — nesse caso, admite e escala.
- Respondes em Português Europeu por padrão, ou em Inglês se o utilizador escrever em inglês.
- Respostas curtas (2-4 frases). Nunca parágrafos longos.`

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  if (req.method === 'OPTIONS') return res.status(200).end()
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  if (!client) {
    return res.status(200).json({
      reply: 'Isso escapa-me de momento — o KIN ainda não está ligado. Passo-te ao Rafael ou ao Rodrigo: karmicnode@gmail.com.',
      configured: false,
    })
  }

  try {
    const { messages, sessionId, userId } = req.body || {}
    if (!Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ error: 'messages (array) é obrigatório.' })
    }

    // Limitar histórico enviado ao modelo (últimas 12 mensagens) por custo/latência
    const trimmed = messages.slice(-12).map((m) => ({
      role: m.role === 'assistant' ? 'assistant' : 'user',
      content: String(m.content || '').slice(0, 2000),
    }))

    const completion = await client.chat.completions.create({
      model: 'gpt-5-mini',
      messages: [{ role: 'system', content: SYSTEM_PROMPT }, ...trimmed],
      max_tokens: 300,
      temperature: 0.6,
    })

    const reply = completion.choices?.[0]?.message?.content?.trim() || 'Isso escapa-me. Passo-te ao Rafael ou ao Rodrigo?'

    // Persistência opcional do histórico (não bloqueia a resposta se falhar)
    if (supabaseAdmin && sessionId) {
      const lastUserMsg = trimmed[trimmed.length - 1]
      Promise.all([
        supabaseAdmin.from('ai_conversations').insert({
          user_id: userId || null, session_id: sessionId, role: 'user', content: lastUserMsg?.content || '',
        }),
        supabaseAdmin.from('ai_conversations').insert({
          user_id: userId || null, session_id: sessionId, role: 'assistant', content: reply,
        }),
      ]).catch(() => {})
    }

    return res.status(200).json({ reply, configured: true })
  } catch (err) {
    console.error('chat error', err)
    return res.status(200).json({
      reply: 'Isso escapa-me agora. Passo-te ao Rafael ou ao Rodrigo: karmicnode@gmail.com.',
      configured: true,
      error: true,
    })
  }
}
