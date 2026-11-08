/* DICKA Play · Oficina de turno detallada para el Dojo de Mando (zona x -5..5, z -23..-15) */
function buildOficinaDojo(scene, opts) { opts = opts || {}; const G = new THREE.Group(); scene.add(G);
  const M = (c, o) => new THREE.MeshStandardMaterial(Object.assign({ color: c, roughness: .7 }, o || {}));
  const B = (w, h, d, m, x, y, z, ry) => { const b = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m); b.position.set(x, y, z); if (ry) b.rotation.y = ry; b.castShadow = b.receiveShadow = true; G.add(b); return b; };
  const C = (rt, rb, h, m, x, y, z, seg) => { const c = new THREE.Mesh(new THREE.CylinderGeometry(rt, rb, h, seg || 20), m); c.position.set(x, y, z); c.castShadow = true; G.add(c); return c; };
  const tex = (w, h, draw, rep) => { const cv = document.createElement('canvas'); cv.width = w; cv.height = h; draw(cv.getContext('2d'), w, h); const t = new THREE.CanvasTexture(cv); t.encoding = THREE.sRGBEncoding; if (rep) { t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(rep[0], rep[1]); } t.anisotropy = 4; return t; };
  // piso de duela (vinílico tipo madera)
  const wood = tex(512, 512, (g, w, h) => { for (let i = 0; i < 8; i++) { const y = i * 64, base = 120 + (i * 37) % 40; g.fillStyle = `rgb(${base + 60},${base + 25},${base - 20})`; g.fillRect(0, y, w, 64);
      for (let k = 0; k < 40; k++) { g.strokeStyle = `rgba(60,30,10,${.05 + Math.random() * .08})`; g.beginPath(); const yy = y + Math.random() * 64; g.moveTo(0, yy); g.bezierCurveTo(w * .3, yy + 4, w * .6, yy - 4, w, yy); g.stroke(); }
      g.fillStyle = 'rgba(40,20,5,.35)'; g.fillRect(0, y, w, 2); const off = (i * 173) % w; g.fillRect(off, y, 2, 64); } }, [3, 3]);
  const fl = new THREE.Mesh(new THREE.PlaneGeometry(9.8, 7.8), new THREE.MeshStandardMaterial({ map: wood, roughness: .45, metalness: .05 })); fl.rotation.x = -Math.PI / 2; fl.position.set(0, .016, -19); fl.receiveShadow = true; G.add(fl);
  // tapete de la sala de juntas
  const rug = new THREE.Mesh(new THREE.PlaneGeometry(2.6, 2), new THREE.MeshStandardMaterial({ map: tex(256, 256, (g) => { g.fillStyle = '#2b3a67'; g.fillRect(0, 0, 256, 256); g.strokeStyle = '#c9a227'; g.lineWidth = 6; g.strokeRect(12, 12, 232, 232); g.strokeStyle = '#4a5c94'; g.lineWidth = 2; g.strokeRect(26, 26, 204, 204); for (let i = 0; i < 2000; i++) { g.fillStyle = `rgba(255,255,255,${Math.random() * .05})`; g.fillRect(Math.random() * 256, Math.random() * 256, 1, 1); } }), roughness: .95 }));
  rug.rotation.x = -Math.PI / 2; rug.position.set(-3, .02, -17.6); G.add(rug);
  // muros: pintura con lambrín de madera
  const paint = M(0xeceef2, { roughness: .9 }), wains = M(0x8a5a35, { roughness: .6 }), trim = M(0xffffff, { roughness: .5 });
  B(10, 3.2, .2, paint, 0, 1.6, -23); B(10, .9, .04, wains, 0, .45, -22.88); B(10, .05, .06, trim, 0, .92, -22.86);
  B(.2, 3.2, 8, paint, 5, 1.6, -19); B(.04, .9, 7.8, wains, 4.88, .45, -19); B(.06, .05, 7.8, trim, 4.86, .92, -19);
  if (opts.front) { B(3.5, 3.2, .2, paint, -3.3, 1.6, -15); B(3.5, 3.2, .2, paint, 3.3, 1.6, -15); B(3.1, .6, .2, paint, 0, 2.9, -15); }   // el frente queda abierto para que la cámara vea toda la oficina
  // ventanal al almacén (muro izquierdo) con perfiles de aluminio y persianas
  const alu = M(0x9aa3ad, { metalness: .7, roughness: .35 }), glass = new THREE.MeshPhysicalMaterial ? new THREE.MeshPhysicalMaterial({ color: 0xcfe6f2, transparent: true, opacity: .18, roughness: .05, metalness: 0, transmission: .6 }) : M(0xcfe6f2, { transparent: true, opacity: .2 });
  B(.2, 1, 8, paint, -5, .5, -19); B(.2, .5, 8, paint, -5, 2.95, -19); const gl = new THREE.Mesh(new THREE.PlaneGeometry(7.8, 1.7), glass); gl.rotation.y = Math.PI / 2; gl.position.set(-4.92, 1.85, -19); G.add(gl);
  for (let z = -22.9; z <= -15.05; z += 1.3) B(.08, 1.75, .06, alu, -4.9, 1.85, z); B(.08, .06, 7.9, alu, -4.9, 1.0, -19); B(.08, .06, 7.9, alu, -4.9, 2.7, -19);
  const slat = M(0xf4f4f0, { roughness: .6 }); for (let y = 1.55; y < 2.68; y += .055) { const s = B(.012, .04, 7.7, slat, -4.82, y, -19); s.rotation.z = .5; s.castShadow = false; }
  // techo con lámparas LED
  const ceil = new THREE.Mesh(new THREE.PlaneGeometry(10, 8), M(0xf7f7f7, { roughness: 1 })); ceil.rotation.x = Math.PI / 2; ceil.position.set(0, 3.2, -19); G.add(ceil);
  const ledM = new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0xfff6e0, emissiveIntensity: 1.2 }); [[-2.5, -21], [2.5, -21], [-2.5, -17], [2.5, -17]].forEach(([x, z]) => B(1.2, .03, .6, ledM, x, 3.18, z));
  const pl = new THREE.PointLight(0xfff1dc, .55, 12, 2); pl.position.set(0, 2.9, -19.5); G.add(pl); const pl2 = new THREE.PointLight(0xffffff, .35, 9, 2); pl2.position.set(-3, 2.8, -17); G.add(pl2);
  // escritorio ejecutivo en L
  const top = M(0x5a3a22, { roughness: .35 }), metal = M(0x2b2e33, { metalness: .6, roughness: .4 });
  B(2.2, .05, .9, top, 1.9, .76, -22.0); B(.7, .05, 1.4, top, 3.35, .76, -21.25); B(2.2, .7, .04, M(0x4a2f1b), 1.9, .4, -22.43);
  [[0.85, -21.6], [2.95, -21.6], [3.65, -20.6]].forEach(([x, z]) => B(.05, .74, .05, metal, x, .37, z)); B(.45, .62, .6, M(0x3b2616), 3.35, .33, -21.0);   // cajonera
  // computadora (modelo 3D si existe; si no, monitor sencillo) + teclado, mouse, papeles, taza, teléfono
  const mon = new THREE.Group(); mon.position.set(1.9, .785, -22.2); G.add(mon);
  const fallback = () => { const sc = new THREE.Mesh(new THREE.BoxGeometry(.62, .38, .03), M(0x111111, { roughness: .3 })); sc.position.y = .36; mon.add(sc); const sm = new THREE.Mesh(new THREE.PlaneGeometry(.58, .33), new THREE.MeshBasicMaterial({ map: tex(512, 290, (g, w, h) => { g.fillStyle = '#0f2a5c'; g.fillRect(0, 0, w, h); g.fillStyle = '#fff'; g.font = 'bold 30px Arial'; g.fillText('DICKA · WMS', 20, 44); [[60, .9], [150, .7], [240, .55], [330, .8], [420, .65]].forEach(([x, k]) => { g.fillStyle = '#4fc3f7'; g.fillRect(x, h - 30 - k * 170, 50, k * 170); }); }) })); sm.position.set(0, .36, .016); mon.add(sm); const st = new THREE.Mesh(new THREE.BoxGeometry(.06, .2, .06), metal); st.position.y = .1; mon.add(st); const bs = new THREE.Mesh(new THREE.BoxGeometry(.22, .015, .16), metal); mon.add(bs); };
  if (THREE.GLTFLoader && !opts.noModels) new THREE.GLTFLoader().load('assets/models/computadora.glb', g => { const o = g.scene, bb = new THREE.Box3().setFromObject(o), sz = bb.getSize(new THREE.Vector3()), k = .7 / Math.max(sz.x, sz.z, .01); o.scale.setScalar(k); const b2 = new THREE.Box3().setFromObject(o); o.position.y -= b2.min.y; o.traverse(m => { if (m.isMesh) m.castShadow = true; }); mon.add(o); }, undefined, fallback); else fallback();
  B(.45, .02, .15, M(0x1d1d1f), 1.9, .795, -21.8); B(.07, .02, .1, M(0x1d1d1f), 2.25, .795, -21.8);
  const paper = M(0xffffff, { roughness: .9 }); [0, .02, .04].forEach((d, i) => { const p = B(.21, .004, .297, paper, 1.2 + d, .79 + i * .004, -21.85); p.rotation.y = .1 * i; });
  C(.04, .035, .1, M(0xffffff), 1.0, .84, -21.7); C(.03, .03, .005, M(0x3b1f0f), 1.0, .887, -21.7);   // taza de café
  B(.2, .05, .18, M(0x222222), 3.3, .81, -21.6);
  // silla ejecutiva
  const chair = new THREE.Group(); chair.position.set(1.9, 0, -22.75); G.add(chair); const blk = M(0x1a1a1a, { roughness: .5 });
  const add = (mesh, x, y, z) => { mesh.position.set(x, y, z); mesh.castShadow = true; chair.add(mesh); };
  add(new THREE.Mesh(new THREE.BoxGeometry(.52, .08, .5), blk), 0, .48, 0); add(new THREE.Mesh(new THREE.BoxGeometry(.5, .62, .07), blk), 0, .86, -.24); add(new THREE.Mesh(new THREE.CylinderGeometry(.03, .03, .4, 10), metal), 0, .26, 0);
  for (let i = 0; i < 5; i++) { const a = i * Math.PI * 2 / 5, leg = new THREE.Mesh(new THREE.BoxGeometry(.3, .03, .04), metal); leg.position.set(Math.cos(a) * .15, .06, Math.sin(a) * .15); leg.rotation.y = -a; chair.add(leg); }
  // sala de juntas: mesa redonda y 3 sillas
  C(.55, .55, .04, top, -3, .74, -17.6, 32); C(.05, .05, .72, metal, -3, .37, -17.6); C(.3, .3, .03, metal, -3, .015, -17.6);
  [[-3, -16.75, Math.PI], [-3.85, -17.9, Math.PI / 2 + .3], [-2.15, -17.9, -Math.PI / 2 - .3]].forEach(([x, z, r]) => { const s = new THREE.Group(); s.position.set(x, 0, z); s.rotation.y = r; G.add(s);
    const fab = M(0x34497a, { roughness: .9 }); [[.44, .06, .42, 0, .46, 0, fab], [.44, .42, .05, 0, .7, -.2, fab]].forEach(([w, h, d, px, py, pz, m]) => { const b = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m); b.position.set(px, py, pz); b.castShadow = true; s.add(b); });
    [[-.18, -.18], [.18, -.18], [-.18, .18], [.18, .18]].forEach(([px, pz]) => { const l = new THREE.Mesh(new THREE.CylinderGeometry(.015, .015, .44, 8), metal); l.position.set(px, .22, pz); s.add(l); }); });
  // librero con carpetas, cajas y trofeo
  B(.4, 2.1, 1.8, M(0x6b4527), 4.7, 1.05, -21.6); [.35, .85, 1.35, 1.85].forEach(y => B(.36, .03, 1.72, M(0x7a5232), 4.68, y, -21.6));
  const binderC = [0x1D2586, 0xc8102e, 0x2e9e5b, 0xf2c200, 0x444b5a, 0x1769aa]; [.4, .9, 1.4].forEach((y, r) => { for (let i = 0; i < 9; i++) if ((i + r) % 4 !== 3) B(.28, .32, .07, M(binderC[(i + r) % 6]), 4.65, y + .17, -22.35 + i * .17); });
  C(.05, .07, .25, M(0xd4af37, { metalness: .8, roughness: .25 }), 4.62, 2.0, -21.0);
  // archivero, dispensador de agua y planta
  B(.5, 1.0, .6, M(0x8d949e, { metalness: .4, roughness: .45 }), 4.65, .5, -18.6); [.25, .55, .85].forEach(y => B(.02, .03, .2, metal, 4.39, y, -18.6));
  B(.32, 1.0, .32, M(0xf2f2f2), 4.7, .5, -16.2); C(.13, .13, .38, new THREE.MeshStandardMaterial({ color: 0x8fd3ff, transparent: true, opacity: .55, roughness: .1 }), 4.7, 1.2, -16.2);
  const plant = (x, z, s) => { C(.16 * s, .12 * s, .34 * s, M(0x2f2f2f), x, .17 * s, z); const leaf = M(0x2f7d3a, { roughness: .8 }); for (let i = 0; i < 7; i++) { const sp = new THREE.Mesh(new THREE.SphereGeometry(.16 * s, 10, 8), leaf); sp.position.set(x + Math.cos(i) * .12 * s, (.5 + (i % 3) * .14) * s, z + Math.sin(i) * .12 * s); sp.scale.y = 1.3; sp.castShadow = true; G.add(sp); } };
  plant(-4.4, -22.4, 1.5); plant(4.3, -15.6, 1.2); plant(.7, -22.55, .7);
  // cuadros, certificado, reloj y letrero de valores
  const frame = (w, h, x, y, z, ry, draw) => { const f = B(w + .06, h + .06, .03, M(0x2b2b2b), x, y, z, ry); const p = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ map: tex(512, Math.round(512 * h / w), draw) })); p.position.copy(f.position); p.rotation.y = ry || 0; const n = new THREE.Vector3(0, 0, 1).applyAxisAngle(new THREE.Vector3(0, 1, 0), ry || 0); p.position.addScaledVector(n, .02); G.add(p); };
  frame(1.6, .5, 1.9, 2.25, -22.85, 0, (g, w, h) => { g.fillStyle = '#1D2586'; g.fillRect(0, 0, w, h); g.fillStyle = '#f5b800'; g.font = 'bold 54px Arial'; g.fillText('DICKA LOGISTICS', 30, 72); g.fillStyle = '#fff'; g.font = '28px Arial'; g.fillText('Seguridad · Servicio · Excelencia', 32, 125); });
  frame(.5, .38, 4.86, 1.75, -19.6, -Math.PI / 2, (g, w, h) => { g.fillStyle = '#fbf6e6'; g.fillRect(0, 0, w, h); g.strokeStyle = '#c9a227'; g.lineWidth = 12; g.strokeRect(16, 16, w - 32, h - 32); g.fillStyle = '#333'; g.font = 'bold 36px Georgia'; g.fillText('Certificado', 150, 140); g.font = '22px Georgia'; g.fillText('Sistema de gestión de calidad', 105, 200); g.fillText('ISO 9001', 200, 250); });
  frame(.6, .45, 4.86, 1.75, -17.4, -Math.PI / 2, (g, w, h) => { const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, '#9cc9f0'); gr.addColorStop(1, '#3d6e46'); g.fillStyle = gr; g.fillRect(0, 0, w, h); g.fillStyle = '#556b2f'; g.beginPath(); g.moveTo(0, h * .7); g.lineTo(w * .3, h * .45); g.lineTo(w * .6, h * .65); g.lineTo(w, h * .4); g.lineTo(w, h); g.lineTo(0, h); g.fill(); });
  const clock = new THREE.Mesh(new THREE.CircleGeometry(.18, 32), new THREE.MeshBasicMaterial({ map: tex(256, 256, (g) => { g.fillStyle = '#fff'; g.beginPath(); g.arc(128, 128, 124, 0, 7); g.fill(); g.strokeStyle = '#222'; g.lineWidth = 8; g.stroke(); g.fillStyle = '#222'; for (let i = 0; i < 12; i++) { const a = i * Math.PI / 6; g.fillRect(128 + Math.cos(a) * 100 - 3, 128 + Math.sin(a) * 100 - 3, 6, 6); } g.lineWidth = 7; g.beginPath(); g.moveTo(128, 128); g.lineTo(128, 60); g.moveTo(128, 128); g.lineTo(180, 140); g.stroke(); }) }));
  clock.position.set(-3.5, 2.55, -22.88); G.add(clock);
  // pizarrón de indicadores con marco y gráfica
  const kpi = opts.kpi || { t: 'TURNO NOCTURNO · KPI', l: 'Productividad 112%  ·  Incidentes 2' };
  frame(2.6, 1.3, -1.5, 1.65, -22.85, 0, (g, w, h) => { g.fillStyle = '#ffffff'; g.fillRect(0, 0, w, h); g.fillStyle = '#1D2586'; g.font = 'bold 34px Arial'; g.fillText(kpi.t, 24, 50); g.fillStyle = '#c62828'; g.font = 'bold 26px Arial'; g.fillText(kpi.l, 24, 92);
    const vals = [.72, .8, .86, .78, .95, 1.0, .9]; vals.forEach((v, i) => { g.fillStyle = i === 5 ? '#2e9e5b' : '#4f7bd8'; g.fillRect(40 + i * 62, h - 24 - v * 120, 40, v * 120); }); g.strokeStyle = '#c62828'; g.setLineDash([8, 6]); g.lineWidth = 3; g.beginPath(); g.moveTo(30, h - 24 - 100); g.lineTo(w - 30, h - 24 - 100); g.stroke(); });
  B(1.0, .04, .08, M(0x777777, { metalness: .5 }), -1.5, .96, -22.82);   // repisa de plumones
  return G; }
