/* Almacén DICKA · funciones compartidas entre simulador-montacarga.html y turno-seguro-3d.html.
   Un cambio aquí aplica a ambos juegos. Las funciones que difieren entre juegos siguen dentro de cada HTML. */
function editUser() { document.getElementById('menuScreen').classList.add('hidden'); document.getElementById('regScreen').classList.remove('hidden'); }

function askName() {}

function spec() { return FORK_SPECS[currentModel] || FORK_SPECS.doublereach; }

function mastM() { return parseFloat(document.getElementById('mastHeight').value) / 100 * spec().maxMast; }

function reachM(stage) { const sp = spec(); if (sp.reachStages < stage) return 0; return parseFloat(document.getElementById('reach' + stage).value) / 100 * (sp.reachM / sp.reachStages); }

function renderForkGrid() {
            document.getElementById('forkGrid').innerHTML = Object.entries(FORK_SPECS).map(([k, f]) => `
              <div class="fork-card" onclick="chooseFork('${k}')"><span class="brand">RAYMOND</span>
                <div class="pic"><img src="assets/equipos/${k}.png" alt="Raymond ${f.code}" loading="lazy" onerror="this.replaceWith(Object.assign(document.createElement('div'),{className:'ico',textContent:'${f.ico}'}))"></div><h3>${f.name}</h3><div class="model">Modelo ${f.code} · ${f.type}</div>
                <ul>${f.desc.map(d => '<li>' + d + '</li>').join('')}<li>Capacidad ${f.cap} · Vel. máx ${f.maxSpeed} km/h · Mástil ${f.maxMast} m</li></ul>
                <span class="tag">${f.tag}</span></div>`).join('');
        }

function startQuestions() {
            document.getElementById('menuScreen').classList.add('hidden');
            document.getElementById('questionsScreen').classList.add('active');
            loadQuestion(0);
        }

function showWebGLError() { const w = document.getElementById('canvasWrap') || document.body; const d = document.createElement('div'); d.style.cssText = 'position:absolute;inset:0;z-index:50;background:#011131;color:#fff;display:flex;align-items:center;justify-content:center;text-align:center;padding:2rem;font-family:Poppins,sans-serif';
            d.innerHTML = '<div><div style="font-size:40px">🖥️</div><div style="font-weight:900;font-size:18px;margin:.4rem 0">El escenario 3D no puede dibujarse aquí</div><div style="font-size:13px;color:#c5cdf5;max-width:520px">Este navegador o esta ventana no permite gráficos 3D (WebGL). Suele pasar al ver el simulador dentro de una <b>vista previa</b> (Netlify, chat, correo) o con la <b>aceleración por hardware</b> desactivada.<br><br>Solución: abre la liga directa <b>simuladordickalogistics.netlify.app</b> en Chrome, Edge o Safari (no dentro de otra app) y, si persiste, activa la aceleración por hardware en la configuración del navegador.</div></div>'; w.appendChild(d); }

function startSimulator() {
            document.getElementById('menuScreen').classList.add('hidden');
            renderForkGrid(); document.getElementById('forkScreen').classList.remove('hidden');
        }

function backToMenu() {
            CC.shownOnce = false; document.getElementById('ctrlCheck').classList.remove('open'); CC.open = false;
            document.body.classList.remove('simfull'); if (document.fullscreenElement) { try { document.exitFullscreen(); } catch (e) {} }
            document.getElementById('forkScreen').classList.add('hidden');
            document.getElementById('questionsScreen').classList.remove('active');
            document.getElementById('resultsScreen').classList.remove('active');
            document.getElementById('simulatorScreen').classList.remove('active');
            document.getElementById('menuScreen').classList.remove('hidden');
            currentQuestionIndex = 0;
            score = 0;
            answers = [];
        }

function loadQuestion(index) {
            currentQuestionIndex = index;
            const scenario = scenarios[index];

            document.getElementById('currentQuestion').textContent = index + 1;
            document.getElementById('scenarioIcon').textContent = scenario.icon;
            document.getElementById('scenarioTitle').textContent = scenario.title;
            document.getElementById('scenarioDescription').textContent = scenario.description;

            const optionsContainer = document.getElementById('optionsContainer');
            optionsContainer.innerHTML = '';

            scenario.options.forEach((option, optionIndex) => {
                const btn = document.createElement('button');
                btn.className = 'option-btn';
                btn.textContent = option.text;
                btn.onclick = () => selectOption(optionIndex);
                optionsContainer.appendChild(btn);
            });

            document.getElementById('feedback').classList.remove('show', 'correct', 'incorrect');
            document.getElementById('nextBtn').disabled = true;
            updateProgressBar();
        }

function selectOption(optionIndex) {
            const scenario = scenarios[currentQuestionIndex];
            const option = scenario.options[optionIndex];
            const buttons = document.querySelectorAll('.option-btn');

            buttons.forEach((btn, idx) => {
                btn.disabled = true;
                if (idx === optionIndex) {
                    if (option.correct) {
                        btn.classList.add('correct');
                        score += 10;
                    } else {
                        btn.classList.add('incorrect');
                    }
                } else if (option.correct) {
                    btn.classList.add('correct');
                }
            });

            answers.push({ correct: option.correct });

            const feedback = document.getElementById('feedback');
            feedback.textContent = option.feedback;
            feedback.className = `feedback show ${option.correct ? 'correct' : 'incorrect'}`;

            document.getElementById('currentScore').textContent = score;
            document.getElementById('nextBtn').disabled = false;
        }

function nextQuestion() {
            if (currentQuestionIndex < scenarios.length - 1) {
                loadQuestion(currentQuestionIndex + 1);
            } else {
                finishGame();
            }
        }

function finishGame() {
            document.getElementById('questionsScreen').classList.remove('active');
            document.getElementById('resultsScreen').classList.add('active');

            const correct = answers.filter(a => a.correct).length;
            const incorrect = answers.length - correct;
            const percent = Math.round((score / 200) * 100);
            const passed = score >= 160;

            document.getElementById('finalScore').textContent = score;
            document.getElementById('statCorrect').textContent = `${correct}/20`;
            document.getElementById('statIncorrect').textContent = `${incorrect}/20`;
            document.getElementById('statPercent').textContent = `${percent}%`;

            try { const h = JSON.parse(localStorage.getItem('dicka_evaluaciones') || '[]'); h.push({ usuario: currentUser && currentUser.user, nombre: currentUser && currentUser.name, almacen: currentUser && currentUser.wh, fecha: new Date().toISOString(), score, aprobado: passed }); localStorage.setItem('dicka_evaluaciones', JSON.stringify(h)); } catch (e) {}
            if (passed) {
                document.getElementById('resultIcon').textContent = '🏆';
                document.getElementById('resultTitle').textContent = '¡Aprobaste!';
                document.getElementById('statusBadge').className = 'status-badge aprobado';
                document.getElementById('statusBadge').textContent = '✓ APROBADO';
            } else {
                document.getElementById('resultIcon').textContent = '📚';
                document.getElementById('resultTitle').textContent = 'Necesitas mejorar';
                document.getElementById('statusBadge').className = 'status-badge reprobado';
                document.getElementById('statusBadge').textContent = 'REPROBADO';
            }
        }

function restartGame() {
            currentQuestionIndex = 0;
            score = 0;
            answers = [];
            document.getElementById('resultsScreen').classList.remove('active');
            document.getElementById('questionsScreen').classList.add('active');
            loadQuestion(0);
        }

function updateProgressBar() {
            const progress = ((currentQuestionIndex + 1) / scenarios.length) * 100;
            document.getElementById('progressFill').style.width = progress + '%';
        }

function copyResult() {
            askName();
            const text = `📋 SIMULADOR MONTACARGA - DICKA\nOperario: ${currentUser.name}\nFecha: ${new Date().toLocaleString('es-MX')}\n\nPuntuación: ${score}/200\nCorrectas: ${answers.filter(a => a.correct).length}/20\nEstado: ${score >= 160 ? '✓ APROBADO' : '✗ REPROBADO'}`;
            navigator.clipboard.writeText(text);
            alert('Resultado copiado ✓');
        }

function makeTextTexture(lines, opts = {}) {
            const c = document.createElement('canvas'); c.width = opts.w || 1024; c.height = opts.h || 256;
            const g = c.getContext('2d');
            g.fillStyle = opts.bg || '#1D2586'; g.fillRect(0, 0, c.width, c.height);
            if (opts.stripe) { g.fillStyle = '#2138D3'; g.fillRect(0, c.height - 18, c.width, 18); }
            g.textAlign = 'center'; g.textBaseline = 'middle';
            lines.forEach((l, i) => {
                g.fillStyle = l.color || '#FFFFFF';
                g.font = `${l.weight || 'bold'} ${l.size || 120}px Arial`;
                const autoY = lines.length > 1 && lines.every(x => !x.y) ? c.height * (i + 1) / (lines.length + 1) : c.height / 2; g.fillText(l.text, c.width / 2, l.y || autoY);   // varias líneas sin posición: se reparten en el alto
            });
            const t = new THREE.CanvasTexture(c); t.anisotropy = 4; return t;
        }

function noiseCanvas(w, h, base, spread, fn) { const c = document.createElement('canvas'); c.width = w; c.height = h; const g = c.getContext('2d'); g.fillStyle = base; g.fillRect(0, 0, w, h);
            const img = g.getImageData(0, 0, w, h), d = img.data; for (let i = 0; i < d.length; i += 4) { const n = (Math.random() - .5) * spread; d[i] += n; d[i + 1] += n; d[i + 2] += n; } g.putImageData(img, 0, 0); if (fn) fn(g, w, h); return c; }

function concreteTex() { if (_texCache.concrete) return _texCache.concrete; const c = noiseCanvas(1024, 1024, '#8a8a87', 10, (g, w, h) => {
            for (let i = 0; i < 260; i++) { const r = 30 + Math.random() * 120; const gr = g.createRadialGradient(0, 0, 0, 0, 0, r); const d = Math.random() < 0.5 ? '0,0,0' : '255,255,255'; gr.addColorStop(0, `rgba(${d},${0.018 + Math.random() * 0.02})`); gr.addColorStop(1, `rgba(${d},0)`); g.save(); g.translate(Math.random() * w, Math.random() * h); g.fillStyle = gr; g.fillRect(-r, -r, 2 * r, 2 * r); g.restore(); }   // moteado del pulido
            for (let i = 0; i < 9000; i++) { g.fillStyle = Math.random() < 0.5 ? 'rgba(40,40,40,.25)' : 'rgba(230,230,225,.22)'; g.fillRect(Math.random() * w, Math.random() * h, 1 + Math.random() * 1.5, 1 + Math.random() * 1.5); }   // agregado fino
            for (let i = 0; i < 4; i++) { g.strokeStyle = `rgba(25,25,25,${0.035 + Math.random() * 0.03})`; g.lineWidth = 14 + Math.random() * 8; g.beginPath(); const y = Math.random() * h; g.moveTo(-20, y); g.bezierCurveTo(w * 0.3, y + (Math.random() - .5) * 160, w * 0.6, y + (Math.random() - .5) * 160, w + 20, y + (Math.random() - .5) * 60); g.stroke(); }   // huellas de rodado tenues
            g.strokeStyle = 'rgba(50,50,50,.5)'; g.lineWidth = 2; g.strokeRect(1, 1, w - 2, h - 2); g.beginPath(); g.moveTo(w / 2, 0); g.lineTo(w / 2, h); g.moveTo(0, h / 2); g.lineTo(w, h / 2); g.stroke(); }); const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(WAREHOUSE.w / 12, WAREHOUSE.d / 12); t.anisotropy = 8; t.encoding = THREE.sRGBEncoding; _texCache.concrete = t; return t; }

function cartonUpgrade(c, t) { const apply = () => { const g = c.getContext('2d'); g.save(); g.globalCompositeOperation = 'overlay'; g.globalAlpha = 0.75; for (let x = 0; x < c.width; x += 512) for (let y = 0; y < c.height; y += 512) g.drawImage(CARTON.img, x, y, 512, 512); g.restore(); t.needsUpdate = true; };
            if (CARTON.img) apply(); else { CARTON.pend.push(apply); if (!CARTON.loading) { CARTON.loading = true; const im = new Image(); im.onload = () => { CARTON.img = im; CARTON.pend.forEach(f => f()); CARTON.pend = []; }; im.src = 'assets/textures/carton.jpg'; } } }

function cardboardTex(variant) { const k = 'cb' + variant; if (_texCache[k]) return _texCache[k]; const cols = ['#c9a875', '#d3b283', '#bfa070']; const c = noiseCanvas(512, 512, cols[variant % 3], 18, (g, w, h) => {
            g.fillStyle = 'rgba(120,80,30,.25)'; for (let i = 0; i < 6; i++) g.fillRect(0, i * 90 + 20, w, 2);          // corrugado
            g.fillStyle = 'rgba(200,180,120,.85)'; g.fillRect(w * 0.42, 0, w * 0.16, h);                             // cinta
            g.fillStyle = '#fff'; g.fillRect(40, 60, 170, 110); g.fillStyle = '#1D2586'; g.fillRect(40, 60, 170, 22); // etiqueta
            g.fillStyle = '#333'; g.font = '600 15px Arial'; g.fillText('SKU ' + (10000 + variant * 3217 + 231), 52, 108); g.fillText('DICKA LOGISTICS', 52, 128); g.fillText('QTY 24  ·  8.6 kg', 52, 148);
            for (let i = 0; i < 24; i++) { g.fillStyle = '#111'; g.fillRect(48 + i * 6, 152, Math.random() < .5 ? 2 : 3, 14); }                  // código de barras
            g.strokeStyle = 'rgba(0,0,0,.35)'; g.lineWidth = 3; g.strokeRect(2, 2, w - 4, h - 4);
            g.fillStyle = 'rgba(0,0,0,.25)'; g.font = '700 26px Arial'; g.fillText('↑↑  FRÁGIL', w - 220, h - 40); }); const t = new THREE.CanvasTexture(c); t.anisotropy = 4; t.encoding = THREE.sRGBEncoding; cartonUpgrade(c, t); _texCache[k] = t; return t; }

function upgradeTex(t, file) { try { const im = new Image(); im.onload = () => { t.image = im; t.needsUpdate = true; }; im.src = 'assets/textures/' + file; } catch (e) {} return t; }

function woodTex() { if (_texCache.wood) return _texCache.wood; const c = noiseCanvas(256, 256, '#b08850', 30, (g, w, h) => { g.strokeStyle = 'rgba(80,50,20,.35)'; for (let i = 0; i < 18; i++) { g.lineWidth = 1 + Math.random() * 2; g.beginPath(); g.moveTo(0, i * 14 + Math.random() * 6); g.bezierCurveTo(w / 3, i * 14 + (Math.random() - .5) * 10, 2 * w / 3, i * 14 + (Math.random() - .5) * 10, w, i * 14 + Math.random() * 6); g.stroke(); } }); const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.encoding = THREE.sRGBEncoding; _texCache.wood = upgradeTex(t, 'madera.jpg'); return t; }

function palletGeometry(rot) { const k = rot === 'lite' ? 'palGeoL' : rot ? 'palGeoR' : 'palGeo'; if (_texCache[k]) return _texCache[k]; const parts = []; const box = (w, h, d, x, y, z) => { const g = new THREE.BoxGeometry(w, h, d); g.translate(x, y, z); parts.push(g); };
            if (rot === 'lite') { box(1.2, 0.022, 1.0, 0, 0.011, 0); [-0.47, 0, 0.47].forEach(z => box(1.2, 0.1, 0.05, 0, 0.072, z)); box(1.2, 0.022, 1.0, 0, 0.133, 0); const g = THREE.BufferGeometryUtils.mergeBufferGeometries(parts); g.translate(0, -0.072, 0); g.rotateY(Math.PI / 2); g.computeBoundingSphere(); _texCache[k] = g; return g; }   // versión ligera (60 triángulos) para los cientos de tarimas en rack
            // tarima de largueros (2 entradas): 5 tablas inferiores, 3 largueros macizos y 7 tablas de cubierta con separación
            for (let i = 0; i < 5; i++) box(0.12, 0.022, 1.0, -0.54 + i * 0.27, 0.011, 0);
            [-0.475, 0, 0.475].forEach(z => box(1.2, 0.1, 0.05, 0, 0.072, z));
            for (let i = 0; i < 7; i++) box(0.12, 0.022, 1.0, -0.54 + i * 0.18, 0.133, 0);
            let g = THREE.BufferGeometryUtils.mergeBufferGeometries(parts); g.translate(0, -0.072, 0); if (rot) g.rotateY(Math.PI / 2); g.computeBoundingSphere(); _texCache[k] = g; return g; }

function unitLoadTex(v) { const k = 'ul' + v; if (_texCache[k]) return _texCache[k]; const base = ['#c9a875', '#d3b283', '#bfa070'][v % 3]; const c = noiseCanvas(512, 512, base, 14, (g, w, h) => {
                const cols = 3, rows = 4, cw = w / cols, rh = h / rows;
                for (let r = 0; r < rows; r++) for (let q = 0; q < cols; q++) { const x = q * cw, y = r * rh; g.fillStyle = `rgba(${Math.random() < .5 ? '0,0,0' : '255,255,255'},${Math.random() * 0.06})`; g.fillRect(x, y, cw, rh);   // tono de cada caja
                    g.fillStyle = 'rgba(150,110,50,.35)'; g.fillRect(x + cw / 2 - 7, y, 14, rh);                                // cinta canela
                    if ((r + q + v) % 3 === 0) { g.fillStyle = '#f4f4f0'; g.fillRect(x + 12, y + rh - 46, 62, 34); g.fillStyle = '#1D2586'; g.fillRect(x + 12, y + rh - 46, 62, 8); g.fillStyle = '#222'; for (let b = 0; b < 12; b++) g.fillRect(x + 16 + b * 4.5, y + rh - 22, b % 3 ? 2 : 1, 8); }   // etiqueta con código de barras
                    g.strokeStyle = 'rgba(60,40,15,.55)'; g.lineWidth = 3; g.strokeRect(x + 1.5, y + 1.5, cw - 3, rh - 3); }       // junta entre cajas
                g.fillStyle = 'rgba(225,235,242,.16)'; g.fillRect(0, 0, w, h); const hz = g.createLinearGradient(0, 0, 0, h); hz.addColorStop(0, 'rgba(235,242,248,.28)'); hz.addColorStop(.25, 'rgba(235,242,248,0)'); hz.addColorStop(.8, 'rgba(235,242,248,0)'); hz.addColorStop(1, 'rgba(235,242,248,.32)'); g.fillStyle = hz; g.fillRect(0, 0, w, h);   // película: más capas arriba y abajo
                for (let i = 0; i < 9; i++) { const y = i * h / 8 + (Math.random() - .5) * 20; g.strokeStyle = 'rgba(255,255,255,.22)'; g.lineWidth = 2; g.beginPath(); g.moveTo(0, y); g.lineTo(w, y + 70); g.stroke(); }   // bordes de cada vuelta en espiral
                for (let i = 0; i < 40; i++) { g.strokeStyle = `rgba(255,255,255,${0.06 + Math.random() * 0.14})`; g.lineWidth = 1 + Math.random() * 4; g.beginPath(); const y = Math.random() * h, x = Math.random() * w; g.moveTo(x, y); g.quadraticCurveTo(x + 30, y + (Math.random() - .5) * 40, x + 40 + Math.random() * 120, y + (Math.random() - .5) * 30); g.stroke(); }   // arrugas y pliegues
                for (let i = 0; i < 6; i++) { g.fillStyle = `rgba(255,255,255,${0.10 + Math.random() * 0.12})`; const x = Math.random() * w; g.fillRect(x, 0, 3 + Math.random() * 10, h); } });   // reflejos verticales del plástico
            const t = new THREE.CanvasTexture(c); t.encoding = THREE.sRGBEncoding; t.anisotropy = 4; cartonUpgrade(c, t); _texCache[k] = t; return t; }

function unitLoadMat(v) { const P = THREE.MeshPhysicalMaterial; return P ? new P({ map: unitLoadTex(v), roughness: 0.8, clearcoat: 1.0, clearcoatRoughness: 0.22, envMapIntensity: 1.2 }) : new THREE.MeshStandardMaterial({ map: unitLoadTex(v), roughness: 0.55 }); }

function cbFaceTex(v, face) { const k = 'cbf' + v + face; if (_texCache[k]) return _texCache[k]; const base = ['#c19a64', '#cba674', '#b8915a'][v % 3];
            const c = noiseCanvas(256, 256, face === 'bot' ? '#a8834e' : base, 12, (g, w, h) => {
                for (let x = 0; x < w; x += 4) { g.fillStyle = `rgba(90,60,25,${0.05 + Math.random() * 0.04})`; g.fillRect(x, 0, 1.5, h); }          // flautas del corrugado
                const eg = (x0, y0, x1, y1) => { const gr = g.createLinearGradient(x0, y0, x1, y1); gr.addColorStop(0, 'rgba(60,35,10,.35)'); gr.addColorStop(1, 'rgba(60,35,10,0)'); return gr; };
                g.fillStyle = eg(0, 0, 0, 14); g.fillRect(0, 0, w, 14); g.fillStyle = eg(0, h, 0, h - 14); g.fillRect(0, h - 14, w, 14); g.fillStyle = eg(0, 0, 14, 0); g.fillRect(0, 0, 14, h); g.fillStyle = eg(w, 0, w - 14, 0); g.fillRect(w - 14, 0, 14, h);   // aristas oscurecidas
                for (let i = 0; i < 5; i++) { g.fillStyle = `rgba(${Math.random() < .5 ? '70,45,15' : '235,215,175'},${0.08 + Math.random() * 0.1})`; g.beginPath(); g.ellipse(Math.random() * w, Math.random() * h, 4 + Math.random() * 16, 2 + Math.random() * 5, Math.random() * 3, 0, 7); g.fill(); }   // raspones y manchas
                const tape = (x, y, tw, th) => { g.fillStyle = 'rgba(170,125,60,.55)'; g.fillRect(x, y, tw, th); g.fillStyle = 'rgba(255,240,210,.25)'; g.fillRect(x + tw * 0.15, y, tw * 0.12, th); g.fillStyle = 'rgba(90,60,25,.35)'; g.fillRect(x, y, 1, th); g.fillRect(x + tw - 1, y, 1, th); };
                if (face === 'top') { g.fillStyle = 'rgba(60,35,10,.55)'; g.fillRect(0, h / 2 - 1, w, 2); tape(0, h / 2 - 20, w, 40); }   // unión de solapas + cinta canela
                else if (face === 'side') { g.fillStyle = 'rgba(55,40,30,.75)'; g.font = '900 22px Arial Black, Arial'; g.textAlign = 'center'; g.fillText('DICKA', w / 2, 110); g.font = '700 11px Arial'; g.fillText('LOGISTICS', w / 2, 126);
                    g.font = '700 22px Arial'; g.fillText('⇧⇧', 40, h - 26); g.strokeStyle = 'rgba(55,40,30,.75)'; g.lineWidth = 2; g.strokeRect(22, h - 52, 36, 36);
                    if (v !== 1) { g.fillStyle = '#f2efe6'; g.fillRect(w - 112, h - 72, 92, 54); g.fillStyle = '#1D2586'; g.fillRect(w - 112, h - 72, 92, 10); g.fillStyle = '#222'; g.font = '600 9px Arial'; g.textAlign = 'left'; g.fillText('SKU ' + (10000 + v * 3217 + 231), w - 106, h - 50); for (let i = 0; i < 20; i++) g.fillRect(w - 106 + i * 4, h - 42, Math.random() < .5 ? 1.5 : 2.5, 16); } }
                else if (face === 'end') { tape(w / 2 - 20, 0, 40, 38); g.fillStyle = 'rgba(55,40,30,.7)'; g.font = '700 13px Arial'; g.textAlign = 'center'; g.fillText('QTY 24 · 8.6 kg', w / 2, h / 2 + 20); g.fillText('↑ ESTE LADO ARRIBA ↑', w / 2, h / 2 + 40); } });
            const t = new THREE.CanvasTexture(c); t.encoding = THREE.sRGBEncoding; t.anisotropy = 4; cartonUpgrade(c, t); _texCache[k] = t; return t; }

function cardboardMat(v) { v = v % 3; const k = 'cbm' + v; if (_texCache[k]) return _texCache[k]; const m = f => new THREE.MeshStandardMaterial({ map: cbFaceTex(v, f), bumpMap: cbFaceTex(v, f), bumpScale: 0.004, roughness: 0.9 });
            const side = m('side'), end = m('end'), top = m('top'), bot = m('bot'); return (_texCache[k] = [end, end, top, bot, side, side]); }

function makePallet(w, d) { w = w || 1.0; d = d || 1.2; const g = new THREE.Group(); const m = new THREE.MeshStandardMaterial({ map: woodTex(), roughness: 0.9 });
            for (let i = 0; i < 7; i++) { const b = new THREE.Mesh(new THREE.BoxGeometry(w, 0.022, d / 7 * 0.72), m); b.position.set(0, 0.13, -d / 2 + d / 14 + i * d / 7); b.castShadow = true; g.add(b); }
            [-w / 2 + 0.05, 0, w / 2 - 0.05].forEach(x => { const s = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.1, d), m); s.position.set(x, 0.07, 0); g.add(s); });
            [-d / 2 + 0.06, -d / 4, 0, d / 4, d / 2 - 0.06].forEach(z => { const b = new THREE.Mesh(new THREE.BoxGeometry(w, 0.02, 0.1), m); b.position.set(0, 0.01, z); g.add(b); });
            return g; }

function loadRealTex(file, repX, repY, done) { try { new THREE.TextureLoader().load('assets/textures/' + file, t => { t.encoding = /rough/.test(file) ? THREE.LinearEncoding : THREE.sRGBEncoding; t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(repX, repY); t.anisotropy = 8; done(t); }, undefined, () => {}); } catch (e) {} }

function buildFloor() {
            // Concreto pulido
            const floor = new THREE.Mesh(new THREE.PlaneGeometry(WAREHOUSE.w, WAREHOUSE.d),
                new THREE.MeshStandardMaterial({ map: concreteTex(), roughness: 0.6, metalness: 0.08 }));
            floor.rotation.x = -Math.PI / 2; floor.receiveShadow = true; scene.add(floor);
            loadRealTex('piso.jpg', WAREHOUSE.w / 4, WAREHOUSE.d / 4, t => { floor.material.map = t; floor.material.color.setRGB(1.15, 1.15, 1.15); floor.material.needsUpdate = true; });   // concreto real (≈4 m por mosaico)
            loadRealTex('piso_rough.jpg', WAREHOUSE.w / 4, WAREHOUSE.d / 4, t => { floor.material.roughnessMap = t; floor.material.roughness = 0.9; floor.material.needsUpdate = true; });

            // Juntas de losas
            const jointMat = new THREE.LineBasicMaterial({ color: 0x777777 });
            for (let x = -WAREHOUSE.w / 2; x <= WAREHOUSE.w / 2; x += 6) {
                const g = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(x, 0.01, -WAREHOUSE.d / 2), new THREE.Vector3(x, 0.01, WAREHOUSE.d / 2)]);
                scene.add(new THREE.Line(g, jointMat));
            }
            for (let z = -WAREHOUSE.d / 2; z <= WAREHOUSE.d / 2; z += 6) {
                const g = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(-WAREHOUSE.w / 2, 0.01, z), new THREE.Vector3(WAREHOUSE.w / 2, 0.01, z)]);
                scene.add(new THREE.Line(g, jointMat));
            }
        }

function paintLine(x1, z1, x2, z2, color = 0xf5c400, width = 0.12) {
            const len = Math.hypot(x2 - x1, z2 - z1);
            const m = new THREE.Mesh(new THREE.PlaneGeometry(width, len), new THREE.MeshStandardMaterial({ color, roughness: 1 }));
            m.rotation.x = -Math.PI / 2; m.rotation.z = -Math.atan2(x2 - x1, z2 - z1);
            m.position.set((x1 + x2) / 2, 0.015, (z1 + z2) / 2); scene.add(m);
        }

function paintLabel(text, x, z, size = 3, color = '#ffffff', rotY = 0, maxW = size * 2) {
            // Rotulado de piso: el texto se ajusta al ancho (antes se cortaba "PASILLO n") y el plano toma la proporción real del texto
            const c = document.createElement('canvas'); c.height = 256; const g = c.getContext('2d'); let fs = 170; g.font = `900 ${fs}px Arial Black, Arial`; const tw = g.measureText(text).width;
            c.width = Math.min(2048, Math.ceil(tw + 80)); if (tw + 80 > 2048) fs = Math.floor(fs * 1968 / tw); g.font = `900 ${fs}px Arial Black, Arial`; g.textAlign = 'center'; g.textBaseline = 'middle';
            g.lineJoin = 'round'; g.lineWidth = 12; g.strokeStyle = color === '#011131' ? 'rgba(255,255,255,.6)' : 'rgba(1,17,49,.85)'; g.strokeText(text, c.width / 2, 132);   // contorno oscuro: legible sobre piso claro g.fillStyle = color; g.fillText(text, c.width / 2, 132);
            const t = new THREE.CanvasTexture(c); t.encoding = THREE.sRGBEncoding; t.anisotropy = 8;
            let pw = size * c.width / 256, ph = size; if (pw > maxW) { ph *= maxW / pw; pw = maxW; }   // no rebasa el ancho disponible (pasillo)
            const m = new THREE.Mesh(new THREE.PlaneGeometry(pw, ph), new THREE.MeshBasicMaterial({ map: t, transparent: true, depthWrite: false })); m.renderOrder = 2;
            m.rotation.x = -Math.PI / 2; m.rotation.z = rotY; m.position.set(x, 0.02, z); scene.add(m);
        }

function drawSign(g, type, W, H) {
            const VERDE = '#007A33', ROJO = '#C8102E', AZUL = '#0047AB', AMAR = '#FFD100', NEGRO = '#111', BL = '#fff';
            const T = { evacDer: 'RUTA DE EVACUACIÓN', evacIzq: 'RUTA DE EVACUACIÓN', salida: 'SALIDA DE EMERGENCIA', extintor: 'EXTINTOR', botiquin: 'BOTIQUÍN', casco: 'USO OBLIGATORIO DE CASCO', chaleco: 'USO OBLIGATORIO DE CHALECO', calzado: 'USO OBLIGATORIO DE CALZADO DE SEGURIDAD', precMonta: 'PRECAUCIÓN TRÁNSITO DE MONTACARGAS', electrico: 'RIESGO ELÉCTRICO', noPeaton: 'PROHIBIDO EL PASO A PEATONES', noFumar: 'PROHIBIDO FUMAR', vel10: 'VELOCIDAD MÁXIMA', reunion: 'PUNTO DE REUNIÓN' }[type];
            const verde = ['evacDer', 'evacIzq', 'salida', 'botiquin', 'reunion'].includes(type), rojo = type === 'extintor';
            g.fillStyle = verde ? VERDE : rojo ? ROJO : BL; g.fillRect(0, 0, W, H);
            g.strokeStyle = verde || rojo ? BL : NEGRO; g.lineWidth = 6; g.strokeRect(8, 8, W - 16, H - 16);
            const cx = W / 2, cy = 112, R = 86; g.lineCap = 'round'; g.lineJoin = 'round';
            const flecha = (dir, y) => { g.fillStyle = BL; g.save(); g.translate(cx, y); g.scale(dir, 1); g.beginPath(); g.moveTo(-90, -18); g.lineTo(30, -18); g.lineTo(30, -50); g.lineTo(95, 0); g.lineTo(30, 50); g.lineTo(30, 18); g.lineTo(-90, 18); g.closePath(); g.fill(); g.restore(); };
            const persona = (x, y, s, col) => { g.fillStyle = col; g.strokeStyle = col; g.lineWidth = 12 * s; g.beginPath(); g.arc(x, y - 52 * s, 13 * s, 0, 7); g.fill(); g.beginPath(); g.moveTo(x, y - 36 * s); g.lineTo(x, y + 8 * s); g.moveTo(x - 26 * s, y - 20 * s); g.lineTo(x + 26 * s, y - 14 * s); g.moveTo(x, y + 8 * s); g.lineTo(x - 20 * s, y + 46 * s); g.moveTo(x, y + 8 * s); g.lineTo(x + 22 * s, y + 46 * s); g.stroke(); };
            const circulo = (fill, ring) => { g.beginPath(); g.arc(cx, cy, R, 0, 7); g.fillStyle = fill; g.fill(); if (ring) { g.lineWidth = 18; g.strokeStyle = ring; g.stroke(); } };
            const prohib = () => { g.lineWidth = 18; g.strokeStyle = ROJO; g.beginPath(); g.arc(cx, cy, R, 0, 7); g.stroke(); g.beginPath(); g.moveTo(cx - R * 0.7, cy - R * 0.7); g.lineTo(cx + R * 0.7, cy + R * 0.7); g.stroke(); };
            const triangulo = () => { g.beginPath(); g.moveTo(cx, cy - 98); g.lineTo(cx + 110, cy + 82); g.lineTo(cx - 110, cy + 82); g.closePath(); g.fillStyle = AMAR; g.fill(); g.lineWidth = 14; g.strokeStyle = NEGRO; g.stroke(); };
            switch (type) {
                case 'evacDer': persona(cx - 40, cy - 20, 0.9, BL); flecha(1, cy + 62); break;
                case 'evacIzq': persona(cx + 40, cy - 20, 0.9, BL); flecha(-1, cy + 62); break;
                case 'salida': g.strokeStyle = BL; g.lineWidth = 10; g.strokeRect(cx + 20, cy - 90, 70, 125); persona(cx - 30, cy - 20, 0.9, BL); g.save(); g.translate(0, cy + 66); g.scale(1, 0.7); flecha(1, 0); g.restore(); break;
                case 'extintor': g.fillStyle = BL; g.beginPath(); g.roundRect ? g.roundRect(cx - 30, cy - 50, 60, 140, 22) : g.rect(cx - 30, cy - 50, 60, 140); g.fill(); g.fillRect(cx - 12, cy - 75, 24, 28); g.lineWidth = 10; g.strokeStyle = BL; g.beginPath(); g.moveTo(cx + 10, cy - 66); g.lineTo(cx + 60, cy - 70); g.lineTo(cx + 70, cy - 30); g.stroke(); break;
                case 'botiquin': g.fillStyle = BL; g.fillRect(cx - 80, cy - 80, 160, 160); g.fillStyle = VERDE; g.fillRect(cx - 18, cy - 60, 36, 120); g.fillRect(cx - 60, cy - 18, 120, 36); break;
                case 'reunion': g.fillStyle = BL; [0, 1, 2, 3].forEach(k => { g.save(); g.translate(cx, cy); g.rotate(k * Math.PI / 2); g.beginPath(); g.moveTo(-14, -96); g.lineTo(14, -96); g.lineTo(14, -58); g.lineTo(30, -58); g.lineTo(0, -28); g.lineTo(-30, -58); g.lineTo(-14, -58); g.closePath(); g.fill(); g.restore(); }); persona(cx - 12, cy + 18, 0.45, BL); persona(cx + 14, cy + 18, 0.45, BL); break;
                case 'casco': circulo(AZUL); g.fillStyle = BL; g.beginPath(); g.arc(cx, cy + 20, 55, Math.PI, 0); g.fill(); g.fillRect(cx - 72, cy + 16, 144, 16); break;
                case 'chaleco': circulo(AZUL); g.fillStyle = BL; g.beginPath(); g.moveTo(cx - 40, cy - 60); g.lineTo(cx - 12, cy - 60); g.lineTo(cx, cy - 20); g.lineTo(cx + 12, cy - 60); g.lineTo(cx + 40, cy - 60); g.lineTo(cx + 55, cy + 60); g.lineTo(cx - 55, cy + 60); g.closePath(); g.fill(); g.fillStyle = AZUL; g.fillRect(cx - 52, cy + 10, 104, 12); break;
                case 'calzado': circulo(AZUL); g.fillStyle = BL; g.beginPath(); g.moveTo(cx - 40, cy - 60); g.lineTo(cx + 5, cy - 60); g.lineTo(cx + 5, cy + 5); g.lineTo(cx + 60, cy + 25); g.lineTo(cx + 62, cy + 52); g.lineTo(cx - 42, cy + 52); g.closePath(); g.fill(); break;
                case 'precMonta': triangulo(); g.fillStyle = NEGRO; g.fillRect(cx - 50, cy + 10, 60, 34); g.fillRect(cx - 30, cy - 22, 30, 34); g.fillRect(cx + 14, cy - 50, 9, 94); g.fillRect(cx + 14, cy + 38, 44, 7); g.beginPath(); g.arc(cx - 36, cy + 50, 12, 0, 7); g.arc(cx + 2, cy + 50, 12, 0, 7); g.fill(); break;
                case 'electrico': triangulo(); g.fillStyle = NEGRO; g.beginPath(); g.moveTo(cx + 12, cy - 60); g.lineTo(cx - 28, cy + 10); g.lineTo(cx - 2, cy + 10); g.lineTo(cx - 14, cy + 66); g.lineTo(cx + 30, cy - 8); g.lineTo(cx + 4, cy - 8); g.closePath(); g.fill(); break;
                case 'noPeaton': circulo(BL); persona(cx, cy + 10, 1.1, NEGRO); prohib(); break;
                case 'noFumar': circulo(BL); g.fillStyle = NEGRO; g.fillRect(cx - 62, cy + 2, 100, 22); g.fillStyle = '#E87722'; g.fillRect(cx + 40, cy + 2, 22, 22); g.strokeStyle = NEGRO; g.lineWidth = 6; g.beginPath(); g.moveTo(cx + 50, cy - 8); g.quadraticCurveTo(cx + 30, cy - 30, cx + 50, cy - 52); g.stroke(); prohib(); break;
                case 'vel10': circulo(BL, ROJO); g.fillStyle = NEGRO; g.font = 'bold 92px Arial'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('10', cx, cy - 6); g.font = 'bold 30px Arial'; g.fillText('km/h', cx, cy + 50); break;
            }
            // Texto de apoyo (NOM-026: texto complementario debajo del símbolo)
            g.fillStyle = verde || rojo ? BL : NEGRO; g.textAlign = 'center'; g.textBaseline = 'middle'; g.font = 'bold 26px Arial'; if (T.length > 30) g.font = 'bold 22px Arial';
            const words = T.split(' '), lines = []; let ln = ''; words.forEach(w => { const t = ln ? ln + ' ' + w : w; if (g.measureText(t).width > W - 36) { lines.push(ln); ln = w; } else ln = t; }); lines.push(ln);
            lines.forEach((l, i) => g.fillText(l, cx, 270 + (i - (lines.length - 1) / 2) * 27));
        }

function signMaterial() {
            if (SIGN_ATLAS.mat) return SIGN_ATLAS.mat;
            const A = SIGN_ATLAS, c = document.createElement('canvas'); c.width = A.cols * A.cw; c.height = A.rows * A.ch; const g = c.getContext('2d');
            SIGN_TYPES.forEach((t, i) => { g.save(); g.translate((i % A.cols) * A.cw, Math.floor(i / A.cols) * A.ch); g.beginPath(); g.rect(0, 0, A.cw, A.ch); g.clip(); drawSign(g, t, A.cw, A.ch); g.restore(); });
            A.tex = new THREE.CanvasTexture(c); A.tex.anisotropy = 4; A.tex.encoding = THREE.sRGBEncoding; A.mat = new THREE.MeshBasicMaterial({ map: A.tex }); return A.mat;
        }

function addSign(type, x, y, z, rotY, size = 1) {
            const A = SIGN_ATLAS, i = SIGN_TYPES.indexOf(type), geo = new THREE.PlaneGeometry(0.8 * size, 1.1 * size);
            const u0 = (i % A.cols) / A.cols, u1 = u0 + 1 / A.cols, v1 = 1 - Math.floor(i / A.cols) / A.rows, v0 = v1 - 1 / A.rows;
            const uv = geo.attributes.uv; for (let k = 0; k < uv.count; k++) uv.setXY(k, uv.getX(k) ? u1 : u0, uv.getY(k) ? v1 : v0);
            const m = new THREE.Mesh(geo, signMaterial()); m.position.set(x, y, z); m.rotation.y = rotY; m.name = 'senal-' + type; scene.add(m); return m;
        }

function buildWarehouseProps() { const hw = WAREHOUSE.w / 2, hd = WAREHOUSE.d / 2, h = WAREHOUSE.h; const C = x => new THREE.Color(x).convertSRGBToLinear(); const grp = new THREE.Group(); grp.name = 'props';
            const M = (c, o) => new THREE.MeshStandardMaterial(Object.assign({ color: C(c), roughness: .6, metalness: .2 }, o || {})); const steel = M(0x2b3a66, { metalness: .5, roughness: .45 }), yel = M(0xf5c400, { roughness: .5 }), duct = M(0xc9ced6, { metalness: .7, roughness: .3 }), dk = M(0x30343b);
            const add = (geo, mat, x, y, z, ry) => { const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); if (ry) m.rotation.y = ry; m.castShadow = false; m.receiveShadow = true; grp.add(m); return m; };   /* sin sombra proyectada: ahorra el pase de sombras */
            for (let z = -hd + 10; z < hd - 6; z += 10) [-1, 1].forEach(sd => { const x = sd * (hw - 0.45); add(new THREE.BoxGeometry(0.32, h, 0.32), steel, x, h / 2, z); add(new THREE.BoxGeometry(0.42, 0.04, 0.42), dk, x, 0.02, z); add(new THREE.BoxGeometry(0.46, 0.9, 0.46), yel, x, 0.45, z); });   // columnas perimetrales con protector
            [-12, 12].forEach(x => { const d = add(new THREE.CylinderGeometry(0.42, 0.42, WAREHOUSE.d - 6, 20, 1, true), duct, x, h - 1.3, 0); d.rotation.x = Math.PI / 2; for (let z = -hd + 6; z < hd - 4; z += 6) { add(new THREE.BoxGeometry(0.03, 0.9, 0.03), dk, x, h - 0.45, z); const v = add(new THREE.CylinderGeometry(0.18, 0.3, 0.25, 14), duct, x, h - 1.85, z); } });   // ductos de inyección de aire con difusores
            const wood = new THREE.MeshStandardMaterial({ map: woodTex(), roughness: .9 }); [[-26, -43.2, 9], [-24.6, -43.2, 6], [-26, -41.8, 4]].forEach(([x, z, n]) => { for (let k = 0; k < n; k++) add(palletGeometry(), wood, x, 0.072 + k * 0.146, z, (k % 2) * 0.02); });   // tarimas vacías estibadas
            [[-21, 0x1e6fd8, 'PAPEL'], [-19.8, 0x2e9e5b, 'PLÁSTICO'], [-18.6, 0x8a8f99, 'BASURA'], [-17.4, 0xc8102e, 'RPBI']].forEach(([x, col, t]) => { add(new THREE.BoxGeometry(1.0, 1.1, 0.8), M(col, { roughness: .5 }), x, 0.55, -43.8); const l = new THREE.Mesh(new THREE.PlaneGeometry(0.8, 0.22), new THREE.MeshBasicMaterial({ map: makeTextTexture([{ text: t, size: 70, color: '#fff' }], { w: 320, h: 90, bg: '#011131' }) })); l.position.set(x, 0.85, -43.39); grp.add(l); });   // contenedores de separación de residuos
            // (la estación de carga de baterías se movió a su propio cuarto cercado: buildChargeRoom)   // estación lavaojos (manejo de baterías)
            mergeStaticMeshes(grp); scene.add(grp); obstacles.push({ minX: -27, maxX: -16.8, minZ: -44.5, maxZ: -41.2 }); }

function setPickLoad(P) { const k = Math.min(1, P.picks / 6); P.ld.visible = k > 0; P.ld.scale.y = P.ld.userData.sy * Math.max(.05, k); P.ld.position.y = P.ld.userData.y0 - (1 - k) * .45; }

function chargeScreen(k) { const sc = CHARGE.scr[k]; if (!sc) return; const st = CHARGE.st[k], p = Math.round(CHARGE.pct[k] ?? 100), key = st + p; if (CHARGE.lastScr[k] === key) return; CHARGE.lastScr[k] = key;
            const lines = st === 'on' ? [{ text: p >= 100 ? 'LISTO' : 'CARGANDO', size: 40, color: p >= 100 ? '#33ff77' : '#ffb020' }, { text: p + '%', size: 40, color: '#fff' }] : [{ text: 'APAGADO', size: 40, color: '#ff6b6b' }, { text: p + '%', size: 34, color: '#9fb0ff' }];
            if (sc.material.map) sc.material.map.dispose(); sc.material.map = makeTextTexture(lines, { w: 256, h: 120, bg: '#04121f' }); sc.material.needsUpdate = true; }

function chargeUpdate(dt, now) { const R = CHARGE.room; if (!R) return; [0, 1].forEach(k => { if (CHARGE.st[k] === 'on' && CHARGE.cable[k] && CHARGE.cable[k].visible) CHARGE.pct[k] = Math.min(100, (CHARGE.pct[k] || 0) + dt * .9); chargeScreen(k); });
            CHARGE.crew.forEach(c => { const op = c.op, av = c.av; if (!av) return; c.t += dt;
                if (c.path.length) { const tg = c.path[0], dx = tg[0] - op.position.x, dz = tg[1] - op.position.z, d = Math.hypot(dx, dz), sp = 1.15 * dt; c.w += dt * 6;
                    if (d <= sp) { op.position.x = tg[0]; op.position.z = tg[1]; c.path.shift(); if (!c.path.length) c.t = 0; } else { op.position.x += dx / d * sp; op.position.z += dz / d * sp; let dr = Math.atan2(dx, dz) - op.rotation.y; dr = Math.atan2(Math.sin(dr), Math.cos(dr)); op.rotation.y += dr * Math.min(1, dt * 8); }
                    gltfWalkPose(av, true, c.w, now, false, 0); return; }
                gltfWalkPose(av, false, c.w, now, false, 0); const x = R.chX[c.k], z1 = R.z1, inG = [R.gate[0] + 1.6, R.z0 - 1.6], outG = [R.gate[0] + 1.6, R.z0 + 1.4], ppe = [R.ppe.x, R.ppe.z], side = [x + .95, z1 + 1.75], work = [16 + c.k * 4.5, R.z0 + 5.5];
                const scr = new THREE.Vector3(x, 1.6, z1 + .75), plug = new THREE.Vector3(x + .62, .8, z1 + 1.75), face = (tx, tz) => { let dr = Math.atan2(tx - op.position.x, tz - op.position.z) - op.rotation.y; dr = Math.atan2(Math.sin(dr), Math.cos(dr)); op.rotation.y += dr * Math.min(1, dt * 6); };
                const reach = v => { op.updateMatrixWorld(true); ikReach(av, 'Right', v, 6); };
                const go = (task, pts) => { c.task = task; c.path = pts; c.t = 0; };
                switch (c.task) {
                  case 'work': if (c.t > 18 + c.k * 6) go('toPPE', [outG, inG, ppe]); break;   // labora en el almacén y regresa
                  case 'toPPE': face(R.ppe.x, R.ppe.z + 1); reach(new THREE.Vector3(R.ppe.x, 1.3, R.z0 - .45)); if (c.t > 2) { if (c.visor) c.visor.visible = true; go(CHARGE.st[c.k] === 'on' ? 'toOff' : 'toCheck', [side]); } break;   // se pone careta y guantes
                  case 'toCheck': case 'toOff': face(x, z1); reach(scr); if (c.t > 2) { if (c.task === 'toOff') { CHARGE.st[c.k] = 'off'; c.task = 'unplug'; } else c.task = 'plug'; c.t = 0; } break;   // verifica / apaga el cargador
                  case 'plug': face(plug.x, plug.z); reach(plug); if (c.t > 2.5) { if (CHARGE.cable[c.k]) CHARGE.cable[c.k].visible = true; if (CHARGE.hang[c.k]) CHARGE.hang[c.k].visible = false; c.task = 'switchOn'; c.t = 0; } break;   // conecta el cable a la batería
                  case 'switchOn': face(x, z1); reach(scr); if (c.t > 1.5) { CHARGE.st[c.k] = 'on'; go('toPPEout', [ppe]); } break;   // enciende el cargador
                  case 'unplug': face(plug.x, plug.z); reach(plug); if (c.t > 2.5) { if (CHARGE.cable[c.k]) CHARGE.cable[c.k].visible = false; if (CHARGE.hang[c.k]) CHARGE.hang[c.k].visible = true; if ((CHARGE.pct[c.k] || 0) >= 100) CHARGE.pct[c.k] = 20 + Math.random() * 30; go('toPPEout', [ppe]); } break;   // desconecta (la batería se lleva a operar)
                  case 'toPPEout': face(R.ppe.x, R.ppe.z + 1); reach(new THREE.Vector3(R.ppe.x, 1.3, R.z0 - .45)); if (c.t > 1.5) { if (c.visor) c.visor.visible = false; go('work', [inG, outG, work]); } break;   // guarda EPP y regresa a laborar
                } }); }

function ikReach(av, sd, target, iters = 12) { const arm = av.obj.getObjectByName(sd + 'Arm'), fore = av.obj.getObjectByName(sd + 'ForeArm'), hand = av.obj.getObjectByName(sd + 'Hand'); if (!arm || !fore || !hand) return;
            for (let it = 0; it < iters; it++) [fore, arm].forEach(b => { av.obj.updateMatrixWorld(true); const bp = b.getWorldPosition(new THREE.Vector3()), hp = hand.getWorldPosition(new THREE.Vector3()); const v1 = hp.sub(bp), v2 = target.clone().sub(bp); if (v1.lengthSq() < 1e-8 || v2.lengthSq() < 1e-8) return;
                const q = new THREE.Quaternion().setFromUnitVectors(v1.normalize(), v2.normalize()); const bw = b.getWorldQuaternion(new THREE.Quaternion()), pw = b.parent.getWorldQuaternion(new THREE.Quaternion()); b.quaternion.copy(pw.invert().multiply(q.multiply(bw))); }); av.obj.updateMatrixWorld(true); }

function buildChargeRoom() { const hd = WAREHOUSE.d / 2, A = CHARGE_ANNEX, z0 = -hd, z1 = -hd - A.depth, xc = (A.x0 + A.x1) / 2, zc = (z0 + z1) / 2, W = A.x1 - A.x0, H = 6.2; const g = new THREE.Group(); g.name = 'chargeRoom';
            const M = (c, o) => new THREE.MeshStandardMaterial(Object.assign({ color: c, roughness: .7 }, o || {})); const box = (w, hh, d, m, x, y, z) => { const b = new THREE.Mesh(new THREE.BoxGeometry(w, hh, d), m); b.position.set(x, y, z); g.add(b); return b; };
            const T = (lines, w, h, bg) => new THREE.MeshBasicMaterial({ map: makeTextTexture(lines, { w, h, bg }), side: THREE.FrontSide });
            const floor = new THREE.Mesh(new THREE.PlaneGeometry(W, A.depth), M(0x8f969e, { roughness: .9 })); floor.rotation.x = -Math.PI / 2; floor.position.set(xc, .004, zc); g.add(floor);
            const resin = new THREE.Mesh(new THREE.PlaneGeometry(W - 1, 4.2), M(0x2f6b4a, { roughness: .4 })); resin.rotation.x = -Math.PI / 2; resin.position.set(xc, .006, z1 + 2.6); g.add(resin);   // piso epóxico antiácido bajo los cargadores
            const wall = M(0xe4e7ec, { roughness: .9 }), navy = M(BRAND.marino); box(W + .4, H, .4, wall, xc, H / 2, z1); [A.x0, A.x1].forEach(x => box(.4, H, A.depth, wall, x, H / 2, zc)); box(W + .4, 1.2, .45, navy, xc, .6, z1 + .02); [A.x0, A.x1].forEach(x => box(.45, 1.2, A.depth, navy, x, .6, zc));
            const roof = new THREE.Mesh(new THREE.PlaneGeometry(W, A.depth), M(0xcfd5de, { side: THREE.DoubleSide })); roof.rotation.x = Math.PI / 2; roof.position.set(xc, H, zc); g.add(roof);
            const lamp = M(0xffffff, { emissive: new THREE.Color(0xfff6e0), emissiveIntensity: 1 }); for (let x = A.x0 + 3; x < A.x1 - 1; x += 5) for (let z = z0 - 3; z > z1; z -= 4) box(1.2, .05, .3, lamp, x, H - .05, z);
            obstacles.push({ minX: A.x0 - .3, maxX: A.x1 + .3, minZ: z1 - 3, maxZ: z1 + .3 }); obstacles.push({ minX: A.x0 - 1, maxX: A.x0 + .3, minZ: z1, maxZ: z0 }); obstacles.push({ minX: A.x1 - .3, maxX: A.x1 + 1, minZ: z1, maxZ: z0 });
            // malla ciclónica con postes galvanizados, barra superior y portón corredizo (abierto) para que entren los montacargas
            const mesh = makeTextTexture([], { w: 4, h: 4, bg: '#000' }); const cl = document.createElement('canvas'); cl.width = cl.height = 64; { const q = cl.getContext('2d'); q.strokeStyle = '#c9ced6'; q.lineWidth = 3; q.beginPath(); q.moveTo(0, 32); q.lineTo(32, 0); q.lineTo(64, 32); q.lineTo(32, 64); q.closePath(); q.moveTo(0, 0); q.lineTo(0, 0); q.stroke(); q.strokeStyle = '#9aa0a8'; q.lineWidth = 2; q.beginPath(); q.moveTo(32, 0); q.lineTo(64, 32); q.stroke(); }
            const mt = new THREE.CanvasTexture(cl); mt.wrapS = mt.wrapT = THREE.RepeatWrapping; const galv = M(0xb8bec6, { metalness: .8, roughness: .35 }), FH = 2.6, fz = z0 - .35;
            const fenceSeg = (xa, xb) => { const L = xb - xa; if (L <= .05) return; const t = mt.clone(); t.needsUpdate = true; t.repeat.set(L / .12, FH / .12); const p = new THREE.Mesh(new THREE.PlaneGeometry(L, FH), new THREE.MeshStandardMaterial({ map: t, alphaTest: .4, transparent: false, side: THREE.DoubleSide, metalness: .6, roughness: .4, color: 0xdfe3e8 })); p.position.set((xa + xb) / 2, FH / 2 + .05, fz); g.add(p);
                const r = new THREE.Mesh(new THREE.CylinderGeometry(.03, .03, L, 8), galv); r.rotation.z = Math.PI / 2; r.position.set((xa + xb) / 2, FH + .05, fz); g.add(r); for (let x = xa; x <= xb + .01; x += Math.max(.5, L / Math.ceil(L / 2.5))) { const po = new THREE.Mesh(new THREE.CylinderGeometry(.045, .045, FH + .15, 10), galv); po.position.set(x, (FH + .15) / 2, fz); g.add(po); }
                obstacles.push({ minX: xa, maxX: xb, minZ: fz - .15, maxZ: fz + .15 }); };
            fenceSeg(A.x0 + .2, A.gate[0]); fenceSeg(A.gate[1], A.x1 - .2);
            { const t = mt.clone(); t.needsUpdate = true; t.repeat.set(3.3 / .12, FH / .12); const gt = new THREE.Group(); const p = new THREE.Mesh(new THREE.PlaneGeometry(3.3, FH), new THREE.MeshStandardMaterial({ map: t, alphaTest: .4, side: THREE.DoubleSide, metalness: .6, roughness: .4, color: 0xdfe3e8 })); gt.add(p); const fr = new THREE.Mesh(new THREE.BoxGeometry(3.4, .05, .05), galv); fr.position.y = FH / 2; gt.add(fr); const fr2 = fr.clone(); fr2.position.y = -FH / 2; gt.add(fr2); gt.position.set(A.gate[1] + 1.75, FH / 2 + .05, fz + .12); g.add(gt); }   // portón corredizo abierto
            paintLine(A.gate[0], z0 + .3, A.gate[1], z0 + .3, 0xf5c400, .1); paintLabel('ALTO · CARGA DE BATERÍAS', (A.gate[0] + A.gate[1]) / 2, z0 + 1.2, .5, '#f5c400', 0, 3.2);
            // señalización NOM-026-STPS / Protección Civil en la malla (hacia el pasillo)
            const signs = [[['PRECAUCIÓN', 'ZONA DE CARGA', 'DE BATERÍAS'], '#f5c400', '#111'], [['PROHIBIDO FUMAR', 'Y GENERAR FLAMA'], '#c62828', '#fff'], [['RIESGO ELÉCTRICO'], '#f5c400', '#111'], [['PRECAUCIÓN', 'MATERIAL CORROSIVO', '(ÁCIDO SULFÚRICO)'], '#f5c400', '#111'], [['USO OBLIGATORIO', 'CARETA · GUANTES', 'MANDIL'], '#1e5aa8', '#fff'], [['GAS HIDRÓGENO', 'VENTILACIÓN', 'OBLIGATORIA'], '#f5c400', '#111'], [['SOLO PERSONAL', 'AUTORIZADO'], '#c62828', '#fff']];
            const sx = [A.x0 + .85, 23.55, 24.55, 25.55, 26.55, 27.55, 28.5]; signs.forEach(([lines, bg, col], i) => { const sg = new THREE.Mesh(new THREE.PlaneGeometry(.92, .64), T(lines.map(t => ({ text: t, size: 40, color: col })), 512, 400, bg)); sg.position.set(sx[i], 1.85, fz + .06); g.add(sg); });   // solo hacia el pasillo (desde dentro se ve el reverso liso)
            const big = new THREE.Mesh(new THREE.PlaneGeometry(6, 1), T([{ text: '⚡ ZONA DE CARGA DE BATERÍAS', size: 70, color: '#111' }], 1024, 170, '#f5c400')); big.position.set(xc, 4.6, z0 + .3); g.add(big);
            // cargadores en el muro, regadera-lavaojos, extractor, kit antiderrames y extintor
            const cab = M(0x30343b, { metalness: .4 }), orange = M(0xff7a00), red = M(0xc8102e);
            const chX = [A.x0 + 3.2, A.x0 + 7.4, A.x0 + 11.6]; chX.forEach((x, k) => { box(.8, 1.3, .5, cab, x, 1.3, z1 + .45); const sc = new THREE.Mesh(new THREE.PlaneGeometry(.42, .2), T([{ text: k < 2 ? 'CARGANDO' : 'LISTO', size: 40, color: k < 2 ? '#ffb020' : '#33ff77' }, { text: k === 0 ? '45%' : k === 1 ? '78%' : '100%', size: 40, color: '#fff' }], 256, 120, '#04121f')); sc.position.set(x, 1.6, z1 + .71); g.add(sc); CHARGE.scr[k] = sc; box(.06, .06, .3, M(0x111111), x, .65, z1 + .7); });
            box(.9, .02, .9, M(0x2e9e5b), A.x1 - 1.2, 2.6, z1 + .8); box(.06, 2.6, .06, M(0x2e9e5b), A.x1 - 1.2, 1.3, z1 + .4); box(.4, .25, .3, M(0x2e9e5b), A.x1 - 1.2, 1.1, z1 + .65); const ew = new THREE.Mesh(new THREE.PlaneGeometry(.9, .45), T([{ text: 'REGADERA Y', size: 40, color: '#fff' }, { text: 'LAVAOJOS', size: 40, color: '#fff' }], 256, 128, '#007A33')); ew.position.set(A.x1 - 1.2, 3.0, z1 + .25); g.add(ew);
            { const fan = new THREE.Mesh(new THREE.CylinderGeometry(.45, .45, .2, 24), M(0x9aa0a8, { metalness: .6 })); fan.rotation.x = Math.PI / 2; fan.position.set(A.x0 + 5.3, 4.6, z1 + .3); g.add(fan); const fl = new THREE.Mesh(new THREE.PlaneGeometry(1.1, .3), T([{ text: 'EXTRACTOR H2', size: 40, color: '#fff' }], 256, 70, '#1e5aa8')); fl.position.set(A.x0 + 5.3, 3.95, z1 + .25); g.add(fl); }
            box(.6, .8, .6, M(0xf5c400), A.x0 + .9, .4, z1 + 1.0); const sk = new THREE.Mesh(new THREE.PlaneGeometry(.55, .3), T([{ text: 'KIT ANTI-', size: 34, color: '#111' }, { text: 'DERRAMES', size: 34, color: '#111' }], 200, 110, '#f5c400')); sk.position.set(A.x0 + .9, .6, z1 + 1.31); g.add(sk);
            if (typeof makeExtinguisher === 'function') try { makeExtinguisher(A.x0 + .28, z1 + 3.2, Math.PI / 2); addSign('extintor', A.x0 + .27, 2.5, z1 + 3.2, Math.PI / 2); } catch (e) { }
            g.traverse(o => { if (o.isMesh) { o.castShadow = false; o.receiveShadow = true; } }); scene.add(g);
            // montacargas Raymond (mismo modelo que manejan los operarios) estacionados y conectados
            const parked = [];
            const parkForks = () => { if (typeof npcForklift !== 'function' || typeof NPC === 'undefined') return false; [chX[0], chX[1]].forEach((x, k) => { const n0 = NPC.forks.length; npcForklift('C' + (k + 1), [[x, z1 + 2.7], [x, z1 + 2.71]], 0); const f = NPC.forks.splice(n0, 1)[0]; if (!f) return; f.g.position.set(x, 0, z1 + 2.75); f.g.rotation.y = 0;
                    const rm = []; f.g.traverse(c => { if (c !== f.g && c.userData && (c.userData.gltf || c.userData.standing || c.userData.human || c.name === 'operator' || c.name === 'npcOp' || (c.parent === f.g && c.getObjectByName('armL')))) rm.push(c); }); rm.forEach(c => c.parent && c.parent.remove(c)); f.g.traverse(c => { if (c.isSkinnedMesh) c.visible = false; });   // sin operador: está cargando if (f.beacon) f.beacon.material = M(0x553300);
                    const cable = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3([new THREE.Vector3(x + .25, .65, z1 + .85), new THREE.Vector3(x + .5, .08, z1 + 1.15), new THREE.Vector3(x + .62, .08, z1 + 1.6), new THREE.Vector3(x + .6, .75, z1 + 1.75)]), 24, .022, 6), orange); scene.add(cable); CHARGE.cable[k] = cable; const hang = new THREE.Mesh(new THREE.TorusGeometry(.16, .022, 6, 20), orange); hang.position.set(x + .25, .9, z1 + .74); hang.visible = false; scene.add(hang); CHARGE.hang[k] = hang; CHARGE.pct[k] = k ? 78 : 45;
                    obstacles.push({ minX: x - .7, maxX: x + .7, minZ: z1 + .4, maxZ: z1 + 5.2 }); parked.push({ x }); }); return true; };
            // personal de carga con rutina de protocolo (se mueve: EPP → verifica → conecta → enciende → regresa a laborar → apaga → desconecta)
            CHARGE.room = { x0: A.x0, z0, z1, chX, gate: A.gate, ppe: new THREE.Vector3(A.x0 + 1.6, 0, z0 - 1.3) };
            { const ppeCab = new THREE.Group(); const cb = new THREE.Mesh(new THREE.BoxGeometry(.8, 1.7, .45), M(0x1e5aa8)); cb.position.y = .85; ppeCab.add(cb); const lb = new THREE.Mesh(new THREE.PlaneGeometry(.7, .35), T([{ text: 'EPP', size: 50, color: '#fff' }, { text: 'careta · guantes · mandil', size: 22, color: '#fff' }], 256, 128, '#1e5aa8')); lb.position.set(0, 1.35, .231); ppeCab.add(lb); ppeCab.position.set(A.x0 + 1.6, 0, z0 - .65); ppeCab.rotation.y = Math.PI; scene.add(ppeCab); obstacles.push({ minX: A.x0 + 1.15, maxX: A.x0 + 2.05, minZ: z0 - .95, maxZ: z0 - .35 }); }
            const crew = () => { if (typeof makeStandingOperator !== 'function' || !GLTF_AVATAR.ok) return false; [0, 1].forEach(k => { try { const op = makeStandingOperator(false); scene.add(op); const av = op.userData.gltf; let visor = null; const head = av && av.obj.getObjectByName('Head');
                    if (head) { visor = new THREE.Mesh(new THREE.SphereGeometry(.13, 16, 8, -Math.PI / 2, Math.PI, 0, Math.PI * .6), new THREE.MeshStandardMaterial({ color: 0xbfe6ff, transparent: true, opacity: .35, roughness: .05, side: THREE.DoubleSide })); av.obj.updateMatrixWorld(true); const ws = head.getWorldScale(new THREE.Vector3()); visor.scale.setScalar(1 / ws.x); visor.position.set(0, .06 / ws.x, .06 / ws.x); visor.visible = false; head.add(visor); }
                    const c = { k, op, av, visor, w: 0, path: [], step: 0, t: k * 9, task: k ? 'work' : 'work' }; op.position.set(18 + k * 2.5, 0, z0 + 4 + k); CHARGE.crew.push(c); } catch (e) { console.warn('[SIM] carga:', e.message); } }); return true; };
            const tryAll = () => { const a = parked.length || parkForks(), b = crew(); return a && b; }; if (!tryAll()) { let tries = 0; const t = setInterval(() => { tries++; if ((parked.length || parkForks()) && (crew() || tries > 40)) clearInterval(t); }, 1500); } }

function officeUpdate(dt, now) { try { dojoUpdate(dt, now); } catch (e) { } try { chargeUpdate(dt, now); } catch (e) { } try { wrapUpdate(dt, now); } catch (e) { } try { pickUpdate(dt, now); } catch (e) { } if (!OFFICE_WORKERS.length) return; const hd = WAREHOUSE.d / 2;
            OFFICE_WORKERS.forEach(wk => { wk.t += dt;
                if (wk.state === 'type') { const k = wk.fast > 0 ? 1.6 : 1; wk.fast = Math.max(0, (wk.fast || 0) - dt); wk.typing.forEach((o, i) => { o.b.quaternion.copy(o.q); o.b.rotateX(Math.sin(now * .022 * k + wk.ph + i * 1.7) * (i < 2 ? .16 : .035) * (Math.sin(now * .0011 + wk.ph) > -.3 ? 1 : 0)); });
                  if (wk.walker && wk.t > wk.dur) { const sd = wk.sd, st = wk.st; wk.path = [[st.x - sd * .3, st.z + .5], [sd * 8.0, st.z + .5], [sd * 8.0, -hd - .9], [sd * 9.3, -hd - 1.0]]; wk.pi = 0; wk.state = 'out'; wk.seat.visible = false; const W = wk.walker; W.g.visible = true; W.folder.visible = false; W.g.position.set(wk.path[0][0], 0, wk.path[0][1]); } return; }
                const W = wk.walker; if (!W) return; W.w += dt * 6;
                if (wk.state === 'pick') { gltfWalkPose(W.av, false, W.w, now, false, 0); if (wk.t > 3) { W.folder.visible = true; wk.path = wk.path.slice().reverse(); wk.pi = 0; wk.state = 'back'; } return; }
                const tgt = wk.path[wk.pi + 1]; if (!tgt) { if (wk.state === 'out') { wk.state = 'pick'; wk.t = 0; W.g.rotation.y = wk.sd > 0 ? Math.PI / 2 : -Math.PI / 2; } else { W.g.visible = false; wk.seat.visible = true; wk.state = 'type'; wk.t = 0; wk.dur = 18 + Math.random() * 25; wk.fast = 10; } return; }
                const dx = tgt[0] - W.g.position.x, dz = tgt[1] - W.g.position.z, d = Math.hypot(dx, dz), sp = 1.1 * dt; if (d <= sp) { W.g.position.set(tgt[0], 0, tgt[1]); wk.pi++; } else { W.g.position.x += dx / d * sp; W.g.position.z += dz / d * sp; }
                const ry = Math.atan2(dx, dz); let dr = ry - W.g.rotation.y; dr = Math.atan2(Math.sin(dr), Math.cos(dr)); W.g.rotation.y += dr * Math.min(1, dt * 8); gltfWalkPose(W.av, true, W.w, now, false, 0); }); }

function buildDojo(g, A, z0, z1, M, box) { const zb = z1 + .3, zf = z1 + 6.6, T = (lines, w, h, bg) => new THREE.MeshBasicMaterial({ map: makeTextTexture(lines, { w, h, bg }) });
            const mat = new THREE.Mesh(new THREE.PlaneGeometry(8.6, 6.1), M(0x1D2586, { roughness: .9 })); mat.rotation.x = -Math.PI / 2; mat.position.set(0, .008, (zb + zf) / 2); g.add(mat);   // tapete azul del dojo
            const fl = new THREE.Mesh(new THREE.PlaneGeometry(4, .9), new THREE.MeshBasicMaterial({ map: makeTextTexture([{ text: 'DOJO DICKA', size: 90, color: '#f5c400' }], { w: 1024, h: 200, bg: '#1D2586' }) })); fl.rotation.x = -Math.PI / 2; fl.position.set(0, .012, zf - .6); g.add(fl);
            box(3.4, 1.4, .06, M(0xf7f7f4, { roughness: .3 }), 0, 1.75, zb + .05); box(3.55, .06, .12, M(0x9aa0a8), 0, 1.02, zb + .1);   // pizarrón blanco con charola
            const wb = new THREE.Mesh(new THREE.PlaneGeometry(3.3, 1.3), T([{ text: 'DOJO DICKA', size: 64, color: '#1D2586' }, { text: '1. Inspección pre-operativa', size: 40, color: '#c8102e' }, { text: '2. Capacidad de carga y centro de gravedad', size: 40, color: '#111' }, { text: '3. Tránsito seguro: 10 km/h · peatón primero', size: 40, color: '#111' }], 1024, 400, '#f7f7f4')); wb.position.set(0, 1.75, zb + .085); g.add(wb);
            const head = new THREE.Mesh(new THREE.PlaneGeometry(5.5, 1.0), T([{ text: 'DOJO DICKA · CENTRO DE CAPACITACIÓN', size: 54, color: '#fff' }], 1200, 220, '#1D2586')); head.position.set(0, 3.4, zb + .02); g.add(head);
            [[-3.1, ['INSPECCIÓN', 'PRE-OPERATIVA', '✔ llantas ✔ horquillas', '✔ claxon ✔ frenos']], [3.1, ['REGLA DE ORO', 'Nunca transportes', 'personas en', 'las horquillas']]].forEach(([x, lines]) => { box(1.55, .92, .08, M(0x111111), x, 1.95, zb + .25); const sc = new THREE.Mesh(new THREE.PlaneGeometry(1.45, .82), T(lines.map((t, i) => ({ text: t, size: i ? 34 : 46, color: i ? '#fff' : '#f5c400' })), 512, 290, '#10233f')); sc.position.set(x, 1.95, zb + .3); g.add(sc); box(.08, 1.5, .08, M(0x333333), x, .75, zb + .3); box(.6, .04, .4, M(0x333333), x, .02, zb + .3); });   // pantallas en pedestal
            const chairs = []; [3.2, 4.4, 5.6].forEach(dz => [-2.7, -.9, .9, 2.7].forEach(x => { const z = z1 + dz; const cm = M(0x2b2e34); box(.46, .06, .46, cm, x, .46, z); box(.46, .5, .05, cm, x, .75, z + .23); [[-.2, -.2], [.2, -.2], [-.2, .2], [.2, .2]].forEach(([a, b]) => box(.03, .44, .03, M(0x9aa0a8), x + a, .22, z + b)); box(.32, .02, .24, M(0xb9a27c), x + .25, .66, z - .1); chairs.push({ x, z }); }));   // sillas con paleta
            // barrera para que el montacargas no entre al dojo (el frente del anexo queda libre para maniobrar)
            const post = M(0xf5c400, { metalness: .3, roughness: .45 }); [-4.3, 4.3].forEach(x => { for (let z = zf; z > zb; z -= 1.5) { const p = new THREE.Mesh(new THREE.CylinderGeometry(.05, .05, .9, 8), post); p.position.set(x, .45, z); g.add(p); } }); for (let x = -4.3; x <= 4.31; x += 1.075) { if (Math.abs(x) < .6) continue; const p = new THREE.Mesh(new THREE.CylinderGeometry(.05, .05, .9, 8), post); p.position.set(x, .45, zf); g.add(p); }
            [[-4.3, -.6], [.6, 4.3]].forEach(([a, b]) => { const r = new THREE.Mesh(new THREE.CylinderGeometry(.025, .025, b - a, 6), post); r.rotation.z = Math.PI / 2; r.position.set((a + b) / 2, .85, zf); g.add(r); });
            obstacles.push({ minX: -4.5, maxX: 4.5, minZ: z1, maxZ: zf + .2 });
            const people = () => { if (!GLTF_AVATAR.ok || !GLTF_AVATAR.clips.sit || typeof makeStandingOperator !== 'function') return false;
                chairs.forEach((c, i) => { if (i % 6 === 5) return; try { const av = makeGLTFAvatar(false); gltfPlay(av, 'sit', 0); av.mixer.update(.05); Object.values(av.acts || {}).forEach(a => { a.paused = true; }); const p = new THREE.Group(); p.add(av.obj); p.position.set(c.x, 0, c.z - .05); p.rotation.y = Math.PI; g.add(p); p.updateMatrixWorld(true);
                    ikReach(av, 'Right', new THREE.Vector3(c.x + .22, .72, c.z - .12)); ikReach(av, 'Left', new THREE.Vector3(c.x - .05, .66, c.z - .32));
                    const bones = ['Head', 'Neck', 'RightHand', 'RightForeArm', 'LeftArm', 'LeftForeArm', 'LeftHand'].map(n => av.obj.getObjectByName(n)).map(b => b ? { b, q: b.quaternion.clone() } : null); DOJO.students = DOJO.students || []; DOJO.students.push({ av, c, bones, ph: Math.random() * 6, look: 0 }); } catch (e) { } });   // alumnos sentados, mano sobre la paleta
                try { const op = makeStandingOperator(false); op.position.set(1.9, 0, zb + 1.5); op.rotation.y = 0; g.add(op); op.updateMatrixWorld(true); DOJO.inst = { op, av: op.userData.gltf, i: 2, t: 0, w: 0, state: 'talk',
                    stops: [[-1.9, zb + 1.5, new THREE.Vector3(-2.7, 1.95, zb + .32)], [0, zb + 1.7, new THREE.Vector3(.4, 1.9, zb + .1)], [1.9, zb + 1.5, new THREE.Vector3(2.7, 1.95, zb + .32)]] }; } catch (e) { }   // instructor: camina entre pantallas y pizarrón y las señala
                return true; };
            if (!people()) { let n = 0; const t = setInterval(() => { if (people() || ++n > 40) clearInterval(t); }, 1500); } }

function dojoUpdate(dt, now) { const I = DOJO.inst; if (I && I.av) { I.t += dt; const op = I.op, st = I.stops[I.i];
              if (I.state === 'talk') { gltfWalkPose(I.av, false, I.w, now, false, 0); const tgt = (Math.sin(now * .0015) > -.2) ? st[2] : new THREE.Vector3(op.position.x + .3, 1.35 + Math.sin(now * .004) * .12, op.position.z + .6); op.updateMatrixWorld(true); ikReach(I.av, 'Right', tgt, 6);   // señala o gesticula hacia el grupo
                const face = Math.atan2(0, 1) + (st[0] - st[2].x) * -.25; op.rotation.y += (face - op.rotation.y) * Math.min(1, dt * 3); if (I.t > 7 + Math.random() * .02) { I.state = 'walk'; I.t = 0; I.i = (I.i + 1 + (Math.random() < .5 ? 1 : 0)) % I.stops.length; } }
              else { const nx = I.stops[I.i]; const dx = nx[0] - op.position.x, dz = nx[1] - op.position.z, d = Math.hypot(dx, dz), sp = .9 * dt; I.w += dt * 6; if (d <= sp) { op.position.x = nx[0]; op.position.z = nx[1]; I.state = 'talk'; I.t = 0; } else { op.position.x += dx / d * sp; op.position.z += dz / d * sp; op.rotation.y += (Math.atan2(dx, dz) - op.rotation.y) * Math.min(1, dt * 8); } gltfWalkPose(I.av, true, I.w, now, false, 0); } }
            if (!DOJO.students) return; const ix = I ? I.op.position.x : 0; DOJO.raise = DOJO.raise || { k: -1, t: 6 }; const R = DOJO.raise; R.t -= dt; if (R.t <= 0) { R.k = R.k < 0 ? Math.floor(Math.random() * DOJO.students.length) : -1; R.t = R.k < 0 ? 8 + Math.random() * 8 : 3.5; }
            DOJO.students.forEach((S, i) => { const [head, neck, rh, rf, la, lf, lh] = S.bones; const want = Math.max(-.5, Math.min(.5, -(ix - S.c.x) * .18)); S.look += (want - S.look) * Math.min(1, dt * 2);   // miran al instructor
              if (head) { head.b.quaternion.copy(head.q); head.b.rotateY(S.look); head.b.rotateX(Math.sin(now * .0009 + S.ph) * .06 + (Math.sin(now * .0004 + S.ph) > .7 ? .25 : 0)); }   // asienten / bajan la vista a sus notas
              const writing = Math.sin(now * .0005 + S.ph * 2) > .3; if (rh) { rh.b.quaternion.copy(rh.q); if (writing) rh.b.rotateZ(Math.sin(now * .03 + S.ph) * .18); } if (rf) { rf.b.quaternion.copy(rf.q); if (writing) rf.b.rotateX(Math.sin(now * .015 + S.ph) * .04); }   // escriben en la paleta
              if (R.k === i && la) { if (!S.up) { S.up = true; S.av.obj.updateMatrixWorld(true); const hp = S.av.obj.getObjectByName('Head').getWorldPosition(new THREE.Vector3()); ikReach(S.av, 'Left', hp.add(new THREE.Vector3(-.12, .45, 0)), 10); } }   // levanta la mano para preguntar
              else if (S.up) { S.up = false; [la, lf, lh].forEach(o => o && o.b.quaternion.copy(o.q)); } }); }

function buildOfficeAnnex() { const hd = WAREHOUSE.d / 2, A = OFFICE_ANNEX, z0 = -hd, z1 = -hd - A.depth, zc = (z0 + z1) / 2, H = 6.2; const g = new THREE.Group(); g.name = 'officeAnnex';
            const M = (c, o) => new THREE.MeshStandardMaterial(Object.assign({ color: c, roughness: .7 }, o || {})); const box = (w, hh, d, m, x, y, z) => { const b = new THREE.Mesh(new THREE.BoxGeometry(w, hh, d), m); b.position.set(x, y, z); g.add(b); return b; };
            const floor = new THREE.Mesh(new THREE.PlaneGeometry(A.hw * 2, A.depth), M(0x9aa0a8, { roughness: .85 })); floor.rotation.x = -Math.PI / 2; floor.position.set(0, 0.004, zc); floor.receiveShadow = true; g.add(floor);
            const wall = M(0xe4e7ec, { roughness: .9 }), navy = M(BRAND.marino);
            box(A.hw * 2 + 0.5, H, 0.4, wall, 0, H / 2, z1); [-1, 1].forEach(sd => box(0.4, H, A.depth, wall, sd * A.hw, H / 2, zc));   // muros del anexo
            box(A.hw * 2 + 0.5, 1.2, 0.45, navy, 0, 0.6, z1 + 0.02); [-1, 1].forEach(sd => box(0.45, 1.2, A.depth, navy, sd * (A.hw - 0.02), 0.6, zc));   // zócalo
            const roof = new THREE.Mesh(new THREE.PlaneGeometry(A.hw * 2, A.depth), M(0xcfd5de, { side: THREE.DoubleSide })); roof.rotation.x = Math.PI / 2; roof.position.set(0, H, zc); g.add(roof);
            const lamp = M(0xffffff, { emissive: new THREE.Color(0xfff6e0), emissiveIntensity: 1 }); for (let x = -8; x <= 8; x += 8) for (let z = z0 - 3; z > z1; z -= 4.5) box(1.2, 0.05, 0.3, lamp, x, H - 0.05, z);   // luminarias
            // pasillo del montacargas: franjas amarillas y leyenda
            const yel = M(0xf5c400, { roughness: .6 }); [-1, 1].forEach(sd => box(0.12, 0.01, A.depth - 0.4, yel, sd * A.aisle, 0.012, zc));
            const lbl = new THREE.Mesh(new THREE.PlaneGeometry(7, 1.1), new THREE.MeshBasicMaterial({ map: makeTextTexture([{ text: 'ÁREA DE OFICINAS · 5 km/h', size: 64, color: '#f5c400' }], { w: 1024, h: 160, bg: '#20242c' }), transparent: true })); lbl.rotation.x = -Math.PI / 2; lbl.position.set(0, 0.015, z0 - 2.2); g.add(lbl);
            // guarda de seguridad: postes amarillos con barandal doble, con acceso peatonal
            const post = M(0xf5c400, { roughness: .45, metalness: .3 }), rail = M(0xf5c400, { roughness: .4, metalness: .5 });
            [-1, 1].forEach(sd => { const x = sd * (A.aisle + 0.35), za = z0 - 0.6, zb = z1 + 0.6, gate = zc + 0.6;
                for (let z = za; z >= zb - 0.01; z -= 1.5) { if (Math.abs(z - gate) < 0.8) continue; const p = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 1.1, 10), post); p.position.set(x, 0.55, z); g.add(p); const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 0.04, 10), M(0x111111)); cap.position.set(x, 1.12, z); g.add(cap); }
                [[za, gate + 0.85], [gate - 0.85, zb]].forEach(([a, b]) => [0.5, 1.0].forEach(y => { const r = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, Math.abs(a - b), 8), rail); r.rotation.x = Math.PI / 2; r.position.set(x, y, (a + b) / 2); g.add(r); }));
                [[za, gate + 0.85], [gate - 0.85, zb]].forEach(([a, b]) => obstacles.push({ minX: x - 0.15, maxX: sd > 0 ? A.hw + 1 : x + 0.15, minZ: Math.min(a, b), maxZ: Math.max(a, b) }));
                if (sd < 0) obstacles[obstacles.length - 1].minX = -A.hw - 1, obstacles[obstacles.length - 2].minX = -A.hw - 1;
                obstacles.push({ minX: sd > 0 ? x - 0.15 : -A.hw - 1, maxX: sd > 0 ? A.hw + 1 : x + 0.15, minZ: gate - 0.9, maxZ: gate + 0.9 });   // el acceso peatonal no admite montacargas
                const sg = new THREE.Mesh(new THREE.PlaneGeometry(0.6, 0.3), new THREE.MeshBasicMaterial({ map: makeTextTexture([{ text: 'SOLO PEATONES', size: 52, color: '#fff' }], { w: 320, h: 160, bg: '#1e6fd8' }) })); sg.position.set(x, 1.5, gate); sg.rotation.y = sd > 0 ? -Math.PI / 2 : Math.PI / 2; g.add(sg); });
            obstacles.push({ minX: -A.hw - 1, maxX: A.hw + 1, minZ: z1 - 3, maxZ: z1 + 0.3 }); obstacles.push({ minX: -A.hw - 1, maxX: -A.hw + 0.3, minZ: z1, maxZ: z0 }); obstacles.push({ minX: A.hw - 0.3, maxX: A.hw + 1, minZ: z1, maxZ: z0 });
            // mesas de control: escritorio, 2 monitores encendidos, teclado, CPU, silla; el personal se sienta cuando carga el modelo
            const wood = M(0xb9a27c, { roughness: .6 }), dark = M(0x1d2026, { roughness: .5 }), chairM = M(0x2b2e34, { roughness: .8 });
            const scr = t => new THREE.MeshBasicMaterial({ map: makeTextTexture(t, { w: 256, h: 150, bg: '#04121f' }) });
            const screens = [[{ text: 'WMS · OLAS', size: 30, color: '#8ff0b0' }, { text: 'Ola 14 · 82%', size: 26, color: '#9fb0ff' }], [{ text: 'INVENTARIO', size: 30, color: '#f5c400' }, { text: 'Exactitud 99.2%', size: 24, color: '#fff' }], [{ text: 'ANDENES', size: 30, color: '#8ff0b0' }, { text: 'A3 cargando', size: 26, color: '#fff' }], [{ text: 'CCTV', size: 34, color: '#ff6b6b' }, { text: '8 cámaras OK', size: 24, color: '#fff' }]];
            const seats = []; let k = 0;
            [-1, 1].forEach(sd => { for (let z = z0 - 2.2; z > z1 + 1.5; z -= 3.0) { const xd = sd * (A.hw - 1.0), face = sd < 0 ? -Math.PI / 2 : Math.PI / 2;   // escritorio pegado al muro, el personal mira hacia el muro
                    box(0.8, 0.05, 1.8, wood, xd, 0.75, z); [-0.8, 0.8].forEach(dz => box(0.7, 0.72, 0.05, dark, xd, 0.37, z + dz));   // cubierta y patas de panel
                    [-0.38, 0.38].forEach((dz, i) => { const mon = box(0.04, 0.34, 0.56, dark, xd + sd * 0.25, 1.05, z + dz); const sc = new THREE.Mesh(new THREE.PlaneGeometry(0.52, 0.3), scr(screens[(k + i) % 4])); sc.position.set(xd + sd * 0.225, 1.05, z + dz); sc.rotation.y = -face; g.add(sc); box(0.12, 0.12, 0.05, dark, xd + sd * 0.28, 0.83, z + dz); });
                    box(0.18, 0.02, 0.45, dark, xd - sd * 0.22, 0.785, z); box(0.45, 0.42, 0.2, dark, xd, 0.21, z + 0.6);   // teclado y CPU
                    const paper = M(0xf4f4f0, { roughness: .9 }); box(0.22, 0.04, 0.3, paper, xd - sd * 0.15, 0.795, z + 0.62); box(0.24, 0.015, 0.32, M(0x1e6fd8), xd - sd * 0.12, 0.783, z - 0.6); box(0.21, 0.004, 0.29, paper, xd - sd * 0.12, 0.792, z - 0.6);   // documentos sobre el escritorio
                    const cx = xd - sd * 0.75; box(0.5, 0.08, 0.5, chairM, cx, 0.48, z); box(0.08, 0.6, 0.48, chairM, cx - sd * 0.24, 0.85, z); box(0.06, 0.44, 0.06, dark, cx, 0.24, z);   // silla
                    seats.push({ x: cx + sd * 0.05, z, ry: face, fem: k % 2 === 1 }); k++; } });
            [-1, 1].forEach(sd => { box(.5, 1.3, .6, M(0x8a9099, { metalness: .4, roughness: .4 }), sd * 9.6, .65, z0 - .55); for (let d = 0; d < 4; d++) box(.42, .02, .02, M(0x2b2e34), sd * 9.6, .3 + d * .3, z0 - .86);   // archivero de 4 cajones
              box(.6, .75, .5, M(0xd9dde4), sd * 8.6, .375, z0 - .5); box(.48, .25, .4, M(0x3a3f47), sd * 8.6, .87, z0 - .5);   // mueble con impresora
              const nm = sd < 0 ? 'ÁREA ADMINISTRATIVA' : 'MESA DE CONTROL'; const hs = new THREE.Mesh(new THREE.PlaneGeometry(4.2, .8), new THREE.MeshBasicMaterial({ map: makeTextTexture([{ text: nm, size: 70, color: '#fff' }], { w: 1024, h: 196, bg: sd < 0 ? '#1D2586' : '#c8102e' }) })); hs.position.set(sd * 9.4, 3.4, zc); hs.rotation.y = -sd * Math.PI / 2; g.add(hs); const hs2 = hs.clone(); hs2.rotation.y += Math.PI; hs2.position.x += sd * .01; g.add(hs2);   // legible desde el pasillo y desde los escritorios   // letrero colgante de la zona
              [-1.4, 1.4].forEach(dz => { const c = new THREE.Mesh(new THREE.CylinderGeometry(.01, .01, H - 3.8, 4), M(0x333333)); c.position.set(sd * 9.4, 3.8 + (H - 3.8) / 2, zc + dz); g.add(c); }); });
            { const vw = new THREE.Group(); const feeds = ['ANDÉN 1', 'ANDÉN 3', 'PASILLO A', 'RACK P2', 'CARGA BAT.', 'STAGING', 'ACCESO', 'PATIO']; feeds.forEach((t, i) => { const sc = new THREE.Mesh(new THREE.PlaneGeometry(1.15, .66), new THREE.MeshBasicMaterial({ map: makeTextTexture([{ text: 'CAM ' + (i + 1), size: 34, color: '#8ff0b0' }, { text: t, size: 40, color: '#fff' }, { text: '● REC', size: 28, color: '#ff4d4d' }], { w: 256, h: 150, bg: i % 2 ? '#0b2a1d' : '#10233f' }) })); sc.position.set((i % 4 - 1.5) * 1.22, 2.05 + Math.floor(i / 4) * .72, .01); vw.add(sc); });
              const fr = new THREE.Mesh(new THREE.BoxGeometry(5.05, 1.6, .06), M(0x15181d)); fr.position.set(0, 2.41, -.04); vw.add(fr); vw.position.set(A.hw - .3, 0, zc); vw.rotation.y = -Math.PI / 2; g.add(vw); }   // video-wall de cámaras de la mesa de control
            buildDojo(g, A, z0, z1, M, box);
            g.traverse(o => { if (o.isMesh) { o.castShadow = false; o.receiveShadow = true; } }); scene.add(g);
            // personal sentado (operario con clip "sit" del modelo realista); se agrega cuando el modelo terminó de cargar
            const seatPeople = () => { if (!GLTF_AVATAR.ok || !GLTF_AVATAR.clips.sit) return false; seats.forEach((st, i) => { try { const av = makeGLTFAvatar(false); gltfPlay(av, 'sit', 0); av.mixer.update(0.05); Object.values(av.acts || {}).forEach(a => { a.paused = true; });
                    const p = new THREE.Group(); p.add(av.obj); p.position.set(st.x, 0.05, st.z); p.rotation.y = st.ry; p.name = 'officeWorker'; g.add(p);
                    p.updateMatrixWorld(true); { const sd = Math.sign(st.x), kb = new THREE.Vector3(st.x + sd * 0.48, 0.83, st.z); const ends = [kb.clone().add(new THREE.Vector3(0, 0, .12)), kb.clone().add(new THREE.Vector3(0, 0, -.12))]; const rh = av.obj.getObjectByName('RightHand');
                      const rp = rh ? rh.getWorldPosition(new THREE.Vector3()) : kb; const rFirst = rp.distanceTo(ends[0]) < rp.distanceTo(ends[1]); ikReach(av, 'Right', rFirst ? ends[0] : ends[1]); ikReach(av, 'Left', rFirst ? ends[1] : ends[0]); }   // manos sobre el teclado
                    const typing = ['RightHand', 'LeftHand', 'RightForeArm', 'LeftForeArm'].map(n => av.obj.getObjectByName(n)).filter(Boolean).map(b => ({ b, q: b.quaternion.clone() }));   // tecleo: muñecas y antebrazos
                    const wk = { seat: p, typing, st, sd: Math.sign(st.x), t: Math.random() * 10, dur: 14 + Math.random() * 20, state: 'type', ph: Math.random() * 6 };
                    if (i % 3 === 0) { const wa = makeGLTFAvatar(false); wa.mixer.stopAllAction(); wa.procedural = true; gltfPrepareBones(wa); const wg = new THREE.Group(); wg.add(wa.obj); wg.visible = false; g.add(wg);   // este puesto se levanta por documentos
                      const folder = new THREE.Mesh(new THREE.BoxGeometry(.24, .32, .03), new THREE.MeshStandardMaterial({ color: 0x1e6fd8, roughness: .6 })); folder.visible = false; const rhb = wa.obj.getObjectByName('RightHand'); if (rhb) { wa.obj.updateMatrixWorld(true); const ws = rhb.getWorldScale(new THREE.Vector3()); folder.scale.setScalar(1 / ws.x); folder.position.set(0, .1 / ws.x, .03 / ws.x); rhb.add(folder); } else { folder.position.set(.12, 1.05, .22); wg.add(folder); }   /* carpeta en la mano derecha */ wk.walker = { g: wg, av: wa, folder, w: 0 }; }
                    OFFICE_WORKERS.push(wk); } catch (e) { console.warn('[SIM] oficina:', e.message); } }); return true; };
            if (!seatPeople()) { const t = setInterval(() => { if (seatPeople()) clearInterval(t); }, 1500); } }

function rackMats() { if (RACK_MATS.up) return RACK_MATS; const C = h => new THREE.Color(h).convertSRGBToLinear();
            const c = document.createElement('canvas'); c.width = 32; c.height = 64; const g = c.getContext('2d'); g.fillStyle = '#1c2b4f'; g.fillRect(0, 0, 32, 64); g.fillStyle = '#05080f';
            [8, 40].forEach(y => { g.beginPath(); g.moveTo(12, y); g.lineTo(20, y); g.lineTo(18, y + 16); g.lineTo(14, y + 16); g.closePath(); g.fill(); });   // perforaciones tipo lágrima
            g.fillStyle = 'rgba(255,255,255,.12)'; g.fillRect(2, 0, 3, 64);
            const t = new THREE.CanvasTexture(c); t.encoding = THREE.sRGBEncoding; t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(1, 26); t.anisotropy = 4;
            RACK_MATS.up = new THREE.MeshStandardMaterial({ map: t, metalness: 0.3, roughness: 0.5 });
            RACK_MATS.beam = new THREE.MeshStandardMaterial({ color: C(0xea6a12), metalness: 0.25, roughness: 0.45 });
            RACK_MATS.brace = new THREE.MeshStandardMaterial({ color: C(0x1c2b4f), metalness: 0.3, roughness: 0.55 });
            RACK_MATS.steel = new THREE.MeshStandardMaterial({ color: C(0x8d939c), metalness: 0.7, roughness: 0.4 });
            RACK_MATS.plate = new THREE.MeshStandardMaterial({ color: C(0x2a2d33), metalness: 0.5, roughness: 0.6 });
            RACK_MATS.guard = new THREE.MeshStandardMaterial({ color: C(0xf5c400), roughness: 0.5 });
            const k = document.createElement('canvas'); k.width = 256; k.height = 320; const q = k.getContext('2d'); q.fillStyle = '#fff'; q.fillRect(0, 0, 256, 320); q.strokeStyle = '#111'; q.lineWidth = 8; q.strokeRect(4, 4, 248, 312);
            q.fillStyle = '#f5c400'; q.fillRect(8, 8, 240, 60); q.fillStyle = '#111'; q.textAlign = 'center'; q.font = 'bold 30px Arial'; q.fillText('CAPACIDAD', 128, 48);
            q.font = 'bold 22px Arial'; ['MÁX. POR NIVEL', '1,000 kg', 'CARGA UNIFORME', '', 'NO ESCALAR', 'REPORTAR DAÑOS'].forEach((l, i) => { q.font = i === 1 ? 'bold 46px Arial' : 'bold 22px Arial'; q.fillText(l, 128, 108 + i * 38 + (i > 1 ? 10 : 0)); });
            const mc = document.createElement('canvas'); mc.width = 256; mc.height = 72; const mq = mc.getContext('2d'); mq.fillStyle = '#e8601c'; mq.fillRect(0, 0, 256, 72); mq.fillStyle = '#fff'; mq.font = 'bold 40px Arial'; mq.textAlign = 'center'; mq.textBaseline = 'middle'; mq.fillText('MECALUX', 128, 38);
            const mt = new THREE.CanvasTexture(mc); mt.encoding = THREE.sRGBEncoding; RACK_MATS.maker = new THREE.MeshBasicMaterial({ map: mt });   // placa del fabricante (estilo Mecalux: bastidor azul, viga naranja)
            const wc = document.createElement('canvas'); wc.width = wc.height = 64; const wq = wc.getContext('2d'); wq.strokeStyle = '#b9c0c8'; wq.lineWidth = 3; for (let i = 0; i <= 64; i += 16) { wq.beginPath(); wq.moveTo(i, 0); wq.lineTo(i, 64); wq.stroke(); } wq.lineWidth = 2; for (let i = 0; i <= 64; i += 8) { wq.beginPath(); wq.moveTo(0, i); wq.lineTo(64, i); wq.stroke(); }
            const wt = new THREE.CanvasTexture(wc); wt.encoding = THREE.sRGBEncoding; wt.wrapS = wt.wrapT = THREE.RepeatWrapping; wt.anisotropy = 4; RACK_MATS.wire = new THREE.MeshStandardMaterial({ map: wt, metalness: 0.6, roughness: 0.4, alphaTest: 0.5, transparent: false, side: THREE.DoubleSide });   // parrilla electrosoldada galvanizada
            const kt = new THREE.CanvasTexture(k); kt.encoding = THREE.sRGBEncoding; RACK_MATS.cap = new THREE.MeshBasicMaterial({ map: kt });
            return RACK_MATS; }

function buildRack(x, zStart, bays, levels, facing, letter) {
            const bayW = 2.8, depth = 2.4, levelH = 1.8; const rackStatic = new THREE.Group(); const sceneAdd = scene.add.bind(scene); const scene_add_static = m => rackStatic.add(m);
            const RM = rackMats(); const upMat = RM.up;
            const beamMat = RM.beam; const braceMat = RM.brace;
            const deckMat = new THREE.MeshStandardMaterial({ color: BRAND.gris, metalness: 0.7, roughness: 0.4, wireframe: false });
            const palletMat = new THREE.MeshStandardMaterial({ color: 0xb08850, roughness: 0.9 });
            const boxMats = [0, 1, 2].map(v => cardboardMat(v));
            const totalH = levelH * levels + 0.5;
            for (let b = 0; b <= bays; b++) {
                const z = zStart + b * bayW;
                [-depth / 2, depth / 2].forEach(dx => {
                    const post = new THREE.Mesh(new THREE.BoxGeometry(0.1, totalH, 0.11), upMat);
                    post.position.set(x + dx, totalH / 2, z); post.castShadow = false; scene_add_static(post);
                    const bp = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.025, 0.18), RM.plate); bp.position.set(x + dx, 0.0125, z); scene_add_static(bp);   // placa base anclada
                    if (Math.sign(dx) === Math.sign(facing) && b > 0 && b < bays) { const pg = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.5, 0.22), rayMats().stripe); pg.position.set(x + dx + facing * 0.06, 0.25, z); scene_add_static(pg); }   // protector de poste del lado del pasillo
                });
                // Diagonales de arriostre
                // Marco del bastidor: travesaños horizontales por nivel y diagonales en X (en el plano del bastidor, a lo ancho del rack, delgados en Z)
                { const t0 = new THREE.Mesh(new THREE.BoxGeometry(depth, 0.05, 0.05), braceMat); t0.position.set(x, 0.18, z); scene_add_static(t0); }   // travesaño inferior del bastidor
                for (let l = 0; l < levels; l++) { const y0 = 0.5 + l * levelH; const tie = new THREE.Mesh(new THREE.BoxGeometry(depth, 0.05, 0.05), braceMat); tie.position.set(x, y0 + levelH / 2, z); scene_add_static(tie);
                    const dl = Math.hypot(depth, levelH); [l % 2 ? 1 : -1].forEach(sd => { const diag = new THREE.Mesh(new THREE.BoxGeometry(dl, 0.04, 0.04), braceMat); diag.position.set(x, y0 + levelH / 2, z); diag.rotation.z = sd * Math.atan2(levelH, depth); scene_add_static(diag); }); }
                // Protector de poste (amarillo)
                if (b === 0 || b === bays) { const ez = z + (b === 0 ? -0.35 : 0.35); const rail = new THREE.Mesh(new THREE.BoxGeometry(depth + 0.3, 0.16, 0.12), RM.guard); rail.position.set(x, 0.4, ez); scene_add_static(rail); [-1, 1].forEach(sd => { const pst = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.5, 0.12), RM.guard); pst.position.set(x + sd * (depth / 2 + 0.1), 0.25, ez); scene_add_static(pst); });   // defensa de cabecera
                    const mk = new THREE.Mesh(new THREE.PlaneGeometry(0.5, 0.14), RM.maker); mk.position.set(x - facing * (depth / 2 - 0.35), 1.2, z + (b === 0 ? -0.07 : 0.07)); mk.rotation.y = b === 0 ? Math.PI : 0; scene_add_static(mk);
                    const cap = new THREE.Mesh(new THREE.PlaneGeometry(0.42, 0.52), RM.cap); cap.position.set(x + facing * (depth / 2 - 0.3), 1.7, z + (b === 0 ? -0.07 : 0.07)); cap.rotation.y = b === 0 ? Math.PI : 0; scene_add_static(cap); }   // placa de capacidad de carga
            }
            for (let l = 0; l <= levels; l++) {
                const y = 0.5 + l * levelH;
                [-depth / 2, depth / 2].forEach(dx => { for (let b = 0; b <= bays; b++) [-1, 1].forEach(sz => { if ((b === 0 && sz < 0) || (b === bays && sz > 0)) return; const cn = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.2, 0.05), RM.plate); cn.position.set(x + dx, y, zStart + b * bayW + sz * 0.08); scene_add_static(cn); });   // conectores viga-poste con seguro
                    const beam = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.14, bays * bayW), beamMat);
                    beam.position.set(x + dx, y, zStart + bays * bayW / 2); scene_add_static(beam);
                });
                if (l < levels) {
                    { const dk = new THREE.Mesh(new THREE.PlaneGeometry(depth + 0.1, bays * bayW), RM.wire); dk.rotation.x = -Math.PI / 2; dk.position.set(x, y + 0.075, zStart + bays * bayW / 2); const uv = dk.geometry.attributes.uv; for (let k = 0; k < uv.count; k++) uv.setXY(k, uv.getX(k) * (depth + 0.1) * 2, uv.getY(k) * bays * bayW * 2); scene_add_static(dk); }   // parrilla de entrepaño
                    for (let b = 0; b < bays; b++) { const zc = zStart + b * bayW + bayW / 2; [-0.75, 0.75].forEach(o => { const bar = new THREE.Mesh(new THREE.BoxGeometry(depth, 0.035, 0.05), RM.steel); bar.position.set(x, y + 0.085, zc + o); scene_add_static(bar); }); }   // travesaños de soporte de tarima
                    // Tarimas con producto en cada bahía (aleatoriamente ocupadas)
                    for (let b = 0; b < bays; b++) {
                        const zc = zStart + b * bayW + bayW / 2;
                        // Doble profundidad: posición A (externa, hacia el pasillo) y B (interna, al fondo)
                        for (const pos of ['A', 'B']) { const dx = (pos === 'A' ? 0.6 : -0.6) * facing;
                            if (Math.random() < 0.25) continue;
                            const bh = 0.6 + Math.random() * 0.8;
                            RACK_INST.push({ x: x + dx, y, z: zc, bh, v: b % 3, facing, pos }); }
                    }
                }
            }
            // Letrero de ubicación en cabecera del rack
            const signT = makeTextTexture([{ text: `RACK ${letter}`, size: 120 }], { w: 512, h: 200, bg: '#011131' });
            // Placas de identificación por bahía: UNA franja por nivel y rack (textura con las 14 bahías) en vez de 84 placas → 6 mallas por rack
            for (let l = 0; l < levels; l++) { const c = document.createElement('canvas'); c.width = 2048; c.height = 96; const g = c.getContext('2d'); g.fillStyle = l === 0 ? '#f5c400' : '#1D2586'; g.fillRect(0, 0, c.width, c.height); g.textAlign = 'center'; g.textBaseline = 'middle';
                const cw = c.width / bays; for (let b = 0; b < bays; b++) { g.fillStyle = l === 0 ? '#011131' : '#ffffff'; g.font = '900 44px Arial'; const bi = facing > 0 ? bays - 1 - b : b; g.fillText(`R${letter}·M${String(b + 1).padStart(2, '0')}·N${l + 1}`, cw * (bi + 0.5), 48); g.fillStyle = 'rgba(0,0,0,.35)'; g.fillRect(cw * (b + 1) - 2, 0, 4, c.height); }   // del lado +X la textura corre hacia -Z: invertir el orden para que cada placa quede en su módulo
                const t = new THREE.CanvasTexture(c); t.anisotropy = 4; t.encoding = THREE.sRGBEncoding; const strip = new THREE.Mesh(new THREE.PlaneGeometry(bays * bayW, 0.27), new THREE.MeshBasicMaterial({ map: t })); strip.position.set(x + facing * (depth / 2 + 0.02), 0.5 + l * levelH + 0.35, zStart + bays * bayW / 2); strip.rotation.y = facing > 0 ? Math.PI / 2 : -Math.PI / 2; if (facing < 0) strip.scale.x = 1; scene.add(strip); }
            const sign = new THREE.Mesh(new THREE.PlaneGeometry(2.4, 0.9), new THREE.MeshBasicMaterial({ map: signT }));
            sign.position.set(x, totalH + 0.6, zStart + bays * bayW / 2); sign.rotation.y = facing > 0 ? Math.PI / 2 : -Math.PI / 2; scene.add(sign);
            obstacles.push({ minX: x - depth / 2 - 0.2, maxX: x + depth / 2 + 0.2, minZ: zStart - 0.2, maxZ: zStart + bays * bayW + 0.2 });
            // Fusión de la estructura del rack por material: cientos de postes/vigas → pocas mallas
            mergeStaticMeshes(rackStatic); rackStatic.traverse(o => { if (o.isMesh) { o.castShadow = false; o.receiveShadow = true; } }); scene.add(rackStatic);
        }

function flushRackInstances() {
            if (!RACK_INST.length) return;
            const dummy = new THREE.Object3D();
            // Tarimas (una malla de caja con textura madera)
            const palMesh = new THREE.InstancedMesh(palletGeometry('lite'), new THREE.MeshStandardMaterial({ map: woodTex(), roughness: 0.9 }), RACK_INST.length);
            palMesh.receiveShadow = true;
            RACK_INST.forEach((r, i) => { dummy.position.set(r.x, r.y + 0.14, r.z); dummy.rotation.set(0, Math.PI / 2, 0); dummy.scale.set(1, 1, 1); dummy.updateMatrix(); palMesh.setMatrixAt(i, dummy.matrix); r.palIdx = i; r.palMesh = palMesh; });
            scene.add(palMesh);
            // Cajas por variante de cartón (3 materiales → 3 draw calls)
            for (let v = 0; v < 3; v++) { const list = RACK_INST.filter(r => r.v === v); if (!list.length) continue;
                const m = new THREE.InstancedMesh(new THREE.BoxGeometry(0.95, 1, 1.1), unitLoadMat(v), list.length); m.castShadow = false; m.receiveShadow = true;
                list.forEach((r, i) => { dummy.position.set(r.x, r.y + 0.21 + r.bh / 2, r.z); dummy.rotation.set(0, 0, 0); dummy.scale.set(1, r.bh, 1); dummy.updateMatrix(); m.setMatrixAt(i, dummy.matrix); r.boxIdx = i; r.boxMesh = m; }); scene.add(m); }
            // Etiquetas azules DICKA (un solo InstancedMesh)
            const lbl = new THREE.InstancedMesh(new THREE.PlaneGeometry(0.5, 0.25), new THREE.MeshBasicMaterial({ color: BRAND.brillante }), RACK_INST.length);
            RACK_INST.forEach((r, i) => { if (r.pos === 'B') { lbl.setMatrixAt(i, zeroM); r.lblIdx = i; r.lblMesh = lbl; return; } dummy.position.set(r.x + r.facing * 0.49, r.y + 0.21 + r.bh / 2, r.z); dummy.rotation.set(0, r.facing > 0 ? Math.PI / 2 : -Math.PI / 2, 0); dummy.scale.set(1, 1, 1); dummy.updateMatrix(); lbl.setMatrixAt(i, dummy.matrix); r.lblIdx = i; r.lblMesh = lbl; });
            scene.add(lbl); RACK_SLOTS.push(...RACK_INST); RACK_INST.length = 0;
        }

function raymondTex(w, h, big) { const c = document.createElement('canvas'); c.width = w; c.height = h; const g = c.getContext('2d'); g.fillStyle = '#c8102e'; g.fillRect(0, 0, w, h); g.fillStyle = '#fff'; g.font = `900 ${big || Math.floor(h * 0.62)}px Arial Black, Arial`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('RAYMOND', w / 2, h / 2 + 2); const t = new THREE.CanvasTexture(c); t.anisotropy = 4; return t; }

function roundedBox(w, h, d, r) { r = Math.min(r, w / 2 - 0.001, h / 2 - 0.001); const s = new THREE.Shape(); const x = -w / 2, y = -h / 2;
            s.moveTo(x + r, y); s.lineTo(x + w - r, y); s.quadraticCurveTo(x + w, y, x + w, y + r); s.lineTo(x + w, y + h - r); s.quadraticCurveTo(x + w, y + h, x + w - r, y + h); s.lineTo(x + r, y + h); s.quadraticCurveTo(x, y + h, x, y + h - r); s.lineTo(x, y + r); s.quadraticCurveTo(x, y, x + r, y);
            const g = new THREE.ExtrudeGeometry(s, { depth: d - 0.04, bevelEnabled: true, bevelThickness: 0.02, bevelSize: 0.02, bevelSegments: 2, curveSegments: 4 }); g.translate(0, 0, -(d - 0.04) / 2); return g; }

function rayMats() { if (RAY_MATS.paint) return RAY_MATS;   // colores en sRGB → lineal: el renderer usa sRGBEncoding, sin conversión el rojo se ve rosa
            const C = h => new THREE.Color(h).convertSRGBToLinear();
            const nc = document.createElement('canvas'); nc.width = nc.height = 128; const ng = nc.getContext('2d'); const id = ng.createImageData(128, 128); for (let i = 0; i < id.data.length; i += 4) { const v = 150 + Math.random() * 60; id.data[i] = id.data[i + 1] = id.data[i + 2] = v; id.data[i + 3] = 255; } ng.putImageData(id, 0, 0); const flake = new THREE.CanvasTexture(nc); flake.wrapS = flake.wrapT = THREE.RepeatWrapping; flake.repeat.set(4, 4);
            RAY_MATS.paint = new (THREE.MeshPhysicalMaterial || THREE.MeshStandardMaterial)({ color: C(RAYMOND), metalness: 0.45, roughness: 0.32, roughnessMap: flake, clearcoat: 1.0, clearcoatRoughness: 0.08, envMapIntensity: 1.3 });   // lámina de acero pintada: pintura metálica con barniz (reflejos de la nave)   // pintura roja satinada (sin tono rosado)
            RAY_MATS.charcoal = new THREE.MeshStandardMaterial({ color: C(0x2a2c31), metalness: 0.75, roughness: 0.38, roughnessMap: flake, envMapIntensity: 1.1 });   // acero negro
            RAY_MATS.rubber = new THREE.MeshStandardMaterial({ color: C(0x0b0b0b), roughness: 0.95 });
            RAY_MATS.chrome = new THREE.MeshStandardMaterial({ color: C(0xd9dde3), metalness: 1.0, roughness: 0.18 });
            RAY_MATS.chain = new THREE.MeshStandardMaterial({ color: C(0x3b3b3b), metalness: 0.8, roughness: 0.5 });
            RAY_MATS.hose = new THREE.MeshStandardMaterial({ color: C(0x151515), roughness: 0.7 });
            RAY_MATS.lens = new THREE.MeshStandardMaterial({ color: C(0xffffff), emissive: C(0xfff4d6), emissiveIntensity: 0.9 });
            RAY_MATS.amber = new THREE.MeshStandardMaterial({ color: C(0xff8a00), emissive: C(0xff6a00), emissiveIntensity: 0.6 });
            const c = document.createElement('canvas'); c.width = 128; c.height = 16; const g = c.getContext('2d'); for (let i = 0; i < 8; i++) { g.fillStyle = i % 2 ? '#111' : '#f5c400'; g.beginPath(); g.moveTo(i * 16, 16); g.lineTo(i * 16 + 8, 0); g.lineTo(i * 16 + 24, 0); g.lineTo(i * 16 + 16, 16); g.fill(); }
            const t = new THREE.CanvasTexture(c); t.encoding = THREE.sRGBEncoding; t.wrapS = THREE.RepeatWrapping; t.repeat.set(3, 1); RAY_MATS.stripe = new THREE.MeshStandardMaterial({ map: t, roughness: 0.6 });
            return RAY_MATS; }

function raymondReachDetail(g, W, mastH) { const M = rayMats(); const add = (geo, mat, x, y, z, rx, ry, rz) => { const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); if (rx) m.rotation.x = rx; if (ry) m.rotation.y = ry; if (rz) m.rotation.z = rz; m.castShadow = true; m.receiveShadow = true; g.add(m); return m; };
            add(roundedBox(W + 0.02, 1.02, 1.54, 0.16), M.paint, 0, 0.6, -1.3);      // carrocería del módulo motriz con aristas redondeadas
            add(new THREE.BoxGeometry(W + 0.08, 0.22, 1.56), M.charcoal, 0, 0.12, -1.3);                    // faldón inferior
            add(roundedBox(W + 0.1, 0.24, 0.16, 0.08), M.rubber, 0, 0.28, -2.1);                           // defensa trasera de hule
            add(roundedBox(W - 0.12, 0.08, 1.34, 0.04), M.charcoal, 0, 1.45, -1.3);                         // tapa de batería
            [-0.3, 0.3].forEach(dx => add(new THREE.TorusGeometry(0.06, 0.012, 6, 12, Math.PI), M.chrome, dx, 1.49, -1.3, 0, Math.PI / 2, 0));   // asas de la tapa
            [-1, 1].forEach(sd => { add(new THREE.CylinderGeometry(0.05, 0.05, 0.03, 16), M.lens, sd * (W / 2 - 0.15), 0.95, -2.09, Math.PI / 2, 0, 0); add(new THREE.BoxGeometry(0.12, 0.06, 0.03), M.amber, sd * (W / 2 - 0.15), 0.78, -2.09); });   // faros y calaveras
            add(new THREE.BoxGeometry(W - 0.2, 0.06, 0.04), M.stripe, 0, 0.45, -2.09);                     // franja de seguridad trasera
            [-1, 1].forEach(sd => { add(new THREE.BoxGeometry(0.19, 0.05, 1.7), M.stripe, sd * (W / 2 - 0.09), 0.36, 0.95); add(new THREE.CylinderGeometry(0.025, 0.025, 0.5, 8), M.chrome, sd * (W / 2 - 0.02), 1.2, -0.72); });   // franjas en brazos de apoyo + agarraderas
            add(new THREE.BoxGeometry(0.42, 0.04, 0.3), M.rubber, -W / 2 + 0.3, 0.24, 0.05);                // escalón antiderrapante
            // Mástil: cilindros de elevación cromados, cadenas y mangueras hidráulicas
            const mh = mastH || 3.4; [-0.2, 0.2].forEach(dx => { add(new THREE.CylinderGeometry(0.045, 0.045, mh * 0.85, 12), M.chrome, dx, mh * 0.45, 0.5); add(new THREE.CylinderGeometry(0.06, 0.06, 0.12, 12), M.charcoal, dx, 0.12, 0.5); });
            [-0.3, 0.3].forEach(dx => add(new THREE.BoxGeometry(0.035, mh * 0.9, 0.02), M.chain, dx, mh * 0.48, 0.66));
            [-0.12, 0.12].forEach(dx => add(new THREE.CylinderGeometry(0.016, 0.016, mh * 0.8, 6), M.hose, dx, mh * 0.42, 0.44));
            add(new THREE.BoxGeometry(0.98, 0.1, 0.18), M.charcoal, 0, mh, 0.55);                            // travesaño superior del mástil
        }

function updateDisplay() {
            const throttle = parseFloat(document.getElementById('throttle').value);
            const steering = parseFloat(document.getElementById('steering').value);
            const mastHeight = mastM();
            const reach1 = reachM(1);
            const reach2 = reachM(2);

            document.getElementById('throttleVal').textContent = throttle + '%';
            document.getElementById('steeringVal').textContent = steering > 5 ? 'Derecha →' : steering < -5 ? '← Izquierda' : 'Centro';
            document.getElementById('mastVal').textContent = mastHeight.toFixed(2) + 'm';
            document.getElementById('reach1Val').textContent = reach1.toFixed(2) + 'm';
            document.getElementById('reach2Val').textContent = reach2.toFixed(2) + 'm';

            document.getElementById('scoreDisplay').textContent = simScore;
            document.getElementById('safetyDisplay').textContent = simSafety.toFixed(0) + '%';
            document.getElementById('collisionsDisplay').textContent = simCollisions;
        }

function changeModel() {
            currentModel = document.getElementById('modelSelect').value;
            createForklift();
        }

function tipPos() { const a = forklift.rotation.y, r1 = reachM(1), r2 = reachM(2), off = spec().forkZ + 0.5 + r1 + r2;
            return { x: forklift.position.x + Math.sin(a) * off, z: forklift.position.z + Math.cos(a) * off, y: 0.22 + mastM(), reach: r1 + r2 }; }

function whirlpoolTex(side) { const k = 'wp' + side; if (_texCache[k]) return _texCache[k]; const c = noiseCanvas(512, 1024, '#e9e2d3', 14, (g, w, h) => {
            g.fillStyle = 'rgba(120,80,30,.18)'; for (let i = 0; i < 14; i++) g.fillRect(0, i * 72 + 30, w, 2);
            g.fillStyle = '#ffffff'; g.fillRect(56, 120, 400, 300); g.strokeStyle = '#1b2a4a'; g.lineWidth = 4; g.strokeRect(56, 120, 400, 300);
            g.fillStyle = '#1b2a4a'; g.textAlign = 'center'; g.font = '900 78px Arial'; g.fillText('Whirlpool', 256, 250); g.fillStyle = '#f4a100'; g.fillRect(128, 275, 256, 8);
            g.fillStyle = '#1b2a4a'; g.font = '700 26px Arial'; g.fillText('REFRIGERADOR 18 pies³', 256, 330); g.font = '600 20px Arial'; g.fillText(side === 'front' ? 'FRENTE · ESTA CARA HACIA ARRIBA ↑↑' : 'LATERAL · SUJETAR AQUÍ CON CLAMP', 256, 370);
            // pictogramas de manejo
            g.fillStyle = '#c62828'; g.font = '900 40px Arial'; g.fillText('↑↑  FRÁGIL  ↑↑', 256, 560); g.font = '700 24px Arial'; g.fillStyle = '#333'; g.fillText('NO APILAR · NO USAR GANCHOS', 256, 610); g.fillText('MÁX 2 UNIDADES POR CLAMP · PRESIÓN AUTORIZADA', 256, 645);
            g.fillStyle = '#fff'; g.fillRect(96, 700, 320, 150); g.fillStyle = '#111'; for (let i = 0; i < 40; i++) g.fillRect(110 + i * 7.4, 720, Math.random() < .5 ? 2 : 4, 80); g.font = '700 22px Arial'; g.fillText('WRT518SZDM · DICKA LOGISTICS', 256, 835);
            g.strokeStyle = 'rgba(0,0,0,.35)'; g.lineWidth = 6; g.strokeRect(3, 3, w - 6, h - 6); }); const t = new THREE.CanvasTexture(c); t.anisotropy = 4; t.encoding = THREE.sRGBEncoding; _texCache[k] = t; return t; }

function makeFridge() { const g = new THREE.Group(); const front = new THREE.MeshStandardMaterial({ map: whirlpoolTex('front'), roughness: .92 }), side = new THREE.MeshStandardMaterial({ map: whirlpoolTex('side'), roughness: .92 }), top = new THREE.MeshStandardMaterial({ color: 0xe9e2d3, roughness: .92 });
            const box = new THREE.Mesh(new THREE.BoxGeometry(0.82, 1.78, 0.78), [side, side, top, top, front, front]); box.position.y = 0.89; box.castShadow = true; box.receiveShadow = true; g.add(box);
            [0.35, 1.45].forEach(y => { const st = new THREE.Mesh(new THREE.BoxGeometry(0.84, 0.05, 0.8), new THREE.MeshStandardMaterial({ color: 0x111111 })); st.position.y = y; g.add(st); });
            [-1, 1].forEach(sd => { const corner = new THREE.Mesh(new THREE.BoxGeometry(0.06, 1.78, 0.06), new THREE.MeshStandardMaterial({ color: 0x8a6a40 })); corner.position.set(sd * 0.4, 0.89, 0.38); g.add(corner); const c2 = corner.clone(); c2.position.z = -0.38; g.add(c2); });
            return g; }

function setFridgesVisible(v) { FRIDGES.forEach(f => f.visible = v); if (FRIDGES.sign) FRIDGES.sign.visible = v; obstacles.forEach(o => { if (o.fridge) o.disabled = !v; }); }

function checkTrailerRules() { if (!TRAILER) return; const a = ACTS[actIdx]; const inside = forkPosition.z > TRAILER.z0 + 0.3 && Math.abs(forkPosition.x) < TRAILER.W / 2 + 0.5; const near = forkPosition.z > TRAILER.z0 - 6 && forkPosition.z < TRAILER.z0 + 0.3 && Math.abs(forkPosition.x) < 2.5;
            if (performance.now() - lastHonk < 6000) trailerHonked = true;
            if (near && !inside) { if (!trailerHonked && simSpeed > 0.5 && !trailerWarned) { trailerWarned = true; registerFault('sinClaxon'); toast('📣 Toca el claxon antes de entrar a la caja'); } }
            if (inside && !trailerEntered) { trailerEntered = true; toast('🚚 Dentro de la caja: máx 5 km/h, carga a 15 cm, sin giros'); }
            if (inside && simSpeed > 5.5 && !trailerFast) { trailerFast = true; registerFault('velocidadTrailer'); }
            if (inside && simSpeed < 4) trailerFast = false;
            if (!near && !inside) { trailerWarned = false; } }

function dropLoad(reason) { // la tarima cae desde la altura actual
            hasLoad = false; document.getElementById('loadDisplay').textContent = 'Sin carga'; registerFault('caidaCarga'); LOAD.dropped = true;
            const a = forklift.rotation.y; const y0 = cargo.position.y; cargo.userData.fall = { vy: 0, y0, vx: Math.sin(a) * 0.02 + (Math.random() - .5) * 0.02, vz: Math.cos(a) * 0.02, rot: (Math.random() - .5) * 0.9 };
            toast('💥 ' + reason); }

function updateLoadPhysics(dtS, turn) {
            // caída animada
            const f = cargo.userData.fall; if (f) { f.vy -= 9.8 * dtS * 0.9; cargo.position.y += f.vy * dtS; cargo.position.x += f.vx; cargo.position.z += f.vz; cargo.rotation.z += f.rot * dtS; if (cargo.position.y <= 0.05) { cargo.position.y = 0.05; cargo.rotation.z = Math.sign(cargo.rotation.z || 1) * Math.min(Math.abs(cargo.rotation.z), 0.35); cargo.userData.fall = null; } return; }
            if (!hasLoad) return;
            const h = mastM(); const v = Math.abs(velKmh) / 3.6; const yawRate = Math.abs(turn) * (0.006 + Math.min(1, simSpeed / 6) * 0.016) * 60;
            const aLat = yawRate * v, aLong = Math.abs((velKmh - prevVel) / 3.6 / Math.max(dtS, 1e-3));
            // margen de estabilidad de la carga: menor con altura y con descentrado
            const cg = 0.6 + h * 0.9 + Math.abs(LOAD.lat) * 2.5;
            const risk = (aLat * cg + aLong * (0.3 + h * 0.5)) / 3.2;
            LOAD.wobble += ((risk * 0.25) - LOAD.wobble) * 0.1;
            if (risk > 1 && h > 0.5) { dropLoad('La carga cayó: giro/frenado brusco con la carga elevada'); return; }
            if (risk > 0.55 && tipWarnCooldown <= 0) { tipWarnCooldown = 60; toast('⚠️ La carga se balancea: baja la carga y suaviza el movimiento'); }
            // elevación inestable por descentrado
            if (Math.abs(LOAD.lat) > 0.25 && h > 1.5 && !LOAD.elevWarned) { LOAD.elevWarned = true; registerFault('elevacionInestable'); }
            if (Math.abs(LOAD.lat) > 0.32 && h > 2.5) { dropLoad('Carga descentrada: resbaló de las horquillas al elevar'); return; }
            // retiro incorrecto: al sacar del rack sin despegar la tarima de la viga
            if (LOAD.onRack && LOAD.grabPos && !LOAD.retiroWarned) { const moved = Math.hypot(forkPosition.x - LOAD.grabPos.x, forkPosition.z - LOAD.grabPos.z); if (moved > 0.25 && h < LOAD.rackY + 0.06) { LOAD.retiroWarned = true; registerFault('retiroMal'); } if (moved > 3) LOAD.onRack = false; }
        }

function palletCollision(nx, nz, ang) {
            if (hasLoad || !cargo || !cargo.visible) return false;
            if (cargo.position.y > 1.0) return false;                         // tarima en rack: la gestiona la altura de horquillas
            const sp = spec(); const dxw = cargo.position.x - nx, dzw = cargo.position.z - nz;
            const fwd = dxw * Math.sin(ang) + dzw * Math.cos(ang);           // distancia hacia adelante (eje del equipo)
            const lat = dxw * Math.cos(ang) - dzw * Math.sin(ang);           // desplazamiento lateral
            const halfW = sp.w / 2 + 0.15, bodyBack = -sp.len / 2 - 0.15, bodyFront = sp.forkZ - 0.35;
            const reach = reachM(1) + reachM(2); const forkStart = sp.forkZ - 0.3 + reach, forkEnd = sp.forkZ + 1.25 + reach;
            if (Math.abs(lat) > halfW + 0.05) return false;                    // fuera del ancho: no toca
            if (fwd > bodyBack && fwd < bodyFront + 0.1) return true;          // el chasis/mástil pisa la tarima → golpe
            if (fwd >= bodyFront + 0.3 && fwd < forkEnd + 0.6) {               // zona de horquillas: sólo entra alineado y bajo
                const aligned = Math.abs(lat) < 0.35 && Math.abs(((cargo.rotation.y - ang + Math.PI) % (Math.PI / 2)) - Math.PI / 4) < 0.35 || Math.abs(lat) < 0.35 && true;
                const low = mastM() < 0.25;
                if (!low || Math.abs(lat) > 0.35) return true;                 // horquillas altas o descentradas → golpean la tarima
                return false;                                                  // inserción correcta
            }
            return false;
        }

function clampRelease() { // abrir placas con carga: segura sólo con la carga apoyada (baja)
            if (!hasLoad) return; if (mastM() > 0.4) { registerFault('liberacionInsegura'); dropLoad('Abriste las placas con la carga elevada'); return; }
            releaseLoad(); }

function toast(msg) { const t = document.getElementById('faultToast'); t.innerHTML = msg; t.style.background = '#1D2586'; t.classList.add('show'); clearTimeout(t._t); t._t = setTimeout(() => { t.classList.remove('show'); t.style.background = ''; }, 1600); }

function updateSpeedo(v, max) { const el = document.getElementById('speedo'); const f = Math.min(1, v / max); document.getElementById('needle').setAttribute('transform', `rotate(${-90 + f * 180} 75 80)`); document.getElementById('speedArc').setAttribute('stroke-dashoffset', 188.5 * (1 - f)); document.getElementById('kmh').textContent = v.toFixed(1); const lim = (typeof velKmh !== 'undefined' && velKmh < 0) ? SIM_CFG.limitRev : SIM_CFG.limitFwd; el.classList.toggle('over', v > lim + 0.05); const lt = document.getElementById('limLbl'); if (lt) lt.textContent = 'LÍMITE ' + lim + ' km/h' + (velKmh < 0 ? ' · REVERSA' : ''); }

function setupJoystick(zoneId, knobId, target) {
            const zone = document.getElementById(zoneId);
            const knob = document.getElementById(knobId);
            let active = false, pointerId = null;
            const radius = 45;
            function update(clientX, clientY) {
                const r = zone.getBoundingClientRect();
                let dx = clientX - (r.left + r.width/2);
                let dy = clientY - (r.top + r.height/2);
                const d = Math.hypot(dx, dy);
                if (d > radius) { dx = dx/d*radius; dy = dy/d*radius; }
                knob.style.transform = `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px))`;
                joy[target].x = dx/radius; joy[target].y = -dy/radius;
            }
            function reset() {
                active = false; pointerId = null;
                knob.style.transform = 'translate(-50%,-50%)';
                joy[target].x = 0; joy[target].y = 0;
            }
            zone.addEventListener('pointerdown', e => { active = true; pointerId = e.pointerId; zone.setPointerCapture(e.pointerId); update(e.clientX, e.clientY); });
            zone.addEventListener('pointermove', e => { if (active && e.pointerId === pointerId) update(e.clientX, e.clientY); });
            zone.addEventListener('pointerup', reset);
            zone.addEventListener('pointercancel', reset);
            zone.addEventListener('lostpointercapture', reset);
        }

function registerFault(code) {
            if (practiceDone) return;
            const now = Date.now();
            if (faultCooldown[code] && now - faultCooldown[code] < 2500) return;   // evita duplicar la misma falta
            faultCooldown[code] = now;
            const f = FAULTS[code];
            const IMPACT = { colision: 1.0, golpePallet: 0.6, atropello: 1.3, volcadura: 1.4, caidaCarga: 1.1, liberacionInsegura: 0.9 }; if (IMPACT[code]) impactFX(IMPACT[code]);
            const t = Math.floor((now - practiceStart) / 1000);
            faultLog.push({ code, label: f.label, pts: f.pts, t });
            simSafety = Math.max(0, simSafety - f.pts);
            simCollisions = faultLog.length;
            // aviso en el momento
            const toast = document.getElementById('faultToast');
            toast.innerHTML = `⚠️ ${f.label} <small>${f.tip} · −${f.pts} pts</small>`;
            toast.classList.add('show'); clearTimeout(toast._t); toast._t = setTimeout(() => toast.classList.remove('show'), 2200);
            const fl = document.createElement('div'); fl.className = 'flash'; document.querySelector('.canvas-wrapper').appendChild(fl); setTimeout(() => fl.remove(), 500);
            if (navigator.vibrate) navigator.vibrate(120);
            renderLog();
        }

function fmtT(t) { return `${Math.floor(t / 60)}:${String(t % 60).padStart(2, '0')}`; }

function renderLog() {
            const body = document.getElementById('faultLogBody');
            if (!faultLog.length) { body.textContent = 'Sin errores registrados'; return; }
            body.innerHTML = faultLog.map((f, i) => `<div class="fault-item"><span>${i + 1}. ${f.label}</span><b>${fmtT(f.t)} · −${f.pts}</b></div>`).join('');
            body.scrollTop = body.scrollHeight;
        }

function toggleLog() { document.getElementById('faultLog').classList.toggle('open'); }

function checkFaults(fwd, turn, mastHeightM, reachM) {
            if (practiceDone) return;
            const moving = simSpeed > 0.5;
            const speedKmh = simSpeed;
            if (moving && velKmh > 0 && speedKmh > SIM_CFG.limitFwd + 0.5) registerFault('velocidad');
            if (moving && velKmh < 0 && speedKmh > SIM_CFG.limitRev + 0.5) registerFault('retroceso');
            if (moving && hasLoad && mastHeightM > 0.6) registerFault('cargaAlta');
            if (moving && hasLoad && mastHeightM < 0.10 && simSpeed > 1.5) registerFault('horquillasBajas');
            if (moving && !hasLoad && mastHeightM > 1.5) registerFault('horqAlta');
            if (moving && reachM > 0.4) registerFault('extendido');
            if (moving && hasLoad && Math.abs(turn) > 0.7 && Math.abs(fwd) > 0.6) registerFault('giroBrusco');
            if (moving && forkPosition.z > 40.5 && forkPosition.z < 43.5 && speedKmh > 3) registerFault('peatonal');
        }

function finishPractice() {
            practiceDone = true;
            const t = Math.floor((Date.now() - practiceStart) / 1000);
            const penal = faultLog.reduce((a, f) => a + f.pts, 0);
            const done = results.filter(Boolean);
            const final = Math.round(done.reduce((a, r) => a + r.score, 0) / ACTS.length);
            const ok = final >= 80 && !faultLog.some(f => f.code === 'colision');
            document.getElementById('sumScore').textContent = final + '%';
            const g = document.getElementById('sumGrade'); g.textContent = ok ? '✓ APROBADO' : '✗ NO APROBADO'; g.className = 'summary-grade ' + (ok ? 'ok' : 'bad');
            document.getElementById('sumStats').innerHTML = `⏱️ Tiempo total: <b>${fmtT(t)}</b><br>✅ Actividades cumplidas (≥80%): <b>${done.filter(r => r.ok).length}/${ACTS.length}</b><br>⚠️ Errores: <b>${faultLog.length}</b> (−${penal} pts)<br>💥 Colisiones: <b>${faultLog.filter(f => f.code === 'colision').length}</b><br>Criterio: cumplimiento ≥80% y 0 colisiones`;
            document.getElementById('sumActs').innerHTML = '<b>Cumplimiento por actividad:</b>' + ACTS.map((a, i) => { const r = results[i]; return `<div><span>${a.icon} ${i + 1}. ${a.name}</span><b class="${r && r.ok ? 'ok' : 'bad'}">${r ? r.score + '% · ' + fmtT(r.secs) + (r.faults ? ' · ' + r.faults + ' err' : '') : '—'}</b></div>`; }).join('');
            const byType = {}; faultLog.forEach(f => byType[f.label] = (byType[f.label] || 0) + 1);
            document.getElementById('sumErrors').innerHTML = faultLog.length ? '<b>Detalle de errores:</b><br>' + Object.entries(byType).map(([k, v]) => `• ${k} ×${v}`).join('<br>') : '<b>🎉 Práctica sin errores</b>';
            document.getElementById('summary').classList.add('show');
            try {
                const hist = JSON.parse(localStorage.getItem('dicka_practicas') || '[]');
                hist.push({ usuario: currentUser && currentUser.user, nombre: currentUser && currentUser.name, num: currentUser.num, puesto: currentUser.puesto, area: currentUser.area, almacen: currentUser && currentUser.wh, equipo: 'Raymond ' + spec().code, fecha: new Date().toISOString(), score: final, tiempo: t, errores: faultLog, actividades: results, aprobado: ok });
                localStorage.setItem('dicka_practicas', JSON.stringify(hist));
            } catch (e) {}
            window._lastPractice = { final, t, ok, byType, results: results.slice() };
        }

function copyPractice() {
            const r = window._lastPractice; if (!r) return;
            askName();
            const txt = `🚛 PRÁCTICA MONTACARGA 3D - DICKA LOGISTICS\nOperario: ${currentUser.name}\nFecha: ${new Date().toLocaleString('es-MX')}\nCumplimiento: ${r.final}%\nTiempo: ${fmtT(r.t)}\nActividades:\n${ACTS.map((a,i)=>`- ${a.name}: ${r.results[i]?r.results[i].score+'%':'—'}`).join('\n')}\nErrores: ${faultLog.length}\n${Object.entries(r.byType).map(([k, v]) => `- ${k} x${v}`).join('\n')}\nEstado: ${r.ok ? '✓ APROBADO' : '✗ NO APROBADO'}`;
            navigator.clipboard.writeText(txt); alert('Resultado copiado ✓');
        }

function resetPractice() {
            velKmh = 0; simSpeed = 0; if (document.getElementById('needle')) updateSpeedo(0, spec().maxSpeed);
            faultLog = []; faultCooldown = {}; practiceStart = Date.now(); practiceDone = false;
            simScore = 0; simSafety = 100; simCollisions = 0; hasLoad = false; missionStep = 1; reachOut = false;
            document.getElementById('reachLbl').textContent = 'EXTENDER';
            ['mastHeight', 'reach1', 'reach2'].forEach(id => document.getElementById(id).value = 0);
            forkPosition = { x: 0, y: 0, z: 30 }; forkRotation = { y: Math.PI };
            results.length = 0; ACTS.forEach(a => delete a._flag); actBusy = false;
            document.getElementById('summary').classList.remove('show'); renderLog();
            beginAct(0);
        }

function initEngineSound() { try { const ctx = audioCtx(); if (SND.on) return; SND.on = true;
            const out = ctx.createGain(); out.gain.value = 0.9; out.connect(ctx.destination);
            const noiseBuf = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate), nd = noiseBuf.getChannelData(0); for (let i = 0; i < nd.length; i++) nd[i] = Math.random() * 2 - 1;
            const noise = () => { const n = ctx.createBufferSource(); n.buffer = noiseBuf; n.loop = true; n.start(); return n; };
            // inversor/controlador AC: zumbido grave constante con el equipo encendido
            SND.hum = ctx.createOscillator(); SND.hum.type = 'sawtooth'; SND.hum.frequency.value = 100; const hl = ctx.createBiquadFilter(); hl.type = 'lowpass'; hl.frequency.value = 220; SND.humGain = ctx.createGain(); SND.humGain.gain.value = 0; SND.hum.connect(hl); hl.connect(SND.humGain); SND.humGain.connect(out); SND.hum.start();
            // motor de tracción AC: silbido agudo (tono de conmutación) que sube con la velocidad + armónico
            SND.motor = ctx.createOscillator(); SND.motor.type = 'sine'; SND.motor.frequency.value = 250; SND.motor2 = ctx.createOscillator(); SND.motor2.type = 'triangle'; SND.motor2.frequency.value = 502;
            SND.motorGain = ctx.createGain(); SND.motorGain.gain.value = 0; const m2g = ctx.createGain(); m2g.gain.value = 0.35; SND.motor.connect(SND.motorGain); SND.motor2.connect(m2g); m2g.connect(SND.motorGain); SND.motorGain.connect(out); SND.motor.start(); SND.motor2.start();
            // rodamiento: llantas de poliuretano sobre concreto y engranes (ruido filtrado)
            const rn = noise(); const rb = ctx.createBiquadFilter(); rb.type = 'bandpass'; rb.frequency.value = 320; rb.Q.value = 0.8; SND.rollGain = ctx.createGain(); SND.rollGain.gain.value = 0; rn.connect(rb); rb.connect(SND.rollGain); SND.rollGain.connect(out); SND.rollBp = rb;
            // bomba hidráulica: motor de bomba + flujo de aceite al mover el mástil
            SND.hyd = ctx.createOscillator(); SND.hyd.type = 'sawtooth'; SND.hyd.frequency.value = 148; const hp = ctx.createBiquadFilter(); hp.type = 'lowpass'; hp.frequency.value = 700; const hn = noise(); const hb = ctx.createBiquadFilter(); hb.type = 'bandpass'; hb.frequency.value = 1700; hb.Q.value = 1.2; const hng = ctx.createGain(); hng.gain.value = 0.5;
            SND.hydGain = ctx.createGain(); SND.hydGain.gain.value = 0; SND.hyd.connect(hp); hp.connect(SND.hydGain); hn.connect(hb); hb.connect(hng); hng.connect(SND.hydGain); SND.hydGain.connect(out); SND.hyd.start(); startAmbient(ctx, noiseBuf); } catch (e) {} }

function startAmbient(ctx, noiseBuf) { if (SND.amb) return; const amb = SND.amb = ctx.createGain(); amb.gain.value = 0.85; amb.connect(ctx.destination);
            const loop = () => { const n = ctx.createBufferSource(); n.buffer = noiseBuf; n.loop = true; n.start(); return n; };
            { const n = loop(); const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 380; const g = ctx.createGain(); g.gain.value = 0.05; n.connect(lp); lp.connect(g); g.connect(amb); }   // tono de la nave: extractores y ventilación
            { const o = ctx.createOscillator(); o.frequency.value = 120; const g = ctx.createGain(); g.gain.value = 0.004; o.connect(g); g.connect(amb); o.start(); }   // zumbido de luminarias/cargadores de baterías
            // un motor por montacargas NPC: volumen y tono según distancia y movimiento
            SND.npc = NPC.forks.map(() => { const o = ctx.createOscillator(); o.type = 'sine'; o.frequency.value = 300; const g = ctx.createGain(); g.gain.value = 0; const n = loop(); const bp = ctx.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 300; bp.Q.value = .8; const ng = ctx.createGain(); ng.gain.value = 0; n.connect(bp); bp.connect(ng); o.connect(g); g.connect(amb); ng.connect(amb); o.start(); return { o, g, ng, px: null, pz: null }; });
            const burst = (dur, type, f, q, vol, decay) => { const t = ctx.currentTime; const n = ctx.createBufferSource(); n.buffer = noiseBuf; const fl = ctx.createBiquadFilter(); fl.type = type; fl.frequency.value = f; fl.Q.value = q; const g = ctx.createGain(); g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.0001, t + decay); n.connect(fl); fl.connect(g); g.connect(amb); n.start(t, Math.random()); n.stop(t + dur); };
            const tone = (f, t0, dur, vol, type) => { const t = ctx.currentTime + t0; const o = ctx.createOscillator(); o.type = type || 'square'; o.frequency.value = f; const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 1400; const g = ctx.createGain(); g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + 0.01); g.gain.setValueAtTime(vol, t + dur - 0.02); g.gain.exponentialRampToValueAtTime(0.0001, t + dur); o.connect(lp); lp.connect(g); g.connect(amb); o.start(t); o.stop(t + dur + 0.02); };
            const events = [
                () => { for (let i = 0; i < 3 + Math.floor(Math.random() * 4); i++) tone(1150, i * 0.9, 0.35, 0.012); },                          // alarma de reversa lejana
                () => { burst(0.35, 'lowpass', 160, 0.7, 0.16, 0.3); tone(55, 0, 0.18, 0.05, 'sine'); },                                        // tarima que se asienta en el piso
                () => { burst(0.25, 'bandpass', 2600, 6, 0.05, 0.22); burst(0.2, 'bandpass', 3900, 9, 0.025, 0.18); },                          // golpe metálico (horquilla/rack)
                () => { const t = ctx.currentTime; const n = ctx.createBufferSource(); n.buffer = noiseBuf; const f1 = ctx.createBiquadFilter(); f1.type = 'bandpass'; f1.Q.value = 5; const g = ctx.createGain(); g.gain.value = 0; n.connect(f1); f1.connect(g); g.connect(amb); n.start(t, Math.random());
                        const d = 1.2 + Math.random() * 1.6; for (let k = 0; k < d * 6; k++) { const tk = t + k / 6; f1.frequency.setValueAtTime(400 + Math.random() * 900, tk); g.gain.setValueAtTime(Math.random() < 0.75 ? 0.035 : 0.003, tk); } g.gain.setValueAtTime(0.0001, t + d); n.stop(t + d + 0.1); },   // voces del personal (murmullo)
                () => { burst(0.08, 'highpass', 1800, 1, 0.03, 0.06); const t = ctx.currentTime + 0.1; const n = ctx.createBufferSource(); n.buffer = noiseBuf; const bp = ctx.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 1500; bp.Q.value = 2; const g = ctx.createGain(); g.gain.value = 0; n.connect(bp); bp.connect(g); g.connect(amb); n.start(t, Math.random()); for (let k = 0; k < 12; k++) g.gain.setValueAtTime(Math.random() < 0.7 ? 0.02 : 0.002, t + k * 0.11); g.gain.setValueAtTime(0.0001, t + 1.4); n.stop(t + 1.5); },   // radio de comunicación (estática + voz)
                () => { burst(0.6, 'bandpass', 900, 1.5, 0.02, 0.55); }                                                                          // emplayadora / cinta
            ];
            const tick = () => { if (!SND.amb) return; try { events[Math.floor(Math.random() * events.length)](); } catch (e) {} SND.ambT = setTimeout(tick, 1800 + Math.random() * 4200); }; SND.ambT = setTimeout(tick, 1500); }

function updateAmbient() { if (!SND.npc || typeof camera === 'undefined') return; const ctx = hornCtx, t = ctx.currentTime;
            NPC.forks.forEach((f, i) => { const s = SND.npc[i]; if (!s) return; const d = Math.hypot(f.x - camera.position.x, f.z - camera.position.z); const moving = s.px !== null && Math.hypot(f.x - s.px, f.z - s.pz) > 0.004; const lifting = f.op && (f.op.ph === 'up' || f.op.ph === 'down'); s.px = f.x; s.pz = f.z;
                const att = Math.min(1, 6 / Math.max(6, d)); s.o.frequency.setTargetAtTime(lifting ? 150 : (moving ? 700 : 240), t, 0.3); s.g.gain.setTargetAtTime((moving || lifting ? 0.03 : 0.004) * att, t, 0.3); s.ng.gain.setTargetAtTime((moving ? 0.07 : lifting ? 0.05 : 0) * att, t, 0.3); }); }

function updateEngineSound(v, vmax, reversing, mastMoving) { if (!SND.on) return; try { updateAmbient(); const ctx = hornCtx, t = ctx.currentTime; const f = Math.min(1, v / vmax); const moving = v > 0.15;
            SND.humGain.gain.setTargetAtTime(0.018, t, 0.3);
            SND.motor.frequency.setTargetAtTime(240 + f * 1150, t, 0.12); SND.motor2.frequency.setTargetAtTime(482 + f * 2310, t, 0.12);
            SND.motorGain.gain.setTargetAtTime(moving ? 0.012 + f * 0.035 : 0, t, 0.15);
            SND.rollGain.gain.setTargetAtTime(moving ? 0.03 + f * 0.09 : 0, t, 0.2); SND.rollBp.frequency.setTargetAtTime(260 + f * 420, t, 0.2);
            SND.hydGain.gain.setTargetAtTime(mastMoving ? 0.07 : 0, t, 0.06); SND.hyd.frequency.setTargetAtTime(mastMoving ? 148 : 110, t, 0.1);
            // alarma de reversa (bip-bip tipo 97 dB, ~1.2 kHz)
            if (reversing) { SND.revT += 1; if (SND.revT % 40 === 1) { const o = ctx.createOscillator(); o.type = 'square'; o.frequency.value = 1180; const bp = ctx.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 1180; bp.Q.value = 4; const g = ctx.createGain(); g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.12, t + 0.01); g.gain.setValueAtTime(0.12, t + 0.2); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.24); o.connect(bp); bp.connect(g); g.connect(ctx.destination); o.start(t); o.stop(t + 0.26); } } else SND.revT = 0; } catch (e) {} }

function toggleGamepad() { GP.enabled = !GP.enabled; document.getElementById('gpLbl').textContent = GP.enabled ? 'ON' : 'USB'; document.getElementById('btnGp').style.background = GP.enabled ? '#2e9e5b' : 'rgba(29,37,134,.85)';
            if (GP.enabled) { findGamepad(); renderDeviceList(); toast('🎮 Modo joystick USB activado'); } else { document.getElementById('gpBadge').classList.remove('on'); toast('🎮 Joystick USB desactivado'); } refreshSwitches(); }

function xrBuildRig() { if (!XR.rig) { XR.rig = new THREE.Group(); XR.rig.name = 'xrRig'; scene.add(XR.rig); } XR.rig.add(camera);
            // HUD en el mundo: panel de 0.6×0.3 m a 1.2 m frente al operador, ligeramente abajo
            if (!XR.hud) { const c = document.createElement('canvas'); c.width = 1024; c.height = 512; XR.hudCtx = c.getContext('2d'); XR.hudTex = new THREE.CanvasTexture(c); const m = new THREE.Mesh(new THREE.PlaneGeometry(0.6, 0.3), new THREE.MeshBasicMaterial({ map: XR.hudTex, transparent: true, depthTest: false })); m.position.set(0, 1.05, -1.2); m.renderOrder = 999; XR.hud = m; XR.rig.add(m); }
            // Controladores con rayo
            for (let i = 0; i < 2; i++) { if (XR.ctrl[i]) continue; const c = renderer.xr.getController(i); c.userData.index = i; const line = new THREE.Line(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, 0, -3)]), new THREE.LineBasicMaterial({ color: 0xf5c400 })); line.scale.z = 1; c.add(line); XR.rig.add(c); XR.ctrl[i] = c;
                c.addEventListener('selectstart', () => xrSelect(c)); } }

function wrapText(g, text, x, y, maxW, lh, maxLines) { const words = String(text).split(' '); let line = '', lines = 0; for (const w of words) { const t = line ? line + ' ' + w : w; if (g.measureText(t).width > maxW && line) { g.fillText(line, x, y); y += lh; line = w; if (++lines >= maxLines - 1) { line += '…'; break; } } else line = t; } g.fillText(line, x, y); }

function mvrSupported() { return /Android|iPhone|iPad/i.test(navigator.userAgent) && (window.DeviceOrientationEvent !== undefined); }

function mvrAsk() { if (MVR.on) { mvrExit(); return; } const d = document.createElement('div'); d.id = 'mvrAsk'; d.style.cssText = 'position:fixed;inset:0;z-index:60;background:rgba(1,17,49,.94);display:flex;flex-direction:column;align-items:center;justify-content:center;gap:12px;color:#fff;font-family:Poppins,sans-serif;text-align:center;padding:1.2rem';
            d.innerHTML = '<div style="font-weight:900;font-size:18px">📱 ¿Cómo vas a usar el celular?</div><button class="btn-next" style="background:#7a2bd9;font-size:16px;padding:.9rem 1.4rem;width:min(420px,92%)" onclick="document.getElementById(\'mvrAsk\').remove(); mvrEnter(false)">🥽 CON VISOR (Cardboard) · dos ojos</button><button class="btn-next" style="background:#2138D3;font-size:16px;padding:.9rem 1.4rem;width:min(420px,92%)" onclick="document.getElementById(\'mvrAsk\').remove(); mvrEnter(true)">🪟 SIN VISOR · una sola vista, mueve el celular para mirar</button><button class="btn-next" style="background:#838383;width:min(420px,92%)" onclick="document.getElementById(\'mvrAsk\').remove()">Cancelar</button>'; document.body.appendChild(d); }

function mvrBuildGazeButtons() { if (MVR.btns || VIEWER) return; MVR.btns = []; const mk = (label, x, y, act) => { const c = document.createElement('canvas'); c.width = 256; c.height = 128; const g = c.getContext('2d'); g.fillStyle = 'rgba(33,56,211,.85)'; g.fillRect(0, 0, 256, 128); g.fillStyle = '#fff'; g.font = '900 60px Arial'; g.textAlign = 'center'; g.fillText(label, 128, 84); const m = new THREE.Mesh(new THREE.PlaneGeometry(0.22, 0.11), new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(c), transparent: true, depthTest: false })); m.position.set(x, y, -1.2); m.renderOrder = 998; m.userData.act = act; XR.rig.add(m); MVR.btns.push(m); };
            mk('▲', 0.42, 1.35, 'mastUp'); mk('▼', 0.42, 1.21, 'mastDown'); mk('⇆', -0.42, 1.35, 'reach'); mk('✋', -0.42, 1.21, 'grab'); mk('📣', 0, 1.42, 'horn'); }

function mvrGaze() { if (!MVR.on) return null; camera.updateMatrixWorld(true); const rc = new THREE.Raycaster(); rc.setFromCamera({ x: 0, y: 0 }, camera); const objs = (MVR.btns || []).concat(typeof CS !== 'undefined' && CS.on ? CS.markers : []).concat(typeof XRCS !== 'undefined' && XRCS.mesh ? [XRCS.mesh] : []); const h = rc.intersectObjects(objs, false)[0]; MVR.gazeHit = h ? h.object : null; if (MVR.reticle) MVR.reticle.material.color.set(MVR.gazeHit ? 0x2e9e5b : 0xf5c400); return h; }

function mvrTap() { if (!MVR.on || VIEWER) return; const now = performance.now(); const dbl = now - MVR.lastTap < 320; MVR.lastTap = now;
            const h = mvrGaze(); if (h && h.object.userData.act) { const a = h.object.userData.act; if (a === 'mastUp') mvrMast(+12); else if (a === 'mastDown') mvrMast(-12); else if (a === 'reach') { reachOut = !reachOut; if (spec().clamp && !reachOut && hasLoad) clampRelease(); } else if (a === 'grab') { hasLoad ? releaseLoad() : grabLoad(); } else if (a === 'horn') honk(); return; }
            if (typeof CS !== 'undefined' && CS.on) { if (typeof XRCS !== 'undefined' && XRCS.mesh && XRCS.mesh.visible && h && h.object === XRCS.mesh) { const py = (1 - h.uv.y) * 900; const band = XRCS.bands.find(b => py >= b.y0 && py <= b.y1); if (band) band.el.click(); return; } if (h && h.object.userData.hot !== undefined && CS.phase === 'find') { const i = h.object.userData.hot; const hh = CS.hot[i]; if (CS.found.has(i)) return; if (!hh.correct) { CS.wrong++; csCount(); return; } CS.found.add(i); h.object.material.opacity = .35; h.object.material.color.set(0xff2a2a); csCount(); if (CS.found.size >= CS_SCENES[CS.idx].need) setTimeout(csQuestion, 900); } return; }
            if (dbl) { MVR.reverse = !MVR.reverse; toast(MVR.reverse ? '⬅ REVERSA' : '➡ AVANCE'); } }

function mvrMast(d) { const mh = document.getElementById('mastHeight'); mh.value = Math.max(0, Math.min(100, parseFloat(mh.value) + d)); }

function mvrInput() { if (!MVR.on) return null; if (VIEWER) { mvrGaze(); return { fwd: 0, turn: 0 }; } mvrGaze(); const fwd = MVR.holding ? (MVR.reverse ? -1 : 1) : 0;
            // dirección: diferencia entre hacia dónde mira la cabeza y el frente del equipo (zona muerta ±8°, máximo a 45°)
            const dirW = new THREE.Vector3(); camera.getWorldDirection(dirW); const headYaw = Math.atan2(dirW.x, dirW.z); let rel = headYaw - (forkRotation.y + Math.PI); while (rel > Math.PI) rel -= 2 * Math.PI; while (rel < -Math.PI) rel += 2 * Math.PI; let turn = Math.abs(rel) < 0.14 ? 0 : Math.max(-1, Math.min(1, -rel / 0.8));
            if (typeof CS !== 'undefined' && CS.on) turn = 0; return { fwd, turn }; }

function mvrRender() { if (MVR.orient) MVR.orient.update(); if (MVR.stereo) { MVR.stereo.setSize(renderer.domElement.clientWidth, renderer.domElement.clientHeight); MVR.stereo.render(scene, camera); } else renderer.render(scene, camera); }

function horizontalFov(cam, aspect) { return 2 * Math.atan(Math.tan(THREE.MathUtils.degToRad(cam.fov) / 2) * aspect); }

function sideCamera(base, sign, aspect) { const c = base.clone(); c.aspect = aspect; c.updateProjectionMatrix(); const yaw = SCREENS.angle ? THREE.MathUtils.degToRad(SCREENS.angle) : horizontalFov(base, aspect); c.rotateOnWorldAxis(new THREE.Vector3(0, 1, 0), -sign * yaw); return c; }

function renderScreens() {
            if (XR.active && renderer.xr.isPresenting) { renderer.render(scene, camera); return; }
            if (MVR.on) { mvrRender(); return; }
            const w = renderer.domElement.width, h = renderer.domElement.height;
            if (SCREENS.mode === 'surround3' && !VIEWER) {
                renderer.setScissorTest(true); const tw = Math.floor(w / 3); const asp = tw / h;
                const center = camera.clone(); center.aspect = asp; center.updateProjectionMatrix();
                [[-1, 0], [0, tw], [1, tw * 2]].forEach(([sg, x0]) => { renderer.setViewport(x0, 0, tw, h); renderer.setScissor(x0, 0, tw, h); renderer.render(scene, sg === 0 ? center : sideCamera(camera, sg, asp)); });
                renderer.setScissorTest(false); renderer.setViewport(0, 0, w, h); return;
            }
            if (VIEWER) { const asp = w / h; renderer.render(scene, sideCamera(camera, VIEWER === 'left' ? -1 : 1, asp)); return; }
            renderer.render(scene, camera);
        }

function broadcastState() { if (VIEWER) return; if (!SYNC && !HYB.conns.length) return;
            const st = { t: performance.now(), user: currentUser, model: currentModel, fx: forkPosition.x, fz: forkPosition.z, ry: forkRotation.y, mast: parseFloat(document.getElementById('mastHeight').value), r1: parseFloat(document.getElementById('reach1').value), r2: parseFloat(document.getElementById('reach2').value),
                cam: camMode, camPos: [camera.position.x, camera.position.y, camera.position.z], camLook: [camLookSmooth.x, camLookSmooth.y, camLookSmooth.z], hasLoad, cargo: cargo ? [cargo.position.x, cargo.position.y, cargo.position.z, cargo.rotation.y, cargo.visible, !!cargo.userData.double] : null, clamp: CLAMP.gap,
                forks: NPC.forks.map(f => [f.x, f.z, f.g.rotation.y]), peds: NPC.peds.map(pd => [pd.g.position.x, pd.g.position.z, pd.g.rotation.y, pd.walk, pd.wait > 0 ? 1 : 0]), roof: window.roofMesh ? window.roofMesh.visible : true };
            if (SYNC) SYNC.postMessage(st); hybSend(st); }

function applyState(st) { lastState = st; if (!viewerReady) return;
            forkPosition.x = st.fx; forkPosition.z = st.fz; forkRotation.y = st.ry; forklift.position.set(st.fx, 0, st.fz); forklift.rotation.y = st.ry;
            document.getElementById('mastHeight').value = st.mast; document.getElementById('reach1').value = st.r1; document.getElementById('reach2').value = st.r2; if (typeof CLAMP !== 'undefined') CLAMP.gap = st.clamp;
            hasLoad = st.hasLoad; if (cargo && st.cargo) { cargo.position.set(st.cargo[0], st.cargo[1], st.cargo[2]); cargo.rotation.y = st.cargo[3]; cargo.visible = st.cargo[4]; cargo.userData.double = st.cargo[5]; }
            st.forks.forEach((v, i) => { const f = NPC.forks[i]; if (!f) return; f.x = v[0]; f.z = v[1]; f.g.position.set(v[0], 0, v[1]); f.g.rotation.y = v[2]; });
            st.peds.forEach((v, i) => { const pd = NPC.peds[i]; if (!pd) return; pd.x = v[0]; pd.z = v[1]; pd.g.position.set(v[0], 0, v[1]); pd.g.rotation.y = v[2]; pd.walk = v[3]; pd.wait = v[4]; });
            if (!MVR.on && !(XR.active && renderer.xr.isPresenting)) { camMode = st.cam; camera.position.set(st.camPos[0], st.camPos[1], st.camPos[2]); camLookSmooth.set(st.camLook[0], st.camLook[1], st.camLook[2]); camera.lookAt(camLookSmooth); } if (window.roofMesh) window.roofMesh.visible = st.roof; }

function viewerHandle(st) { if (!viewerReady) { // primer estado: arrancar como espectador con el mismo equipo y usuario
                if (st.user) currentUser = st.user; ['regScreen', 'forkScreen', 'menuScreen'].forEach(id => { const el = document.getElementById(id); if (el) el.classList.add('hidden'); }); document.body.classList.add('viewer', 'simfull');
                if (typeof startSimulator === 'function') startSimulator(); chooseFork(st.model || 'reach'); ctrlCheckDone(); document.getElementById('checklist').classList.remove('show'); viewerReady = true;
                if (VIEWER === 'vr') { const b = document.getElementById('vrViewerStart'); if (b) b.style.display = 'flex'; } }
            applyState(st); }

function hybLoadPeer() { return new Promise((res, rej) => { if (window.Peer) { res(); return; } const sc = document.createElement('script'); sc.src = 'https://cdnjs.cloudflare.com/ajax/libs/peerjs/1.5.2/peerjs.min.js'; sc.onload = res; sc.onerror = () => rej(new Error('No se pudo cargar PeerJS (se requiere internet)')); document.head.appendChild(sc); }); }

async function hybStart() { SCREENS.mode = 'single'; document.body.classList.remove('surround3'); try { await hybLoadPeer(); } catch (e) { toast(e.message); return; } if (HYB.peer) { hybShowCode(); return; }
            HYB.code = String(Math.floor(1000 + Math.random() * 9000)); HYB.peer = new Peer('dicka-sim-' + HYB.code, { debug: 0 });
            HYB.peer.on('open', () => { hybShowCode(); toast('🔗 Cabina híbrida lista · código ' + HYB.code); });
            HYB.peer.on('connection', conn => { HYB.conns.push(conn); conn.on('open', () => { toast('📱 Celular conectado a la cabina'); const el = document.getElementById('hybStatus'); if (el) el.textContent = `📱 ${HYB.conns.filter(c => c.open).length} celular(es) conectado(s)`; }); conn.on('close', () => { HYB.conns = HYB.conns.filter(c => c !== conn); }); });
            HYB.peer.on('error', e => toast('Cabina híbrida: ' + e.type)); }

function hybShowCode() { const el = document.getElementById('hybCode'); if (!el) return; const u = new URL(location.href); u.search = ''; u.searchParams.set('screen', 'vr'); u.searchParams.set('room', HYB.code); el.innerHTML = `Código: <b style="font-size:26px;letter-spacing:4px">${HYB.code}</b><br><small>En el celular abre:</small><br><input readonly value="${u.toString()}" onclick="this.select()" style="width:100%;font-size:11px;padding:.3rem;border:1px solid #ccc;border-radius:6px">`; }

function hybSend(st) { if (!HYB.conns.length) return; HYB.frame++; if (HYB.frame % 2) return;   // ~30 Hz
            HYB.conns.forEach(c => { if (c.open) { try { c.send(st); } catch (e) {} } }); }

async function hybJoin(room) { try { await hybLoadPeer(); } catch (e) { alert(e.message); return; } const peer = new Peer(undefined, { debug: 0 }); peer.on('open', () => { const conn = peer.connect('dicka-sim-' + room, { reliable: false }); HYB.conn = conn; conn.on('data', st => viewerHandle(st)); conn.on('open', () => toast('🔗 Conectado a la cabina ' + room)); conn.on('close', () => toast('Se perdió la conexión con la laptop')); }); peer.on('error', e => toast('No se pudo conectar: ' + e.type)); }

function setScreensMode(m) { SCREENS.mode = m; localStorage.setItem('dicka_screens', m); document.body.classList.toggle('surround3', m === 'surround3'); toast(m === 'surround3' ? '🖥️ Surround: 3 vistas en un canvas ultra-ancho' : m === 'multi' ? '🖥️ Multiventana: abre las pantallas izquierda y derecha' : '🖥️ Una pantalla'); window.dispatchEvent(new Event('resize')); }

function openSideWindow(side) { const u = new URL(location.href); u.searchParams.set('screen', side); const w = window.open(u.toString(), 'dicka_' + side, 'width=1280,height=720'); if (!w) alert('El navegador bloqueó la ventana emergente: permite pop-ups para este sitio'); else toast('Arrastra la ventana "' + (side === 'left' ? 'izquierda' : 'derecha') + '" al monitor correspondiente y ponla en pantalla completa (F11)'); }

function setScreenAngle(v) { SCREENS.angle = parseFloat(v) || 0; localStorage.setItem('dicka_screen_angle', SCREENS.angle); document.getElementById('scrAngleLbl').textContent = SCREENS.angle ? SCREENS.angle + '°' : 'auto (FOV)'; }

function showCtrlCheck() { CC.done = {}; ['cc1','cc2','cc3','cc4','cc5','cc6'].forEach(id => { const el = document.getElementById(id); el.textContent = '⬜ ' + el.textContent.slice(2); }); document.getElementById('ctrlCheck').classList.add('open'); CC.open = true; ctrlCheckTick(); }

function ctrlCheckDone() { document.getElementById('ctrlCheck').classList.remove('open'); CC.open = false; if (typeof showChecklist === 'function' && ACTS[actIdx] && ACTS[actIdx].type === 'checklist') showChecklist(); }

function ccMark(id, txt) { if (CC.done[id]) return; CC.done[id] = true; const el = document.getElementById(id); el.textContent = '✅ ' + el.textContent.slice(2); toast('✔ ' + txt); }

function ctrlCheckTick() { if (!CC.open) return; const pads = navigator.getGamepads ? Array.from(navigator.getGamepads()).filter(Boolean) : []; let stick = null, wheel = null; pads.forEach(g => { if (isWheelId(g.id)) wheel = wheel || g; else if (isStickId(g.id)) stick = stick || g; });
            const rs = document.getElementById('ccStick'), rw = document.getElementById('ccWheel'); rs.classList.toggle('ok', !!stick); rw.classList.toggle('ok', !!wheel);
            document.getElementById('ccStickSt').textContent = stick ? 'CONECTADO' : 'NO DETECTADO'; document.getElementById('ccWheelSt').textContent = wheel ? 'CONECTADO' : 'NO DETECTADO';
            document.getElementById('ccStickTxt').textContent = stick ? stick.id.replace(/\(.*$/, '').trim() + ' · ' + stick.axes.length + ' ejes · ' + stick.buttons.length + ' botones' : 'Buscando… mueve la palanca o presiona el gatillo';
            document.getElementById('ccWheelTxt').textContent = wheel ? wheel.id.replace(/\(.*$/, '').trim() + (/xbox|xinput/i.test(wheel.id) ? ' · modo XInput (G HUB)' : '') : 'Buscando… gira el volante o presiona un botón';
            if (stick) { if (stick.axes[1] < -0.6) ccMark('cc1', 'palanca adelante'); if (Math.abs(stick.axes[0]) > 0.6) ccMark('cc2', 'palanca lateral'); if (stick.buttons[0] && stick.buttons[0].pressed) ccMark('cc3', 'gatillo'); if (!GP.enabled) toggleGamepad(); }
            if (wheel) { const ax = wheel.axes[WHEEL.axis || 0] || 0; if (ax > 0.3) ccMark('cc4', 'volante a la derecha'); if (ax < -0.3) ccMark('cc5', 'volante a la izquierda'); if (wheel.buttons[3] && wheel.buttons[3].pressed) ccMark('cc6', 'botón Y'); if (!WHEEL.enabled) toggleWheel(); }
            const n = Object.keys(CC.done).length; const go = document.getElementById('ccGo');
            if (stick || wheel) { go.style.background = n >= (stick && wheel ? 6 : 3) ? '#2e9e5b' : '#2138D3'; go.textContent = n >= (stick && wheel ? 6 : 3) ? '✅ Controles validados · Continuar' : `▶ Continuar (${n} prueba(s) hechas)`; } else { go.style.background = '#838383'; go.textContent = '▶ Continuar con táctil / teclado'; }
            requestAnimationFrame(ctrlCheckTick); }

function openGpPanel() { toggleGpHelp(true); findGamepad(); findWheel(); renderDeviceList(); refreshSwitches(); }

function refreshSwitches() { const a = document.getElementById('swStick'), b = document.getElementById('swWheel'); if (!a) return; a.className = 'gp-sw ' + (GP.enabled ? 'on' : ''); a.innerHTML = '🎮 Joystick Extreme 3D Pro: <b>' + (GP.enabled ? (GP.index >= 0 ? 'ON · conectado' : 'ON · esperando') : 'OFF') + '</b>'; b.className = 'gp-sw ' + (WHEEL.enabled ? 'on' : ''); b.innerHTML = '🛞 Volante G920: <b>' + (WHEEL.enabled ? (WHEEL.index >= 0 ? 'ON · conectado' : 'ON · esperando') : 'OFF') + '</b>'; }

function toggleGpHelp(force) { const el = document.getElementById('gpHelp'); el.classList.toggle('open', force === undefined ? !el.classList.contains('open') : force); }

function findGamepad() { const pads = navigator.getGamepads ? navigator.getGamepads() : []; GP.index = -1;
            for (const g of pads) { if (!g) continue; if (ROLE_OVERRIDE[g.id] === 'ignore' || isWheelId(g.id)) continue; if (isStickId(g.id)) { GP.index = g.index; GP.name = g.id; break; } }
            const st = document.getElementById('gpStatus'); if (GP.index >= 0) { st.className = 'gp-status ok'; st.textContent = '✅ Detectado: ' + GP.name.replace(/\(.*$/, '').trim() + (/(extreme 3d|046d.*c215)/i.test(GP.name) ? ' · Logitech Extreme 3D Pro' : ' · mapeo genérico'); document.getElementById('gpBadge').textContent = '🎮 ' + (/(extreme 3d)/i.test(GP.name) ? 'EXTREME 3D PRO' : 'JOYSTICK USB'); document.getElementById('gpBadge').classList.add('on'); }
            else { st.className = 'gp-status'; st.textContent = 'Conecta el joystick por USB y mueve la palanca o presiona el gatillo para detectarlo.'; } }

function dzone(v, d) { d = d || 0.08; return Math.abs(v) < d ? 0 : Math.sign(v) * (Math.abs(v) - d) / (1 - d); }

function readGamepad() {
            if (!GP.enabled) return null; const pads = navigator.getGamepads ? navigator.getGamepads() : []; let g = GP.index >= 0 ? pads[GP.index] : null;
            if (!g) { findGamepad(); g = GP.index >= 0 ? pads[GP.index] : null; if (!g) return null; }
            const ax = i => (g.axes[i] !== undefined ? g.axes[i] : 0), bt = i => !!(g.buttons[i] && g.buttons[i].pressed);
            const curve = v => Math.sign(v) * Math.pow(Math.abs(v), 2.4);   // palanca progresiva: poco movimiento = poca velocidad
            const fwd = curve(-dzone(ax(GP_MAP.y), 0.14)); let turn = curve(dzone(ax(GP_MAP.x), 0.12)); const tw = curve(dzone(ax(GP_MAP.twist), 0.18)); if (Math.abs(tw) > Math.abs(turn)) turn = tw;
            // Acelerador de la base → altura del mástil absoluta (adelante = arriba)
            if (g.axes.length > GP_MAP.throttle) { const t = ax(GP_MAP.throttle); if (Math.abs(t - (GP.lastThrottle ?? t)) > 0.01) GP.throttleUntil = performance.now() + 1200; if (performance.now() < (GP.throttleUntil || 0)) {   // la palanca manda solo mientras se mueve: después, botones 5/6, POV, Q/E y pantalla vuelven a controlar el mástil
                 const el = document.getElementById('mastHeight'); const target = (1 - t) / 2 * 100; el.value = parseFloat(el.value) + (target - parseFloat(el.value)) * 0.12; } GP.lastThrottle = t; }
            // Botones de mantener
            if (bt(GP_MAP.b5)) clampSlider('mastHeight', 1.2); if (bt(GP_MAP.b6)) clampSlider('mastHeight', -1.2);
            // Hat / POV: eje 9 en Chrome (valores discretos), o botones 12-15 en mapeo estándar
            let hatUp = false, hatDown = false, hatL = false, hatR = false;
            if (g.axes.length > GP_MAP.hat) { const h = ax(GP_MAP.hat); if (h > -1.05 && h < 1.05 && Math.abs(h) < 3) { const dir = Math.round((h + 1) / 2 * 7); if (Math.abs(h) <= 1.001 && h !== 0 && h > -1.5) { /* 8 posiciones: -1=arriba, -.714=arriba-der, -.428=der, ... */ hatUp = dir === 0 || dir === 1 || dir === 7; hatR = dir >= 1 && dir <= 3; hatDown = dir >= 3 && dir <= 5; hatL = dir >= 5 && dir <= 7; } } }
            if (g.buttons.length >= 16 && g.mapping === 'standard') { hatUp = hatUp || bt(12); hatDown = hatDown || bt(13); hatL = hatL || bt(14); hatR = hatR || bt(15); }
            if (hatUp) clampSlider('mastHeight', 1.2); if (hatDown) clampSlider('mastHeight', -1.2);
            // Flancos (una acción por pulsación)
            const press = i => { const now = bt(i), was = !!GP.prev[i]; GP.prev[i] = now; return now && !was; };
            if (press(GP_MAP.trigger)) honk();
            if (press(GP_MAP.thumb)) toggleLoad();
            if (spec().clamp) { if (press(GP_MAP.b3)) { reachOut = true; document.getElementById('reachLbl').textContent = 'ABRIR'; } if (press(GP_MAP.b4)) { if (hasLoad && reachOut) clampRelease(); reachOut = false; document.getElementById('reachLbl').textContent = 'CERRAR'; } if (press(GP_MAP.b10)) nudgePressure(5); if (press(GP_MAP.b9)) nudgePressure(-5); }
            else { if (press(GP_MAP.b3) || press(GP_MAP.b10)) { reachOut = true; document.getElementById('reachLbl').textContent = 'RETRAER'; }
            if (press(GP_MAP.b4) || press(GP_MAP.b9)) { reachOut = false; document.getElementById('reachLbl').textContent = 'EXTENDER'; } }
            if (press(GP_MAP.b8)) cycleCam(); if (press(GP_MAP.b7)) { camMode = (camMode + CAMS.length - 2) % CAMS.length; cycleCam(); }
            if (press(GP_MAP.b11)) resetPractice(); if (press(GP_MAP.b12)) toggleGamepad();
            GP.hatCooldown = Math.max(0, GP.hatCooldown - 1); if ((hatL || hatR) && !GP.hatCooldown) { GP.hatCooldown = 20; if (hatR) cycleCam(); else { camMode = (camMode + CAMS.length - 2) % CAMS.length; cycleCam(); } }
            // Monitor en vivo
            if (document.getElementById('gpHelp').classList.contains('open')) document.getElementById('gpLive').textContent = 'Ejes: ' + g.axes.map((a, i) => i + ':' + a.toFixed(2)).join('  ') + '\nBotones: ' + g.buttons.map((b, i) => b.pressed ? '[' + (i + 1) + ']' : '').join('');
            return { fwd, turn, active: Math.abs(fwd) > 0 || Math.abs(turn) > 0 };
        }

function calibWheel() { WHEEL.calib = { base: null }; toast('🛞 Gira el volante a la DERECHA hasta la mitad…'); }

function setRole(id, role) { ROLE_OVERRIDE[id] = role; localStorage.setItem('dicka_gp_roles', JSON.stringify(ROLE_OVERRIDE)); GP.index = -1; WHEEL.index = -1; findGamepad(); findWheel(); if (role === 'wheel' && !WHEEL.enabled) toggleWheel(); if (role === 'stick' && !GP.enabled) toggleGamepad(); renderDeviceList(); toast('Dispositivo asignado como ' + (role === 'wheel' ? 'volante' : role === 'stick' ? 'joystick' : 'ignorado')); }

function toggleWheel() { WHEEL.enabled = !WHEEL.enabled; document.getElementById('wheelLbl').textContent = WHEEL.enabled ? 'ON' : 'G920'; document.getElementById('btnWheel').style.background = WHEEL.enabled ? '#2e9e5b' : 'rgba(29,37,134,.85)';
            if (WHEEL.enabled) { findWheel(); renderDeviceList(); toast('🛞 Volante G920 activado · solo dirección'); } else { document.getElementById('wheelBadge').classList.remove('on'); toast('🛞 Volante desactivado'); } refreshSwitches(); }

function openUsbDiag() { if (window.__dickaDiag) { document.open(); document.write(window.__dickaDiag); document.close(); return; } if (/\/juegos\//.test(location.pathname)) { location.href = 'diagnostico-usb.html'; return; } alert('Abre la pantalla de validación desde el Dojo Virtual (botón 🔌 Validar joystick y volante USB).'); }

function renderDeviceList() { const el = document.getElementById('gpDevices'); if (!el) return; const pads = (navigator.getGamepads ? Array.from(navigator.getGamepads()) : []).filter(Boolean);
            if (!pads.length) { el.className = 'gp-status'; el.innerHTML = 'Ninguno todavía. Presiona <b>cualquier botón</b> del volante (A/B/X/Y) o del joystick: el navegador no lo muestra hasta recibir una pulsación.'; return; }
            el.className = 'gp-status ok'; el.innerHTML = pads.map(g => { const role = ROLE_OVERRIDE[g.id] || (isWheelId(g.id) ? 'wheel' : isStickId(g.id) ? 'stick' : 'none'); const xin = /xbox|xinput/i.test(g.id);
                return `<div class="gp-dev"><span>🔌 <b>${g.id.replace(/\(.*$/, '').trim()}</b> · ${g.axes.length} ejes · ${g.buttons.length} botones${xin ? ' · <i>modo XInput (G HUB)</i>' : ''}</span><select onchange="setRole('${g.id.replace(/'/g, "\\'")}', this.value)"><option value="wheel" ${role === 'wheel' ? 'selected' : ''}>🛞 Volante</option><option value="stick" ${role === 'stick' ? 'selected' : ''}>🎮 Joystick</option><option value="ignore" ${role === 'ignore' ? 'selected' : ''}>Ignorar</option>${role === 'none' ? '<option value="none" selected>¿Qué es?</option>' : ''}</select></div>`; }).join('') + `<div style="margin-top:.4rem;font-size:10px;color:#9fb0ff">Eje de dirección actual: ${WHEEL.axis}${WHEEL.invert ? ' (invertido)' : ''} · si el volante no responde usa "Detectar eje".</div>`; }

function findWheel() { const pads = navigator.getGamepads ? navigator.getGamepads() : []; WHEEL.index = -1;
            for (const g of pads) { if (!g) continue; if (ROLE_OVERRIDE[g.id] === 'ignore') continue; if (isWheelId(g.id)) { WHEEL.index = g.index; WHEEL.name = g.id; break; } }
            const st = document.getElementById('wheelStatus'); if (WHEEL.index >= 0) { st.className = 'gp-status ok'; st.textContent = '✅ Volante detectado: ' + WHEEL.name.replace(/\(.*$/, '').trim() + ' · controla solo la dirección'; document.getElementById('wheelBadge').textContent = '🛞 ' + (/g920/i.test(WHEEL.name) ? 'G920 DIRECCIÓN' : 'VOLANTE'); document.getElementById('wheelBadge').classList.add('on'); }
            else { st.className = 'gp-status'; st.textContent = WHEEL.enabled ? 'Conecta el G920 por USB y presiona cualquier botón del volante (A/B/X/Y): se enlaza solo, no requiere pedales.' : 'Volante desactivado. Conecta el G920 y presiona un botón del volante: se activa automáticamente.'; document.getElementById('wheelBadge').classList.remove('on'); } }

function readWheel() { if (!WHEEL.enabled) return null; const pads = navigator.getGamepads ? navigator.getGamepads() : []; let g = WHEEL.index >= 0 ? pads[WHEEL.index] : null;
            if (!g || !isWheelId(g.id)) { findWheel(); g = WHEEL.index >= 0 ? pads[WHEEL.index] : null; if (!g) return null; }
            const raw = g.axes[WHEEL.axis || 0] || 0; const turn = Math.max(-1, Math.min(1, dzone(raw, 0.02) * WHEEL.sens * (WHEEL.invert ? -1 : 1)));
            if (WHEEL.calib) { if (!WHEEL.calib.base) WHEEL.calib.base = [...g.axes]; const i = g.axes.findIndex((v, k) => Math.abs(v - WHEEL.calib.base[k]) > 0.35); if (i >= 0) { WHEEL.axis = i; WHEEL.invert = (g.axes[i] - WHEEL.calib.base[i]) < 0; WHEEL.calib = null; localStorage.setItem('dicka_wheel_axis', JSON.stringify({ axis: i, invert: WHEEL.invert })); toast('🛞 Eje del volante detectado: ' + i + (WHEEL.invert ? ' (invertido)' : '')); renderDeviceList(); } }
            // Botón Y del volante (índice 3 en el mapeo Xbox del G920) → cambia el enfoque de la cámara
            const yNow = !!(g.buttons[3] && g.buttons[3].pressed); if (yNow && !WHEEL.prevY) cycleCam(); WHEEL.prevY = yNow;
            if (document.getElementById('gpHelp').classList.contains('open')) { const lv = document.getElementById('gpLive'); lv.textContent = (lv.textContent.split('\n🛞')[0]) + '\n🛞 Volante: ' + (raw * 450).toFixed(0) + '° → dirección ' + (turn * 100).toFixed(0) + '%'; }
            return { turn, active: Math.abs(turn) > 0 }; }

function crashSound(intensity) { try { const ctx = audioCtx(); const t = ctx.currentTime; const dur = 0.35 + intensity * 0.25;
            const buf = ctx.createBuffer(1, ctx.sampleRate * dur, ctx.sampleRate); const d = buf.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / d.length, 2.2);
            const src = ctx.createBufferSource(); src.buffer = buf; const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.setValueAtTime(2200 * intensity + 400, t); lp.frequency.exponentialRampToValueAtTime(120, t + dur);
            const g = ctx.createGain(); g.gain.value = 0.55 * Math.min(1.4, intensity); src.connect(lp); lp.connect(g); g.connect(ctx.destination); src.start(t);
            const o = ctx.createOscillator(); o.type = 'sine'; o.frequency.setValueAtTime(90, t); o.frequency.exponentialRampToValueAtTime(35, t + 0.4); const og = ctx.createGain(); og.gain.setValueAtTime(0.7 * intensity, t); og.gain.exponentialRampToValueAtTime(0.001, t + 0.45); o.connect(og); og.connect(ctx.destination); o.start(t); o.stop(t + 0.5);
            if (intensity > 0.8) { const o2 = ctx.createOscillator(); o2.type = 'square'; o2.frequency.setValueAtTime(1800, t); o2.frequency.exponentialRampToValueAtTime(600, t + 0.15); const g2 = ctx.createGain(); g2.gain.setValueAtTime(0.08, t); g2.gain.exponentialRampToValueAtTime(0.001, t + 0.18); o2.connect(g2); g2.connect(ctx.destination); o2.start(t); o2.stop(t + 0.2); } } catch (e) {} }

function impactFX(intensity) { shake = 0.25 + intensity * 0.6; crashSound(intensity); if (navigator.vibrate) navigator.vibrate(intensity > 0.8 ? [120, 60, 180] : 120);
            const w = document.querySelector('.canvas-wrapper'); if (w) { const f = document.createElement('div'); f.className = 'impact'; f.style.setProperty('--i', intensity); w.appendChild(f); setTimeout(() => f.remove(), 450); }
            // rebote físico del chasis
            pitch -= 0.05 * intensity; roll += (Math.random() - .5) * 0.08 * intensity; }

function toggleFullscreen() { const w = document.getElementById('canvasWrap'); const doc = document; if (!doc.fullscreenElement && !doc.webkitFullscreenElement) { (w.requestFullscreen || w.webkitRequestFullscreen).call(w); } else { (doc.exitFullscreen || doc.webkitExitFullscreen).call(doc); } }

function cycleCam() { camMode = (camMode + 1) % CAMS.length; document.getElementById('camLbl').textContent = CAMS[camMode].name === 'HORQUILLAS' ? 'HORQ.' : CAMS[camMode].name; toast('📷 ' + CAMS[camMode].name + ' · ' + CAMS[camMode].desc); }

function playerAisle() { const z = forkPosition.z; if (z < -39 || z > 2) return null; let a = null; AISLES.forEach((x, i) => { if (Math.abs(forkPosition.x - x.x) < x.half + 0.8) a = i + 1; }); return a; }

function checkRackDistance() { if (rackWarnCd > 0) { rackWarnCd--; return; } const a = playerAisle(); if (a === null || simSpeed < 0.3) return; const half = AISLES[a - 1].half, cx = AISLES[a - 1].x; const gap = half - Math.abs(forkPosition.x - cx) - spec().w / 2; const minGap = SIM_CFG.rackDistance !== undefined ? SIM_CFG.rackDistance : 0.35;
            if (gap < minGap) { registerFault('proximidadRack'); rackWarnCd = 90; } else if (gap < minGap + 0.2 && rackWarnCd === 0) { toast('⚠️ Muy cerca del rack: ' + Math.max(0, gap).toFixed(2) + ' m'); rackWarnCd = 60; } }

function checkAisleRule() { const a = playerAisle(); if (a !== lastAisle) { if (a !== null) { const busy = NPC.forks.some(f => f.aisle === a && Math.abs(f.z) < 40 && Math.abs(f.x - forkPosition.x) < 3); if (busy) registerFault('pasilloOcupado'); } lastAisle = a; } }

function inAisle() { const z = forkPosition.z; if (z < -39 || z > 2) return false; return AISLES.some(a => Math.abs(forkPosition.x - a.x) < a.half + 0.6); }

function pointBlocked(x, y, z) { if (y > 11) return false; return obstacles.some(o => !o.disabled && x > o.minX - 0.3 && x < o.maxX + 0.3 && z > o.minZ - 0.3 && z < o.maxZ + 0.3); }

function buildEnvironment() { try { if (!THREE.PMREMGenerator) return; const envScene = new THREE.Scene(); envScene.background = new THREE.Color(0x222b3e);
            const panel = (color, w, h, d, x, y, z) => { const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), new THREE.MeshBasicMaterial({ color })); m.position.set(x, y, z); envScene.add(m); };
            panel(0x0c1220, 44, 0.2, 44, 0, -6, 0); panel(0x3a4257, 44, 0.2, 44, 0, 7, 0); panel(0x1a2333, 0.2, 14, 44, -16, 0, 0); panel(0x1a2333, 0.2, 14, 44, 16, 0, 0); panel(0x1e293b, 44, 14, 0.2, 0, 0, -18);
            [-9, 0, 9].forEach(z => panel(0xe8eefb, 34, 0.2, 1.8, 0, 6.4, z)); panel(0xffe6bd, 26, 0.2, 1.2, 0, 6.4, -14);
            const pmrem = new THREE.PMREMGenerator(renderer); scene.environment = pmrem.fromScene(envScene, 0.03).texture; pmrem.dispose(); envScene.traverse(o => { if (o.isMesh) { o.geometry.dispose(); o.material.dispose(); } }); } catch (e) { console.warn('[SIM] IBL no disponible:', e.message); } }

function hardHat(scene) { scene.traverse(o => { if (!o.isMesh || !/Helmet/i.test(o.name) || (o.material && o.material.userData.abs)) return;
                const c = document.createElement('canvas'); c.width = c.height = 512; const g = c.getContext('2d'); g.fillStyle = '#f2c200'; g.fillRect(0, 0, 512, 512);
                const id = g.getImageData(0, 0, 512, 512); for (let i = 0; i < id.data.length; i += 4) { const v = (Math.random() - .5) * 16; id.data[i] += v; id.data[i + 1] += v; id.data[i + 2] += v * .4; } g.putImageData(id, 0, 0);
                for (let i = 0; i < 70; i++) { g.strokeStyle = `rgba(${Math.random() < .6 ? '255,250,225' : '120,90,20'},${0.15 + Math.random() * 0.3})`; g.lineWidth = .6 + Math.random() * 1.6; g.beginPath(); const x = Math.random() * 512, y = Math.random() * 512, a = Math.random() * 6.3, l = 6 + Math.random() * 40; g.moveTo(x, y); g.lineTo(x + Math.cos(a) * l, y + Math.sin(a) * l); g.stroke(); }   // raspones
                for (let i = 0; i < 12; i++) { g.fillStyle = `rgba(90,70,30,${0.06 + Math.random() * 0.08})`; g.beginPath(); g.ellipse(Math.random() * 512, Math.random() * 512, 8 + Math.random() * 30, 4 + Math.random() * 14, Math.random() * 3, 0, 7); g.fill(); }   // polvo y uso
                const tex = new THREE.CanvasTexture(c); tex.encoding = THREE.sRGBEncoding; tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
                const lc = document.createElement('canvas'); lc.width = 256; lc.height = 128; const l = lc.getContext('2d'); l.fillStyle = '#011131'; l.beginPath(); l.roundRect ? l.roundRect(4, 14, 248, 100, 18) : l.rect(4, 14, 248, 100); l.fill(); l.fillStyle = '#fff'; l.font = '900 56px Arial Black, Arial'; l.textAlign = 'center'; l.fillText('DICKA', 128, 78); l.font = '700 18px Arial'; l.fillText('LOGISTICS', 128, 102);
                const logo = new THREE.CanvasTexture(lc); logo.encoding = THREE.sRGBEncoding;
                const P = THREE.MeshPhysicalMaterial || THREE.MeshStandardMaterial; const m = new P({ skinning: !!o.isSkinnedMesh, map: tex, bumpMap: tex, bumpScale: 0.0015, roughness: 0.38, clearcoat: 0.7, clearcoatRoughness: 0.25, envMapIntensity: 1.1 }); m.userData.abs = true;
                m.onBeforeCompile = sh => { sh.uniforms.uLogo = { value: logo }; sh.vertexShader = 'varying vec3 vHP;\nvarying vec3 vHN;\n' + sh.vertexShader.replace('#include <begin_vertex>', '#include <begin_vertex>\n vHP = position; vHN = normal;');
                    sh.fragmentShader = 'uniform sampler2D uLogo;\nvarying vec3 vHP;\nvarying vec3 vHN;\n' + sh.fragmentShader.replace('#include <map_fragment>', `#include <map_fragment>
                    vec2 lu = vec2((vHP.x + 0.055) / 0.11, (vHP.y - 1.69) / 0.055); if (vHN.z > 0.35 && vHP.z > 0.0 && lu.x > 0.0 && lu.x < 1.0 && lu.y > 0.0 && lu.y < 1.0) { vec4 lc = texture2D(uLogo, lu); diffuseColor.rgb = mix(diffuseColor.rgb, lc.rgb, lc.a); }`); };
                m.customProgramCacheKey = () => 'abs'; o.material = m; }); }

function dickaVest(scene) { return new Promise(done => { const skin = new Image(); skin.onload = () => { SKIN_IMG = skin; go(); }; skin.onerror = () => go(); skin.src = 'assets/textures/piel.jpg'; const go = () => { const logo = new Image(); logo.onload = () => { const seen = new Set();
            scene.traverse(o => { if (!o.isMesh || !o.material || !o.material.map || !o.material.map.image || seen.has(o.material.map)) return; const m = o.material, img = m.map.image; seen.add(m.map); if (!/body/i.test(m.name || '')) return;
                const c = document.createElement('canvas'); c.width = img.width; c.height = img.height; const g = c.getContext('2d'); g.drawImage(img, 0, 0);
                const X0 = Math.floor(VEST_UV.x0 * c.width), Y0 = Math.floor(VEST_UV.y0 * c.height), W = Math.ceil((VEST_UV.x1 - VEST_UV.x0) * c.width), H = Math.ceil((VEST_UV.y1 - VEST_UV.y0) * c.height);
                const d = g.getImageData(X0, Y0, W, H), a = d.data;
                for (let i = 0; i < a.length; i += 4) { const r = a[i], gg = a[i + 1], b = a[i + 2], mx = Math.max(r, gg, b), mn = Math.min(r, gg, b); if (mx < 60 || r < gg || (mx - mn) / mx < 0.45) continue; const hue = 60 * ((gg - b) / (mx - mn)); if (hue < 2 || hue > 42) continue;   // naranja
                    const v = mx / 255; a[i] = 18 * v * 0.85; a[i + 1] = 70 * v * 0.85; a[i + 2] = 140 * v * 0.85; }   // azul DICKA conservando el sombreado de la tela
                g.putImageData(d, X0, Y0);
                if (SKIN_IMG && SKIN_IMG.width) { const sc = document.createElement('canvas'); sc.width = sc.height = 256; const sg = sc.getContext('2d'); sg.drawImage(SKIN_IMG, 0, 0, 256, 256); const sd = sg.getImageData(0, 0, 256, 256).data; let mean = 0; for (let i = 0; i < sd.length; i += 4) mean += sd[i] + sd[i + 1] + sd[i + 2]; mean /= (sd.length / 4) * 3;
                    const all = g.getImageData(0, 0, c.width, c.height), A = all.data, W2 = c.width;   // poros y microtextura de piel real (textura CC0) sólo sobre píxeles de piel, con contraste realzado
                    for (let i = 0; i < A.length; i += 4) { const r = A[i], gg = A[i + 1], b = A[i + 2]; if (!(r > 90 && r > gg && gg > b && r - b > 30 && r - gg < 90 && r < 250)) continue; const px = (i / 4) % W2, py = ((i / 4) / W2) | 0; if (px < VEST_UV.x1 * W2 && py > VEST_UV.y0 * c.height) continue;
                        const k = (((py % 256) * 256 + (px % 256)) * 4); const d = ((sd[k] + sd[k + 1] + sd[k + 2]) / 3 - mean) * 1.4; A[i] = Math.max(0, Math.min(255, r + d)); A[i + 1] = Math.max(0, Math.min(255, gg + d * 0.9)); A[i + 2] = Math.max(0, Math.min(255, b + d * 0.85)); }
                    g.putImageData(all, 0, 0); }
                VEST_LOGOS.forEach(([u, v, w]) => { const lw = w * c.width, lh = lw * logo.height / logo.width; g.drawImage(logo, u * c.width - lw / 2, v * c.height - lh / 2, lw, lh); });
                const t = new THREE.CanvasTexture(c); t.flipY = m.map.flipY; t.encoding = THREE.sRGBEncoding; t.wrapS = m.map.wrapS; t.wrapT = m.map.wrapT; t.anisotropy = 4; m.map = t; m.needsUpdate = true; });
            done(); }; logo.onerror = () => done(); logo.src = LOGO_DATA_W; }; }); }

function gearMats() { if (GEAR.frame) return GEAR; const C = h => new THREE.Color(h).convertSRGBToLinear();
            GEAR.frame = new THREE.MeshStandardMaterial({ color: C(0x15171b), roughness: 0.4, metalness: 0.2 });
            GEAR.lens = new THREE.MeshStandardMaterial({ color: C(0xcfe3ff), roughness: 0.05, metalness: 0.1, transparent: true, opacity: 0.28, depthWrite: false });
            GEAR.radio = new THREE.MeshStandardMaterial({ color: C(0x1a1c20), roughness: 0.6 });
            const c = document.createElement('canvas'); c.width = 128; c.height = 192; const g = c.getContext('2d'); g.fillStyle = '#fff'; g.fillRect(0, 0, 128, 192); g.fillStyle = '#1D2586'; g.fillRect(0, 0, 128, 46); g.fillStyle = '#d7dbe6'; g.fillRect(34, 60, 60, 66); g.fillStyle = '#1D2586'; g.font = 'bold 18px Arial'; g.textAlign = 'center'; g.fillText('OPERADOR', 64, 150); g.font = '12px Arial'; g.fillText('DICKA LOGISTICS', 64, 172);
            const t = new THREE.CanvasTexture(c); t.encoding = THREE.sRGBEncoding; GEAR.badge = new THREE.MeshStandardMaterial({ map: t, roughness: 0.35 });
            const lg = new Image(); lg.onload = () => { g.drawImage(lg, 14, 8, 100, 100 * lg.height / lg.width); t.needsUpdate = true; }; lg.src = LOGO_DATA_W;
            const hl = new THREE.TextureLoader().load(LOGO_DATA); hl.encoding = THREE.sRGBEncoding; GEAR.hatLogo = new THREE.MeshBasicMaterial({ map: hl, transparent: true, depthWrite: false });
            return GEAR; }

function gltfPrepareBones(av) { if (av.bones) return; av.bones = {}; av.rest = {}; av.obj.traverse(o => { if (!o.isBone) return; for (const k in GLTF_BONES) if (GLTF_BONES[k].test(o.name) && !av.bones[k]) { av.bones[k] = o; av.rest[k] = o.quaternion.clone(); } }); av.hipsY0 = av.bones.hips ? av.bones.hips.position.y : 0; }

function straightenHand(av, side) { if (!av.handBones) { av.handBones = {}; const src = {}; GLTF_AVATAR.gltf.scene.traverse(o => { if (o.isBone) src[o.name] = o.quaternion; }); av.obj.traverse(o => { if (o.isBone && /(Left|Right)Hand/.test(o.name) && src[o.name]) { const sd = /Right/.test(o.name) ? 'Right' : 'Left'; (av.handBones[sd] = av.handBones[sd] || []).push([o, src[o.name].clone()]); } }); }
            (av.handBones[side] || []).forEach(([b, q]) => b.quaternion.copy(q)); }

function gltfPlay(av, name, fade = 0.25) { if (!av) return; if (!av.acts[name]) { if (name === 'idle' && av.acts.walk) { if (av.current !== 'idle') { av.acts.walk.paused = true; av.acts.walk.time = 0; av.current = 'idle'; } return; } if (name === 'wave') name = 'idle'; if (!av.acts[name]) return; } if (av.current === name) { if (name === 'walk') av.acts.walk.paused = false; return; } const to = av.acts[name]; to.paused = false; to.reset().fadeIn(fade).play(); if (av.current && av.acts[av.current] && av.current !== name) av.acts[av.current].fadeOut(fade); av.current = name; }

function matKey(m) { return [m.type, m.color ? m.color.getHex() : 0, m.map ? m.map.uuid : '-', m.normalMap ? m.normalMap.uuid : '-', m.roughnessMap ? m.roughnessMap.uuid : '-', m.emissive ? m.emissive.getHex() : 0, m.emissiveIntensity || 0, m.roughness, m.metalness, m.opacity, m.side, m.wireframe ? 1 : 0].join('|'); }

function mergeSceneStatics() { const keep = new Set([forklift, cargo, window.roofMesh, slotMarker, slotLabel, bayGroup, TRAILER && TRAILER.g].filter(Boolean)); NPC.forks.forEach(f => keep.add(f.g)); NPC.peds.forEach(pd => keep.add(pd.g)); FRIDGES.forEach(f => keep.add(f)); BANNERS.forEach(b => keep.add(b)); if (DOCK_GRP) keep.add(DOCK_GRP);
            const stat = new THREE.Group(); stat.name = 'sceneStatics'; const cand = scene.children.filter(o => o.isMesh && !o.name && !keep.has(o) && !o.isInstancedMesh && !o.material.transparent && !Array.isArray(o.material) && !o.material.isMeshPhysicalMaterial && o.material.side !== THREE.BackSide && !(o.material.map && o.material.map.image && o.material.map.image.width > 1024 && o.geometry.type === 'PlaneGeometry' && o.geometry.parameters.width > 40));
            cand.forEach(o => { scene.remove(o); stat.add(o); }); const before = cand.length; mergeStaticMeshes(stat); let after = 0; stat.traverse(o => { if (o.isMesh) { after++; o.castShadow = false; o.receiveShadow = true; } }); scene.add(stat); console.log('[SIM] Estáticos de escena fusionados:', before, '→', after); }

function mergeStaticMeshes(node, vcMode) {
            // 1) procesar recursivamente las articulaciones con nombre
            node.children.slice().forEach(c => { if (c.isGroup && !c.isLOD && (c.name || c.children.some(ch => ch.isGroup && ch.name))) mergeStaticMeshes(c, vcMode); });
            // 2) recolectar mallas estáticas de este nivel (mallas directas y grupos sin nombre, aplanados)
            const buckets = new Map(); const remove = [];
            const collect = (obj, parentMatrix) => { obj.updateMatrix(); const m = parentMatrix.clone().multiply(obj.matrix);
                if (obj.isMesh) { if (obj.name || obj.isLOD || obj.isInstancedMesh || obj.isSkinnedMesh || (obj.material.transparent && !vcMode && obj.material.opacity < 0.9 && false) || obj.material.side === THREE.BackSide || obj.material.isMeshPhysicalMaterial || Array.isArray(obj.material)) return false; if (obj.material.transparent && vcMode) return false; const key = vcMode ? 'vc' : matKey(obj.material); if (!buckets.has(key)) buckets.set(key, { mat: vcMode ? VC_MAT : obj.material, geos: [] }); const g = obj.geometry.clone(); g.applyMatrix4(m); ['uv2', 'tangent', 'color'].forEach(a => g.deleteAttribute(a));
                    if (vcMode) { const n = g.attributes.position.count, col = new Float32Array(n * 3); const c = (obj.material.color || new THREE.Color(0x888888)).clone().convertSRGBToLinear(); for (let i = 0; i < n; i++) { col[i * 3] = c.r; col[i * 3 + 1] = c.g; col[i * 3 + 2] = c.b; } g.setAttribute('color', new THREE.BufferAttribute(col, 3)); } if (!g.attributes.uv) g.setAttribute('uv', new THREE.Float32BufferAttribute(new Float32Array(g.attributes.position.count * 2), 2)); buckets.get(key).geos.push(g); return true; }
                if (obj.isGroup && !obj.name && !obj.isLOD) { let all = true; obj.children.forEach(ch => { if (!collect(ch, m)) all = false; }); return all; }
                return false; };
            node.children.slice().forEach(c => { if (c.isMesh || (c.isGroup && !c.name && !c.isLOD)) { if (collect(c, new THREE.Matrix4())) remove.push(c); } });
            if (!remove.length) return;
            remove.forEach(c => node.remove(c));
            buckets.forEach(b => { if (!b.geos.length) return; let merged; try { merged = THREE.BufferGeometryUtils.mergeBufferGeometries(b.geos, false); } catch (e) { merged = null; } if (!merged) { b.geos.forEach(g => { const mesh = new THREE.Mesh(g, b.mat); node.add(mesh); }); return; } b.geos.forEach(g => g.dispose()); const mesh = new THREE.Mesh(merged, b.mat); mesh.castShadow = true; mesh.receiveShadow = true; node.add(mesh); });
        }

function heightToNormal(heightCanvas, strength = 2.0) { const sz = heightCanvas.width; const src = heightCanvas.getContext('2d').getImageData(0, 0, sz, sz).data; const out = document.createElement('canvas'); out.width = out.height = sz; const oc = out.getContext('2d'), img = oc.createImageData(sz, sz);
          const h = (i, j) => src[(((j % sz) + sz) % sz * sz + ((i % sz) + sz) % sz) * 4] / 255;
          for (let j = 0; j < sz; j++) for (let i = 0; i < sz; i++) { const dx = (h(i + 1, j) - h(i - 1, j)) * strength, dy = (h(i, j + 1) - h(i, j - 1)) * strength; const len = Math.hypot(-dx, -dy, 1); const k = (j * sz + i) * 4; img.data[k] = (-dx / len * .5 + .5) * 255; img.data[k + 1] = (-dy / len * .5 + .5) * 255; img.data[k + 2] = (1 / len * .5 + .5) * 255; img.data[k + 3] = 255; }
          oc.putImageData(img, 0, 0); return out; }

function drawHeight(kind, size = 256) { const c = document.createElement('canvas'); c.width = c.height = size; const x = c.getContext('2d'); x.fillStyle = '#808080'; x.fillRect(0, 0, size, size); x.lineWidth = 1;
          if (kind === 'twill') { for (let i = -size; i < size * 2; i += 4) { x.strokeStyle = 'rgba(255,255,255,.30)'; x.beginPath(); x.moveTo(i, 0); x.lineTo(i + size, size); x.stroke(); x.strokeStyle = 'rgba(0,0,0,.22)'; x.beginPath(); x.moveTo(i + 2, 0); x.lineTo(i + 2 + size, size); x.stroke(); } }
          else if (kind === 'weave') { for (let i = 0; i < size; i += 3) { x.strokeStyle = 'rgba(255,255,255,.22)'; x.beginPath(); x.moveTo(i, 0); x.lineTo(i, size); x.stroke(); x.strokeStyle = 'rgba(0,0,0,.18)'; x.beginPath(); x.moveTo(0, i + 1); x.lineTo(size, i + 1); x.stroke(); } }
          else if (kind === 'mesh') { x.fillStyle = '#b8b8b8'; x.fillRect(0, 0, size, size); x.fillStyle = '#3a3a3a'; for (let j = 0; j < size; j += 8) for (let i = 0; i < size; i += 8) { x.beginPath(); x.arc(i + 4, j + 4, 2.1, 0, 6.2832); x.fill(); } }
          else if (kind === 'leather') { for (let n = 0; n < 2600; n++) { const r = 1 + Math.random() * 2.2; x.fillStyle = `rgba(${Math.random() > .5 ? 255 : 0},${Math.random() > .5 ? 255 : 0},255,.05)`; x.beginPath(); x.arc(Math.random() * size, Math.random() * size, r, 0, 6.2832); x.fill(); } }
          return c; }

function fabricMaterial(baseHex, kind, extra = {}) { const key = kind + '_' + baseHex.toString(16);
          if (!TEXCACHE[key]) { const hc = drawHeight(kind); const alb = document.createElement('canvas'); alb.width = alb.height = 256; const ax = alb.getContext('2d'); ax.fillStyle = '#' + baseHex.toString(16).padStart(6, '0'); ax.fillRect(0, 0, 256, 256); ax.globalAlpha = 0.16; ax.drawImage(hc, 0, 0); ax.globalAlpha = 1;
            const map = new THREE.CanvasTexture(alb), nrm = new THREE.CanvasTexture(heightToNormal(hc, 2.2)), rgh = new THREE.CanvasTexture(hc); map.encoding = THREE.sRGBEncoding; [map, nrm, rgh].forEach(t => { t.wrapS = t.wrapT = THREE.RepeatWrapping; t.anisotropy = 4; }); TEXCACHE[key] = { map, nrm, rgh }; }
          const t = TEXCACHE[key]; return new THREE.MeshStandardMaterial(Object.assign({ color: 0xffffff, map: t.map, normalMap: t.nrm, roughnessMap: t.rgh, normalScale: new THREE.Vector2(0.6, 0.6), metalness: 0 }, extra)); }

function capsule(r1, r2, h, mat, seg = 14) { const g = new THREE.Group(); const cyl = new THREE.Mesh(new THREE.CylinderGeometry(r1, r2, h, seg), mat); cyl.position.y = -h / 2; g.add(cyl); const top = new THREE.Mesh(new THREE.SphereGeometry(r1, seg, 10), mat); g.add(top); const bot = new THREE.Mesh(new THREE.SphereGeometry(r2, seg, 10), mat); bot.position.y = -h; g.add(bot); return g; }

function skinVariation(base, amt = 0.06) { const c = new THREE.Color(base); const h = {}; c.getHSL(h); h.l = Math.max(0, Math.min(1, h.l + (Math.random() - .5) * amt)); h.s = Math.max(0, Math.min(1, h.s + (Math.random() - .5) * amt * .5)); return c.setHSL(h.h, h.s, h.l).getHex(); }

function buildHuman(look, opts) { opts = Object.assign({ seated: false, hipY: 0.94, wave: false, detail: 3, lod: true }, opts || {});
            // Nivel de detalle de TODO el cuerpo: cerca (< 9 m) malla densa (detail 3 ≈ 3× segmentos en cada pieza); lejos, malla base. La animación se aplica al nivel 0 y se sincroniza al nivel 1.
            if (opts.lod && opts.detail > 1) { const root = new THREE.Group(); root.name = 'body'; const lod = new THREE.LOD(); lod.name = 'bodyLOD'; lod.addLevel(buildBody(look, opts, opts.detail), 0); lod.addLevel(buildBody(look, opts, Math.max(1.4, opts.detail / 2)), 6); lod.addLevel(buildBody(look, opts, 1), 14); root.add(lod); root.userData.blink = lod.children[0].userData.blink; return root; }
            return buildBody(look, opts, opts.detail); }

function buildBody(look, opts, FD) {
          look = Object.assign({ skin: 0xc8956c, hair: 0x2b1b12, hairStyle: 'short', shirt: 0x2a5a9c, pants: 0x223f6e, vest: 0x1769aa, helmet: 0xf2d21b, glasses: true, seatbelt: false, ponytail: false, badge: true, radio: false, bodyType: 'medium' }, look || {});
          const skinHex = skinVariation(look.skin);
          const M = (c, o) => new THREE.MeshStandardMaterial(Object.assign({ color: c, roughness: .85, metalness: 0 }, o || {}));
          const fab = (hex, kind, extra) => FD < 2 ? M(hex, extra) : fabricMaterial(hex, kind, extra);
          const skin = M(skinHex, { roughness: .52 }), shirt = fab(look.shirt, 'weave', { roughness: .80 }), pants = fab(look.pants, 'twill', { roughness: .86 }), vest = fab(look.vest, 'mesh', { roughness: .72 }), refl = M(0xcfd6df, { emissive: 0x2a3340, emissiveIntensity: .35, roughness: .32, metalness: .10 }), boot = fab(0x3a2414, 'leather', { roughness: .62 }), sole = M(0x151515, { roughness: .9 }), helmetMat = M(look.helmet, { roughness: .34 }), gloveBack = M(0xe8c22a, { roughness: .78 }), glovePalm = M(0x3a3a3a, { roughness: .7 }), lensMat = new THREE.MeshPhysicalMaterial({ color: 0xffffff, transparent: true, opacity: .22, roughness: .06, metalness: 0, transmission: 0.6, ior: 1.49, side: THREE.DoubleSide }), frameMat = M(0x2b2f36, { roughness: .4 });
          const bodyScale = look.bodyType === 'slim' ? 0.92 : look.bodyType === 'broad' ? 1.08 : 1.0;
          const body = new THREE.Group(); body.name = 'bodyInner'; const hipY = opts.hipY;

          // ---- Piernas ----
          ['L', 'R'].forEach((sd, i) => { const hip = new THREE.Group(); hip.position.set(i ? .10 : -.10, hipY, 0); hip.name = 'leg' + sd;
            const thighP = []; for (let k = 0; k <= Math.round(10 * FD); k++) { const t = k / Math.round(10 * FD); thighP.push(new THREE.Vector2((0.094 - 0.026 * t - 0.012 * Math.sin(t * Math.PI)) * bodyScale, -t * 0.42)); }
            const thigh = new THREE.Mesh(new THREE.LatheGeometry(thighP, Math.round(16 * FD)), pants); hip.add(thigh); const hipCap = new THREE.Mesh(new THREE.SphereGeometry(.094 * bodyScale, Math.round(16 * FD), Math.round(10 * FD)), pants); hipCap.scale.y = .8; hip.add(hipCap);
            const knee = new THREE.Group(); knee.position.y = -.44; knee.name = 'knee' + sd;
            const patella = new THREE.Mesh(new THREE.SphereGeometry(.063 * bodyScale, Math.round(16 * FD), Math.round(12 * FD)), pants); patella.scale.set(1, .8, 1.0); patella.position.z = .004; knee.add(patella);
            const calfP = []; for (let k = 0; k <= Math.round(12 * FD); k++) { const t = k / Math.round(12 * FD); const r = (0.066 - 0.03 * t + 0.016 * Math.sin(t * Math.PI) * (1 - t * 0.4)) * bodyScale; calfP.push(new THREE.Vector2(r, -t * 0.36)); }
            const calf = new THREE.Mesh(new THREE.LatheGeometry(calfP, Math.round(16 * FD)), pants); calf.position.z = -.004; knee.add(calf);
            const gemelo = new THREE.Mesh(new THREE.SphereGeometry(.05 * bodyScale, Math.round(12 * FD), Math.round(10 * FD)), pants); gemelo.scale.set(.9, 1.5, .8); gemelo.position.set(0, -.12, -.03); knee.add(gemelo);
            const cuffP = new THREE.Mesh(new THREE.CylinderGeometry(.052, .056, .04, Math.round(14 * FD), 1, true), pants); cuffP.position.y = -.35; knee.add(cuffP);
            const bootG = new THREE.Group(); bootG.position.y = -.38; bootG.name = 'foot' + sd;
            const shaft = new THREE.Mesh(new THREE.CylinderGeometry(.052, .06, .12, Math.round(16 * FD)), boot); shaft.position.y = -.06; bootG.add(shaft);
            const ankleR = new THREE.Mesh(new THREE.SphereGeometry(.052, Math.round(14 * FD), Math.round(10 * FD)), boot); bootG.add(ankleR);
            const vamp = new THREE.Mesh(new THREE.SphereGeometry(.064, Math.round(16 * FD), Math.round(12 * FD)), boot); vamp.scale.set(1, .6, 1.85); vamp.position.set(0, -.11, .075); bootG.add(vamp);
            const toecap = new THREE.Mesh(new THREE.SphereGeometry(.05, Math.round(14 * FD), Math.round(10 * FD)), boot); toecap.scale.set(1.05, .75, 1.2); toecap.position.set(0, -.115, .19); bootG.add(toecap);
            const sl = new THREE.Mesh(new THREE.SphereGeometry(.064, Math.round(14 * FD), Math.round(8 * FD)), sole); sl.scale.set(1.08, .26, 2.05); sl.position.set(0, -.15, .075); bootG.add(sl);
            const heel = new THREE.Mesh(new THREE.SphereGeometry(.05, Math.round(12 * FD), Math.round(8 * FD)), sole); heel.scale.set(1.1, .5, 1); heel.position.set(0, -.145, -.02); bootG.add(heel);
            const laces = new THREE.Mesh(new THREE.TorusGeometry(.03, .004, Math.round(6 * FD), Math.round(12 * FD), Math.PI), M(0x222222)); laces.position.set(0, -.06, .055); laces.rotation.x = -Math.PI / 2; bootG.add(laces);
            knee.add(bootG); hip.add(knee); body.add(hip);
            if (opts.seated) { hip.rotation.x = -1.5; knee.rotation.x = 1.45; } });

          // ---- Torso torneado + pelvis + cinturón ----
          const perfil = []; for (let i = 0; i <= Math.round(18 * FD); i++) { const t = i / Math.round(18 * FD); const r = (0.215 - 0.06 * Math.pow(t - 0.28, 2) * 6 + (t > 0.85 ? (t - 0.85) * 0.25 : 0)) * bodyScale; perfil.push(new THREE.Vector2(Math.max(0.13, r) * (t < 0.04 ? 0.75 : 1), t * 0.56)); }
          const torso = new THREE.Mesh(new THREE.LatheGeometry(perfil, Math.round(24 * FD)), shirt); torso.position.y = hipY - 0.03; torso.scale.set(1, 1, 0.64); body.add(torso);
          const pelvis = new THREE.Mesh(new THREE.SphereGeometry(.2 * bodyScale, Math.round(18 * FD), Math.round(12 * FD)), pants); pelvis.scale.set(1, .55, .65); pelvis.position.y = hipY - .03; body.add(pelvis);
          const belt = new THREE.Mesh(new THREE.TorusGeometry(.20 * bodyScale, .016, Math.round(8 * FD), Math.round(28 * FD)), M(0x1a1a1a)); belt.rotation.x = Math.PI / 2; belt.position.y = hipY + 0.03; belt.scale.set(1, .66, 1); body.add(belt);
          const buckle = new THREE.Mesh(new THREE.BoxGeometry(.04, .03, .012), M(0x9a9a9a, { metalness: .8, roughness: .3 })); buckle.position.set(0, hipY + .03, .135 * bodyScale); body.add(buckle);

          // ---- Chaleco torneado con bandas curvas ----
          const vperf = []; for (let i = 0; i <= Math.round(12 * FD); i++) { const t = i / Math.round(12 * FD); vperf.push(new THREE.Vector2((0.232 - 0.045 * Math.pow(t - 0.3, 2) * 5) * bodyScale, 0.05 + t * 0.50)); }
          const vestM = new THREE.Mesh(new THREE.LatheGeometry(vperf, Math.round(26 * FD), Math.PI * 0.07, Math.PI * 0.86), vest); vestM.position.y = hipY - 0.03; vestM.scale.set(1, 1, 0.68); body.add(vestM);
          const vestB = vestM.clone(); vestB.rotation.y = Math.PI; body.add(vestB);
          const vestS1 = new THREE.Mesh(new THREE.LatheGeometry(vperf, Math.round(8 * FD), Math.PI * 0.93, Math.PI * 0.14), vest); vestS1.position.y = hipY - .03; vestS1.scale.set(1, 1, .68); body.add(vestS1); const vestS2 = vestS1.clone(); vestS2.rotation.y = Math.PI; body.add(vestS2);
          const band = (theta0, len, y, h, r) => { const m = new THREE.Mesh(new THREE.CylinderGeometry(r, r, h, Math.round(24 * FD), 1, true, theta0, len), refl); m.position.y = y; m.scale.set(1, 1, .68); body.add(m); };
          [0.30, -0.30, Math.PI + 0.30, Math.PI - 0.30].forEach(th => band(th - 0.09, 0.18, hipY + .30, .46, .236 * bodyScale));
          band(Math.PI * .07 - 0.02, Math.PI * .86 + .04, hipY + .13, .045, .238 * bodyScale); band(Math.PI * 1.07 - 0.02, Math.PI * .86 + .04, hipY + .13, .045, .238 * bodyScale);
          const zipper = new THREE.Mesh(new THREE.BoxGeometry(.012, .48, .006), M(0x3a3a3a, { metalness: .6, roughness: .3 })); zipper.position.set(0, hipY + .30, .162 * bodyScale); body.add(zipper);
          const lt = new THREE.TextureLoader().load(LOGO_DATA_W); lt.anisotropy = 4;
          const logoBack = new THREE.Mesh(new THREE.PlaneGeometry(.28, .28 * 70 / 242), new THREE.MeshBasicMaterial({ map: lt, transparent: true })); logoBack.position.set(0, hipY + .40, -.165 * bodyScale); logoBack.rotation.y = Math.PI; body.add(logoBack);
          const logoChest = new THREE.Mesh(new THREE.PlaneGeometry(.10, .10 * 70 / 242), new THREE.MeshBasicMaterial({ map: lt, transparent: true })); logoChest.position.set(-.075, hipY + .47, .166 * bodyScale); body.add(logoChest);
          if (look.badge) { const badgeG = new THREE.Group(); badgeG.name = 'badge'; const bg = new THREE.Mesh(new THREE.BoxGeometry(.06, .08, .004), M(0xffffff, { roughness: .3 })); badgeG.add(bg); const clip = new THREE.Mesh(new THREE.BoxGeometry(.02, .015, .006), M(0x333333, { metalness: .6 })); clip.position.y = .045; badgeG.add(clip); const photo = new THREE.Mesh(new THREE.BoxGeometry(.035, .035, .002), M(skinHex)); photo.position.set(0, .01, .003); badgeG.add(photo); const line1 = new THREE.Mesh(new THREE.BoxGeometry(.045, .006, .002), M(0x1769aa)); line1.position.set(0, -.02, .003); badgeG.add(line1); const line2 = new THREE.Mesh(new THREE.BoxGeometry(.035, .004, .002), M(0x555555)); line2.position.set(0, -.03, .003); badgeG.add(line2); badgeG.position.set(.075, hipY + .47, .168 * bodyScale); body.add(badgeG); }
          if (look.radio) { const radioG = new THREE.Group(); radioG.name = 'radio'; const rb = new THREE.Mesh(new THREE.BoxGeometry(.05, .09, .028), M(0x111111)); radioG.add(rb); const ant = capsule(.003, .003, .09, M(0x111111), 6); ant.position.set(-.015, .06, 0); radioG.add(ant); const led = new THREE.Mesh(new THREE.SphereGeometry(.004, Math.round(6 * FD), Math.round(6 * FD)), M(0x00ff00, { emissive: 0x00ff00, emissiveIntensity: .8 })); led.position.set(.015, .03, .015); radioG.add(led); radioG.position.set(-.15, hipY + .32, .175 * bodyScale); body.add(radioG); }
          if (look.seatbelt) { const sb = new THREE.Mesh(new THREE.CylinderGeometry(.24 * bodyScale, .24 * bodyScale, .055, Math.round(24 * FD), 1, true, -0.9, 1.3), M(0x1a1a1a, { roughness: .8 })); sb.position.y = hipY + .30; sb.rotation.z = -0.9; sb.scale.set(1, 1, .7); body.add(sb); const lap = new THREE.Mesh(new THREE.CylinderGeometry(.215 * bodyScale, .215 * bodyScale, .045, Math.round(24 * FD), 1, true, -1.1, 2.2), M(0x1a1a1a)); lap.position.y = hipY + .02; lap.scale.set(1, 1, .7); body.add(lap); const bk = new THREE.Mesh(new THREE.BoxGeometry(.05, .06, .03), M(0x9a9a9a, { metalness: .8, roughness: .3 })); bk.position.set(.15, hipY + .02, .13 * bodyScale); body.add(bk); }

          // ---- Brazos y manos ----
          ['L', 'R'].forEach((sd, i) => { const s = i ? 1 : -1; const sh = new THREE.Group(); sh.position.set(s * .235 * bodyScale, hipY + .53, 0); sh.name = 'arm' + sd;
            const shJ = new THREE.Mesh(new THREE.SphereGeometry(.064, Math.round(16 * FD), Math.round(12 * FD)), shirt); shJ.position.set(s * -.01, -.005, 0); sh.add(shJ); const sleeve = new THREE.Mesh(new THREE.CylinderGeometry(.068, .06, .13, Math.round(14 * FD), 1, true), shirt); sleeve.position.y = -.07; sh.add(sleeve); const upper = capsule(.058, .05, .17, skin, Math.round(14 * FD)); upper.position.y = -.13; sh.add(upper);
            const elbow = new THREE.Group(); elbow.position.y = -.30; elbow.name = 'elbow' + sd; elbow.add(capsule(.05, .04, .25, skin, Math.round(14 * FD)));
            const hand = new THREE.Group(); hand.position.y = -.27; hand.name = 'hand' + sd;
            const cuff = new THREE.Mesh(new THREE.CylinderGeometry(.045, .05, .05, Math.round(12 * FD)), gloveBack); cuff.position.y = -.015; hand.add(cuff);
            const palm = new THREE.Mesh(new THREE.SphereGeometry(.05, Math.round(14 * FD), Math.round(10 * FD)), gloveBack); palm.scale.set(.85, 1.05, .45); palm.position.y = -.075; hand.add(palm);
            const palmIn = new THREE.Mesh(new THREE.SphereGeometry(.046, Math.round(12 * FD), Math.round(8 * FD)), glovePalm); palmIn.scale.set(.8, 1.0, .25); palmIn.position.set(0, -.078, .014 * s); hand.add(palmIn);
            const knuckles = new THREE.Mesh(new THREE.SphereGeometry(.045, Math.round(12 * FD), Math.round(8 * FD)), gloveBack); knuckles.scale.set(.85, .3, .4); knuckles.position.set(0, -.105, -.01 * s); hand.add(knuckles);
            for (let f = 0; f < 4; f++) { const fx = -.03 + f * .02; const fg = new THREE.Group(); fg.position.set(fx, -.115, 0); const c1 = capsule(.0085, .0075, .03, gloveBack, Math.round(8 * FD)); fg.add(c1); const c2 = capsule(.0075, .0065, .026, gloveBack, Math.round(8 * FD)); c2.position.y = -.032; c2.rotation.x = .3 * s; fg.add(c2); fg.rotation.x = .15 * s; hand.add(fg); }
            const th = new THREE.Group(); th.position.set(s * -.045, -.06, .012 * s); th.rotation.z = s * .65; const t1 = capsule(.01, .009, .04, gloveBack, Math.round(8 * FD)); th.add(t1); hand.add(th);
            elbow.add(hand); sh.add(elbow); body.add(sh); });

          // ---- Cuello y cabeza ----
          const neck = new THREE.Mesh(new THREE.CylinderGeometry(.048, .058, .10, 16), skin); neck.position.y = hipY + .60; body.add(neck);
          const trap = new THREE.Mesh(new THREE.SphereGeometry(.13 * bodyScale, Math.round(16 * FD), Math.round(10 * FD), 0, Math.PI * 2, 0, Math.PI / 2), shirt); trap.scale.set(1.35, .5, .8); trap.position.y = hipY + .53; body.add(trap);
          const head = new THREE.Group(); head.position.y = hipY + .755; head.name = 'head'; body.add(head);
        // Rostro con nivel de detalle (LOD): cerca (< 9 m) malla de alta densidad (~100k triángulos con faceDetail 3); lejos, malla base
        const buildFace = (FD) => { const head = new THREE.Group();

              const skull = new THREE.Mesh(new THREE.SphereGeometry(.113, Math.round(24 * FD), Math.round(20 * FD)), skin); skull.scale.set(.88, 1.02, .95); head.add(skull);
              const jaw = new THREE.Mesh(new THREE.SphereGeometry(.082, Math.round(18 * FD), Math.round(12 * FD)), skin); jaw.scale.set(.92, .72, .95); jaw.position.set(0, -.052, .012); head.add(jaw);
              
              // Ojos v4: párpados, pestañas, iris con anillo limbal, brillo
              [-1, 1].forEach(sd => { const ex = sd * .0315, ey = .012, ez = .096;
                const eyeG = new THREE.Group(); eyeG.position.set(ex, ey, ez); eyeG.name = 'eye' + (sd < 0 ? 'L' : 'R'); head.add(eyeG);
                const sclera = new THREE.Mesh(new THREE.SphereGeometry(.0165, Math.round(16 * FD), Math.round(12 * FD)), M(0xf4f5f8, { roughness: .18 })); sclera.scale.set(1, .62, .75); eyeG.add(sclera);
                const iris = new THREE.Mesh(new THREE.SphereGeometry(.0068, Math.round(12 * FD), Math.round(10 * FD)), M(0x6b4a2a, { roughness: .25 })); iris.scale.set(1, 1, .45); iris.position.set(-sd * .0015, 0, .0122); eyeG.add(iris);
                const limbal = new THREE.Mesh(new THREE.TorusGeometry(.0066, .0009, Math.round(6 * FD), Math.round(20 * FD)), M(0x2a1a10)); limbal.position.set(-sd * .0015, 0, .0135); eyeG.add(limbal);
                const pupil = new THREE.Mesh(new THREE.SphereGeometry(.0031, Math.round(8 * FD), Math.round(8 * FD)), M(0x0b0806)); pupil.scale.set(1, 1, .4); pupil.position.set(-sd * .0015, 0, .0152); eyeG.add(pupil);
                const glint = new THREE.Mesh(new THREE.SphereGeometry(.0013, Math.round(6 * FD), Math.round(6 * FD)), new THREE.MeshBasicMaterial({ color: 0xffffff })); glint.position.set(-sd * .0015 - .0025, .0028, .0166); eyeG.add(glint);
                const lidUp = new THREE.Mesh(new THREE.SphereGeometry(.0182, Math.round(16 * FD), Math.round(10 * FD), 0, Math.PI * 2, 0, Math.PI * 0.52), skin); lidUp.scale.set(1.02, .66, .8); lidUp.position.set(0, .0018, -.0008); lidUp.name = 'lidUp'; eyeG.add(lidUp);
                const lidLow = new THREE.Mesh(new THREE.SphereGeometry(.0182, 16, 10, 0, Math.PI * 2, Math.PI * 0.66, Math.PI * 0.34), skin); lidLow.scale.set(1.02, .66, .8); lidLow.position.set(0, -.0012, -.0008); eyeG.add(lidLow);
                const lash = new THREE.Mesh(new THREE.TorusGeometry(.0158, .0011, Math.round(6 * FD), Math.round(24 * FD), Math.PI), M(0x1a100a)); lash.scale.set(1, .62, 1); lash.position.set(0, .001, .0075); lash.rotation.x = -Math.PI * 0.12; eyeG.add(lash);
                const brow = new THREE.Mesh(new THREE.TorusGeometry(.021, .0038, Math.round(8 * FD), Math.round(20 * FD), Math.PI * 0.75), M(look.hair)); brow.position.set(ex + sd * .002, ey + .026, ez + .006); brow.rotation.set(0.35, 0, Math.PI * 0.125 + sd * .05); brow.scale.set(1, .5, .8); head.add(brow);
                const ear = new THREE.Mesh(new THREE.SphereGeometry(.02, Math.round(10 * FD), Math.round(8 * FD)), skin); ear.scale.set(.5, 1, .8); ear.position.set(sd * .10, -.005, 0); head.add(ear); });
              const nose = new THREE.Mesh(new THREE.SphereGeometry(.0115, Math.round(12 * FD), Math.round(10 * FD)), skin); nose.scale.set(.9, 1.0, 1.15); nose.position.set(0, -.026, .111); head.add(nose); const bridge = new THREE.Mesh(new THREE.CylinderGeometry(.0045, .008, .034, Math.round(8 * FD)), skin); bridge.position.set(0, -.004, .1035); bridge.rotation.x = .32; head.add(bridge);
              const lips = new THREE.Mesh(new THREE.SphereGeometry(.021, Math.round(12 * FD), Math.round(8 * FD)), M(0xa2604f, { roughness: .6 })); lips.scale.set(1, .32, .45); lips.position.set(0, -.068, .094); head.add(lips); const lipLine = new THREE.Mesh(new THREE.TorusGeometry(.019, .0012, Math.round(6 * FD), Math.round(16 * FD), Math.PI), M(0x6e3a30)); lipLine.position.set(0, -.068, .1); lipLine.rotation.set(Math.PI / 2, 0, Math.PI); head.add(lipLine);
              // Cabello por estilo
              const hairMat = M(look.hair, { roughness: .9 });
              if (look.hairStyle === 'short' || !look.hairStyle) { const hair = new THREE.Mesh(new THREE.SphereGeometry(.114, Math.round(18 * FD), Math.round(16 * FD), 0, Math.PI * 2, 0, Math.PI / 2), hairMat); hair.position.y = .02; hair.scale.set(.9, .8, .96); head.add(hair); }
              else if (look.hairStyle === 'buzz') { const hair = new THREE.Mesh(new THREE.SphereGeometry(.1135, Math.round(18 * FD), Math.round(16 * FD), 0, Math.PI * 2, 0, Math.PI / 2), hairMat); hair.position.y = .015; hair.scale.set(.885, .78, .955); head.add(hair); }
              else if (look.hairStyle === 'medium') { const hair = new THREE.Mesh(new THREE.SphereGeometry(.118, Math.round(18 * FD), Math.round(16 * FD), 0, Math.PI * 2, 0, Math.PI * 0.6), hairMat); hair.position.y = .02; hair.scale.set(.92, .85, .98); head.add(hair); }
              if (look.ponytail) { const pt = capsule(.03, .04, .2, hairMat); pt.position.set(0, -.02, -.10); pt.rotation.x = -.35; head.add(pt); }
              // Casco con nervaduras y ala toroidal
              const helmet = new THREE.Mesh(new THREE.SphereGeometry(.135, Math.round(26 * FD), Math.round(22 * FD), 0, Math.PI * 2, 0, Math.PI / 2), helmetMat); helmet.position.y = .04; helmet.scale.set(1, .82, 1.05); head.add(helmet);
              for (let r = -1; r <= 1; r++) { const rib = new THREE.Mesh(new THREE.TorusGeometry(.128, .006, Math.round(6 * FD), Math.round(24 * FD), Math.PI), helmetMat); rib.position.set(r * .04, .04, 0); rib.rotation.y = Math.PI / 2; rib.scale.set(1, .82, 1); head.add(rib); }
              const brim = new THREE.Mesh(new THREE.TorusGeometry(.14, .012, Math.round(8 * FD), Math.round(36 * FD)), helmetMat); brim.rotation.x = Math.PI / 2; brim.position.y = .04; head.add(brim);
              const peak = new THREE.Mesh(new THREE.SphereGeometry(.09, Math.round(16 * FD), Math.round(8 * FD)), helmetMat); peak.scale.set(1.1, .12, .9); peak.position.set(0, .04, .16); head.add(peak);
              const inner = new THREE.Mesh(new THREE.SphereGeometry(.128, Math.round(16 * FD), Math.round(16 * FD), 0, Math.PI * 2, 0, Math.PI / 2), M(0x2b2b2b, { side: THREE.BackSide })); inner.position.y = .04; inner.scale.set(1, .82, 1.05); head.add(inner);
              const chinStrap = new THREE.Mesh(new THREE.TorusGeometry(.10, .004, Math.round(6 * FD), Math.round(20 * FD), Math.PI), M(0x222222)); chinStrap.position.set(0, -.05, 0); chinStrap.rotation.set(Math.PI / 2 - .3, 0, 0); head.add(chinStrap);
              if (look.glasses) { const lens = new THREE.Mesh(new THREE.CylinderGeometry(.118, .118, .032, Math.round(24 * FD), 1, true, -Math.PI * .42, Math.PI * .84), lensMat); lens.position.set(0, .012, -.01); head.add(lens); [-1, 1].forEach(sd => { const temple = capsule(.003, .003, .11, frameMat, 6); temple.position.set(sd * .105, .015, .1); temple.rotation.x = Math.PI / 2; head.add(temple); }); }
  
            return head; };
        head.add(buildFace(FD));
        body.userData.blink = { next: 2 + Math.random() * 3, t: 0 };
        mergeStaticMeshes(body, FD < 2);   // niveles lejanos: color por vértice → una malla por articulación
        body.traverse(o => { if (o.isMesh && o.geometry && o.geometry.attributes.position.count < 400) o.castShadow = false; });
        return body; }

function updateAvatarLOD() { const n = NPC.peds.length + NPC.forks.length; if (!LOD_CACHE || LOD_CACHE_N !== n || !LOD_CACHE.every(l => l.parent)) { LOD_CACHE = []; const push = g => { if (!g) return; g.traverse(o => { if (o.isLOD && o.name === 'bodyLOD') LOD_CACHE.push(o); }); }; NPC.peds.forEach(pd => push(pd.g)); NPC.forks.forEach(f => push(f.g)); push(forklift); LOD_CACHE_N = n; } const lods = LOD_CACHE;
            const v = new THREE.Vector3(); let nearest = null, nd = Infinity; lods.forEach(l => { l.autoUpdate = false; l.getWorldPosition(v); const d = v.distanceTo(camera.position); l.userData.d = d; if (d < nd) { nd = d; nearest = l; } });
            lods.forEach(l => { const d = l.userData.d; let lvl = d < 12 ? 1 : 2; if (l === nearest && d < 5) lvl = 0; if (l.userData.lvl !== lvl) { l.userData.lvl = lvl; l.children.forEach((c, i) => c.visible = i === lvl); } }); }

function syncLOD(root) { root.traverse(o => { if (!o.isLOD || o.children.length < 2) return; const src = o.children[0];
            for (let k = 1; k < o.children.length; k++) { const dst = o.children[k]; if (!dst.visible) continue;
                // Emparejar por NOMBRE de articulación (la estructura de mallas estáticas difiere entre niveles tras la fusión)
                (function cp(a, b) { b.position.copy(a.position); b.rotation.copy(a.rotation); b.scale.copy(a.scale);
                    a.children.forEach(ac => { if (!ac.name) return; const bc = b.children.find(x => x.name === ac.name); if (bc) cp(ac, bc); }); })(src, dst); } }); }

function animatePedCore(pd, walking, dtS, now) { const g = pd.g, B = n => g.getObjectByName(n); const w = pd.walk; const body = B('body');
          // parpadeo (párpado superior cierra y abre)
          if (body && body.userData.blink) { const bl = body.userData.blink; bl.t += dtS; if (bl.t > bl.next) { const eyes = ['eyeL', 'eyeR'].map(n => B(n)).filter(Boolean); const k = (bl.t - bl.next) / 0.16; const close = k < 1 ? Math.sin(Math.min(1, k) * Math.PI) : 0; eyes.forEach(e => { const lid = e.getObjectByName('lidUp'); if (lid) lid.scale.y = .66 + close * .55; }); if (k >= 1) { bl.t = 0; bl.next = 2.5 + Math.random() * 4; } } }
          if (walking) { const sw = Math.sin(w), sw2 = Math.sin(w + Math.PI);
            B('legL').rotation.x = sw * .55; B('legR').rotation.x = sw2 * .55;
            B('kneeL').rotation.x = Math.max(0, -Math.sin(w - .6)) * .9; B('kneeR').rotation.x = Math.max(0, -Math.sin(w + Math.PI - .6)) * .9;
            B('armL').rotation.x = sw2 * .45; B('armR').rotation.x = sw * .45; B('elbowL').rotation.x = -.35 - Math.max(0, sw2) * .4; B('elbowR').rotation.x = -.35 - Math.max(0, sw) * .4;
            const bounce = Math.abs(Math.cos(w)) * .035; B('body').position.y = bounce; B('body').position.x = Math.sin(w) * .022;
            B('body').rotation.y = Math.sin(w) * .09; B('legL').rotation.y = -Math.sin(w) * .05; B('legR').rotation.y = -Math.sin(w) * .05;
            B('head').position.y = 1.695 - bounce * 0.7; B('head').rotation.y = Math.sin(now / 1400 + pd.idle) * .25;
            const fL = B('footL'), fR = B('footR'); if (fL) fL.rotation.x = Math.max(-.3, Math.min(.3, Math.sin(w + .6) * .35)); if (fR) fR.rotation.x = Math.max(-.3, Math.min(.3, Math.sin(w + Math.PI + .6) * .35)); }
          else { ['legL', 'legR', 'kneeL', 'kneeR'].forEach(n => { const o = B(n); if (o) o.rotation.x += (0 - o.rotation.x) * .15; }); B('body').position.y = Math.sin(now / 900 + pd.idle) * .008; B('body').position.x = 0; B('body').rotation.y = 0; B('head').position.y = 1.695; const fL = B('footL'), fR = B('footR'); if (fL) fL.rotation.x = 0; if (fR) fR.rotation.x = 0;
            if (pd.wait > 0) { B('armR').rotation.x = -2.7 + Math.sin(now / 130) * .25; B('elbowR').rotation.x = -.3; B('armL').rotation.x += (0 - B('armL').rotation.x) * .15; B('elbowL').rotation.x = -.5; B('head').rotation.y = 0; }
            else { B('armL').rotation.x += (0 - B('armL').rotation.x) * .1; B('armR').rotation.x += (0 - B('armR').rotation.x) * .1; B('elbowL').rotation.x = -.4; B('elbowR').rotation.x = -.4; B('head').rotation.y = Math.sin(now / 1800 + pd.idle) * .5; } } }

function aisleZRange() { const L = RACK_LAYOUT; return { near: L.zStart + L.bays * L.bayW + 2.5, far: L.zStart + 1.5 }; }

function transitZ() { return aisleZRange().near + 5.5; }

function buildAisleRoute(fromX, aisleIdx) { const a = AISLES[aisleIdx]; const { near, far } = aisleZRange(); const tz = transitZ();
            return [[fromX, tz], [a.x, tz], [a.x, near], [a.x, far], [a.x, near], [a.x, tz]]; }

function pickNextAisle(f) { const cur = f.aisle; const busyByPlayer = playerAisle(); const taken = new Set(NPC.forks.filter(o => o !== f && o.aisle !== undefined).map(o => o.aisle)); const opts = [];
            const { near } = aisleZRange(); for (let i = 1; i <= AISLES.length; i++) { if (i === cur || i === busyByPlayer || taken.has(i)) continue; if (NPC.forks.some(o => o !== f && Math.hypot(o.x - AISLES[i - 1].x, o.z - near) < 8)) continue; opts.push(i); }
            if (!opts.length) for (let i = 1; i <= AISLES.length; i++) if (i !== cur && !taken.has(i) && i !== busyByPlayer) opts.push(i);
            if (!opts.length) for (let i = 1; i <= AISLES.length; i++) if (i !== cur) opts.push(i);
            return opts[Math.floor(Math.random() * opts.length)]; }

function assignNewRoute(f) { if (f.mode) { f.mode = null; if (f.aisleSaved !== undefined) f.aisle = f.aisleSaved; } const next = pickNextAisle(f); const startX = f.x; f.aisle = next; const route = buildAisleRoute(startX, next - 1); const { near } = aisleZRange(); if (f.z < near - 3) route.unshift([f.x, f.z], [f.x, near]); else if (Math.hypot(route[0][0] - f.x, route[0][1] - f.z) > 0.3) route.unshift([f.x, f.z]);   /* la nueva ruta parte de donde está el equipo: sin saltos */   // si está dentro del pasillo, primero sale por la entrada
            f.path = route; f.t = 0; f.dir = 1; f.blockT = 0; f.g.userData.route = next; }

function buildRackWalkways() { const g = new THREE.Group(); g.name = 'rackWalks'; const green = new THREE.MeshStandardMaterial({ color: 0x2e9e5b, roughness: .85 }), L = WALK_Z[1] - WALK_Z[0], zc = (WALK_Z[0] + WALK_Z[1]) / 2;
            RACK_WALKS.forEach(W => { const p = new THREE.Mesh(new THREE.PlaneGeometry(W.w, L), green); p.rotation.x = -Math.PI / 2; p.position.set(W.x, .006, zc); g.add(p);
                [-1, 1].forEach(sd => paintLine(W.x + sd * W.w / 2, WALK_Z[0], W.x + sd * W.w / 2, WALK_Z[1], 0xf5c400, .1));
                for (let z = WALK_Z[0] + 4; z < WALK_Z[1] - 2; z += 9) paintLabel('PASO PEATONAL', W.x, z, .42, '#ffffff', Math.PI / 2, W.w - .4);
                [WALK_Z[0], WALK_Z[1]].forEach(z => { const sg = new THREE.Mesh(new THREE.PlaneGeometry(1.1, .55), new THREE.MeshBasicMaterial({ map: makeTextTexture([{ text: '🚶 SOLO PEATONES', size: 44, color: '#fff' }, { text: 'prohibido montacargas', size: 30, color: '#fff' }], { w: 400, h: 200, bg: '#2e9e5b' }), side: THREE.DoubleSide })); sg.position.set(W.x, 2.2, z); g.add(sg);
                    const po = new THREE.Mesh(new THREE.CylinderGeometry(.03, .03, 2.0, 8), new THREE.MeshStandardMaterial({ color: 0x9aa0a8, metalness: .6 })); po.position.set(W.x, 1.0, z); g.add(po); }); });
            const hw = WAREHOUSE.w / 2 - 1.4; const cross = new THREE.Mesh(new THREE.PlaneGeometry(hw * 2, 1.6), green); cross.rotation.x = -Math.PI / 2; cross.position.set(0, .005, WALK_BACK); g.add(cross);   // cruce peatonal al fondo
            for (let x = -hw; x < hw; x += 1.2) { const st = new THREE.Mesh(new THREE.PlaneGeometry(.55, 1.4), new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: .8 })); st.rotation.x = -Math.PI / 2; st.position.set(x, .007, WALK_BACK); g.add(st); }
            g.traverse(o => { if (o.isMesh) o.receiveShadow = true; }); scene.add(g); }

function walkwayCheck() { if (typeof registerFault !== 'function' || typeof forkPosition === 'undefined') return; const inW = RACK_WALKS.some(W => Math.abs(forkPosition.x - W.x) < W.w / 2 && forkPosition.z > WALK_Z[0] && forkPosition.z < WALK_Z[1]);
            if (inW && !walkwayCheck.flag) { walkwayCheck.flag = true; registerFault('peatonal'); if (typeof toast === 'function') toast('⚠️ Estás en un PASO PEATONAL detrás de los racks: sal de la franja verde'); } if (!inW) walkwayCheck.flag = false; }

function pedRouteCatalog() { const { near } = aisleZRange(); const tz = transitZ(); const hw = WAREHOUSE.w / 2, hd = WAREHOUSE.d / 2, xl = hw - 1.4, zf = hd - 3.2, zr = tz + 8;
            // Sólo tramos sobre pasillos peatonales delimitados (y el cruce peatonal de la zona de tránsito); se conectan por sus extremos
            return [ { path: [[-xl, zf], [xl, zf]], crossing: false },          // pasillo peatonal frente a andenes
                     { path: [[-xl, zf], [-xl, zr]], crossing: false }, { path: [[-xl, zr], [-xl, -hd + 4]], crossing: false },   // perimetral izquierdo (dos tramos: cruce con recibo)
                     { path: [[xl, zf], [xl, zr]], crossing: false }, { path: [[xl, zr], [xl, -hd + 4]], crossing: false },       // perimetral derecho
                     { path: [[-xl, zr], [-hw + 20, zr]], crossing: false },    // hacia recibo
                     { path: [[xl, zr], [hw - 20, zr]], crossing: false },      // hacia embarque
                     { path: [[0, near + 3], [0, tz + 6]], crossing: true },
                     { path: [[-xl, WALK_BACK], [xl, WALK_BACK]], crossing: false } ].concat(RACK_WALKS.map(W => ({ path: [[W.x, WALK_BACK], [W.x, WALK_Z[1] - .2]], crossing: false }))); }

function assignPedRoute(pd) { // al llegar a un extremo continúa por otro tramo que empiece donde está (nunca cruza el piso de montacargas fuera de los pasillos)
            const here = [pd.x, pd.z], cat = pedRouteCatalog(); const opts = [];
            cat.forEach((r, k) => { if (k === pd.routeIdx) return; const a = r.path[0], b = r.path[r.path.length - 1];
                if (Math.hypot(a[0] - here[0], a[1] - here[1]) < 1.5) opts.push({ r, k, path: r.path.slice() }); else if (Math.hypot(b[0] - here[0], b[1] - here[1]) < 1.5) opts.push({ r, k, path: r.path.slice().reverse() }); });
            if (!opts.length) { pd.dir *= -1; pd.t = Math.max(0, Math.min(1, pd.t)); return; }   // sin conexión: regresa por el mismo tramo
            const o = opts[Math.floor(Math.random() * opts.length)]; pd.routeIdx = o.k; pd.path = o.path; pd.t = 0; pd.dir = 1; pd.crossing = o.r.crossing; pd.laps = 0; pd.routeT = 0; }

function trailerMats() { if (TRL.ply) return TRL; const C = h => new THREE.Color(h).convertSRGBToLinear();
            const mk = (w, h, fn) => { const c = document.createElement('canvas'); c.width = w; c.height = h; const g = c.getContext('2d'); fn(g, w, h); const t = new THREE.CanvasTexture(c); t.encoding = THREE.sRGBEncoding; t.wrapS = t.wrapT = THREE.RepeatWrapping; t.anisotropy = 4; return t; };
            const ply = mk(256, 128, (g, w, h) => { g.fillStyle = '#b48a5a'; g.fillRect(0, 0, w, h); for (let i = 0; i < 40; i++) { g.strokeStyle = `rgba(90,55,25,${0.08 + Math.random() * 0.1})`; g.lineWidth = 1 + Math.random() * 2; g.beginPath(); const y = Math.random() * h; g.moveTo(0, y); g.bezierCurveTo(w * .3, y + 6, w * .6, y - 6, w, y + 2); g.stroke(); } g.fillStyle = 'rgba(40,25,10,.45)'; g.fillRect(w - 2, 0, 2, h); for (let y = 10; y < h; y += 30) { g.fillStyle = '#6b6f75'; g.fillRect(w - 10, y, 4, 4); } });   // triplay con tornillos en las uniones
            const alu = mk(128, 256, (g, w, h) => { g.fillStyle = '#c7ccd2'; g.fillRect(0, 0, w, h); for (let x = 0; x < w; x += 4) { g.fillStyle = `rgba(255,255,255,${Math.random() * 0.12})`; g.fillRect(x, 0, 2, h); } g.fillStyle = 'rgba(70,75,85,.6)'; g.fillRect(w - 6, 0, 6, h); for (let y = 8; y < h; y += 22) { g.fillStyle = '#7d828a'; g.beginPath(); g.arc(w - 3, y, 2, 0, 7); g.fill(); } });   // panel de aluminio con poste y remaches
            const etrack = mk(256, 32, (g, w, h) => { g.fillStyle = '#4a4f57'; g.fillRect(0, 0, w, h); g.fillStyle = '#16181c'; for (let x = 6; x < w; x += 16) g.fillRect(x, 9, 9, 14); });   // riel logístico con ranuras
            const floor = mk(256, 256, (g, w, h) => { for (let i = 0; i < 8; i++) { g.fillStyle = ['#6b4a2b', '#7a5532', '#5d3f24', '#71502f'][i % 4]; g.fillRect(i * 32, 0, 32, h); g.fillStyle = 'rgba(0,0,0,.35)'; g.fillRect(i * 32, 0, 2, h); } for (let i = 0; i < 300; i++) { g.fillStyle = `rgba(0,0,0,${Math.random() * .12})`; g.fillRect(Math.random() * w, Math.random() * h, 3 + Math.random() * 10, 1 + Math.random() * 2); } });   // piso de madera dura laminada
            TRL.ply = new THREE.MeshStandardMaterial({ map: ply, roughness: .85 }); TRL.alu = new THREE.MeshStandardMaterial({ map: alu, roughness: .4, metalness: .5 }); TRL.etrack = new THREE.MeshStandardMaterial({ map: etrack, roughness: .5, metalness: .6 });
            TRL.floor = new THREE.MeshStandardMaterial({ map: upgradeTex(floor, 'madera.jpg'), roughness: .8 });   // tablones reales de Poly Haven si están disponibles TRL.roof = new THREE.MeshStandardMaterial({ color: C(0xf4f6f2), emissive: C(0xf0f2e8), emissiveIntensity: .55, roughness: .6 });   // techo translúcido (luz natural)
            TRL.bow = new THREE.MeshStandardMaterial({ color: C(0xaab0b8), metalness: .6, roughness: .4 }); TRL.frame = new THREE.MeshStandardMaterial({ color: C(0x2b2f36), metalness: .5, roughness: .5 }); TRL.lip = new THREE.MeshStandardMaterial({ color: C(0x5b616b), metalness: .7, roughness: .45 }); return TRL; }

function trailerInterior(g, W, H, L, z0) { const M = trailerMats(); const add = (geo, mat, x, y, z, rx) => { const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); if (rx) m.rotation.x = rx; m.receiveShadow = true; g.add(m); return m; }; const zc = z0 + L / 2;
            const fl = add(new THREE.PlaneGeometry(W, L), M.floor, 0, 0.004, zc, -Math.PI / 2); fl.material.map.repeat.set(1, L / 2.5);
            [-1, 1].forEach(sd => { const x = sd * (W / 2 - 0.005), ry = sd < 0 ? Math.PI / 2 : -Math.PI / 2;
                const ply = add(new THREE.PlaneGeometry(L, 1.22), M.ply, x, 0.61, zc); ply.rotation.y = ry; ply.material.map.repeat.set(L / 1.22, 1);
                const al = add(new THREE.PlaneGeometry(L, H - 1.22), M.alu, x, 1.22 + (H - 1.22) / 2, zc); al.rotation.y = ry; al.material.map.repeat.set(L / 0.6, 1);
                [1.25, 1.95].forEach(y => { const e = add(new THREE.BoxGeometry(0.02, 0.12, L - 0.2), M.etrack, x - sd * 0.012, y, zc); e.material.map.repeat.set(L / 1.0, 1); }); });   // rieles logísticos a dos alturas
            add(new THREE.PlaneGeometry(W, L), M.roof, 0, H - 0.02, zc, Math.PI / 2);
            for (let z = z0 + 0.3; z < z0 + L; z += 0.61) add(new THREE.BoxGeometry(W, 0.05, 0.04), M.bow, 0, H - 0.06, z);   // arcos de techo cada 24"
            [-1, 1].forEach(sd => { add(new THREE.BoxGeometry(0.16, H + 0.25, 0.22), M.frame, sd * (W / 2 + 0.06), (H + 0.25) / 2, z0 + 0.05); for (let k = 0; k < 4; k++) add(new THREE.BoxGeometry(0.08, 0.14, 0.12), M.frame, sd * (W / 2 + 0.17), 0.4 + k * 0.7, z0 + 0.05); });   // marco trasero de acero y bisagras de las puertas abatibles
            add(new THREE.BoxGeometry(W + 0.44, 0.28, 0.22), M.frame, 0, H + 0.12, z0 + 0.05);   // cabezal
            const lip = add(new THREE.BoxGeometry(1.9, 0.03, 0.42), M.lip, 0, 0.02, z0 - 0.02); lip.rotation.x = 0.05;   // labio de la rampa niveladora apoyado en la caja
        }

function buildDockTrailer(x) { const hd = WAREHOUSE.d / 2, L = 13.6, W = 2.5, H = 2.7, z0 = hd + 0.25, zc = z0 + L / 2; const g = new THREE.Group();
            const alu = new THREE.MeshStandardMaterial({ color: 0xd8d8d8, metalness: .6, roughness: .35 }), inner = new THREE.MeshStandardMaterial({ color: 0xaeb4bd, roughness: .8 }), wood = new THREE.MeshStandardMaterial({ map: woodTex(), roughness: .9 });
            const fl = new THREE.Mesh(new THREE.BoxGeometry(W, 0.12, L), wood); fl.position.set(0, -0.06, zc); g.add(fl);
            [-1, 1].forEach(sd => { const w = new THREE.Mesh(new THREE.BoxGeometry(0.08, H, L), inner); w.position.set(sd * (W / 2 + 0.04), H / 2, zc); g.add(w); for (let i = 0; i < 12; i++) { const r = new THREE.Mesh(new THREE.BoxGeometry(0.05, H, 0.07), alu); r.position.set(sd * (W / 2 - 0.02), H / 2, z0 + 0.6 + i * 1.1); g.add(r); } });
            const roof = new THREE.Mesh(new THREE.BoxGeometry(W + 0.2, 0.08, L), inner); roof.position.set(0, H, zc); g.add(roof); const fr = new THREE.Mesh(new THREE.BoxGeometry(W, H, 0.1), inner); fr.position.set(0, H / 2, z0 + L); g.add(fr);
            for (let i = 0; i < 4; i++) [-0.62, 0.62].forEach((dx, j) => { const bh = 1.3 + ((i + j) % 3) * 0.25; const b = new THREE.Mesh(new THREE.BoxGeometry(1.1, bh, 1.15), unitLoadMat((i + j) % 3)); b.position.set(dx, bh / 2 + 0.14, z0 + L - 0.8 - i * 1.25); g.add(b); const pl = new THREE.Mesh(palletGeometry(true), wood); pl.position.set(dx, 0.072, b.position.z); g.add(pl); });   // carga ya estibada al fondo
            const lampM = new THREE.Mesh(new THREE.PlaneGeometry(0.6, 1.2), new THREE.MeshBasicMaterial({ color: 0xfff1d6 })); lampM.rotation.x = Math.PI / 2; lampM.position.set(0, H - 0.05, z0 + 3); g.add(lampM); inner.emissive = new THREE.Color(0x2a2c30);   // luminaria interior sin luz dinámica (rendimiento)
            trailerInterior(g, W, H, L, z0);
            mergeStaticMeshes(g); g.position.x = x; scene.add(g); }

function addGloves(root) { const C = h => new THREE.Color(h).convertSRGBToLinear(); const knit = new THREE.MeshStandardMaterial({ color: C(0x5c6168), roughness: .95 }), palm = new THREE.MeshStandardMaterial({ color: C(0x1c1d20), roughness: .55 }), cuff = new THREE.MeshStandardMaterial({ color: C(0xf5c400), roughness: .8 });
            root.updateMatrixWorld(true); root.traverse(b => { if (!b.isBone || !/(LeftHand|RightHand)$/.test(b.name)) return; const ws = new THREE.Vector3(); b.getWorldScale(ws); const g = new THREE.Group(); g.scale.setScalar(1 / ws.x);
                const hand = new THREE.Mesh(new THREE.BoxGeometry(0.095, 0.13, 0.05), knit); hand.position.y = 0.065; g.add(hand); const p = new THREE.Mesh(new THREE.BoxGeometry(0.097, 0.11, 0.02), palm); p.position.set(0, 0.075, 0.018); g.add(p);
                const cf = new THREE.Mesh(new THREE.CylinderGeometry(0.048, 0.05, 0.05, 12), cuff); cf.position.y = -0.005; g.add(cf); g.traverse(o => { if (o.isMesh) o.castShadow = false; }); b.add(g); }); }

function buildDockOperations() { const n0 = scene.children.length, ob0 = obstacles.length; buildDockOperationsCore(); DOCK_GRP = new THREE.Group(); DOCK_GRP.name = 'dockOps'; scene.children.slice(n0).forEach(o => { if (!DOCKW.some(d => d.g === o)) DOCK_GRP.add(o); }); scene.add(DOCK_GRP); obstacles.slice(ob0).forEach(o => o.dock = true); applyDockVisibility(); }

function applyDockVisibility() { const clampOn = !!(typeof bayGroup !== 'undefined' && bayGroup && bayGroup.visible); if (DOCK_GRP) DOCK_GRP.visible = !clampOn; DOCKW.forEach(d => d.g.visible = !clampOn); obstacles.forEach(o => { if (o.dock) o.disabled = clampOn; }); }

function segmentPos(path, t) { // t en [0,1] ida y vuelta
            const segs = path.length - 1; const u = t * segs; const i = Math.min(segs - 1, Math.floor(u)); const f = u - i;
            return { x: path[i][0] + (path[i + 1][0] - path[i][0]) * f, z: path[i][1] + (path[i + 1][1] - path[i][1]) * f };
        }

function inForkBox(f, x, z, m) { const dx = x - f.x, dz = z - f.z; const a = f.g.rotation.y; const fwd = dx * Math.sin(a) + dz * Math.cos(a), lat = dx * Math.cos(a) - dz * Math.sin(a); return fwd > -1.9 - m && fwd < 3.2 + m && Math.abs(lat) < 0.75 + m; }

function pushOutOfFork(pd, f) { if (!inForkBox(f, pd.g.position.x, pd.g.position.z, 0.6)) return false; const a = f.g.rotation.y; const dx = pd.g.position.x - f.x, dz = pd.g.position.z - f.z; let lat = dx * Math.cos(a) - dz * Math.sin(a); const sd = lat >= 0 ? 1 : -1; const fwd = dx * Math.sin(a) + dz * Math.cos(a); const nx = f.x + Math.sin(a) * fwd + Math.cos(a) * sd * 1.6, nz = f.z + Math.cos(a) * fwd - Math.sin(a) * sd * 1.6; pd.g.position.set(nx, 0, nz); pd.x = nx; pd.z = nz; return true; }

function probeAt(np, f) { return { x: np.x, z: np.z, g: { rotation: { y: f.g.rotation.y } } }; }

function pathLen(path) { let l = 0; for (let i = 1; i < path.length; i++) l += Math.hypot(path[i][0] - path[i - 1][0], path[i][1] - path[i - 1][1]); return l; }

function forkGap(ax, az, ar, bx, bz, br) { let m = 99; for (let i = 0; i <= 5; i++) { const u = -1.9 + i * 1.02, px = ax + Math.sin(ar) * u, pz = az + Math.cos(ar) * u; for (let j = 0; j <= 5; j++) { const v = -1.9 + j * 1.02; const d = Math.hypot(px - bx - Math.sin(br) * v, pz - bz - Math.cos(br) * v); if (d < m) m = d; } } return m; }

function npcGoStaging(f) { const st = (typeof DOCK_STAGE !== 'undefined' && DOCK_STAGE.length && (!DOCK_GRP || DOCK_GRP.visible)) ? DOCK_STAGE : null; if (!st || f.aisle === undefined) return;
            const ax = AISLES[f.aisle - 1]; if (!ax) return; const { near } = aisleZRange(); const tz = transitZ(); const sx = st[Math.floor(Math.random() * st.length)] + (Math.random() < 0.5 ? -0.85 : 0.85), zs = WAREHOUSE.d / 2 - 9.6 - 2.3;
            f.aisleSaved = f.aisle; f.aisle = undefined; f.mode = f.pal.visible ? 'deliver' : 'fetch';   // con tarima: la deja en staging · vacío: recoge una para acomodarla
            f.path = [[f.x, f.z], [ax.x, near], [ax.x, tz], [sx, tz], [sx, zs]]; f.t = 0; f.dir = 1; f.blockT = 0; }

function npcStartStagingOp(f) { f.op = { ph: 'turn', t: 0, rot0: f.g.rotation.y, rot1: 0, y: 0.32, load: !f.pal.visible, staging: true };   // de frente a la estiba: horquillas a ras de piso
            const tz = transitZ(); f.path = [[f.x, f.z], [f.x, tz]]; f.t = 0; f.dir = 1; }

function npcStartOp(f) { const a = AISLES[f.aisle - 1]; if (!a) return; const side = Math.random() < 0.5 ? -1 : 1; const lvl = 1 + Math.floor(Math.random() * 5);
            f.op = { ph: 'turn', t: 0, rot0: f.g.rotation.y, rot1: side > 0 ? Math.PI / 2 : -Math.PI / 2, y: 0.5 + lvl * 1.8 + 0.06, load: !f.pal.visible }; f.opX = a.x; }

function npcUpdateOp(f, dt) { const o = f.op; o.t += dt; const ease = k => k < 0 ? 0 : k > 1 ? 1 : k * k * (3 - 2 * k); let d;
            const setCar = y => { f.car.position.y = y; f.inner.position.y = Math.max(0, y - 2.0); };
            if (o.ph === 'turn') { d = o.rot1 - o.rot0; while (d > Math.PI) d -= 2 * Math.PI; while (d < -Math.PI) d += 2 * Math.PI; f.g.rotation.y = o.rot0 + d * ease(o.t / 1.6); f.beacon.material.emissiveIntensity = Math.sin(performance.now() / 120) > 0 ? 2.2 : .4; if (o.t >= 1.6) { o.ph = 'up'; o.t = 0; } }
            else if (o.ph === 'up') { setCar(0.09 + (o.y - 0.09) * ease(o.t / (o.y / 0.45))); if (o.t >= o.y / 0.45) { o.ph = 'work'; o.t = 0; } }   // ~0.45 m/s de elevación
            else if (o.ph === 'work') { if (o.t >= 1.8) { f.pal.visible = o.load; o.ph = 'down'; o.t = 0; } }   // inserta / retira horquillas: toma o deja la tarima
            else if (o.ph === 'down') { setCar(o.y - (o.y - 0.09) * ease(o.t / (o.y / 0.5))); if (o.t >= o.y / 0.5) { setCar(0.09); o.ph = 'back'; o.t = 0; } }   // baja con la carga a 15 cm antes de moverse
            else if (o.ph === 'back') { d = o.rot0 - o.rot1; while (d > Math.PI) d -= 2 * Math.PI; while (d < -Math.PI) d += 2 * Math.PI; f.g.rotation.y = o.rot1 + d * ease(o.t / 1.6); if (o.t >= 1.6) { f.g.rotation.y = o.rot0; f.op = null; f.opCool = 3 + Math.random() * 5; if (o.staging) { if (!f.pal.visible && !o.second && Math.random() < 0.5) { npcStartStagingOp(f); f.op.load = true; f.op.second = true; f.mode = 'fetch'; return; }   /* dejó su tarima y toma otra de recibo para acomodarla en rack */ f.mode = null; f.aisle = f.aisleSaved; assignNewRoute(f); } else if (Math.random() < 0.3) npcGoStaging(f); } } }

function npcReply(msg) { const c = document.getElementById('npcReply'); const d = document.createElement('div'); d.textContent = msg; c.appendChild(d); setTimeout(() => d.remove(), 2400); }

function audioCtx() { hornCtx = hornCtx || new (window.AudioContext || window.webkitAudioContext)(); if (hornCtx.state === 'suspended') hornCtx.resume(); return hornCtx; }

function hornSound(freqs, dur, vol, ctx) { try { ctx = ctx || audioCtx(); const t = ctx.currentTime; const f0 = freqs[0] || 410;
            // bocina eléctrica de disco: el diafragma golpea a ~f0 → onda casi cuadrada, muy rica en armónicos impares, con resonancia de la trompeta ~2.4 kHz
            const master = ctx.createGain(); master.gain.value = 0; master.connect(ctx.destination);
            const shaper = ctx.createWaveShaper(); const cv = new Float32Array(1024); for (let i = 0; i < 1024; i++) { const x = i / 512 - 1; cv[i] = Math.tanh(x * 6); } shaper.curve = cv;
            const res = ctx.createBiquadFilter(); res.type = 'peaking'; res.frequency.value = 2400; res.Q.value = 3; res.gain.value = 9; const body = ctx.createBiquadFilter(); body.type = 'peaking'; body.frequency.value = f0 * 2; body.Q.value = 2; body.gain.value = 6;
            const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 5200; shaper.connect(body); body.connect(res); res.connect(lp); lp.connect(master);
            const o = ctx.createOscillator(); o.type = 'square'; o.frequency.setValueAtTime(f0 * 0.9, t); o.frequency.exponentialRampToValueAtTime(f0, t + 0.04); const og = ctx.createGain(); og.gain.value = 0.6; o.connect(og); og.connect(shaper);
            const o2 = ctx.createOscillator(); o2.type = 'sawtooth'; o2.frequency.value = f0 * 1.003; const o2g = ctx.createGain(); o2g.gain.value = 0.25; o2.connect(o2g); o2g.connect(shaper);   // ligera desafinación: "carraspeo" del contacto
            const v = (vol || 0.5) * 0.55; master.gain.setValueAtTime(0, t); master.gain.linearRampToValueAtTime(v, t + 0.012); master.gain.setValueAtTime(v, t + dur - 0.03); master.gain.exponentialRampToValueAtTime(0.0008, t + dur + 0.04);
            [o, o2].forEach(x => { x.start(t); x.stop(t + dur + 0.08); }); } catch (e) {} }

function beep(freq, dur, vol) { hornSound([freq, freq * 1.26], dur, vol || .35); }

function honk() { if (practiceDone) return; lastHonk = performance.now(); hornSound([415], .42, .6); setTimeout(() => hornSound([415], .3, .55), 520);
            const w = document.querySelector('.canvas-wrapper'); const r = document.createElement('div'); r.className = 'horn-ring'; w.appendChild(r); setTimeout(() => r.remove(), 800);
            const near = NPC.forks.filter(f => Math.hypot(f.x - forkPosition.x, f.z - forkPosition.z) < 14).length + NPC.peds.filter(p => Math.hypot(p.x - forkPosition.x, p.z - forkPosition.z) < 12).length;
            if (!near) npcReply('📣 Claxon · nadie cerca'); }

function holdBtn(id, key) {
            const el = document.getElementById(id);
            const on = e => { e.preventDefault(); held[key] = true; };
            const off = () => { held[key] = false; };
            el.addEventListener('pointerdown', on); el.addEventListener('pointerup', off);
            el.addEventListener('pointerleave', off); el.addEventListener('pointercancel', off);
        }

function toggleLoad() { hasLoad ? releaseLoad() : grabLoad(); }

function aisleName(n) { return `PASILLO ${n}${AISLE_NAMES[n] ? ' · ' + AISLE_NAMES[n] : ''}`; }

function locCode(loc) { const wh = WH_CODES[(currentUser && currentUser.wh) || ''] || 'DKA'; return `${wh}-P${RACK_LAYOUT.aisleOf[loc.rack]}-R${RACK_LAYOUT.letters[loc.rack]}-M${String(loc.bay + 1).padStart(2, '0')}-N${loc.level + 1}-${loc.pos}`; }

function posName(loc) { return loc.pos === 'B' ? 'INTERNA (fondo)' : 'EXTERNA (frente)'; }

function slotWorld(loc) { const L = RACK_LAYOUT; const f = L.facing[loc.rack]; const x = L.xs[loc.rack] + (loc.pos === 'A' ? 0.6 : -0.6) * f; const z = L.zStart + loc.bay * L.bayW + L.bayW / 2; const y = L.beamY0 + loc.level * L.levelH; return { x, y, z, facing: f, interno: loc.pos === 'B' }; }

function randomLoc(opts) { const L = RACK_LAYOUT; const rack = Math.floor(Math.random() * L.xs.length); const levels = opts.levels || [1, 2]; const level = levels[Math.floor(Math.random() * levels.length)];
            const canInner = spec().reachStages === 2;   // la posición interna (B) sólo se asigna al doble reach
            return { rack, bay: 2 + Math.floor(Math.random() * (L.bays - 4)), level, pos: canInner && Math.random() < 0.5 ? 'B' : 'A' }; }

function showSlotLabel(loc, w) { if (slotLabel) scene.remove(slotLabel); const t = makeTextTexture([{ text: locCode(loc), size: 64, color: '#fff' }], { w: 1024, h: 128, bg: '#2e9e5b' }); slotLabel = new THREE.Mesh(new THREE.PlaneGeometry(2.6, 0.33), new THREE.MeshBasicMaterial({ map: t, transparent: true }));
            slotLabel.position.set(RACK_LAYOUT.xs[loc.rack] + w.facing * (RACK_LAYOUT.depth / 2 + 0.05), w.y + 1.55, w.z); slotLabel.rotation.y = w.facing > 0 ? Math.PI / 2 : -Math.PI / 2; scene.add(slotLabel); }

function setSlotOccupied(w, occupied) { const dummy = new THREE.Object3D();
            RACK_SLOTS.forEach(r => { if (Math.abs(r.x - w.x) < 0.12 && Math.abs(r.y - w.y) < 0.1 && Math.abs(r.z - w.z) < 0.12) {
                if (!occupied) { r.palMesh.setMatrixAt(r.palIdx, zeroM); r.boxMesh.setMatrixAt(r.boxIdx, zeroM); r.lblMesh.setMatrixAt(r.lblIdx, zeroM); }
                else { dummy.position.set(r.x, r.y + 0.14, r.z); dummy.rotation.set(0, Math.PI / 2, 0); dummy.scale.set(1, 1, 1); dummy.updateMatrix(); r.palMesh.setMatrixAt(r.palIdx, dummy.matrix); dummy.position.set(r.x, r.y + 0.21 + r.bh / 2, r.z); dummy.rotation.set(0, 0, 0); dummy.scale.set(1, r.bh, 1); dummy.updateMatrix(); r.boxMesh.setMatrixAt(r.boxIdx, dummy.matrix); dummy.position.set(r.x + r.facing * 0.49, r.y + 0.21 + r.bh / 2, r.z); dummy.rotation.set(0, r.facing > 0 ? Math.PI / 2 : -Math.PI / 2, 0); dummy.scale.set(1, 1, 1); dummy.updateMatrix(); r.lblMesh.setMatrixAt(r.lblIdx, dummy.matrix); }
                r.palMesh.instanceMatrix.needsUpdate = true; r.boxMesh.instanceMatrix.needsUpdate = true; r.lblMesh.instanceMatrix.needsUpdate = true; } }); }

function bannerTexture(name) { const c = document.createElement('canvas'); c.width = 768; c.height = 1536; const g = c.getContext('2d'); const S = 1.5; g.scale(S, S);
            const theme = { DICKA: { bg: '#FFFFFF', accent: '#1D2586', text: '#1D2586', sub: 'LOGISTICS' }, PEPSICO: { bg: '#FFFFFF', accent: '#004B93', text: '#004B93', sub: '' }, PERFETTI: { bg: '#FFFFFF', accent: '#00589B', text: '#00589B', sub: 'VAN MELLE' }, PISA: { bg: '#FFFFFF', accent: '#0057B8', text: '#0057B8', sub: 'LABORATORIOS' }, ECOLAB: { bg: '#FFFFFF', accent: '#006BB6', text: '#006BB6', sub: '' }, WHIRLPOOL: { bg: '#FFFFFF', accent: '#1B2A4A', text: '#1B2A4A', sub: '' }, UNILEVER: { bg: '#FFFFFF', accent: '#1F36C7', text: '#1F36C7', sub: '' } }[name];
            g.fillStyle = theme.bg; g.fillRect(0, 0, 512, 1024); g.fillStyle = theme.accent; g.fillRect(0, 0, 512, 70); g.fillRect(0, 954, 512, 70);
            g.fillStyle = '#fff'; g.font = '800 26px Arial'; g.textAlign = 'center'; g.fillText('ALMACÉN DICKA LOGISTICS', 256, 46); g.fillText('OPERACIÓN SEGURA', 256, 1000);
            const tex = new THREE.CanvasTexture(c); tex.anisotropy = 4; tex.encoding = THREE.sRGBEncoding;
            const drawText = () => { if (name === 'PEPSICO') { // marca tipográfica aproximada: PEPSICO en azul con la "globe" roja/blanca/azul
                    g.fillStyle = '#004B93'; g.font = '900 78px Arial Black, Arial'; g.fillText('PEPSICO', 256, 610);
                    const cx = 256, cy = 440, r = 95; g.beginPath(); g.arc(cx, cy, r, 0, Math.PI * 2); g.fillStyle = '#E32934'; g.fill();
                    g.beginPath(); g.arc(cx, cy, r, 0, Math.PI * 2); g.clip(); g.fillStyle = '#FFFFFF'; g.beginPath(); g.moveTo(cx - r, cy - 8); g.bezierCurveTo(cx - 20, cy - 40, cx + 20, cy + 40, cx + r, cy - 20); g.lineTo(cx + r, cy + 30); g.bezierCurveTo(cx + 20, cy + 60, cx - 20, cy, cx - r, cy + 20); g.closePath(); g.fill();
                    g.fillStyle = '#004B93'; g.beginPath(); g.moveTo(cx - r, cy + 20); g.bezierCurveTo(cx - 20, cy, cx + 20, cy + 60, cx + r, cy + 30); g.lineTo(cx + r, cy + r); g.lineTo(cx - r, cy + r); g.closePath(); g.fill(); }
                else if (name === 'PISA') { g.fillStyle = '#0057B8'; g.font = '900 150px Arial Black, Arial'; g.fillText('PiSA', 256, 520); g.beginPath(); g.arc(342, 445, 14, 0, Math.PI * 2); g.fillStyle = '#E4002B'; g.fill(); g.fillStyle = '#0057B8'; g.font = '700 36px Arial'; g.fillText('LABORATORIOS', 256, 600); g.fillRect(96, 630, 320, 6); g.font = '700 24px Arial'; g.fillText('SALUD PARA TODOS', 256, 680); }
                else if (name === 'ECOLAB') { // marca tipográfica aproximada: ECOLAB en azul con onda verde-azul
                    g.fillStyle = '#006BB6'; g.font = '900 96px Arial'; g.fillText('ECOLAB', 256, 520);
                    g.lineWidth = 22; g.lineCap = 'round'; g.strokeStyle = '#7AC143'; g.beginPath(); g.moveTo(90, 610); g.bezierCurveTo(180, 560, 330, 660, 422, 610); g.stroke();
                    g.strokeStyle = '#006BB6'; g.beginPath(); g.moveTo(120, 640); g.bezierCurveTo(200, 600, 320, 690, 392, 640); g.stroke(); }
                else if (name === 'WHIRLPOOL') { // marca tipográfica aproximada: Whirlpool azul marino con línea ámbar
                    g.fillStyle = '#1B2A4A'; g.font = '900 88px Arial'; g.fillText('Whirlpool', 256, 520); g.fillStyle = '#F4A100'; g.fillRect(96, 555, 320, 12);
                    g.fillStyle = '#1B2A4A'; g.font = '700 30px Arial'; g.fillText('LÍNEA BLANCA', 256, 630); }
                else if (name === 'UNILEVER') { // marca aproximada: gran "U" formada por puntos azules + nombre
                    g.fillStyle = '#1F36C7'; const cx = 256, cy = 420; for (let i = 0; i < 34; i++) { const t = i / 33; const ang = Math.PI * (0.1 + t * 0.8); const r = 120; const x = cx + Math.cos(ang) * r, y = cy - 60 + Math.sin(ang) * r; const rr = 9 + 5 * Math.sin(t * Math.PI * 3); g.beginPath(); g.arc(x, y, rr, 0, Math.PI * 2); g.fill(); }
                    [[cx - 120, cy - 60], [cx + 120, cy - 60], [cx - 120, cy - 150], [cx + 120, cy - 150]].forEach(([x, y], i) => { for (let k = 0; k < 4; k++) { g.beginPath(); g.arc(x + (Math.random() - .5) * 24, y - k * 24, 8 + (k % 2) * 4, 0, Math.PI * 2); g.fill(); } });
                    g.font = '700 70px Arial'; g.fillText('Unilever', 256, 640); }
                else if (name === 'PERFETTI') { // marca tipográfica aproximada: espiral verde/azul + Perfetti Van Melle
                    const cx = 256, cy = 420; g.lineWidth = 26; g.lineCap = 'round';
                    g.strokeStyle = '#7AB800'; g.beginPath(); g.arc(cx, cy, 78, Math.PI * 1.05, Math.PI * 1.95); g.stroke();
                    g.strokeStyle = '#00A0DF'; g.beginPath(); g.arc(cx, cy, 78, Math.PI * 0.05, Math.PI * 0.95); g.stroke();
                    g.strokeStyle = '#00589B'; g.beginPath(); g.arc(cx + 8, cy + 6, 46, Math.PI * 0.55, Math.PI * 1.7); g.stroke();
                    g.fillStyle = '#00589B'; g.font = '900 62px Arial'; g.fillText('Perfetti', 256, 585); g.font = '700 40px Arial'; g.fillText('Van Melle', 256, 635); }
                else { g.fillStyle = theme.text; g.font = '900 96px Arial Black, Arial'; g.fillText(name, 256, 520); g.font = '700 30px Arial'; g.fillStyle = theme.accent; g.fillText(theme.sub, 256, 570); } tex.needsUpdate = true; };
            if (BANNER_LOGOS[name]) { const img = new Image(); img.onload = () => { const w = 400, h = w * img.height / img.width; g.drawImage(img, 56, 512 - h / 2, w, h); tex.needsUpdate = true; }; img.src = BANNER_LOGOS[name]; } else drawText();
            return tex; }

function buildBanners() {
            const L = RACK_LAYOUT; const zFront = L.zStart + L.bays * L.bayW + 0.35, zBack = L.zStart - 0.35;
            const plan = [['DICKA', 0], ['PEPSICO', 2], ['PISA', 4], ['DICKA', 6], ['PERFETTI', 7], ['PEPSICO', 1], ['PISA', 3], ['DICKA', 5], ['PERFETTI', 7], ['ECOLAB', 0], ['WHIRLPOOL', 2], ['UNILEVER', 4], ['ECOLAB', 6]];   // k<5 frente, resto atrás   // [marca, índice de rack] · k<4 frente, resto atrás
            const wallPlan = [['PEPSICO', -18, 8.2], ['PISA', 18, 8.2]];   // pendones grandes adicionales en la pared del fondo, a los lados del logo DICKA
            plan.forEach(([name, ri], k) => { const x = L.xs[ri]; const z = k < 5 ? zFront : zBack; const tex = bannerTexture(name);
                const pend = new THREE.Mesh(new THREE.PlaneGeometry(2.8, 5.6), new THREE.MeshStandardMaterial({ map: tex, side: THREE.DoubleSide, roughness: 0.9 })); pend.position.set(x, 8.4, z); pend.rotation.y = k < 5 ? 0 : Math.PI; pend.castShadow = true; scene.add(pend); pend.userData.sway = Math.random() * 6.28; BANNERS.push(pend);
                const bar = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 3.0, 8), new THREE.MeshStandardMaterial({ color: 0x9a9a9a, metalness: .8 })); bar.rotation.z = Math.PI / 2; bar.position.set(x, 11.25, z); scene.add(bar);
                [-1.2, 1.2].forEach(dx => { const c = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.7, 6), new THREE.MeshStandardMaterial({ color: 0x777777 })); c.position.set(x + dx, 11.6, z); scene.add(c); }); });
        }

function buildWallBanners() { const hd = WAREHOUSE.d / 2; [['PEPSICO', -22], ['PISA', 22]].forEach(([name, x]) => { const tex = bannerTexture(name); const m = new THREE.Mesh(new THREE.PlaneGeometry(4.5, 9), new THREE.MeshStandardMaterial({ map: tex, roughness: 0.9 })); m.position.set(x, 6.6, -hd + 0.32); scene.add(m); }); }

function setActLoc(a, loc) { const w = slotWorld(loc); a.loc = loc; a.locCode = locCode(loc);
            if (clearedSlot) setSlotOccupied(clearedSlot, true); clearedSlot = w; setSlotOccupied(w, false);   // la ubicación destino/origen queda libre de producto
            if (a.id === 'rack2') { a.drop = { x: w.x, z: w.z, r: 0.45, yMin: w.y + 0.02, yMax: w.y + 0.5, label: a.locCode, slot: true, facing: w.facing, level: w.y, interno: w.interno }; a.text = `Toma la tarima en la entrada del ${aisleName(RACK_LAYOUT.aisleOf[loc.rack])} y colócala EXACTAMENTE en ${a.locCode} · posición ${posName(loc)}`; a.spawn = { x: [0, -15.25, -4, 7.25, 18.25][RACK_LAYOUT.aisleOf[loc.rack]], y: 0, z: 24 }; }
            if (a.id === 'rack3') { a.spawn = { x: w.x, y: w.y + 0.21, z: w.z }; a.pick = { x: w.x, z: w.z, y: w.y, facing: w.facing }; a.text = `Retira la tarima de ${a.locCode} (${aisleName(RACK_LAYOUT.aisleOf[loc.rack])}, nivel ${loc.level + 1}, posición ${posName(loc)}) y déjala en RECEPCIÓN`; }
            showSlotLabel(loc, w); }

function setClamp(mode, pressure) { SIM_CFG.clampMode = mode; if (pressure !== undefined) SIM_CFG.clampPressure = pressure; localStorage.setItem('dicka_sim_config', JSON.stringify(SIM_CFG)); }

function refreshLever() { const lv = document.getElementById('pressureLever'); if (!lv) return; const gob = SIM_CFG.clampMode === 'gobernada';
            if (gob) { SIM_CFG.clampPressure = SIM_CFG.clampPressureGov ?? SIM_CFG.clampPressure; } lv.value = SIM_CFG.clampPressure; lv.disabled = gob;
            document.getElementById('leverVal').textContent = SIM_CFG.clampPressure; document.getElementById('leverUnit').textContent = SIM_CFG.clampUnit; document.getElementById('leverRange').textContent = `rango autorizado ${SIM_CFG.clampMin}–${SIM_CFG.clampMax}`;
            const band = document.getElementById('leverBand'); band.style.bottom = (SIM_CFG.clampMin / 100 * 150) + 'px'; band.style.height = ((SIM_CFG.clampMax - SIM_CFG.clampMin) / 100 * 150) + 'px';
            const m = document.getElementById('leverMode'); m.textContent = gob ? '🔒 GOBERNADA' : '🎚️ AJUSTABLE'; m.style.background = gob ? '#838383' : '#2138D3';
            const pr = SIM_CFG.clampPressure; document.getElementById('leverVal').style.color = pr < SIM_CFG.clampMin || pr > SIM_CFG.clampMax ? '#ff5a5a' : '#8ff0b0'; }

function setPressureFromLever(v) { if (SIM_CFG.clampMode === 'gobernada') { refreshLever(); return; } SIM_CFG.clampPressure = Math.round(parseFloat(v)); refreshLever();
            if (hasLoad && spec().clamp && CLAMP.closed) { if (SIM_CFG.clampPressure < SIM_CFG.clampMin) { registerFault('presionInsuficiente'); if (mastM() > 0.4 && SIM_CFG.clampPressure < SIM_CFG.clampMin - 15) dropLoad('La carga resbaló de las placas por falta de presión'); } else if (SIM_CFG.clampPressure > SIM_CFG.clampMax) registerFault('presionExcesiva'); } }

function nudgePressure(d) { if (SIM_CFG.clampMode === 'gobernada' || !spec().clamp) return; setPressureFromLever(Math.max(0, Math.min(100, SIM_CFG.clampPressure + d))); }

function toggleClampMode() { const pin = prompt('PIN de instructor para cambiar el modo del carton clamp:'); if (pin !== '2026') { if (pin !== null) toast('PIN incorrecto'); return; }
            if (SIM_CFG.clampMode === 'gobernada') { SIM_CFG.clampMode = 'ajustable'; } else { SIM_CFG.clampMode = 'gobernada'; SIM_CFG.clampPressureGov = SIM_CFG.clampPressureGov ?? 65; SIM_CFG.clampPressure = SIM_CFG.clampPressureGov; }
            localStorage.setItem('dicka_sim_config', JSON.stringify(SIM_CFG)); refreshLever(); toast('🧲 Presión ' + (SIM_CFG.clampMode === 'gobernada' ? 'gobernada por equipo (' + SIM_CFG.clampPressure + SIM_CFG.clampUnit + ')' : 'ajustable por el operador dentro del rango autorizado')); }

function setSpeedLimits(fwd, rev) { SIM_CFG.limitFwd = fwd; SIM_CFG.limitRev = rev; localStorage.setItem('dicka_sim_config', JSON.stringify(SIM_CFG)); }

function makeBeacon() {
            beacon = new THREE.Mesh(new THREE.CylinderGeometry(0.9, 0.9, 30, 24, 1, true), new THREE.MeshBasicMaterial({ color: 0xf5c400, transparent: true, opacity: 0.22, side: THREE.DoubleSide, depthWrite: false }));
            beacon.position.y = 15; scene.add(beacon);
            slotMarker = new THREE.Mesh(new THREE.BoxGeometry(1.15, 1.2, 1.3), new THREE.MeshBasicMaterial({ color: 0x2e9e5b, transparent: true, opacity: 0.35 })); slotMarker.visible = false; scene.add(slotMarker);
            // Zona RECEPCIÓN
            const rz = new THREE.Mesh(new THREE.PlaneGeometry(5, 5), new THREE.MeshStandardMaterial({ color: 0x2e9e5b, emissive: 0x0a3d1c, transparent: true, opacity: 0.85 })); rz.rotation.x = -Math.PI / 2; rz.position.set(-8, 0.013, 20); scene.add(rz); paintLabel('RECEPCIÓN', -8, 20, 2.2, '#ffffff');
            // Zona de estacionamiento (baterías)
            const pz = new THREE.Mesh(new THREE.PlaneGeometry(4.5, 4.5), new THREE.MeshStandardMaterial({ color: 0x2138D3, emissive: 0x0a1560, transparent: true, opacity: 0.85 })); pz.rotation.x = -Math.PI / 2; pz.position.set(22.5, 0.013, 40.5); scene.add(pz); paintLabel('ESTACIONAR', 22.5, 40.5, 2, '#ffffff');
            // Línea de ALTO antes del paso peatonal
            paintLine(-6, 39.3, 6, 39.3, 0xffffff, 0.4); paintLabel('ALTO', 0, 38.2, 2.2, '#ffffff');
            const stop = new THREE.Mesh(new THREE.CylinderGeometry(0.6, 0.6, 0.08, 8), new THREE.MeshStandardMaterial({ color: 0xc62828 })); stop.position.set(6.8, 2.2, 39.3); stop.rotation.x = Math.PI / 2; scene.add(stop);
            const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 2.2, 8), new THREE.MeshStandardMaterial({ color: 0x838383 })); pole.position.set(6.8, 1.1, 39.3); scene.add(pole);
        }

function showBanner(msg) { const t = document.getElementById('faultToast'); t.innerHTML = msg; t.style.background = '#2138D3'; t.classList.add('show'); clearTimeout(t._t); t._t = setTimeout(() => { t.classList.remove('show'); t.style.background = ''; }, 2600); }

function completeAct(extraScore) {
            if (actBusy) return; actBusy = true;
            const a = ACTS[actIdx]; const secs = Math.round((Date.now() - actStartTime) / 1000);
            const fl = faultLog.slice(actStartFaults); const penal = fl.reduce((x, f) => x + f.pts, 0);
            let score = extraScore !== undefined ? extraScore : Math.max(0, 100 - penal);
            const critical = fl.filter(f => CRITICAL_FAULTS.includes(f.code));
            results[actIdx] = { name: a.name, icon: a.icon, score: Math.round(score), ok: score >= PASS_SCORE && critical.length === 0, faults: fl.length, critical: critical.map(f => f.label), secs };
            showBanner(results[actIdx].ok ? `✅ ${a.name}: ${Math.round(score)}%` : `❌ ${a.name}: ${Math.round(score)}% · NO APROBADA${critical.length ? ' · error crítico: ' + critical[0].label : ''}`);
            if (actIdx + 1 < ACTS.length) setTimeout(() => beginAct(actIdx + 1), 1200); else { slotMarker.visible = false; setTimeout(finishPractice, 900); }
        }

function actEvent(ev) { const a = ACTS[actIdx]; if (!a) return; if (a.type === 'move' && ev === 'grab') missionStep = 2; if (a.type === 'move' && ev === 'drop') completeAct(); }

function showChecklist() {
            const sp = spec(); CK = CK_COMMON.concat(CK_BY_TYPE[sp.type] || []);
            ckDefect = Math.floor(Math.random() * CK.length); ckAns = Array(CK.length).fill(null); ckBlocked = false; ckReleased = false;
            document.getElementById('ckEquipo').textContent = 'Raymond ' + sp.code + ' · ' + sp.name;
            document.getElementById('ckItems').innerHTML = CK.map((it, i) => `<div class="ck-item"><div class="ck-num">${i + 1}</div><div class="txt"><b>${it.t}</b>${i === ckDefect ? `<small>⚠ Observación: ${it.d}</small>` : ''}</div><div class="bt"><button onclick="ckMark(${i},'ok',this)">✓ Cumple</button><button onclick="ckMark(${i},'bad',this)">✗ No cumple</button><button onclick="ckMark(${i},'na',this)" title="Solo si el punto no aplica a este equipo">N/A</button></div></div>`).join(''); ckProgress();
            document.getElementById('ckDone').disabled = true; document.getElementById('ckDone').textContent = 'CONTINUAR'; document.getElementById('ckBlock').classList.add('hidden'); document.getElementById('checklist').classList.add('show');
        }

function instructorRelease() { const pin = prompt('PIN del instructor / supervisor para liberar el equipo tras el reporte a mantenimiento:'); if (pin !== '2026') { if (pin !== null) toast('PIN incorrecto: el equipo sigue fuera de operación'); return; }
            ckReleased = true; ckBlocked = false; document.getElementById('ckBlock').classList.add('hidden'); document.getElementById('ckDone').disabled = false; document.getElementById('ckDone').textContent = 'CONTINUAR (equipo liberado por instructor)'; toast('🔓 Equipo liberado por el instructor · falla reportada'); }

function ckProgress() { const n = ckAns.filter(a => a !== null).length; document.getElementById('ckBar').style.width = (CK.length ? n / CK.length * 100 : 0) + '%'; document.getElementById('ckCount').textContent = n + ' / ' + CK.length + ' revisados'; }

function ckMark(i, v, btn) { ckAns[i] = v; const bts = btn.parentElement.children; bts[0].className = v === 'ok' ? 'on-ok' : ''; bts[1].className = v === 'bad' ? 'on-bad' : ''; bts[2].className = v === 'na' ? 'on-na' : ''; btn.parentElement.parentElement.className = 'ck-item st-' + v; ckProgress();
            const complete = !ckAns.some(a => a === null); const anyBad = ckAns.some(a => a === 'bad');
            ckBlocked = complete && anyBad && !ckReleased; document.getElementById('ckBlock').classList.toggle('hidden', !ckBlocked);
            document.getElementById('ckDone').disabled = !complete || ckBlocked; }

function finishChecklist() {
            if (ckBlocked) return;
            document.getElementById('checklist').classList.remove('show');
            let correct = 0; ckAns.forEach((a, i) => { if (i === ckDefect ? a === 'bad' : a === 'ok') correct++; });
            const score = Math.round(correct / CK.length * 100);
            if (ckAns[ckDefect] !== 'bad') { registerFault('inspeccion'); completeAct(Math.min(score, PASS_SCORE - 1)); return; }   // no detectar la falla (Cumple o N/A) = crítico: nunca aprueba
            const falseNa = ckAns.filter((a, i) => a === 'na' && i !== ckDefect).length; if (falseNa) toast('⚠️ ' + falseNa + ' punto(s) marcados N/A que sí aplican a este equipo');
            completeAct(score);
        }

function clampSlider(id, delta) {
            const el = document.getElementById(id);
            el.value = Math.max(el.min, Math.min(el.max, parseFloat(el.value) + delta));
        }
