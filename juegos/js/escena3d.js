/* DICKA · escena 3D compartida para convertir juegos 2D.
   Escena3D.montar(contenedor, {onPick, escena}) -> {setTarima(opts), marcar(ok), ok}
   escena: 'anden' (recibo con tráiler) · 'camara' (cámara fría) · 'patio' · 'racks'
   Si el equipo no tiene WebGL devuelve {ok:false} y el juego sigue en 2D. */
(function () {
  function M(c, o) { return new THREE.MeshStandardMaterial(Object.assign({ color: c, roughness: .8 }, o || {})); }
  function bx(g, w, h, d, c, x, y, z, ry) { const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), typeof c === 'object' ? c : M(c)); m.position.set(x, y, z); if (ry) m.rotation.y = ry; m.castShadow = m.receiveShadow = true; g.add(m); return m; }
  function cy(g, r, h, c, x, y, z) { const m = new THREE.Mesh(new THREE.CylinderGeometry(r, r, h, 16), M(c)); m.position.set(x, y, z); m.castShadow = true; g.add(m); return m; }
  function rack(g, x, z) { const b = M('#2a4bd7', { metalness: .4 }), o = M('#e8730c'); [-1.3, 1.3].forEach(dx => { bx(g, .1, 4, .1, b, x + dx, 2, z - .5); bx(g, .1, 4, .1, b, x + dx, 2, z + .5); }); [1, 2.3, 3.6].forEach(y => { bx(g, 2.7, .1, 1.1, o, x, y, z); for (let i = 0; i < 3; i++) bx(g, .7, .7, .8, ['#c9a875', '#bfa070', '#d3b283'][i], x - .85 + i * .85, y + .4, z); }); }
  function persona(g, x, z, c) { cy(g, .22, 1, c || '#2238d3', x, 1, z); const h = new THREE.Mesh(new THREE.SphereGeometry(.19, 12, 10), M('#c68a5a')); h.position.set(x, 1.7, z); g.add(h); cy(g, .08, .9, '#1b2340', x - .1, .45, z); cy(g, .08, .9, '#1b2340', x + .1, .45, z); }
  function etiquetaTex(txt, col) { const c = document.createElement('canvas'); c.width = 256; c.height = 128; const x = c.getContext('2d'); x.fillStyle = col || '#fff'; x.fillRect(0, 0, 256, 128); x.fillStyle = '#111'; for (let i = 0; i < 40; i++) x.fillRect(12 + i * 5.8, 10, (i % 3) + 1, 60); x.font = 'bold 28px monospace'; x.textAlign = 'center'; x.fillText(String(txt || '').slice(0, 14), 128, 108); return new THREE.CanvasTexture(c); }
  function montar(el, opts) {
    opts = opts || {};
    try {
      const rn = new THREE.WebGLRenderer({ antialias: true }); rn.setPixelRatio(Math.min(2, devicePixelRatio)); rn.shadowMap.enabled = true; el.appendChild(rn.domElement);
      const fria = opts.escena === 'camara';
      const sc = new THREE.Scene(); sc.background = new THREE.Color(fria ? '#d6e6f2' : '#cfd6e4'); const cam = new THREE.PerspectiveCamera(50, 1, .1, 120);
      sc.add(new THREE.HemisphereLight('#fff', '#667', .8)); const dl = new THREE.DirectionalLight('#fff', .7); dl.position.set(6, 14, 8); dl.castShadow = true; dl.shadow.mapSize.set(1024, 1024); Object.assign(dl.shadow.camera, { left: -12, right: 12, top: 12, bottom: -12 }); sc.add(dl);
      const fl = new THREE.Mesh(new THREE.PlaneGeometry(30, 22), M(fria ? '#b8c7d3' : '#9a9a96')); fl.rotation.x = -Math.PI / 2; fl.receiveShadow = true; sc.add(fl);
      const W = new THREE.Group(); sc.add(W);
      bx(W, 30, 6, .3, fria ? '#eef5fb' : '#e6e8ee', 0, 3, -8);
      if (opts.escena === 'patio') { for (let i = -2; i <= 2; i++) { bx(W, 2.6, 2.8, 7, '#eceff1', i * 4, 2, -3.5); bx(W, 2.6, 2.4, 2, '#c62828', i * 4, 1.6, .6); } }
      else { bx(W, 4, 4, .2, '#8d98ad', 0, 2, -7.8); bx(W, 3, 2.8, 8, '#eceff1', 0, 2.2, -12.2); bx(W, 30, .03, .15, '#ffd400', 0, .02, 2.5); }
      if (fria) { bx(W, 2, .6, .6, '#cfd8dc', -6, 4.6, -7.6); bx(W, 2, .6, .6, '#cfd8dc', 6, 4.6, -7.6); }
      [-9, -5.5].forEach(x => rack(W, x, -4)); [5.5, 9].forEach(x => rack(W, x, -4));
      persona(W, 2.4, 1.2, '#f2b705');
      const T = new THREE.Group(); sc.add(T); let pick = [];
      let th = .35, ph = 1.1, rad = 6.5, drag = null, moved = 0;
      const upd = () => { ph = Math.max(.45, Math.min(1.35, ph)); rad = Math.max(3.5, Math.min(20, rad)); cam.position.set(rad * Math.sin(th) * Math.sin(ph), rad * Math.cos(ph) + 1, rad * Math.cos(th) * Math.sin(ph)); cam.lookAt(0, .8, 0); };
      const fit = () => { const w = el.clientWidth, h = el.clientHeight; rn.setSize(w, h, false); cam.aspect = w / h; cam.updateProjectionMatrix(); upd(); }; addEventListener('resize', fit); fit();
      const cv = rn.domElement;
      cv.addEventListener('pointerdown', e => { drag = { x: e.clientX, y: e.clientY }; moved = 0; cv.setPointerCapture(e.pointerId); });
      cv.addEventListener('pointermove', e => { if (!drag) return; const dx = e.clientX - drag.x, dy = e.clientY - drag.y; moved += Math.abs(dx) + Math.abs(dy); th -= dx * .007; ph -= dy * .005; drag = { x: e.clientX, y: e.clientY }; upd(); });
      cv.addEventListener('pointerup', e => { if (moved < 8 && opts.onPick) { const r = cv.getBoundingClientRect(), v = new THREE.Vector2((e.clientX - r.left) / r.width * 2 - 1, -(e.clientY - r.top) / r.height * 2 + 1), rc = new THREE.Raycaster(); rc.setFromCamera(v, cam); if (rc.intersectObjects(pick, true)[0]) opts.onPick(); } drag = null; });
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
        marcar(ok) { if (anillo) anillo.material.color.set(ok === false ? '#d11' : '#1f9d55'); },
        render() { rn.render(sc, cam); }
      };
      const loop = t => { if (anillo) anillo.scale.setScalar(1 + Math.sin(t / 250) * .04); rn.render(sc, cam); requestAnimationFrame(loop); }; requestAnimationFrame(loop);
      return api;
    } catch (e) { return { ok: false, setTarima() {}, marcar() {} }; }
  }
  window.Escena3D = { montar };
})();
