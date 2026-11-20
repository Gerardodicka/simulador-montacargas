/* DICKA · Dificultad adaptativa (#48)
   Recuerda en ESTE dispositivo los casos que la persona falló en cada simulador y, al volver a jugar,
   los pone primero con un aviso «🔁 Repaso» hasta que los resuelve bien. No envía nada a ningún servidor. */
(function () {
  const GID = () => (typeof GAME_ID !== 'undefined' ? GAME_ID : location.pathname.split('/').pop().replace('.html', ''));
  const KEY = () => 'dicka_adapt_' + GID();
  const keyOf = c => { if (!c || typeof c !== 'object') return null; const v = [c.prod, c.kit, c.sku, c.desc, c.pista, c.mot, c.q, c.texto, c.t2, c.name].find(x => typeof x === 'string' && x.length > 2); return v ? v.slice(0, 80) : null; };
  const load = () => { try { return JSON.parse(localStorage.getItem(KEY()) || '[]'); } catch (e) { return []; } };
  const save = l => { try { localStorage.setItem(KEY(), JSON.stringify(l.slice(-12))); } catch (e) { } };
  const cur = () => { try { return (typeof L !== 'undefined' && Array.isArray(L) && typeof idx === 'number') ? L[idx] : null; } catch (e) { return null; } };
  // 1) al armar la ronda, los casos fallados antes van primero
  function wrap() { if (typeof window.build !== 'function' || window.build.__adapt) return; const orig = window.build;
    const w = function () { const arr = orig.apply(this, arguments); try { const F = load(); if (Array.isArray(arr) && F.length) { const fail = arr.filter(c => F.includes(keyOf(c))), rest = arr.filter(c => !F.includes(keyOf(c))); window.DK_REPASO = fail.length; return fail.concat(rest); } } catch (e) { } return arr; };
    w.__adapt = true; window.build = w; }
  // 2) registra fallos y aciertos mirando la explicación que muestra el juego
  let lastKey = null;
  function watch() { const obs = new MutationObserver(() => { const fb = document.querySelector('.why'); const c = cur(); const k = keyOf(c); if (!fb || !k) return; const sig = k + '|' + fb.textContent.slice(0, 40); if (sig === lastKey) return; lastKey = sig;
      if (window.DK_DEMO) return; const bad = /❌|Lo correcto|Iba a/.test(fb.textContent); let F = load(); if (bad) { if (!F.includes(k)) F.push(k); } else F = F.filter(x => x !== k); save(F); });
    obs.observe(document.body, { childList: true, subtree: true });
    // 3) aviso visible cuando el caso actual es un repaso
    setInterval(() => { const c = cur(), k = keyOf(c), st = document.getElementById('stage'); if (!st || !k) return; const isR = load().includes(k) && !document.querySelector('.why'); let b = document.getElementById('dkRepaso');
      if (isR && !b) { b = document.createElement('div'); b.id = 'dkRepaso'; b.style.cssText = 'background:#fff3e0;border:2px solid #fb8c00;color:#6d3b00;border-radius:10px;padding:8px 12px;margin:.3rem 0;font-size:15px;font-weight:600'; b.innerHTML = '🔁 <b>Repaso:</b> este caso lo fallaste la vez pasada. Revisa con calma los datos antes de decidir.'; st.prepend(b); }
      else if (!isR && b) b.remove(); }, 700); }
  window.DKAdapt = { load, keyOf, reset: () => save([]) };
  wrap(); if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => { wrap(); watch(); }); else watch();
})();
