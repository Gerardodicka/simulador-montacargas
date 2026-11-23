// DICKA Play · Modo accesible: texto grande, alto contraste y subtítulos de todo lo que se narra en voz alta.
// La preferencia se guarda solo en este equipo (localStorage) y aplica a todos los simuladores.
// #100 Voz confiable en todos los simuladores: desbloquea el audio con el primer toque, espera las voces en español,
// evita el error de Chrome que calla la voz si se habla justo después de cancelar y divide textos largos para que no se corten.
(function () {
  const S = window.speechSynthesis; if (!S || S.__dkVoz) return; S.__dkVoz = true;
  const rawSpeak = S.speak.bind(S), rawCancel = S.cancel.bind(S), android = /Android/i.test(navigator.userAgent);
  let voices = [], lastCancel = 0, keep = null, unlocked = false, pend = null;
  const lv = () => { try { voices = S.getVoices() || []; } catch (e) { } if (voices.length && pend) { const p = pend; pend = null; p(); } };
  lv(); try { S.addEventListener ? S.addEventListener('voiceschanged', lv) : (S.onvoiceschanged = lv); } catch (e) { }
  const unlock = () => { if (unlocked) return; unlocked = true; try { if (S.paused) S.resume(); const u = new SpeechSynthesisUtterance(' '); u.volume = 0; rawSpeak(u); } catch (e) { } };
  ['pointerdown', 'touchend', 'keydown', 'click'].forEach(ev => window.addEventListener(ev, unlock, { capture: true, passive: true }));
  S.cancel = function () { lastCancel = Date.now(); clearInterval(keep); pend = null; return rawCancel(); };
  const chunks = t => { const out = []; String(t).split(/(?<=[.!?;:])\s+/).forEach(p => { while (p.length > 180) { let k = p.lastIndexOf(',', 180); if (k < 60) k = p.lastIndexOf(' ', 180); if (k < 60) k = 180; out.push(p.slice(0, k + 1)); p = p.slice(k + 1).trim(); } if (p) out.push(p); }); return out; };
  const pick = u => { if (u.voice) return; const es = voices.filter(v => /^es/i.test(v.lang)); const m = es.find(v => /es-MX/i.test(v.lang)) || es.find(v => /es-US|es-419/i.test(v.lang)) || es[0]; if (m) u.voice = m; };
  S.speak = function (u) {
    try {
      if (!u || !u.text || !String(u.text).trim()) return rawSpeak(u);
      window.DK_VOZ_N = (window.DK_VOZ_N || 0) + 1;
      const send = () => { pick(u); const parts = chunks(u.text); window.DK_VOZ_PARTS = parts.length;
        if (parts.length <= 1) rawSpeak(u);
        else parts.forEach((p, i) => { const x = new SpeechSynthesisUtterance(p); x.lang = u.lang || 'es-MX'; x.rate = u.rate; x.pitch = u.pitch; x.volume = u.volume; if (u.voice) x.voice = u.voice; const fwd = t => () => { try { u.dispatchEvent(new Event(t)); } catch (e) { } }; if (i === 0) x.onstart = fwd('start'); if (i === parts.length - 1) x.onend = fwd('end'); x.onerror = fwd('error'); rawSpeak(x); });
        /* sin pausa/reanuda: cada parte dura menos de 15 s y así speaking no se queda pegado */ };
      const go = () => { const w = Math.max(0, 140 - (Date.now() - lastCancel)); w ? setTimeout(send, w) : send(); };
      if (!voices.length) lv(); go();
    } catch (e) { try { rawSpeak(u); } catch (_) { } }
  };
  /* #101 Aviso si el equipo no tiene voz en español (una vez por sesión), para que la persona sepa por qué no oye al avatar */
  setTimeout(() => { try { lv(); if (!voices.length || voices.some(v => /^es/i.test(v.lang)) || sessionStorage.getItem('dk_voz_aviso')) return; sessionStorage.setItem('dk_voz_aviso', '1'); const d = document.createElement('div'); d.id = 'dkVozAviso'; d.setAttribute('role', 'status');
    d.style.cssText = 'position:fixed;left:50%;top:70px;transform:translateX(-50%);z-index:9999;max-width:min(92vw,520px);background:#1D2586;color:#fff;border-radius:12px;padding:10px 14px;font:600 15px/1.4 system-ui,sans-serif;box-shadow:0 6px 18px rgba(0,0,0,.35)';
    d.innerHTML = '🔇 Tu equipo no tiene voz en español, por eso el avatar no se oye. Actívala en Ajustes → Idioma → Texto a voz (o usa Chrome). Mientras tanto lee los globos de texto. <button type="button" style="margin-left:6px;border:0;border-radius:8px;padding:4px 10px;font-weight:800;cursor:pointer">Entendido</button>';
    d.querySelector('button').onclick = () => d.remove(); document.body.appendChild(d); setTimeout(() => d.remove(), 15000); } catch (e) { } }, 2500);
  window.dkVozInfo = () => ({ soporta: true, voces: voices.length, espanol: voices.filter(v => /^es/i.test(v.lang)).length });
})();
(function () {
  if (window.__dickaA11y) return; window.__dickaA11y = true;
  const KEY = 'dicka_a11y'; let P = { big: false, hc: false, subs: false };
  try { Object.assign(P, JSON.parse(localStorage.getItem(KEY) || '{}')); } catch (e) { }
  const css = document.createElement('style'); css.id = 'a11yCss';
  css.textContent = 'html.a11y-big body{zoom:1.18}html.a11y-hc{filter:contrast(1.35) saturate(1.1)}html.a11y-hc body{text-shadow:none}html.a11y-hc a{text-decoration:underline}'
    + '#a11yBtn{position:fixed;left:0;top:42%;z-index:2147483000;background:#1D2586;color:#fff;border:2px solid #fff;border-left:0;border-radius:0 10px 10px 0;padding:8px 7px;font:800 15px Arial;cursor:pointer;box-shadow:0 2px 10px rgba(0,0,0,.35)}'
    + '#a11yPanel{position:fixed;left:44px;top:calc(42% - 40px);z-index:2147483001;background:#fff;color:#1b2240;border-radius:12px;padding:12px 14px;box-shadow:0 8px 28px rgba(0,0,0,.35);font:600 15px Arial;display:none;min-width:220px}'
    + '#a11yPanel.open{display:block}#a11yPanel b{display:block;color:#1D2586;margin-bottom:6px}#a11yPanel label{display:flex;align-items:center;gap:8px;padding:6px 0;cursor:pointer}#a11yPanel input{width:20px;height:20px}'
    + '#a11ySubs{position:fixed;left:4vw;right:4vw;bottom:18px;margin:0 auto;z-index:2147482999;width:fit-content;max-width:min(92vw,820px);background:rgba(0,0,0,.86);color:#fff;font:600 20px/1.35 Arial;padding:10px 16px;border-radius:10px;text-align:center;display:none;pointer-events:none}';
  document.head.appendChild(css);
  function apply() { const h = document.documentElement; h.classList.toggle('a11y-big', !!P.big); h.classList.toggle('a11y-hc', !!P.hc); try { localStorage.setItem(KEY, JSON.stringify(P)); } catch (e) { }
    document.querySelectorAll('#a11yPanel input').forEach(i => i.checked = !!P[i.dataset.k]); if (!P.subs) hideSub(); }
  let subT = null; const sub = () => document.getElementById('a11ySubs');
  function showSub(t) { if (!P.subs || !sub()) return; const el = sub(); el.textContent = t; el.style.display = 'block'; clearTimeout(subT); subT = setTimeout(hideSub, Math.max(2500, t.length * 75)); }
  function hideSub() { const el = sub(); if (el) el.style.display = 'none'; }
  window.dickaSubtitle = showSub;
  if (window.speechSynthesis && !speechSynthesis.__a11y) { const orig = speechSynthesis.speak.bind(speechSynthesis); speechSynthesis.speak = function (u) { try { if (u && u.text) { showSub(u.text); const oe = u.onend; u.addEventListener && u.addEventListener('end', () => { clearTimeout(subT); subT = setTimeout(hideSub, 600); }); } } catch (e) { } return orig(u); }; speechSynthesis.__a11y = true; }
  function ui() { if (document.getElementById('a11yBtn')) return; const b = document.createElement('button'); b.id = 'a11yBtn'; b.type = 'button'; b.title = 'Accesibilidad'; b.setAttribute('aria-label', 'Opciones de accesibilidad'); b.textContent = 'Aa';
    const p = document.createElement('div'); p.id = 'a11yPanel'; p.setAttribute('role', 'dialog'); p.innerHTML = '<b>♿ Accesibilidad</b><label><input type="checkbox" data-k="big"> 🔠 Texto grande</label><label><input type="checkbox" data-k="hc"> 🌓 Alto contraste</label><label><input type="checkbox" data-k="subs"> 💬 Subtítulos de la voz</label>';
    const s = document.createElement('div'); s.id = 'a11ySubs'; s.setAttribute('aria-live', 'polite');
    b.onclick = e => { e.stopPropagation(); p.classList.toggle('open'); }; p.onclick = e => e.stopPropagation(); document.addEventListener('click', () => p.classList.remove('open'));
    p.querySelectorAll('input').forEach(i => i.onchange = () => { P[i.dataset.k] = i.checked; apply(); });
    document.body.append(b, p, s); apply(); }
  apply(); if (document.body) ui(); else document.addEventListener('DOMContentLoaded', ui);
})();
