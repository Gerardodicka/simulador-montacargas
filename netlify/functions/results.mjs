// DICKA Play · Base de datos compartida de resultados (Netlify Blobs)
// v2: un registro por resultado (clave "r/<hash>") → dos equipos que sincronizan al mismo tiempo ya no se sobrescriben.
//     La primera vez migra automáticamente el archivo único anterior ("results-v1") sin borrarlo.
// GET  /.netlify/functions/results            → { ok, count, results:[...] }
// POST /.netlify/functions/results  body: { results:[...] } → inserta sin duplicar (clave Fecha+No.empleado+Curso+Score)
// POST /.netlify/functions/results  body: { op:'setTipo', key, tipo }  → marca un registro como oficial/prueba
import { getStore } from "@netlify/blobs";
import { createHash } from "node:crypto";

const STORE = "dicka-play", LEGACY = "results-v1", MIGRATED = "meta/migrated-v2";
const resultKey = r => { const f = String(r.fecha || "").trim(); const d = new Date(f);
  return [isNaN(d.getTime()) ? f : d.toISOString(), String(r.num || r.nombre || "").trim().toLowerCase(), String(r.juego || "").trim().toLowerCase(), String(r.score || "").replace(/\s+/g, "")].join("|"); };
const blobKey = k => "r/" + createHash("sha1").update(k).digest("hex");
const valid = r => r && r.juego && r.fecha && !isNaN(new Date(r.fecha).getTime()) && /\d+\s*\/\s*\d+/.test(String(r.score || ""));
const json = (status, body) => new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store", "access-control-allow-origin": "*", "access-control-allow-headers": "content-type", "access-control-allow-methods": "GET,POST,OPTIONS" } });

async function migrate(store) { if (await store.get(MIGRATED)) return;
  const old = (await store.get(LEGACY, { type: "json" })) || { results: [] };
  for (let i = 0; i < old.results.length; i += 25) await Promise.all(old.results.slice(i, i + 25).filter(valid).map(r => store.setJSON(blobKey(resultKey(r)), r)));
  await store.set(MIGRATED, new Date().toISOString()); }
async function readAll(store) { const { blobs } = await store.list({ prefix: "r/" }); const out = [];
  for (let i = 0; i < blobs.length; i += 50) { const part = await Promise.all(blobs.slice(i, i + 50).map(b => store.get(b.key, { type: "json" }).catch(() => null))); part.forEach(r => r && out.push(r)); }
  return out; }

export default async (req) => {
  if (req.method === "OPTIONS") return json(204, {});
  const store = getStore(STORE); await migrate(store);
  if (req.method === "GET") { const results = await readAll(store); return json(200, { ok: true, count: results.length, updated_at: new Date().toISOString(), results }); }
  if (req.method === "POST") {
    let body; try { body = await req.json(); } catch { return json(400, { ok: false, error: "JSON inválido" }); }
    if (body.op === "setTipo") { const k = blobKey(String(body.key || "")); const r = await store.get(k, { type: "json" }); if (!r) return json(404, { ok: false, error: "no encontrado" }); r.tipo_sesion = body.tipo === "prueba" ? "prueba" : "oficial"; await store.setJSON(k, r); return json(200, { ok: true }); }
    const incoming = (Array.isArray(body.results) ? body.results : []).slice(0, 500);
    const rejected = incoming.filter(r => !valid(r)).length; let added = 0;
    for (const r of incoming.filter(valid)) { const k = blobKey(resultKey(r)); const meta = await store.getMetadata(k).catch(() => null); if (meta) continue;   // ya existe: no se duplica ni se pisa
      await store.setJSON(k, Object.assign({}, r, { synced_at: new Date().toISOString() })); added++; }
    return json(200, { ok: true, added, rejected });
  }
  return json(405, { ok: false, error: "método no permitido" });
};

export const config = { path: "/.netlify/functions/results" };
