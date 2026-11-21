/* DICKA · botón fijo para regresar al portal desde cualquier juego */
(function () {
  if (window.__dickaInicio) return; window.__dickaInicio = 1;
  function ir() {
    try { if (window.speechSynthesis) speechSynthesis.cancel(); } catch (e) { }
    try { if (parent !== window) { parent.postMessage({ type: 'dicka-close' }, '*'); return; } } catch (e) { }
    location.href = '../index.html';
  }
  function poner() {
    if (document.getElementById('dickaInicio')) return;
    var st = document.createElement('style'); st.textContent =
      '#dickaInicio{position:fixed;left:max(10px,env(safe-area-inset-left));top:max(10px,env(safe-area-inset-top));z-index:9999;display:inline-flex;align-items:center;gap:8px;min-height:44px;padding:5px 16px 5px 5px;border:0;border-radius:999px;background:linear-gradient(135deg,#2138D3,#1D2586);color:#fff;font:800 15px/1 system-ui,-apple-system,"Segoe UI",sans-serif;letter-spacing:.02em;cursor:pointer;box-shadow:0 4px 14px rgba(0,0,0,.35),inset 0 0 0 1.5px rgba(255,255,255,.35);transition:transform .15s,box-shadow .15s,filter .15s;-webkit-tap-highlight-color:transparent}' +
      '#dickaInicio .ic{width:34px;height:34px;border-radius:50%;background:#f5c400;color:#011131;display:inline-flex;align-items:center;justify-content:center;flex:none}' +
      '#dickaInicio .ic svg{width:19px;height:19px}' +
      '#dickaInicio:hover{transform:translateY(-1px);filter:brightness(1.08);box-shadow:0 6px 18px rgba(0,0,0,.4),inset 0 0 0 1.5px rgba(255,255,255,.5)}' +
      '#dickaInicio:active{transform:scale(.96)}#dickaInicio:focus-visible{outline:3px solid #f5c400;outline-offset:3px}' +
      '@media(max-width:640px){#dickaInicio{padding:5px;gap:0}#dickaInicio .tx{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0)}}';
    document.head.appendChild(st);
    var b = document.createElement('button'); b.id = 'dickaInicio'; b.type = 'button'; b.setAttribute('aria-label', 'Regresar al inicio'); b.title = 'Regresar al inicio';
    b.innerHTML = '<span class="ic" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><path d="M3 11.5 12 4l9 7.5"/><path d="M5.5 10v9.5h13V10"/><path d="M10 19.5v-5h4v5"/></svg></span><span class="tx">Inicio</span>'; b.onclick = ir;
    document.body.appendChild(b);
    /* si el botón tapa un título o texto del encabezado, lo baja lo justo (solo esa sección, una vez) */
    function despejar() { try { var R = b.getBoundingClientRect(), seen = [];
      document.querySelectorAll('h1,h2,small,img,p,.brand,header *').forEach(function (e) { if (b.contains(e) || e.closest('#dickaInicio')) return; var q = e.getBoundingClientRect(); if (!q.width || !q.height || q.top > R.bottom || q.bottom < R.top || q.left > R.right || q.right < R.left) return; var cs = getComputedStyle(e); if (cs.visibility === 'hidden' || cs.display === 'none' || cs.position === 'fixed' || cs.position === 'absolute') return;
        var a = e; while (a.parentElement && a.parentElement !== document.body && getComputedStyle(a.parentElement).position === 'static') a = a.parentElement; if (seen.indexOf(a) >= 0 || a.dataset.dkInicio) return; seen.push(a); a.dataset.dkInicio = 1; var need = Math.ceil(R.bottom + 6 - q.top); if (need > 0 && need < 80) a.style.marginTop = (parseFloat(getComputedStyle(a).marginTop) || 0) + need + 'px'; }); } catch (e) { } }
    setTimeout(despejar, 60); setTimeout(despejar, 800);
  }
  window.dickaInicio = ir;
  if (document.body) poner(); else document.addEventListener('DOMContentLoaded', poner);
})();
