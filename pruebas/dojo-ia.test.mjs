// Pruebas del motor de conversación del Dojo (sin llamadas reales a la API)
import fn, { deps } from "../netlify/functions/dojo-ia.mjs";
let ok = 0, bad = 0; const t = (n, c) => { if (c) ok++; else { bad++; console.log("❌", n); } };
const req = b => new Request("http://x/.netlify/functions/dojo-ia", { method: "POST", body: JSON.stringify(b) });
const reply = (txt, st = 200) => async (u, o) => { reply.sent = JSON.parse(o.body); return new Response(JSON.stringify(st === 200 ? { content: [{ type: "text", text: txt }] } : { error: { message: "detalle" } }), { status: st }); };
const body = { dicho: "me lo llevo aparte y le enseño el video", personaje: "Ricardo", historial: [{ quien: "Líder", texto: "hola Ricardo" }], opciones: [{ k: "A", t: "en público" }, { k: "B", t: "en privado con hechos" }, { k: "C", t: "ignorar" }] };
delete process.env.ANTHROPIC_API_KEY; let r = await (await fn(req(body))).json(); t("sin clave → respaldo", r.ok === false && r.motivo === "sin_clave");
process.env.ANTHROPIC_API_KEY = "prueba";
deps.fetch = reply("ok"); r = await (await fn(req({ ping: true }))).json(); t("ping ok", r.ok && r.modelo);
deps.fetch = reply("", 404); r = await (await fn(req({ ping: true }))).json(); t("ping con modelo inválido explica el motivo", !r.ok && r.motivo === "api_404" && r.detalle === "detalle");
deps.fetch = reply('{"tipo":"decision","opcion":"B","confianza":0.9,"respuesta":"Ok, vamos a la oficina.","mentor":"Bien: privado y con hechos."}'); r = await (await fn(req(body))).json();
t("clasifica decisión B", r.ok && r.tipo === "decision" && r.opcion === "B"); t("responde en personaje", /oficina/.test(r.respuesta)); t("envía historial al modelo", /hola Ricardo/.test(reply.sent.messages[0].content));
deps.fetch = reply('{"tipo":"conversa","opcion":null,"respuesta":"¿Y eso qué? Mis números hablan."}'); r = await (await fn(req(body))).json(); t("plática sin decisión", r.ok && r.tipo === "conversa" && r.opcion === null);
deps.fetch = reply("", 500); r = await (await fn(req(body))).json(); t("error de API → respaldo", r.ok === false && r.motivo === "api_500");
deps.fetch = reply('{"tipo":"decision","opcion":"Z"}'); r = await (await fn(req(body))).json(); t("opción inválida → null", r.ok && r.opcion === null);
deps.fetch = reply('{"puntaje":72,"objetivos":{"metas":true,"necesidades":true,"retro":false,"delegar":true},"sbi":{"situacion":true,"conducta":false,"impacto":true},"grow":{"meta":true,"realidad":true,"opciones":false,"voluntad":true},"reformula":{"original":"ya ni modo","mejor":"Veamos cómo lo resolvemos"},"fortaleza":"Escuchó","mejora":"Dar hechos","resumen":"Bien."}'); r = await (await fn(req({ evaluar: true, historial: [{ quien: "Líder", texto: "¿qué pasó?" }], contexto: "faltante", objetivo: "investigar" }))).json();
t("evalúa una práctica", r.ok && r.puntaje === 72 && r.objetivos.metas && !r.objetivos.retro);
t("evalúa SBI, GROW y reformula", r.sbi && r.sbi.situacion && !r.sbi.conducta && r.grow.voluntad && r.reformula.mejor);
deps.fetch = reply('{"tipo":"conversa","opcion":null,"confianza":0,"respuesta":"Ajá.","mentor":""}'); r = await (await fn(req(body))).json();
t("cachea el prompt y pide JSON con esquema y esfuerzo bajo", reply.sent.system[0].cache_control && reply.sent.output_config.format.type === "json_schema" && reply.sent.output_config.effort === "low");
{ let n = 0; deps.fetch = async (u, o) => { n++; const b = JSON.parse(o.body); if (b.output_config && b.output_config.format) return new Response(JSON.stringify({ error: { message: "schema" } }), { status: 400 }); return new Response(JSON.stringify({ content: [{ type: "text", text: '{"tipo":"conversa","opcion":null,"respuesta":"Ok."}' }] }), { status: 200 }); };
  r = await (await fn(req(body))).json(); t("si el esquema es rechazado, reintenta sin él", r.ok && n === 2); }
r = await (await fn(new Request("http://x", { method: "GET" }))).json(); t("solo POST", r.ok === false);
console.log(`Dojo IA: ${ok}/${ok + bad} pruebas correctas`); process.exit(bad ? 1 : 0);
