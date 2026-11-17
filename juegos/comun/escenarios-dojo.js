// Dojo de Mando · Escenarios extra para variar las situaciones gerenciales:
// sala de juntas ejecutiva (x≈20, z≈-18), andén de embarque (x≈20, z≈4) y comedor del personal (x≈-18, z≈-2).
function buildEscenariosDojo(scene) {
  const G = new THREE.Group(); scene.add(G);
  const M = (c, o) => new THREE.MeshStandardMaterial(Object.assign({ color: c, roughness: .7 }, o || {}));
  const B = (w, h, d, m, x, y, z, ry) => { const b = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m); b.position.set(x, y, z); if (ry) b.rotation.y = ry; b.castShadow = b.receiveShadow = true; G.add(b); return b; };
  const C = (rt, rb, h, m, x, y, z) => { const c = new THREE.Mesh(new THREE.CylinderGeometry(rt, rb, h, 20), m); c.position.set(x, y, z); c.castShadow = true; G.add(c); return c; };
  const tex = (w, h, draw) => { const cv = document.createElement('canvas'); cv.width = w; cv.height = h; draw(cv.getContext('2d'), w, h); const t = new THREE.CanvasTexture(cv); t.encoding = THREE.sRGBEncoding; return t; };
  const panel = (w, h, t, x, y, z, ry) => { const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshStandardMaterial({ map: t, roughness: .5 })); m.position.set(x, y, z); m.rotation.y = ry || 0; G.add(m); return m; };
  const wall = M(0xe9e4dc), wood = M(0x6b4a2f, { roughness: .5 }), dark = M(0x2b2f3a, { roughness: .4 }), chairM = M(0x1f2533, { roughness: .6 }), metal = M(0x9aa3ad, { metalness: .5, roughness: .35 });

  /* ===== 1 · Sala de juntas ejecutiva ===== */
  { const cx = 20, cz = -18;
    B(10, .02, 9, M(0x3c4658, { roughness: .9 }), cx, .011, cz);                       // alfombra
    B(10, 3.4, .15, wall, cx, 1.7, cz - 4.5); B(.15, 3.4, 9, wall, cx - 5, 1.7, cz); B(.15, 3.4, 9, M(0xbfd6ea, { transparent: true, opacity: .35, roughness: .1 }), cx + 5, 1.7, cz);   // muros y ventanal
    B(5.2, .08, 1.7, wood, cx, .76, cz - 1.2); [[-2.3, -.6], [2.3, -.6], [-2.3, .6], [2.3, .6]].forEach(([dx, dz]) => B(.08, .72, .08, dark, cx + dx, .37, cz - 1.2 + dz));   // mesa larga
    for (let i = 0; i < 4; i++) [-1, 1].forEach(s => { const x = cx - 1.9 + i * 1.27, z = cz - 1.2 + s * 1.15; B(.5, .08, .5, chairM, x, .47, z); B(.5, .55, .07, chairM, x, .78, z + s * .24); C(.03, .03, .42, metal, x, .23, z); });
    const dash = tex(1024, 512, (g, w, h) => { g.fillStyle = '#0d1430'; g.fillRect(0, 0, w, h); g.fillStyle = '#f5b800'; g.font = 'bold 44px Arial'; g.fillText('TABLERO EJECUTIVO · CEDIS', 40, 70);
      [['OTIF', '91%', '#ff6b6b'], ['Costo/caja', '+8%', '#ff6b6b'], ['Rotación', '38%', '#ffb347'], ['Exactitud', '99.1%', '#4cd97b']].forEach(([k, v, c], i) => { const x = 40 + i * 245; g.fillStyle = '#18224a'; g.fillRect(x, 110, 225, 150); g.fillStyle = '#9fb0ff'; g.font = '28px Arial'; g.fillText(k, x + 16, 150); g.fillStyle = c; g.font = 'bold 60px Arial'; g.fillText(v, x + 16, 230); });
      g.strokeStyle = '#4f7bd8'; g.lineWidth = 6; g.beginPath(); [380, 360, 372, 330, 345, 310, 300, 320].forEach((y, i) => i ? g.lineTo(60 + i * 125, y + 90) : g.moveTo(60, y + 90)); g.stroke(); });
    B(3.2, 1.8, .06, dark, cx, 1.9, cz - 4.4); panel(3.05, 1.65, dash, cx, 1.9, cz - 4.36);
    C(.25, .2, .45, M(0x8a5a3a), cx - 4.4, .23, cz - 3.9); const pl = new THREE.Mesh(new THREE.SphereGeometry(.5, 14, 10), M(0x3f8f4a)); pl.position.set(cx - 4.4, .9, cz - 3.9); G.add(pl);
    const lamp = new THREE.PointLight(0xfff1dd, .5, 12); lamp.position.set(cx, 3, cz - 1); G.add(lamp); }

  /* ===== 2 · Andén de embarque ===== */
  { const cx = 20, cz = 4;
    B(14, 5, .3, M(0xb9bec6, { roughness: .8 }), cx, 2.5, cz + 6);                       // muro de andenes
    [-4.5, 0, 4.5].forEach((dx, i) => { const x = cx + dx; B(3, 3.2, .05, M(0xd8dde4, { roughness: .5 }), x, 1.9, cz + 5.82);
      for (let k = 0; k < 8; k++) B(3, .04, .06, M(0xaeb5bf), x, .45 + k * .4, cz + 5.79);
      B(3.3, .3, .2, M(0x2b2b2b), x, .15, cz + 5.7); B(.18, 3.4, .25, M(0xf2c200), x - 1.65, 1.7, cz + 5.7); B(.18, 3.4, .25, M(0xf2c200), x + 1.65, 1.7, cz + 5.7);
      const sign = tex(256, 128, (g, w, h) => { g.fillStyle = '#1D2586'; g.fillRect(0, 0, w, h); g.fillStyle = '#fff'; g.font = 'bold 70px Arial'; g.fillText('P' + (6 + i), 70, 95); }); panel(1, .5, sign, x, 3.8, cz + 5.82, Math.PI);
      const lt = new THREE.Mesh(new THREE.SphereGeometry(.1, 10, 8), new THREE.MeshBasicMaterial({ color: i === 1 ? 0xff3030 : 0x30d060 })); lt.position.set(x + 1.9, 2.8, cz + 5.75); G.add(lt); });
    paintLine(cx - 7, cz + 3.6, cx + 7, cz + 3.6, 0xf2c200, .15);
    const loadM = typeof unitLoadMat === 'function' ? unitLoadMat(1) : M(0xc9a36b);
    [[-5, 2.3], [-3.6, 2.3], [-5, 1], [3, 2.6], [4.4, 2.6], [5.8, 1.6]].forEach(([dx, dz]) => { if (typeof makePallet === 'function') { const p = makePallet(1, 1.2); p.position.set(cx + dx, 0, cz + dz); G.add(p); } B(.95, 1.1, 1.1, loadM, cx + dx, .7, cz + dz); });
    B(.6, 1.1, .4, M(0xc8102e), cx + 6.4, .55, cz - 1.5); const bd = tex(512, 320, (g, w, h) => { g.fillStyle = '#fff'; g.fillRect(0, 0, w, h); g.fillStyle = '#1D2586'; g.font = 'bold 40px Arial'; g.fillText('EMBARQUES HOY', 20, 50); g.font = '30px Arial'; ['P6  Ruta Norte  10:00  ✔', 'P7  Cliente A   11:00  ⚠ RETRASO', 'P8  Ruta Bajío  12:00  ⏳'].forEach((l, i) => { g.fillStyle = i === 1 ? '#c62828' : '#222'; g.fillText(l, 20, 120 + i * 60); }); });
    B(2.2, 1.4, .06, dark, cx - 6.4, 1.7, cz - .5, Math.PI / 2); panel(2.05, 1.28, bd, cx - 6.36, 1.7, cz - .5, Math.PI / 2); }

  /* ===== 3 · Comedor del personal ===== */
  { const cx = -18, cz = -2;
    B(10, .02, 9, M(0xd9d2c3, { roughness: .9 }), cx, .011, cz); B(10, 3.2, .15, M(0xf3efe6), cx, 1.6, cz - 4.5); B(.15, 3.2, 9, M(0xf3efe6), cx - 5, 1.6, cz);
    [[-2.2, -1.5], [1.6, -1.5], [-2.2, 1.6], [1.6, 1.6]].forEach(([dx, dz]) => { const x = cx + dx, z = cz + dz; B(1.8, .06, .9, M(0xeeeeee, { roughness: .3 }), x, .75, z); C(.05, .05, .72, metal, x, .37, z); [-1, 1].forEach(s => B(1.8, .05, .32, M(0x2e7dd1), x, .45, z + s * .65)); });
    B(.9, 1.9, .8, M(0xc8102e), cx - 4.4, .95, cz - 3.9); B(.7, .9, .05, M(0x222833), cx - 4.4, 1.3, cz - 3.49);   // máquina expendedora
    B(.9, 1.9, .8, M(0x2b5fb3), cx - 3.3, .95, cz - 3.9); B(2.6, .9, .6, M(0x8d8d8d), cx + 2.5, .45, cz - 4.1); B(.5, .3, .4, M(0x333333), cx + 2, 1.05, cz - 4.1); B(.5, .3, .4, M(0x333333), cx + 2.8, 1.05, cz - 4.1);   // barra con microondas
    const menu = tex(512, 320, (g, w, h) => { g.fillStyle = '#20402a'; g.fillRect(0, 0, w, h); g.fillStyle = '#fff'; g.font = 'bold 42px Arial'; g.fillText('MENÚ DEL DÍA', 120, 60); g.font = '30px Arial'; ['Sopa de fideo', 'Pollo en mole · arroz', 'Agua de jamaica'].forEach((l, i) => g.fillText('• ' + l, 40, 130 + i * 55)); g.fillStyle = '#f5b800'; g.font = 'bold 26px Arial'; g.fillText('¡Gracias por tu seguridad hoy!', 40, 300); });
    panel(2.2, 1.4, menu, cx, 2.1, cz - 4.42);
    const lamp = new THREE.PointLight(0xfff6e5, .45, 12); lamp.position.set(cx, 2.9, cz); G.add(lamp); }
  return G;
}
