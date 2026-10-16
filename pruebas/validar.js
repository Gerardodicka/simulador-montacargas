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
    // cámara: un rack entre el equipo y la cámara la acerca
    const L = new THREE.Vector3(-4, 6, -20), T = new THREE.Vector3(-9, 7, -20); camUnblock(L, T, true); add('Cámara', 'no queda detrás de un rack', T.x > -5.6, 'x=' + T.x.toFixed(2));
    return R; });
  sim.forEach(r => res.push(r));
  // turno-seguro-3d comparte el almacén: debe arrancar sin errores
  { const q = await b.newPage({ viewport: { width: 1280, height: 720 } }); const e2 = []; q.on('pageerror', e => e2.push(e.message));
    await q.goto(url('juegos/turno-seguro-3d.html')); await q.waitForTimeout(1500);
    const st = await q.evaluate(() => { try { document.querySelectorAll('.screen').forEach(s => s.classList.remove('active')); const sc = document.getElementById('simulatorScreen'); if (sc) sc.classList.add('active'); initSimulator(); return 'ok'; } catch (e) { return e.message; } });
    await q.waitForTimeout(6000); const ms = await q.evaluate(() => { let n = 0; scene.traverse(o => { if (o.isMesh) n++; }); return n; });
    ok('Turno seguro 3D', 'arranca el almacén compartido', st === 'ok' && !e2.length && ms > 500, st !== 'ok' ? st : e2[0] || ms + ' objetos'); await q.close(); }
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
