/* DICKA · acceso único: los datos del empleado se capturan una vez y todos los juegos los toman.
   Se guardan solo en este dispositivo (localStorage 'dicka_perfil'); no se envían a ningún servidor. */
(function () {
  var KEY = 'dicka_perfil';
  function $(id) { return document.getElementById(id); }
  function first() { for (var i = 0; i < arguments.length; i++) { var e = $(arguments[i]); if (e) return e; } return null; }
  function campos() { return { nom: first('pnom', 'rNombre'), ape: first('pape', 'rApellido'), full: $('pname'), num: first('pnum', 'rNum'), puesto: first('ppuesto', 'rPuesto'), wh: first('pwh', 'rWh') }; }
  function leer() { try { return JSON.parse(localStorage.getItem(KEY) || 'null'); } catch (e) { return null; } }
  function guardar(p) { try { localStorage.setItem(KEY, JSON.stringify(p)); } catch (e) { } }
  function poner(el, v) {
    if (!el || v == null || v === '') return;
    if (el.tagName === 'SELECT') { var o = [].find.call(el.options, function (x) { return x.value === v || x.text === v; }); if (!o) { el.dataset.perfilIni = el.value; return; } el.value = o.value; }
    else el.value = v;
    el.dispatchEvent(new Event('input', { bubbles: true })); el.dispatchEvent(new Event('change', { bubbles: true }));
  }
  function capturar() {
    var c = campos(), nom = c.nom ? c.nom.value.trim() : '', ape = c.ape ? c.ape.value.trim() : '';
    if (!nom && c.full) { var f = c.full.value.trim().split(/\s+/); nom = f.shift() || ''; ape = f.join(' '); }
    if ((nom + ' ' + ape).trim().length < 3) return;
    var prev = leer() || {};
    var sel = function (e, k) { if (!e) return prev[k] || ''; if (e.dataset.perfilIni !== undefined && e.value === e.dataset.perfilIni && prev[k]) return prev[k]; return e.value; };
    guardar({ nombre: nom, apellidos: ape, num: c.num && c.num.value.trim() ? c.num.value.trim() : prev.num || '', puesto: sel(c.puesto, 'puesto'), wh: sel(c.wh, 'wh') });
  }
  function boton() { return $('startBtn') || $('goBtn') || document.querySelector('button[onclick^="doRegister"]') || document.querySelector('#intro button.btn'); }
  function init() {
    var c = campos(), b = boton(); if (!(c.full || c.nom) || !b) return;
    b.addEventListener('click', capturar, true);
    var p = leer(); if (!p || !p.nombre) return;
    poner(c.nom, p.nombre); poner(c.ape, p.apellidos); if (c.full && !c.nom) poner(c.full, (p.nombre + ' ' + (p.apellidos || '')).trim());
    poner(c.num, p.num); poner(c.puesto, p.puesto); poner(c.wh, p.wh);
    var ref = [c.num, c.nom, c.full].filter(Boolean).sort(function (a, b) { return a.compareDocumentPosition(b) & 4 ? -1 : 1; })[0];
    var lab = ref.previousElementSibling && ref.previousElementSibling.tagName === 'LABEL' ? ref.previousElementSibling : ref;
    for (var x = ref, k = 0; x.parentElement && k < 4; x = x.parentElement, k++) { var ds = getComputedStyle(x.parentElement).display; if (ds.indexOf('grid') >= 0 || (ds.indexOf('flex') >= 0 && getComputedStyle(x.parentElement).flexDirection === 'row')) { lab = x.parentElement; } }
    if (lab !== ref && lab.previousElementSibling && lab.previousElementSibling.tagName === 'LABEL' && lab.tagName !== 'LABEL' && lab.contains(ref) === false) lab = lab.previousElementSibling;
    var d = document.createElement('div'); d.id = 'dickaPerfil';
    d.style.cssText = 'background:#e8f5e9;border:2px solid #43a047;border-radius:12px;padding:10px 12px;margin:0 0 12px;font:14px system-ui,sans-serif;color:#1b3a1e';
    d.innerHTML = '<div style="margin-bottom:8px">👤 Entraste como <b></b></div><div style="display:flex;gap:8px;flex-wrap:wrap"><button type="button" id="perfilGo" style="flex:1;min-width:140px;padding:10px;border:0;border-radius:9px;background:#2e7d32;color:#fff;font-weight:800;cursor:pointer">Continuar con mis datos →</button><button type="button" id="perfilCambiar" style="padding:10px;border:2px solid #2e7d32;border-radius:9px;background:#fff;color:#2e7d32;font-weight:700;cursor:pointer">No soy yo</button></div>';
    d.querySelector('b').textContent = (p.nombre + ' ' + (p.apellidos || '')).trim() + (p.num ? ' · #' + p.num : '') + (p.puesto ? ' · ' + p.puesto : '');
    if (lab !== ref && lab.tagName === 'DIV' && parseFloat(getComputedStyle(lab).paddingLeft) > 8) lab.insertBefore(d, lab.firstChild); else lab.parentNode.insertBefore(d, lab);
    $('perfilGo').onclick = function () { b.click(); };
    $('perfilCambiar').onclick = function () { try { localStorage.removeItem(KEY); } catch (e) { } [c.nom, c.ape, c.full, c.num].forEach(function (e) { if (e) e.value = ''; }); d.remove(); (c.nom || c.full).focus(); };
  }
  window.dickaPerfil = { leer: leer, guardar: guardar };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', function () { setTimeout(init, 0); }); else setTimeout(init, 0);
})();
