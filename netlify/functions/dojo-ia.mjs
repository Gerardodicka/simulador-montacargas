// DICKA Play · Dojo de Mando: motor de conversación (Claude) para el simulador de liderazgo
// POST /.netlify/functions/dojo-ia
//   { ping:true }                                  → prueba la clave y el modelo: { ok, modelo } o { ok:false, motivo }
//   { dicho, personaje, historial:[{quien,texto}], opciones:[{k,t}], contexto, pregunta, nivel, animo, confianzaPersonaje }
//   → { ok, tipo:'conversa'|'decision'|'pregunta'|'continuar'|'otro', opcion:'A'|'B'|'C'|null, confianza, respuesta, mentor }
// Requiere ANTHROPIC_API_KEY en Netlify. Opcional: DOJO_MODEL para cambiar de modelo.

export const deps = { fetch: (...a) => fetch(...a) };   // punto de inyección para pruebas

const MODEL = process.env.DOJO_MODEL || "claude-haiku-5-5";
const EVAL_MODEL = process.env.DOJO_EVAL_MODEL || MODEL;   // opcional: un modelo más capaz solo para la retroalimentación final
const json = (status, body) => new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" } });
const clip = (v, n) => String(v ?? "").slice(0, n);

const SYSTEM = `Eres el motor de un simulador de liderazgo de DICKA Logistics (almacenes en México). Haces dos cosas a la vez:
1) INTERPRETAS AL PERSONAJE con quien habla el participante y le CONTESTAS como en una plática real: natural, breve (1 a 2 frases, como se habla en persona: con titubeos, frases cortas, sin listas), en español de México, en primera persona, sin groserías, coherente con su personalidad, su estado de ánimo y su nivel de confianza (baja = se cierra o se defiende; alta = coopera y se abre). Nunca hables como narrador ni como IA.
2) EVALÚAS en silencio la postura del líder frente a las opciones de la decisión actual.
Personajes:
- Ricardo: supervisor con la mejor productividad; defensivo; minimiza el incidente de seguridad (operó el montacargas sin cinturón y con la carga elevada) y presume sus resultados. Si lo tratan con respeto y hechos, poco a poco reconoce.
- Ana: auxiliar de almacén; teme represalias; solo cuenta lo de los gritos de Ricardo si confía en el líder.
- El jefe (por teléfono): presiona por cumplir metas sin escándalos; acepta argumentos con datos.
Dificultad adaptativa: recibes "Presión" (baja, media, alta). Con presión alta el personaje pone a prueba al líder: objeta con argumentos operativos (embarques, metas, turno de día), pide garantías o cambia de tema; con baja coopera más fácilmente. Nunca se vuelve grosero.
Objetivos que se evalúan: fijar metas claras, conocer las necesidades del equipo, dar retroalimentación (hechos, conducta, impacto) y delegar con responsable y seguimiento; úsalos en "mentor".
Cierre: si recibes "Cerrar: sí", el líder ya platicó suficiente; clasifica como "decision" con la opción más cercana a lo que ha planteado en toda la plática (confianza >= 0.7), aunque no coincida palabra por palabra. Si el líder repite la misma postura (por ejemplo documentar o ir con recursos humanos), eso ya es una decisión.
Situaciones de práctica: si recibes "Práctica: sí", la escena describe otra situación y otro personaje; interpreta a ESE personaje con su nombre, su rol y su postura (ignora la descripción de Ricardo y Ana); si hay varios participantes, responde solo como el personaje indicado y mantén su postura (por ejemplo, el sindicato defiende al trabajador y el debido proceso). Usa "conversa" salvo que pida ayuda.
Clasificación ("tipo"):
- "decision": el líder ya dejó CLARA su forma de actuar y corresponde a una opción (A, B o C) por intención, aunque use otras palabras. Pon "opcion" y "confianza" >= 0.7.
- "conversa": sigue platicando (pregunta, escucha, explora) sin definir aún su decisión. "opcion": null.
- "pregunta": pregunta sobre el juego o pide ayuda; responde en "mentor" y deja "respuesta" vacía.
- "continuar": pide avanzar ("continuar", "siguiente").
- "otro": no se entiende; el personaje lo dice de forma natural en "respuesta".
"mentor": una línea breve (máx. 20 palabras) de qué está haciendo bien o qué le falta al líder; vacía si no aplica.
Responde SOLO un objeto JSON válido, sin texto adicional:
{"tipo":"…","opcion":"A|B|C|null","confianza":0.0,"respuesta":"…","mentor":"…"}`;

/* Llamada a la API de Claude.
   - system con cache_control: el prompt fijo se cachea (menos latencia y costo en cada turno)
   - output_config.effort: "low" en la plática (respuesta rápida), "medium" en la evaluación
   - output_config.format: salida JSON validada contra un esquema (si la API la rechaza, se reintenta sin esquema) */
async function claude(key, system, messages, max, o = {}) {
  const send = async withSchema => { const output_config = {}; if (o.effort) output_config.effort = o.effort; if (withSchema && o.schema) output_config.format = { type: "json_schema", schema: o.schema };
    const body = { model: o.model || MODEL, max_tokens: max, system: [{ type: "text", text: system, cache_control: { type: "ephemeral" } }], messages }; if (Object.keys(output_config).length) body.output_config = output_config;
    return deps.fetch("https://api.anthropic.com/v1/messages", { method: "POST", headers: { "x-api-key": key, "anthropic-version": "2023-06-01", "content-type": "application/json" }, body: JSON.stringify(body) }); };
  let r = await send(true); if (r.status === 400 && o.schema) r = await send(false);
  if (!r.ok) { let det = ""; try { const e = await r.json(); det = clip(e?.error?.message, 160); } catch { } return { error: "api_" + r.status, det }; }
  const d = await r.json(); return { text: (d.content || []).filter(c => c.type === "text").map(c => c.text || "").join("") };
}
const B = { type: "boolean" };
const S_CONV = { type: "object", additionalProperties: false, required: ["tipo", "opcion", "confianza", "respuesta", "mentor"], properties: {
  tipo: { type: "string", enum: ["conversa", "decision", "pregunta", "continuar", "otro"] }, opcion: { anyOf: [{ type: "string", enum: ["A", "B", "C", "D"] }, { type: "null" }] },
  confianza: { type: "number" }, respuesta: { type: "string" }, mentor: { type: "string" } } };
const CRIT = ["escucha", "meta", "preguntas", "delegacion", "tono"];
const S_CRIT = { type: "object", additionalProperties: false, required: ["puntaje", "turno", "cita"], properties: { puntaje: { type: "integer" }, turno: { type: "integer" }, cita: { type: "string" } } };
const S_EVAL = { type: "object", additionalProperties: false, required: ["puntaje", "objetivos", "sbi", "grow", "fortaleza", "mejora", "resumen", "reformula", "criterios"], properties: {
  criterios: { type: "object", additionalProperties: false, required: CRIT, properties: Object.fromEntries(CRIT.map(k => [k, S_CRIT])) },
  puntaje: { type: "integer" }, objetivos: { type: "object", additionalProperties: false, required: ["metas", "necesidades", "retro", "delegar"], properties: { metas: B, necesidades: B, retro: B, delegar: B } },
  sbi: { type: "object", additionalProperties: false, required: ["situacion", "conducta", "impacto"], properties: { situacion: B, conducta: B, impacto: B } },
  grow: { type: "object", additionalProperties: false, required: ["meta", "realidad", "opciones", "voluntad"], properties: { meta: B, realidad: B, opciones: B, voluntad: B } },
  fortaleza: { type: "string" }, mejora: { type: "string" }, resumen: { type: "string" },
  reformula: { type: "object", additionalProperties: false, required: ["original", "mejor"], properties: { original: { type: "string" }, mejor: { type: "string" } } } } };
const S_MOD = { type: "object", additionalProperties: false, required: ["turnos", "explicacion"], properties: {
  turnos: { type: "array", items: { type: "object", additionalProperties: false, required: ["quien", "texto"], properties: { quien: { type: "string" }, texto: { type: "string" } } } },
  explicacion: { type: "array", items: { type: "object", additionalProperties: false, required: ["modelo", "parte", "texto"], properties: { modelo: { type: "string", enum: ["SBI", "GROW"] }, parte: { type: "string" }, texto: { type: "string" } } } } } };
/* historial numerado con el índice original de la plática (para que la evidencia apunte a un turno real) */
const numHist = (h, n) => Array.isArray(h) ? h.slice(-n).map((x, j, a) => `[${Number.isInteger(x.i) ? x.i : h.length - a.length + j}] ${clip(x.quien, 40)}: ${clip(x.texto, 300)}`).join("\n") : "";

/* F2-05: cada criterio debe apuntar a un turno existente del líder; si no, se marca sin evidencia */
function validCrit(c, hist) { if (!c || typeof c !== "object") return null; const H = Array.isArray(hist) ? hist : [], out = {};
  for (const k of CRIT) { const x = c[k] || {}, n = Number.isInteger(x.turno) ? x.turno : -1, h = H.find((y, j) => (Number.isInteger(y.i) ? y.i : j) === n);
    const ok = h && /^l[ií]der$/i.test(String(h.quien)); out[k] = { puntaje: Math.max(0, Math.min(100, Number(x.puntaje) || 0)), turno: ok ? n : -1, cita: ok ? clip(x.cita || h.texto, 200) : "" }; }
  return out; }
export default async (req) => {
  if (req.method !== "POST") return json(405, { ok: false, motivo: "metodo" });
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) return json(200, { ok: false, motivo: "sin_clave" });
  let b; try { b = await req.json(); } catch { return json(400, { ok: false, motivo: "json" }); }
  try {
    if (b.ping) { const r = await claude(key, "Responde solo: ok", [{ role: "user", content: "ping" }], 16, { effort: "low" }); return json(200, r.error ? { ok: false, motivo: r.error, detalle: r.det, modelo: MODEL } : { ok: true, modelo: MODEL }); }
    if (b.evaluar) {   // retroalimentación final de una situación de práctica
      const hist = numHist(b.historial, 40);
      const sys = `Eres un mentor de liderazgo de DICKA Logistics (almacenes en México). Evalúa con justicia la plática de un líder de nivel ${clip(b.nivel, 30)} en una situación crítica. Español de México, claro y concreto. Responde SOLO JSON válido:
{"puntaje":0-100,"objetivos":{"metas":bool,"necesidades":bool,"retro":bool,"delegar":bool},"sbi":{"situacion":bool,"conducta":bool,"impacto":bool},"grow":{"meta":bool,"realidad":bool,"opciones":bool,"voluntad":bool},"fortaleza":"máx. 18 palabras","mejora":"máx. 25 palabras, acción concreta","resumen":"2 frases: qué logró y qué haría distinto la próxima vez","reformula":{"original":"la frase más débil que dijo el líder, textual","mejor":"cómo decirla mejor, natural y breve"},"criterios":{"escucha":{"puntaje":0-100,"turno":n,"cita":"…"},"meta":{…},"preguntas":{…},"delegacion":{…},"tono":{…}}}
Criterios (cada uno con puntaje 0-100, el número [n] del turno del LÍDER que mejor lo sustenta y la cita textual breve de ese turno; si no hay evidencia, turno -1 y cita vacía con puntaje bajo): escucha = escucha activa y empatía; meta = claridad de la meta o acuerdo; preguntas = uso de preguntas abiertas; delegacion = asigna responsable y seguimiento; tono = respeto y firmeza adecuados.
SBI: describió la situación concreta, la conducta observable y el impacto. GROW: acordó meta, exploró la realidad con preguntas, pidió opciones al otro y cerró compromiso (voluntad) con fecha.
metas = acordó qué, cuánto y para cuándo; necesidades = preguntó y escuchó; retro = dio retroalimentación con hechos, conducta e impacto; delegar = asignó responsable y seguimiento. Sé exigente: sin acuerdos concretos el puntaje no pasa de 60. Si hay áreas a desarrollar según su evaluación psicométrica, enfoca la "mejora" y el "resumen" en esas áreas (sin mencionar las pruebas).`;
      const r = await claude(key, sys, [{ role: "user", content: `Situación: ${clip(b.contexto, 800)}\nObjetivo del líder: ${clip(b.objetivo, 300)}\nÁreas a desarrollar según su evaluación psicométrica: ${Array.isArray(b.enfoque) && b.enfoque.length ? b.enfoque.slice(0, 4).map(x => clip(x, 60)).join(", ") : "(no disponible)"}\nPersonaje: ${clip(b.personaje, 40)}\nPlática:\n${hist}` }], 1200, { model: EVAL_MODEL, effort: "medium", schema: S_EVAL });
      if (r.error) return json(200, { ok: false, motivo: r.error, detalle: r.det });
      let o = null; try { o = JSON.parse((r.text.match(/\{[\s\S]*\}/) || [""])[0]); } catch { }
      if (!o) return json(200, { ok: false, motivo: "formato" });
      const ob = o.objetivos || {}; return json(200, { ok: true, puntaje: Math.max(0, Math.min(100, Number(o.puntaje) || 0)), objetivos: { metas: !!ob.metas, necesidades: !!ob.necesidades, retro: !!ob.retro, delegar: !!ob.delegar }, fortaleza: clip(o.fortaleza, 200), mejora: clip(o.mejora, 300), resumen: clip(o.resumen, 500), sbi: o.sbi ? { situacion: !!o.sbi.situacion, conducta: !!o.sbi.conducta, impacto: !!o.sbi.impacto } : null, grow: o.grow ? { meta: !!o.grow.meta, realidad: !!o.grow.realidad, opciones: !!o.grow.opciones, voluntad: !!o.grow.voluntad } : null, reformula: o.reformula && o.reformula.original ? { original: clip(o.reformula.original, 240), mejor: clip(o.reformula.mejor, 240) } : null, criterios: validCrit(o.criterios, b.historial) });
    }
    if (b.modelo) {   // F2-04: plática ejemplar ("ver cómo lo manejaría")
      const sys = `Eres un coach de liderazgo de DICKA Logistics (almacenes en México). Escribe una plática EJEMPLAR, breve y realista, de cómo un líder de nivel ${clip(b.nivel, 30)} manejaría bien esta situación. Español de México natural (sin groserías, sin tecnicismos de coaching dentro del diálogo). Entre 6 y 10 turnos alternados; el líder usa "Líder" como quien, y los demás su nombre exacto. Los personajes reaccionan de forma creíble (con resistencia al inicio). Después explica en 3 a 5 puntos por qué funciona, usando SBI (Situación, Conducta, Impacto) o GROW (Meta, Realidad, Opciones, Compromiso). Responde SOLO JSON: {"turnos":[{"quien":"Líder|Nombre","texto":"…"}],"explicacion":[{"modelo":"SBI|GROW","parte":"…","texto":"máx. 25 palabras"}]}`;
      const r = await claude(key, sys, [{ role: "user", content: `Situación: ${clip(b.contexto, 900)}\nObjetivo: ${clip(b.objetivo, 300)}\nPersonajes: ${Array.isArray(b.personajes) ? b.personajes.slice(0, 4).map(x => clip(x, 60)).join("; ") : clip(b.personaje, 60)}\nLo que ya dijeron al inicio: ${clip(b.apertura, 600)}` }], 1400, { model: EVAL_MODEL, effort: "low", schema: S_MOD });
      if (r.error) return json(200, { ok: false, motivo: r.error, detalle: r.det });
      let o = null; try { o = JSON.parse((r.text.match(/\{[\s\S]*\}/) || [""])[0]); } catch { }
      if (!o || !Array.isArray(o.turnos) || o.turnos.length < 2) return json(200, { ok: false, motivo: "formato" });
      return json(200, { ok: true, turnos: o.turnos.slice(0, 12).map(t => ({ quien: clip(t.quien, 40), texto: clip(t.texto, 400) })), explicacion: (o.explicacion || []).slice(0, 6).map(e => ({ modelo: e.modelo === "GROW" ? "GROW" : "SBI", parte: clip(e.parte, 30), texto: clip(e.texto, 220) })) });
    }
    const opciones = Array.isArray(b.opciones) ? b.opciones.slice(0, 4).map(o => `${clip(o.k, 2)}) ${clip(o.t, 400)}`).join("\n") : "";
    const hist = Array.isArray(b.historial) ? b.historial.slice(-8).map(h => `${clip(h.quien, 30)}: ${clip(h.texto, 300)}`).join("\n") : "";
    const user = `Nivel del líder: ${clip(b.nivel, 60)}
Escena: ${clip(b.contexto, 1600)}
Decisión actual: ${clip(b.pregunta, 300)}
Opciones:
${opciones || "(ninguna en pantalla)"}
Presión: ${clip(b.presion || "media", 10)}
Cerrar: ${b.cerrar ? "sí" : "no"}
Práctica: ${b.practica ? "sí" : "no"}
Personaje con quien habla: ${clip(b.personaje || "Ricardo", 40)} (estado: ${clip(b.animo, 60)}, confianza ${Number(b.confianzaPersonaje) || 50}/100)
Plática hasta ahora:
${hist || "(inicio)"}
El líder dice ahora: "${clip(b.dicho, 600)}"`;
    const r = await claude(key, SYSTEM, [{ role: "user", content: user }], 600, { effort: "low", schema: S_CONV });
    if (r.error) return json(200, { ok: false, motivo: r.error, detalle: r.det });
    const m = r.text.match(/\{[\s\S]*\}/); let o = null; try { o = m && JSON.parse(m[0]); } catch { }
    if (!o) { const g = k => (r.text.match(new RegExp('"' + k + '"\\s*:\\s*"((?:[^"\\\\]|\\\\.)*)')) || [])[1];   // JSON cortado: rescata lo que se pueda
      const resp = g("respuesta"); if (!resp) return json(200, { ok: false, motivo: "formato" }); o = { tipo: g("tipo") || "conversa", opcion: g("opcion"), confianza: 0, respuesta: resp, mentor: g("mentor") || "" }; } const op = /^[ABCD]$/.test(String(o.opcion)) ? o.opcion : null;
    const tipos = ["conversa", "decision", "pregunta", "continuar", "otro"];
    return json(200, { ok: true, tipo: tipos.includes(o.tipo) ? o.tipo : "conversa", opcion: op, confianza: Number(o.confianza) || 0, respuesta: clip(o.respuesta || o.reaccion, 500), mentor: clip(o.mentor, 300) });
  } catch (e) { return json(200, { ok: false, motivo: "error", detalle: clip(e && e.message, 160) }); }
};
