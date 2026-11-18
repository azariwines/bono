// Vercel Serverless Function: /api/delta
// Trae de Airtable lo nuevo desde la última "foto" embebida en data.js, para que la app
// tenga compradores y clientes al día sin regenerar archivos.
//   GET /api/delta?since=<ISO createdTime>          → ventas creadas después de esa fecha + clientes nuevos
//   GET /api/delta?ids=recA,recB,...                 → datos de clientes puntuales (hasta 50 por llamada)
// Variables de entorno: AIRTABLE_TOKEN (obligatoria), AIRTABLE_BASE (opcional).
export const config = { maxDuration: 30 };

const BASE = process.env.AIRTABLE_BASE || 'applCwqDv9sbZn3NM';
const T_VENTAS = 'tblCrpedq0tb7YHnJ';
const T_CLIENTES = 'tblfFfmxNBaAI6XS4';
const FV = { fecha: 'Fecha de entrega', cliente: 'Cliente', ets: 'Field 0 (from Etiquetas compradas)', vend: 'Vendedor' };
const FC = { tel: 'Teléfono', nombre: 'Nombre y apellido', vip: 'Cliente VIP', compras: 'Total de compras', ultima: 'Última fecha de compra', ltv: 'Valor total de vida' };

async function atList(table, params) {
  const out = []; let offset = '';
  do {
    const q = new URLSearchParams(params); if (offset) q.set('offset', offset);
    const r = await fetch(`https://api.airtable.com/v0/${BASE}/${table}?${q}`, { headers: { Authorization: `Bearer ${process.env.AIRTABLE_TOKEN}` } });
    const d = await r.json().catch(() => ({}));
    if (!r.ok) throw new Error(d?.error?.message || d?.error?.type || `Airtable HTTP ${r.status}`);
    out.push(...(d.records || [])); offset = d.offset || '';
  } while (offset && out.length < 5000);
  return out;
}
const esc = s => String(s).replace(/'/g, "\\'");
const cliObj = r => { const f = r.fields || {}; return { n: f[FC.nombre] || '', t: f[FC.tel] || '', vip: f[FC.vip] === 'Sí', k: f[FC.compras] || 0, u: f[FC.ultima] || '', ltv: f[FC.ltv] || 0 }; };

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  if (!process.env.AIRTABLE_TOKEN) return res.status(500).json({ error: 'Falta AIRTABLE_TOKEN' });
  try {
    const q = req.query || {};
    if (q.ids) {
      const ids = String(q.ids).split(',').filter(x => /^rec[A-Za-z0-9]{14}$/.test(x)).slice(0, 50);
      if (!ids.length) return res.status(200).json({ clients: {} });
      const recs = await atList(T_CLIENTES, { filterByFormula: `OR(${ids.map(i => `RECORD_ID()='${i}'`).join(',')})`, pageSize: '100' });
      const clients = {}; recs.forEach(r => { clients[r.id] = cliObj(r); });
      res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate=86400');
      return res.status(200).json({ clients });
    }
    const since = String(q.since || '');
    if (!/^\d{4}-\d{2}-\d{2}T/.test(since)) return res.status(400).json({ error: 'since inválido' });
    const f = `DATETIME_DIFF(CREATED_TIME(), DATETIME_PARSE('${esc(since)}'), 'seconds') > 0`;
    const [ventas, clientes] = await Promise.all([
      atList(T_VENTAS, { filterByFormula: f, pageSize: '100', 'fields[]': [FV.fecha, FV.cliente, FV.ets, FV.vend] }),
      atList(T_CLIENTES, { filterByFormula: f, pageSize: '100' })
    ]);
    const sales = ventas.map(r => { const x = r.fields || {}; return { id: r.id, d: x[FV.fecha] || r.createdTime.slice(0, 10), v: x[FV.vend] || '', cid: (x[FV.cliente] || [])[0] || null, ets: Array.isArray(x[FV.ets]) ? x[FV.ets] : [] }; });
    const clients = {}; clientes.forEach(r => { clients[r.id] = cliObj(r); });
    res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate=1800');
    return res.status(200).json({ since, now: new Date().toISOString(), sales, clients });
  } catch (e) {
    return res.status(500).json({ error: String(e.message || e) });
  }
}
