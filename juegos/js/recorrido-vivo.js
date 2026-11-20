/* DICKA · Recorridos 3D "vivos" (como el Dojo): el trabajador del punto te habla, le respondes
   tocando una opción, hablando o escribiendo, y reacciona (se voltea, asiente o niega y te contesta).
   Se monta sobre openH/decide de los 15 recorridos sin cambiar la calificación. El audio del micrófono
   lo transcribe el navegador; no se guarda nada. */
(function () {
  const $ = id => document.getElementById(id);
  const g = n => { try { return eval(n); } catch (e) { return undefined; } };   // variables let/const del juego
  let VOZ = true; try { VOZ = localStorage.getItem('dicka_rv_voz') !== '0'; } catch (e) { }
  const NOMBRES = ['Juan', 'Pedro', 'Toño', 'Beto', 'Luis', 'Memo', 'Chuy', 'Raúl', 'Paco', 'Lalo'];
  const css = `#rvBub{position:relative;margin:0 0 .5rem;background:#fff;color:#1a1f36;border:2px solid #1D2586;border-radius:14px;padding:9px 12px;font:600 15.5px/1.45 system-ui,sans-serif;box-shadow:0 4px 12px rgba(0,0,0,.15);display:none}
#rvBub b{color:#1D2586}#rvBub .who{font-size:12.5px;font-weight:800;color:#c62828;letter-spacing:.04em;display:block}#rvVoz{border:0;border-radius:10px;padding:10px 12px;font:800 14px system-ui;background:#1D2586;color:#fff;cursor:pointer}
.rvTalk{background:#f4f6fb;border:2px solid #c5cae9;border-radius:12px;padding:8px 10px;margin:.4rem 0}.rvTalk .row{display:flex;gap:6px;flex-wrap:wrap}.rvTalk button{border:0;border-radius:10px;padding:10px 12px;font:800 14.5px system-ui;cursor:pointer}.rvTalk .mic{background:#c62828;color:#fff;flex:1 1 150px}.rvTalk .mic.on{box-shadow:0 0 0 6px rgba(198,40,40,.25)}.rvTalk .kb{background:#fff;color:#1D2586;border:2px solid #1D2586;flex:1 1 110px}.rvTalk input{flex:1 1 180px;min-height:44px;font-size:16px;border:2px solid #c5cae9;border-radius:10px;padding:6px 9px}.rvTalk .heard{font-size:14px;color:#333;margin-top:4px}`;
  let BUB = null; function ui() { const v = $('v3d'); if (!v || BUB) return; const st = document.createElement('style'); st.textContent = css; document.head.appendChild(st);
    const b = document.createElement('div'); b.id = 'rvBub'; BUB = b; b.style.display = 'none';
    const vz = document.createElement('button'); vz.id = 'rvVoz'; vz.type = 'button'; vz.textContent = VOZ ? '🔊 Voz' : '🔇 Sin voz'; vz.onclick = () => { VOZ = !VOZ; try { localStorage.setItem('dicka_rv_voz', VOZ ? '1' : '0'); } catch (e) { } vz.textContent = VOZ ? '🔊 Voz' : '🔇 Sin voz'; if (!VOZ) try { speechSynthesis.cancel(); } catch (e) { } }; window.RV_VOZBTN = vz; }
  function decir(quien, html, mujer) { const b = BUB; if (!b) return; const st = $('stage'); if (st && b.parentNode !== st) st.insertBefore(b, st.firstChild); else if (st && st.firstChild !== b) st.insertBefore(b, st.firstChild); b.innerHTML = `<span class="who">${quien}</span>${html}`; b.style.display = 'block'; window.RV_SAY = (window.RV_SAY || 0) + 1;
    try { if (VOZ && window.speechSynthesis && !window.DK_MUTE) { speechSynthesis.cancel(); const u = new SpeechSynthesisUtterance(html.replace(/<[^>]+>/g, '')); u.lang = 'es-MX'; const vs = speechSynthesis.getVoices().filter(v => /^es/i.test(v.lang)); const m = vs.find(v => (mujer ? /female|mujer|paulina|helena|sabina|monica/i : /male|hombre|jorge|raul|pablo|diego/i).test(v.name)) || vs[0]; if (m) u.voice = m; speechSynthesis.speak(u); } } catch (e) { } }
  // avatar(es) del punto: GLB clonados dentro del grupo del hallazgo
  function avDe(i) { const S = g('SPOTS'), A = window.AVQ || []; if (!S || !S[i]) return []; const [x, z] = S[i]; const out = [];
    A.forEach(q => { if (!q.g || Math.abs(q.g.position.x - x) > .01 || Math.abs(q.g.position.z - z) > .01) return; q.g.children.forEach(o => { let sk = false; o.traverse && o.traverse(m => { if (m.isSkinnedMesh) sk = true; }); if (sk && !out.includes(o)) out.push(o); }); }); return out; }
  let anim = null; function reaccion(i, tipo) { const av = avDe(i); if (!av.length) return; const t0 = performance.now(); const base = av.map(o => ({ o, ry: o.rotation.y, y: o.position.y, s: o.scale.y }));
    anim = { tipo, t0, base }; window.RV_REACT = tipo; }
  function loop(t) { if (anim) { const k = (t - anim.t0) / 1000; anim.base.forEach(({ o, ry, y }) => {
      if (anim.tipo === 'habla') o.rotation.y = ry + Math.sin(k * 3) * .12;
      else if (anim.tipo === 'bien') { o.position.y = y + Math.max(0, Math.sin(k * 9)) * .12 * Math.max(0, 1 - k / 1.6); o.rotation.y = ry; }
      else if (anim.tipo === 'mal') o.rotation.y = ry + Math.sin(k * 14) * .25 * Math.max(0, 1 - k / 1.4); });
      if (anim.tipo !== 'habla' && (t - anim.t0) > 1700) { anim.base.forEach(({ o, ry, y }) => { o.rotation.y = ry; o.position.y = y; }); anim = null; } }
    requestAnimationFrame(loop); }
  // respuesta libre → opción D por palabras clave (etiqueta + pista de cuándo aplica)
  const STOP = new Set('para como pero porque cuando donde desde entre sobre hacia hasta todos todas este esta estos estas aqui ahora luego mismo cada otra otro mucho poco solo tambien hacer haria esta bien'.split(' '));
  const raiz = w => w.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-zñ]/g, '').slice(0, 5);
  const toks = t => String(t).split(/\s+/).map(raiz).filter(w => w.length >= 4 && !STOP.has(w));
  function mejor(txt) { const D = g('D') || {}, H = g('HINT') || {}, T = new Set(toks(txt)); if (/(esta bien|no requiere|todo bien|nada que corregir|correcto)/i.test(txt.normalize('NFD').replace(/[̀-ͯ]/g, ''))) { const k = Object.keys(D).find(k => /no requiere|correcto|bien/i.test(D[k])); if (k) return k; }
    let best = null, bs = 0; Object.keys(D).forEach(k => { const lab = toks(D[k].replace(/^\d · /, '')), hin = toks(H[k] || ''); const sc = lab.filter(w => T.has(w)).length * 1.5 + hin.filter(w => T.has(w)).length; if (sc > bs) { bs = sc; best = k; } }); return bs >= 1.5 ? best : null; }
  let REC = null;
  function responder(txt) { txt = String(txt || '').trim(); if (!txt || document.querySelector('.acts button:disabled')) return; const h = $('rvHeard'); if (h) h.textContent = '🗣️ Dijiste: «' + txt + '»'; const k = mejor(txt);
    if (!k) { const n = cur(); decir(n.nom, 'No te entendí. ¿Me lo dices con otras palabras? O toca una de las opciones.', n.mujer); return; } window.RV_LIBRE = (window.RV_LIBRE || 0) + 1; window.decide(k); }
  function hablar() { const SR = window.SpeechRecognition || window.webkitSpeechRecognition, kb = $('rvKb'); if (!SR) { if (kb) { kb.style.display = 'flex'; $('rvTxt').focus(); } return; }
    try { if (REC) REC.abort(); REC = new SR(); REC.lang = 'es-MX'; REC.interimResults = true; const b = $('rvMic'); b.classList.add('on'); b.textContent = '🎙️ Te escucho…'; let fin = '';
      REC.onresult = e => { let t = ''; for (const r of e.results) t += r[0].transcript; $('rvHeard').textContent = '🗣️ ' + t; if (e.results[e.results.length - 1].isFinal) fin = t; };
      REC.onerror = () => { if (kb) kb.style.display = 'flex'; }; REC.onend = () => { b.classList.remove('on'); b.textContent = '🎙️ Dile qué hacer'; REC = null; if (fin) responder(fin); }; REC.start(); } catch (e) { if (kb) kb.style.display = 'flex'; } }
  window.RV = { responder, hablar, mejor };
  function cur() { const i = g('idx') || 0; return { i, nom: '👷 ' + NOMBRES[i % NOMBRES.length], mujer: i % 2 === 1 }; }
  function frase(c) { const t = String(c.txt || '').replace(/\.$/, ''); const ok = /no requiere|correcto|bien/i.test(((g('D') || {})[c.ok]) || ''); return `Oye, ¿me echas la mano? Aquí en <b>${String(c.zona || 'mi área').toLowerCase()}</b>: ${t.charAt(0).toLowerCase() + t.slice(1)}. ${ok ? '¿Así está bien o le cambio algo?' : '¿Qué debo hacer?'}`; }
  function montar() { if (typeof window.openH !== 'function' || typeof window.decide !== 'function' || window.openH.__rv) return; ui();
    const oO = window.openH, oD = window.decide;
    window.openH = function (i) { const r = oO.apply(this, arguments); try { const L = g('L'); const done = g('done'); if (!L || (done && done.has(i))) return r; const n = cur(); decir(n.nom, frase(L[n.i]), n.mujer); reaccion(n.i, 'habla');
        const st = $('stage'), acts = st && st.querySelector('.acts'); if (acts && !$('rvTalk')) { const d = document.createElement('div'); d.className = 'rvTalk'; d.id = 'rvTalk'; d.innerHTML = `<div class="row"><button class="mic" id="rvMic" type="button" onclick="RV.hablar()">🎙️ Dile qué hacer</button><button class="kb" type="button" onclick="var k=document.getElementById('rvKb');k.style.display='flex';document.getElementById('rvTxt').focus()">⌨️ Escribir</button><span id="rvVozSlot"></span></div><div class="row" id="rvKb" style="display:none;margin-top:6px"><input id="rvTxt" enterkeyhint="send" placeholder="Ej. que use el diablito" onkeydown="if(event.key==='Enter')RV.responder(this.value)"><button class="kb" type="button" onclick="RV.responder(document.getElementById('rvTxt').value)">Responder</button></div><div class="heard" id="rvHeard"></div>`; acts.parentNode.insertBefore(d, acts.previousElementSibling || acts); const sl = $('rvVozSlot'); if (sl && window.RV_VOZBTN) sl.appendChild(window.RV_VOZBTN); } const st2 = $('stage'), bb = BUB; if (st2 && bb) st2.insertBefore(bb, st2.firstChild); } catch (e) { } return r; };
    window.openH.__rv = true;
    window.decide = function (k) { const L = g('L'), i = g('idx'), c = L && L[i]; const r = oD.apply(this, arguments); try { if (!c) return r; const n = cur(), D = g('D') || {}, lab = (D[c.ok] || '').replace(/^\d · /, '').replace(/^✅ /, ''); const t = $('rvTalk'); if (t) t.remove();
        if (k === c.ok) { reaccion(i, 'bien'); decir(n.nom, /no requiere|correcto|bien/i.test(D[c.ok] || '') ? '¡Qué bueno! Entonces sigo así. Gracias por revisar.' : `¡Gracias! Ahora mismo lo corrijo: <b>${lab.toLowerCase()}</b>. 👍`, n.mujer); }
        else { reaccion(i, 'mal'); decir(n.nom, `Mmm… no creo que eso me resuelva. Lo que necesito es: <b>${lab.toLowerCase()}</b>. Lee abajo por qué.`, n.mujer); } } catch (e) { } return r; };
    requestAnimationFrame(loop); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', montar); else montar();
})();
