/* DICKA · Ejemplo animado "▶ Ver ejemplo" para todos los simuladores.
   Una mano recorre la pantalla del juego en orden (objetivo → datos → escena 3D → decisión → explicación → siguiente),
   juega una jugada real para que se vea el resultado y al final ofrece reiniciar para jugar.
   No guarda resultados: al reiniciar se vuelve a empezar desde cero. */
(function () {
  const vis = el => { if (!el) return false; const r = el.getBoundingClientRect(), s = getComputedStyle(el); return r.width > 4 && r.height > 4 && s.visibility !== 'hidden' && s.display !== 'none' && !el.closest('.hidden'); };
  const q = (sels, root) => { for (const s of sels) { const el = [...(root || document).querySelectorAll(s)].find(vis); if (el) return el; } return null; };
  const wait = ms => new Promise(r => setTimeout(r, ms));
  const css = `#dkDemoBtn{position:fixed;right:14px;bottom:14px;z-index:8000;background:#f5b800;color:#1a1f36;border:none;border-radius:999px;padding:12px 18px;font:800 16px system-ui,sans-serif;box-shadow:0 6px 18px rgba(0,0,0,.3);cursor:pointer}
#dkDemoBtn:hover{filter:brightness(1.05)}#dkHand{position:fixed;z-index:9600;font-size:42px;pointer-events:none;transition:left .9s ease,top .9s ease,transform .2s;filter:drop-shadow(0 3px 4px rgba(0,0,0,.4));left:50%;top:60%}
#dkHand.tap{transform:scale(.8)}#dkCap{position:fixed;z-index:9601;left:50%;bottom:16px;transform:translateX(-50%);max-width:min(560px,calc(100% - 24px));background:#1D2586;color:#fff;border-radius:14px;padding:12px 16px;font:600 16.5px/1.45 system-ui,sans-serif;box-shadow:0 8px 24px rgba(0,0,0,.35)}
#dkCap b{color:#ffd54f}#dkCap .st{display:block;font-size:12.5px;opacity:.8;letter-spacing:.06em;margin-bottom:2px}#dkCap button{margin-top:8px;margin-right:6px;border:none;border-radius:10px;padding:8px 12px;font:800 14px system-ui;cursor:pointer}
.dkHi{outline:4px solid #f5b800!important;outline-offset:3px;border-radius:10px;transition:outline-color .3s}`;
  let running = false, step = 0, TOTAL = 8;
  function ui() { if (document.getElementById('dkDemoBtn')) return; const st = document.createElement('style'); st.textContent = css; document.head.appendChild(st);
    const b = document.createElement('button'); b.id = 'dkDemoBtn'; b.type = 'button'; b.textContent = '▶ Ver ejemplo'; b.title = 'Mira cómo se juega, paso a paso'; b.onclick = run; document.body.appendChild(b); }
  function hand() { let h = document.getElementById('dkHand'); if (!h) { h = document.createElement('div'); h.id = 'dkHand'; h.textContent = '👆'; document.body.appendChild(h); } return h; }
  function cap(t, extra) { let c = document.getElementById('dkCap'); if (!c) { c = document.createElement('div'); c.id = 'dkCap'; document.body.appendChild(c); } c.innerHTML = `<span class="st">EJEMPLO · PASO ${++step}</span>${t}${extra || ''}`; return c; }
  async function point(el, t, ms) { if (!el) return false; document.querySelectorAll('.dkHi').forEach(x => x.classList.remove('dkHi')); el.scrollIntoView({ block: 'center', behavior: 'smooth' }); await wait(650);
    const r = el.getBoundingClientRect(), h = hand(); h.style.left = Math.min(innerWidth - 50, r.left + r.width * .5) + 'px'; h.style.top = Math.min(innerHeight - 60, r.top + Math.min(r.height * .5, 60)) + 'px'; el.classList.add('dkHi'); const c = cap(t, '<br><button style="background:#f5b800;color:#1a1f36" class="dkNext">Siguiente paso ▶</button><button style="background:transparent;color:#fff;border:1px solid #fff" class="dkStop">Salir del ejemplo</button>'); await new Promise((res, rej) => { c.querySelector('.dkNext').onclick = res; c.querySelector('.dkStop').onclick = () => rej(new Error('stop')); }); return true; }
  async function tap(el) { const h = hand(); h.classList.add('tap'); await wait(220); h.classList.remove('tap'); try { el.click(); } catch (e) { } await wait(900); }
  function end() { running = false; document.querySelectorAll('.dkHi').forEach(x => x.classList.remove('dkHi')); const h = document.getElementById('dkHand'); if (h) h.remove(); const b = document.getElementById('dkDemoBtn'); if (b) b.style.display = ''; }
  async function run() {
    if (running) return; const game = document.getElementById('game'); if (!game || game.classList.contains('hidden')) { const sb = document.getElementById('startBtn'); if (sb && vis(sb)) { cap('Primero escribe tu nombre y toca <b>COMENZAR</b>; después toca <b>▶ Ver ejemplo</b>.', '<br><button onclick="this.parentNode.remove()">Entendido</button>'); step = 0; } return; }
    running = true; step = 0; document.getElementById('dkDemoBtn').style.display = 'none'; window.DK_DEMO = true;
    const T = window.DEMO_TXT || {};
    try {
      // 0. barra superior: avance y puntos
      await point(q(['.topbar', '#top', '.hud', '.bar']), T.top || '📍 Arriba ves en qué <b>caso vas</b> (por ejemplo 1 de 8) y tus <b>puntos</b> acumulados.');
      // 1. objetivo
      await point(q(['.objbox', '#intro .info', '.info']), T.obj || '🎯 Primero lee el <b>objetivo</b>: qué tienes que lograr, qué debes hacer y cómo se califica.', 3200);
      // 1b. guía paso a paso
      const hb = q(['details.howbox', '.howbox']); if (hb) { if (hb.tagName === 'DETAILS') hb.open = true; await point(hb, T.guia || '📘 Aquí está la <b>guía</b> con las reglas que se califican. Ábrela cuando tengas duda.'); }
      // recorridos 3D: abre el primer punto de revisión para mostrar el caso y la decisión
      if (!q(['.acts button:not([disabled])']) && typeof window.openH === 'function') { try { window.openH(0); } catch (e) { } await wait(700); }
      // 2. datos del caso
      await point(q(['#stage .cmp', '#stage .kgrid', '.kgrid', '#stage .unit', '#stage .seal', '.unit', '#stage table', '#stage', '.panel', '.case']), T.datos || '📋 Revisa los <b>datos del caso</b>: aquí está la información que necesitas para decidir.', 3200);
      // 3. escena 3D
      const v = q(['.v3dbox canvas', '.ger canvas', '.c3d canvas', '.s3d canvas', '.t3d canvas', '#v3d canvas', '#stage3d canvas', 'canvas']);
      if (v) await point(v.parentElement && vis(v.parentElement) ? v.parentElement : v, T.v3d || '🧊 Esta es la <b>escena 3D</b>: arrástrala para girar y, donde el juego lo pida, <b>toca</b> el objeto (rampa, ubicación, punto) directamente.', 3200);
      // recorridos 3D: abre el primer punto de revisión para mostrar la decisión
      // juegos con tabla de captura (planeación, tablero): se señala dónde capturar
      const inp = q(['#plan input', '.dec select', '#dExtra']); if (inp && !q(['.acts button:not([disabled])'])) { await point(inp, T.captura || '✏️ Aquí <b>capturas tu decisión</b> (cantidades u opciones). Los totales y la escena se actualizan al momento para que veas el efecto.'); const rb = q(['#runBtn']); if (rb) await point(rb, T.run || '▶ Cuando tu plan esté listo, toca este botón para ver el resultado. (En el ejemplo no lo presionamos para no gastar tu intento.)'); }
      // 4. decisión: juega una opción real
      const opt = q(['.acts button[data-ok="1"]', '.acts button:not([disabled])', '.opts button:not([disabled])', '.opt:not(.dis)', '.choices button:not([disabled])', '.ans button:not([disabled])', '#stage button:not(.btn)']);
      if (opt) { await point(opt, (T.decide || '👉 Ahora <b>elige</b> la opción que corresponde según los datos.') + ' Toca <b>Siguiente paso</b> y verás cómo se selecciona.'); await tap(opt); await wait(600); }
      // 5. explicación
      const fb = q(['.why', '#fb .why', '.fb', '.feedback', '.expl', '#fb']);
      if (fb) { const bad = /❌|Lo correcto|incorrect/i.test(fb.textContent); await point(fb, (T.why || '💡 Siempre te <b>explicamos</b> el resultado: qué era lo correcto y por qué.') + (bad ? ' <i>En este ejemplo la opción no era la correcta: lee la explicación para entender la regla.</i>' : ''), 4200); }
      // 6. siguiente / cierre
      const nx = q(['#nextBtn', '.next', '#fb button.btn', '#stage button.btn']); if (nx) await point(nx, T.next || '➡️ Toca <b>SIGUIENTE</b> para pasar al próximo caso. Al final verás tu calificación y qué repasar.', 2800);
      const c = cap('✅ <b>Así se juega.</b> Este ejemplo no cuenta para tu calificación. ¿Listo para hacerlo tú?', '<br><button style="background:#2e9e5b;color:#fff" id="dkGo">Reiniciar y jugar</button><button style="background:#fff;color:#1D2586" id="dkMore">Ver de nuevo</button>');
      document.querySelectorAll('.dkHi').forEach(x => x.classList.remove('dkHi')); const h = document.getElementById('dkHand'); if (h) h.remove();
      c.querySelector('#dkGo').onclick = () => { try { sessionStorage.setItem('dicka_demo_done', '1'); } catch (e) { } location.reload(); };
      c.querySelector('#dkMore').onclick = () => { try { sessionStorage.setItem('dicka_demo_again', '1'); } catch (e) { } location.reload(); };
    } catch (e) { const c = document.getElementById('dkCap'); if (c) c.remove(); end(); if (e && e.message === 'stop') return; }
    running = false; }
  function boot() { ui(); try { if (sessionStorage.getItem('dicka_demo_again')) { sessionStorage.removeItem('dicka_demo_again'); const t = setInterval(() => { const g = document.getElementById('game'); if (g && !g.classList.contains('hidden')) { clearInterval(t); setTimeout(run, 1200); } }, 500); setTimeout(() => clearInterval(t), 15000); } } catch (e) { } }
  window.DKDemo = { run };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
})();
