// Avatares 3D DICKA compartidos (simulador de montacargas, Dojo de Mando): carga de modelos Mixamo, uniforme, casco, guantes, botas, gafete y poses procedurales.
// ================== NIVEL C · AVATAR glTF RIGGEADO (opcional) ==================
// Si existe assets/models/operario.glb (Mixamo, con clips walk/idle y opcionalmente wave/sit), los peatones lo usan.
// Si no está disponible, se mantiene el avatar procedural v5. El modelo se carga una vez y se clona por personaje (SkeletonUtils).
const GLTF_SEAT = { y: 0.83, z: -1.45 };   // posición del modelo realista sentado respecto al equipo (pies a la altura del piso de la cabina)
// ================== CALIDAD GRÁFICA ==================
// Auto detecta GPU integrada o móvil → Media. Alta: PC con tarjeta dedicada. Baja: laptops lentas.
const QUALITY_PRESETS = { alta: { dpr: 1.0, shadow: 1536, hiDist: 18, shadows: true, label: 'Alta' }, media: { dpr: 0.85, shadow: 1024, hiDist: 8, shadows: true, label: 'Media' }, baja: { dpr: 0.7, shadow: 768, hiDist: 0, shadows: false, label: 'Baja' } };
function detectQuality() { try { const c = document.createElement('canvas'); const gl = c.getContext('webgl'); const ext = gl && gl.getExtension('WEBGL_debug_renderer_info'); const r = ext ? gl.getParameter(ext.UNMASKED_RENDERER_WEBGL) : ''; if (/Mali|Adreno|Apple GPU|PowerVR/i.test(r) || /Android|iPhone|iPad/i.test(navigator.userAgent)) return 'baja'; if (/Intel|UHD|Iris|HD Graphics/i.test(r)) return 'media'; } catch (e) {} return 'alta'; }
const QUALITY = { mode: localStorage.getItem('dicka_quality') || 'auto' }; QUALITY.preset = QUALITY_PRESETS[QUALITY.mode === 'auto' ? detectQuality() : QUALITY.mode] || QUALITY_PRESETS.media;
// Resolución adaptativa (solo modo Auto): mide el tiempo por cuadro cada 2 s; si va lento baja la resolución hasta 60 %,
// si sigue lento baja un preset (Alta → Media → Baja); si sobra margen la recupera poco a poco.
const QADAPT = { t: 0, n: 0, acc: 0, scale: 1 };
function qualityAdapt() {
    if (QUALITY.mode !== 'auto' || typeof renderer === 'undefined' || !renderer || (XR.active && renderer.xr.isPresenting) || (typeof MVR !== 'undefined' && MVR.on)) return;
    const now = performance.now(), dt = now - QADAPT.t; QADAPT.t = now; if (dt > 250) return;   // pestaña oculta o pausa: no cuenta
    QADAPT.acc += dt; QADAPT.n++; if (QADAPT.acc < 2000) return;
    const ms = QADAPT.acc / QADAPT.n; QADAPT.acc = 0; QADAPT.n = 0;
    if (ms > 30 && QADAPT.scale <= 0.6 && QUALITY.preset !== QUALITY_PRESETS.baja) {
        QUALITY.preset = QUALITY.preset === QUALITY_PRESETS.alta ? QUALITY_PRESETS.media : QUALITY_PRESETS.baja; applyQuality();
        toast('🎚️ Rendimiento bajo: calidad Auto · ' + QUALITY.preset.label); return;
    }
    let sc = QADAPT.scale; if (ms > 24) sc = Math.max(0.6, sc - 0.1); else if (ms < 18) sc = Math.min(1, sc + 0.05);
    if (sc !== QADAPT.scale) { QADAPT.scale = sc; renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, QUALITY.preset.dpr) * sc); }
}
function applyQuality() { const q = QUALITY.preset; if (typeof renderer !== 'undefined' && renderer) { QADAPT.scale = 1; renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, q.dpr)); renderer.shadowMap.enabled = q.shadows; if (window.sunLight) { window.sunLight.castShadow = q.shadows; window.sunLight.shadow.mapSize.set(q.shadow, q.shadow); if (window.sunLight.shadow.map) { window.sunLight.shadow.map.dispose(); window.sunLight.shadow.map = null; } } window.dispatchEvent(new Event('resize')); } const lbl = document.getElementById('qualityLbl'); if (lbl) lbl.textContent = (QUALITY.mode === 'auto' ? 'Auto · ' : '') + q.label; }
function setQuality(m) { QUALITY.mode = m; localStorage.setItem('dicka_quality', m); QUALITY.preset = QUALITY_PRESETS[m === 'auto' ? detectQuality() : m] || QUALITY_PRESETS.media; applyQuality(); toast('🎚️ Calidad gráfica: ' + ((QUALITY.mode === 'auto' ? 'Auto · ' : '') + QUALITY.preset.label)); }
const GLTF_LOD = { gltf: null, tried: false };
// ====== Chaleco DICKA: recolorea el chaleco naranja de la textura del operario a azul DICKA (#1769AA) y estampa el logotipo blanco ======
// La zona del chaleco en el atlas (Operador_DICKA_BaseColor) ocupa la esquina inferior izquierda; sólo se cambian píxeles naranja (las cintas reflejantes se conservan).
const VEST_UV = { x0: 0.0, x1: 0.47, y0: 0.66, y1: 1.0 }, VEST_LOGOS = [[0.232, 0.765, 0.13], [0.232, 0.93, 0.15]];   // [u, v, ancho] en fracción del atlas
let SKIN_IMG = null;
// Guantes de trabajo amarillos (NOM-017-STPS-2008) pintados sobre la malla de la mano: siguen dedos y muñeca porque usan los pesos de los huesos
// Casco ABS (NOM-115-STPS): plástico amarillo brillante con granulado, raspones y calcomanía DICKA al frente (proyectada, no depende de las UV del modelo)

// Puño elástico 3D en la muñeca: tubo tejido amarillo acanalado con orilla negra, que sobresale de la mano (da borde real al guante)
let CUFF_MAT = null, GLOVE_UNIT = 1;   // GLOVE_UNIT: unidades del modelo por metro (operaria.glb viene en cm)
function gloveCuffs(mesh) { if (!CUFF_MAT) { const c = document.createElement('canvas'); c.width = 128; c.height = 64; const g = c.getContext('2d'); for (let x = 0; x < 128; x += 4) { g.fillStyle = x % 8 ? '#e2ad16' : '#b9870c'; g.fillRect(x, 0, 4, 64); } for (let i = 0; i < 300; i++) { g.fillStyle = `rgba(255,240,180,${Math.random() * .25})`; g.fillRect(Math.random() * 128, Math.random() * 64, 1.5, 1.5); }
        g.fillStyle = '#111'; g.fillRect(0, 56, 128, 8); const t = new THREE.CanvasTexture(c); t.encoding = THREE.sRGBEncoding; t.wrapS = THREE.RepeatWrapping; t.repeat.set(3, 1); CUFF_MAT = new THREE.MeshStandardMaterial({ map: t, roughness: .95, side: THREE.DoubleSide }); }
    mesh.updateMatrixWorld(true); const U = GLOVE_UNIT; mesh.skeleton.bones.forEach(b => { if (!/(Left|Right)Hand$/.test(b.name) || b.getObjectByName('gloveCuff')) return; const ws = new THREE.Vector3(); b.getWorldScale(ws); ws.divideScalar(U);
        const cuff = new THREE.Mesh(new THREE.CylinderGeometry(0.041, 0.039, 0.065, 20, 1, true), CUFF_MAT); cuff.name = 'gloveCuff'; cuff.scale.set(1 / ws.x, 1 / ws.y, (1 / ws.z) * 0.78); cuff.position.y = -0.012 / ws.y; cuff.castShadow = false; b.add(cuff);
        const rim = new THREE.Mesh(new THREE.TorusGeometry(0.04, 0.004, 6, 20), new THREE.MeshStandardMaterial({ color: 0x111111, roughness: .9 })); rim.rotation.x = Math.PI / 2; rim.position.y = -0.0325; cuff.add(rim); }); }
function workGloves(scene) { scene.traverse(o => { if (!o.isSkinnedMesh || !o.skeleton || !o.geometry.attributes.skinIndex || o.geometry.attributes.aGlove) return;
        const B = o.skeleton.bones, si = o.geometry.attributes.skinIndex, sw = o.geometry.attributes.skinWeight, n = si.count;
        const W = re => { const hb = B.map(b => re.test(b.name) ? 1 : 0); const a = new Float32Array(n); for (let i = 0; i < n; i++) a[i] = hb[si.getX(i)] * sw.getX(i) + hb[si.getY(i)] * sw.getY(i) + hb[si.getZ(i)] * sw.getZ(i) + hb[si.getW(i)] * sw.getW(i); return a; };
        if (!B.some(b => /Hand/i.test(b.name))) return; const gw = W(/Hand/i);
        let mx = 0; for (let i = 0; i < n; i++) if (gw[i] > mx) mx = gw[i]; const m = o.material; if (mx < 0.5 || !m || Array.isArray(m) || !m.map) return;   // solo la malla que contiene las manos (con textura); el casco y otras piezas no se tocan
        const tip = W(/Hand(Thumb|Index|Middle|Ring|Pinky)[34]$/i), kn = W(/Hand(Index|Middle|Ring|Pinky)1$/i);   // puntas de dedos y nudillos (refuerzos negros)
        o.geometry.setAttribute('aGlove', new THREE.BufferAttribute(gw, 1)); gloveCuffs(o); o.geometry.setAttribute('aTip', new THREE.BufferAttribute(tip, 1)); o.geometry.setAttribute('aKn', new THREE.BufferAttribute(kn, 1)); if (m.userData.glove) return; m.userData.glove = true; const prev = m.onBeforeCompile;
        // Guante tipo mecánico (referencia "gription"): dorso sintético amarillo, palma negra con puntos de silicón, puntas y nudillos negros, puño negro con ajuste y ribete amarillo
        m.onBeforeCompile = (sh, r) => { if (prev) prev(sh, r); sh.vertexShader = 'attribute float aGlove;\nattribute float aTip;\nattribute float aKn;\nvarying float vGlove;\nvarying float vPalm;\nvarying float vTip;\nvarying float vKn;\n' + sh.vertexShader.replace('#include <begin_vertex>', '#include <begin_vertex>\n transformed += normalize(objectNormal) * smoothstep(0.003, 0.05, aGlove) * ' + (0.0045 * GLOVE_UNIT).toFixed(5) + ';   // grosor del tejido: el guante queda por encima de la piel\n vGlove = aGlove; vTip = aTip; vKn = aKn; vPalm = smoothstep(-0.1, -0.5, normalize(objectNormal).y);');
            sh.fragmentShader = 'varying float vGlove;\nvarying float vPalm;\nvarying float vTip;\nvarying float vKn;\n' + sh.fragmentShader.replace('#include <map_fragment>', `#include <map_fragment>
            float gk = smoothstep(0.003, 0.03, vGlove); if (gk > 0.0) {
              // Guante tejido amarillo (referencia DICKA): punto de algodón jaspeado, palma con chevrones de PVC negro, puño acanalado con orilla negra
              vec2 gu = vUv * vec2(1500.0, 2600.0); float rib = abs(sin(gu.x)); float loopv = abs(sin(gu.y + (sin(gu.x * 0.5) > 0.0 ? 1.57 : 0.0))); float knit = 0.70 + 0.30 * rib * (0.55 + 0.45 * loopv);
              float hz = fract(sin(dot(floor(vUv * vec2(260.0, 90.0)), vec2(12.9898, 78.233))) * 43758.5453);   // jaspeado del hilo
              vec3 blue = mix(vec3(0.78, 0.55, 0.03), vec3(0.95, 0.72, 0.08), hz) * knit;   // hilo amarillo jaspeado
              vec2 cv = vUv * vec2(520.0, 340.0); vec2 cc = fract(cv) - 0.5; float vy = abs(cc.x) * 0.9 - cc.y * 0.9;   // chevrón en "Y": dos brazos y un tallo
              float arms = (1.0 - smoothstep(0.06, 0.11, abs(vy - 0.05))) * step(abs(cc.x), 0.42); float stem = (1.0 - smoothstep(0.05, 0.09, abs(cc.x))) * step(cc.y, 0.0) * step(-0.38, cc.y);
              float pvc = clamp(arms + stem, 0.0, 1.0) * vPalm * smoothstep(0.3, 0.55, vGlove + vTip);
              vec3 col = mix(blue, vec3(0.03, 0.03, 0.035), pvc);
              float cuffRib = 1.0 - smoothstep(0.16, 0.3, vGlove); col *= mix(1.0, 0.85 + 0.15 * abs(sin(vUv.x * 2600.0)), cuffRib);   // puño acanalado
              float edge = 1.0 - smoothstep(0.012, 0.045, vGlove); col = mix(col, vec3(0.04, 0.04, 0.05), edge);   // orilla negra (overlock)
              diffuseColor.rgb = mix(diffuseColor.rgb, col, gk); }`).replace('#include <roughnessmap_fragment>', '#include <roughnessmap_fragment>\n roughnessFactor = mix(roughnessFactor, 0.95, smoothstep(0.003, 0.03, vGlove));'); };
        { const pk = m.customProgramCacheKey; m.customProgramCacheKey = () => (pk ? pk.call(m) : '') + '-glove'; } m.needsUpdate = true; }); }

function loadOperarioLod() { if (GLTF_LOD.tried || !THREE.GLTFLoader) return; GLTF_LOD.tried = true; const urls = GLTF_AVATAR.urls.map(u => u.replace('operario.glb', 'operario_lod.glb')); const tryUrl = i => { if (i >= urls.length) return; new THREE.GLTFLoader().load(urls[i], g => { hardHat(g.scene); workGloves(g.scene); dickaVest(g.scene); GLTF_LOD.gltf = g; console.log('[SIM] Avatar glTF ligero cargado'); }, undefined, () => tryUrl(i + 1)); }; tryUrl(0); }
const GLTF_AVATAR = { url: 'assets/models/operario.glb', urls: ['assets/models/operario.glb', 'juegos/assets/models/operario.glb', '/juegos/assets/models/operario.glb', '/assets/models/operario.glb'], gltf: null, tried: false, clips: {}, scale: 1, ok: false };
function loadOperarioModel() { return new Promise(res => { if (GLTF_AVATAR.tried || !THREE.GLTFLoader) { res(GLTF_AVATAR.ok); return; } GLTF_AVATAR.tried = true; if (location.protocol === 'file:' && !/\/juegos\//.test(location.pathname)) { res(false); return; }
    const tryUrl = (i) => { if (i >= GLTF_AVATAR.urls.length) { console.info('[SIM] Sin operario.glb en ninguna ruta: se usa el avatar procedural v5'); res(false); return; } new THREE.GLTFLoader().load(GLTF_AVATAR.urls[i], g => onLoad0(g), undefined, () => tryUrl(i + 1)); };
    loadOperarioLod();
    const onLoad0 = g => { hardHat(g.scene); workGloves(g.scene); dickaVest(g.scene).then(() => onLoad(g)); };
    const onLoad = g => { GLTF_AVATAR.gltf = g; g.scene.updateMatrixWorld(true); let h = 0; let headB = null, footB = null; g.scene.traverse(o => { if (o.isBone) { if (/Head$/i.test(o.name) && !/End/i.test(o.name)) headB = o; if (/(LeftFoot|RightFoot|LeftToeBase)$/i.test(o.name) && !footB) footB = o; } }); if (headB) { const hp = new THREE.Vector3(); headB.getWorldPosition(hp); const fp = new THREE.Vector3(); if (footB) footB.getWorldPosition(fp); h = (hp.y - Math.min(fp.y, 0)) + 0.13; }   // altura por huesos: la caja de un SkinnedMesh no considera la escala de la armadura
        if (!(h > 0.2)) { const box = new THREE.Box3().setFromObject(g.scene); h = box.max.y - box.min.y || 1.8; } GLTF_AVATAR.scale = 1.74 / h; { let sc = 1; g.scene.traverse(o => { if (o.isSkinnedMesh && sc === 1) { const v = new THREE.Vector3(); o.getWorldScale(v); sc = v.x || 1; } }); GLTF_AVATAR.rigScale = sc / GLTF_AVATAR.scale; }
        g.animations.forEach(c => { const n = c.name.toLowerCase(); if (/walk/.test(n)) GLTF_AVATAR.clips.walk = c; else if (/idle|stand/.test(n)) GLTF_AVATAR.clips.idle = c; else if (/wave/.test(n)) GLTF_AVATAR.clips.wave = c; else if (/sit|seat|driv/.test(n)) GLTF_AVATAR.clips.sit = c; });
        if (!GLTF_AVATAR.clips.walk && !GLTF_AVATAR.clips.sit && g.animations.length) GLTF_AVATAR.clips.sit = g.animations[0];   // un solo clip sin nombre reconocible → se asume pose de conducción (operador a bordo)
        GLTF_AVATAR.ok = g.animations.length > 0 || g.scene.children.length > 0; console.log('[SIM] Avatar glTF cargado:', Object.keys(GLTF_AVATAR.clips), 'altura', h.toFixed(2)); if (GLTF_AVATAR.ok && typeof forklift !== 'undefined' && forklift) { try { buildPlayerOperator(); const jg = forklift.getObjectByName('cabinJoystick'); if (jg) jg.userData.snapped = true; } catch (e) { console.warn('[SIM] operador glTF:', e.message); } } res(GLTF_AVATAR.ok); };
    tryUrl(0); }); }
// ====== Equipo de protección y detalles del operario DICKA: gafete con logotipo y radio ======
// Las piezas se anclan a los huesos (siguen la animación). Se calculan en espacio del avatar (frente = +Z) y se convierten al espacio local del hueso.
const GEAR = {};

function addAvatarGear(root) { const M = gearMats(); root.updateMatrixWorld(true); const find = re => { let b = null; root.traverse(o => { if (!b && o.isBone && re.test(o.name)) b = o; }); return b; };
    const head = find(/Head$/), chest = find(/Spine2$/), hips = find(/Hips$/) || find(/Spine$/); if (!head || !chest) return;
    const rootQ = new THREE.Quaternion(); root.getWorldQuaternion(rootQ);
    const attach = (bone, mesh, off, rx) => { const bp = new THREE.Vector3(); bone.getWorldPosition(bp);   // el clon está en el origen sin padre: espacio mundo = espacio del avatar en metros
        mesh.position.copy(bone.worldToLocal(new THREE.Vector3(bp.x + off[0], bp.y + off[1], bp.z + off[2])));
        const bq = new THREE.Quaternion(); bone.getWorldQuaternion(bq); mesh.quaternion.copy(bq.invert().multiply(rootQ)); if (rx) mesh.rotateX(rx);
        const ws = new THREE.Vector3(); bone.getWorldScale(ws); mesh.scale.setScalar(1 / ws.x); mesh.castShadow = false; bone.add(mesh); };
    attach(chest, new THREE.Mesh(new THREE.BoxGeometry(0.055, 0.082, 0.004), M.badge), [0.075, -0.03, 0.165]);   // gafete al pecho
    if (hips) attach(hips, new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.11, 0.03), M.radio), [-0.17, 0.02, 0.03]);       // radio en la cintura
    let modelBoots = false; root.traverse(o => { if (o.isMesh && /Boots/i.test(o.name)) { modelBoots = true; if (!o.userData.safety) { o.userData.safety = true; const m = o.material.clone(); m.onBeforeCompile = o.material.onBeforeCompile; m.customProgramCacheKey = o.material.customProgramCacheKey; m.skinning = true; m.color = new THREE.Color(0x1c1a18); m.roughness = 0.6; o.material = m; } } });   // operario: sus botas de trabajo pasan a piel negra
    if (!modelBoots) safetyBoots(root, find, attach); else safetyBoots(root, find, attach, true);
}
// Botas de seguridad con casquillo (NOM-113-STPS-2009): piel negra, caña alta, suela antiderrapante y puntera reforzada; van montadas en los huesos de pie y espinilla
const BOOT_MATS = {};
function safetyBoots(root, find, attach, capOnly) { if (!BOOT_MATS.leather) { BOOT_MATS.leather = new THREE.MeshStandardMaterial({ color: 0x060504, roughness: .7, metalness: .05 }); BOOT_MATS.sole = new THREE.MeshStandardMaterial({ color: 0x0c0c0c, roughness: .95 }); BOOT_MATS.cap = new THREE.MeshStandardMaterial({ color: 0x14110e, roughness: .38, metalness: .1 }); BOOT_MATS.welt = new THREE.MeshStandardMaterial({ color: 0xc9a227, roughness: .7 }); BOOT_MATS.lace = new THREE.MeshStandardMaterial({ color: 0x2a2a2a, roughness: .8 }); }
    ['Left', 'Right'].forEach(sd => { const foot = find(new RegExp(sd + 'Foot$')), toe = find(new RegExp(sd + 'ToeBase$')), shin = find(new RegExp(sd + 'Leg$')); if (!foot || !toe) return;
        const a = foot.getWorldPosition(new THREE.Vector3()), t = toe.getWorldPosition(new THREE.Vector3()); const fwd = t.clone().sub(a); fwd.y = 0; const reach = fwd.length(); if (reach < 0.03) return; fwd.normalize();
        const tip = t.clone().addScaledVector(fwd, reach * 0.55), heel = a.clone().addScaledVector(fwd, -0.035); const len = tip.clone().sub(heel).length(), mid = tip.clone().add(heel).multiplyScalar(0.5); const yaw = Math.atan2(fwd.x, fwd.z);
        const put = (geo, mat, p, rx) => { const m = new THREE.Mesh(geo, mat); attach(foot, m, [p.x - a.x, p.y - a.y, p.z - a.z]); m.rotateY(yaw); if (rx) m.rotateX(rx); m.name = 'safetyBoot'; return m; };
        const sh = Math.max(0.06, a.y * 0.95);
        if (capOnly) { const cap = put(new THREE.SphereGeometry(0.056, 16, 10, 0, Math.PI * 2, 0, Math.PI / 2), BOOT_MATS.cap, new THREE.Vector3(tip.x - fwd.x * 0.06, 0.03, tip.z - fwd.z * 0.06)); cap.scale.multiply(new THREE.Vector3(1.0, 0.8, 1.2)); return; }   // casquillo sobre la bota del modelo
        put(new THREE.BoxGeometry(0.098, 0.026, len), BOOT_MATS.sole, new THREE.Vector3(mid.x, 0.015, mid.z));                       // suela antiderrapante
                        const cap = put(new THREE.SphereGeometry(0.05, 16, 10, 0, Math.PI * 2, 0, Math.PI / 2), BOOT_MATS.cap, new THREE.Vector3(tip.x - fwd.x * 0.045, 0.026, tip.z - fwd.z * 0.045)); cap.scale.multiply(new THREE.Vector3(0.98, 0.95, 1.1));   // casquillo de acero
        if (shin) { const c = new THREE.Mesh(new THREE.CylinderGeometry(0.056, 0.052, 0.15, 14), BOOT_MATS.leather); c.name = 'safetyBoot'; attach(shin, c, [a.x - shin.getWorldPosition(new THREE.Vector3()).x, a.y + 0.07 - shin.getWorldPosition(new THREE.Vector3()).y, a.z - shin.getWorldPosition(new THREE.Vector3()).z]);
            const collar = new THREE.Mesh(new THREE.TorusGeometry(0.055, 0.01, 8, 18), BOOT_MATS.leather); collar.name = 'safetyBoot'; attach(shin, collar, [a.x - shin.getWorldPosition(new THREE.Vector3()).x, a.y + 0.145 - shin.getWorldPosition(new THREE.Vector3()).y, a.z - shin.getWorldPosition(new THREE.Vector3()).z], Math.PI / 2); } });   // caña alta acolchada
}
// ====== Operarias (assets/models/operaria.glb · Mixamo Ch02): uniforme DICKA pintado por huesos sobre su ropa ======
// pantalón de mezclilla en piernas (cubre short y piel), camisa azul marino en brazos/torso, chaleco azul con bandas reflejantes, casco ABS y guantes
const GLTF_FEM = { gltf: null, scale: 1, rigScale: 1, tried: false };
// modelos adicionales (Mixamo) para que el personal no se vea igual: mismo proceso y uniforme que la operaria
// operaria3.glb (191 mallas por persona) queda fuera del personal hasta optimizarla: frenaba el simulador
const GLTF_EXTRA = [{ file: 'operario2.glb', fem: false }, { file: 'operario3.glb', fem: false }, { file: 'operaria2.glb', fem: true }].map(x => Object.assign({ gltf: null, scale: 1, rigScale: 1, tried: false }, x));
function loadExtraAvatars() { return Promise.all(GLTF_EXTRA.map(T => loadOperaria(T).catch(() => false))); }
function pickAvatar(fem) { const pool = GLTF_EXTRA.filter(T => T.gltf && T.fem === !!fem); if (fem && GLTF_FEM.gltf) pool.push(GLTF_FEM); if (!fem) pool.push(null); const T = pool[Math.floor(Math.random() * pool.length)]; return T ? makeFemAvatar(T) : makeGLTFAvatar(false, false); }
function loadOperaria(T = GLTF_FEM) { if (T.tried || !THREE.GLTFLoader) return Promise.resolve(false); T.tried = true; const file = T.file || 'operaria.glb';
    return new Promise(res => { const urls = GLTF_AVATAR.urls.map(u => u.replace('operario.glb', file)); const tryUrl = i => { if (i >= urls.length) { res(false); return; }
        new THREE.GLTFLoader().load(urls[i], g => { try { g.scene.traverse(o => { if (o.isBone) o.name = o.name.replace(/^mixamorig\d*:?/, '').replace(/_\d+$/, ''); });
            { let main = null; g.scene.traverse(o => { if (o.isSkinnedMesh && /Body/.test(o.name)) main = o; }); if (!main) g.scene.traverse(o => { if (o.isSkinnedMesh && (!main || o.skeleton.bones.length > main.skeleton.bones.length)) main = o; }); const by = {}; main.skeleton.bones.forEach(b => by[b.name] = b); const keep = new Set(main.skeleton.bones);   // un solo esqueleto: el FBX trae una copia por malla
              const PAR = { Spine2: 'Spine1', Neck: 'Spine2', Head: 'Neck', HeadTop_End: 'Head', LeftShoulder: 'Spine2', RightShoulder: 'Spine2', LeftArm: 'LeftShoulder', RightArm: 'RightShoulder', LeftUpLeg: 'Hips', RightUpLeg: 'Hips', LeftLeg: 'LeftUpLeg', RightLeg: 'RightUpLeg', LeftFoot: 'LeftLeg', RightFoot: 'RightLeg', LeftToeBase: 'LeftFoot', RightToeBase: 'RightFoot', LeftToe_End: 'LeftToeBase', RightToe_End: 'RightToeBase' };
              g.scene.updateMatrixWorld(true); main.skeleton.bones.forEach(b => { if (b.parent && b.parent.isBone) return; const pn = PAR[b.name]; if (pn && by[pn]) by[pn].attach(b); });   // reconectar huesos que quedaron colgando de copias del FBX (pies, cuello, hombros)
              g.scene.traverse(o => { if (o.isSkinnedMesh && o !== main) o.bind(new THREE.Skeleton(o.skeleton.bones.map(b => by[b.name] || b), o.skeleton.boneInverses), o.bindMatrix); });
              const orphans = []; g.scene.traverse(o => { if (o.isBone && !keep.has(o) && !(o.parent && o.parent.isBone)) orphans.push(o); }); orphans.forEach(o => o.parent.remove(o)); }
            g.scene.updateMatrixWorld(true); let hb = null, fb = null; g.scene.traverse(o => { if (o.isBone) { if (/Head$/.test(o.name)) hb = o; if (/LeftFoot$/.test(o.name)) fb = o; } });
            const hp = new THREE.Vector3(), fp = new THREE.Vector3(); hb.getWorldPosition(hp); fb.getWorldPosition(fp); const unit = (hp.y - Math.min(fp.y, 0)) / 1.55;   // unidades por metro (cabeza a 1.55 m)
            T.scale = 1 / unit * (T.fem === false ? 1.03 : 0.97); if (!T.ownOutfit) { femaleOutfit(g.scene, unit); GLOVE_UNIT = unit; workGloves(g.scene); GLOVE_UNIT = 1; }   // ownOutfit: el modelo ya trae uniforme, casco y guantes
            let sc = 1, hb0 = null; g.scene.traverse(o => { if (o.isBone && /Hips$/.test(o.name) && !hb0) hb0 = o; }); if (hb0) { const v = new THREE.Vector3(); hb0.getWorldScale(v); sc = v.x || 1; } else g.scene.traverse(o => { if (o.isSkinnedMesh && sc === 1) { const v = new THREE.Vector3(); o.getWorldScale(v); sc = v.x || 1; } }); T.rigScale = sc / T.scale; /* escala del esqueleto desde la cadera: algunas mallas traen escala propia en su nodo */ T.gltf = g; console.log('[SIM] modelo cargado:', file); res(true); } catch (e) { console.warn('[SIM] operaria:', e.message); res(false); } }, undefined, () => tryUrl(i + 1)); }; tryUrl(0); }); }
function femaleOutfit(scene, U) { const C = h => new THREE.Color(h).convertSRGBToLinear(); let headBone = null;
    scene.traverse(o => { if (o.isBone && /Head$/.test(o.name)) headBone = o; if (!o.isSkinnedMesh || !o.material || /Hair|Eyelash/i.test(o.name)) return;
        const B = o.skeleton.bones, si = o.geometry.attributes.skinIndex, sw = o.geometry.attributes.skinWeight, n = si.count;
        const W = re => { const hb = B.map(b => re.test(b.name) ? 1 : 0); const a = new Float32Array(n); for (let i = 0; i < n; i++) a[i] = hb[si.getX(i)] * sw.getX(i) + hb[si.getY(i)] * sw.getY(i) + hb[si.getZ(i)] * sw.getZ(i) + hb[si.getW(i)] * sw.getW(i); return a; };
        const leg = W(/(UpLeg|Leg)$/), foot = W(/(Foot|Toe)/), torso = W(/(Spine|Spine1|Spine2|Hips|Neck|Shoulder)$/), arm = W(/(Arm|ForeArm)$/);
        o.geometry.setAttribute('aLeg', new THREE.BufferAttribute(leg, 1)); o.geometry.setAttribute('aFoot', new THREE.BufferAttribute(foot, 1)); o.geometry.setAttribute('aTorso', new THREE.BufferAttribute(torso, 1)); o.geometry.setAttribute('aArm', new THREE.BufferAttribute(arm, 1));
        const isBody = /Body/i.test(o.name), isShoe = /Sneaker|Sock|Shoe/i.test(o.name); const m = o.material.clone(); o.material = m; const prev = m.onBeforeCompile;
        m.onBeforeCompile = (sh, r) => { if (prev) prev(sh, r); sh.vertexShader = 'attribute float aLeg;\nattribute float aFoot;\nattribute float aTorso;\nattribute float aArm;\nvarying float vLeg;\nvarying float vFoot;\nvarying float vTorso;\nvarying float vArm;\nvarying vec3 vOP;\n' + sh.vertexShader.replace('#include <begin_vertex>', `#include <begin_vertex>
                vLeg = aLeg; vFoot = aFoot; vTorso = aTorso; vArm = aArm; vOP = position / ${U.toFixed(4)}; ${isBody ? 'transformed += normalize(objectNormal) * aLeg * (1.0 - aFoot) * ' + (0.006 * U).toFixed(4) + ';' : ''}`);
            sh.fragmentShader = 'varying float vLeg;\nvarying float vFoot;\nvarying float vTorso;\nvarying float vArm;\nvarying vec3 vOP;\n' + sh.fragmentShader.replace('#include <map_fragment>', `#include <map_fragment>
                ${isShoe ? 'diffuseColor.rgb = mix(vec3(0.012, 0.010, 0.009), vec3(0.04, 0.035, 0.03), diffuseColor.r);   /* botas café */' : `
                float n1 = fract(sin(dot(floor(vUv * 900.0), vec2(12.9898, 78.233))) * 43758.5453); float twill = 0.85 + 0.15 * abs(sin((vUv.x + vUv.y) * 1800.0));
                vec3 denim = vec3(0.07, 0.12, 0.24) * twill * (0.9 + 0.2 * n1); vec3 shirt = vec3(0.05, 0.08, 0.18) * (0.9 + 0.15 * n1);
                float legM = smoothstep(0.25, 0.5, vLeg) * (1.0 - smoothstep(0.3, 0.6, vFoot)); diffuseColor.rgb = mix(diffuseColor.rgb, denim, legM);   // pantalón
                ${isBody ? '' : `diffuseColor.rgb = mix(diffuseColor.rgb, shirt, smoothstep(0.3, 0.6, vArm + vTorso) * (1.0 - legM));   // camisa
                float vest = smoothstep(0.35, 0.6, vTorso) * step(0.95, vOP.y) * step(vOP.y, 1.47); vec3 vc = vec3(0.007, 0.05, 0.19) * (0.88 + 0.2 * n1);   // mismo azul DICKA que el chaleco de los operarios
                float band = (1.0 - smoothstep(0.012, 0.02, abs(vOP.y - 1.06))) + (1.0 - smoothstep(0.012, 0.02, abs(vOP.y - 1.16))) + (1.0 - smoothstep(0.012, 0.02, abs(abs(vOP.x) - 0.075))) * step(1.16, vOP.y);
                vc = mix(vc, vec3(0.85, 0.95, 0.25), clamp(band, 0.0, 1.0)); diffuseColor.rgb = mix(diffuseColor.rgb, vc, vest);   // chaleco DICKA con bandas reflejantes`}`}`); };
        m.customProgramCacheKey = () => 'fem-' + o.name; });
    if (headBone) { const ws = new THREE.Vector3(); headBone.getWorldScale(ws); const k = U / ws.x; const P = THREE.MeshPhysicalMaterial || THREE.MeshStandardMaterial; const hm = new P({ color: C(0xf2c200), roughness: .38, clearcoat: .7, clearcoatRoughness: .25 });   // casco ABS
        const hat = new THREE.Group(); hat.name = 'femHelmet'; const dome = new THREE.Mesh(new THREE.SphereGeometry(0.118, 24, 14, 0, Math.PI * 2, 0, Math.PI / 2), hm); dome.scale.set(1, 0.85, 1.12); hat.add(dome);
        const brim = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.135, 0.012, 24), hm); brim.scale.z = 1.15; hat.add(brim); const peak = new THREE.Mesh(new THREE.SphereGeometry(0.09, 16, 6, 0, Math.PI * 2, 0, Math.PI / 2), hm); peak.scale.set(1.05, 0.12, 0.9); peak.position.set(0, 0, 0.12); hat.add(peak);
        for (let r = -1; r <= 1; r++) { const rib = new THREE.Mesh(new THREE.TorusGeometry(0.117, 0.006, 6, 20, Math.PI), hm); rib.position.x = r * 0.035; rib.rotation.y = Math.PI / 2; rib.scale.set(1, 0.85, 1.12); hat.add(rib); }
        hat.scale.setScalar(k); hat.position.set(0, 0.165 * k, 0.0);
        // ajuste por modelo: se apoya en la coronilla (HeadTop_End) y queda derecho aunque el hueso de la cabeza venga inclinado en la pose de enlace
        scene.updateMatrixWorld(true); let top = null; headBone.traverse(b => { if (!top && b.isBone && /HeadTop/.test(b.name)) top = b; });
        if (top) { const tp = headBone.worldToLocal(top.getWorldPosition(new THREE.Vector3())); const up = tp.clone().normalize(); const len = tp.length(); hat.position.copy(up.multiplyScalar(len - 0.085 * k)); }
        const hq = headBone.getWorldQuaternion(new THREE.Quaternion()), rq = scene.getWorldQuaternion(new THREE.Quaternion()); hat.quaternion.copy(hq.invert().multiply(rq));
        headBone.add(hat); } }
function makeGLTFAvatar(low, fem) { if (fem && GLTF_FEM.gltf) return makeFemAvatar();
    const src = (low && GLTF_LOD.gltf) ? GLTF_LOD.gltf.scene : GLTF_AVATAR.gltf.scene; const clone = THREE.SkeletonUtils.clone(src); clone.scale.setScalar(GLTF_AVATAR.scale); clone.traverse(o => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; o.frustumCulled = true; if (o.geometry) { o.geometry.computeBoundingSphere(); const bs = o.geometry.boundingSphere; const sc = GLTF_AVATAR.rigScale || 1; bs.center.set(0, 0.9 / sc, 0); bs.radius = 1.4 / sc; } if (o.material) { o.material.side = THREE.FrontSide; if (o.material.map) o.material.map.encoding = THREE.sRGBEncoding; if (o.material.transparent) { o.material.alphaTest = 0.5; o.material.transparent = false; o.material.depthWrite = true; } } } });
    const mixer = new THREE.AnimationMixer(clone); const acts = {}; const clipsSrc = (low && GLTF_LOD.gltf) ? { sit: GLTF_LOD.gltf.animations[0] } : GLTF_AVATAR.clips; Object.entries(clipsSrc).forEach(([k, c]) => { if (c) acts[k] = mixer.clipAction(c); }); if (acts.idle) acts.idle.play(); else if (acts.walk) acts.walk.play(); try { if (!low) addAvatarGear(clone); else clone.traverse(o => { if (o.isMesh && /Boots/i.test(o.name)) { const m = o.material.clone(); m.skinning = true; m.color = new THREE.Color(0x262422); o.material = m; } }); } catch (e) { console.warn('[SIM] EPP avatar:', e.message); } return { obj: clone, mixer, acts, current: acts.idle ? 'idle' : (acts.walk ? 'walk' : null) }; }

function makeFemAvatar(T = GLTF_FEM) { const _u = T.rigScale && T.rigScale < 10 ? T.rigScale / 100 : 1; const clone = THREE.SkeletonUtils.clone(T.gltf.scene); clone.scale.setScalar(T.scale); clone.traverse(o => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; o.frustumCulled = false; if (o.material) { o.material.side = THREE.FrontSide; if (o.material.map) o.material.map.encoding = THREE.sRGBEncoding; if (o.material.transparent) { o.material.alphaTest = 0.5; o.material.transparent = false; o.material.depthWrite = true; } } } });
    const mixer = new THREE.AnimationMixer(clone); try { addAvatarGear(clone); } catch (e) {} return { uScale: _u, obj: clone, mixer, acts: {}, current: null, fem: T.fem !== false, extra: true }; }
// ---- Marcha procedural sobre el esqueleto del modelo realista (cuando el GLB no trae clip Walk/Idle) ----
// Parte de la pose de reposo (T-pose) y aplica rotaciones locales: brazos bajados y balanceo, piernas, rodillas, pies, cadera, columna y cabeza.
const GLTF_BONES = { hips: /^(Driving|Hips|Pelvis)$/i, spine: /^Spine$/i, spine2: /^Spine2$/i, head: /^Head$/i, lArm: /^LeftArm$/i, rArm: /^RightArm$/i, lFore: /^LeftForeArm$/i, rFore: /^RightForeArm$/i, rHand: /^RightHand$/i, lHand: /^LeftHand$/i, lUp: /^LeftUpLeg$/i, rUp: /^RightUpLeg$/i, lLeg: /^LeftLeg$/i, rLeg: /^RightLeg$/i, lFoot: /^LeftFoot$/i, rFoot: /^RightFoot$/i };
const GLTF_WALK = { legIn: 0.08, armDown: 1.56, armFwd: 0.42, elbow: 0.38, legSwing: 0.40, knee: 0.80, foot: 0.24, lean: 0.07 };   // signos ajustables según el rig

const _qa = new THREE.Quaternion(), _qp = new THREE.Quaternion(), _qw = new THREE.Quaternion(), _qr = new THREE.Quaternion(), _ax = new THREE.Vector3(), _mR = new THREE.Matrix4();
// Rotación de un hueso alrededor de ejes del MUNDO relativos al personaje (lateral = X, vertical = Y, frontal = Z), sobre su pose de reposo
function setBoneWorld(av, k, lateral = 0, vertical = 0, frontal = 0) { const bn = av.bones[k]; if (!bn) return; bn.quaternion.copy(av.rest[k]);
    if (!lateral && !vertical && !frontal) return; const parent = bn.parent; _qp.setFromRotationMatrix(_mR.extractRotation(parent.matrixWorld)); _qr.setFromRotationMatrix(_mR.extractRotation(av.obj.matrixWorld)); _qw.identity();   // extractRotation elimina la escala del rig (0.01) antes de convertir a cuaternión
    // orden: primero se baja el brazo (frontal), después el balanceo (lateral) y el giro (vertical): q = R_vert · R_lat · R_front
    if (vertical) { _ax.set(0, 1, 0).applyQuaternion(_qr); _qw.multiply(_qa.setFromAxisAngle(_ax, vertical)); } if (lateral) { _ax.set(1, 0, 0).applyQuaternion(_qr); _qw.multiply(_qa.setFromAxisAngle(_ax, lateral)); } if (frontal) { _ax.set(0, 0, 1).applyQuaternion(_qr); _qw.multiply(_qa.setFromAxisAngle(_ax, frontal)); }
    const inv = _qp.clone().invert(); const qLocal = inv.multiply(_qw).multiply(_qp); bn.quaternion.premultiply(qLocal); }
// Signos del rig: se determinan una vez probando qué sentido baja el brazo y qué sentido lleva la mano al frente
function gltfCalibrate(av) { if (av.calib) return; av.obj.updateMatrixWorld(true); const hand = av.obj.getObjectByName('LeftHand') || av.bones.lFore; if (!hand || !av.bones.lArm) { av.calib = { armL: 1, armR: -1, swing: 1 }; return; }   // rig sin brazos: valores por defecto
    const wp = new THREE.Vector3(); const yOf = () => { av.obj.updateMatrixWorld(true); hand.getWorldPosition(wp); return wp.y; };
    setBoneWorld(av, 'lArm', 0, 0, 1.2); const y1 = yOf(); setBoneWorld(av, 'lArm', 0, 0, -1.2); const y2 = yOf(); av.calib = { armL: y1 < y2 ? 1 : -1 }; av.calib.armR = -av.calib.armL;
    setBoneWorld(av, 'lArm', 0, 0, av.calib.armL * 1.25); av.obj.updateMatrixWorld(true); const fwd = new THREE.Vector3(0, 0, 1).applyQuaternion(av.obj.getWorldQuaternion(new THREE.Quaternion())); hand.getWorldPosition(wp); const z0 = wp.clone();
    setBoneWorld(av, 'lArm', 0.6, 0, av.calib.armL * 1.25); av.obj.updateMatrixWorld(true); hand.getWorldPosition(wp); av.calib.swing = wp.clone().sub(z0).dot(fwd) > 0 ? 1 : -1; setBoneWorld(av, 'lArm');
    av.calib.leg = av.calib.swing; const foot = av.obj.getObjectByName('LeftFoot'); if (foot && av.bones.lUp) { av.obj.updateMatrixWorld(true); foot.getWorldPosition(wp); const f0 = wp.clone(); setBoneWorld(av, 'lUp', 0.5, 0, 0); av.obj.updateMatrixWorld(true); foot.getWorldPosition(wp); av.calib.leg = wp.clone().sub(f0).dot(fwd) > 0 ? 1 : -1; setBoneWorld(av, 'lUp'); }
    av.calib.knee = av.calib.leg; if (foot && av.bones.lLeg) { av.obj.updateMatrixWorld(true); foot.getWorldPosition(wp); const k0 = wp.clone(); setBoneWorld(av, 'lLeg', 0.5, 0, 0); av.obj.updateMatrixWorld(true); foot.getWorldPosition(wp); av.calib.knee = wp.clone().sub(k0).dot(fwd) > 0 ? 1 : -1; setBoneWorld(av, 'lLeg'); } }   // la rodilla siempre flexiona hacia atrás   // sentido propio de las piernas (no siempre coincide con el de los brazos)
function gltfStandPose(av, armFwd = 0.95, headYaw = 0) { gltfPrepareBones(av); gltfCalibrate(av); const C = av.calib; av.obj.updateMatrixWorld(true);
    setBoneWorld(av, 'lArm', C.swing * (armFwd - 0.45), -0.08, C.armL * 1.52); setBoneWorld(av, 'rArm', C.swing * (armFwd - 0.4), 0.08, C.armR * 1.5); setBoneWorld(av, 'lFore', C.swing * 1.05, 0, C.armL * 0.05); setBoneWorld(av, 'rFore', C.swing * 1.1, 0, C.armR * 0.05);   // brazos pegados al torso y antebrazos al frente sobre los controles (antes quedaban abiertos en "A")
    setBoneWorld(av, 'head', 0, headYaw); if (av.bones.hips) av.bones.hips.position.y = av.hipsY0; }
function makeStandingOperator(low) { const av = makeGLTFAvatar(low); av.mixer.stopAllAction(); av.procedural = true; gltfPrepareBones(av); gltfStandPose(av); const op = new THREE.Group(); op.add(av.obj); const hg = new THREE.Group(); hg.name = 'opHead'; op.add(hg); op.userData.gltf = av; op.userData.standing = true; return op; }
// Mano recta y abierta: devuelve muñeca y dedos a la pose de enlace del modelo (sin el agarre de volante que deja el clip de conducción)

function gltfWalkPose(av, walking, w, now, waving, idlePhase) { gltfPrepareBones(av); gltfCalibrate(av); const W = GLTF_WALK, C = av.calib; const t = now / 1000; av.obj.updateMatrixWorld(true);
    // mezcla suave entre reposo y marcha (evita el "salto" de pose al arrancar o detenerse)
    av.blend = av.blend === undefined ? (walking ? 1 : 0) : av.blend + ((walking ? 1 : 0) - av.blend) * 0.12; const k = av.blend;
    if (!av.gait) { const r = () => 0.88 + Math.random() * 0.24; av.gait = { arm: r(), leg: r(), lean: r(), sway: r(), loose: Math.random() * 0.08 }; }   // cada persona camina distinto
    const G = av.gait, thigh = x => Math.sin(x) + 0.14 * Math.sin(2 * x + 0.6);   // muslo: avance rápido y apoyo largo (no senoidal pura)
    const sw = thigh(w) * k * G.leg, sw2 = thigh(w + Math.PI) * k * G.leg; const breathe = Math.sin(t / 1.1 + idlePhase) * 0.012 * (1 - k);
    // brazos: pegados al cuerpo (bajados casi 90° desde la T-pose y rotados un poco hacia el frente), balanceo con retraso de fase respecto a las piernas y codo relajado que se flexiona al ir adelante
    const ph = 0.35 + (idlePhase % 1) * 0.1, aswL = Math.sin(w + Math.PI - ph) * k, aswR = Math.sin(w - ph) * k; const armIn = 0.12;   // operarias: brazos un poco abiertos para no cruzar las manos sobre el cuerpo
    const aF = W.armFwd * G.arm * (av.fem ? 1.5 : 1), aD = W.armDown * (av.fem ? 0.84 : 1); setBoneWorld(av, 'lArm', C.swing * (aswL * aF + 0.03), -armIn, C.armL * aD); setBoneWorld(av, 'rArm', C.swing * (aswR * aF + 0.03), armIn, C.armR * aD);
    const eL = C.swing * (0.12 + G.loose + (aswL * 0.5 + 0.5) * W.elbow * k), eR = C.swing * (0.12 + G.loose + (aswR * 0.5 + 0.5) * W.elbow * k); const eS = av.fem ? 0.45 : 1;   // codo relajado: se dobla más al ir adelante
    setBoneWorld(av, 'lFore', eL * eS, 0, C.armL * 0.08); setBoneWorld(av, 'rFore', eR * eS, 0, C.armR * 0.08);
    setBoneWorld(av, 'lHand', eL * eS * 0.35, 0, C.armL * 0.12); setBoneWorld(av, 'rHand', eR * eS * 0.35, 0, C.armR * 0.12);   // muñeca suelta siguiendo al antebrazo, palma hacia el muslo
    if (waving) { setBoneWorld(av, 'rArm', 0, 0, C.armR * (-0.3 + Math.sin(t * 7.7) * 0.12)); setBoneWorld(av, 'rFore', 0, 0, C.armR * -0.7); setBoneWorld(av, 'rHand', 0, 0, C.armR * -0.7); }   // mano abierta y recta, alineada al antebrazo
    // piernas: el muslo oscila; la rodilla se flexiona en la fase de vuelo (pierna que avanza) y queda casi recta al apoyar; el pie hace talón-punta
    const kn = x => (Math.max(0, Math.sin(x - 0.9)) ** 1.5 * W.knee + Math.max(0, Math.sin(2 * x + 2.2)) * 0.12) * k * G.leg;   // flexión en vuelo + amortiguación al apoyar
    const kF = av.fem ? 1.35 : 1, kneeL = kn(w) * kF, kneeR = kn(w + Math.PI) * kF;   // operarias: más flexión de rodilla en el vuelo (paso natural, sin patear)
    const CL = C.leg ?? C.swing; const LS = W.legSwing * (av.fem ? 0.72 : 1); setBoneWorld(av, 'lUp', CL * (sw * LS + kneeL * 0.25), 0, C.armL * W.legIn); setBoneWorld(av, 'rUp', CL * (sw2 * LS + kneeR * 0.25), 0, C.armR * W.legIn);   // muslos ligeramente hacia el centro: pasos sobre una línea, no piernas abiertas
    const CK = C.knee ?? CL; setBoneWorld(av, 'lLeg', -CK * kneeL); setBoneWorld(av, 'rLeg', -CK * kneeR);
    const fS = av.fem ? 0.45 : 1; setBoneWorld(av, 'lFoot', CL * fS * (Math.max(-W.foot, Math.min(W.foot, Math.sin(w + 0.4) * 0.28)) * k - kneeL * 0.35)); setBoneWorld(av, 'rFoot', CL * fS * (Math.max(-W.foot, Math.min(W.foot, Math.sin(w + Math.PI + 0.4) * 0.28)) * k - kneeR * 0.35));   // operarias: tobillo más suave (el tenis del modelo exagera la punta)
    // cadera: rebote doble por zancada, vaivén lateral y contrarrotación; tronco inclinado al frente al caminar; hombros compensan
    if (av.bones.hips) { av.bones.hips.position.y = av.hipsY0 + ((Math.abs(Math.cos(w)) * 2.2 - 1.1) * k + breathe * 100 * 0.3) * (av.uScale || 1); }
    const ln = W.lean * G.lean + (av.fem ? -0.14 : 0), sy = G.sway; setBoneWorld(av, 'hips', C.swing * ln * k, Math.sin(w) * 0.10 * k * sy, Math.sin(w + 0.5) * 0.05 * k * sy);   // pelvis gira y cae del lado que avanza
    setBoneWorld(av, 'spine', C.swing * ln * 0.5 * k, -Math.sin(w) * 0.06 * k * sy, -Math.sin(w + 0.5) * 0.04 * k * sy); setBoneWorld(av, 'spine2', C.swing * ln * 0.3 * k, -Math.sin(w) * 0.12 * k * sy, 0);   // hombros contrarrotan a la cadera
    setBoneWorld(av, 'head', -C.swing * ln * 1.6 * k, (walking ? Math.sin(t / 1.4 + idlePhase) * 0.18 : Math.sin(t / 1.8 + idlePhase) * 0.4) + Math.sin(w) * 0.06 * k * sy, -Math.sin(w) * 0.02 * k); }   // la cabeza compensa el giro del tronco y mira al frente
