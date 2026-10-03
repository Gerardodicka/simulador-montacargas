// DICKA Play · Base de datos compartida de resultados (Netlify Blobs)
// GET  /.netlify/functions/results            → { ok, count, results:[...] }
// POST /.netlify/functions/results  body: { results:[...] } → inserta sin duplicar (clave Fecha+No.empleado+Curso+Score)
// POST /.netlify/functions/results  body: { op:'setTipo', key, tipo }  → marca un registro como oficial/prueba
import { getStore } from "@netlify/blobs";

const STORE = "dicka-play", KEY = "results-v1";
const resultKey = r => { const f = String(r.fecha || "").trim(); const d = new Date(f);
  return [isNaN(d.getTime()) ? f : d.toISOString(), String(r.num || r.nombre || "").trim().toLowerCase(), String(r.juego || "").trim().toLowerCase(), String(r.score || "").replace(/\s+/g, "")].join("|"); };
const valid = r => r && r.juego && r.fecha && !isNaN(new Date(r.fecha).getTime()) && /\d+\s*\/\s*\d+/.test(String(r.score || ""));
const json = (status, body) => new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store", "access-control-allow-origin": "*", "access-control-allow-headers": "content-type", "access-control-allow-methods": "GET,POST,OPTIONS" } });

export default async (req) => {
  if (req.method === "OPTIONS") return json(204, {});
  const store = getStore(STORE);
  let data = (await store.get(KEY, { type: "json" })) || { results: [], updated_at: null };
  if (req.method === "GET") return json(200, { ok: true, count: data.results.length, updated_at: data.updated_at, results: data.results });
  if (req.method === "POST") {
    let body; try { body = await req.json(); } catch { return json(400, { ok: false, error: "JSON inválido" }); }
    if (body.op === "setTipo") { const r = data.results.find(x => resultKey(x) === body.key); if (!r) return json(404, { ok: false, error: "no encontrado" }); r.tipo_sesion = body.tipo === "prueba" ? "prueba" : "oficial"; data.updated_at = new Date().toISOString(); await store.setJSON(KEY, data); return json(200, { ok: true }); }
    const incoming = Array.isArray(body.results) ? body.results : [];
    const rejected = incoming.filter(r => !valid(r)).length;
    const existing = new Set(data.results.map(resultKey)); let added = 0;
    for (const r of incoming) { if (!valid(r)) continue; const k = resultKey(r); if (existing.has(k)) continue; existing.add(k);
      data.results.push(Object.assign({}, r, { synced_at: new Date().toISOString() })); added++; }
    if (added) { data.updated_at = new Date().toISOString(); await store.setJSON(KEY, data); }
    return json(200, { ok: true, added, rejected, count: data.results.length });
  }
  return json(405, { ok: false, error: "método no permitido" });
};

export const config = { path: "/.netlify/functions/results" };
