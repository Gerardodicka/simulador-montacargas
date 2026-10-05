// DICKA Play · Sincronización automática de resultados desde cada curso
// Al terminar un curso el resultado se guarda en el equipo (localStorage) y este script lo sube a la base compartida
// (/.netlify/functions/results) en cuanto puede: al guardarse, cada 30 s, al recuperar internet y al cerrar la página.
// Si no hay conexión queda pendiente y se reintenta solo; nunca se pierde ni se duplica (la nube deduplica por clave).
(function () {
  if (location.protocol === 'file:') return;
  const URL = '/.netlify/functions/results', SENT = 'dicka_synced_keys', KEYS = ['dicka_console_results', 'dicka_evaluaciones', 'dicka_practicas'];
  const rd = k => { try { return JSON.parse(localStorage.getItem(k) || '[]'); } catch (e) { return []; } };
  const resultKey = r => { const f = String(r.fecha || '').trim(); const d = new Date(f); return [isNaN(d.getTime()) ? f : d.toISOString(), String(r.num || r.nombre || '').trim().toLowerCase(), String(r.juego || '').trim().toLowerCase(), String(r.score || '').replace(/\s+/g, '')].join('|'); };
  function collect() { const out = [];   // mismo formato que el portal (index.html → collectResults)
    rd('dicka_evaluaciones').forEach(r => out.push({ juego: 'Montacarga · Evaluación', nombre: r.nombre || 'Operario', num: r.num || '', puesto: r.puesto || '', area: r.area || '', almacen: r.almacen || '', fecha: r.fecha, score: `${r.score}/200`, aprobado: !!r.aprobado }));
    rd('dicka_practicas').forEach(r => out.push({ juego: 'Montacarga · Práctica 3D', nombre: r.nombre || 'Operario', num: r.num || '', puesto: r.puesto || '', area: r.area || '', almacen: r.almacen || '', fecha: r.fecha, score: `${r.score}/100`, aprobado: !!r.aprobado, equipo: r.equipo || '', errores: r.errores || [] }));
    rd('dicka_console_results').forEach(r => out.push(r)); return out; }
  let busy = false;
  async function sync(final) { if (busy && !final) return; const sent = new Set(rd(SENT)); const pend = collect().filter(r => r && r.juego && r.fecha && !r.synced_at && !sent.has(resultKey(r))); if (!pend.length) return;   // synced_at = ya vino de la nube
    busy = true; try { const res = await fetch(URL, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ results: pend }), keepalive: !!final, credentials: 'same-origin' });
      if (res.ok) { const j = await res.json().catch(() => ({})); if (j.ok) { pend.forEach(r => sent.add(resultKey(r))); localStorage.setItem(SENT, JSON.stringify([...sent].slice(-5000))); console.log('[DICKA] ☁️ resultados enviados a la base compartida:', pend.length); } } }
    catch (e) { console.info('[DICKA] sin conexión: el resultado queda pendiente y se reintenta'); } busy = false; }
  // disparar en cuanto el curso guarda un resultado
  const _set = localStorage.setItem.bind(localStorage); try { localStorage.setItem = function (k, v) { _set(k, v); if (KEYS.includes(k)) setTimeout(() => sync(false), 500); }; } catch (e) {}
  addEventListener('load', () => setTimeout(() => sync(false), 1500)); addEventListener('online', () => sync(false)); setInterval(() => sync(false), 30000);
  addEventListener('pagehide', () => sync(true)); document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'hidden') sync(true); });
  window.dickaSync = sync;
})();
