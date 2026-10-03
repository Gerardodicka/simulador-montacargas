// Puerta de acceso del Dojo Virtual: todo el sitio (consola, juegos, modelos, función de resultados) exige el código DICKA.
// El código vive en Netlify Blobs (store "dicka-play", clave "access-code"); si no existe se usa la variable de entorno
// DICKA_ACCESS_CODE o, en último caso, "DICKA2026". La cookie guarda un hash del código vigente: al cambiarlo, todos vuelven a ingresar.
// POST /acceso          (formulario: codigo, ir)          → valida y deja la cookie por 30 días
// POST /acceso/cambiar  (JSON: { pin, nuevo })            → cambia el código (PIN de administrador: DICKA_ADMIN_PIN o "2026")
import { getStore } from "@netlify/blobs";

const COOKIE = "dicka_acceso", MAX_AGE = 60 * 60 * 24 * 30;
let cache = { code: null, at: 0 };

async function currentCode() {
  if (cache.code && Date.now() - cache.at < 60000) return cache.code;
  let code = null;
  try { code = await getStore("dicka-play").get("access-code"); } catch (e) {}
  cache = { code: (code || Netlify.env.get("DICKA_ACCESS_CODE") || "DICKA2026").trim(), at: Date.now() };
  return cache.code;
}
async function token(code) {
  const d = await crypto.subtle.digest("SHA-256", new TextEncoder().encode("dicka-dojo|" + code.toUpperCase()));
  return [...new Uint8Array(d)].map(b => b.toString(16).padStart(2, "0")).join("");
}
const getCookie = (req, n) => (req.headers.get("cookie") || "").split(/;\s*/).map(c => c.split("=")).find(([k]) => k === n)?.[1];
const safePath = p => (typeof p === "string" && p.startsWith("/") && !p.startsWith("//")) ? p : "/";
const esc = s => String(s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

const page = (ir, error) => new Response(`<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex">
<title>Dojo Virtual · Acceso</title><style>
body{margin:0;min-height:100vh;display:grid;place-items:center;background:#011131;font-family:Poppins,system-ui,sans-serif;color:#fff;padding:16px;box-sizing:border-box}
form{background:#1D2586;border-radius:16px;padding:28px 24px;width:100%;max-width:340px;box-shadow:0 10px 40px #0008;text-align:center}
h1{font-size:20px;margin:0 0 4px}p{margin:0 0 18px;color:#c9d2ff;font-size:14px}
input{width:100%;box-sizing:border-box;padding:12px;border-radius:10px;border:2px solid #2138D3;font-size:18px;text-align:center;letter-spacing:2px;text-transform:uppercase}
button{margin-top:14px;width:100%;padding:12px;border:0;border-radius:10px;background:#f5c400;color:#011131;font-weight:700;font-size:16px;cursor:pointer}
.err{color:#ffb3b3;margin-top:12px;font-size:14px}</style></head><body>
<form method="post" action="/acceso"><h1>Dojo Virtual · DICKA</h1><p>Escribe el código de acceso</p>
<input name="codigo" autocomplete="off" autofocus required><input type="hidden" name="ir" value="${esc(ir)}">
<button>Entrar</button>${error ? '<div class="err">Código incorrecto</div>' : ""}</form></body></html>`,
  { status: error ? 401 : 200, headers: { "content-type": "text/html; charset=utf-8", "cache-control": "no-store" } });

export default async (req, context) => {
  const url = new URL(req.url);
  const code = await currentCode(), tk = await token(code);

  if (url.pathname === "/acceso" && req.method === "POST") {
    const f = await req.formData(); const ir = safePath(f.get("ir"));
    if (String(f.get("codigo") || "").trim().toUpperCase() !== code.toUpperCase()) return page(ir, true);
    return new Response(null, { status: 303, headers: { location: ir, "set-cookie": `${COOKIE}=${tk}; Path=/; Max-Age=${MAX_AGE}; HttpOnly; Secure; SameSite=Lax` } });
  }
  if (url.pathname === "/acceso/cambiar" && req.method === "POST") {
    const json = (st, b) => new Response(JSON.stringify(b), { status: st, headers: { "content-type": "application/json" } });
    if (getCookie(req, COOKIE) !== tk) return json(401, { ok: false, error: "sin acceso" });
    let b; try { b = await req.json(); } catch { return json(400, { ok: false, error: "JSON inválido" }); }
    if (String(b.pin || "") !== (Netlify.env.get("DICKA_ADMIN_PIN") || "2026")) return json(403, { ok: false, error: "PIN incorrecto" });
    const nuevo = String(b.nuevo || "").trim().toUpperCase();
    if (!/^[A-Z0-9-]{4,20}$/.test(nuevo)) return json(400, { ok: false, error: "El código debe tener 4 a 20 letras o números" });
    await getStore("dicka-play").set("access-code", nuevo); cache = { code: nuevo, at: Date.now() };
    return new Response(JSON.stringify({ ok: true }), { status: 200, headers: { "content-type": "application/json",
      "set-cookie": `${COOKIE}=${await token(nuevo)}; Path=/; Max-Age=${MAX_AGE}; HttpOnly; Secure; SameSite=Lax` } });
  }
  if (getCookie(req, COOKIE) === tk) return context.next();
  if (url.pathname.startsWith("/.netlify/functions/")) return new Response(JSON.stringify({ ok: false, error: "sin acceso" }), { status: 401, headers: { "content-type": "application/json" } });
  return page(url.pathname + url.search, false);
};

export const config = { path: "/*" };
