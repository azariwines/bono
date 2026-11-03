// Vercel Serverless Function: POST /api/ask  { question, context, history }
// Requiere la variable de entorno ANTHROPIC_API_KEY en Vercel (Settings → Environment Variables).
export const config = { maxDuration: 60 };
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' });
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) return res.status(500).json({ error: 'Falta ANTHROPIC_API_KEY en las variables de entorno de Vercel.' });
  let body = req.body;
  if (typeof body === 'string') { try { body = JSON.parse(body); } catch { body = {}; } }
  const { question = '', context = '', history = [] } = body || {};
  if (!question.trim()) return res.status(400).json({ error: 'Pregunta vacía' });

  const system = `Sos el asistente interno de ventas de Azari Wines (distribuidora de vinos, Argentina). Ayudás a los vendedores Franco, Ezequiel y Elias a organizarse para cumplir el bono grupal por etiquetas.
Reglas del bono: cada etiqueta tiene un objetivo de cajas en el mes; sólo paga su comisión cuando se completa el objetivo; la comisión global se divide en 3 partes iguales. "$/caja" = comisión de la etiqueta dividida por las cajas que faltan: indica qué conviene vender primero.
Respondé SOLO con los datos del contexto que te paso (etiquetas, objetivos, avance, precios, clientes). Si algo no está en los datos, decilo claramente y no lo inventes. Sé concreto y breve, en español rioplatense, con números en formato argentino ($1.234). Cuando recomiendes, priorizá por $/caja y por cercanía a completar, y nombrá clientes concretos (con teléfono) cuando estén en el contexto. Usá listas cortas; sin encabezados grandes.`;

  const messages = [];
  for (const m of (Array.isArray(history) ? history : []).slice(-8)) {
    if (m && (m.role === 'user' || m.role === 'assistant') && typeof m.content === 'string') messages.push({ role: m.role, content: m.content });
  }
  messages.push({ role: 'user', content: `DATOS ACTUALES (contexto):\n${String(context).slice(0, 400000)}\n\nPREGUNTA: ${question}` });

  try {
    const r = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-api-key': key, 'anthropic-version': '2023-06-01' },
      body: JSON.stringify({ model: process.env.ANTHROPIC_MODEL || 'claude-sonnet-5-5', max_tokens: 1200, system, messages })
    });
    const data = await r.json();
    if (!r.ok) return res.status(r.status).json({ error: data?.error?.message || 'Error de la API' });
    const text = (data.content || []).filter(c => c.type === 'text').map(c => c.text).join('\n');
    return res.status(200).json({ answer: text });
  } catch (e) {
    return res.status(500).json({ error: String(e) });
  }
}
