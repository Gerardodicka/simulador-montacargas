/* DICKA Play · Lectura de pruebas psicométricas (reportes Evaluatest / Etegrity de Brivé) y plan de capacitación.
   Los PDF se leen SOLO en el navegador con pdf.js; no se suben a ningún servidor. */
(function (G) {
  const FOCUS = {
    desarrollo: { n: 'Liderazgo y desarrollo de personas', obj: ['retro', 'delegar'], sc: ['mejor', 'renuncia', 'rotacion', 'conflicto', 'accidente2'], tip: 'Da retroalimentación con hechos, conducta e impacto y cierra con responsable y fecha.' },
    comunicacion: { n: 'Comunicación efectiva y asertiva', obj: ['retro', 'necesidades'], sc: ['conflicto', 'antidoping', 'antidoping2', 'cliente', 'mejor', 'accidente3'], tip: 'Di la intención de tu mensaje al inicio, en frases cortas, y confirma que te entendieron.' },
    resultados: { n: 'Enfoque a resultados', obj: ['metas'], sc: ['cliente', 'faltante', 'accidente2', 'rotacion'], tip: 'Convierte cada plática en un acuerdo medible: qué, cuánto y para cuándo.' },
    procesos: { n: 'Control de procesos y ejecución', obj: ['metas', 'delegar'], sc: ['faltante', 'robo', 'accidente2', 'estado'], tip: 'Pide evidencia y define el control que evitará que se repita.' },
    negociacion: { n: 'Negociación ganar-ganar', obj: ['necesidades', 'metas'], sc: ['tiempoextra', 'tiempoextra2', 'tiempoextra3', 'cliente', 'renuncia'], tip: 'Pregunta qué necesita la otra parte antes de proponer; busca beneficio para ambos.' },
    equipo: { n: 'Trabajo en equipo', obj: ['necesidades'], sc: ['conflicto', 'tiempoextra', 'tiempoextra2', 'tiempoextra3', 'rotacion'], tip: 'Escucha a todas las partes y acuerda reglas que el equipo sienta como propias.' },
    integridad: { n: 'Ética y cumplimiento', obj: ['retro'], sc: ['antidoping', 'antidoping2', 'robo', 'faltante', 'estado', 'mejor'], tip: 'Sostén la norma aunque haya presión por resultados; documenta y escala cuando corresponde.' },
    firmeza: { n: 'Firmeza y toma de postura', obj: ['retro', 'metas'], sc: ['mejor', 'antidoping', 'antidoping2', 'estado', 'robo', 'cliente'], tip: 'Fija tu postura con respeto y sin rodeos; no cedas lo que no es negociable.' },
    conflicto: { n: 'Enfrentar conflictos', obj: ['necesidades', 'retro'], sc: ['conflicto', 'mejor'], tip: 'Aborda el problema pronto y en privado; evitarlo lo hace crecer.' },
    presion: { n: 'Manejo de la presión', obj: ['necesidades'], sc: ['accidente1', 'accidente3', 'cliente'], tip: 'Haz una pausa, ordena prioridades (personas, seguridad, operación) y comunica con calma.' },
    escucha: { n: 'Escucha empática', obj: ['necesidades'], sc: ['renuncia', 'tiempoextra', 'tiempoextra2', 'conflicto', 'accidente1'], tip: 'Haz dos preguntas abiertas antes de dar tu opinión.' } };
  const AF = [[/liderazgo|desarrollo de personas/i, 'desarrollo'], [/comunicaci/i, 'comunicacion'], [/resultados|objetivos/i, 'resultados'], [/procesos|ejecuci/i, 'procesos'], [/negociaci/i, 'negociacion'], [/equipo/i, 'equipo'], [/integridad/i, 'integridad']];
  const LOW = /^(bajo|muy bajo)$/i, HIGH = /^(alto|muy alto)$/i;
  async function pdfText(file) {
    if (!G.pdfjsLib) await new Promise((ok, ko) => { const s = document.createElement('script'); s.src = 'comun/pdfjs/pdf.min.js'; s.onload = ok; s.onerror = ko; document.head.append(s); });
    G.pdfjsLib.GlobalWorkerOptions.workerSrc = 'comun/pdfjs/pdf.worker.min.js';
    const doc = await G.pdfjsLib.getDocument({ data: new Uint8Array(await file.arrayBuffer()) }).promise; let out = '';
    for (let i = 1; i <= doc.numPages; i++) { const c = await (await doc.getPage(i)).getTextContent(); out += c.items.map(x => x.str).join(' ') + ' '; }
    return out.replace(/\s+/g, ' '); }
  function parse(t, prof) {
    const nm = t.match(/Evaluado: (.+?) \|/); if (nm && !prof.nombre) prof.nombre = nm[1].trim();
    const pu = t.match(/Puesto: (.+?) (?:Carlos|Reporte|Fortalezas|\d)/); if (pu && !prof.puesto && !/Etegrity/i.test(pu[1])) prof.puesto = pu[1].trim().slice(0, 60);
    let m; const re = /EVT \| ([^|]+?)\s+(Necesario|Deseable)\s+[\d.]+\s*-\s*[\d.]+\s+([\d.]+)\s+([\d.]+)\s+(-?\s*[\d.]+)/g;
    while ((m = re.exec(t))) { const n = m[1].replace(/-\s+/g, '-').trim(); if (!prof.comp.some(c => c.n === n)) prof.comp.push({ n, tipo: m[2], puesto: +m[3], persona: +m[4], gap: +m[5].replace(/\s/g, '') }); prof.fuentes.add('Afinidad (Evaluatest)'); }
    const igi = t.match(/Índice General de Integridad \(IGI\) ([\d.]+) ?%/); if (igi) { prof.igi = +igi[1]; prof.fuentes.add('Etegrity'); }
    const ex = t.match(/Áreas que se recomienda explorar(.*?)(El contenido de este documento|$)/); if (ex) ['Enfoque-Cumplimiento', 'Fraude', 'Robo', 'Soborno', 'Tendencia a la agresividad', 'Tendencia a la mentira', 'Acoso', 'Rechazo a figuras de autoridad', 'Responsabilidad', 'Cooperación'].forEach(a => { if (ex[1].includes(a + ' ') && !prof.explorar.includes(a)) prof.explorar.push(a); });
    const ip = t.split('Interpretación por indicador')[1] || '', ia = ip.search(/Áreas de riesgo/); if (ia >= 0) { const fin = ip.indexOf('Áreas que se recomienda explorar'), seg = ip.slice(ia, fin > ia ? fin : undefined);   /* solo indicadores interpretados bajo «Áreas de riesgo» */
      ['Fraude', 'Robo', 'Soborno', 'Tendencia a la agresividad', 'Tendencia a la mentira', 'Acoso', 'Farmacodependencia', 'Rechazo a figuras de autoridad', 'Responsabilidad', 'Cooperación'].forEach(a => { if (seg.includes(a + ' ') && !prof.riesgo.includes(a)) prof.riesgo.push(a); }); }
    const tb = /Tabla de resultados Fecha de evaluación: [\d/]+ EVT(?: MX)? \| (.+?) Indicador Puntuación Porcentaje Rango (.*?)(?=Una solución Brivé|Tabla de resultados|$)/g;
    while ((m = tb.exec(t))) { const test = m[1].trim(), rows = []; const rr = /([A-Za-zÁÉÍÓÚÑáéíóúñ.,()\- ]+?) (\d+(?:\.\d+)?) (\d+(?:\.\d+)?)% (Muy Alto|Muy Bajo|Alto|Bajo|Moderado|Medio|Promedio|Functional|Non Functional)/g; let r;
      while ((r = rr.exec(m[2]))) rows.push({ n: r[1].trim(), pct: +r[3], rango: r[4] }); if (rows.length) { prof.pruebas[test] = rows; prof.fuentes.add('Diagnóstico de potencial'); } }
    return prof; }
  function plan(prof) {
    const w = {}, why = {}; const add = (k, v, e) => { w[k] = (w[k] || 0) + v; (why[k] = why[k] || []).push(e); };
    prof.comp.forEach(c => { const f = AF.find(([re]) => re.test(c.n)); if (f && c.gap < 0) add(f[1], -c.gap * (c.tipo === 'Necesario' ? 1.5 : 1) + .1, `${c.n}: ${c.persona.toFixed(2)} de ${c.puesto.toFixed(2)} requerido`); });
    if (prof.igi && prof.igi < 66) add('integridad', 1, `Índice de integridad ${prof.igi}%`);
    prof.riesgo.forEach(a => add('integridad', .8, `Etegrity: área de riesgo «${a}»`));
    prof.explorar.forEach(a => { if (/Cumplimiento/.test(a)) { add('resultados', .35, 'Etegrity: requiere apoyo para planes de acción y seguimiento'); add('integridad', .2, 'Etegrity: explorar «Enfoque-Cumplimiento»'); } else add('integridad', .35, `Etegrity: explorar «${a}»`); });
    const each = (rx, fn) => Object.entries(prof.pruebas).forEach(([test, rows]) => rows.forEach(r => { if (rx.test(test + ' :: ' + r.n)) fn(r, test); }));
    each(/Kilmann.*:: Competencia$/, r => { if (LOW.test(r.rango)) add('firmeza', .5, `Thomas-Kilmann: estilo «Competencia» ${r.rango.toLowerCase()} (${r.pct}%) — le cuesta tomar postura firme`); });
    each(/Kilmann.*:: Evasión$/, r => { if (HIGH.test(r.rango)) add('conflicto', .5, `Thomas-Kilmann: tiende a evadir conflictos (${r.pct}%)`); });
    each(/Kilmann.*:: Complacencia$/, r => { if (HIGH.test(r.rango)) add('firmeza', .4, `Thomas-Kilmann: tiende a complacer (${r.pct}%)`); });
    each(/16 FP.*:: E\. Dominancia$/, r => { if (LOW.test(r.rango)) add('firmeza', .3, `16PF: dominancia ${r.rango.toLowerCase()} (${r.pct}%)`); });
    each(/16 FP.*:: C\. Estabilidad Emocional$/, r => { if (LOW.test(r.rango)) add('presion', .4, `16PF: estabilidad emocional ${r.rango.toLowerCase()}`); });
    each(/IPV.*:: I\. Comprensión$/, r => { if (LOW.test(r.rango)) add('escucha', .3, `IPV: comprensión de los demás ${r.rango.toLowerCase()} (${r.pct}%)`); });
    each(/DISC.*:: Dominio y Empuje bajo presión$/, r => { if (LOW.test(r.rango)) add('firmeza', .2, 'DISC: baja dominancia bajo presión'); });
    const top = Object.entries(w).sort((a, b) => b[1] - a[1]).slice(0, 4).map(([k, v]) => ({ k, n: FOCUS[k].n, peso: +v.toFixed(2), tip: FOCUS[k].tip, obj: FOCUS[k].obj, evid: why[k].slice(0, 3) }));
    const fort = prof.comp.filter(c => c.gap > 0).sort((a, b) => b.gap - a.gap).slice(0, 3).map(c => c.n);
    const scRank = {}; top.forEach((f, i) => FOCUS[f.k].sc.forEach((s, j) => { scRank[s] = (scRank[s] || 0) + (f.peso * (4 - i)) / (j + 1); }));
    return { focos: top, fortalezas: fort, situaciones: Object.entries(scRank).sort((a, b) => b[1] - a[1]).map(x => x[0]) }; }
  async function readFiles(files) { const prof = { nombre: '', puesto: '', comp: [], igi: null, riesgo: [], explorar: [], pruebas: {}, fuentes: new Set() };
    for (const f of files) parse(await pdfText(f), prof); prof.fuentes = [...prof.fuentes]; prof.plan = plan(prof); prof.fecha = new Date().toISOString(); return prof; }
  G.PSICO = { FOCUS, readFiles, parse, plan, pdfText };
})(window);
