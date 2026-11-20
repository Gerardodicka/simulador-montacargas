/* DICKA · Modo aprendiz (#50)
   La PRIMERA vez que alguien juega un simulador en este dispositivo, el primer caso muestra una pista
   («🎓 Modo aprendiz») antes de decidir, tomada de la explicación del propio caso. Después se juega normal. */
(function () {
  const GID = () => (typeof GAME_ID !== 'undefined' ? GAME_ID : location.pathname.split('/').pop().replace('.html', ''));
  const K = () => 'dicka_aprendiz_' + GID();
  const seen = () => { try { return !!localStorage.getItem(K()); } catch (e) { return true; } };
  const mark = () => { try { localStorage.setItem(K(), '1'); } catch (e) { } };
  const cur = () => { try { return (typeof L !== 'undefined' && Array.isArray(L) && typeof idx === 'number') ? { c: L[idx], i: idx } : null; } catch (e) { return null; } };
  const hintOf = c => { if (!c) return ''; const w = c.why || c.det || c.pista || ''; const t = typeof w === 'function' ? '' : String(w); return t.replace(/<[^>]+>/g, '').slice(0, 260); };
  let done = false;
  setInterval(() => { if (done || window.DK_DEMO) return; const st = document.getElementById('stage'), g = document.getElementById('game'); if (!st || !g || g.classList.contains('hidden')) return;
    const x = cur(); if (!x || x.i !== 0) return; if (seen()) { done = true; return; }
    let h = hintOf(x.c); if (!h) { const li = document.querySelector('.howbox li'); h = li ? 'repasa esta regla de la guía: ' + li.textContent.trim().slice(0, 220) : ''; } if (!h || document.getElementById('dkAprendiz') || document.querySelector('.why')) return;
    const b = document.createElement('div'); b.id = 'dkAprendiz'; b.style.cssText = 'background:#e8f5e9;border:2px solid #43a047;color:#1b5e20;border-radius:10px;padding:10px 12px;margin:.3rem 0;font-size:15.5px;line-height:1.5';
    b.innerHTML = '🎓 <b>Modo aprendiz</b> (solo tu primera vez en este simulador): <b>pista</b> para este primer caso — ' + h + '<br><small>Desde el siguiente caso decides tú solo.</small>'; st.prepend(b); mark(); done = true; }, 600);
  window.DKAprendiz = { reset: () => { try { localStorage.removeItem(K()); } catch (e) { } }, seen };
})();
