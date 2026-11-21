/* DICKA · Avatares más humanos (compartido): luces de estudio, reflejo ambiental suave en la piel y cabello con bordes suaves.
   Se engancha al render de Three.js: cuando una escena tiene personas 3D (SkinnedMesh) les ajusta los materiales una sola vez. */
(function () {
  if (typeof THREE === 'undefined' || !THREE.WebGLRenderer || THREE.WebGLRenderer.prototype.__dkHum) return;
  let ENV = null;
  function envFor(r) { if (ENV !== null) return ENV; try { const pm = new THREE.PMREMGenerator(r), es = new THREE.Scene(); es.background = new THREE.Color(0x8c96a8);
      const pl = (c, x, y, z, w, h) => { const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ color: c, side: THREE.DoubleSide })); m.position.set(x, y, z); m.lookAt(0, 0, 0); es.add(m); };
      pl(0xffffff, 0, 6, 0, 8, 8); pl(0xfff1e0, -6, 2, 4, 4, 4); pl(0xdbe7ff, 6, 2, 4, 4, 4); pl(0x55606f, 0, -5, 0, 12, 12); ENV = pm.fromScene(es, .04).texture; pm.dispose(); } catch (e) { ENV = false; } return ENV; }
  function humanize(root, r) { const env = r ? envFor(r) : null; let n = 0; root.traverse(o => { if (!o.isMesh || !o.material) return; (Array.isArray(o.material) ? o.material : [o.material]).forEach(m => { if (!m.isMeshStandardMaterial || m.userData.hum) return; m.userData.hum = 1; n++; const nm = (m.name || '') + ' ' + (o.name || '');
      if (env && !m.envMap && !(o.parent && o.parent.isScene)) { m.envMap = env; }
      if (/opacity|lash|hair|brow|pelo|cabello/i.test(nm) || (m.transparent && m.map)) { m.transparent = true; m.alphaTest = Math.max(m.alphaTest || 0, .4); m.depthWrite = false; m.envMapIntensity = .3; o.renderOrder = 2; }
      else if (/head|skin|face|body|cabeza|piel/i.test(nm)) { m.roughness = /head|face|cabeza/i.test(nm) ? .5 : Math.min(m.roughness, .62); m.metalness = 0; m.envMapIntensity = .55; if (m.normalScale) m.normalScale.multiplyScalar(.75); }
      else m.envMapIntensity = .4; m.needsUpdate = true; }); }); return n; }
  function studio(scene) { if (scene.userData.dkStudio) return; scene.userData.dkStudio = 1; const key = new THREE.DirectionalLight(0xffe2c4, .32); key.position.set(-3, 4.5, 6); const fill = new THREE.DirectionalLight(0xcfe0ff, .14); fill.position.set(4, 2.5, 5); const rim = new THREE.DirectionalLight(0xffffff, .35); rim.position.set(0, 3.5, -6); [key, fill, rim].forEach(l => { l.name = 'dkStudio'; scene.add(l); }); }
  const R = THREE.WebGLRenderer.prototype.render; THREE.WebGLRenderer.prototype.__dkHum = 1;
  THREE.WebGLRenderer.prototype.render = function (scene, cam) { try { if (scene && scene.isScene) { const u = scene.userData; u.dkF = (u.dkF || 0) + 1; if (u.dkF % 60 === 1) { const people = []; scene.traverse(o => { if (o.isSkinnedMesh) people.push(o); }); if (people.length) { studio(scene); people.forEach(p => humanize(p, this)); } } } } catch (e) { } return R.call(this, scene, cam); };
  window.dkHumanize = humanize; window.dkStudio = studio;
})();
