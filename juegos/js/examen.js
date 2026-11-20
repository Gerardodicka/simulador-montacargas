/* DICKA · Modo examen con cronómetro (#52)
   Casilla opcional antes de COMENZAR. Si se activa: cronómetro visible por caso y total,
   y al final se agregan el tiempo total, el promedio por caso y el caso más lento al resultado. */
(function () {
  let on = false, t0 = 0, tc = 0, lastIdx = -1, times = [], shown = false, pill = null;
  const fmt = s => s >= 60 ? Math.floor(s / 60) + ':' + String(Math.round(s % 60)).padStart(2, '0') : Math.round(s) + ' s';
  const curIdx = () => { try { return typeof idx === 'number' ? idx : -1; } catch (e) { return -1; } };
  function inject() { const sb = document.getElementById('startBtn'); if (!sb || document.getElementById('dkExam')) return;
    const l = document.createElement('label'); l.id = 'dkExamL'; l.style.cssText = 'display:flex;align-items:center;gap:8px;margin:.6rem 0;font-size:15px;font-weight:700;color:#1D2586;cursor:pointer';
    l.innerHTML = '<input type="checkbox" id="dkExam" style="width:20px;height:20px"> ⏱️ Modo examen: cronómetro por caso y tiempo total en el resultado'; sb.parentNode.insertBefore(l, sb); }
  function tick() { const g = document.getElementById('game'), end = document.getElementById('end'); const cb = document.getElementById('dkExam');
    if (!on && cb && cb.checked && g && !g.classList.contains('hidden')) { on = true; t0 = tc = Date.now(); lastIdx = curIdx(); pill = document.createElement('div'); pill.id = 'dkExamPill'; pill.style.cssText = 'position:fixed;top:10px;right:10px;z-index:7000;background:#1D2586;color:#fff;border-radius:999px;padding:7px 12px;font:800 ' + (innerWidth < 600 ? 13 : 15) + 'px system-ui,sans-serif;white-space:nowrap;box-shadow:0 4px 14px rgba(0,0,0,.3)'; document.body.appendChild(pill); }
    if (!on) return; const i = curIdx(); if (i !== lastIdx) { times[lastIdx] = (Date.now() - tc) / 1000; tc = Date.now(); lastIdx = i; }
    if (pill) pill.textContent = `⏱️ Caso ${i + 1}: ${fmt((Date.now() - tc) / 1000)} · Total ${fmt((Date.now() - t0) / 1000)}`;
    if (end && !end.classList.contains('hidden') && !shown) { shown = true; if (times[lastIdx] === undefined) times[lastIdx] = (Date.now() - tc) / 1000; if (pill) pill.remove();
      const T = times.filter(x => typeof x === 'number' && x > 0), tot = (Date.now() - t0) / 1000, avg = T.length ? T.reduce((a, b) => a + b, 0) / T.length : 0, slow = T.length ? times.indexOf(Math.max(...T)) : -1;
      const st = document.getElementById('estats'); if (st) st.insertAdjacentHTML('beforeend', `<div id="dkExamRes"><span>⏱️ Modo examen · tiempo total</span><b>${fmt(tot)}</b></div><div><span>Promedio por caso</span><b>${fmt(avg)}</b></div>${slow >= 0 ? `<div><span>Caso más lento</span><b>#${slow + 1} · ${fmt(T.length ? Math.max(...T) : 0)}</b></div>` : ''}`);
      window.DK_EXAM = { tot, avg, n: T.length }; } }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', inject); else inject();
  setInterval(tick, 500);
})();
