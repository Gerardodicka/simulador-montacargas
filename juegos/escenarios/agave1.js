/* ===================================================================================================
   Escenario «AGAVE 1 · Proyecto NAOS» — construido a partir del layout oficial (AGAVE_1_LAYOUT.pdf)
   Escala: la cota de 35.43 m del plano mide 115 px → 0.308 m por px. Origen X en el andén P6 (sur),
   el muro sur-poniente queda en Z = 45 para reutilizar la caja de tráiler, el cruce peatonal y el andén de prácticas.
   Puertas de andén: P1–P19 al sur y P20–P41 al norte. Racks: 13 filas dobles (espalda con espalda) en la zona
   oriente con 2 pasillos transversales, y 3 filas en la zona poniente. Simbología de seguridad e higiene según el plano.
   =================================================================================================== */
const AGV = (() => { const s = 0.308, X = px => (px - 413.75) * s, Z = py => (py - 610) * s + 45;
  const colX = Array.from({ length: 13 }, (_, k) => 17.9 + 7.9 * k);   // ejes de las 13 filas dobles (oriente)
  return { s, X, Z, colX,
    west: X(265), east: X(830), north: Z(245), southL: 45, southR: Z(697), offX0: X(500), offX1: X(640), offZ0: 42, offZ1: Z(700),
    cuts: [Z(370), Z(478)], cutW: 3.6, rackH: 6,
    docksN: [...Array.from({ length: 12 }, (_, k) => ({ id: 'P' + (20 + k), x: -13.1 + 3.85 * k })), ...Array.from({ length: 10 }, (_, k) => ({ id: 'P' + (32 + k), x: 77.7 + 3.85 * k }))],
    docksS: [...Array.from({ length: 12 }, (_, k) => ({ id: 'P' + (1 + k), x: -19.25 + 3.85 * k })), ...Array.from({ length: 7 }, (_, k) => ({ id: 'P' + (13 + k), x: 96.5 + 3.3 * k }))] }; })();

function agvSegments(z0, z1) { const [c1, c2] = AGV.cuts, h = AGV.cutW / 2; return [[z0, c1 - h], [c1 + h, c2 - h], [c2 + h, z1]].filter(([a, b]) => b - a > 2.8); }

const AGV_YEL = { mat: new THREE.MeshStandardMaterial({ color: 0xf2c200, roughness: .6 }), post: new THREE.BoxGeometry(0.22, 0.6, 0.2), foot: new THREE.BoxGeometry(0.3, 0.12, 0.45) };
// Rack ligero (estructura fusionada + tarimas instanciadas): mismo comportamiento que buildRack, sin las franjas de texto por nivel
function agvRack(x, zStart, bays, levels, facing, letter, sign) { const bayW = 2.8, depth = 2.4, levelH = 1.8, totalH = levelH * levels + 0.5, RM = rackMats(), g = new THREE.Group();
  const add = (geo, mat, px, py, pz) => { const m = new THREE.Mesh(geo, mat); m.position.set(px, py, pz); g.add(m); return m; };
  const post = new THREE.BoxGeometry(0.1, totalH, 0.11), beamG = new THREE.BoxGeometry(0.1, 0.14, bays * bayW), tie = new THREE.BoxGeometry(depth, 0.05, 0.05);
  for (let b = 0; b <= bays; b++) { const z = zStart + b * bayW; [-depth / 2, depth / 2].forEach(dx => add(post, RM.up, x + dx, totalH / 2, z)); for (let l = 0; l <= levels; l += 2) add(tie, RM.brace, x, 0.5 + l * levelH + .9, z);
    if (b === 0 || b === bays) { const e = b === 0 ? -1 : 1; add(new THREE.BoxGeometry(depth + 0.3, 0.16, 0.12), RM.guard, x, 0.4, z + e * 0.35); [-depth / 2, depth / 2].forEach(dx => { add(AGV_YEL.post, AGV_YEL.mat, x + dx, 0.3, z + e * 0.08); add(AGV_YEL.foot, AGV_YEL.mat, x + dx, 0.06, z + e * 0.2); }); } }   // protector amarillo de pata en cabecera (como en nave real)
  for (let l = 0; l <= levels; l++) { const y = 0.5 + l * levelH; [-depth / 2, depth / 2].forEach(dx => add(beamG, RM.beam, x + dx, y, zStart + bays * bayW / 2));
    if (l < levels) { const dk = add(new THREE.PlaneGeometry(depth + 0.1, bays * bayW), RM.wire, x, y + 0.075, zStart + bays * bayW / 2); dk.rotation.x = -Math.PI / 2;
      for (let b = 0; b < bays; b++) { const zc = zStart + b * bayW + bayW / 2; for (const pos of ['A', 'B']) { if (Math.random() < 0.3) continue; RACK_INST.push({ x: x + (pos === 'A' ? 0.6 : -0.6) * facing, y, z: zc, bh: 0.6 + Math.random() * 0.8, v: b % 3, facing, pos }); } } } }
  mergeStaticMeshes(g); g.traverse(o => { if (o.isMesh) { o.castShadow = false; o.receiveShadow = true; } }); scene.add(g);
  if (sign) { const sm = new THREE.Mesh(new THREE.PlaneGeometry(2.4, 0.9), new THREE.MeshBasicMaterial({ map: makeTextTexture([{ text: `RACK ${letter}`, size: 120 }], { w: 512, h: 200, bg: '#011131' }) })); sm.position.set(x, totalH + 0.6, zStart + bays * bayW / 2); sm.rotation.y = facing > 0 ? Math.PI / 2 : -Math.PI / 2; scene.add(sm); }
  obstacles.push({ minX: x - depth / 2 - 0.05, maxX: x + depth / 2 + 0.05, minZ: zStart - 0.2, maxZ: zStart + bays * bayW + 0.2 }); }   // margen lateral 5 cm: pasillo útil igual al del almacén genérico (3.0 m)

// Computadora de escritorio (modelo 3D proporcionado: monitor con pantalla DICKA WMS, gabinete, teclado y mouse). Origen = centro del teclado sobre la cubierta; el frente mira a +X en el archivo
const AGV_PC = { gltf: null, wait: [], tried: false };
function agvComputer(x, y, z) { const place = src => { const m = src.clone(true); m.position.set(x, y, z); m.rotation.y = -Math.PI / 2; m.traverse(o => { if (o.isMesh) { o.castShadow = false; o.receiveShadow = true; } }); scene.add(m); };   // frente hacia +Z (hacia el operador)
  if (AGV_PC.gltf) return place(AGV_PC.gltf); AGV_PC.wait.push(place); if (AGV_PC.tried || !THREE.GLTFLoader) return; AGV_PC.tried = true;
  new THREE.GLTFLoader().load('assets/models/computadora.glb', g => { AGV_PC.gltf = g.scene; AGV_PC.wait.splice(0).forEach(f => f(g.scene)); }, undefined, () => { AGV_PC.wait.splice(0).forEach(() => {}); }); }
// Etiquetadora automática de tarimas: bastidor, banda de rodillos, cabezal aplicador con rollo de etiquetas, pantalla de control, torreta y guarda
function agvLabeler(x, z) { const g = new THREE.Group(), M = (c, o) => new THREE.MeshStandardMaterial(Object.assign({ color: c, roughness: .5, metalness: .3 }, o || {})), B = (w, h, d, m, px, py, pz) => { const b = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m); b.position.set(px, py, pz); g.add(b); return b; };
  const steel = M(0xb8bec6, { metalness: .7, roughness: .3 }), blue = M(0x1D2586), dark = M(0x23262c), yel = M(0xf2c200);
  [[-1, -1], [-1, 1], [1, -1], [1, 1]].forEach(([sx, sz]) => B(.08, .55, .08, steel, sx * 1.05, .275, sz * .6));   // patas
  B(2.3, .1, 1.35, steel, 0, .58, 0);   // bastidor
  for (let i = 0; i < 14; i++) { const r = new THREE.Mesh(new THREE.CylinderGeometry(.04, .04, 1.25, 10), M(0x9aa0a8, { metalness: .8, roughness: .25 })); r.rotation.x = Math.PI / 2; r.position.set(-1.05 + i * .162, .66, 0); g.add(r); }   // rodillos
  B(.12, 2.1, .12, blue, -.3, 1.05 + .6, -.75); B(.12, 2.1, .12, blue, .3, 1.05 + .6, -.75); B(.75, .14, .14, blue, 0, 2.7, -.75);   // pórtico
  B(.5, .45, .5, blue, 0, 2.35, -.45);   // cabezal aplicador
  const roll = new THREE.Mesh(new THREE.CylinderGeometry(.2, .2, .12, 24), M(0xf4f4f0, { metalness: 0, roughness: .7 })); roll.rotation.x = Math.PI / 2; roll.position.set(0, 2.45, -.12); g.add(roll);   // rollo de etiquetas
  const core = new THREE.Mesh(new THREE.CylinderGeometry(.06, .06, .14, 12), dark); core.rotation.x = Math.PI / 2; core.position.copy(roll.position); g.add(core);
  B(.32, .03, .02, M(0xffffff, { metalness: 0 }), 0, 2.08, -.19);   // etiqueta saliendo
  B(.05, .5, .05, steel, 0, 1.88, -.3);   // pistón del aplicador
  const scr = B(.42, .3, .05, dark, .95, 1.35, -.75); const sc = new THREE.Mesh(new THREE.PlaneGeometry(.36, .24), new THREE.MeshBasicMaterial({ map: makeTextTexture([{ text: 'ETIQUETAR', size: 60, color: '#7dffb0' }], { w: 256, h: 170, bg: '#0b1a3f' }) })); sc.position.set(.95, 1.35, -.72); g.add(sc); B(.06, .75, .06, steel, .95, .95, -.75);   // pantalla HMI
  [[0xe53935, 3.05], [0xf2c200, 2.95], [0x2e9e5b, 2.85]].forEach(([c, y], i) => { const l = new THREE.Mesh(new THREE.CylinderGeometry(.05, .05, .1, 12), new THREE.MeshStandardMaterial({ color: c, emissive: i === 2 ? c : 0x000000, emissiveIntensity: .8 })); l.position.set(.3, y, -.75); g.add(l); });   // torreta: verde = operando
  B(2.3, .9, .02, M(0xf2c200, { transparent: true, opacity: .35 }), 0, 1.1, .7);   // guarda frontal
  B(.3, .3, .01, yel, -.8, 1.2, .72);
  g.position.set(x, 0, z); g.rotation.y = Math.PI / 2; scene.add(g); obstacles.push({ minX: x - .8, maxX: x + .9, minZ: z - 1.25, maxZ: z + 1.25 }); }
// ---------- Fachada corporativa de oficinas: muro cortina con interior iluminado, franja de ventanas, losa azul, cornisa con letrero, acceso con marquesina, barandal peatonal y escalera ----------
const AGV_OFF = {};
function agvOfficeInteriorTex() { if (AGV_OFF.tex) return AGV_OFF.tex; const c = document.createElement('canvas'); c.width = 512; c.height = 256; const g = c.getContext('2d');
  const gr = g.createLinearGradient(0, 0, 0, 256); gr.addColorStop(0, '#f4f6fa'); gr.addColorStop(1, '#c9d1dc'); g.fillStyle = gr; g.fillRect(0, 0, 512, 256);
  g.fillStyle = '#fffbe8'; for (let x = 20; x < 512; x += 120) g.fillRect(x, 10, 80, 7);   // luminarias
  g.fillStyle = '#dfe4ec'; g.fillRect(0, 120, 512, 6);
  for (let x = 30; x < 512; x += 128) { g.fillStyle = '#8b6b4a'; g.fillRect(x, 168, 96, 10); g.fillStyle = '#5c6470'; g.fillRect(x + 4, 178, 6, 60); g.fillRect(x + 86, 178, 6, 60);   // escritorio
    g.fillStyle = '#1b1f26'; g.fillRect(x + 18, 134, 30, 22); g.fillRect(x + 56, 134, 30, 22); g.fillStyle = '#2a5cc4'; g.fillRect(x + 20, 136, 26, 18); g.fillStyle = '#3b7a57'; g.fillRect(x + 58, 136, 26, 18);   // monitores encendidos
    g.fillStyle = '#20242c'; g.fillRect(x + 38, 196, 22, 34); g.beginPath(); g.arc(x + 49, 110 + 70, 0, 0, 7); g.fill();
    if ((x / 128 | 0) % 2 === 0) { g.fillStyle = '#1D2586'; g.fillRect(x + 40, 140, 18, 30); g.fillStyle = '#d8a27a'; g.beginPath(); g.arc(x + 49, 132, 8, 0, 7); g.fill(); } }   // persona en su puesto
  g.fillStyle = 'rgba(29,37,134,.12)'; g.fillRect(0, 0, 512, 256);
  const t = new THREE.CanvasTexture(c); t.wrapS = THREE.RepeatWrapping; t.encoding = THREE.sRGBEncoding; return (AGV_OFF.tex = t); }
function agvOfficeFacade(a, d, L, H, o) { o = o || {}; const g = new THREE.Group(), n = new THREE.Vector3(d.z, 0, -d.x), origin = a.clone().addScaledVector(d, L);   // n: normal hacia afuera; el eje local X recorre la fachada desde el extremo final
  const M = (c, x) => new THREE.MeshStandardMaterial(Object.assign({ color: c, roughness: .55, metalness: .2 }, x || {})), B = (w, h, dp, m, x, y, z) => { const b = new THREE.Mesh(new THREE.BoxGeometry(w, h, dp), m); b.position.set(x, y, z); g.add(b); return b; };
  const alu = M(0x2b2f36, { metalness: .7, roughness: .35 }), panel = M(0xe6e9ee, { roughness: .45 }), navy = M(0x1D2586, { roughness: .4 }), yel = M(0xf2c200, { roughness: .5 });
  const glass = new THREE.MeshStandardMaterial({ color: 0x6f93bf, transparent: true, opacity: .18, roughness: .05, metalness: .3, depthWrite: false });
  const it = agvOfficeInteriorTex().clone(); it.needsUpdate = true; it.repeat.set(L / 8, 1); const inner = new THREE.MeshBasicMaterial({ map: it, toneMapped: false });
  const gy0 = .25, gy1 = 3.15, uy0 = 4.25, uy1 = 5.95;
  B(L, H, .12, panel, L / 2, H / 2, .02);   // revestimiento de panel compuesto
  const ip = new THREE.Mesh(new THREE.PlaneGeometry(L - .6, gy1 - gy0), inner); ip.position.set(L / 2, (gy0 + gy1) / 2, .1); g.add(ip);   // interior iluminado planta baja
  const ip2 = new THREE.Mesh(new THREE.PlaneGeometry(L - .6, uy1 - uy0), inner); ip2.position.set(L / 2, (uy0 + uy1) / 2, .09); g.add(ip2);
  [[gy0, gy1], [uy0, uy1]].forEach(([y0, y1]) => { const gl = new THREE.Mesh(new THREE.PlaneGeometry(L - .6, y1 - y0), glass); gl.position.set(L / 2, (y0 + y1) / 2, .16); g.add(gl);
    for (let x = .3; x <= L - .29; x += 1.5) B(.07, y1 - y0, .1, alu, x, (y0 + y1) / 2, .16);   // parteluces
    [y0, y1, y0 + (y1 - y0) * .72].forEach(y => B(L - .6, .07, .1, alu, L / 2, y, .16)); });   // travesaños
  B(L + .2, .5, .35, navy, L / 2, 3.65, .2);   // losa / franja azul DICKA
  B(L + .2, .9, .3, navy, L / 2, H - .1, .18);   // cornisa
  if (o.sign) { const sg = new THREE.Mesh(new THREE.PlaneGeometry(Math.min(L * .7, 16), .62), new THREE.MeshBasicMaterial({ map: makeTextTexture([{ text: o.sign, size: 64, color: '#ffffff' }], { w: 1400, h: 90, bg: '#1D2586' }) })); sg.position.set(L / 2, H - .1, .34); g.add(sg); }
  if (o.door) { const dx = o.door; B(2.4, 2.5, .12, alu, dx, 1.25, .2); const dg = new THREE.Mesh(new THREE.PlaneGeometry(2.2, 2.35), new THREE.MeshStandardMaterial({ color: 0x7fa2c8, transparent: true, opacity: .55, metalness: .5, roughness: .1 })); dg.position.set(dx, 1.2, .27); g.add(dg); B(.04, 2.35, .05, alu, dx, 1.2, .29);
    B(3.6, .18, 1.6, navy, dx, 2.85, .9); [-1.6, 1.6].forEach(o2 => B(.08, 2.8, .08, alu, dx + o2, 1.4, 1.6));   // marquesina con columnas
    const ac = new THREE.Mesh(new THREE.PlaneGeometry(2.4, .35), new THREE.MeshBasicMaterial({ map: makeTextTexture([{ text: 'ACCESO OFICINAS', size: 60, color: '#1D2586' }], { w: 512, h: 76, bg: '#ffffff' }) })); ac.position.set(dx, 3.05, 1.71); g.add(ac); }
  if (o.rail) { const rz = 1.05, gap = o.door ? [o.door - 2.1, o.door + 2.1] : null; const seg = (x0, x1) => { if (x1 - x0 < .4) return; B(x1 - x0, .07, .07, yel, (x0 + x1) / 2, 1.0, rz); B(x1 - x0, .07, .07, yel, (x0 + x1) / 2, .5, rz); for (let x = x0; x <= x1 + .01; x += 1.6) B(.09, 1.05, .09, yel, Math.min(x, x1), .52, rz); };
    const stop = o.stair ? o.stair - .5 : L; if (gap) { seg(.3, gap[0]); seg(gap[1], stop); } else seg(.3, stop);
    const wk = new THREE.Mesh(new THREE.PlaneGeometry(L, .95), new THREE.MeshBasicMaterial({ color: 0x2e9e5b })); wk.rotation.x = -Math.PI / 2; wk.position.set(L / 2, .015, .55); g.add(wk); }   // andador peatonal verde junto a la fachada
  if (o.stair) { const s0 = o.stair, w = 1.2, z = 1.0, steps = 18, rise = 3.6 / steps, run = .28, sm = M(0x8a929e, { metalness: .6, roughness: .35 });
    for (let i = 0; i < steps; i++) B(run + .02, .05, w, sm, s0 + i * run, rise * (i + 1), z);   // huellas
    const len = steps * run, ang = Math.atan2(3.6, len); [z - w / 2, z + w / 2].forEach(zz => { const st = B(Math.hypot(len, 3.6), .22, .06, alu, s0 + len / 2, 1.8, zz); st.rotation.z = ang; const hr = B(Math.hypot(len, 3.6), .05, .05, yel, s0 + len / 2, 2.8, zz); hr.rotation.z = ang; });
    B(2.2, .12, w + .2, sm, s0 + len + 1.0, 3.6, z); [z - w / 2 - .1, z + w / 2 + .1].forEach(zz => B(2.2, .05, .05, yel, s0 + len + 1.0, 4.6, zz)); B(.05, 1.0, w + .2, yel, s0 + len + 2.1, 4.1, z);   // descanso con barandal
    B(1.0, 2.2, .1, M(0x5b6577, { metalness: .4 }), s0 + len + 1.0, 4.75, .2);   // puerta de planta alta
    [s0, s0 + len].forEach(x => B(.12, x === s0 ? .3 : 3.6, .12, alu, x, (x === s0 ? .3 : 3.6) / 2, z)); }
  g.traverse(m => { if (m.isMesh) { m.castShadow = false; m.receiveShadow = true; } });
  g.position.copy(origin); g.rotation.y = Math.atan2(n.x, n.z); scene.add(g);
  // obstáculos: barandal y escalera (no se puede pasar por encima)
  const w2 = (lx, lz) => new THREE.Vector3(lx, 0, lz).applyAxisAngle(new THREE.Vector3(0, 1, 0), g.rotation.y).add(origin);
  const box = (x0, z0, x1, z1) => { const p = [w2(x0, z0), w2(x1, z1)]; obstacles.push({ minX: Math.min(p[0].x, p[1].x), maxX: Math.max(p[0].x, p[1].x), minZ: Math.min(p[0].z, p[1].z), maxZ: Math.max(p[0].z, p[1].z) }); };
  if (o.rail) box(0, -.1, L, 1.2);
  if (o.stair) box(o.stair - .3, 0, o.stair + 18 * .28 + 2.3, 1.8); }
// ---------- Apariencia según fotos de la nave real (Agave 1) ----------
const AGV_TEX = {};
function agvTex(kind) { if (AGV_TEX[kind]) return AGV_TEX[kind]; const c = document.createElement('canvas'), g = c.getContext('2d');
  if (kind === 'block') { c.width = 256; c.height = 128; g.fillStyle = '#a9adb2'; g.fillRect(0, 0, 256, 128); g.strokeStyle = '#8e9297'; g.lineWidth = 3; for (let r = 0; r < 4; r++) { g.beginPath(); g.moveTo(0, r * 32); g.lineTo(256, r * 32); g.stroke(); for (let k = 0; k < 4; k++) { const x = k * 64 + (r % 2) * 32; g.beginPath(); g.moveTo(x, r * 32); g.lineTo(x, r * 32 + 32); g.stroke(); } } for (let i = 0; i < 900; i++) { g.fillStyle = `rgba(${Math.random() < .5 ? 0 : 255},${Math.random() < .5 ? 0 : 255},${Math.random() < .5 ? 0 : 255},.05)`; g.fillRect(Math.random() * 256, Math.random() * 128, 2, 2); } }
  else if (kind === 'lamina') { c.width = 128; c.height = 64; const gr = g.createLinearGradient(0, 0, 128, 0); for (let k = 0; k <= 8; k++) gr.addColorStop(k / 8, k % 2 ? '#c4c8cd' : '#9aa0a7'); g.fillStyle = gr; g.fillRect(0, 0, 128, 64); }
  else if (kind === 'door') { c.width = 128; c.height = 160; g.fillStyle = '#eef0f2'; g.fillRect(0, 0, 128, 160); g.strokeStyle = '#b8bdc4'; g.lineWidth = 3; for (let y = 20; y < 160; y += 20) { g.beginPath(); g.moveTo(0, y); g.lineTo(128, y); g.stroke(); } g.fillStyle = '#5c6670'; g.fillRect(14, 64, 100, 9); g.fillStyle = '#c9ced4'; g.fillRect(0, 0, 6, 160); g.fillRect(122, 0, 6, 160); }
  else if (kind === 'malla') { c.width = 64; c.height = 64; g.strokeStyle = 'rgba(190,196,204,.95)'; g.lineWidth = 2; for (let k = -64; k < 128; k += 16) { g.beginPath(); g.moveTo(k, 0); g.lineTo(k + 64, 64); g.stroke(); g.beginPath(); g.moveTo(k + 64, 0); g.lineTo(k, 64); g.stroke(); } }
  else if (kind === 'stripe') { c.width = 64; c.height = 64; g.fillStyle = '#f2c200'; g.fillRect(0, 0, 64, 64); g.fillStyle = '#111'; for (let k = -64; k < 128; k += 24) { g.beginPath(); g.moveTo(k, 0); g.lineTo(k + 12, 0); g.lineTo(k + 76, 64); g.lineTo(k + 64, 64); g.fill(); } }
  const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.encoding = THREE.sRGBEncoding; t.anisotropy = 4; return (AGV_TEX[kind] = t); }
// Pasillo peatonal perimetral: franja azul con orillas amarillas (igual que en piso real)
function agvWalkways(A) { const blue = new THREE.MeshStandardMaterial({ color: 0x1f56b8, roughness: .55 }), strip = (x0, z0, x1, z1) => { const m = new THREE.Mesh(new THREE.PlaneGeometry(Math.abs(x1 - x0) || 1.3, Math.abs(z1 - z0) || 1.3), blue); m.rotation.x = -Math.PI / 2; m.position.set((x0 + x1) / 2, .014, (z0 + z1) / 2); m.receiveShadow = true; scene.add(m); };
  const run = (x0, z0, x1, z1) => { const hz = x0 === x1; if (hz) { strip(x0 - .65, z0, x0 + .65, z1); paintLine(x0 - .7, z0, x0 - .7, z1, 0xf2c200, .12); paintLine(x0 + .7, z0, x0 + .7, z1, 0xf2c200, .12); } else { strip(x0, z0 - .65, x1, z0 + .65); paintLine(x0, z0 - .7, x1, z0 - .7, 0xf2c200, .12); paintLine(x0, z0 + .7, x1, z0 + .7, 0xf2c200, .12); } };
  run(A.west + 1, A.north + 1.6, A.east - 1, A.north + 1.6); run(A.west + 1, A.southL - 1.6, -7.5, A.southL - 1.6); run(7.5, A.southL - 1.6, A.offX0 - .5, A.southL - 1.6); run(A.west + 1.4, A.north + 2.3, A.west + 1.4, A.southL - 2.3); }
function agvRealismo(A, H, dm) { const BH = 3.6;
  // Muros: block de concreto abajo, lámina acanalada arriba, columnas blancas cada 8 m
  const face = (x0, z0, x1, z1, nx, nz) => { const L = Math.hypot(x1 - x0, z1 - z0), rot = Math.atan2(nx, nz), cx = (x0 + x1) / 2 + nx * .27, cz = (z0 + z1) / 2 + nz * .27;
    const tb = agvTex('block').clone(); tb.needsUpdate = true; tb.repeat.set(L / 1.6, BH / .8); const b = new THREE.Mesh(new THREE.PlaneGeometry(L, BH), new THREE.MeshStandardMaterial({ map: tb, roughness: .95 })); b.position.set(cx, BH / 2, cz); b.rotation.y = rot; scene.add(b);
    const tl = agvTex('lamina').clone(); tl.needsUpdate = true; tl.repeat.set(L / 1.2, 1); const l = new THREE.Mesh(new THREE.PlaneGeometry(L, H - BH), new THREE.MeshStandardMaterial({ map: tl, roughness: .55, metalness: .35 })); l.position.set(cx, BH + (H - BH) / 2, cz); l.rotation.y = rot; scene.add(l);
    const n = Math.floor(L / 8); const cols = new THREE.InstancedMesh(new THREE.BoxGeometry(.45, H, .45), new THREE.MeshStandardMaterial({ color: 0xf2f3f5, roughness: .6 }), n + 1); for (let k = 0; k <= n; k++) { const t = k / Math.max(n, 1); dm.position.set(x0 + (x1 - x0) * t + nx * .45, H / 2, z0 + (z1 - z0) * t + nz * .45); dm.rotation.set(0, 0, 0); dm.updateMatrix(); cols.setMatrixAt(k, dm.matrix); } scene.add(cols); };
  face(A.west, A.north, A.east, A.north, 0, 1); face(A.west, A.north, A.west, A.southL, 1, 0); face(A.east, A.north, A.east, A.southR, -1, 0); face(A.west, A.southL, -2, A.southL, 0, -1); face(2, A.southL, A.offX0, A.southL, 0, -1); face(A.offX1, A.southR, A.east, A.southR, 0, -1);
  // Postes de protección amarillos con franjas negras a los lados de cada andén
  const docks = [...A.docksN.map(d => ({ ...d, z: A.north, dir: -1 })), ...A.docksS.map(d => ({ ...d, z: d.x > A.offX1 ? A.southR : A.southL, dir: 1 }))];
  const bol = new THREE.InstancedMesh(new THREE.CylinderGeometry(.11, .11, 1.1, 12), new THREE.MeshStandardMaterial({ color: 0xf2c200, roughness: .5 }), docks.length * 2), jamb = new THREE.InstancedMesh(new THREE.BoxGeometry(.18, 1.6, .06), new THREE.MeshStandardMaterial({ map: agvTex('stripe') }), docks.length * 2); let bi = 0;
  docks.forEach(d => [-1.75, 1.75].forEach(o => { dm.rotation.set(0, 0, 0); dm.position.set(d.x + o, .55, d.z - d.dir * .75); dm.updateMatrix(); bol.setMatrixAt(bi, dm.matrix); dm.position.set(d.x + o * .9, .8, d.z - d.dir * .3); dm.updateMatrix(); jamb.setMatrixAt(bi, dm.matrix); bi++; obstacles.push({ minX: d.x + o - .15, maxX: d.x + o + .15, minZ: d.z - d.dir * .75 - .15, maxZ: d.z - d.dir * .75 + .15 }); }));
  scene.add(bol, jamb);
  // Área de RECIBO: piso azul con orilla amarilla, barandal naranja y mesas de verificación
  { const x0 = -26, x1 = -17, z0 = A.north + 3.2, z1 = A.north + 8; const m = new THREE.Mesh(new THREE.PlaneGeometry(x1 - x0, z1 - z0), new THREE.MeshStandardMaterial({ color: 0x1f56b8, roughness: .55 })); m.rotation.x = -Math.PI / 2; m.position.set((x0 + x1) / 2, .015, (z0 + z1) / 2); scene.add(m);
    paintLine(x0, z1, x1, z1, 0xf2c200, .12); paintLine(x0, z0, x0, z1, 0xf2c200, .12); paintLine(x1, z0, x1, z1, 0xf2c200, .12);
    const rail = new THREE.MeshStandardMaterial({ color: 0xff8a00, roughness: .5, metalness: .3 }), r = (w, d, x, y, z) => agvBox(w, .08, d, 0xff8a00, x, y, z).material = rail;
    r(x1 - x0, .08, (x0 + x1) / 2, 1.05, z1 - .2); r(x1 - x0, .08, (x0 + x1) / 2, .55, z1 - .2); for (let x = x0; x <= x1 + .01; x += 1.5) agvBox(.08, 1.1, .08, 0xff8a00, x, .55, z1 - .2).material = rail;
    obstacles.push({ minX: x0 - .2, maxX: x1 + .2, minZ: z0, maxZ: z1 });
    window.AGV_PRINTER = { x: x1 - .7 }; agvBox(.8, .75, .55, 0x6b4a2b, x1 - .7, .375, z0 + 2.2); agvBox(.45, .3, .38, 0xe8eaee, x1 - .7, .9, z0 + 2.2); agvBox(.3, .02, .2, 0xffffff, x1 - .7, 1.06, z0 + 2.3); agvBox(.12, .04, .02, 0x2e9e5b, x1 - .55, 1.0, z0 + 2.4);   // impresora de etiquetas
    window.AGV_DESKS = []; for (let x = x0 + 1.5; x < x1 - 1; x += 2.6) { AGV_DESKS.push({ x, z: z0 + 2.2 }); agvBox(1.6, .08, .7, 0x6b4a2b, x, .95, z0 + 2.2); agvBox(.06, .9, .6, 0x333333, x - .7, .45, z0 + 2.2); agvBox(.06, .9, .6, 0x333333, x + .7, .45, z0 + 2.2); agvComputer(x, .99, z0 + 2.38); }   // computadora (modelo 3D: monitor, gabinete, teclado y mouse)
    const sg = new THREE.Mesh(new THREE.PlaneGeometry(2.6, .9), new THREE.MeshBasicMaterial({ map: makeTextTexture([{ text: 'RECIBO', size: 110, color: '#1D2586' }], { w: 512, h: 180, bg: '#ffffff' }) })); sg.position.set((x0 + x1) / 2 + 1.3, 2.25, z1 - .2); sg.rotation.y = Math.PI; scene.add(sg); const sg2 = sg.clone(); sg2.rotation.y = 0; sg2.position.z += .02; scene.add(sg2); agvBox(.08, 1.2, .08, 0xff8a00, (x0 + x1) / 2 + .1, 1.7, z1 - .2); agvBox(.08, 1.2, .08, 0xff8a00, (x0 + x1) / 2 + 2.5, 1.7, z1 - .2); }   // letrero sobre el barandal (visible, sin columna enfrente)
  // Letreros de cliente colgados en las cabeceras de pasillo (EPSON · LASER · TOCONSA …)
  const CL = ['EPSON', 'LASER', 'TOCONSA', 'LIVERPOOL', 'EPSON', 'LASER', 'TOCONSA', 'LIVERPOOL', 'EPSON', 'LASER', 'TOCONSA', 'LIVERPOOL', 'EPSON', 'LASER'];
  AISLES.slice(0, 14).forEach((a, k) => { const z = (k < 8 ? A.Z(585) : A.Z(635)) + .2, name = CL[k]; const sm = new THREE.Mesh(new THREE.PlaneGeometry(1.5, .7), new THREE.MeshBasicMaterial({ map: makeTextTexture([{ text: name, size: 90, color: '#1D2586' }], { w: 512, h: 240, bg: '#ffffff' }), side: THREE.DoubleSide })); sm.position.set(a.x - 2.2, 7.6, z); scene.add(sm); });
  // Pendones morados colgados del techo (cultura DICKA) en el pasillo central
  ['SEGURIDAD PRIMERO', 'GIVE ME FIVE · 5S', 'CALIDAD', 'TRABAJO EN EQUIPO', 'RESPETO AL PEATÓN'].forEach((t, k) => { const b = new THREE.Mesh(new THREE.PlaneGeometry(1.4, 3.6), new THREE.MeshBasicMaterial({ map: makeTextTexture([{ text: t, size: 54, color: '#ffffff' }], { w: 256, h: 660, bg: '#4b2a8c' }), side: THREE.DoubleSide })); b.position.set(-8 + k * 6, 9, A.north + 5); scene.add(b); });
  // Tarimas emplayadas en STAGE IN y STAGE OUT (orilla poniente de cada zona, fuera de las rutas)
  // mismas texturas liberadas en el almacén genérico: tarima de madera + carga de cartón (3 variantes) + etiqueta DICKA
  const n = 24, pal = new THREE.InstancedMesh(palletGeometry('lite'), new THREE.MeshStandardMaterial({ map: woodTex(), roughness: .9 }), n), loads = [0, 1, 2].map(v => new THREE.InstancedMesh(new THREE.BoxGeometry(.95, 1, 1.1), unitLoadMat(v), n)), cnt = [0, 0, 0], lbl = new THREE.InstancedMesh(new THREE.PlaneGeometry(.5, .25), new THREE.MeshBasicMaterial({ color: BRAND.brillante }), n); let pi = 0;
  [[-14, -57, -41], [-14, 14, 20]].forEach(([x, za, zb]) => { for (let z = za; z <= zb && pi < n; z += 1.6) for (const dx of [0, 1.4]) { if (pi >= n) break; const bh = .7 + Math.random() * .7, v = pi % 3;
      dm.scale.set(1, 1, 1); dm.rotation.set(0, Math.PI / 2, 0); dm.position.set(x + dx, .14, z); dm.updateMatrix(); pal.setMatrixAt(pi, dm.matrix);
      dm.rotation.set(0, 0, 0); dm.position.set(x + dx, .21 + bh / 2, z); dm.scale.set(1, bh, 1); dm.updateMatrix(); loads[v].setMatrixAt(cnt[v]++, dm.matrix);
      dm.scale.set(1, 1, 1); dm.position.set(x + dx + .49, .21 + bh / 2, z); dm.rotation.set(0, Math.PI / 2, 0); dm.updateMatrix(); lbl.setMatrixAt(pi, dm.matrix); pi++; }
    obstacles.push({ minX: x - .7, maxX: x + 2.1, minZ: za - .7, maxZ: zb + .7 }); });
  pal.count = lbl.count = pi; loads.forEach((m, v) => { m.count = cnt[v]; m.receiveShadow = true; scene.add(m); }); scene.add(pal, lbl); }
// ---------- Simbología de seguridad e higiene (según el plano) ----------
const AGV_SIGN = {};
function agvSignTex(type) { if (AGV_SIGN[type]) return AGV_SIGN[type]; const c = document.createElement('canvas'); c.width = 256; c.height = 256; const g = c.getContext('2d');
  const bg = (col) => { g.fillStyle = col; g.fillRect(0, 0, 256, 256); }, txt = (t, y, col = '#fff', sz = 30) => { g.fillStyle = col; g.font = `900 ${sz}px Arial`; g.textAlign = 'center'; g.fillText(t, 128, y); };
  const person = (cx, cy, col, fem) => { g.fillStyle = col; g.beginPath(); g.arc(cx, cy - 42, 16, 0, 7); g.fill(); if (fem) { g.beginPath(); g.moveTo(cx - 28, cy + 30); g.lineTo(cx + 28, cy + 30); g.lineTo(cx + 12, cy - 22); g.lineTo(cx - 12, cy - 22); g.fill(); } else g.fillRect(cx - 18, cy - 22, 36, 52); g.fillRect(cx - 14, cy + 30, 10, 34); g.fillRect(cx + 4, cy + 30, 10, 34); };
  switch (type) {
    case 'hidrante': bg('#c8102e'); g.fillStyle = '#fff'; g.fillRect(70, 40, 116, 130); g.fillStyle = '#c8102e'; g.beginPath(); g.arc(128, 105, 42, 0, 7); g.fill(); g.strokeStyle = '#fff'; g.lineWidth = 8; g.beginPath(); g.arc(128, 105, 24, 0, 7); g.stroke(); txt('HIDRANTE', 215, '#fff', 34); break;
    case 'alarma': bg('#c8102e'); g.strokeStyle = '#fff'; g.lineWidth = 12; g.beginPath(); g.arc(128, 105, 55, 0, 7); g.stroke(); g.fillStyle = '#fff'; g.beginPath(); g.arc(128, 105, 22, 0, 7); g.fill(); [[-1, 1], [1, 1]].forEach(([sx]) => { g.beginPath(); g.arc(128, 105, 80, sx > 0 ? -.6 : Math.PI - .6 + 1.2 - 1.2, sx > 0 ? .6 : Math.PI + .6); g.stroke(); }); txt('ALARMA', 220, '#fff', 36); break;
    case 'salidaEmerg': bg('#007a33'); g.fillStyle = '#fff'; g.fillRect(20, 60, 216, 120); txt('SALIDA DE', 110, '#007a33', 38); txt('EMERGENCIA', 160, '#007a33', 38); g.fillStyle = '#fff'; g.beginPath(); g.moveTo(200, 210); g.lineTo(240, 225); g.lineTo(200, 240); g.fill(); g.fillRect(150, 220, 55, 10); break;
    case 'sanMujeres': bg('#1d4fd8'); person(128, 128, '#fff', true); txt('MUJERES', 238, '#fff', 30); break;
    case 'sanHombres': bg('#1d4fd8'); person(128, 128, '#fff', false); txt('HOMBRES', 238, '#fff', 30); break;
    case 'discapacitados': bg('#1d4fd8'); g.strokeStyle = '#fff'; g.lineWidth = 12; g.beginPath(); g.arc(118, 150, 50, .3, 5.6); g.stroke(); g.fillStyle = '#fff'; g.beginPath(); g.arc(128, 48, 16, 0, 7); g.fill(); g.fillRect(118, 66, 16, 70); g.fillRect(118, 120, 60, 14); g.fillRect(166, 120, 14, 60); break;
    case 'tablero': bg('#f5c400'); g.fillStyle = '#111'; g.beginPath(); g.moveTo(128, 30); g.lineTo(230, 200); g.lineTo(26, 200); g.closePath(); g.fill(); g.fillStyle = '#f5c400'; g.beginPath(); g.moveTo(140, 70); g.lineTo(108, 140); g.lineTo(132, 140); g.lineTo(116, 185); g.lineTo(152, 118); g.lineTo(128, 118); g.closePath(); g.fill(); txt('RIESGO ELÉCTRICO', 238, '#111', 24); break;
    default: bg('#666'); txt(type, 140); }
  const t = new THREE.CanvasTexture(c); t.encoding = THREE.sRGBEncoding; AGV_SIGN[type] = new THREE.MeshBasicMaterial({ map: t }); return AGV_SIGN[type]; }
function agvSign(type, x, y, z, rotY, size = 0.9) { if (['salida', 'extintor', 'botiquin', 'reunion', 'electrico', 'evacDer', 'evacIzq', 'noFumar', 'precMonta', 'casco', 'chaleco', 'vel10'].includes(type)) return addSign(type, x, y, z, rotY, size);
  const m = new THREE.Mesh(new THREE.PlaneGeometry(size, size), agvSignTex(type)); m.position.set(x, y, z); m.rotation.y = rotY; scene.add(m); return m; }
function agvBox(w, h, d, color, x, y, z, opts = {}) { const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), new THREE.MeshStandardMaterial(Object.assign({ color, roughness: .7 }, opts))); m.position.set(x, y, z); scene.add(m); return m; }
function agvFloorLabel(text, x, z, w, h, color = '#f5c400', bg = 'rgba(0,0,0,0)', rot = 0) { const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ map: makeTextTexture([{ text, size: 90, color }], { w: 1024, h: Math.round(1024 * h / w), bg }), transparent: true, depthWrite: false })); m.rotation.x = -Math.PI / 2; m.rotation.z = rot; m.position.set(x, 0.02, z); scene.add(m); return m; }
function agvZone(x0, z0, x1, z1, color, opacity = .35) { const m = new THREE.Mesh(new THREE.PlaneGeometry(x1 - x0, z1 - z0), new THREE.MeshBasicMaterial({ color, transparent: true, opacity, depthWrite: false })); m.rotation.x = -Math.PI / 2; m.position.set((x0 + x1) / 2, 0.012, (z0 + z1) / 2); scene.add(m);
  paintLine(x0, z0, x1, z0); paintLine(x1, z0, x1, z1); paintLine(x1, z1, x0, z1); paintLine(x0, z1, x0, z0); return m; }

// ---------- Construcción del escenario ----------
function buildAgaveWorld() { const A = AGV, H = 12;
  WAREHOUSE.w = A.east - A.west; WAREHOUSE.d = 90;   // d = 90 conserva el muro sur-poniente en Z = 45 (andén de prácticas P6)
  AISLE_Z.z0 = -60; AISLE_Z.z1 = 53; AISLE_Z.custom = true; RACK_WALKS.length = 0; if (typeof AISLE_NAMES !== 'undefined') Object.keys(AISLE_NAMES).forEach(k => delete AISLE_NAMES[k]);
  if (scene.fog) { scene.fog.near = 70; scene.fog.far = 170; }
  // Piso de concreto
  const fw = A.east - A.west, fd = A.offZ1 - A.north; const floor = new THREE.Mesh(new THREE.PlaneGeometry(fw, fd), new THREE.MeshStandardMaterial({ map: concreteTex(), roughness: .6, metalness: .08 }));
  floor.rotation.x = -Math.PI / 2; floor.position.set((A.west + A.east) / 2, 0, (A.north + A.offZ1) / 2); floor.receiveShadow = true; scene.add(floor);
  loadRealTex('piso.jpg', fw / 4, fd / 4, t => { floor.material.map = t; floor.material.color.setRGB(1.15, 1.15, 1.15); floor.material.needsUpdate = true; });
  // Muros perimetrales (con vano en el andén de prácticas P6)
  const wallMat = new THREE.MeshStandardMaterial({ color: 0xd9dde6, roughness: .95 });
  const wall = (x0, z0, x1, z1, h = H) => { const L = Math.hypot(x1 - x0, z1 - z0), m = new THREE.Mesh(new THREE.BoxGeometry(L, h, 0.5), wallMat); m.position.set((x0 + x1) / 2, h / 2, (z0 + z1) / 2); m.rotation.y = -Math.atan2(z1 - z0, x1 - x0); scene.add(m);
    obstacles.push({ minX: Math.min(x0, x1) - .3, maxX: Math.max(x0, x1) + .3, minZ: Math.min(z0, z1) - .3, maxZ: Math.max(z0, z1) + .3 }); };
  wall(A.west, A.north, A.east, A.north); wall(A.west, A.north, A.west, A.southL); wall(A.east, A.north, A.east, A.southR);
  wall(A.west, A.southL, -2, A.southL); wall(2, A.southL, A.offX0, A.southL); { const l = new THREE.Mesh(new THREE.BoxGeometry(4, H - 3.4, .5), wallMat); l.position.set(0, 3.4 + (H - 3.4) / 2, A.southL); scene.add(l); }
  wall(A.offX0, A.southL, A.offX0, A.offZ1); wall(A.offX0, A.offZ1, A.offX1, A.offZ1); wall(A.offX1, A.offZ1, A.offX1, A.southR); wall(A.offX1, A.southR, A.east, A.southR);
  // Oficinas, mesa de control y sanitarios (bloque sur-centro)
  { const ox0 = A.offX0 + .3, ox1 = A.offX1 - .3, oz0 = A.offZ0, oz1 = A.offZ1 - .3, oh = 7.2, glass = new THREE.MeshStandardMaterial({ color: 0x9fc3e8, transparent: true, opacity: .45, roughness: .1, metalness: .2 });
    const ow = (x0, z0, x1, z1) => { const L = Math.hypot(x1 - x0, z1 - z0), m = new THREE.Mesh(new THREE.BoxGeometry(L, oh, .2), wallMat); m.position.set((x0 + x1) / 2, oh / 2, (z0 + z1) / 2); m.rotation.y = -Math.atan2(z1 - z0, x1 - x0); scene.add(m); };
    ow(ox0, oz0, ox1, oz0); ow(ox1, oz0, ox1, oz1);   // fachada norte y fachada oriente (antes abierta: se veía el interior vacío)
    obstacles.push({ minX: ox0 - .3, maxX: ox1 + .3, minZ: oz0 - .5, maxZ: oz1 + .3 });
    // Fachadas corporativas: norte (frente a racks, con acceso principal) y oriente (con escalera a planta alta)
    agvOfficeFacade(new THREE.Vector3(ox0, 0, oz0), new THREE.Vector3(1, 0, 0), ox1 - ox0, oh, { door: 12, sign: 'DICKA LOGISTICS · OFICINAS · MESA DE CONTROL', rail: true });
    agvOfficeFacade(new THREE.Vector3(ox1, 0, oz0), new THREE.Vector3(0, 0, 1), oz1 - oz0, oh, { door: 6, sign: 'OFICINAS · PLANTA BAJA Y ALTA', rail: true, stair: oz1 - oz0 - 9 });
    const tag = (t, x, w, col = '#ffffff', bg = '#1D2586') => { const m = new THREE.Mesh(new THREE.PlaneGeometry(w, .7), new THREE.MeshBasicMaterial({ map: makeTextTexture([{ text: t, size: 70, color: col }], { w: 1024, h: Math.round(1024 * .7 / w), bg }) })); m.position.set(x, 3.15, oz0 - .12); m.rotation.y = Math.PI; scene.add(m); };
    agvSign('sanMujeres', ox1 - 7, 2.2, oz0 - .13, Math.PI, .8); agvSign('sanHombres', ox1 - 5.8, 2.2, oz0 - .13, Math.PI, .8); agvSign('botiquin', ox0 + 4, 2.2, oz0 - .13, Math.PI); agvSign('extintor', ox0 + 6, 2.2, oz0 - .13, Math.PI); makeExtinguisher(ox0 + 6, oz0 - .35, Math.PI);
    const roof = new THREE.Mesh(new THREE.BoxGeometry(ox1 - ox0, .2, oz1 - oz0), new THREE.MeshStandardMaterial({ color: 0xb8bec8 })); roof.position.set((ox0 + ox1) / 2, oh, (oz0 + oz1) / 2); scene.add(roof); }
  // Andenes: cortinas, numeración P1–P41, topes y tráileres estacionados
  const doorMat = new THREE.MeshStandardMaterial({ map: agvTex('door'), metalness: .2, roughness: .5 }), bump = new THREE.MeshStandardMaterial({ color: 0x16181c, roughness: .9 }), trailerMat = new THREE.MeshStandardMaterial({ color: 0xe8eaee, roughness: .7 }), cabMat = new THREE.MeshStandardMaterial({ color: 0x1D2586, roughness: .5 });
  const docks = [...A.docksN.map(d => ({ ...d, z: A.north, dir: -1 })), ...A.docksS.map(d => ({ ...d, z: d.x > A.offX1 ? A.southR : A.southL, dir: 1 }))];
  const tb = new THREE.InstancedMesh(new THREE.BoxGeometry(2.6, 3.9, 13.6), trailerMat, docks.length), tc = new THREE.InstancedMesh(new THREE.BoxGeometry(2.5, 3.2, 3.0), cabMat, docks.length), dm = new THREE.Object3D(); let nT = 0;
  docks.forEach((d, i) => { const zi = d.z - d.dir * .28, open = d.id === 'P6';
    if (!open) { const door = new THREE.Mesh(new THREE.PlaneGeometry(3, 3.4), doorMat); door.position.set(d.x, 1.7, zi); door.rotation.y = d.dir > 0 ? Math.PI : 0; scene.add(door); }
    [-1.45, 1.45].forEach(o => { const b = new THREE.Mesh(new THREE.BoxGeometry(.25, .45, .25), bump); b.position.set(d.x + o, 1.0, zi - d.dir * .12); scene.add(b); });
    const num = new THREE.Mesh(new THREE.PlaneGeometry(1.4, .6), new THREE.MeshBasicMaterial({ map: makeTextTexture([{ text: d.id, size: 110, color: open ? '#ffffff' : '#111111' }], { w: 256, h: 110, bg: open ? '#c8102e' : '#f2c200' }) })); num.position.set(d.x, 3.9, zi - d.dir * .02); num.rotation.y = d.dir > 0 ? Math.PI : 0; scene.add(num);
    if (!open && i % 3 !== 1) { dm.position.set(d.x, 2.25, d.z + d.dir * 7.3); dm.rotation.set(0, 0, 0); dm.updateMatrix(); tb.setMatrixAt(nT, dm.matrix); dm.position.set(d.x, 1.9, d.z + d.dir * 15.8); dm.updateMatrix(); tc.setMatrixAt(nT, dm.matrix); nT++; } });
  tb.count = tc.count = nT; scene.add(tb, tc);
  // Racks zona oriente: 13 filas dobles (espalda con espalda) con 2 pasillos transversales
  const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ', mid = agvSegments(-200, 200)[1], midBays = Math.floor((mid[1] - mid[0]) / 2.8);
  RACK_LAYOUT.xs = []; RACK_LAYOUT.facing = []; RACK_LAYOUT.aisleOf = []; RACK_LAYOUT.letters = letters; RACK_LAYOUT.zStart = mid[0]; RACK_LAYOUT.bays = midBays; RACK_LAYOUT.levels = A.rackH;
  RACK_XS.length = 0; AISLES.length = 0;
  A.colX.forEach((cx, k) => { const z0 = k < 2 ? A.Z(270) : A.Z(297), z1 = k < 7 ? A.Z(585) : A.Z(635);
    [[-1.2, -1], [1.2, 1]].forEach(([dx, f], j) => { const x = cx + dx, L = letters[k * 2 + j]; RACK_XS.push(x);
      agvSegments(z0, z1).forEach(([a, b], si) => { const bays = si === 1 ? midBays : Math.floor((b - a) / 2.8); agvRack(x, si === 1 ? mid[0] : a, bays, A.rackH, f, L, si === 1); });
      RACK_LAYOUT.xs.push(x); RACK_LAYOUT.facing.push(f); RACK_LAYOUT.aisleOf.push(k + 1 + j); }); });
  // Pasillos de la zona oriente (1 = poniente de la fila A/B … 14 = oriente de la última fila)
  for (let k = 0; k <= 13; k++) { const x = k === 0 ? A.colX[0] - 3.95 : A.colX[k - 1] + 3.95; AISLES.push({ x, half: 1.55, label: 'PASILLO ' + (k + 1), endZ: k >= 7 ? A.Z(635) : A.Z(585) });
    const s = new THREE.Mesh(new THREE.PlaneGeometry(2.6, .9), new THREE.MeshBasicMaterial({ map: makeTextTexture([{ text: 'PASILLO ' + (k + 1), size: 72, color: '#fff' }], { w: 512, h: 180, bg: '#c8102e' }), side: THREE.DoubleSide })); s.position.set(x, 9.5, A.Z(600)); scene.add(s); }
  // Racks zona poniente (3 filas)
  const wz0 = A.Z(275), wz1 = A.Z(535), lz0 = A.Z(320), lz1 = A.Z(545);
  [[-42.7, 1, wz0, wz1], [-37.3, -1, lz0, lz1], [-34.9, 1, lz0, lz1], [-29.5, -1, lz0, lz1]].forEach(([x, f, z0, z1], i) => { RACK_XS.push(x); agvSegments(z0, z1).forEach(([a, b], si) => agvRack(x, a, Math.floor((b - a) / 2.8), 5, f, 'W' + (i + 1), si === 1)); });
  AISLES.push({ x: -40.0, half: 1.5, label: 'PASILLO 15', endZ: lz1 }, { x: -32.2, half: 1.5, label: 'PASILLO 16', endZ: lz1 });
  flushRackInstances();
  // Pasillos transversales (franjas naranjas del plano)
  A.cuts.forEach(cz => { const m = new THREE.Mesh(new THREE.PlaneGeometry(A.colX[12] - A.colX[0] + 6, A.cutW - .6), new THREE.MeshBasicMaterial({ color: 0xff7a1a, transparent: true, opacity: .28, depthWrite: false })); m.rotation.x = -Math.PI / 2; m.position.set((A.colX[0] + A.colX[12]) / 2, .011, cz); scene.add(m); });
  // Zonas operativas del plano
  agvZone(-15, -60, 12, -38, 0xf5c400, .18); agvFloorLabel('STAGE IN · RECIBO', -1.5, -49, 20, 3);
  agvZone(-15, 12, 12, 33, 0xf5c400, .18); agvFloorLabel('STAGE OUT · EMBARQUE', -1.5, 22, 20, 3);
  agvZone(-38, -62, -26, -53.6, 0xff7a1a, .45); agvFloorLabel('PREPARACIÓN Y CONSOLIDACIÓN', -32, -57.8, 11.5, 1.6, '#011131');
  agvZone(-38, -52.5, -26, -48.5, 0xff7a1a, .3); agvFloorLabel('ETIQUETADO', -29, -50.5, 5, 1.2, '#011131'); agvLabeler(-35.5, -50.5); agvFloorLabel('ETIQUETADORA', -35.5, -48.9, 3.6, .8, '#ffffff', '#1D2586');
  agvZone(-38, 26.5, -28.6, 41.9, 0xff7a1a, .45); agvFloorLabel('PREPARACIÓN LIVERPOOL', -33.3, 34, 9, 1.5, '#011131', 'rgba(0,0,0,0)', Math.PI / 2);
  agvZone(-18, 5, -12, 11, 0x1d4fd8, .35); agvFloorLabel('ESTACIONAMIENTO DE EQUIPOS', -15, 8, 5.6, 1.2, '#ffffff');
  // Cruce peatonal frente al andén de prácticas (alto en Z 36.5, zona verde hasta Z 40.5)
  { const g = new THREE.Mesh(new THREE.PlaneGeometry(14, 4), new THREE.MeshBasicMaterial({ color: 0x2e9e5b, transparent: true, opacity: .55, depthWrite: false })); g.rotation.x = -Math.PI / 2; g.position.set(0, .013, 38.5); scene.add(g);
    for (let x = -6.5; x <= 6.5; x += 1.3) paintLine(x, 37, x, 40, 0xffffff, .5); paintLine(-7, 36.4, 7, 36.4, 0xffffff, .3); agvFloorLabel('ALTO', 0, 35.2, 3, 1, '#ffffff'); }
  // Pasillo peatonal perimetral (franja verde) frente a andenes norte y sur
  agvWalkways(A);
  // ===== Seguridad e higiene: extintores, hidrantes, tableros eléctricos, alarmas, botiquines, salidas y puntos de reunión =====
  const wN = A.north + .3, wW = A.west + .3, wE = A.east - .3, y = 2.4;
  for (let x = A.west + 8; x < A.east - 4; x += 15) if (!A.docksN.some(d => Math.abs(d.x - x) < 2.2)) { agvSign('extintor', x, y, wN, 0); makeExtinguisher(x, wN + .05, 0); }
  for (let z = A.north + 8; z < A.southL - 4; z += 15) { agvSign('extintor', wW, y, z, Math.PI / 2); makeExtinguisher(wW + .05, z, Math.PI / 2); }
  for (let z = A.north + 8; z < A.southR - 4; z += 15) { agvSign('extintor', wE, y, z, -Math.PI / 2); makeExtinguisher(wE - .05, z, -Math.PI / 2); }
  A.colX.forEach((cx, k) => { if (k % 2) return; const z1 = (k < 7 ? A.Z(585) : A.Z(635)) + .9; const px = cx + .5, pz = z1 + .25; agvSign('extintor', px, 2.3, pz + .045, 0, .55); const post = new THREE.Mesh(new THREE.BoxGeometry(.1, 2.75, .08), new THREE.MeshStandardMaterial({ color: 0xc8102e, roughness: .6 })); post.position.set(px, 1.375, pz); post.castShadow = true; scene.add(post); const base = new THREE.Mesh(new THREE.BoxGeometry(.4, .04, .4), new THREE.MeshStandardMaterial({ color: 0x333333 })); base.position.set(px, .02, pz); scene.add(base); makeExtinguisher(px, pz + .1, 0); });   // cabeceras de rack: poste de piso con señal y extintor (no flotan)
  const cab = (x, z, rot, type) => { const b = agvBox(.9, 1.2, .35, type === 'hidrante' ? 0xc8102e : 0x8a929e, 0, 1.3, 0, { metalness: .3 }); b.position.set(x, 1.3, z); b.rotation.y = rot; agvSign(type === 'hidrante' ? 'hidrante' : 'tablero', x - Math.sin(rot) * 0, 2.6, z, rot, .7); };
  [[wW, -40, Math.PI / 2], [wW, 5, Math.PI / 2], [wE, -30, -Math.PI / 2], [wE, 30, -Math.PI / 2], [45, wN, 0], [-30, A.southL - .3, Math.PI]].forEach(([x, z, r]) => cab(x, z, r, 'hidrante'));
  [[-17.5, wN, 0], [33.5, wN, 0], [73.5, wN, 0], [117, wN, 0], [-22.5, A.southL - .3, Math.PI], [26, A.southL - .3, Math.PI], [93, A.southR - .3, Math.PI]].forEach(([x, z, r]) => cab(x, z, r, 'tablero'));
  // Salidas de emergencia (puerta verde con letrero e indicador) y alarmas a su lado
  [[wW, -60, Math.PI / 2], [wW, 32, Math.PI / 2], [wE, -60, -Math.PI / 2], [wE, 20, -Math.PI / 2], [wE, 64, -Math.PI / 2], [57, wN, 0]].forEach(([x, z, r]) => { const d = agvBox(1.2, 2.2, .12, 0x007a33, x, 1.1, z); d.rotation.y = r;
    agvSign('salidaEmerg', x, 2.9, z, r, 1.0); const off = 1.4; agvSign('alarma', x + Math.cos(r) * off, 2.2, z - Math.sin(r) * off, r, .45); agvSign('salida', x - Math.cos(r) * off, 2.9, z + Math.sin(r) * off, r, .8); });
  agvSign('botiquin', 50, y, wN, 0); agvSign('botiquin', wE, y, 0, -Math.PI / 2); agvSign('botiquin', wW, y, -10, Math.PI / 2);
  // Puntos de reunión (exterior) y lugar para discapacitados junto a oficinas
  [[A.X(255), A.Z(210)], [A.X(390), A.Z(690) + 30], [A.X(608), A.Z(748)]].forEach(([x, z]) => { const p = agvBox(.08, 2.2, .08, 0x777777, x, 1.1, z); agvSign('reunion', x, 2.4, z, Math.PI, 1.0); agvSign('reunion', x, 2.4, z + .01, 0, 1.0); const pad = new THREE.Mesh(new THREE.CircleGeometry(2.5, 24), new THREE.MeshBasicMaterial({ color: 0x2e9e5b, transparent: true, opacity: .6 })); pad.rotation.x = -Math.PI / 2; pad.position.set(x, .02, z); scene.add(pad); });
  { const x = A.X(540), z = A.offZ1 + 4; const sp = new THREE.Mesh(new THREE.PlaneGeometry(3.2, 5.5), new THREE.MeshBasicMaterial({ color: 0x1d4fd8, transparent: true, opacity: .7 })); sp.rotation.x = -Math.PI / 2; sp.position.set(x, .02, z); scene.add(sp); agvBox(.08, 2.2, .08, 0x777777, x + 2, 1.1, z); agvSign('discapacitados', x + 2, 2.4, z, Math.PI, .8); }
  // Iluminación de la nave
  [[0, -30], [0, 20], [45, -30], [45, 20], [95, -30], [95, 20]].forEach(([x, z]) => { const pl = new THREE.PointLight(0xfff4d6, .8, 95); pl.position.set(x, H - 1, z); scene.add(pl); });
  const lampG = new THREE.BoxGeometry(.3, .1, 2.6), lampM = new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0xfff1c0, emissiveIntensity: 1.2 }); const nL = Math.ceil((A.east - A.west) / 20) * Math.ceil((A.offZ1 - A.north) / 18); const lamps = new THREE.InstancedMesh(lampG, lampM, nL); let li = 0;
  for (let x = A.west + 10; x < A.east; x += 20) for (let z = A.north + 9; z < A.southL; z += 18) { if (li >= nL) break; dm.position.set(x, H - .4, z); dm.updateMatrix(); lamps.setMatrixAt(li++, dm.matrix); } lamps.count = li; scene.add(lamps);
  // Logo DICKA en el muro norte
  { const m = new THREE.Mesh(new THREE.PlaneGeometry(14, 3), new THREE.MeshBasicMaterial({ map: makeTextTexture([{ text: 'DICKA LOGISTICS · AGAVE 1 · PROYECTO NAOS', size: 70, color: '#ffffff' }], { w: 1400, h: 300, bg: '#1D2586' }) })); m.position.set(50, 8.5, A.north + .3); scene.add(m); }
  // Techo de lámina a 12 m (se oculta al ver desde arriba)
  { const roof = new THREE.Mesh(new THREE.PlaneGeometry(A.east - A.west, A.offZ1 - A.north), new THREE.MeshStandardMaterial({ color: 0x9aa3b2, side: THREE.DoubleSide, roughness: .7, metalness: .3 })); roof.rotation.x = Math.PI / 2; roof.position.set((A.west + A.east) / 2, H, (A.north + A.offZ1) / 2); roof.name = 'roof'; window.roofMesh = roof; scene.add(roof);
    const sky = new THREE.MeshStandardMaterial({ color: 0xe9f3ff, emissive: 0xdcecff, emissiveIntensity: .7, side: THREE.DoubleSide }); for (let z = A.north + 12; z < A.southL - 6; z += 22) { const sk = new THREE.Mesh(new THREE.PlaneGeometry(A.east - A.west - 8, 1.6), sky); sk.rotation.x = Math.PI / 2; sk.position.set((A.west + A.east) / 2, H - .02, z); scene.add(sk); } }
  agvRealismo(A, H, dm); agvDeskWorkers(0);
  window.RECEP_POS = { x: -1.5, z: -43 };
  agvMissions(); }

// Misiones ajustadas al layout de Agave 1 (sin cuarto de carga: la misión de carga de batería no aplica en este escenario)
function agvMissions() { const by = id => ACTS.find(a => a.id === id);
  const piso = by('piso'); Object.assign(piso, { name: 'Traslado STAGE OUT → PREPARACIÓN LIVERPOOL', text: 'Toma la tarima en STAGE OUT y llévala a PREPARACIÓN LIVERPOOL (zona naranja poniente)', spawn: { x: 5, y: 0, z: 26 }, drop: { x: -33.3, z: 34, r: 3, yMin: 0, yMax: 0.6, label: 'PREPARACIÓN LIVERPOOL' } });
  const r2 = by('rack2'); r2.spawn = { x: 10, y: 0, z: 9 };
  const r3 = by('rack3'); r3.drop = { x: -1.5, z: -43, r: 3, yMin: 0, yMax: 0.6, label: 'STAGE IN · RECIBO' };
  const tr = by('trailer'); Object.assign(tr, { text: 'Toma la tarima de STAGE OUT, toca el CLAXON antes de entrar por el ANDÉN P6 y colócala al FONDO de la caja del tráiler', spawn: { x: 3, y: 0, z: 24 } });
  const pk = by('estacionar'); Object.assign(pk, { goal: { x: -15, z: 8, r: 2.2 }, name: 'Estacionamiento de equipos', text: 'Estaciona en la zona azul (poniente de STAGE OUT): horquillas al piso, mástil al frente, freno aplicado y llave fuera' });
  const ci = ACTS.findIndex(a => a.id === 'carga'); if (ci >= 0) ACTS.splice(ci, 1); }

// Tráfico del escenario: montacargas en pasillos y en el pasillo transversal; personal por los pasillos peatonales perimetrales
function buildTrafficAgave() { const A = AGV;
  if (!GLTF_AVATAR.tried) { loadOperarioModel().then(() => loadOperaria()).then(() => loadExtraAvatars()).then(() => { buildTrafficAgave(); try { mergeSceneStatics(); } catch (e) { } }); return; }
  const aisleRoute = n => { const a = AISLES[n - 1]; return [[a.x, A.Z(330)], [a.x, A.Z(570)]]; };
  npcForklift('11', aisleRoute(3), 0.2); NPC.forks[NPC.forks.length - 1].aisle = 3;
  npcForklift('14', aisleRoute(8), 0.6); NPC.forks[NPC.forks.length - 1].aisle = 8;
  npcForklift('17', [[-12, A.cuts[1]], [118, A.cuts[1]]], 0.4);
  npcForklift('22', [[-10, -44], [8, -44], [8, -56], [-10, -56]], 0.1);
  const fem = typeof GLTF_FEM !== 'undefined' && GLTF_FEM.gltf;
  // Personal de RECIBO trabajando de pie en las computadoras (mismo modelo y tecleo que la oficina del almacén genérico)
  npcPed('Auxiliar de embarque', [[A.west + 2, A.southL - 1.6], [-8, A.southL - 1.6]], 0.2, { prop: 'scanner' });
  npcPed('Verificador de recibo', [[A.west + 2, A.north + 1.6], [A.east - 2, A.north + 1.6]], 0.45, { prop: 'clipboard' });
  npcPed('Supervisor de turno', [[A.east - 2, A.north + 1.6], [A.west + 2, A.north + 1.6]], 0.7, fem ? { fem: true, prop: 'radio' } : { prop: 'radio' });
  npcPed('Auxiliar de preparación', [[-31, 27.5], [-31, 41]], 0.35, fem ? { fem: true, prop: 'scanner' } : { prop: 'scanner' });
  npcPed('Auxiliar de inventario', [[A.west + 1.4, -60], [A.west + 1.4, 40]], 0.55, { prop: 'scanner' });
  // 10 personas más en movimiento: andenes, recibo, embarque, preparación y pasillos transversales (pasos peatonales)
  const F = o => fem ? Object.assign({ fem: true }, o) : o, ax = n => AISLES[n - 1].x;
  npcPed('Auxiliar de recibo', [[-30, A.north + 1.6], [10, A.north + 1.6]], 0.15, F({ prop: 'clipboard' }));
  npcPed('Checador de andén', [[20, A.north + 1.6], [70, A.north + 1.6]], 0.6, { prop: 'scanner' });
  npcPed('Auxiliar de embarque', [[A.west + 2, A.southL - 1.6], [-8, A.southL - 1.6]], 0.75, F({ prop: 'scanner' }));
  npcPed('Auditor de calidad', [[8, A.southL - 1.6], [A.offX0 - 1, A.southL - 1.6]], 0.4, { prop: 'clipboard' });
  npcPed('Auxiliar de preparación', [[-37, 27.5], [-29, 27.5], [-29, 41], [-37, 41]], 0.6, F({ prop: 'scanner' }));
  npcPed('Etiquetador', [[-37.5, -53], [-27, -53], [-27, -48.8], [-37.5, -48.8]], 0.2, { prop: 'scanner' });
  npcPed('Auxiliar de consolidación', [[-37, -61], [-27, -61]], 0.5, F({ prop: 'clipboard' }));
  npcPed('Supervisor de piso', [[A.west + 1.4, 40], [A.west + 1.4, -60]], 0.25, { prop: 'radio' });
  npcPed('Auxiliar de inventario cíclico', [[ax(1) - 3, A.cuts[0]], [ax(14) + 3, A.cuts[0]]], 0.3, F({ prop: 'scanner' }));
  npcPed('Montacarguista en relevo', [[ax(14) + 3, A.cuts[1] + 1], [ax(1) - 3, A.cuts[1] + 1]], 0.65, { prop: 'radio' });
  agvDeskWorkers(0); }
function agvDeskWorkers(n) { if (window.AGV_DESK_DONE) return; if (!(GLTF_AVATAR.gltf && GLTF_AVATAR.gltf.scene) || !window.AGV_DESKS) { if (n < 200) setTimeout(() => agvDeskWorkers(n + 1), 1500); return; } window.AGV_DESK_DONE = true;
  // Personal de RECIBO que se mueve: teclea en su computadora, camina a otra mesa o a la impresora de etiquetas, recoge la hoja y vuelve a operar
  const D = AGV_DESKS, laneZ = D[0].z + .62, PR = window.AGV_PRINTER, W = [], HF = window.AGV_HAND_FIX || { x: 0, y: Math.PI, z: 0 };
  const stations = D.map(d => ({ x: d.x, desk: true, busy: false })).concat(PR ? [{ x: PR.x, desk: false, busy: false }] : []);
  const bonesOf = av => { const L = []; av.obj.traverse(o => { if (o.isBone) L.push(o); }); return L; }, snap = L => L.map(b => [b.quaternion.clone(), b.position.clone()]), apply = (L, S) => L.forEach((b, i) => { b.quaternion.copy(S[i][0]); b.position.copy(S[i][1]); });
  D.forEach((d, i) => { try { const op = makeStandingOperator(QUALITY.preset.hiDist === 0); op.position.set(d.x, 0, laneZ); op.rotation.y = Math.PI; scene.add(op); op.updateMatrixWorld(true); const av = op.userData.gltf; if (!av) return;
      const hb = op.getObjectByName('Hips') || op.getObjectByName('mixamorigHips'); let hdx = 0, hdz = 0; if (hb) { const hp = hb.getWorldPosition(new THREE.Vector3()); hdx = d.x - hp.x; hdz = laneZ - hp.z; op.position.x += hdx; op.position.z += hdz; op.updateMatrixWorld(true); }
      const L = bonesOf(av), neutral = snap(L); const kb = new THREE.Vector3(d.x, 1.03, d.z + .18);
      ikReach(av, 'Right', kb.clone().add(new THREE.Vector3(-.12, 0, 0))); ikReach(av, 'Left', kb.clone().add(new THREE.Vector3(.12, 0, 0)));
      ['RightHand', 'LeftHand'].forEach(n => { const h = av.obj.getObjectByName(n); if (h) { h.rotateX(HF.x); h.rotateY(HF.y); h.rotateZ(HF.z); } });   // palmas hacia el teclado
      const type = snap(L), anim = ['RightHand', 'LeftHand', 'RightForeArm', 'LeftForeArm'].map(n => L.findIndex(b => b.name === n)).filter(k => k >= 0);
      stations[i].busy = true; W.push({ op, av, L, neutral, type, anim, hdx: -hdx, hdz, st: stations[i], state: 'type', t: 0, dur: 6 + Math.random() * 8 + i * 3, w: Math.random() * 6, ph: i * 1.7 }); } catch (e) { console.warn('[SIM] recibo:', e.message); } });
  let last = performance.now();
  const tick = () => { const now = performance.now(), dt = Math.min(.1, (now - last) / 1000); last = now; if (typeof SCENARIO !== 'undefined' && SCENARIO !== 'agave1') return;
    W.forEach(k => { k.t += dt;
      if (k.state === 'type' || k.state === 'pick') { if (k.state === 'type') { apply(k.L, k.type); k.anim.forEach((bi, j) => k.L[bi].rotateX(Math.sin(now * .022 + k.ph + j * 1.7) * (j < 2 ? .14 : .03) * (Math.sin(now * .0011 + k.ph) > -.3 ? 1 : 0))); } else apply(k.L, k.neutral);
        if (k.t > k.dur) { const free = stations.filter(s => !s.busy && s !== k.st); if (!free.length) { k.t = 0; return; } const nx = free[Math.floor(Math.random() * free.length)]; k.st.busy = false; nx.busy = true; k.st = nx; k.state = 'walk'; k.t = 0; apply(k.L, k.neutral); } return; }
      if (k.state === 'walk') { const tx = k.st.x - k.hdx, dx = tx - k.op.position.x, s = Math.sign(dx); k.op.rotation.y = s > 0 ? Math.PI / 2 : -Math.PI / 2; k.w += dt * 6.5;
        try { gltfWalkPose(k.av, true, k.w, now, false, 0); } catch (e) { }
        const step = 1.05 * dt; if (Math.abs(dx) <= step) { k.op.position.x = tx; k.op.rotation.y = Math.PI; k.state = k.st.desk ? 'type' : 'pick'; k.t = 0; k.dur = k.st.desk ? 9 + Math.random() * 10 : 3 + Math.random() * 2; } else k.op.position.x += s * step; } });
    requestAnimationFrame(tick); };
  requestAnimationFrame(tick); window.AGV_WORKERS = W; }

