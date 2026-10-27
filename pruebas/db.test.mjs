// DICKA · Pruebas internas de la base de datos de resultados (netlify/functions/results.mjs)
// Corre en cada despliegue de Netlify y en cada PR: si alguna falla, el cambio NO se publica.
// Uso: node pruebas/db.test.mjs   (no toca la base real: usa un almacén en memoria)
import handler, { deps } from '../netlify/functions/results.mjs';

// ---- almacén en memoria con la misma interfaz de @netlify/blobs que usa la función ----
function memStore() { const m = new Map(), meta = new Map();
  return { _m: m,
    async get(k, o) { if (!m.has(k)) return null; const v = m.get(k); return o && o.type === 'json' ? JSON.parse(v) : v; },
    async set(k, v) { m.set(k, String(v)); meta.set(k, {}); },
    async setJSON(k, v) { m.set(k, JSON.stringify(v)); meta.set(k, {}); },
    async getMetadata(k) { return meta.has(k) ? { metadata: {} } : null; },
    async list({ prefix = '' } = {}) { return { blobs: [...m.keys()].filter(k => k.startsWith(prefix)).map(key => ({ key })) }; } }; }
let store; const fresh = () => { store = memStore(); deps.getStore = () => store; };

const URL0 = 'https://simuladordickalogistics.netlify.app/.netlify/functions/results';
const call = async (method, body, raw) => { const r = await handler(new Request(URL0, { method, headers: { 'content-type': 'application/json' }, body: raw !== undefined ? raw : body ? JSON.stringify(body) : undefined })); let j = null; try { j = await r.json(); } catch { } return { status: r.status, j }; };
const R = (o = {}) => Object.assign({ fecha: '2026-10-20T15:00:00.000Z', nombre: 'Operario Prueba', num: '1001', juego: 'Montacarga · Práctica 3D', score: '95 / 100' }, o);

const res = []; const t = async (name, fn) => { try { await fn(); res.push([true, name]); } catch (e) { res.push([false, name, e.message]); } };
const eq = (a, b, m) => { if (JSON.stringify(a) !== JSON.stringify(b)) throw new Error(`${m || ''} esperado ${JSON.stringify(b)}, obtenido ${JSON.stringify(a)}`); };

await t('consulta con base vacía', async () => { fresh(); const r = await call('GET'); eq(r.status, 200); eq(r.j.count, 0); });
await t('inserta resultados válidos', async () => { fresh(); const r = await call('POST', { results: [R(), R({ num: '1002' })] }); eq(r.j.added, 2); eq((await call('GET')).j.count, 2); });
await t('no duplica el mismo resultado', async () => { fresh(); await call('POST', { results: [R()] }); const r = await call('POST', { results: [R(), R()] }); eq(r.j.added, 0); eq((await call('GET')).j.count, 1); });
await t('no sobrescribe un registro existente', async () => { fresh(); await call('POST', { results: [R({ extra: 'original' })] }); await call('POST', { results: [R({ extra: 'pisado' })] }); eq((await call('GET')).j.results[0].extra, 'original'); });
await t('rechaza registros inválidos (sin fecha, fecha mala, score mal formado, sin juego)', async () => { fresh(); const r = await call('POST', { results: [R({ fecha: '' }), R({ fecha: 'no-es-fecha' }), R({ score: 'excelente' }), R({ juego: '' }), R({ num: '7' })] }); eq(r.j.rejected, 4); eq(r.j.added, 1); });
await t('limita a 500 registros por envío', async () => { fresh(); const many = Array.from({ length: 520 }, (_, i) => R({ num: String(5000 + i) })); const r = await call('POST', { results: many }); eq(r.j.added, 500); });
await t('dos equipos sincronizando al mismo tiempo no se pierden registros', async () => { fresh(); await Promise.all([call('POST', { results: [R({ num: 'A1' }), R({ num: 'A2' })] }), call('POST', { results: [R({ num: 'B1' }), R({ num: 'B2' })] })]); eq((await call('GET')).j.count, 4); });
await t('marca un registro como oficial / prueba', async () => { fresh(); await call('POST', { results: [R()] }); const key = (await call('GET')).j.results[0]; const k = [new Date(key.fecha).toISOString(), key.num, key.juego.toLowerCase(), key.score.replace(/\s+/g, '')].join('|');
  const r = await call('POST', { op: 'setTipo', key: k, tipo: 'prueba' }); eq(r.status, 200, 'setTipo'); const t2 = (await call('GET')).j.results[0].tipo_sesion; if (!t2) throw new Error('tipo_sesion no guardado'); });
await t('setTipo de un registro inexistente responde 404', async () => { fresh(); const r = await call('POST', { op: 'setTipo', key: 'no|existe', tipo: 'prueba' }); eq(r.status, 404); });
await t('migra la base anterior (v1) una sola vez y sin duplicar', async () => { fresh(); await store.setJSON('results-v1', { results: [R({ num: 'L1' }), R({ num: 'L2' }), R({ fecha: '' })] }); eq((await call('GET')).j.count, 2); await call('GET'); eq((await call('GET')).j.count, 2); if (!store._m.has('results-v1')) throw new Error('borró la base anterior'); });
await t('JSON inválido responde 400', async () => { fresh(); eq((await call('POST', null, '{malo')).status, 400); });
await t('método no permitido responde 405', async () => { fresh(); eq((await call('PUT', { a: 1 })).status, 405); });
await t('respuestas sin caché', async () => { fresh(); const r = await handler(new Request(URL0)); eq(r.headers.get('cache-control'), 'no-store'); });

let ok = 0; for (const [p, n, e] of res) { console.log(`  ${p ? '✅' : '❌'} ${n}${e ? '  — ' + e : ''}`); if (p) ok++; }
console.log(`\nBase de datos: ${ok}/${res.length} pruebas correctas`); process.exit(ok === res.length ? 0 : 1);
