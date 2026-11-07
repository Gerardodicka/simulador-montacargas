// DICKA Play · Dojo de Mando: motor de conversación (Claude) para el simulador de liderazgo
// POST /.netlify/functions/dojo-ia
//   { ping:true }                                  → prueba la clave y el modelo: { ok, modelo } o { ok:false, motivo }
//   { dicho, personaje, historial:[{quien,texto}], opciones:[{k,t}], contexto, pregunta, nivel, animo, confianzaPersonaje }
//   → { ok, tipo:'conversa'|'decision'|'pregunta'|'continuar'|'otro', opcion:'A'|'B'|'C'|null, confianza, respuesta, mentor }
// Requiere ANTHROPIC_API_KEY en Netlify. Opcional: DOJO_MODEL para cambiar de modelo.

export const deps = { fetch: (...a) => fetch(...a) };   // punto de inyección para pruebas

const MODEL = process.env.DOJO_MODEL || "claude-haiku-5-5";
const json = (status, body) => new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" } });
const clip = (v, n) => String(v ?? "").slice(0, n);

const SYSTEM = `Eres el motor de un simulador de liderazgo de DICKA Logistics (almacenes en México). Haces dos cosas a la vez:
1) INTERPRETAS AL PERSONAJE con quien habla el participante y le CONTESTAS como en una plática real: natural, breve (1 a 3 frases), en español de México, en primera persona, sin groserías, coherente con su personalidad, su estado de ánimo y su nivel de confianza (baja = se cierra o se defiende; alta = coopera y se abre). Nunca hables como narrador ni como IA.
2) EVALÚAS en silencio la postura del líder frente a las opciones de la decisión actual.
Personajes:
- Ricardo: supervisor con la mejor productividad; defensivo; minimiza el incidente de seguridad (operó el montacargas sin cinturón y con la carga elevada) y presume sus resultados. Si lo tratan con respeto y hechos, poco a poco reconoce.
- Ana: auxiliar de almacén; teme represalias; solo cuenta lo de los gritos de Ricardo si confía en el líder.
- El jefe (por teléfono): presiona por cumplir metas sin escándalos; acepta argumentos con datos.
Dificultad adaptativa: recibes "Presión" (baja, media, alta). Con presión alta el personaje pone a prueba al líder: objeta con argumentos operativos (embarques, metas, turno de día), pide garantías o cambia de tema; con baja coopera más fácilmente. Nunca se vuelve grosero.
Objetivos que se evalúan: fijar metas claras, conocer las necesidades del equipo, dar retroalimentación (hechos, conducta, impacto) y delegar con responsable y seguimiento; úsalos en "mentor".
Cierre: si recibes "Cerrar: sí", el líder ya platicó suficiente; clasifica como "decision" con la opción más cercana a lo que ha planteado en toda la plática (confianza >= 0.7), aunque no coincida palabra por palabra. Si el líder repite la misma postura (por ejemplo documentar o ir con recursos humanos), eso ya es una decisión.
Clasificación ("tipo"):
- "decision": el líder ya dejó CLARA su forma de actuar y corresponde a una opción (A, B o C) por intención, aunque use otras palabras. Pon "opcion" y "confianza" >= 0.7.
- "conversa": sigue platicando (pregunta, escucha, explora) sin definir aún su decisión. "opcion": null.
- "pregunta": pregunta sobre el juego o pide ayuda; responde en "mentor" y deja "respuesta" vacía.
- "continuar": pide avanzar ("continuar", "siguiente").
- "otro": no se entiende; el personaje lo dice de forma natural en "respuesta".
"mentor": una línea breve (máx. 20 palabras) de qué está haciendo bien o qué le falta al líder; vacía si no aplica.
Responde SOLO un objeto JSON válido, sin texto adicional:
{"tipo":"…","opcion":"A|B|C|null","confianza":0.0,"respuesta":"…","mentor":"…"}`;

async function claude(key, system, messages, max) {
  const r = await deps.fetch("https://api.anthropic.com/v1/messages", { method: "POST",
    headers: { "x-api-key": key, "anthropic-version": "2023-06-01", "content-type": "application/json" },
    body: JSON.stringify({ model: MODEL, max_tokens: max, system, messages }) });
  if (!r.ok) { let det = ""; try { const e = await r.json(); det = clip(e?.error?.message, 160); } catch { } return { error: "api_" + r.status, det }; }
  const d = await r.json(); return { text: (d.content || []).map(c => c.text || "").join("") };
}

export default async (req) => {
  if (req.method !== "POST") return json(405, { ok: false, motivo: "metodo" });
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) return json(200, { ok: false, motivo: "sin_clave" });
  let b; try { b = await req.json(); } catch { return json(400, { ok: false, motivo: "json" }); }
  try {
    if (b.ping) { const r = await claude(key, "Responde solo: ok", [{ role: "user", content: "ping" }], 5); return json(200, r.error ? { ok: false, motivo: r.error, detalle: r.det, modelo: MODEL } : { ok: true, modelo: MODEL }); }
    const opciones = Array.isArray(b.opciones) ? b.opciones.slice(0, 4).map(o => `${clip(o.k, 2)}) ${clip(o.t, 400)}`).join("\n") : "";
    const hist = Array.isArray(b.historial) ? b.historial.slice(-10).map(h => `${clip(h.quien, 30)}: ${clip(h.texto, 300)}`).join("\n") : "";
    const user = `Nivel del líder: ${clip(b.nivel, 60)}
Escena: ${clip(b.contexto, 1000)}
Decisión actual: ${clip(b.pregunta, 300)}
Opciones:
${opciones || "(ninguna en pantalla)"}
Presión: ${clip(b.presion || "media", 10)}
Cerrar: ${b.cerrar ? "sí" : "no"}
Personaje con quien habla: ${clip(b.personaje || "Ricardo", 40)} (estado: ${clip(b.animo, 60)}, confianza ${Number(b.confianzaPersonaje) || 50}/100)
Plática hasta ahora:
${hist || "(inicio)"}
El líder dice ahora: "${clip(b.dicho, 600)}"`;
    const r = await claude(key, SYSTEM, [{ role: "user", content: user }], 600);
    if (r.error) return json(200, { ok: false, motivo: r.error, detalle: r.det });
    const m = r.text.match(/\{[\s\S]*\}/); let o = null; try { o = m && JSON.parse(m[0]); } catch { }
    if (!o) { const g = k => (r.text.match(new RegExp('"' + k + '"\\s*:\\s*"((?:[^"\\\\]|\\\\.)*)')) || [])[1];   // JSON cortado: rescata lo que se pueda
      const resp = g("respuesta"); if (!resp) return json(200, { ok: false, motivo: "formato" }); o = { tipo: g("tipo") || "conversa", opcion: g("opcion"), confianza: 0, respuesta: resp, mentor: g("mentor") || "" }; } const op = /^[ABC]$/.test(String(o.opcion)) ? o.opcion : null;
    const tipos = ["conversa", "decision", "pregunta", "continuar", "otro"];
    return json(200, { ok: true, tipo: tipos.includes(o.tipo) ? o.tipo : "conversa", opcion: op, confianza: Number(o.confianza) || 0, respuesta: clip(o.respuesta || o.reaccion, 500), mentor: clip(o.mentor, 300) });
  } catch (e) { return json(200, { ok: false, motivo: "error", detalle: clip(e && e.message, 160) }); }
};
