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
    var b = document.createElement('button'); b.id = 'dickaInicio'; b.type = 'button'; b.setAttribute('aria-label', 'Regresar al inicio');
    b.textContent = '← Inicio'; b.onclick = ir;
    b.style.cssText = 'position:fixed;left:10px;top:10px;z-index:9999;background:#fff;color:#1a237e;border:2px solid #1a237e;border-radius:10px;padding:7px 12px;font:700 13px system-ui,sans-serif;cursor:pointer;box-shadow:0 2px 8px rgba(0,0,0,.25)';
    document.body.appendChild(b);
  }
  window.dickaInicio = ir;
  if (document.body) poner(); else document.addEventListener('DOMContentLoaded', poner);
})();
