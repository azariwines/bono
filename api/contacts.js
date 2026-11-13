// Vercel Serverless Function: /api/contacts
// Registro compartido de "contactados" guardado en Airtable (tabla "Contactos Bono").
// Variables de entorno en Vercel: AIRTABLE_TOKEN (obligatoria), AIRTABLE_BASE y AIRTABLE_TABLE (opcionales).
//   GET  /api/contacts?mes=Noviembre%202026        → lista de contactos del mes
//   POST /api/contacts  { action:'add', key, cid, etiqueta, vendedor, mes }
//   POST /api/contacts  { action:'remove', key }
export const config = { maxDuration: 30 };

const BASE = process.env.AIRTABLE_BASE || 'applCwqDv9sbZn3NM';
const TABLE = process.env.AIRTABLE_TABLE || 'tbl8ziZDZj78w0vZQ';
const F = { clave: 'Clave', cliente: 'Cliente', etiqueta: 'Etiqueta', vendedor: 'Vendedor', fecha: 'Fecha', mes: 'Mes', resultado: 'Resultado' };

async function at(path, opts = {}) {
  const r = await fetch(`https://api.airtable.com/v0/${BASE}/${TABLE}${path}`, {
    ...opts,
    headers: { 'Authorization': `Bearer ${process.env.AIRTABLE_TOKEN}`, 'Content-Type': 'application/json', ...(opts.headers || {}) }
  });
  const data = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(data?.error?.message || data?.error?.type || `Airtable HTTP ${r.status}`);
  return data;
}
const esc = s => String(s).replace(/'/g, "\\'");

async function findByKey(key) {
  const d = await at(`?filterByFormula=${encodeURIComponent(`{${F.clave}}='${esc(key)}'`)}&maxRecords=1`);
  return d.records?.[0] || null;
}
function toItem(rec) {
  const f = rec.fields || {};
  return { key: f[F.clave], cid: (f[F.cliente] || [])[0] || null, etiqueta: f[F.etiqueta] || '', v: f[F.vendedor] || 'Equipo', t: f[F.fecha] || rec.createdTime, resultado: f[F.resultado] || 'Contactado', id: rec.id };
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Cache-Control', 'no-store');
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (!process.env.AIRTABLE_TOKEN) return res.status(500).json({ error: 'Falta AIRTABLE_TOKEN en las variables de entorno de Vercel.' });

  try {
    if (req.method === 'GET') {
      const mes = String(req.query?.mes || '');
      const items = []; let offset = '';
      do {
        const q = new URLSearchParams({ pageSize: '100' });
        if (mes) q.set('filterByFormula', `{${F.mes}}='${esc(mes)}'`);
        if (offset) q.set('offset', offset);
        const d = await at('?' + q.toString());
        (d.records || []).forEach(r => items.push(toItem(r)));
        offset = d.offset || '';
      } while (offset);
      return res.status(200).json({ items });
    }
    if (req.method === 'POST') {
      let body = req.body; if (typeof body === 'string') { try { body = JSON.parse(body); } catch { body = {}; } }
      const { action, key, cid, etiqueta, vendedor, mes } = body || {};
      if (!key) return res.status(400).json({ error: 'Falta key' });
      const existing = await findByKey(key);
      if (action === 'remove') {
        if (existing) await at(`/${existing.id}`, { method: 'DELETE' });
        return res.status(200).json({ ok: true, removed: !!existing });
      }
      if (action === 'add') {
        if (existing) return res.status(200).json({ ok: true, item: toItem(existing), existed: true });
        const fields = { [F.clave]: key, [F.etiqueta]: String(etiqueta || '').slice(0, 250), [F.vendedor]: vendedor || 'Equipo', [F.fecha]: new Date().toISOString(), [F.mes]: mes || '', [F.resultado]: 'Contactado' };
        if (cid && /^rec[A-Za-z0-9]{14}$/.test(cid)) fields[F.cliente] = [cid];
        const d = await at('', { method: 'POST', body: JSON.stringify({ records: [{ fields }], typecast: true }) });
        return res.status(200).json({ ok: true, item: toItem(d.records[0]) });
      }
      return res.status(400).json({ error: 'action inválida' });
    }
    return res.status(405).json({ error: 'Método no permitido' });
  } catch (e) {
    return res.status(500).json({ error: String(e.message || e) });
  }
}
