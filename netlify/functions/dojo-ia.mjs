// DICKA Play · Dojo de Mando: motor de razonamiento (Claude) para respuestas libres por voz o texto
// POST /.netlify/functions/dojo-ia  body: { pregunta, opciones:[{k,t}], dicho, contexto, nivel }
//   → { ok, tipo:'decision'|'pregunta'|'continuar'|'otro', opcion:'A'|'B'|'C'|null, confianza, mentor, reaccion }
// Requiere la variable de entorno ANTHROPIC_API_KEY en Netlify (Site configuration → Environment variables).
// Si no está configurada responde { ok:false, motivo:'sin_clave' } y el Dojo usa su reconocimiento por palabras clave.

export const deps = { fetch: (...a) => fetch(...a) };   // punto de inyección para pruebas

const MODEL = process.env.DOJO_MODEL || "claude-haiku-5-5";
const json = (status, body) => new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" } });
const clip = (v, n) => String(v ?? "").slice(0, n);

const SYSTEM = `Eres el motor de razonamiento del "Dojo de Mando", un simulador de liderazgo de DICKA Logistics (almacenes en México).
El participante (un líder de operaciones) responde con sus propias palabras, por voz o por escrito, a una situación difícil.
Tu trabajo: entender su intención como lo haría un mentor experimentado y clasificarla.
Reglas:
- Si describe lo que haría, elige la opción (A, B o C) cuya intención y efecto sean MÁS PARECIDOS, aunque use otras palabras. Si combina varias, elige la que domina.
- Si hace una pregunta (sobre el juego, los indicadores, la situación o pide ayuda), tipo "pregunta" y respóndela breve en "mentor".
- Si pide avanzar ("continuar", "siguiente", "listo"), tipo "continuar".
- Si no se entiende o no tiene relación, tipo "otro" y en "mentor" pide aclarar con un ejemplo concreto.
- "reaccion": una frase corta y natural de cómo reaccionaría el personaje principal a lo que dijo (español de México, sin groserías).
- Si el participante le habla DIRECTAMENTE a un personaje ("Habla con:" en el mensaje), contesta como ese personaje en "reaccion" (1-2 frases, en primera persona, coherente con su personalidad, su estado de ánimo y su confianza; si la confianza es baja se cierra, si es alta coopera). Clasifica "tipo" como "pregunta" salvo que describa claramente una de las opciones.
- Personajes: Ricardo (supervisor con la mejor productividad, defensivo, minimiza el incidente de seguridad y cita sus resultados), Ana (auxiliar, teme represalias, habla solo si confía), el jefe por teléfono (presiona por metas sin escándalos).
- Responde SOLO un objeto JSON válido, sin texto adicional:
{"tipo":"decision|pregunta|continuar|otro","opcion":"A|B|C|null","confianza":0.0-1.0,"mentor":"…","reaccion":"…"}`;

export default async (req) => {
  if (req.method !== "POST") return json(405, { ok: false, motivo: "metodo" });
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) return json(200, { ok: false, motivo: "sin_clave" });
  let b; try { b = await req.json(); } catch { return json(400, { ok: false, motivo: "json" }); }
  const opciones = Array.isArray(b.opciones) ? b.opciones.slice(0, 4).map(o => `${clip(o.k, 2)}) ${clip(o.t, 400)}`).join("\n") : "";
  const user = `Nivel del participante: ${clip(b.nivel, 60)}
Contexto de la escena: ${clip(b.contexto, 1200)}
Pregunta actual: ${clip(b.pregunta, 300)}
Opciones:
${opciones || "(sin opciones: está en una pantalla de consecuencia o evento)"}
${b.personaje ? `Habla con: ${clip(b.personaje, 40)} (estado: ${clip(b.animo, 60)}, confianza ${Number(b.confianzaPersonaje) || 50}/100)\n` : ""}Lo que dijo el participante: "${clip(b.dicho, 600)}"`;
  try {
    const r = await deps.fetch("https://api.anthropic.com/v1/messages", { method: "POST",
      headers: { "x-api-key": key, "anthropic-version": "2023-06-01", "content-type": "application/json" },
      body: JSON.stringify({ model: MODEL, max_tokens: 300, system: SYSTEM, messages: [{ role: "user", content: user }] }) });
    if (!r.ok) return json(200, { ok: false, motivo: "api_" + r.status });
    const d = await r.json(); const txt = (d.content || []).map(c => c.text || "").join("");
    const m = txt.match(/\{[\s\S]*\}/); if (!m) return json(200, { ok: false, motivo: "formato" });
    const o = JSON.parse(m[0]); const op = /^[ABC]$/.test(String(o.opcion)) ? o.opcion : null;
    return json(200, { ok: true, tipo: ["decision", "pregunta", "continuar", "otro"].includes(o.tipo) ? o.tipo : "otro", opcion: op, confianza: Number(o.confianza) || 0, mentor: clip(o.mentor, 600), reaccion: clip(o.reaccion, 300) });
  } catch (e) { return json(200, { ok: false, motivo: "error" }); }
};
