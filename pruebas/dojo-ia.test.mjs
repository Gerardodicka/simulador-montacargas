// Pruebas de la función del motor de razonamiento del Dojo (sin llamadas reales a la API)
import fn, { deps } from "../netlify/functions/dojo-ia.mjs";
let ok = 0, bad = 0; const t = (n, c) => { if (c) ok++; else { bad++; console.log("❌", n); } };
const req = b => new Request("http://x/.netlify/functions/dojo-ia", { method: "POST", body: JSON.stringify(b) });
const body = { dicho: "me lo llevo a la oficina a solas y le enseño el video", opciones: [{ k: "A", t: "en público" }, { k: "B", t: "en privado con hechos" }, { k: "C", t: "ignorar" }] };
delete process.env.ANTHROPIC_API_KEY; let r = await (await fn(req(body))).json(); t("sin clave → fallback", r.ok === false && r.motivo === "sin_clave");
process.env.ANTHROPIC_API_KEY = "prueba"; let sent = null;
deps.fetch = async (u, o) => { sent = JSON.parse(o.body); return new Response(JSON.stringify({ content: [{ type: "text", text: '{"tipo":"decision","opcion":"B","confianza":0.9,"mentor":"Hablar en privado con hechos.","reaccion":"Ok, vamos."}' }] }), { status: 200 }); };
r = await (await fn(req(body))).json(); t("clasifica decisión B", r.ok && r.tipo === "decision" && r.opcion === "B"); t("envía lo dicho al modelo", sent && /a solas/.test(sent.messages[0].content));
deps.fetch = async () => new Response("{}", { status: 500 }); r = await (await fn(req(body))).json(); t("error de API → fallback", r.ok === false);
deps.fetch = async () => new Response(JSON.stringify({ content: [{ text: '{"tipo":"decision","opcion":"Z"}' }] }), { status: 200 }); r = await (await fn(req(body))).json(); t("opción inválida → null", r.ok && r.opcion === null);
r = await (await fn(new Request("http://x", { method: "GET" }))).json(); t("solo POST", r.ok === false);
console.log(`Dojo IA: ${ok}/${ok + bad} pruebas correctas`); process.exit(bad ? 1 : 0);
