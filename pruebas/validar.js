// DICKA · Validación automática del Dojo Virtual
// Uso:  npm i --no-save playwright  &&  node pruebas/validar.js
// Revisa: sintaxis de todos los juegos, carga sin errores (escritorio y celular),
// misiones del simulador alcanzables con el contorno real de cada equipo, cámara, distancia de estiba,
// andén / caja del tráiler y tráfico sin atascos. Sale con código 1 si algo falla.
const fs = require('fs'), path = require('path'), { execSync } = require('child_process');
const ROOT = path.resolve(__dirname, '..');
const res = []; const ok = (area, prueba, pasa, detalle = '') => res.push({ area, prueba, pasa, detalle });

// 1 · Sintaxis
const pages = ['index.html', ...fs.readdirSync(path.join(ROOT, 'juegos')).filter(f => f.endsWith('.html')).map(f => 'juegos/' + f)];
for (const f of pages) { const s = fs.readFileSync(path.join(ROOT, f), 'utf8'); let err = '';
  [...s.matchAll(/<script>([\s\S]*?)<\/script>/g)].forEach(m => { try { new Function(m[1]); } catch (e) { err = e.message; } });
  ok('Sintaxis', f, !err, err); }
for (const f of fs.readdirSync(path.join(ROOT, 'juegos/comun')).filter(f => f.endsWith('.js'))) { let err = ''; try { new Function(fs.readFileSync(path.join(ROOT, 'juegos/comun', f), 'utf8')); } catch (e) { err = e.message; } ok('Sintaxis', 'juegos/comun/' + f, !err, err); }
for (const f of fs.readdirSync(path.join(ROOT, 'netlify/functions'))) { let err = ''; try { execSync('node --check ' + JSON.stringify(path.join(ROOT, 'netlify/functions', f)), { stdio: 'pipe' }); } catch (e) { err = String(e.stderr).split('\n')[0]; } ok('Sintaxis', 'netlify/functions/' + f, !err, err); }

(async () => {
  const { chromium } = require('playwright');
  const b = await chromium.launch({ args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--allow-file-access-from-files'] });
  { const skip = () => { try { sessionStorage.setItem('dicka_id_skip', '1'); } catch (e) { } }; const nc = b.newContext.bind(b), np = b.newPage.bind(b);
    b.newContext = async (o) => { const id = o && o.conId; if (o) { o = { ...o }; delete o.conId; } const c = await nc(o); if (!id) await c.addInitScript(skip); return c; }; b.newPage = async (o) => { const c = await b.newContext(o); const pg = await c.newPage(); return pg; }; }
  const url = f => 'file://' + path.join(ROOT, f);

  // 2 · Carga de cada página
  for (const f of pages) for (const vp of [{ width: 1280, height: 720, n: 'escritorio' }, { width: 390, height: 844, n: 'celular' }]) {
    const p = await b.newPage({ viewport: vp }); const errs = []; p.on('pageerror', e => errs.push(e.message));
    await p.goto(url(f)); await p.waitForTimeout(2000);
    const hs = await p.evaluate(() => document.documentElement.scrollWidth > innerWidth + 2);
    ok('Carga', `${f} · ${vp.n}`, !errs.length && !hs, errs[0] || (hs ? 'desplazamiento horizontal' : '')); await p.close(); }

  // 3 · Simulador
  const p = await b.newPage({ viewport: { width: 1280, height: 720 } }); const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.goto(url('juegos/simulador-montacarga.html')); await p.waitForTimeout(1500);
  await p.evaluate(() => { document.querySelectorAll('.screen').forEach(s => s.classList.remove('active')); document.getElementById('simulatorScreen').classList.add('active'); initSimulator(); });
  await p.waitForTimeout(6000);
  const sim = await p.evaluate(() => { const R = [];
    const add = (area, prueba, pasa, detalle = '') => R.push({ area, prueba, pasa, detalle });
    add('Simulador', 'versión visible', /v\d+\.\d+/.test(document.body.innerText), (document.body.innerText.match(/v\d+\.\d+[^\n·]*/) || [''])[0]);
    add('Simulador', '8 misiones definidas', ACTS.length === 8, ACTS.map(a => a.id).join(', '));
    // ¿existe una postura libre (chasis sin chocar) con la punta de las horquillas sobre el objetivo?
    const reachable = (T, model) => { const prev = currentModel; currentModel = model; const sp = spec(); let found = null;
      for (let k = 0; k < 72 && !found; k++) { const a = k * Math.PI / 36; for (let r = 0; r <= sp.reachM + 1e-6 && !found; r += Math.max(0.1, sp.reachM / 4 || 1)) {
        const off = sp.forkZ + 0.5 + r, cx = T.x - Math.sin(a) * off, cz = T.z - Math.cos(a) * off; if (!bodyHits(cx, cz, a)) found = { cx, cz, a }; } }
      currentModel = prev; return found; };
    ACTS.filter(a => a.type === 'move').forEach(a => { ['doublereach', 'reach'].forEach(m => {
      add('Misiones', `${a.id} · tomar tarima · ${FORK_SPECS[m].code}`, !!reachable(a.spawn, m));
      add('Misiones', `${a.id} · dejar tarima · ${FORK_SPECS[m].code}`, !!reachable(a.drop, m)); }); });
    ACTS.filter(a => a.goal).forEach(a => add('Misiones', `${a.id} · meta libre`, !bodyHits(a.goal.x, a.goal.z, 0) || !bodyHits(a.goal.x, a.goal.z, Math.PI / 2)));
    // distancia de estiba: con la punta sobre la ubicación debe decir "en posición"
    const i = ACTS.findIndex(a => a.id === 'rack2'); if (i >= 0) { const a = ACTS[i], pose = reachable(a.drop, currentModel);
      if (pose) { actIdx = i; hasLoad = true; forkPosition.x = pose.cx; forkPosition.z = pose.cz; forkRotation.y = pose.a; forklift.position.copy(forkPosition); forklift.rotation.y = pose.a;
        const sp = spec(); ['reach1', 'reach2'].forEach((id, k) => { const el = document.getElementById(id); if (el && sp.reachStages > k) el.value = 0; });
        const tp = tipPos(); forkPosition.x += a.drop.x - tp.x; forkPosition.z += a.drop.z - tp.z; forklift.position.copy(forkPosition);
        updateMission(); const t = document.getElementById('missionDist').textContent; add('Misiones', 'distancia de estiba llega a "en posición"', /posición/.test(t), t); hasLoad = false; } }
    // andén 3 y caja del tráiler
    const hd = WAREHOUSE.d / 2; Object.keys(FORK_SPECS).forEach(m => { const prev = currentModel; currentModel = m;
      add('Andén', `${FORK_SPECS[m].code} cruza el andén 3`, !bodyHits(0, hd, 0)); add('Andén', `${FORK_SPECS[m].code} dentro de la caja`, !bodyHits(0, TRAILER.z0 + 4, 0)); currentModel = prev; });
    // coleo: girar pegado a una pared debe detectarse
    add('Colisión', 'detecta la parte trasera contra la pared', bodyHits(-WAREHOUSE.w / 2 + 3, -hd + 1.2, 0));
    // seguridad del operador: sin llave, cinturón o con freno no avanza; con todo listo sí
    safeReset(); const g0 = safeGate(1); SAFE.keyOn = true; const g1 = safeGate(1); SAFE.belt = true; const g2 = safeGate(1); SAFE.brake = false; const g3 = safeGate(1);
    add('Seguridad', 'no avanza sin llave / sin cinturón / con freno', g0 === 0 && g1 === 0 && g2 === 0, `${g0},${g1},${g2}`); add('Seguridad', 'avanza con llave, cinturón y freno libre', g3 === 1);
    { document.getElementById('mastHeight').value = 40; const n = faultLog.length; SAFE.cd = {}; safeToggle('key'); add('Seguridad', 'apagar con horquillas arriba marca falta', faultLog.slice(n).some(f => f.code === 'estacionamientoInseguro')); document.getElementById('mastHeight').value = 0; }
    { showChecklist(); const bs = [...document.querySelectorAll('#lotoSteps button')]; const r0 = document.getElementById('lotoRelease').disabled; bs.forEach((b, i) => lotoStep(i + 1, b)); add('Seguridad', 'bloqueo y etiquetado habilita la liberación', r0 && !document.getElementById('lotoRelease').disabled && !!LOTO.tag); document.getElementById('checklist').classList.remove('show'); lotoTag(false); safeReset(); }
    // cámara: un rack entre el equipo y la cámara la acerca
    const L = new THREE.Vector3(-4, 6, -20), T = new THREE.Vector3(-9, 7, -20); camUnblock(L, T, true); add('Cámara', 'no queda detrás de un rack', T.x > -5.6, 'x=' + T.x.toFixed(2));
    return R; });
  sim.forEach(r => res.push(r));
  // Escenario Agave 1: selector, construcción y misiones alcanzables
  { const q = await b.newPage({ viewport: { width: 1100, height: 700 } }); const e3 = []; q.on('pageerror', e => e3.push(e.message));
    await q.goto(url('juegos/simulador-montacarga.html')); await q.waitForTimeout(1500);
    const sel = await q.evaluate(() => { currentUser = { user: '1', name: 'Prueba', num: '1', puesto: 'M', wh: 'Agave 1' }; ['regScreen', 'menuScreen'].forEach(id => document.getElementById(id).classList.add('hidden')); startSimulator(); chooseFork('doublereach'); const t = document.getElementById('forkGrid').innerText; return /Almacén Genérico/.test(t) && /Agave 1/.test(t); });
    ok('Agave 1', 'selector de escenario tras elegir montacargas', sel);
    await q.evaluate(() => pickScenario('doublereach', 'agave1')); await q.waitForTimeout(7000);
    const R = await q.evaluate(() => { const reach = (T, model) => { const prev = currentModel; currentModel = model; const sp = spec(); let ok = false; for (let k = 0; k < 72 && !ok; k++) { const a = k * Math.PI / 36; for (let r = 0; r <= sp.reachM + 1e-6 && !ok; r += Math.max(.1, sp.reachM / 4 || 1)) { const off = sp.forkZ + .5 + r; if (!bodyHits(T.x - Math.sin(a) * off, T.z - Math.cos(a) * off, a)) ok = true; } } currentModel = prev; return ok; };
      let slots = 0, okS = 0; RACK_LAYOUT.xs.forEach((x, i) => ['A', 'B'].forEach(pos => { slots++; if (reach(slotWorld({ rack: i, bay: 4, level: 1, pos }), 'doublereach')) okS++; }));
      const drops = ACTS.filter(a => a.drop && !a.drop.slot).map(a => a.id + ':' + (reach(a.drop, 'doublereach') ? 'ok' : 'X'));
      return { esc: SCENARIO, racks: RACK_LAYOUT.xs.length, aisles: AISLES.length, slots, okS, drops, acts: ACTS.length, spawn: !bodyHits(forkPosition.x, forkPosition.z, forkRotation.y), trailer: !bodyHits(0, TRAILER.z0 + 4, 0) }; });
    ok('Agave 1', 'escenario construido (26 racks, 16 pasillos)', R.esc === 'agave1' && R.racks === 26 && R.aisles === 16, `${R.racks} racks · ${R.aisles} pasillos · ${R.acts} misiones`);
    ok('Agave 1', 'todas las ubicaciones A/B alcanzables (7700)', R.okS === R.slots, `${R.okS}/${R.slots}`);
    ok('Agave 1', 'destinos de piso alcanzables', R.drops.every(d => /ok$/.test(d)), R.drops.join(' '));
    ok('Agave 1', 'arranque libre y caja de tráiler en andén P6', R.spawn && R.trailer);
    ok('Agave 1', 'sin errores de ejecución', !e3.length, e3[0] || ''); await q.close(); }
  // turno-seguro-3d comparte el almacén: debe arrancar sin errores
  { const q = await b.newPage({ viewport: { width: 1280, height: 720 } }); const e2 = []; q.on('pageerror', e => e2.push(e.message));
    await q.goto(url('juegos/turno-seguro-3d.html')); await q.waitForTimeout(1500);
    const st = await q.evaluate(() => { try { document.querySelectorAll('.screen').forEach(s => s.classList.remove('active')); const sc = document.getElementById('simulatorScreen'); if (sc) sc.classList.add('active'); initSimulator(); return 'ok'; } catch (e) { return e.message; } });
    await q.waitForTimeout(6000); const ms = await q.evaluate(() => { let n = 0; scene.traverse(o => { if (o.isMesh) n++; }); return n; });
    ok('Turno seguro 3D', 'arranca el almacén compartido', st === 'ok' && !e2.length && ms > 500, st !== 'ok' ? st : e2[0] || ms + ' objetos'); await q.close(); }
  // Dojo de Mando: la ruta recomendada aprueba y la de evitar el problema no
  { const play = async path => { const q = await b.newPage({ viewport: { width: 1000, height: 700 } }); const e = []; q.on('pageerror', x => e.push(x.message)); await q.goto(url('juegos/dojo-de-mando.html')); await q.waitForTimeout(800);
      const r = await q.evaluate(async path => { const C = s => { const el = document.querySelector(s); if (el && el.offsetParent !== null) { el.click(); return true; } return false; }; const w = ms => new Promise(r => setTimeout(r, ms));
        document.getElementById('pnom').value = 'Prueba'; document.getElementById('pape').value = 'Dojo'; document.getElementById('pnum').value = '12345'; C('#goBtn'); C('#sc_mejor'); C('#bNext'); C('#bNext'); C('#bNext'); await w(400); if (typeof endIncident === 'function') endIncident(); await w(700);
        for (const i of path) { document.querySelectorAll('.opt')[i].click(); await w(50); C('#talk .next'); await w(50); while (C('#evOk')) await w(50); }
        return window.REPORT ? { s: REPORT.score, ok: REPORT.ok, p: REPORT.path } : null; }, path); await q.close(); return { r, e }; };
    const good = await play([1, 1, 1]), bad = await play([2, 0, 0]);
    ok('Dojo de Mando', 'ruta recomendada B-B-B aprueba', !!(good.r && good.r.ok), good.r ? good.r.s + '/100' : 'sin reporte');
    ok('Dojo de Mando', 'ruta C-A-A (evitar y ceder) no aprueba', !!(bad.r && !bad.r.ok), bad.r ? bad.r.s + '/100' : 'sin reporte');
    ok('Dojo de Mando', 'sin errores de ejecución', !good.e.length && !bad.e.length, good.e[0] || bad.e[0] || ''); }
  // Dojo de Mando: operadores y sindicato gesticulan al hablar (no solo el personal de oficina)
  { const q = await b.newPage({ viewport: { width: 1000, height: 700 } }); const e = []; q.on('pageerror', x => e.push(x.message)); await q.goto(url('juegos/dojo-de-mando.html')); await q.waitForTimeout(1500);
    await q.evaluate(() => { const C = s => { const el = document.querySelector(s); if (el && el.offsetParent !== null) el.click(); }; document.getElementById('pnom').value = 'Prueba'; document.getElementById('pape').value = 'Dojo'; document.getElementById('pnum').value = '12345'; C('#goBtn'); C('#sc_mejor'); C('#bNext'); C('#bNext'); C('#bNext'); setTimeout(() => { if (typeof endIncident === 'function') endIncident(); }, 400); });
    await q.waitForTimeout(9000);
    const g = await q.evaluate(async () => { const a = Object.values(AV).find(a => !a.office && a.av && a.av.obj); if (!a) return null; a.pose = 'neutral'; a.talkT = 4; await new Promise(r => setTimeout(r, 900)); const s1 = a.gest && a.gest.set.join(); const talk = !!(a.gest && a.gest.talk);
      a.pose = 'cross'; await new Promise(r => setTimeout(r, 300)); return { talk, s1, op: TALK_SETS_OP.some(x => x.join() === s1), cross: a.gest === null }; });
    ok('Dojo de Mando', 'operadores gesticulan al hablar y respetan brazos cruzados', g ? g.talk && g.op && g.cross : true, g ? g.s1 : 'omitido: los avatares no cargaron en este entorno');
    ok('Dojo de Mando', 'gestos de operadores sin errores', !e.length, e[0] || ''); await q.close(); }
  // Dojo de Mando: casos de logística nuevos (chofer, nuevo, hormiga, WMS, auditoría) completos, en su nivel y arrancan la plática
  { const NEW = [['Supervisor de Operaciones', 'chofer'], ['Supervisor de Operaciones', 'nuevo'], ['Supervisor de Operaciones', 'hormiga'], ['Jefe de Operaciones', 'wms'], ['Gerente de Operaciones', 'auditoria']]; const bad = [], e = [];
    for (const [pu, id] of NEW) { const q = await b.newPage({ viewport: { width: 1000, height: 700 } }); q.on('pageerror', x => e.push(x.message)); await q.goto(url('juegos/dojo-de-mando.html')); await q.waitForTimeout(1000);
      const r = await q.evaluate(async ([pu, id]) => { const w = ms => new Promise(r => setTimeout(r, ms)); const P = document.getElementById('ppuesto'); P.value = pu; P.dispatchEvent(new Event('change')); document.getElementById('pnom').value = 'Prueba'; document.getElementById('pape').value = 'Dojo'; document.getElementById('pnum').value = '12345'; document.getElementById('goBtn').click(); await w(400);
        const S = (SCEN[LV.key] || []).find(x => x.id === id), bt = document.getElementById('sc_' + id); if (!S || !bt) return 'no aparece en el menú';
        if (!(S.intro && S.open && S.goal && S.name && S.role && Array.isArray(S.fb) && S.fb.length >= 3)) return 'datos incompletos'; if (!ecFor(id).length) return 'sin estándar CONOCER';
        bt.click(); await w(1500); return document.getElementById('talk').innerText.includes(S.open.slice(0, 25)) ? '' : 'no arranca la plática'; }, [pu, id]); if (r) bad.push(id + ': ' + r); await q.close(); }
    ok('Dojo de Mando', '5 casos nuevos de logística en su nivel y arrancan', !bad.length, bad.join(' · '));
    ok('Dojo de Mando', 'casos nuevos sin errores', !e.length, e[0] || ''); }
  // Dojo de Mando: "Repite lo que fallaste" ofrece reintento en el criterio más bajo, muestra la pista y compara antes/después
  { const q = await (await b.newContext()).newPage({ viewport: { width: 1000, height: 700 } }); const e = []; q.on('pageerror', x => e.push(x.message)); await q.goto(url('juegos/dojo-de-mando.html')); await q.waitForTimeout(1000); let R = { b: null, tip: null, res: null };
    try { R.b = await q.evaluate(async () => { const w = ms => new Promise(r => setTimeout(r, ms)); const P = document.getElementById('ppuesto'); P.value = 'Supervisor de Operaciones'; P.dispatchEvent(new Event('change')); pnom.value = 'Prueba'; pape.value = 'Dojo'; pnum.value = '12345'; goBtn.click(); await w(400); document.getElementById('sc_chofer').click(); await w(1200); AI.off = true; CONV.push({ quien: 'Líder', texto: 'Gracias por esperar. Le pido calma.' }); await endPractice(); const b = document.getElementById('retryFocus'); return b ? b.textContent : null; });
      if (R.b) { await q.evaluate(() => document.getElementById('retryFocus').click()).catch(() => { }); for (let i = 0; i < 50 && !R.tip; i++) { await q.waitForTimeout(500); R.tip = await q.evaluate(() => !!document.getElementById('focusTip')).catch(() => false); }
        R.res = await q.evaluate(async () => { AI.off = true; CONV.push({ quien: 'Líder', texto: '¿Qué pasó en el camino? ¿Cómo podemos acomodarlo?' }); await endPractice(); const f = document.querySelector('.focusres'); return f ? f.innerText : null; }); } } catch (x) { e.push(x.message); }
    ok('Dojo de Mando', 'repite lo que fallaste: botón, pista y comparación', !!(R.b && R.tip && R.res && /→ ahora/.test(R.res)), R.res ? R.res.split('\n').pop() : JSON.stringify(R));
    ok('Dojo de Mando', 'reintento enfocado sin errores', !e.length, e[0] || ''); await q.close(); }
  // Dojo de Mando: práctica rápida de 5 min elige situación al azar, muestra cronómetro y al terminar el tiempo evalúa sola
  { const q = await (await b.newContext()).newPage({ viewport: { width: 390, height: 844 } }); const e = []; q.on('pageerror', x => e.push(x.message)); await q.goto(url('juegos/dojo-de-mando.html')); await q.waitForTimeout(1000);
    const r = await q.evaluate(async () => { const w = ms => new Promise(r => setTimeout(r, ms)); const P = document.getElementById('ppuesto'); P.value = 'Supervisor de Operaciones'; P.dispatchEvent(new Event('change')); pnom.value = 'Prueba'; pape.value = 'Dojo'; pnum.value = '12345'; goBtn.click(); await w(400);
      const qb = document.getElementById('quickBtn'); if (!qb) return 'sin botón'; if (!/5 min/.test(QUICK_SECS / 60 + ' min')) return 'duración distinta a 5 min'; window.QUICK_TEST_SECS = 8; AI.off = true; qb.click(); let t = null; for (let i = 0; i < 40 && !t; i++) { await w(150); t = document.getElementById('qtimer'); } if (!t || !/⚡ 0:0\d/.test(t.textContent)) return 'sin cronómetro';
      for (let i = 0; i < 80 && document.getElementById('qtimer'); i++) await w(200); return !document.getElementById('report').classList.contains('hidden') && !document.getElementById('qtimer') ? '' : 'no cerró al terminar el tiempo'; });
    ok('Dojo de Mando', 'práctica rápida de 5 min con cronómetro y cierre automático', !r, r);
    ok('Dojo de Mando', 'práctica rápida sin errores', !e.length, e[0] || ''); await q.close(); }
  // Montacargas: métricas de seguridad (choques, velocidad en curva, carga, claxon) en el resumen final
  { const m = await p.evaluate(() => { try { resetPractice(); honk(); honk(); SAFEM.maxSpeed = 9.2; SAFEM.maxCurve = 7.4; registerFault('colision'); registerFault('caidaCarga'); finishPractice(); const el = document.getElementById('safeReport'), t = el ? el.innerText : '';
        const r = { ok: !!el && /Choques\s*1 falta/.test(t) && /Manejo de carga\s*1 falta/.test(t) && /Claxon y peatones\s*✓/.test(t) && /Claxon usado: 2/.test(t) && /curva: 7\.4/.test(t) && /\b55\b/.test(t), t: t.replace(/\s+/g, ' ').slice(0, 160) };
        const h = JSON.parse(localStorage.getItem('dicka_practicas') || '[]').pop(); r.saved = !!(h && h.seguridad && h.seguridad.honks === 2); document.getElementById('summary').classList.remove('show'); resetPractice(); return r; } catch (e) { return { ok: false, t: e.message }; } });
    ok('Montacargas', 'métricas de seguridad en el resumen (choques, curva, carga, claxon)', m.ok && m.saved, m.t); }
  // Montacargas: inyección de fallas (frenos, dirección, alarma) — reportar detenido a tiempo es correcto; no reportar es falta
  { const r = await p.evaluate(() => { try { resetPractice(); fallaTick(performance.now()); const out = {};
        injectFalla('frenos'); const bn = document.getElementById('fallaBanner'); out.banner = !!bn && bn.style.display !== 'none' && /Frenos con retardo/.test(bn.innerText);
        simSpeed = 5; reportFalla(); out.bloqueaEnMovimiento = FALLA.active === true; simSpeed = 0; velKmh = 0; reportFalla(); out.reportada = !FALLA.active && bn.style.display === 'none' && window._fallaLog.slice(-1)[0].aTiempo === true;
        const n = faultLog.length; injectFalla('direccion'); FALLA.t0 = performance.now() - 13000; fallaTick(performance.now()); out.falta = faultLog.slice(n).some(f => f.code === 'fallaNoReportada');
        reportFalla(); injectFalla('alarma'); out.alarma = /sobrecalentamiento/.test(document.getElementById('fallaBanner').innerText); reportFalla(); resetPractice(); return out; } catch (e) { return { err: e.message }; } });
    ok('Montacargas', 'inyección de fallas: aviso, reporte detenido y falta si no se reporta', r.banner && r.bloqueaEnMovimiento && r.reportada && r.falta && r.alarma, JSON.stringify(r)); }
  // Recepción y decantado: la ruta correcta da 120/120 y aprueba; recibir todo completo y dejarlo en piso no aprueba
  { const run = async good => { const b3 = await chromium.launch({ args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--allow-file-access-from-files'] }); const cx_ = await b3.newContext(); const q = await cx_.newPage({ viewport: { width: 390, height: 844 } }); const e = []; q.on('pageerror', x => e.push(x.message)); await q.goto(url('juegos/recepcion-decantado.html')); await q.waitForTimeout(400);
      await q.fill('#pname', 'Prueba Recepción'); await q.click('#startBtn'); await q.waitForTimeout(200);
      const r = await q.evaluate(async good => { const w = ms => new Promise(r => setTimeout(r, ms)); const kinds = new Set(P.map(x => x.k)); for (let i = 0; i < 8; i++) { const x = P[idx]; scan(); if (good) { document.querySelector(`[data-v="${x.dec}"]`).click(); await w(30); if (x.dec === 'rechazar') document.querySelector(`[data-m="${x.motivo}"]`).click(); else document.querySelector(`[data-z="${x.zona}"]`).click(); } else { document.querySelector('[data-v="completo"]').click(); await w(30); document.querySelector('[data-z="piso"]').click(); } await w(500); }
        return { score, ok: score >= PASS, kinds: kinds.size, saved: JSON.parse(localStorage.getItem('dicka_console_results') || '[]').some(x => x.juego === 'Recepción y Decantado') }; }, good); await b3.close(); return { r, e }; };
    const g = await run(true), m = await run(false);
    ok('Recepción y decantado', 'ruta correcta 120/120 aprueba y guarda el resultado', g.r.score === 120 && g.r.ok && g.r.saved && g.r.kinds >= 6, JSON.stringify(g.r));
    ok('Recepción y decantado', 'recibir todo y dejar en piso no aprueba', !m.r.ok, m.r.score + '/120');
    ok('Recepción y decantado', 'sin errores de ejecución', !g.e.length && !m.e.length, g.e[0] || m.e[0] || ''); }
  // Patio y andenes: buena coordinación aprueba; no asignar andenes no aprueba; atender sin cita antes que con cita penaliza
  { const run = async mode => { const q = await (await b.newContext()).newPage({ viewport: { width: 390, height: 844 } }); const e = []; q.on('pageerror', x => e.push(x.message)); await q.goto(url('juegos/patio-andenes.html')); await q.waitForTimeout(300);
      await q.fill('#pname', 'Prueba Patio'); await q.click('#startBtn'); await q.waitForTimeout(150);
      const r = await q.evaluate(mode => { if (mode === 'prio') { advance(); const W = waiting(), sin = W.find(t => !t.cita), con = W.find(t => t.cita && t.temp === 'seco'); const s0 = score; if (!sin || !con) return { err: 'sin escenario' }; assign(sin.id, D.find(d => fits(sin, d) && !d.cold).n); return { pen: s0 - score }; }
        for (let s = 0; s < SLOTS; s++) { if (mode === 'good') { const W = waiting().sort((a, b) => (b.cita - a.cita) || ((b.temp === 'frio') - (a.temp === 'frio'))); for (const t of W) { const free = D.filter(d => fits(t, d)), fw = waiting().some(x => x.temp === 'frio' && x.id !== t.id); const d = t.temp === 'frio' ? free.find(d => d.cold) : (free.find(d => !d.cold) || (!fw && free.find(d => d.cold))); if (d) assign(t.id, d.n); } } advance(); }
        return { score, ok: score >= PASS, end: !document.getElementById('end').classList.contains('hidden') }; }, mode); await q.close(); return { r, e }; };
    const g = await run('good'), idle = await run('idle'), pr = await run('prio');
    ok('Patio y andenes', 'coordinación correcta aprueba', g.r.ok && g.r.end, JSON.stringify(g.r));
    ok('Patio y andenes', 'sin asignar andenes no aprueba', !idle.r.ok && idle.r.end, idle.r.score + '/100');
    ok('Patio y andenes', 'atender sin cita antes que con cita penaliza', pr.r.pen === 5, JSON.stringify(pr.r));
    ok('Patio y andenes', 'sin errores de ejecución', !g.e.length && !idle.e.length && !pr.e.length, g.e[0] || idle.e[0] || pr.e[0] || ''); }
  // Editor de situaciones: valida, guarda en el equipo y la situación aparece en el Dojo (etiquetada) y arranca; datos inválidos se ignoran
  { const ctx = await b.newContext({ viewport: { width: 1000, height: 800 } }), q = await ctx.newPage(); const e = []; q.on('pageerror', x => e.push(x.message)); let r = {};
    try { await q.goto(url('juegos/dojo-editor.html')); await q.waitForTimeout(300); await q.click('#saveBtn'); r.valida = /título/i.test(await q.textContent('#err'));
      await q.selectOption('#nivel', 'jefe'); await q.fill('#t', 'Montacarguista sin cinturón'); await q.fill('#name', 'Marco'); await q.fill('#role', 'Operador');
      await q.fill('#intro', 'Turno nocturno. En la ronda viste a Marco operando sin cinturón por tercera vez esta semana.'); await q.fill('#open', 'Jefe, ya sé a qué viene, es nomás un ratito.'); await q.fill('#goal', 'Que se comprometa a usar el cinturón siempre y acuerden seguimiento.'); await q.fill('#fb', 'Siempre lo he hecho así.\n¿Por qué nomás a mí?\nEstá bien.');
      await q.click('#saveBtn'); r.guarda = /Guardada/.test(await q.textContent('#err'));
      await q.evaluate(() => { const L = JSON.parse(localStorage.getItem('dicka_dojo_custom')); L.push({ nivel: 'jefe', id: 'x"><img src=x onerror=alert(1)>', t: 'Mala', intro: 'x'.repeat(50), open: 'hola hola', goal: 'objetivo objetivo objetivo' }); localStorage.setItem('dicka_dojo_custom', JSON.stringify(L)); });
      await q.goto(url('juegos/dojo-de-mando.html')); await q.waitForTimeout(1000);
      Object.assign(r, await q.evaluate(async () => { const w = ms => new Promise(r => setTimeout(r, ms)); const P = document.getElementById('ppuesto'); P.value = 'Jefe de Operaciones'; P.dispatchEvent(new Event('change')); pnom.value = 'Prueba'; pape.value = 'Dojo'; pnum.value = '12345'; goBtn.click(); await w(500);
        const bt = document.getElementById('sc_cx_montacarguista_sin_cinturon'); const o = { menu: !!bt && /Personalizada/.test(bt.innerText), invalida: SCEN.jefe.filter(x => x.custom).length === 1 }; if (bt) { bt.click(); await w(1500); o.arranca = document.getElementById('talk').innerText.includes('ya sé a qué viene'); } return o; })); } catch (x) { e.push(x.message); }
    ok('Dojo de Mando', 'editor de situaciones: valida, guarda y aparece en el Dojo', r.valida && r.guarda && r.menu && r.arranca && r.invalida, JSON.stringify(r));
    ok('Dojo de Mando', 'editor sin errores', !e.length, e[0] || ''); await ctx.close(); }
  // Dojo de Mando: PDF real (archivo) para plan de desarrollo y guía del líder; canvas alto se corta en varias páginas
  { const ctx = await b.newContext({ acceptDownloads: true, viewport: { width: 1000, height: 800 } }), q = await ctx.newPage(); const e = []; q.on('pageerror', x => e.push(x.message)); let r = {};
    try { await q.goto(url('juegos/dojo-de-mando.html')); await q.waitForTimeout(1000);
      r = await q.evaluate(async () => { const txt = async bl => new TextDecoder('latin1').decode(new Uint8Array(await bl.arrayBuffer())); const c = document.createElement('canvas'); c.width = 1240; c.height = 4000; const g = c.getContext('2d'); g.fillStyle = '#123'; g.fillRect(0, 0, 1240, 4000);
        const t = await txt(canvasToPDF(c)), pages = (t.match(/\/Type \/Page /g) || []).length; return { pdf: t.startsWith('%PDF-1.4'), eof: /%%EOF$/.test(t), pages, xref: /startxref\n\d+\n%%EOF$/.test(t) }; });
      await q.evaluate(async () => { const w = ms => new Promise(r => setTimeout(r, ms)); const P = document.getElementById('ppuesto'); P.value = 'Supervisor de Operaciones'; P.dispatchEvent(new Event('change')); pnom.value = 'Prueba'; pape.value = 'Dojo'; pnum.value = '12345'; goBtn.click(); await w(400); document.getElementById('sc_chofer').click(); await w(1200); AI.off = true; CONV.push({ quien: 'Líder', texto: 'Gracias. ¿Qué pasó? Tú te encargas de registrar la cita; lo revisamos el viernes.' }); await endPractice(); });
      const dl = async fn => { const [d] = await Promise.all([q.waitForEvent('download', { timeout: 15000 }), q.evaluate(fn)]); return d.suggestedFilename(); };
      r.plan = await dl(() => planPDF()); r.guia = await dl(() => leaderGuide('pdf')); } catch (x) { e.push(x.message); }
    ok('Dojo de Mando', 'PDF real: plan y guía del líder se descargan como .pdf; varias páginas', r.pdf && r.eof && r.xref && r.pages === 3 && /\.pdf$/.test(r.plan || '') && /\.pdf$/.test(r.guia || ''), JSON.stringify(r));
    ok('Dojo de Mando', 'PDF sin errores', !e.length, e[0] || ''); await ctx.close(); }
  // Modo accesible (todas las páginas): botón Aa, texto grande, alto contraste, subtítulos de la voz y preferencia guardada
  { const ctx = await b.newContext({ viewport: { width: 390, height: 844 } }); const bad = [], e = [];
    for (const f of pages) { const q = await ctx.newPage(); q.on('pageerror', x => e.push(f + ': ' + x.message)); await q.goto(url(f)); await q.waitForTimeout(500); if (!(await q.$('#a11yBtn'))) bad.push(f); await q.close(); }
    const q = await ctx.newPage(); await q.goto(url('juegos/recepcion-decantado.html')); await q.waitForTimeout(400); await q.click('#a11yBtn');
    for (const k of ['big', 'hc', 'subs']) await q.check(`#a11yPanel input[data-k="${k}"]`);
    await q.evaluate(() => window.dickaSubtitle('Prueba de subtítulo')); const r = await q.evaluate(() => ({ big: document.documentElement.classList.contains('a11y-big'), hc: document.documentElement.classList.contains('a11y-hc'), sub: getComputedStyle(document.getElementById('a11ySubs')).display === 'block', hs: document.documentElement.scrollWidth > innerWidth + 2 }));
    await q.goto(url('juegos/conteo-ciclico.html')); await q.waitForTimeout(400); r.persiste = await q.evaluate(() => document.documentElement.classList.contains('a11y-big') && document.documentElement.classList.contains('a11y-hc'));
    ok('Accesibilidad', 'botón Aa en todas las páginas', !bad.length, bad.join(', '));
    ok('Accesibilidad', 'texto grande, alto contraste, subtítulos y preferencia guardada', r.big && r.hc && r.sub && !r.hs && r.persiste, JSON.stringify(r));
    ok('Accesibilidad', 'sin errores de ejecución', !e.length, e[0] || ''); await ctx.close(); }
  // Portal: Mis logros (insignias y racha diaria por colaborador)
  { const ctx = await b.newContext({ viewport: { width: 390, height: 844 } }), q = await ctx.newPage(); const e = []; q.on('pageerror', x => e.push(x.message)); await q.goto(url('index.html'));
    await q.evaluate(() => { const d = n => new Date(Date.now() - n * 864e5).toISOString(); localStorage.setItem('dicka_console_results', JSON.stringify([{ juego: 'Recepción y Decantado', nombre: 'Ana Prueba', score: '120/120', aprobado: true, fecha: d(0) }, { juego: 'Patio y Andenes', nombre: 'Ana Prueba', score: '80/100', aprobado: true, fecha: d(1) }, { juego: 'Dojo de Mando · Cliente', nombre: 'Ana Prueba', score: '70/100', aprobado: true, fecha: d(2) }, { juego: 'Conteo Cíclico', nombre: 'Ana Prueba', score: '100/212', aprobado: false, fecha: d(2) }, { juego: 'Conteo Cíclico', nombre: 'Luis Otro', score: '160/212', aprobado: true, fecha: d(9) }])); });
    await q.reload(); await q.waitForTimeout(600); await q.click('#btnLogros'); await q.waitForTimeout(200);
    const r = await q.evaluate(() => { const a = { racha: streakOf(collectResults().filter(x => x.nombre === 'Ana Prueba')).cur, on: document.querySelectorAll('.badge-on').length }; document.getElementById('logrosWho').value = 'Luis Otro'; renderLogros(); a.luis = streakOf(collectResults().filter(x => x.nombre === 'Luis Otro')).cur; a.onLuis = document.querySelectorAll('.badge-on').length; return a; });
    ok('Portal', 'Mis logros: racha e insignias por colaborador', r.racha === 3 && r.on === 6 && r.luis === 0 && r.onLuis === 2, JSON.stringify(r));
    ok('Portal', 'Mis logros sin errores', !e.length, e[0] || ''); await ctx.close(); }
  // Dojo de Mando: repaso espaciado (se agenda al terminar; al vencer aparece "Toca repasar" y arranca la situación)
  { const ctx = await b.newContext({ viewport: { width: 1000, height: 800 } }), q = await ctx.newPage(); const e = []; q.on('pageerror', x => e.push(x.message)); let r = {};
    const reg = async () => { await q.goto(url('juegos/dojo-de-mando.html')); await q.waitForTimeout(1000); await q.evaluate(async () => { const P = document.getElementById('ppuesto'); P.value = 'Supervisor de Operaciones'; P.dispatchEvent(new Event('change')); pnom.value = 'Prueba'; pape.value = 'Dojo'; pnum.value = '12345'; goBtn.click(); await new Promise(r => setTimeout(r, 500)); }); };
    try { await reg(); Object.assign(r, await q.evaluate(async () => { const w = ms => new Promise(r => setTimeout(r, ms)); const box0 = !!document.getElementById('repasoBox'); document.getElementById('sc_chofer').click(); await w(1200); AI.off = true; CONV.push({ quien: 'Líder', texto: 'Gracias por esperar.' }); await endPractice(); return { box0, next: /en 7 días/.test((document.querySelector('.repasoNext') || {}).innerText || '') }; }));
      await q.evaluate(() => { const o = JSON.parse(localStorage.getItem('dicka_dojo_repaso')); Object.values(o).forEach(x => { x.fecha -= 8 * 864e5; x.due -= 8 * 864e5; }); localStorage.setItem('dicka_dojo_repaso', JSON.stringify(o)); });
      await reg(); Object.assign(r, await q.evaluate(async () => { const o = { box: !!document.getElementById('repasoBox'), tag: /Toca repasar/.test(document.getElementById('sc_chofer').innerText) }; document.getElementById('repasoBtn').click(); await new Promise(r => setTimeout(r, 1300)); o.arranca = document.getElementById('talk').innerText.includes('usted es el encargado'); return o; })); } catch (x) { e.push(x.message); }
    ok('Dojo de Mando', 'repaso espaciado: agenda, aviso al vencer y repaso', !r.box0 && r.next && r.box && r.tag && r.arranca, JSON.stringify(r));
    ok('Dojo de Mando', 'repaso sin errores', !e.length, e[0] || ''); await ctx.close(); }
  // Métodos de surtido: respuestas y ruta óptima dan 100; métodos equivocados y ruta en zigzag no aprueban; recorridos calculados coherentes
  { const run = async good => { const b3 = await chromium.launch({ args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--allow-file-access-from-files'] }); const cx_ = await b3.newContext(); const q = await cx_.newPage({ viewport: { width: 390, height: 844 } }); const e = []; q.on('pageerror', x => e.push(x.message)); await q.goto(url('juegos/metodos-surtido.html')); await q.waitForTimeout(300);
      await q.fill('#pname', 'Prueba Surtido'); await q.click('#startBtn');
      const r = await q.evaluate(good => { let c2 = 0, c3 = 0; for (let i = 0; i < 10; i++) { const a = metrics(SCN[1].gen(), 1); if (a.lot < a.disc) c2++; const z = metrics(SCN[2].gen(), 2); if (z.zon < z.disc && z.zon < z.lot) c3++; }
        for (let i = 0; i < 4; i++) { const want = SCN[step].ok, m = good ? want : Object.keys(MET).find(k => k !== want); document.querySelector(`[data-m="${m}"]`).click(); next(); }
        const idx = ROUTE_PTS.map((_, i) => i); const ord = good ? perm(idx).reduce((bst, o) => { const L = pathLen(o.map(i => ROUTE_PTS[i])); return L < bst[0] ? [L, o] : bst; }, [1e9, null])[1] : idx.slice().sort((x, y) => (ROUTE_PTS[x].b % 2) - (ROUTE_PTS[y].b % 2) || ROUTE_PTS[y].a - ROUTE_PTS[x].a);
        ord.forEach(i => document.querySelector(`.loc.pick[data-i="${i}"]`).click()); finish(); return { score, ok: score >= PASS, c2, c3 }; }, good); await b3.close(); return { r, e }; };
    const g = await run(true), m = await run(false);
    ok('Métodos de surtido', 'respuestas correctas y ruta óptima: 100/100', g.r.score === 100 && g.r.ok, JSON.stringify(g.r));
    ok('Métodos de surtido', 'métodos equivocados no aprueban', !m.r.ok, m.r.score + '/100');
    ok('Métodos de surtido', 'recorridos calculados coherentes (lotes < discreto; zonas < resto)', g.r.c2 === 10 && g.r.c3 === 10, `${g.r.c2}/10 · ${g.r.c3}/10`);
    ok('Métodos de surtido', 'sin errores de ejecución', !g.e.length && !m.e.length, g.e[0] || m.e[0] || ''); }
  // Recepción: escáner RF — sin escanear no se puede decidir; al escanear muestra la etiqueta y alerta las diferencias
  { const q = await (await b.newContext()).newPage({ viewport: { width: 390, height: 844 } }); const e = []; q.on('pageerror', x => e.push(x.message)); await q.goto(url('juegos/recepcion-decantado.html')); await q.waitForTimeout(300); await q.fill('#pname', 'Prueba RF'); await q.click('#startBtn');
    const r = await q.evaluate(async () => { const w = ms => new Promise(r => setTimeout(r, ms)); const o = { bloqueado: [...document.querySelectorAll('#acts button')].every(b => b.disabled) && document.getElementById('phyBox').classList.contains('locked'), pide: /ESCANEE LPN/.test(document.getElementById('rf').innerText) }; let alertas = 0, limpias = 0;
      for (let i = 0; i < 8; i++) { const x = P[idx]; scan(); const t = document.getElementById('rf').innerText; if (x.k === 'ok' || x.k === 'okFrio') { if (/SIN ALERTAS/.test(t)) limpias++; } else if (x.k !== 'danada' ? /⚠/.test(t) : /EMPAQUE/.test(t)) alertas++; document.querySelector(`[data-v="${x.dec}"]`).click(); await w(20); if (x.dec === 'rechazar') document.querySelector(`[data-m="${x.motivo}"]`).click(); else document.querySelector(`[data-z="${x.zona}"]`).click(); await w(480); }
      o.alertas = alertas; o.limpias = limpias; o.score = score; return o; });
    ok('Recepción y decantado', 'escáner RF: bloquea sin escanear, alerta diferencias', r.bloqueado && r.pide && r.alertas === 4 && r.limpias === 4 && r.score === 120, JSON.stringify(r));
    ok('Recepción y decantado', 'escáner RF sin errores', !e.length, e[0] || ''); }
  // Montacargas: diagnóstico inicial sugiere el nivel (principiante / intermedio / certificación) y lo selecciona
  { const lv = await p.evaluate(() => { const set = a => { openDiag(); a.forEach((v, i) => document.querySelector(`input[name=dg${i}][value="${v}"]`).checked = true); evalDiag(); const r = document.getElementById('rNivel').value; closeDiag(); return r; };
      return [set([0, 0, 0, 0, 1]), set([1, 1, 1, 0, 1]), set([2, 1, 1, 1, 1]), set([2, 0, 1, 1, 1])]; });
    ok('Montacargas', 'diagnóstico inicial sugiere nivel', lv.join() === 'principiante,intermedio,certificacion,intermedio', lv.join()); await p.evaluate(() => { document.getElementById('rNivel').value = 'intermedio'; }); }
  // Dojo de Mando: micrófono robusto — errores de red, sin micrófono y voz "atorada" (Edge) se manejan con aviso y opción de escribir; el dictado llega a la plática
  { const bm = await chromium.launch(); const mk = async (mode, stuck) => { const ctx = await bm.newContext({ viewport: { width: 1000, height: 800 } }); await ctx.addInitScript(([mode, stuck]) => {
        class FakeSR { constructor() { this.lang = ''; } start() { window.__st = (window.__st || 0) + 1; setTimeout(() => { if (mode === 'ok') { if (window.__sr1) return; window.__sr1 = 1; this.onresult && this.onresult({ resultIndex: 0, results: [Object.assign([{ transcript: '¿qué pasó con el embarque?' }], { isFinal: true })] }); } else { this.onerror && this.onerror({ error: mode }); } setTimeout(() => this.onend && this.onend(), 30); }, 40); } abort() { } stop() { } }
        window.webkitSpeechRecognition = FakeSR; window.SpeechRecognition = FakeSR; const fakeTTS = { speaking: !!stuck, pending: false, paused: false, speak(u) { setTimeout(() => { u.onstart && u.onstart(); u.onend && u.onend(); }, 10); }, cancel() { }, pause() { }, resume() { }, getVoices() { return []; }, addEventListener() { }, onvoiceschanged: null }; try { Object.defineProperty(window, 'speechSynthesis', { get: () => fakeTTS, configurable: true }); } catch (e) { } }, [mode, stuck]);
      const q = await ctx.newPage(); const e = []; q.on('pageerror', x => e.push(x.message)); await q.bringToFront(); await q.goto(url('juegos/dojo-de-mando.html')); await q.waitForTimeout(900);
      const r = await q.evaluate(async () => { const w = ms => new Promise(r => setTimeout(r, ms)); const P = document.getElementById('ppuesto'); P.value = 'Supervisor de Operaciones'; P.dispatchEvent(new Event('change')); pnom.value = 'Prueba'; pape.value = 'Dojo'; pnum.value = '12345'; goBtn.click(); const until = async (f, ms) => { const t = Date.now(); while (Date.now() - t < ms && !f()) await w(150); return f(); }; await until(() => document.getElementById('sc_chofer'), 8000); document.getElementById('sc_chofer').click(); await until(() => document.getElementById('orbState'), 8000); await w(300); AI.off = true; VOICE.on = false;
        if (!LISTEN) listen(); await until(() => (!LISTEN && /dictado|micrófono/.test((document.getElementById('orbState') || {}).textContent || '')) || CONV.some(c => c.quien === 'Líder' && /embarque/.test(c.texto)), 45000); return { st: window.__st, net: MIC && MIC.net, rs: MIC && MIC.rs, got: MIC && MIC.got, wait: MIC_WAIT, speak: speechSynthesis.speaking, orb: !!document.getElementById('orbState'), msg: (document.getElementById('orbState') || {}).textContent || '', tipo: !document.getElementById('typeBox').classList.contains('hidden'), dicho: CONV.some(c => c.quien === 'Líder' && /embarque/.test(c.texto)), listen: LISTEN }; });
      await ctx.close(); return { r, e }; };
    const net = await mk('network'), cap = await mk('audio-capture'), okv = await mk('ok', true);
    ok('Dojo de Mando', 'micrófono: falla de red avisa y ofrece escribir', /dictado por voz no responde/.test(net.r.msg) && net.r.tipo && !net.r.listen, JSON.stringify(net.r));
    ok('Dojo de Mando', 'micrófono: sin micrófono avisa y ofrece escribir', /No se detecta un micrófono/.test(cap.r.msg) && cap.r.tipo, cap.r.msg);
    ok('Dojo de Mando', 'micrófono: abre aunque la voz quede "atorada" (Edge) y el dictado llega', okv.r.dicho, JSON.stringify(okv.r));
    ok('Dojo de Mando', 'micrófono sin errores', !net.e.length && !cap.e.length && !okv.e.length, net.e[0] || cap.e[0] || okv.e[0] || ''); await bm.close(); }
  // Dojo de Mando: 10 situaciones gerenciales nuevas con datos completos, en Gerencia y en sus escenarios (sala, andén, comedor, oficina)
  { const q = await (await b.newContext()).newPage({ viewport: { width: 1000, height: 700 } }); const e = []; q.on('pageerror', x => e.push(x.message)); await q.goto(url('juegos/dojo-de-mando.html')); await q.waitForTimeout(900);
    const r = await q.evaluate(async () => { const w = ms => new Promise(r => setTimeout(r, ms)); const IDS = { presupuesto: 'sala', jefeturno_meta: 'sala', sucesion: 'comedor', automatizacion: 'comedor', crisis_anden: 'anden', regalo_proveedor: 'oficina', conflicto_areas: 'sala', revision_salarial: 'sala', cultura_seguridad: 'anden', delegar_cliente: 'comedor' }; const bad = [];
      Object.entries(IDS).forEach(([id, esc]) => { const S = SCEN.ger.find(x => x.id === id); if (!S) return bad.push(id + ': falta'); const C = S.cast || [S]; if (S.escena !== esc || !S.intro || !S.goal || !TIPO_GER[id] || !ecFor(id).length || C.some(c => !c.open || !(c.fb && c.fb.length >= 2))) bad.push(id + ': datos'); });
      const P = document.getElementById('ppuesto'); P.value = 'Gerente de Operaciones'; P.dispatchEvent(new Event('change')); pnom.value = 'Prueba'; pape.value = 'Dojo'; pnum.value = '12345'; goBtn.click(); await w(400);
      const bt = document.getElementById('sc_crisis_anden'); if (!bt) bad.push('menú'); else { bt.click(); await w(2500); if (FP.sc !== 'anden' || !document.getElementById('talk').innerText.includes('Mis tiendas abren')) bad.push('arranque andén'); }
      return bad; });
    ok('Dojo de Mando', '10 situaciones gerenciales nuevas en escenarios variados', !r.length, r.join(' · '));
    ok('Dojo de Mando', 'situaciones gerenciales sin errores', !e.length, e[0] || ''); await q.close(); }
  // Portal: tabla de líderes por almacén (orden por puntos, filtro de almacén y periodo, nombres abreviados por defecto)
  { const ctx = await b.newContext({ viewport: { width: 390, height: 844 } }), q = await ctx.newPage(); const e = []; q.on('pageerror', x => e.push(x.message)); await q.goto(url('index.html'));
    await q.evaluate(() => { const d = n => new Date(Date.now() - n * 864e5).toISOString(), R = []; [['Ana Pérez', 'Agave 1', 4], ['Luis Gómez', 'Agave 1', 2], ['Rosa Díaz', 'Celaya', 3]].forEach(([n, w, k]) => { for (let i = 0; i < k; i++) R.push({ juego: 'Curso ' + i, nombre: n, almacen: w, score: '90/100', aprobado: i % 3 !== 2, fecha: d(i) }); }); R.push({ juego: 'Viejo', nombre: 'Viejo Uno', almacen: 'Agave 1', aprobado: true, score: '1/1', fecha: d(60) }); localStorage.setItem('dicka_console_results', JSON.stringify(R)); });
    await q.reload(); await q.waitForTimeout(500); await q.click('#btnLideres'); await q.waitForTimeout(150);
    const r = await q.evaluate(() => { const names = () => [...document.querySelectorAll('.ld-row')].map(t => t.children[1].textContent); const o = { todos: names().join() }; document.getElementById('ldWh').value = 'Agave 1'; renderLideres(); o.agave = names().join(); document.getElementById('ldPer').value = '0'; renderLideres(); o.todo = names().length; document.getElementById('ldFull').checked = true; renderLideres(); o.full = names()[0]; o.hs = document.documentElement.scrollWidth > innerWidth + 2; return o; });
    ok('Portal', 'tabla de líderes por almacén', r.todos === 'Ana P.,Rosa D.,Luis G.' && r.agave === 'Ana P.,Luis G.' && r.todo === 3 && r.full === 'Ana Pérez' && !r.hs, JSON.stringify(r));
    ok('Portal', 'tabla de líderes sin errores', !e.length, e[0] || ''); await ctx.close(); }
  // Planeación de personal: el plan óptimo da 100; sin eventuales no aprueba; pasar el límite legal de horas extra pierde cumplimiento
  { const q = await (await b.newContext()).newPage({ viewport: { width: 390, height: 844 } }); const e = []; q.on('pageerror', x => e.push(x.message)); await q.goto(url('juegos/planeacion-personal.html')); await q.waitForTimeout(300);
    await q.fill('#pname', 'Prueba Plan'); await q.click('#startBtn');
    const r = await q.evaluate(() => { const set = P => P.forEach((x, i) => { document.getElementById('ev' + i).value = x.ev; document.getElementById('ot' + i).value = x.ot; }); const O = optimum(); const o = {};
      set(O.plan); o.opt = simulate(readPlan()); set(D.map(() => ({ ev: 0, ot: 0 }))); o.none = simulate(readPlan()); set(D.map(() => ({ ev: 0, ot: 3 }))); o.ot = simulate(readPlan());
      set(O.plan); runWeek(); return { score, opt: { s: o.opt.service, c: o.opt.cost === O.cost, l: o.opt.legal }, none: o.none.service, otLegal: o.ot.legal, cpc: /\$\d+\.\d{2}/.test(document.getElementById('estats').innerText) }; });
    ok('Planeación de personal', 'plan óptimo 100/100; sin eventuales falta servicio; >9 h extra ilegal', r.score === 100 && r.opt.s === 1 && r.opt.c && r.opt.l && r.none < .9 && r.otLegal === false && r.cpc, JSON.stringify(r));
    ok('Planeación de personal', 'sin errores de ejecución', !e.length, e[0] || ''); }
  // Tablero del gerente: estrategia equilibrada aprueba; solo tiempo extra sin mantenimiento ni personal reprueba con accidentes
  { const run = async plan => { const q = await (await b.newContext()).newPage({ viewport: { width: 390, height: 844 } }); const e = []; q.on('pageerror', x => e.push(x.message)); await q.goto(url('juegos/tablero-gerente.html')); await q.waitForTimeout(300);
      await q.fill('#pname', 'Prueba Tablero'); await q.click('#startBtn');
      for (let i = 0; i < 4; i++) { const d = plan(i); await q.selectOption('#dExtra', String(d.extra)); await q.selectOption('#dOT', String(d.ot)); await q.selectOption('#dMant', String(d.mant)); await q.selectOption('#dCap', String(d.cap)); await q.click('#runBtn'); }
      const r = await q.evaluate(() => ({ score, acc: H.reduce((a, h) => a + h.acc, 0), end: !document.getElementById('end').classList.contains('hidden'), saved: JSON.parse(localStorage.getItem('dicka_console_results') || '[]').some(x => x.juego === 'Tablero del Gerente') })); await q.close(); return { r, e }; };
    const g = await run(i => ({ extra: i < 2 ? 6 : 9, ot: 0, mant: 1, cap: 1 })), m = await run(() => ({ extra: 0, ot: 1, mant: 0, cap: 0 }));
    ok('Tablero del gerente', 'estrategia equilibrada aprueba (≥70) y guarda', g.r.score >= 70 && g.r.end && g.r.saved && g.r.acc === 0, JSON.stringify(g.r));
    ok('Tablero del gerente', 'solo tiempo extra y correctivo reprueba con accidentes', m.r.score < 70 && m.r.acc > 0, JSON.stringify(m.r));
    ok('Tablero del gerente', 'sin errores de ejecución', !g.e.length && !m.e.length, g.e[0] || m.e[0] || ''); }
  // Cadena de frío: los registros generados cumplen su regla; decisiones correctas 100, liberar todo no aprueba
  { const run = async good => { const b3 = await chromium.launch({ args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--allow-file-access-from-files'] }); const cx_ = await b3.newContext(); const q = await cx_.newPage({ viewport: { width: 390, height: 844 } }); const e = []; q.on('pageerror', x => e.push(x.message)); await q.goto(url('juegos/cadena-frio.html')); await q.waitForTimeout(300);
      await q.fill('#pname', 'Prueba Frío'); await q.click('#startBtn');
      const r = await q.evaluate(good => { const bad = []; L.forEach(c => { const d = c.data.filter(v => v !== null), fr = c.tipo === 'frio', out = c.data.filter(v => v !== null && (fr ? (v > 8 || v < 2) : v > -18)).length, mx = Math.max(...d), mn = Math.min(...d), gap = c.data.includes(null);
          const exp = gap ? 'retener' : out === 0 ? 'liberar' : (out > 2 || (fr ? (mx > 12 || mn < 0) : mx > -12)) ? 'rechazar' : 'retener'; if (exp !== c.ok) bad.push(c.prod + ' ' + exp + '≠' + c.ok); });
        for (let i = 0; i < 8; i++) { document.querySelector(`[data-d="${good ? L[idx].ok : 'liberar'}"]`).click(); next(); } return { score, bad }; }, good); await b3.close(); return { r, e }; };
    const g = await run(true), m = await run(false);
    ok('Cadena de frío', 'registros coherentes con las reglas y decisiones correctas 100/100', g.r.score === 100 && !g.r.bad.length, JSON.stringify(g.r));
    ok('Cadena de frío', 'liberar todo no aprueba', m.r.score < 75, m.r.score + '/100');
    ok('Cadena de frío', 'sin errores de ejecución', !g.e.length && !m.e.length, g.e[0] || m.e[0] || ''); }
  // Inspección de tráiler: detectar anomalías + VVTT + decisión correcta aprueba; aceptar todo sin revisar no aprueba
  { const run = async good => { const b3 = await chromium.launch({ args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--allow-file-access-from-files'] }); const cx_ = await b3.newContext(); const q = await cx_.newPage({ viewport: { width: 390, height: 844 } }); const e = []; q.on('pageerror', x => e.push(x.message)); await q.goto(url('juegos/inspeccion-trailer.html')); await q.waitForTimeout(300);
      await q.fill('#pname', 'Prueba Sellos'); await q.click('#startBtn');
      const r = await q.evaluate(good => { const dec = U.map(u => u.dec).sort().join(','); for (let i = 0; i < 3; i++) { const u = U[idx]; if (good) { u.anom.forEach(a => document.querySelector(`.pt[data-p="${a}"]`).click()); document.querySelectorAll('.vv input').forEach(x => { x.checked = true; }); }
          document.querySelector(`[data-d="${good ? u.dec : 'aceptar'}"]`).click(); next(); } return { score, dec }; }, good); await b3.close(); return { r, e }; };
    const g = await run(true), m = await run(false);
    ok('Inspección de tráiler', 'inspección completa y decisiones correctas aprueban', g.r.score >= 95 && g.r.dec === 'aceptar,detener,detener', JSON.stringify(g.r));
    ok('Inspección de tráiler', 'aceptar todo sin revisar no aprueba', m.r.score < 75, m.r.score + '/100');
    ok('Inspección de tráiler', 'sin errores de ejecución', !g.e.length && !m.e.length, g.e[0] || m.e[0] || ''); }
  // Devoluciones: los 8 casos cubren los 5 destinos; destinos correctos 100, reintegrar todo no aprueba
  { const run = async good => { const b3 = await chromium.launch({ args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--allow-file-access-from-files'] }); const cx_ = await b3.newContext(); const q = await cx_.newPage({ viewport: { width: 390, height: 844 } }); const e = []; q.on('pageerror', x => e.push(x.message)); await q.goto(url('juegos/devoluciones.html')); await q.waitForTimeout(300);
      await q.fill('#pname', 'Prueba Devoluciones'); await q.click('#startBtn');
      const r = await q.evaluate(good => { const kinds = new Set(L.map(c => c.ok)).size, sinRma = L.every(c => c.rma === 'ok' || c.ok === 'retener'); for (let i = 0; i < 8; i++) { document.querySelector(`[data-d="${good ? L[idx].ok : 'reintegrar'}"]`).click(); next(); } return { score, kinds, sinRma }; }, good); await b3.close(); return { r, e }; };
    const g = await run(true), m = await run(false);
    ok('Devoluciones', 'cubre los 5 destinos, sin RMA siempre se retiene y destinos correctos dan 100', g.r.score === 100 && g.r.kinds === 5 && g.r.sinRma, JSON.stringify(g.r));
    ok('Devoluciones', 'reintegrar todo no aprueba', m.r.score < 75, m.r.score + '/100');
    ok('Devoluciones', 'sin errores de ejecución', !g.e.length && !m.e.length, g.e[0] || m.e[0] || ''); }
  // 5S: cada recorrido cubre las 5 S y un área sin hallazgo; respuestas correctas 100, marcar todo "está bien" no aprueba
  { const run = async good => { const b3 = await chromium.launch({ args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--allow-file-access-from-files'] }); const cx_ = await b3.newContext(); const q = await cx_.newPage({ viewport: { width: 390, height: 844 } }); const e = []; q.on('pageerror', x => e.push(x.message)); await q.goto(url('juegos/5s-almacen.html')); await q.waitForTimeout(300);
      await q.fill('#pname', 'Prueba Cinco S'); await q.click('#startBtn');
      const r = await q.evaluate(good => { const kinds = new Set(L.map(c => c.ok)).size, n = L.length, c3d = !!document.querySelector('#v3d canvas'); for (let i = 0; i < 10; i++) { document.querySelector(`[data-c="${i}"]`).click(); document.querySelector(`[data-d="${good ? L[idx].ok : 'ok'}"]`).click(); next(); } return { score, kinds, n, c3d }; }, good); await b3.close(); return { r, e }; };
    const g = await run(true), m = await run(false);
    ok('5S en el almacén', 'escena 3D con 10 hallazgos que cubren las 5 S y un área correcta; respuestas correctas 100', g.r.score === 100 && g.r.kinds === 6 && g.r.n === 10 && g.r.c3d, JSON.stringify(g.r));
    ok('5S en el almacén', 'marcar todo "está bien" no aprueba', m.r.score < 75, m.r.score + '/100');
    ok('5S en el almacén', 'sin errores de ejecución', !g.e.length && !m.e.length, g.e[0] || m.e[0] || ''); }
  // Materiales peligrosos: cada recorrido cubre las 5 acciones y un área sin hallazgo; respuestas correctas 100, marcar todo "está bien" no aprueba
  { const run = async good => { const b3 = await chromium.launch({ args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--allow-file-access-from-files'] }); const cx_ = await b3.newContext(); const q = await cx_.newPage({ viewport: { width: 390, height: 844 } }); const e = []; q.on('pageerror', x => e.push(x.message)); await q.goto(url('juegos/materiales-peligrosos.html')); await q.waitForTimeout(300);
      await q.fill('#pname', 'Prueba Químicos'); await q.click('#startBtn');
      const r = await q.evaluate(good => { const kinds = new Set(L.map(c => c.ok)).size, n = L.length, c3d = !!document.querySelector('#v3d canvas'); for (let i = 0; i < 10; i++) { document.querySelector(`[data-c="${i}"]`).click(); document.querySelector(`[data-d="${good ? L[idx].ok : 'ok'}"]`).click(); next(); } return { score, kinds, n, c3d }; }, good); await b3.close(); return { r, e }; };
    const g = await run(true), m = await run(false);
    ok('Materiales peligrosos', 'escena 3D con 10 hallazgos que cubren las 5 acciones NOM-018 y un área correcta; respuestas correctas 100', g.r.score === 100 && g.r.kinds === 6 && g.r.n === 10 && g.r.c3d, JSON.stringify(g.r));
    ok('Materiales peligrosos', 'marcar todo "está bien" no aprueba', m.r.score < 75, m.r.score + '/100');
    ok('Materiales peligrosos', 'sin errores de ejecución', !g.e.length && !m.e.length, g.e[0] || m.e[0] || ''); }
  // Ergonomía: cada recorrido cubre las 5 medidas y un área sin hallazgo; respuestas correctas 100, marcar todo "está bien" no aprueba
  { const run = async good => { const b3 = await chromium.launch({ args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--allow-file-access-from-files'] }); const cx_ = await b3.newContext(); const q = await cx_.newPage({ viewport: { width: 390, height: 844 } }); const e = []; q.on('pageerror', x => e.push(x.message)); await q.goto(url('juegos/ergonomia.html')); await q.waitForTimeout(300);
      await q.fill('#pname', 'Prueba Ergonomia'); await q.click('#startBtn');
      const r = await q.evaluate(good => { const kinds = new Set(L.map(c => c.ok)).size, n = L.length, c3d = !!document.querySelector('#v3d canvas'); for (let i = 0; i < 10; i++) { document.querySelector(`[data-c="${i}"]`).click(); document.querySelector(`[data-d="${good ? L[idx].ok : 'ok'}"]`).click(); next(); } return { score, kinds, n, c3d }; }, good); await b3.close(); return { r, e }; };
    const g = await run(true), m = await run(false);
    ok('Ergonomía NOM-036', 'escena 3D con 10 hallazgos que cubren las 5 medidas NOM-036 y un área correcta; respuestas correctas 100', g.r.score === 100 && g.r.kinds === 6 && g.r.n === 10 && g.r.c3d, JSON.stringify(g.r));
    ok('Ergonomía NOM-036', 'marcar todo "está bien" no aprueba', m.r.score < 75, m.r.score + '/100');
    ok('Ergonomía NOM-036', 'sin errores de ejecución', !g.e.length && !m.e.length, g.e[0] || m.e[0] || ''); }
  // Emergencias: cada recorrido cubre las 5 categorías y un área sin hallazgo; respuestas correctas 100, marcar todo "está bien" no aprueba
  { const run = async good => { const b3 = await chromium.launch({ args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--allow-file-access-from-files'] }); const cx_ = await b3.newContext(); const q = await cx_.newPage({ viewport: { width: 390, height: 844 } }); const e = []; q.on('pageerror', x => e.push(x.message)); await q.goto(url('juegos/emergencias.html')); await q.waitForTimeout(300);
      await q.fill('#pname', 'Prueba Emergencias'); await q.click('#startBtn');
      const r = await q.evaluate(good => { const kinds = new Set(L.map(c => c.ok)).size, n = L.length, c3d = !!document.querySelector('#v3d canvas'); for (let i = 0; i < 10; i++) { document.querySelector(`[data-c="${i}"]`).click(); document.querySelector(`[data-d="${good ? L[idx].ok : 'ok'}"]`).click(); next(); } return { score, kinds, n, c3d }; }, good); await b3.close(); return { r, e }; };
    const g = await run(true), m = await run(false);
    ok('Emergencias en el Almacén', 'escena 3D con 10 hallazgos que cubren las 5 categorías y un área correcta; respuestas correctas 100', g.r.score === 100 && g.r.kinds === 6 && g.r.n === 10 && g.r.c3d, JSON.stringify(g.r));
    ok('Emergencias en el Almacén', 'marcar todo "está bien" no aprueba', m.r.score < 75, m.r.score + '/100');
    ok('Emergencias en el Almacén', 'sin errores de ejecución', !g.e.length && !m.e.length, g.e[0] || m.e[0] || ''); }
  // LOTO: cada recorrido cubre las 5 categorías y un área sin hallazgo; respuestas correctas 100, marcar todo "está bien" no aprueba
  { const run = async good => { const b3 = await chromium.launch({ args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--allow-file-access-from-files'] }); const cx_ = await b3.newContext(); const q = await cx_.newPage({ viewport: { width: 390, height: 844 } }); const e = []; q.on('pageerror', x => e.push(x.message)); await q.goto(url('juegos/loto.html')); await q.waitForTimeout(300);
      await q.fill('#pname', 'Prueba LOTO'); await q.click('#startBtn');
      const r = await q.evaluate(good => { const kinds = new Set(L.map(c => c.ok)).size, n = L.length, c3d = !!document.querySelector('#v3d canvas'); for (let i = 0; i < 10; i++) { document.querySelector(`[data-c="${i}"]`).click(); document.querySelector(`[data-d="${good ? L[idx].ok : 'ok'}"]`).click(); next(); } return { score, kinds, n, c3d }; }, good); await b3.close(); return { r, e }; };
    const g = await run(true), m = await run(false);
    ok('Bloqueo y Etiquetado (LOTO)', 'escena 3D con 10 hallazgos que cubren las 5 categorías y un área correcta; respuestas correctas 100', g.r.score === 100 && g.r.kinds === 6 && g.r.n === 10 && g.r.c3d, JSON.stringify(g.r));
    ok('Bloqueo y Etiquetado (LOTO)', 'marcar todo "está bien" no aprueba', m.r.score < 75, m.r.score + '/100');
    ok('Bloqueo y Etiquetado (LOTO)', 'sin errores de ejecución', !g.e.length && !m.e.length, g.e[0] || m.e[0] || ''); }
  // Alturas: cada recorrido cubre las 5 categorías y un área sin hallazgo; respuestas correctas 100, marcar todo "está bien" no aprueba
  { const run = async good => { const b3 = await chromium.launch({ args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--allow-file-access-from-files'] }); const cx_ = await b3.newContext(); const q = await cx_.newPage({ viewport: { width: 390, height: 844 } }); const e = []; q.on('pageerror', x => e.push(x.message)); await q.goto(url('juegos/alturas.html')); await q.waitForTimeout(300);
      await q.fill('#pname', 'Prueba Alturas'); await q.click('#startBtn');
      const r = await q.evaluate(good => { const kinds = new Set(L.map(c => c.ok)).size, n = L.length, c3d = !!document.querySelector('#v3d canvas'); for (let i = 0; i < 10; i++) { document.querySelector(`[data-c="${i}"]`).click(); document.querySelector(`[data-d="${good ? L[idx].ok : 'ok'}"]`).click(); next(); } return { score, kinds, n, c3d }; }, good); await b3.close(); return { r, e }; };
    const g = await run(true), m = await run(false);
    ok('Trabajo en Alturas', 'escena 3D con 10 hallazgos que cubren las 5 categorías y un área correcta; respuestas correctas 100', g.r.score === 100 && g.r.kinds === 6 && g.r.n === 10 && g.r.c3d, JSON.stringify(g.r));
    ok('Trabajo en Alturas', 'marcar todo "está bien" no aprueba', m.r.score < 75, m.r.score + '/100');
    ok('Trabajo en Alturas', 'sin errores de ejecución', !g.e.length && !m.e.length, g.e[0] || m.e[0] || ''); }
  // Señalización: cada recorrido cubre las 5 categorías y un área sin hallazgo; respuestas correctas 100, marcar todo "está bien" no aprueba
  { const run = async good => { const b3 = await chromium.launch({ args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--allow-file-access-from-files'] }); const cx_ = await b3.newContext(); const q = await cx_.newPage({ viewport: { width: 390, height: 844 } }); const e = []; q.on('pageerror', x => e.push(x.message)); await q.goto(url('juegos/senalizacion.html')); await q.waitForTimeout(300);
      await q.fill('#pname', 'Prueba Senalización'); await q.click('#startBtn');
      const r = await q.evaluate(good => { const kinds = new Set(L.map(c => c.ok)).size, n = L.length, c3d = !!document.querySelector('#v3d canvas'); for (let i = 0; i < 10; i++) { document.querySelector(`[data-c="${i}"]`).click(); document.querySelector(`[data-d="${good ? L[idx].ok : 'ok'}"]`).click(); next(); } return { score, kinds, n, c3d }; }, good); await b3.close(); return { r, e }; };
    const g = await run(true), m = await run(false);
    ok('Señalización y Colores', 'escena 3D con 10 hallazgos que cubren las 5 categorías y un área correcta; respuestas correctas 100', g.r.score === 100 && g.r.kinds === 6 && g.r.n === 10 && g.r.c3d, JSON.stringify(g.r));
    ok('Señalización y Colores', 'marcar todo "está bien" no aprueba', m.r.score < 75, m.r.score + '/100');
    ok('Señalización y Colores', 'sin errores de ejecución', !g.e.length && !m.e.length, g.e[0] || m.e[0] || ''); }
  // Andenes: cada recorrido cubre las 5 categorías y un área sin hallazgo; respuestas correctas 100, marcar todo "está bien" no aprueba
  { const run = async good => { const b3 = await chromium.launch({ args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--allow-file-access-from-files'] }); const cx_ = await b3.newContext(); const q = await cx_.newPage({ viewport: { width: 390, height: 844 } }); const e = []; q.on('pageerror', x => e.push(x.message)); await q.goto(url('juegos/andenes.html')); await q.waitForTimeout(300);
      await q.fill('#pname', 'Prueba Andenes'); await q.click('#startBtn');
      const r = await q.evaluate(good => { const kinds = new Set(L.map(c => c.ok)).size, n = L.length, c3d = !!document.querySelector('#v3d canvas'); for (let i = 0; i < 10; i++) { document.querySelector(`[data-c="${i}"]`).click(); document.querySelector(`[data-d="${good ? L[idx].ok : 'ok'}"]`).click(); next(); } return { score, kinds, n, c3d }; }, good); await b3.close(); return { r, e }; };
    const g = await run(true), m = await run(false);
    ok('Andenes y Rampas', 'escena 3D con 10 hallazgos que cubren las 5 categorías y un área correcta; respuestas correctas 100', g.r.score === 100 && g.r.kinds === 6 && g.r.n === 10 && g.r.c3d, JSON.stringify(g.r));
    ok('Andenes y Rampas', 'marcar todo "está bien" no aprueba', m.r.score < 75, m.r.score + '/100');
    ok('Andenes y Rampas', 'sin errores de ejecución', !g.e.length && !m.e.length, g.e[0] || m.e[0] || ''); }
  // Cargas no estándar: cada recorrido cubre las 5 categorías y un área sin hallazgo; respuestas correctas 100, marcar todo "está bien" no aprueba
  { const run = async good => { const b3 = await chromium.launch({ args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--allow-file-access-from-files'] }); const cx_ = await b3.newContext(); const q = await cx_.newPage({ viewport: { width: 390, height: 844 } }); const e = []; q.on('pageerror', x => e.push(x.message)); await q.goto(url('juegos/cargas-no-estandar.html')); await q.waitForTimeout(300);
      await q.fill('#pname', 'Prueba Cargas'); await q.click('#startBtn');
      const r = await q.evaluate(good => { const kinds = new Set(L.map(c => c.ok)).size, n = L.length, c3d = !!document.querySelector('#v3d canvas'); for (let i = 0; i < 10; i++) { document.querySelector(`[data-c="${i}"]`).click(); document.querySelector(`[data-d="${good ? L[idx].ok : 'ok'}"]`).click(); next(); } return { score, kinds, n, c3d }; }, good); await b3.close(); return { r, e }; };
    const g = await run(true), m = await run(false);
    ok('Cargas No Estándar', 'escena 3D con 10 hallazgos que cubren las 5 categorías y un área correcta; respuestas correctas 100', g.r.score === 100 && g.r.kinds === 6 && g.r.n === 10 && g.r.c3d, JSON.stringify(g.r));
    ok('Cargas No Estándar', 'marcar todo "está bien" no aprueba', m.r.score < 75, m.r.score + '/100');
    ok('Cargas No Estándar', 'sin errores de ejecución', !g.e.length && !m.e.length, g.e[0] || m.e[0] || ''); }
  // Excepciones de surtido: cada recorrido cubre las 5 categorías y un área sin hallazgo; respuestas correctas 100, marcar todo "está bien" no aprueba
  { const run = async good => { const b3 = await chromium.launch({ args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--allow-file-access-from-files'] }); const cx_ = await b3.newContext(); const q = await cx_.newPage({ viewport: { width: 390, height: 844 } }); const e = []; q.on('pageerror', x => e.push(x.message)); await q.goto(url('juegos/excepciones-surtido.html')); await q.waitForTimeout(300);
      await q.fill('#pname', 'Prueba Excepciones'); await q.click('#startBtn');
      const r = await q.evaluate(good => { const kinds = new Set(L.map(c => c.ok)).size, n = L.length, c3d = !!document.querySelector('#v3d canvas'); for (let i = 0; i < 10; i++) { document.querySelector(`[data-c="${i}"]`).click(); document.querySelector(`[data-d="${good ? L[idx].ok : 'ok'}"]`).click(); next(); } return { score, kinds, n, c3d }; }, good); await b3.close(); return { r, e }; };
    const g = await run(true), m = await run(false);
    ok('Excepciones de Surtido', 'escena 3D con 10 hallazgos que cubren las 5 categorías y un área correcta; respuestas correctas 100', g.r.score === 100 && g.r.kinds === 6 && g.r.n === 10 && g.r.c3d, JSON.stringify(g.r));
    ok('Excepciones de Surtido', 'marcar todo "está bien" no aprueba', m.r.score < 75, m.r.score + '/100');
    ok('Excepciones de Surtido', 'sin errores de ejecución', !g.e.length && !m.e.length, g.e[0] || m.e[0] || ''); }
  // Flujo de materiales: cada recorrido cubre las 5 categorías y un área sin hallazgo; respuestas correctas 100, marcar todo "está bien" no aprueba
  { const run = async good => { const b3 = await chromium.launch({ args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--allow-file-access-from-files'] }); const cx_ = await b3.newContext(); const q = await cx_.newPage({ viewport: { width: 390, height: 844 } }); const e = []; q.on('pageerror', x => e.push(x.message)); await q.goto(url('juegos/flujo-materiales.html')); await q.waitForTimeout(300);
      await q.fill('#pname', 'Prueba Flujo'); await q.click('#startBtn');
      const r = await q.evaluate(good => { const kinds = new Set(L.map(c => c.ok)).size, n = L.length, c3d = !!document.querySelector('#v3d canvas'); for (let i = 0; i < 10; i++) { document.querySelector(`[data-c="${i}"]`).click(); document.querySelector(`[data-d="${good ? L[idx].ok : 'ok'}"]`).click(); next(); } return { score, kinds, n, c3d }; }, good); await b3.close(); return { r, e }; };
    const g = await run(true), m = await run(false);
    ok('Flujo de Materiales', 'escena 3D con 10 hallazgos que cubren las 5 categorías y un área correcta; respuestas correctas 100', g.r.score === 100 && g.r.kinds === 6 && g.r.n === 10 && g.r.c3d, JSON.stringify(g.r));
    ok('Flujo de Materiales', 'marcar todo "está bien" no aprueba', m.r.score < 75, m.r.score + '/100');
    ok('Flujo de Materiales', 'sin errores de ejecución', !g.e.length && !m.e.length, g.e[0] || m.e[0] || ''); }
  // Cross-docking: cada recorrido cubre las 5 categorías y un área sin hallazgo; respuestas correctas 100, marcar todo "está bien" no aprueba
  { const run = async good => { const b3 = await chromium.launch({ args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--allow-file-access-from-files'] }); const cx_ = await b3.newContext(); const q = await cx_.newPage({ viewport: { width: 390, height: 844 } }); const e = []; q.on('pageerror', x => e.push(x.message)); await q.goto(url('juegos/cross-docking.html')); await q.waitForTimeout(300);
      await q.fill('#pname', 'Prueba Crossdock'); await q.click('#startBtn');
      const r = await q.evaluate(good => { const kinds = new Set(L.map(c => c.ok)).size, n = L.length, c3d = !!document.querySelector('#v3d canvas'); for (let i = 0; i < 10; i++) { document.querySelector(`[data-c="${i}"]`).click(); document.querySelector(`[data-d="${good ? L[idx].ok : 'ok'}"]`).click(); next(); } return { score, kinds, n, c3d }; }, good); await b3.close(); return { r, e }; };
    const g = await run(true), m = await run(false);
    ok('Cross-Docking', 'escena 3D con 10 hallazgos que cubren las 5 categorías y un área correcta; respuestas correctas 100', g.r.score === 100 && g.r.kinds === 6 && g.r.n === 10 && g.r.c3d, JSON.stringify(g.r));
    ok('Cross-Docking', 'marcar todo "está bien" no aprueba', m.r.score < 75, m.r.score + '/100');
    ok('Cross-Docking', 'sin errores de ejecución', !g.e.length && !m.e.length, g.e[0] || m.e[0] || ''); }
  // Slotting: cada recorrido cubre las 5 categorías y un área sin hallazgo; respuestas correctas 100, marcar todo "está bien" no aprueba
  { const run = async good => { const b3 = await chromium.launch({ args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--allow-file-access-from-files'] }); const cx_ = await b3.newContext(); const q = await cx_.newPage({ viewport: { width: 390, height: 844 } }); const e = []; q.on('pageerror', x => e.push(x.message)); await q.goto(url('juegos/slotting.html')); await q.waitForTimeout(300);
      await q.fill('#pname', 'Prueba Slotting'); await q.click('#startBtn');
      const r = await q.evaluate(good => { const kinds = new Set(L.map(c => c.ok)).size, n = L.length, c3d = !!document.querySelector('#v3d canvas'); for (let i = 0; i < 10; i++) { document.querySelector(`[data-c="${i}"]`).click(); document.querySelector(`[data-d="${good ? L[idx].ok : 'ok'}"]`).click(); next(); } return { score, kinds, n, c3d }; }, good); await b3.close(); return { r, e }; };
    const g = await run(true), m = await run(false);
    ok('Slotting ABC', 'escena 3D con 10 hallazgos que cubren las 5 categorías y un área correcta; respuestas correctas 100', g.r.score === 100 && g.r.kinds === 6 && g.r.n === 10 && g.r.c3d, JSON.stringify(g.r));
    ok('Slotting ABC', 'marcar todo "está bien" no aprueba', m.r.score < 75, m.r.score + '/100');
    ok('Slotting ABC', 'sin errores de ejecución', !g.e.length && !m.e.length, g.e[0] || m.e[0] || ''); }
  // Armado de embarques: cada recorrido cubre las 5 categorías y un área sin hallazgo; respuestas correctas 100, marcar todo "está bien" no aprueba
  { const run = async good => { const b3 = await chromium.launch({ args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--allow-file-access-from-files'] }); const cx_ = await b3.newContext(); const q = await cx_.newPage({ viewport: { width: 390, height: 844 } }); const e = []; q.on('pageerror', x => e.push(x.message)); await q.goto(url('juegos/armado-embarques.html')); await q.waitForTimeout(300);
      await q.fill('#pname', 'Prueba Embarques'); await q.click('#startBtn');
      const r = await q.evaluate(good => { const kinds = new Set(L.map(c => c.ok)).size, n = L.length, c3d = !!document.querySelector('#v3d canvas'); for (let i = 0; i < 10; i++) { document.querySelector(`[data-c="${i}"]`).click(); document.querySelector(`[data-d="${good ? L[idx].ok : 'ok'}"]`).click(); next(); } return { score, kinds, n, c3d }; }, good); await b3.close(); return { r, e }; };
    const g = await run(true), m = await run(false);
    ok('Armado de Embarques', 'escena 3D con 10 hallazgos que cubren las 5 categorías y un área correcta; respuestas correctas 100', g.r.score === 100 && g.r.kinds === 6 && g.r.n === 10 && g.r.c3d, JSON.stringify(g.r));
    ok('Armado de Embarques', 'marcar todo "está bien" no aprueba', m.r.score < 75, m.r.score + '/100');
    ok('Armado de Embarques', 'sin errores de ejecución', !g.e.length && !m.e.length, g.e[0] || m.e[0] || ''); }
  // Conteo cíclico: cada recorrido cubre las 5 categorías y un área sin hallazgo; respuestas correctas 100, marcar todo "está bien" no aprueba
  { const run = async good => { const b3 = await chromium.launch({ args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--allow-file-access-from-files'] }); const cx_ = await b3.newContext(); const q = await cx_.newPage({ viewport: { width: 390, height: 844 } }); const e = []; q.on('pageerror', x => e.push(x.message)); await q.goto(url('juegos/conteo-ciclico.html')); await q.waitForTimeout(300);
      await q.fill('#pname', 'Prueba Conteo'); await q.click('#startBtn');
      const r = await q.evaluate(good => { const kinds = new Set(L.map(c => c.ok)).size, n = L.length, c3d = !!document.querySelector('#v3d canvas'); for (let i = 0; i < 10; i++) { document.querySelector(`[data-c="${i}"]`).click(); document.querySelector(`[data-d="${good ? L[idx].ok : 'ok'}"]`).click(); next(); } return { score, kinds, n, c3d }; }, good); await b3.close(); return { r, e }; };
    const g = await run(true), m = await run(false);
    ok('Conteo Cíclico ABC', 'escena 3D con 10 hallazgos que cubren las 5 categorías y un área correcta; respuestas correctas 100', g.r.score === 100 && g.r.kinds === 6 && g.r.n === 10 && g.r.c3d, JSON.stringify(g.r));
    ok('Conteo Cíclico ABC', 'marcar todo "está bien" no aprueba', m.r.score < 75, m.r.score + '/100');
    ok('Conteo Cíclico ABC', 'sin errores de ejecución', !g.e.length && !m.e.length, g.e[0] || m.e[0] || ''); }
  // Recepción y decantado en 3D: la escena se dibuja y tocar la tarima escanea
  { const b3 = await chromium.launch({ args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--allow-file-access-from-files'] }); const q = await (await b3.newContext()).newPage({ viewport: { width: 390, height: 844 } }); const e = []; q.on('pageerror', x => e.push(x.message));
    await q.goto(url('juegos/recepcion-decantado.html')); await q.waitForTimeout(300); await q.fill('#pname', 'Prueba Recepcion 3D'); await q.click('#startBtn'); await q.waitForTimeout(1500);
    const pt = await q.evaluate(() => { const c = document.querySelector('#v3dR canvas').getBoundingClientRect(); return { x: c.left + c.width / 2, y: c.top + c.height * .55, ok: E3.ok }; });
    await q.mouse.click(pt.x, pt.y); await q.waitForTimeout(300);
    const r = await q.evaluate(() => ({ scanned, act: !document.querySelector('#acts button').disabled }));
    await b3.close();
    ok('Recepción y decantado 3D', 'la escena 3D se dibuja y tocar la tarima la escanea', pt.ok && r.scanned && r.act, JSON.stringify(r));
    ok('Recepción y decantado 3D', 'sin errores de ejecución', !e.length, e[0] || ''); }
  // Dojo: la pantalla de situaciones tiene botón de regreso al registro
  { const q = await (await b.newContext()).newPage({ viewport: { width: 390, height: 844 } }); const e = []; q.on('pageerror', x => e.push(x.message)); await q.addInitScript(() => { window.TEST_MODE = true; window.STORY_SEEN = true; });
    await q.goto(url('juegos/dojo-de-mando.html')); await q.waitForTimeout(400); await q.evaluate(() => { $('pname').value = 'Prueba Regreso'; if ($('pnom')) $('pnom').value = ''; $('pnum').value = 'T123'; goBrief(); }); await q.waitForTimeout(300);
    const vis = await q.isVisible('#backReg'); await q.click('#backReg'); await q.waitForTimeout(200);
    const r = await q.evaluate(() => ({ intro: !$('intro').classList.contains('hidden'), scen: $('scen').classList.contains('hidden') })); await q.close();
    ok('Dojo de Mando', 'botón Regresar en la lista de situaciones vuelve al registro', vis && r.intro && r.scen, JSON.stringify(r)); }
  // Patio de andenes en 3D: tocar un tráiler y luego un andén lo asigna
  { const b3 = await chromium.launch({ args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--allow-file-access-from-files'] }); const q = await (await b3.newContext()).newPage({ viewport: { width: 1280, height: 900 } }); const e = []; q.on('pageerror', x => e.push(x.message));
    await q.goto(url('juegos/patio-andenes.html')); await q.waitForTimeout(300); await q.fill('#pname', 'Prueba Patio 3D'); await q.click('#startBtn'); await q.waitForTimeout(1200);
    const r = await q.evaluate(() => { let W = waiting(); let k = 0; while (!W.length && k++ < 4) { advance(); W = waiting(); } const t = W.find(x => D.some(d => fits(x, d) && d.t === null)) || W[0]; const d = D.find(dd => fits(t, dd) && dd.t === null); pick3d({ tipo: 'truck', id: t.id }); const sel = SEL === t.id; pick3d({ tipo: 'dock', n: d.n }); return { ok: E3.ok, sel, asignado: d.t === t.id, canvas: !!document.querySelector('#v3dP canvas') }; });
    await b3.close();
    ok('Patio de andenes 3D', 'escena 3D dibujada; tocar tráiler y andén lo asigna', r.ok && r.sel && r.asignado && r.canvas, JSON.stringify(r));
    ok('Patio de andenes 3D', 'sin errores de ejecución', !e.length, e[0] || ''); }
  // Todos los juegos tienen botón «← Inicio» visible y que no queda tapado
  { const fs = require('fs'); const files = fs.readdirSync('juegos').filter(f => f.endsWith('.html')); const bad = [];
    for (const f of files) { const q = await (await b.newContext()).newPage({ viewport: { width: 390, height: 844 } }); await q.goto(url('juegos/' + f)); await q.waitForTimeout(250);
      const v = await q.evaluate(() => { const x = document.getElementById('dickaInicio'); if (!x) return 'no'; const r = x.getBoundingClientRect(); return document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2) === x ? 'ok' : 'tapado'; }); if (v !== 'ok') bad.push(f + ':' + v); await q.close(); }
    ok('Navegación', 'los ' + files.length + ' juegos tienen botón «← Inicio» visible', !bad.length, bad.join(', ')); }
  // Acceso único: registrarse en un juego llena y deja continuar en los demás sin volver a capturar
  { const cx1 = await b.newContext({ viewport: { width: 390, height: 844 } }); const q = await cx1.newPage(); await q.goto(url('juegos/tablero-gerente.html')); await q.waitForTimeout(300);
    await q.fill('#pname', 'Ana Torres Ruiz'); await q.fill('#pnum', '10457'); await q.click('#startBtn'); await q.waitForTimeout(200); await q.close();
    const res = []; for (const f of ['5s-almacen.html', 'recepcion-decantado.html', 'dojo-de-mando.html', 'simulador-montacarga.html']) { const p2 = await cx1.newPage(); const e = []; p2.on('pageerror', x => e.push(x.message)); await p2.goto(url('juegos/' + f)); await p2.waitForTimeout(400);
      const r = await p2.evaluate(() => { const g = id => document.getElementById(id); return { banner: !!g('dickaPerfil'), num: (g('pnum') || g('rNum') || {}).value }; }); let av = false;
      if (r.banner) { await p2.waitForTimeout(600); av = await p2.evaluate(() => { const i = document.getElementById('intro') || document.getElementById('regScreen'); return !!i && (i.classList.contains('hidden') || getComputedStyle(i).display === 'none'); }); }
      res.push(f + ':' + (r.banner && r.num === '10457' && av && !e.length ? 'ok' : JSON.stringify(r) + av + (e[0] || ''))); await p2.close(); }
    const perf = await (async () => { const p3 = await cx1.newPage(); await p3.goto(url('juegos/5s-almacen.html')); const v = await p3.evaluate(() => JSON.parse(localStorage.getItem('dicka_perfil') || '{}')); await p3.close(); return v; })(); await cx1.close();
    ok('Acceso único', 'registrarse una vez: los demás juegos se saltan el registro y entran directo', res.every(x => x.endsWith(':ok')), res.join(' | '));
    ok('Acceso único', 'el puesto guardado no se pierde al pasar por juegos con otra lista de puestos', perf.puesto === 'Gerente de Operaciones', JSON.stringify(perf)); }
  // Perfiles (RH): rutas por puesto, avance por colaborador y edición que se guarda
  { const q = await (await b.newContext({ viewport: { width: 390, height: 844 } })).newPage(); const e = []; q.on('pageerror', x => e.push(x.message));
    await q.addInitScript(() => { const d = new Date().toISOString(); localStorage.setItem('dicka_console_results', JSON.stringify([{ juego: '5S en el Almacén', nombre: 'Prueba Perfil', num: '99001', puesto: 'Montacarguista', almacen: 'Agave 1', score: '90/100', aprobado: true, fecha: d }])); });
    await q.goto(url('index.html')); await q.waitForTimeout(500);
    const r = await q.evaluate(() => { openDash(); dashTab('prf'); const fila = [...document.querySelectorAll('#prfTabla tbody tr')].find(tr => tr.textContent.includes('Prueba Perfil')); const av = fila ? fila.children[2].textContent : '';
      prfToggle('Montacarguista'); const cb = document.querySelector('input[data-pu="Montacarguista"][data-g="matpel"]'); cb.checked = true; prfCheck(cb);
      const tabs = ['tabRes', 'tabPrf', 'tabSeg'].every(i => document.getElementById(i).getBoundingClientRect().right <= innerWidth);
      return { av, guardado: JSON.parse(localStorage.getItem('dicka_puestos')).Montacarguista.includes('matpel'), tabs }; }); await q.close();
    ok('Perfiles RH', 'cada colaborador muestra el avance de la ruta de su puesto', /1\/\d+ aprobados/.test(r.av), r.av);
    ok('Perfiles RH', 'editar la ruta de un puesto se guarda y las pestañas caben en celular', r.guardado && r.tabs && !e.length, JSON.stringify(r) + (e[0] || '')); }
  // Recorridos 3D: guía «¿Cómo se juega?», cada opción explica cuándo aplica y la retroalimentación dice qué era lo correcto y por qué
  { const b3 = await chromium.launch({ args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--allow-file-access-from-files'] }); const q = await (await b3.newContext()).newPage({ viewport: { width: 390, height: 844 } }); const e = []; q.on('pageerror', x => e.push(x.message));
    await q.goto(url('juegos/cross-docking.html')); await q.waitForTimeout(300); await q.fill('#pname', 'Prueba Claridad'); await q.click('#startBtn'); await q.waitForTimeout(1200);
    const r = await q.evaluate(() => { const tuto = !!document.getElementById('tuto'); document.getElementById('tutoOk').click(); const i = L.findIndex(c => c.ok === 's5'); openH(i); const hints = document.querySelectorAll('#stage .acts button small').length; const w = Object.keys(D).find(k => k !== L[idx].ok); document.querySelector(`[data-d="${w}"]`).click(); const fb = document.getElementById('fb').textContent; return { tuto, hints, fb: /Lo correcto/.test(fb) && /Por qué/.test(fb) && /Tu respuesta/.test(fb), opciones: getComputedStyle(document.querySelector('#stage .acts')).display === 'none', salidas: !!document.getElementById('salidas') }; });
    await b3.close();
    ok('Recorridos 3D', 'guía al iniciar, cada opción con su explicación y retroalimentación con lo correcto, el porqué y por qué no tu respuesta', r.tuto && r.hints === 6 && r.fb && r.opciones && r.salidas && !e.length, JSON.stringify(r) + (e[0] || '')); }
  // Portal: pide nombre, número, puesto y almacén una vez; ordena el catálogo por la ruta del puesto y los juegos entran directo
  { const cx2 = await b.newContext({ viewport: { width: 390, height: 844 }, conId: true }); const q = await cx2.newPage(); const e = []; q.on('pageerror', x => e.push(x.message));
    await q.goto(url('index.html')); await q.waitForTimeout(600); const pide = await q.isVisible('#idModal');
    await q.fill('#idNom', 'Ana'); await q.fill('#idApe', 'Torres Ruiz'); await q.fill('#idNum', '10457'); await q.selectOption('#idPuesto', 'Montacarguista'); await q.click('#idOk'); await q.waitForTimeout(300);
    const r = await q.evaluate(() => ({ modal: getComputedStyle(document.getElementById('idModal')).display, primero: document.querySelector('#grid .card h3').textContent, tags: document.querySelectorAll('.rutaTag').length }));
    const g = await cx2.newPage(); await g.goto(url('juegos/5s-almacen.html')); await g.waitForTimeout(900); const directo = await g.evaluate(() => document.getElementById('intro').classList.contains('hidden')); await cx2.close();
    ok('Portal', 'pide los datos una vez, ordena por la ruta del puesto y los juegos entran directo', pide && r.modal === 'none' && /Montacarga/.test(r.primero) && r.tags >= 5 && directo && !e.length, JSON.stringify(r) + directo + (e[0] || '')); }
  // Dojo: el cuadro para escribir explica cómo dictar con la voz del sistema (Windows + H / teclado del celular)
  { const r = []; for (const ua of ['Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/130 Safari/537.36 Edg/130', 'Mozilla/5.0 (Linux; Android 14) AppleWebKit/537.36 Chrome/130 Mobile Safari/537.36']) { const q = await (await b.newContext({ userAgent: ua })).newPage(); await q.addInitScript(() => { window.TEST_MODE = true; window.STORY_SEEN = true; }); await q.goto(url('juegos/dojo-de-mando.html')); await q.waitForTimeout(300); r.push(await q.evaluate(() => ownHTML().includes('dictTip') ? dictTip() : '')); await q.close(); }
    ok('Dojo de Mando', 'aviso de dictado: Windows + H en PC y micrófono del teclado en celular', /Windows \+ H/.test(r[0]) && /teclado/.test(r[1]), r.join(' | ')); }
  // Dojo: prueba de micrófono antes de practicar (escucha la frase, deja continuar con voz o escribir)
  { const bm2 = await chromium.launch({ args: ['--use-fake-ui-for-media-stream', '--use-fake-device-for-media-stream'] }); const cx = await bm2.newContext({ viewport: { width: 390, height: 844 }, permissions: ['microphone'] }); const q = await cx.newPage(); const e = []; q.on('pageerror', x => e.push(x.message));
    await q.addInitScript(() => { window.STORY_SEEN = true; sessionStorage.setItem('dicka_id_skip', '1'); class F { start() { setTimeout(() => this.onresult && this.onresult({ results: [[{ transcript: 'Buenos días equipo' }]] }), 600); } abort() { } stop() { } } window.SpeechRecognition = F; window.webkitSpeechRecognition = F; });
    await q.goto(url('juegos/dojo-de-mando.html')); await q.waitForTimeout(400); await q.evaluate(() => { $('pname').value = 'Prueba Microfono'; $('pnum').value = 'T321'; goBrief(); }); await q.waitForTimeout(800);
    const abierto = await q.isVisible('#micTest'); await q.click('#mtGo'); await q.waitForTimeout(2200); const r = await q.evaluate(() => ({ ok: /escuchamos/i.test($('mtMsg').textContent), voz: getComputedStyle($('mtVoz')).display !== 'none' })); await q.click('#mtVoz');
    const fin = await q.evaluate(() => ({ cerrado: !document.getElementById('micTest'), modo: localStorage.getItem('dicka_dojo_mic'), boton: !!document.getElementById('micTestBtn') })); await bm2.close();
    ok('Dojo de Mando', 'prueba de micrófono al entrar: escucha la frase y deja continuar con voz', abierto && r.ok && r.voz && fin.cerrado && fin.modo === 'on' && fin.boton && !e.length, JSON.stringify({ abierto, r, fin }) + (e[0] || '')); }
  // Métodos de surtido en 3D: almacén dibujado y las 8 ubicaciones del lote se surten tocándolas en 3D
  { const b3 = await chromium.launch({ args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--allow-file-access-from-files'] }); const q = await (await b3.newContext()).newPage({ viewport: { width: 1280, height: 900 } }); const e = []; q.on('pageerror', x => e.push(x.message));
    await q.goto(url('juegos/metodos-surtido.html')); await q.waitForTimeout(300); await q.fill('#pname', 'Prueba Surtido 3D'); await q.click('#startBtn'); await q.waitForTimeout(1200); await q.evaluate(() => routeStage()); await q.waitForTimeout(800);
    let hits = 0; for (let k = 0; k < 8; k++) { const i = await q.evaluate(() => { for (let j = 0; j < 8; j++) if (!route.includes(j)) return j; }); const pt = await q.evaluate(i => M3.screen(i), i); await q.mouse.click(pt.x, pt.y); await q.waitForTimeout(120); if (await q.evaluate(() => route.length) > k) hits++; else await q.evaluate(i => tapLoc(i, document.querySelector(`.loc.pick[data-i="${i}"]`)), i); }
    const r = await q.evaluate(() => ({ ok: M3 && M3.ok, n: route.length, fin: !!document.getElementById('finBtn') })); await b3.close();
    ok('Métodos de surtido 3D', 'almacén 3D y las ubicaciones del lote se surten tocándolas en la escena', r.ok && r.n === 8 && r.fin && hits >= 6 && !e.length, JSON.stringify(r) + ' 3D:' + hits + (e[0] || '')); }
  // Cada juego 3D explica su objetivo, qué hacer y cómo se califica (recuadro fijo arriba de la escena)
  { const fs = require('fs'); const files = fs.readdirSync('juegos').filter(f => f.endsWith('.html') && /class="objbox"/.test(fs.readFileSync('juegos/' + f, 'utf8'))); const bad = files.filter(f => { const s = fs.readFileSync('juegos/' + f, 'utf8'); return !/Objetivo:/.test(s) || !/Qué debes hacer:/.test(s) || !/Cómo se califica:/.test(s); });
    ok('Claridad', files.length + ' juegos 3D muestran objetivo, qué hacer y cómo se califica', files.length >= 16 && !bad.length, bad.join(', ')); }
  // Cadena de frío en 3D: cámara fría con la tarima del lote y el registrador mostrando la gráfica
  { const b3 = await chromium.launch({ args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--allow-file-access-from-files'] }); const q = await (await b3.newContext()).newPage({ viewport: { width: 390, height: 844 } }); const e = []; q.on('pageerror', x => e.push(x.message));
    await q.goto(url('juegos/cadena-frio.html')); await q.waitForTimeout(300); await q.fill('#pname', 'Prueba Frio 3D'); await q.click('#startBtn'); await q.waitForTimeout(1500);
    const r = await q.evaluate(() => ({ ok: E3.ok, pantalla: !!E3._pant, canvas: !!document.querySelector('#v3dF canvas'), obj: !!document.querySelector('.objbox') })); await b3.close();
    ok('Cadena de frío 3D', 'cámara fría 3D con registrador que muestra la gráfica y objetivo visible', r.ok && r.pantalla && r.canvas && r.obj && !e.length, JSON.stringify(r) + (e[0] || '')); }
  // Inspección de tráiler en 3D: tocar los puntos con anomalía en el tráiler 3D los marca
  { const b3 = await chromium.launch({ args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--allow-file-access-from-files'] }); const q = await (await b3.newContext()).newPage({ viewport: { width: 1280, height: 900 } }); const e = []; q.on('pageerror', x => e.push(x.message));
    await q.goto(url('juegos/inspeccion-trailer.html')); await q.waitForTimeout(300); await q.fill('#pname', 'Prueba Trailer 3D'); await q.click('#startBtn'); await q.waitForTimeout(1200);
    await q.evaluate(() => { const i = U.findIndex(u => u.anom.length); const t = U[0]; U[0] = U[i]; U[i] = t; show(); document.getElementById('t3d').scrollIntoView({ block: 'center' }); }); await q.waitForTimeout(400);
    const an = await q.evaluate(() => U[idx].anom); let hits = 0; for (const i of an) { const pt = await q.evaluate(i => T3.screen(i), i); await q.mouse.click(pt.x, pt.y); await q.waitForTimeout(120); if (await q.evaluate(i => SEL.has(i), i)) hits++; } await b3.close();
    ok('Inspección de tráiler 3D', 'tocar los puntos del tráiler 3D marca las anomalías', an.length > 0 && hits === an.length && !e.length, hits + '/' + an.length + (e[0] || '')); }
  // Devoluciones en 3D: tarima de la devolución en la escena y objetivo visible
  { const b3 = await chromium.launch({ args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--allow-file-access-from-files'] }); const q = await (await b3.newContext()).newPage({ viewport: { width: 390, height: 844 } }); const e = []; q.on('pageerror', x => e.push(x.message));
    await q.goto(url('juegos/devoluciones.html')); await q.waitForTimeout(300); await q.fill('#pname', 'Prueba Devol 3D'); await q.click('#startBtn'); await q.waitForTimeout(1500);
    const r = await q.evaluate(() => ({ ok: E3.ok, canvas: !!document.querySelector('#v3dD canvas'), obj: !!document.querySelector('.objbox') })); await b3.close();
    ok('Devoluciones 3D', 'zona de devoluciones 3D con la tarima del caso y objetivo visible', r.ok && r.canvas && r.obj && !e.length, JSON.stringify(r) + (e[0] || '')); }
  // Carga de unidades en 3D: tocar los lugares de la caja 3D coloca las tarimas
  { const b3 = await chromium.launch({ args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--allow-file-access-from-files'] }); const q = await (await b3.newContext()).newPage({ viewport: { width: 1280, height: 900 } }); const e = []; q.on('pageerror', x => e.push(x.message));
    await q.goto(url('juegos/carga-unidades.html')); await q.waitForTimeout(300); await q.fill('#pname', 'Prueba Carga 3D'); await q.evaluate(() => start()); await q.waitForTimeout(1200); let hits = 0;
    for (let k = 0; k < 4; k++) { await q.evaluate(() => { selT(tarimas.find(t => t.pos === null).id); document.getElementById('c3d').scrollIntoView({ block: 'center' }); }); const pt = await q.evaluate(k => C3.screen(k), k); await q.mouse.click(pt.x, pt.y); await q.waitForTimeout(120); if (await q.evaluate(k => !!grid[k], k)) hits++; }
    await b3.close(); ok('Carga de unidades 3D', 'tocar la caja del tráiler 3D coloca las tarimas', hits === 4 && !e.length, hits + '/4' + (e[0] || '')); }
  // Surtido express en 3D: tocar en el rack 3D la caja de la ubicación correcta cuenta como acierto
  { const b3 = await chromium.launch({ args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--allow-file-access-from-files'] }); const q = await (await b3.newContext()).newPage({ viewport: { width: 1280, height: 900 } }); const e = []; q.on('pageerror', x => e.push(x.message));
    await q.goto(url('juegos/surtido-express.html')); await q.waitForTimeout(300); await q.fill('#pname', 'Prueba Surtido 3D'); await q.evaluate(() => start()); await q.waitForTimeout(1200);
    const k = await q.evaluate(() => { aisle = cur.loc[0]; drawAisles(); drawRack(); document.getElementById('s3d').scrollIntoView({ block: 'center' }); return cur.loc; }); await q.waitForTimeout(300);
    const pt = await q.evaluate(k => S3.screen(k), k); const c0 = await q.evaluate(() => correct); await q.mouse.click(pt.x, pt.y); await q.waitForTimeout(400); const c1 = await q.evaluate(() => correct); await b3.close();
    ok('Surtido express 3D', 'tocar la caja correcta en el rack 3D cuenta como ubicación correcta', c1 > c0 && !e.length, k + ' ' + c0 + '→' + c1 + (e[0] || '')); }
  // Turno Seguro: la escena 3D es opcional y solo se descarga al pedirla (ahorra datos con poca señal)
  { const b3 = await chromium.launch({ args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--allow-file-access-from-files'] }); const q = await (await b3.newContext()).newPage({ viewport: { width: 390, height: 844 } }); const e = []; q.on('pageerror', x => e.push(x.message)); const req = []; q.on('request', r => req.push(r.url()));
    await q.goto(url('juegos/turno-seguro.html')); await q.waitForTimeout(300); await q.evaluate(() => { document.querySelectorAll('#intro input').forEach(x => { if (x.type !== 'checkbox') x.value = x.inputMode === 'numeric' ? '10457' : 'Prueba Turno'; }); start(); }); await q.evaluate(() => document.getElementById('game').classList.remove('hidden')); await q.waitForTimeout(500); const antes = req.some(u => /three\.min/.test(u));
    await q.click('#ver3dBtn'); await q.waitForTimeout(2500); const r = await q.evaluate(() => ({ ok: !!E3T && E3T.ok, link: !!document.querySelector('a[href="simulador-montacarga.html"]') })); await b3.close();
    ok('Turno Seguro', '3D opcional: no descarga Three.js hasta pedirlo y enlaza al simulador 3D completo', !antes && r.ok && r.link && !e.length, JSON.stringify({ antes, ...r }) + (e[0] || '')); }
  // Planeación de Personal: el gerente 3D presenta el reto, comenta el plan y da retroalimentación al final
  { const b3 = await chromium.launch({ args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--allow-file-access-from-files'] }); const q = await (await b3.newContext()).newPage({ viewport: { width: 1280, height: 900 } }); const e = []; q.on('pageerror', x => e.push(x.message));
    await q.goto(url('juegos/planeacion-personal.html')); await q.waitForTimeout(300); await q.fill('#pname', 'Prueba Gerente'); await q.evaluate(() => start()); await q.waitForTimeout(800); const t0 = await q.textContent('#gbub');
    await q.fill('#ev0', '15'); await q.dispatchEvent('#ev0', 'input'); await q.waitForTimeout(700); const t1 = await q.textContent('#gbub');
    await q.evaluate(() => runWeek()); await q.waitForTimeout(300); const r = await q.evaluate(() => ({ ok: !!G3, enEnd: !!document.querySelector('#end #ger'), fin: document.getElementById('gbub').textContent })); await b3.close();
    ok('Planeación de Personal 3D', 'el gerente 3D presenta el reto, comenta el plan y retroalimenta al final', r.ok && /cajas/.test(t0) && t1 !== t0 && r.enEnd && r.fin !== t1 && !e.length, JSON.stringify({ t0: t0.slice(0, 30), t1: t1.slice(0, 30), ...r }).slice(0, 200) + (e[0] || '')); }
  // Tablero del Gerente: el director 3D presenta las metas, comenta cada cierre de mes y el resultado final
  { const b3 = await chromium.launch({ args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--allow-file-access-from-files'] }); const q = await (await b3.newContext()).newPage({ viewport: { width: 1280, height: 900 } }); const e = []; q.on('pageerror', x => e.push(x.message));
    await q.goto(url('juegos/tablero-gerente.html')); await q.waitForTimeout(300); await q.fill('#pname', 'Prueba Director'); await q.evaluate(() => start()); await q.waitForTimeout(800); const t0 = await q.textContent('#gbub');
    await q.selectOption('#dOT', '1'); await q.evaluate(() => month()); const t1 = await q.textContent('#gbub');
    await q.evaluate(() => { month(); month(); month(); }); await q.waitForTimeout(300); const r = await q.evaluate(() => ({ ok: !!G3, enEnd: !!document.querySelector('#end #ger'), fin: document.getElementById('gbub').textContent })); await b3.close();
    ok('Tablero del Gerente 3D', 'el director 3D presenta metas, comenta cada mes y el trimestre', r.ok && /OTIF 97/.test(t0) && /OTIF de/.test(t1) && /tiempo extra/.test(t1) && r.enEnd && /trimestre/.test(r.fin) && !e.length, JSON.stringify({ t0: t0.slice(0, 30), t1: t1.slice(0, 60), ...r }).slice(0, 220) + (e[0] || '')); }
  // tráfico: si los avatares cargaron, debe haber movimiento sin atascos
  const traf = await p.evaluate(() => { if (!NPC.forks.length) return null; const snap = () => NPC.forks.map(f => f.x.toFixed(1) + ',' + f.z.toFixed(1)).join('|');
    const a = snap(); for (let i = 0; i < 2000; i++) updateTraffic(0.05); const b = snap(); for (let i = 0; i < 2000; i++) updateTraffic(0.05); return { mov: a !== b && b !== snap() }; });
  ok('Tráfico', 'montacargas NPC sin atascos', traf ? traf.mov : true, traf ? '' : 'omitido: los avatares no cargaron en este entorno');
  ok('Simulador', 'sin errores de ejecución', !errs.length, errs[0] || '');
  await b.close();

  // Reporte
  const fallas = res.filter(r => !r.pasa); let area = '';
  for (const r of res) { if (r.area !== area) { area = r.area; console.log('\n' + area); } console.log(`  ${r.pasa ? '✅' : '❌'} ${r.prueba}${r.detalle ? '  — ' + r.detalle : ''}`); }
  console.log(`\n${res.length - fallas.length}/${res.length} pruebas correctas`); process.exit(fallas.length ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
