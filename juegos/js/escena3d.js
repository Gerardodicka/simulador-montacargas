/* DICKA · escena 3D compartida para convertir juegos 2D.
   Escena3D.montar(contenedor, {onPick, escena}) -> {setTarima(opts), marcar(ok), ok}
   escena: 'anden' (recibo con tráiler) · 'camara' (cámara fría) · 'patio' · 'racks'
   Si el equipo no tiene WebGL devuelve {ok:false} y el juego sigue en 2D. */
(function () {
  function M(c, o) { return new THREE.MeshStandardMaterial(Object.assign({ color: c, roughness: .8 }, o || {})); }
  function bx(g, w, h, d, c, x, y, z, ry) { const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), typeof c === 'object' ? c : M(c)); m.position.set(x, y, z); if (ry) m.rotation.y = ry; m.castShadow = m.receiveShadow = true; g.add(m); return m; }
  function cy(g, r, h, c, x, y, z) { const m = new THREE.Mesh(new THREE.CylinderGeometry(r, r, h, 16), M(c)); m.position.set(x, y, z); m.castShadow = true; g.add(m); return m; }
  function rack(g, x, z) { const b = M('#2a4bd7', { metalness: .4 }), o = M('#e8730c'); [-1.3, 1.3].forEach(dx => { bx(g, .1, 4, .1, b, x + dx, 2, z - .5); bx(g, .1, 4, .1, b, x + dx, 2, z + .5); }); [1, 2.3, 3.6].forEach(y => { bx(g, 2.7, .1, 1.1, o, x, y, z); for (let i = 0; i < 3; i++) bx(g, .7, .7, .8, ['#c9a875', '#bfa070', '#d3b283'][i], x - .85 + i * .85, y + .4, z); }); }
  function persona(g, x, z, c) { const P = new THREE.Group(); P.position.set(x, 0, z); g.add(P); cy(P, .22, 1, c || '#2238d3', 0, 1, 0); const h = new THREE.Mesh(new THREE.SphereGeometry(.19, 12, 10), M('#c68a5a')); h.position.set(0, 1.7, 0); P.add(h); cy(P, .08, .9, '#1b2340', -.1, .45, 0); cy(P, .08, .9, '#1b2340', .1, .45, 0); avatarReal(P); return P; }
  // Cambia el muñeco básico por el operario 3D DICKA (casco, chaleco y guantes); si no carga, se queda el básico
  const SCR = (src) => new Promise((ok, ko) => { if ([...document.scripts].some(s => s.src.endsWith(src))) { const s = [...document.scripts].find(s => s.src.endsWith(src)); if (s.dataset.ok || (src === 'GLTFLoader.js' && THREE.GLTFLoader) || (src === 'SkeletonUtils.js' && THREE.SkeletonUtils) || (src === 'dicka-avatar.js' && window.gltfPrepareBones)) return ok(); s.addEventListener('load', ok); s.addEventListener('error', ko); return; } const s = document.createElement('script'); s.src = 'js/' + src; s.onload = () => { s.dataset.ok = 1; ok(); }; s.onerror = ko; document.head.appendChild(s); });
  function avatarReal(P) { (THREE.GLTFLoader ? Promise.resolve() : SCR('GLTFLoader.js')).then(() => THREE.SkeletonUtils ? 0 : SCR('SkeletonUtils.js')).then(() => window.gltfPrepareBones ? 0 : SCR('dicka-avatar.js')).then(() => {
    new THREE.GLTFLoader().load('assets/models/operario_lod.glb', gl => { try { const sc = gl.scene; try { hardHat(sc); workGloves(sc); } catch (e) { } Promise.resolve(typeof dickaVest === 'function' ? dickaVest(sc) : 0).catch(() => 0).then(() => { sc.updateMatrixWorld(true); let hb = null, fb = null; sc.traverse(o => { if (o.isBone) { if (/Head$/.test(o.name)) hb = o; if (/LeftFoot$/.test(o.name)) fb = o; } }); let hgt = 1.8; if (hb && fb) { const a = new THREE.Vector3(), b = new THREE.Vector3(); hb.getWorldPosition(a); fb.getWorldPosition(b); hgt = a.y - Math.min(b.y, 0) + .13; }
      const obj = THREE.SkeletonUtils.clone(sc); obj.scale.setScalar(1.74 / hgt); obj.rotation.y = -.5; obj.traverse(o => { if (o.isMesh) { o.frustumCulled = false; o.castShadow = true; } }); const av = { obj, procedural: true }; try { gltfPrepareBones(av); gltfWalkPose(av, false, 0, performance.now(), false, 0); } catch (e) { }
      [...P.children].forEach(c => c.visible = false); P.add(obj); P.userData.real = true; }); } catch (e) { } }, undefined, () => { }); }).catch(() => { }); }
  function etiquetaTex(txt, col) { const c = document.createElement('canvas'); c.width = 256; c.height = 128; const x = c.getContext('2d'); x.fillStyle = col || '#fff'; x.fillRect(0, 0, 256, 128); x.fillStyle = '#111'; for (let i = 0; i < 40; i++) x.fillRect(12 + i * 5.8, 10, (i % 3) + 1, 60); x.font = 'bold 28px monospace'; x.textAlign = 'center'; x.fillText(String(txt || '').slice(0, 14), 128, 108); return new THREE.CanvasTexture(c); }
  function montar(el, opts) {
    opts = opts || {};
    try {
      const rn = new THREE.WebGLRenderer({ antialias: true }); rn.setPixelRatio(Math.min(2, devicePixelRatio)); rn.shadowMap.enabled = true; el.appendChild(rn.domElement);
      const fria = opts.escena === 'camara';
      const sc = new THREE.Scene(); sc.background = new THREE.Color(fria ? '#d6e6f2' : '#cfd6e4'); const cam = new THREE.PerspectiveCamera(50, 1, .1, 120);
      sc.add(new THREE.HemisphereLight('#fff', '#667', .8)); const dl = new THREE.DirectionalLight('#fff', .7); dl.position.set(6, 14, 8); dl.castShadow = true; dl.shadow.mapSize.set(1024, 1024); Object.assign(dl.shadow.camera, { left: -12, right: 12, top: 12, bottom: -12 }); sc.add(dl);
      const fl = new THREE.Mesh(new THREE.PlaneGeometry(30, 34), M(fria ? '#b8c7d3' : '#9a9a96')); fl.rotation.x = -Math.PI / 2; fl.receiveShadow = true; sc.add(fl);
      const W = new THREE.Group(); sc.add(W);
      bx(W, 30, 6, .3, fria ? '#eef5fb' : '#e6e8ee', 0, 3, -8);
      if (opts.escena !== 'patio') { bx(W, 4, 4, .2, '#8d98ad', 0, 2, -7.8); bx(W, 3, 2.8, 8, '#eceff1', 0, 2.2, -12.2); bx(W, 30, .03, .15, '#ffd400', 0, .02, 2.5); }
      if (fria) { bx(W, 2, .6, .6, '#cfd8dc', -6, 4.6, -7.6); bx(W, 2, .6, .6, '#cfd8dc', 6, 4.6, -7.6); }
      if (opts.escena !== 'patio') { [-9, -5.5].forEach(x => rack(W, x, -4)); [5.5, 9].forEach(x => rack(W, x, -4)); }
      if (opts.escena !== 'patio') persona(W, 2.4, 1.2, '#f2b705');
      const T = new THREE.Group(); sc.add(T); let pick = [];
      let th = opts.escena === 'patio' ? 0 : .35, ph = opts.escena === 'patio' ? .75 : 1.1, rad = opts.escena === 'patio' ? 24 : 6.5, drag = null, moved = 0;
      const upd = () => { ph = Math.max(.45, Math.min(1.35, ph)); rad = Math.max(3.5, Math.min(34, rad)); cam.position.set(rad * Math.sin(th) * Math.sin(ph), rad * Math.cos(ph) + 1, rad * Math.cos(th) * Math.sin(ph)); cam.lookAt(0, .8, opts.escena === 'patio' ? 1 : 0); };
      const fit = () => { const w = el.clientWidth, h = el.clientHeight; rn.setSize(w, h, false); cam.aspect = w / h; cam.updateProjectionMatrix(); if (opts.escena === 'patio' && !fit.done) { rad = w / h < 1 ? 46 : 26; fit.done = 1; } upd(); }; addEventListener('resize', fit); fit();
      const cv = rn.domElement;
      cv.addEventListener('pointerdown', e => { drag = { x: e.clientX, y: e.clientY }; moved = 0; cv.setPointerCapture(e.pointerId); });
      cv.addEventListener('pointermove', e => { if (!drag) return; const dx = e.clientX - drag.x, dy = e.clientY - drag.y; moved += Math.abs(dx) + Math.abs(dy); th -= dx * .007; ph -= dy * .005; drag = { x: e.clientX, y: e.clientY }; upd(); });
      cv.addEventListener('pointerup', e => { if (moved < 8 && opts.onPick) { const r = cv.getBoundingClientRect(), v = new THREE.Vector2((e.clientX - r.left) / r.width * 2 - 1, -(e.clientY - r.top) / r.height * 2 + 1), rc = new THREE.Raycaster(); rc.setFromCamera(v, cam); const h = rc.intersectObjects(pick, true)[0]; if (h) { let o = h.object; while (o && !o.userData.pick && o.parent) o = o.parent; opts.onPick(o && o.userData.pick); } } drag = null; });
      cv.addEventListener('wheel', e => { e.preventDefault(); rad *= e.deltaY > 0 ? 1.1 : .9; upd(); }, { passive: false });
      let anillo = null;
      const api = {
        ok: true,
        setTarima(o) {
          o = o || {}; while (T.children.length) T.remove(T.children[0]);
          const wood = M('#8b5a2b'); for (let i = 0; i < 3; i++) bx(T, 1.2, .12, .2, wood, 0, .06, -.4 + i * .4); bx(T, 1.2, .05, 1.2, '#a0703c', 0, .2, 0);
          const n = o.cajas || 6, base = o.frio ? '#b3d4ec' : '#c9a875';
          for (let i = 0; i < n; i++) { const r = Math.floor(i / 3), cI = i % 3; const b = bx(T, .38, .36, 1.1, base, -.4 + cI * .4, .42 + r * .38, 0); if (o.dano && r === Math.floor((n - 1) / 3) && cI < 2) { b.scale.y = .65; b.rotation.z = .2 * (cI ? 1 : -1); } }
          if (!o.dano) { const p = new THREE.Mesh(new THREE.BoxGeometry(1.26, .4 * Math.ceil(n / 3) + .1, 1.16), M('#e0f7fa', { transparent: true, opacity: .25 })); p.position.y = .25 + (.4 * Math.ceil(n / 3)) / 2; T.add(p); }
          else { const r = new THREE.Mesh(new THREE.PlaneGeometry(.5, .4), M('#e0f7fa', { transparent: true, opacity: .6, side: THREE.DoubleSide })); r.position.set(.7, .5, .3); r.rotation.y = .9; T.add(r); }
          const lab = new THREE.Mesh(new THREE.PlaneGeometry(.55, .28), new THREE.MeshBasicMaterial({ map: etiquetaTex(o.etiqueta, o.etiquetaColor) })); lab.position.set(0, .55, .561); T.add(lab);
          if (o.frio) { const n2 = new THREE.Mesh(new THREE.SphereGeometry(.9, 10, 8), M('#e3f2fd', { transparent: true, opacity: .25 })); n2.position.y = 1.2; T.add(n2); }
          anillo = new THREE.Mesh(new THREE.RingGeometry(.95, 1.1, 40), new THREE.MeshBasicMaterial({ color: o.anillo || '#2238d3', side: THREE.DoubleSide })); anillo.rotation.x = -Math.PI / 2; anillo.position.y = .02; T.add(anillo);
          pick = [T];
        },
        setKit(o) {
          o = o || {}; while (T.children.length) T.remove(T.children[0]); if (!api.kitCam) { api.kitCam = 1; th = .12; ph = .82; rad = el.clientWidth / el.clientHeight < 1 ? 4.6 : 3.6; upd(); }
          const txt = (t, bg, fg, w, h) => { const c = document.createElement('canvas'); c.width = 256; c.height = 96; const x = c.getContext('2d'); x.fillStyle = bg; x.fillRect(0, 0, 256, 96); x.fillStyle = fg || '#111'; x.font = 'bold 40px sans-serif'; x.textAlign = 'center'; x.fillText(String(t).slice(0, 12), 128, 62); return new THREE.Mesh(new THREE.PlaneGeometry(w || .34, h || .13), new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(c) })); };
          bx(T, 2.4, .08, 1.2, '#9e9e9e', 0, .9, 0); [[-1.1, -.5], [1.1, -.5], [-1.1, .5], [1.1, .5]].forEach(([x, z]) => bx(T, .07, .9, .07, '#616161', x, .45, z));
          const emp = o.empaque || 'caja', cajaC = emp === 'bolsa' ? '#cfd8dc' : '#c9a875';
          if (emp === 'bolsa') { const b = new THREE.Mesh(new THREE.BoxGeometry(1.1, .5, .7), M('#e3f2fd', { transparent: true, opacity: .55 })); b.position.set(-.4, 1.19, 0); T.add(b); }
          else { bx(T, 1.1, .04, .7, cajaC, -.4, .96, 0); bx(T, 1.1, .45, .04, cajaC, -.4, 1.17, -.35); bx(T, 1.1, .45, .04, cajaC, -.4, 1.17, .35); bx(T, .04, .45, .7, cajaC, -.95, 1.17, 0); bx(T, .04, .45, .7, cajaC, .15, 1.17, 0); const tapa = bx(T, 1.1, .03, .7, cajaC, -.4, 1.55, -.55); tapa.rotation.x = -1.1;
            if (emp === 'burbuja') { const w = new THREE.Mesh(new THREE.BoxGeometry(1.0, .3, .6), M('#e1f5fe', { transparent: true, opacity: .5 })); w.position.set(-.4, 1.12, 0); T.add(w); } }
          (o.items || []).forEach((it, i) => { const col = i % 4, row = Math.floor(i / 4), x = -.8 + col * .27, z = -.17 + row * .3; const h = .14 + (it.h || .1); const m = bx(T, .22, h, .22, it.c || '#1e88e5', x, .98 + h / 2, z); const l = txt(it.n, '#ffffff', '#1a1f36', .22, .085); l.position.set(x, .98 + h + .002, z); l.rotation.x = -Math.PI / 2; T.add(l); });
          (o.sobra || []).forEach((it, i) => { const h = .14 + (it.h || .1); bx(T, .22, h, .22, it.c || '#8e24aa', .55 + i * .28, .94 + h / 2, .3); const l = txt(it.n, '#ffffff', '#1a1f36', .22, .085); l.position.set(.55 + i * .28, .94 + h + .002, .3); l.rotation.x = -Math.PI / 2; T.add(l); });
          const lab = new THREE.Mesh(new THREE.PlaneGeometry(.5, .25), new THREE.MeshBasicMaterial({ map: etiquetaTex(o.etiqueta, o.etiquetaColor) })); lab.position.set(-.4, 1.17, .375); T.add(lab);
          anillo = new THREE.Mesh(new THREE.RingGeometry(1.45, 1.6, 48), new THREE.MeshBasicMaterial({ color: '#2238d3', side: THREE.DoubleSide })); anillo.rotation.x = -Math.PI / 2; anillo.position.y = .02; T.add(anillo); pick = [T];
        },
        setPTL(o) {
          o = o || {}; while (T.children.length) T.remove(T.children[0]); pick = []; if (!api.ptlCam) { api.ptlCam = 1; th = 0; ph = 1.32; rad = el.clientWidth / el.clientHeight < 1 ? 7.2 : 4.4; upd(); }
          const CX = c => (c - 3.5) * .95, LY = l => .1 + (l - 1) * 1.0, Z = -.6, blue = M('#2a4bd7', { metalness: .4 }), org = M('#e8730c');
          for (let c = 0; c <= 6; c++) { bx(T, .08, 3.2, .08, blue, CX(c + .5) - .95, 1.6, Z - .4); bx(T, .08, 3.2, .08, blue, CX(c + .5) - .95, 1.6, Z + .4); }
          for (let l = 1; l <= 3; l++) bx(T, 6 * .95 + .1, .06, .9, org, 0, LY(l), Z);
          const txt = (t, bg, fg, w, h, fs) => { const c = document.createElement('canvas'); c.width = 256; c.height = 128; const x = c.getContext('2d'); x.fillStyle = bg; x.fillRect(0, 0, 256, 128); x.fillStyle = fg; x.font = 'bold ' + (fs || 64) + 'px sans-serif'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText(t, 128, 68); return new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(c) })); };
          (o.slots || []).forEach(sl => { const x = CX(sl.col), y = LY(sl.lvl);
            const n = Math.min(4, sl.stock); for (let i = 0; i < n; i++) bx(T, .34, .3, .55, '#c9a875', x - .2 + (i % 2) * .4, y + .18 + Math.floor(i / 2) * .32, Z);
            const tag = txt(sl.code, '#ffffff', '#1D2586', .62, .16, 46); tag.position.set(x, y - .04, Z + .46); T.add(tag);
            const mod = bx(T, .5, .2, .06, sl.lit ? M('#00e676', { emissive: '#00c853', emissiveIntensity: .9 }) : M('#37474f'), x, y + .9, Z + .46);
            if (sl.lit) { const d = txt(String(sl.qty), '#00c853', '#ffffff', .44, .17, 90); d.position.set(x, y + .9, Z + .495); T.add(d); }
            const hit = bx(T, .9, .95, .9, new THREE.MeshBasicMaterial({ visible: false }), x, y + .48, Z); hit.userData.pick = { tipo: 'slot', k: sl.code }; pick.push(hit); });
        },
        screenSlot(col, lvl) { const v = new THREE.Vector3((col - 3.5) * .95, .1 + (lvl - 1) + .48, -.6 + .46).project(cam), r = rn.domElement.getBoundingClientRect(); return { x: r.left + (v.x + 1) / 2 * r.width, y: r.top + (1 - v.y) / 2 * r.height }; },
        setSorter(o) {
          o = o || {}; while (T.children.length) T.remove(T.children[0]); pick = []; if (!api.sorCam) { api.sorCam = 1; th = -.18; ph = 1.05; rad = el.clientWidth / el.clientHeight < 1 ? 10 : 6.6; upd(); }
          const txt = (t, bg, fg, w, h, fs) => { const c = document.createElement('canvas'); c.width = 320; c.height = 128; const x = c.getContext('2d'); x.fillStyle = bg; x.fillRect(0, 0, 320, 128); x.fillStyle = fg; x.font = 'bold ' + (fs || 52) + 'px sans-serif'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText(t, 160, 68); return new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(c) })); };
          bx(T, 7, .12, 1, '#37474f', 0, .85, -1.2); for (let i = 0; i < 14; i++) { const r = new THREE.Mesh(new THREE.CylinderGeometry(.05, .05, 1, 10), M('#b0bec5')); r.rotation.x = Math.PI / 2; r.position.set(-3.25 + i * .5, .93, -1.2); T.add(r); }
          [[-3.3, -1.6], [3.3, -1.6], [-3.3, -.8], [3.3, -.8]].forEach(([x, z]) => bx(T, .08, .85, .08, '#455a64', x, .42, z));
          (o.lanes || []).forEach((ln, i) => { const x = (i - 1.5) * 1.7 - 1.0; const ch = bx(T, 1.5, .08, 1.6, ln.c, x, .55, .4); ch.rotation.x = -.35; bx(T, 1.6, .5, .08, ln.c, x, .3, 1.25); const t = txt(ln.n, ln.c, '#ffffff', 1.5, .5, 46); t.position.set(x, 1.15, 1.3); T.add(t); const hit = bx(T, 1.6, 1.2, 1.8, new THREE.MeshBasicMaterial({ visible: false }), x, .6, .5); hit.userData.pick = { tipo: 'lane', i }; pick.push(hit); });
          if (o.caja) { const c = o.caja, b = bx(T, .7, .5, .6, c.dano ? '#a1887f' : '#c9a875', 0, 1.2, -1.2); if (c.dano) { b.rotation.z = .12; b.scale.y = .8; }
            const lab = txt(c.etiqueta || '', c.ilegible ? '#e0e0e0' : '#ffffff', c.ilegible ? '#9e9e9e' : '#111', .6, .24, 40); lab.position.set(0, 1.25, -.895); T.add(lab); const top = txt(c.etiqueta || '', c.ilegible ? '#e0e0e0' : '#ffffff', c.ilegible ? '#9e9e9e' : '#111', .6, .24, 40); top.rotation.x = -Math.PI / 2; top.position.set(0, 1.452, -1.2); T.add(top); }
          anillo = new THREE.Mesh(new THREE.RingGeometry(.5, .6, 40), new THREE.MeshBasicMaterial({ color: '#2238d3', side: THREE.DoubleSide })); anillo.rotation.x = -Math.PI / 2; anillo.position.set(0, .93, -1.2); T.add(anillo);
        },
        screenLane(i) { const v = new THREE.Vector3((i - 1.5) * 1.7 - 1.0, .6, .5).project(cam), r = rn.domElement.getBoundingClientRect(); return { x: r.left + (v.x + 1) / 2 * r.width, y: r.top + (1 - v.y) / 2 * r.height }; },
        setPatio(st) {
          while (T.children.length) T.remove(T.children[0]); pick = [];
          const lbl = (t, c) => { const cv = document.createElement('canvas'); cv.width = 256; cv.height = 96; const x = cv.getContext('2d'); x.fillStyle = c; x.fillRect(0, 0, 256, 96); x.fillStyle = '#fff'; x.font = 'bold 54px sans-serif'; x.textAlign = 'center'; x.fillText(t, 128, 66); const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: new THREE.CanvasTexture(cv), depthTest: false })); sp.scale.set(1.8, .68, 1); return sp; };
          const trailer = (g, cold, color) => { bx(g, 2.4, 2.6, 6, cold ? '#e3f2fd' : '#eceff1', 0, 2.1, 0); if (cold) bx(g, 1.6, .9, .5, '#90a4ae', 0, 2.6, -3.2); bx(g, 2.4, 2.4, 2, color || '#c62828', 0, 1.6, -4.1); [-.9, .9].forEach(x => [1.8, 2.6, -3.8].forEach(z => { const w = cy(g, .45, .35, '#111', x, .45, z); w.rotation.z = Math.PI / 2; })); };
          st.docks.forEach((d, i) => { const x = (i - (st.docks.length - 1) / 2) * 4, g = new THREE.Group(); g.position.set(x, 0, -7.6); T.add(g);
            bx(g, 3, 3.2, .3, d.cold ? '#64b5f6' : '#90a4ae', 0, 1.6, 0); bx(g, 3.2, .3, .6, '#ffd600', 0, 3.3, .2); const l = lbl(d.n, d.cold ? '#1565c0' : '#37474f'); l.position.set(0, 4, .3); g.add(l);
            const hit = bx(g, 3.4, 3.6, 1.2, new THREE.MeshBasicMaterial({ visible: false }), 0, 1.8, .5); hit.userData.pick = { tipo: 'dock', n: d.n }; pick.push(hit);
            if (d.eco) { const tg = new THREE.Group(); tg.position.set(0, 0, 3.3); g.add(tg); trailer(tg, d.cold, '#455a64'); const e = lbl(d.eco, '#455a64'); e.position.set(0, 4, 3.3); e.scale.set(1.5, .56, 1); g.add(e); } });
          const nW = st.waiting.length, cols = Math.min(nW, 7), px = i => (i % 7 - (cols - 1) / 2) * 3.4, pz = i => 6 + Math.floor(i / 7) * 6.5;
          st.waiting.forEach((t, i) => { const g = new THREE.Group(); g.position.set(px(i), 0, pz(i)); g.scale.set(1, 1, .75); T.add(g); trailer(g, t.cold, t.cita ? '#2e7d32' : '#c62828');
            const e = lbl(t.eco, t.sel ? '#ff6d00' : (t.cita ? '#2e7d32' : '#c62828')); e.position.set(px(i), 4.2, pz(i) - 1); T.add(e);
            const hit = bx(g, 3, 3.4, 8, new THREE.MeshBasicMaterial({ visible: false }), 0, 1.7, 0); hit.userData.pick = { tipo: 'truck', id: t.id }; pick.push(hit);
            if (t.sel) { const r = new THREE.Mesh(new THREE.RingGeometry(3.3, 3.6, 40), new THREE.MeshBasicMaterial({ color: '#ff6d00', side: THREE.DoubleSide })); r.rotation.x = -Math.PI / 2; r.position.set(px(i), .03, pz(i)); T.add(r); } });
        },
        setPantalla(canvas, titulo) {
          if (!api._pant) { const g = new THREE.Group(); g.position.set(1.7, 0, .2); g.rotation.y = -.5; T.parent.add(g);
            bx(g, .08, 1.5, .08, '#607d8b', 0, .75, 0); bx(g, 2.1, 1.05, .08, '#263238', 0, 1.95, 0);
            const tex = new THREE.CanvasTexture(canvas); const scr = new THREE.Mesh(new THREE.PlaneGeometry(1.95, .9), new THREE.MeshBasicMaterial({ map: tex })); scr.position.set(0, 1.95, .045); g.add(scr);
            const lc = document.createElement('canvas'); lc.width = 512; lc.height = 64; const lg = lc.getContext('2d'); lg.fillStyle = '#1D2586'; lg.fillRect(0, 0, 512, 64); lg.fillStyle = '#fff'; lg.font = 'bold 25px sans-serif'; lg.textAlign = 'center'; lg.fillText(titulo || 'REGISTRADOR DE TEMPERATURA', 256, 41);
            const lb = new THREE.Mesh(new THREE.PlaneGeometry(2.1, .26), new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(lc) })); lb.position.set(0, 2.62, .045); g.add(lb); api._pant = { tex, scr }; }
          api._pant.tex.image = canvas; api._pant.tex.needsUpdate = true;
        },
        marcar(ok) { if (anillo) anillo.material.color.set(ok === false ? '#d11' : '#1f9d55'); },
        render() { rn.render(sc, cam); }
      };
      const loop = t => { if (anillo) anillo.scale.setScalar(1 + Math.sin(t / 250) * .04); rn.render(sc, cam); requestAnimationFrame(loop); }; requestAnimationFrame(loop);
      return api;
    } catch (e) { return { ok: false, setTarima() {}, setKit() {}, setPTL() {}, setSorter() {}, marcar() {} }; }
  }
  window.Escena3D = { montar };
})();
