// Uso: node pruebas/calidad.js
// Revisión de calidad: voz (tono, velocidad, voz por personaje), micrófono, movimiento de avatares y cámara, sonido y manejo del montacargas
const { chromium } = require('playwright'); const path = require('path'); const ROOT = path.join(__dirname, '..'); const url = f => 'file://' + path.join(ROOT, f);
const R = []; const ok = (a, t, c, d) => { R.push([a, t, !!c, d || '']); console.log(c ? '✅' : '❌', a, '·', t, d ? '— ' + d : ''); };
(async () => {
  const b = await chromium.launch({ args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--allow-file-access-from-files'] });
  // ===== DOJO: voz, boca, brazos, cámara =====
  { const ctx = await b.newContext({ viewport: { width: 1280, height: 800 } });
    await ctx.addInitScript(() => { const V = [{ name: 'Microsoft Dalia Online (Natural) - Spanish (Mexico)', lang: 'es-MX', localService: false }, { name: 'Microsoft Jorge Online (Natural) - Spanish (Mexico)', lang: 'es-MX', localService: false }, { name: 'Google español de Estados Unidos', lang: 'es-US', localService: false }, { name: 'eSpeak Spanish', lang: 'es', localService: true }];
      window.__utt = []; const T = { speaking: false, pending: false, paused: false, onvoiceschanged: null, getVoices: () => V, addEventListener() { }, removeEventListener() { }, cancel() { T.speaking = false; }, pause() { }, resume() { },
        speak(u) { window.__utt.push({ t: u.text, v: u.voice && u.voice.name, r: u.rate, p: u.pitch, l: u.lang }); T.speaking = true; setTimeout(() => { u.onstart && u.onstart(); setTimeout(() => { T.speaking = false; u.onend && u.onend(); }, Math.min(2500, 60 * u.text.length)); }, 20); } };
      Object.defineProperty(window, 'speechSynthesis', { get: () => T, configurable: true }); window.SpeechSynthesisUtterance = function (t) { this.text = t; this.lang = ''; this.rate = 1; this.pitch = 1; this.voice = null; }; });
    const q = await ctx.newPage(); const e = []; q.on('pageerror', x => e.push(x.message)); await q.goto(url('juegos/dojo-de-mando.html')); await q.waitForTimeout(1200);
    await q.evaluate(async () => { const w = ms => new Promise(r => setTimeout(r, ms)); const P = document.getElementById('ppuesto'); P.value = 'Gerente de Operaciones'; P.dispatchEvent(new Event('change')); pnom.value = 'Prueba'; pape.value = 'QA'; pnum.value = '12345'; goBtn.click(); await w(500); document.getElementById('sc_presupuesto').click(); });
    // muestreo de boca y brazos mientras hablan (se espera a que carguen los avatares de oficina y se fuerza un turno de habla)
    const S = await q.evaluate(async () => { const w = ms => new Promise(r => setTimeout(r, ms)); await w(6000); ['ana', 'ricardo'].forEach(k => AV[k] && (AV[k].talkT = 8)); let mouthMax = { ana: 0, ricardo: 0 }, armMove = { ana: 0, ricardo: 0 }, prev = {}; for (let i = 0; i < 70; i++) { await w(120); ['ana', 'ricardo'].forEach(k => { const a = AV[k]; if (!a) return; mouthMax[k] = Math.max(mouthMax[k], a.mOpen || 0); if (a.armB && a.armB.RightForeArm) { const qq = a.armB.RightForeArm.quaternion; if (prev[k]) armMove[k] = Math.max(armMove[k], 1 - Math.abs(prev[k].dot(qq))); prev[k] = qq.clone(); } }); }
      return { utt: window.__utt.slice(0, 40), mouthMax, armMove, glb: { ana: !!(AV.ana && AV.ana.av), ricardo: !!(AV.ricardo && AV.ricardo.av) } }; });
    const U = S.utt, fem = U.filter(u => /patricia|finanzas|doce por ciento|mandato/i.test(u.t)), mal = U.filter(u => /te apoyo|caso de negocio|números/i.test(u.t)), nar = U.filter(u => /Sala de juntas|presupuesto del próximo/i.test(u.t));
    ok('Dojo · voz', 'se narra en español de México', U.length && U.every(u => u.l === 'es-MX'), U.length + ' frases');
    ok('Dojo · voz', 'tono natural (pitch 1) y velocidad 0.9–1.1', U.every(u => u.p >= .95 && u.p <= 1.05 && u.r >= .9 && u.r <= 1.1), [...new Set(U.map(u => u.p + '/' + u.r))].join(' '));
    ok('Dojo · voz', 'voz femenina para la directora de finanzas', fem.length && fem.every(u => /Dalia/.test(u.v)), fem.map(u => u.v).join(' | ').slice(0, 90));
    ok('Dojo · voz', 'voz masculina para el director de operaciones', mal.length && mal.every(u => /Jorge/.test(u.v)), mal.map(u => u.v).join(' | ').slice(0, 90));
    ok('Dojo · voz', 'evita voces robóticas (eSpeak)', U.every(u => !/eSpeak/.test(u.v || '')), '');
    ok('Dojo · voz', 'divide en frases (pausas naturales)', U.length >= 4 && U.every(u => u.t.length < 260), 'máx ' + Math.max(...U.map(u => u.t.length)) + ' caracteres');
    ok('Dojo · avatares', 'mueven la boca al hablar', S.mouthMax.ana > .1 || S.mouthMax.ricardo > .1, JSON.stringify(S.mouthMax) + ' glb ' + JSON.stringify(S.glb));
    ok('Dojo · avatares', 'gesticulan con los brazos', S.armMove.ana > 1e-4 || S.armMove.ricardo > 1e-4, JSON.stringify(S.armMove));
    const fps = await q.evaluate(async () => { let n = 0; const t = performance.now(); await new Promise(r => { const f = () => { n++; if (performance.now() - t < 2000) requestAnimationFrame(f); else r(); }; requestAnimationFrame(f); }); return n / 2; }); console.log('   FPS Dojo (entorno de prueba):', fps);
    // cámara: caminar y mirar
    const c0 = await q.evaluate(() => cam.position.toArray().map(v => +v.toFixed(2)));
    await q.keyboard.down('w'); await q.waitForTimeout(4000); await q.keyboard.up('w'); await q.waitForTimeout(600);
    const c1 = await q.evaluate(() => cam.position.toArray().map(v => +v.toFixed(2)));
    const box = await q.locator('#stage canvas').boundingBox(); const y0 = await q.evaluate(() => FP.yaw); await q.mouse.move(box.x + box.width / 2, box.y + box.height / 2); await q.mouse.down(); await q.mouse.move(box.x + box.width / 2 + 150, box.y + box.height / 2, { steps: 5 }); await q.mouse.up(); const y1 = await q.evaluate(() => FP.yaw);
    ok('Dojo · cámara', 'camina con W (primera persona)', Math.hypot(c1[0] - c0[0], c1[2] - c0[2]) > .3, c0.join(',') + ' → ' + c1.join(','));
    ok('Dojo · cámara', 'arrastrar gira la vista', Math.abs(y1 - y0) > .2, y0.toFixed(2) + ' → ' + y1.toFixed(2));
    const inside = await q.evaluate(() => { const b = FP_BOUNDS[FP.sc]; return camTo.x >= b[0] && camTo.x <= b[1] && camTo.z >= b[2] && camTo.z <= b[3]; });
    ok('Dojo · cámara', 'no se sale del escenario (sala de juntas)', inside, '');
    ok('Dojo', 'sin errores de ejecución', !e.length, e[0] || ''); await ctx.close(); }

  // ===== MONTACARGAS: manejo, claxon, alarma =====
  { const ctx = await b.newContext({ viewport: { width: 1280, height: 720 } });
    await ctx.addInitScript(() => { window.__osc = 0; const AC = window.AudioContext || window.webkitAudioContext; if (AC) { const o = AC.prototype.createOscillator; AC.prototype.createOscillator = function () { window.__osc++; return o.call(this); }; } });
    const p = await ctx.newPage(); const e = []; p.on('pageerror', x => e.push(x.message)); await p.goto(url('juegos/simulador-montacarga.html')); await p.waitForTimeout(1500);
    await p.evaluate(() => { document.querySelectorAll('.screen').forEach(s => s.classList.remove('active')); document.getElementById('simulatorScreen').classList.add('active'); initSimulator(); }); await p.waitForTimeout(6000);
    const fpsM = await p.evaluate(async () => { let n = 0; const t = performance.now(); await new Promise(r => { const f = () => { n++; if (performance.now() - t < 2000) requestAnimationFrame(f); else r(); }; requestAnimationFrame(f); }); return n / 2; }); console.log('   FPS montacargas (entorno de prueba):', fpsM);
    const pre = await p.evaluate(() => { resetPractice(); try { SAFE.keyOn = true; SAFE.belt = true; SAFE.brake = false; } catch (x) { } return { x: forkPosition.x, z: forkPosition.z, osc: window.__osc }; });
    if (fpsM >= 10) { await p.keyboard.down('w'); await p.waitForTimeout(2500); const mid = await p.evaluate(() => ({ v: velKmh, x: forkPosition.x, z: forkPosition.z })); await p.keyboard.up('w'); await p.waitForTimeout(2500); const stop = await p.evaluate(() => velKmh);
      ok('Montacargas · manejo', 'avanza con W y respeta el límite de velocidad', Math.hypot(mid.x - pre.x, mid.z - pre.z) > .5 && Math.abs(mid.v) <= SIM_LIM(), `vel ${mid.v.toFixed(1)} km/h`); ok('Montacargas · manejo', 'frena al soltar', Math.abs(stop) < 1, `vel ${stop.toFixed(2)}`); }
    else { await p.keyboard.down('w'); await p.waitForTimeout(3000); const mid = await p.evaluate(() => ({ v: velKmh, x: forkPosition.x, z: forkPosition.z })); await p.keyboard.up('w');
      ok('Montacargas · manejo', 'responde al acelerador (W) — entorno lento: ' + fpsM + ' cps, solo se verifica que se mueva', mid.v > 0 && Math.hypot(mid.x - pre.x, mid.z - pre.z) > .01, `vel ${mid.v.toFixed(2)} km/h`); }
    const h = await p.evaluate(() => { const o0 = window.__osc; honk(); return { d: window.__osc - o0, honks: SAFEM.honks }; });
    ok('Montacargas · sonido', 'claxon genera sonido y se cuenta', h.d > 0 && h.honks >= 1, JSON.stringify(h));
    const al = await p.evaluate(async () => { const o0 = window.__osc; injectFalla('alarma'); FALLA.beep = 0; fallaTick(performance.now()); const d = window.__osc - o0; velKmh = 0; simSpeed = 0; reportFalla(); return d; });
    ok('Montacargas · sonido', 'alarma de falla suena', al > 0, al + ' tonos');
    const tilt = await p.evaluate(() => { const t0 = forklift.rotation.y; return typeof t0 === 'number'; });
    ok('Montacargas', 'sin errores de ejecución', !e.length, e[0] || ''); await ctx.close(); }
  await b.close(); const bad = R.filter(r => !r[2]); console.log(`\n${R.length - bad.length}/${R.length} revisiones correctas`); process.exit(bad.length ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
function SIM_LIM() { return 16.5; }
