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

// Rack ligero (estructura fusionada + tarimas instanciadas): mismo comportamiento que buildRack, sin las franjas de texto por nivel
function agvRack(x, zStart, bays, levels, facing, letter, sign) { const bayW = 2.8, depth = 2.4, levelH = 1.8, totalH = levelH * levels + 0.5, RM = rackMats(), g = new THREE.Group();
  const add = (geo, mat, px, py, pz) => { const m = new THREE.Mesh(geo, mat); m.position.set(px, py, pz); g.add(m); return m; };
  const post = new THREE.BoxGeometry(0.1, totalH, 0.11), beamG = new THREE.BoxGeometry(0.1, 0.14, bays * bayW), tie = new THREE.BoxGeometry(depth, 0.05, 0.05);
  for (let b = 0; b <= bays; b++) { const z = zStart + b * bayW; [-depth / 2, depth / 2].forEach(dx => add(post, RM.up, x + dx, totalH / 2, z)); for (let l = 0; l <= levels; l += 2) add(tie, RM.brace, x, 0.5 + l * levelH + .9, z);
    if (b === 0 || b === bays) add(new THREE.BoxGeometry(depth + 0.3, 0.16, 0.12), RM.guard, x, 0.4, z + (b === 0 ? -0.35 : 0.35)); }
  for (let l = 0; l <= levels; l++) { const y = 0.5 + l * levelH; [-depth / 2, depth / 2].forEach(dx => add(beamG, RM.beam, x + dx, y, zStart + bays * bayW / 2));
    if (l < levels) { const dk = add(new THREE.PlaneGeometry(depth + 0.1, bays * bayW), RM.wire, x, y + 0.075, zStart + bays * bayW / 2); dk.rotation.x = -Math.PI / 2;
      for (let b = 0; b < bays; b++) { const zc = zStart + b * bayW + bayW / 2; for (const pos of ['A', 'B']) { if (Math.random() < 0.3) continue; RACK_INST.push({ x: x + (pos === 'A' ? 0.6 : -0.6) * facing, y, z: zc, bh: 0.6 + Math.random() * 0.8, v: b % 3, facing, pos }); } } } }
  mergeStaticMeshes(g); g.traverse(o => { if (o.isMesh) { o.castShadow = false; o.receiveShadow = true; } }); scene.add(g);
  if (sign) { const sm = new THREE.Mesh(new THREE.PlaneGeometry(2.4, 0.9), new THREE.MeshBasicMaterial({ map: makeTextTexture([{ text: `RACK ${letter}`, size: 120 }], { w: 512, h: 200, bg: '#011131' }) })); sm.position.set(x, totalH + 0.6, zStart + bays * bayW / 2); sm.rotation.y = facing > 0 ? Math.PI / 2 : -Math.PI / 2; scene.add(sm); }
  obstacles.push({ minX: x - depth / 2 - 0.05, maxX: x + depth / 2 + 0.05, minZ: zStart - 0.2, maxZ: zStart + bays * bayW + 0.2 }); }   // margen lateral 5 cm: pasillo útil igual al del almacén genérico (3.0 m)

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
  { const ox0 = A.offX0 + .3, ox1 = A.offX1 - .3, oz0 = A.offZ0, oz1 = A.offZ1 - .3, oh = 3.6, glass = new THREE.MeshStandardMaterial({ color: 0x9fc3e8, transparent: true, opacity: .45, roughness: .1, metalness: .2 });
    const ow = (x0, z0, x1, z1) => { const L = Math.hypot(x1 - x0, z1 - z0), m = new THREE.Mesh(new THREE.BoxGeometry(L, oh, .2), wallMat); m.position.set((x0 + x1) / 2, oh / 2, (z0 + z1) / 2); m.rotation.y = -Math.atan2(z1 - z0, x1 - x0); scene.add(m); };
    ow(ox0, oz0, ox1, oz0); obstacles.push({ minX: ox0 - .3, maxX: ox1 + .3, minZ: oz0 - .5, maxZ: oz1 + .3 });
    for (let x = ox0 + 3; x < ox1 - 2; x += 5) { const w = new THREE.Mesh(new THREE.PlaneGeometry(3, 1.4), glass); w.position.set(x, 1.9, oz0 - .11); w.rotation.y = Math.PI; scene.add(w); }
    const tag = (t, x, w, col = '#ffffff', bg = '#1D2586') => { const m = new THREE.Mesh(new THREE.PlaneGeometry(w, .7), new THREE.MeshBasicMaterial({ map: makeTextTexture([{ text: t, size: 70, color: col }], { w: 1024, h: Math.round(1024 * .7 / w), bg }) })); m.position.set(x, 3.15, oz0 - .12); m.rotation.y = Math.PI; scene.add(m); };
    tag('OFICINAS · MESA DE CONTROL', ox0 + 12, 9); tag('ÁREA DE OFICINAS · 5 km/h', ox0 + 27, 8, '#f5c400', '#20242c');
    agvSign('sanMujeres', ox1 - 7, 2.2, oz0 - .13, Math.PI, .8); agvSign('sanHombres', ox1 - 5.8, 2.2, oz0 - .13, Math.PI, .8); agvSign('botiquin', ox0 + 4, 2.2, oz0 - .13, Math.PI); agvSign('extintor', ox0 + 6, 2.2, oz0 - .13, Math.PI); makeExtinguisher(ox0 + 6, oz0 - .35, Math.PI);
    const roof = new THREE.Mesh(new THREE.BoxGeometry(ox1 - ox0, .2, oz1 - oz0), new THREE.MeshStandardMaterial({ color: 0xb8bec8 })); roof.position.set((ox0 + ox1) / 2, oh, (oz0 + oz1) / 2); scene.add(roof); }
  // Andenes: cortinas, numeración P1–P41, topes y tráileres estacionados
  const doorMat = new THREE.MeshStandardMaterial({ color: 0xc9ced6, metalness: .35, roughness: .45 }), bump = new THREE.MeshStandardMaterial({ color: 0x16181c, roughness: .9 }), trailerMat = new THREE.MeshStandardMaterial({ color: 0xe8eaee, roughness: .7 }), cabMat = new THREE.MeshStandardMaterial({ color: 0x1D2586, roughness: .5 });
  const docks = [...A.docksN.map(d => ({ ...d, z: A.north, dir: -1 })), ...A.docksS.map(d => ({ ...d, z: d.x > A.offX1 ? A.southR : A.southL, dir: 1 }))];
  const tb = new THREE.InstancedMesh(new THREE.BoxGeometry(2.6, 3.9, 13.6), trailerMat, docks.length), tc = new THREE.InstancedMesh(new THREE.BoxGeometry(2.5, 3.2, 3.0), cabMat, docks.length), dm = new THREE.Object3D(); let nT = 0;
  docks.forEach((d, i) => { const zi = d.z - d.dir * .28, open = d.id === 'P6';
    if (!open) { const door = new THREE.Mesh(new THREE.PlaneGeometry(3, 3.4), doorMat); door.position.set(d.x, 1.7, zi); door.rotation.y = d.dir > 0 ? Math.PI : 0; scene.add(door); }
    [-1.45, 1.45].forEach(o => { const b = new THREE.Mesh(new THREE.BoxGeometry(.25, .45, .25), bump); b.position.set(d.x + o, 1.0, zi - d.dir * .12); scene.add(b); });
    const num = new THREE.Mesh(new THREE.PlaneGeometry(1.4, .6), new THREE.MeshBasicMaterial({ map: makeTextTexture([{ text: d.id, size: 110, color: '#ffffff' }], { w: 256, h: 110, bg: open ? '#c8102e' : '#011131' }) })); num.position.set(d.x, 3.9, zi - d.dir * .02); num.rotation.y = d.dir > 0 ? Math.PI : 0; scene.add(num);
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
  for (let k = 0; k <= 13; k++) { const x = k === 0 ? A.colX[0] - 3.95 : A.colX[k - 1] + 3.95; AISLES.push({ x, half: 1.55, label: 'PASILLO ' + (k + 1) });
    const s = new THREE.Mesh(new THREE.PlaneGeometry(2.6, .9), new THREE.MeshBasicMaterial({ map: makeTextTexture([{ text: 'PASILLO ' + (k + 1), size: 72, color: '#fff' }], { w: 512, h: 180, bg: '#c8102e' }), side: THREE.DoubleSide })); s.position.set(x, 9.5, A.Z(600)); scene.add(s); }
  // Racks zona poniente (3 filas)
  const wz0 = A.Z(275), wz1 = A.Z(535), lz0 = A.Z(320), lz1 = A.Z(545);
  [[-42.7, 1, wz0, wz1], [-37.3, -1, lz0, lz1], [-34.9, 1, lz0, lz1], [-29.5, -1, lz0, lz1]].forEach(([x, f, z0, z1], i) => { RACK_XS.push(x); agvSegments(z0, z1).forEach(([a, b], si) => agvRack(x, a, Math.floor((b - a) / 2.8), 5, f, 'W' + (i + 1), si === 1)); });
  AISLES.push({ x: -40.0, half: 1.5, label: 'PASILLO 15' }, { x: -32.2, half: 1.5, label: 'PASILLO 16' });
  flushRackInstances();
  // Pasillos transversales (franjas naranjas del plano)
  A.cuts.forEach(cz => { const m = new THREE.Mesh(new THREE.PlaneGeometry(A.colX[12] - A.colX[0] + 6, A.cutW - .6), new THREE.MeshBasicMaterial({ color: 0xff7a1a, transparent: true, opacity: .28, depthWrite: false })); m.rotation.x = -Math.PI / 2; m.position.set((A.colX[0] + A.colX[12]) / 2, .011, cz); scene.add(m); });
  // Zonas operativas del plano
  agvZone(-15, -60, 12, -38, 0xf5c400, .18); agvFloorLabel('STAGE IN · RECIBO', -1.5, -49, 20, 3);
  agvZone(-15, 12, 12, 33, 0xf5c400, .18); agvFloorLabel('STAGE OUT · EMBARQUE', -1.5, 22, 20, 3);
  agvZone(-38, -62, -26, -53.6, 0xff7a1a, .45); agvFloorLabel('PREPARACIÓN Y CONSOLIDACIÓN', -32, -57.8, 11.5, 1.6, '#011131');
  agvZone(-38, -52.5, -26, -48.5, 0xff7a1a, .3); agvFloorLabel('ETIQUETADO', -29, -50.5, 5, 1.2, '#011131'); agvBox(2.2, 1.4, 1.6, 0x5b6577, -35.5, .7, -50.5, { metalness: .4 }); agvFloorLabel('ETIQUETADORA', -35.5, -48.9, 3.6, .8, '#ffffff', '#1D2586');
  agvZone(-38, 26.5, -28.6, 41.9, 0xff7a1a, .45); agvFloorLabel('PREPARACIÓN LIVERPOOL', -33.3, 34, 9, 1.5, '#011131', 'rgba(0,0,0,0)', Math.PI / 2);
  agvZone(-18, 5, -12, 11, 0x1d4fd8, .35); agvFloorLabel('ESTACIONAMIENTO DE EQUIPOS', -15, 8, 5.6, 1.2, '#ffffff');
  // Cruce peatonal frente al andén de prácticas (alto en Z 36.5, zona verde hasta Z 40.5)
  { const g = new THREE.Mesh(new THREE.PlaneGeometry(14, 4), new THREE.MeshBasicMaterial({ color: 0x2e9e5b, transparent: true, opacity: .55, depthWrite: false })); g.rotation.x = -Math.PI / 2; g.position.set(0, .013, 38.5); scene.add(g);
    for (let x = -6.5; x <= 6.5; x += 1.3) paintLine(x, 37, x, 40, 0xffffff, .5); paintLine(-7, 36.4, 7, 36.4, 0xffffff, .3); agvFloorLabel('ALTO', 0, 35.2, 3, 1, '#ffffff'); }
  // Pasillo peatonal perimetral (franja verde) frente a andenes norte y sur
  [[A.west + 1, A.north + 1.6, A.east - 1, A.north + 1.6], [A.west + 1, A.southL - 1.6, -7.5, A.southL - 1.6], [7.5, A.southL - 1.6, A.offX0 - .5, A.southL - 1.6]].forEach(([x0, z0, x1, z1]) => { paintLine(x0, z0 - .6, x1, z1 - .6, 0x2e9e5b, .15); paintLine(x0, z0 + .6, x1, z1 + .6, 0x2e9e5b, .15); });
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
  const lampG = new THREE.CylinderGeometry(.6, .9, .4, 12), lampM = new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0xfff1c0, emissiveIntensity: 1.2 }); const nL = Math.ceil((A.east - A.west) / 20) * Math.ceil((A.offZ1 - A.north) / 18); const lamps = new THREE.InstancedMesh(lampG, lampM, nL); let li = 0;
  for (let x = A.west + 10; x < A.east; x += 20) for (let z = A.north + 9; z < A.southL; z += 18) { if (li >= nL) break; dm.position.set(x, H - .4, z); dm.updateMatrix(); lamps.setMatrixAt(li++, dm.matrix); } lamps.count = li; scene.add(lamps);
  // Logo DICKA en el muro norte
  { const m = new THREE.Mesh(new THREE.PlaneGeometry(14, 3), new THREE.MeshBasicMaterial({ map: makeTextTexture([{ text: 'DICKA LOGISTICS · AGAVE 1 · PROYECTO NAOS', size: 70, color: '#ffffff' }], { w: 1400, h: 300, bg: '#1D2586' }) })); m.position.set(50, 8.5, A.north + .3); scene.add(m); }
  // Techo de lámina a 12 m (se oculta al ver desde arriba)
  { const roof = new THREE.Mesh(new THREE.PlaneGeometry(A.east - A.west, A.offZ1 - A.north), new THREE.MeshStandardMaterial({ color: 0x9aa3b2, side: THREE.DoubleSide, roughness: .7, metalness: .3 })); roof.rotation.x = Math.PI / 2; roof.position.set((A.west + A.east) / 2, H, (A.north + A.offZ1) / 2); roof.name = 'roof'; window.roofMesh = roof; scene.add(roof);
    const sky = new THREE.MeshStandardMaterial({ color: 0xe9f3ff, emissive: 0xdcecff, emissiveIntensity: .7, side: THREE.DoubleSide }); for (let z = A.north + 12; z < A.southL - 6; z += 22) { const sk = new THREE.Mesh(new THREE.PlaneGeometry(A.east - A.west - 8, 1.6), sky); sk.rotation.x = Math.PI / 2; sk.position.set((A.west + A.east) / 2, H - .02, z); scene.add(sk); } }
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
  npcPed('Auxiliar de embarque', [[A.west + 2, A.southL - 1.6], [-8, A.southL - 1.6]], 0.2, { prop: 'scanner' });
  npcPed('Verificador de recibo', [[A.west + 2, A.north + 1.6], [A.east - 2, A.north + 1.6]], 0.45, { prop: 'clipboard' });
  npcPed('Supervisor de turno', [[A.east - 2, A.north + 1.6], [A.west + 2, A.north + 1.6]], 0.7, fem ? { fem: true, prop: 'radio' } : { prop: 'radio' });
  npcPed('Auxiliar de preparación', [[-31, 27.5], [-31, 41]], 0.35, fem ? { fem: true, prop: 'scanner' } : { prop: 'scanner' });
  npcPed('Auxiliar de inventario', [[A.west + 1.4, -60], [A.west + 1.4, 40]], 0.55, { prop: 'scanner' }); }
