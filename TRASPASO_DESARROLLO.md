# Traspaso de desarrollo · Simulador de Operaciones · Dojo Virtual (DICKA Logistics)
Fecha: 18-sep-2026 · Versión consola v2.4 · Para continuar el desarrollo en otra conversación: subir este archivo + DOJO_Virtual_Netlify.zip

## 1. Qué es
Plataforma web de capacitación operativa (sin instalación) con 7 simuladores y un dashboard. Marca: Escuela Operativa · Dojo DICKA.
Entregables: `DOJO_Virtual_Netlify.zip` (proyecto para publicar en Netlify con base compartida) y `DOJO_Virtual.html` (todo en uno, para enviar o subir a tiiny.host).

## 2. Estructura del ZIP
- `index.html` — consola: portada (Poppins, foto de almacén, pilares, botones Elegir simulador / Dashboard / Administrar), catálogo oculto hasta pulsar Elegir simulador, dashboard infográfico numerado (01-14), ranking, ficha por colaborador, respaldo/importación, modo TV, migración de restauración (lote restore-2026-09-07-b1).
- `juegos/` — simulador-montacarga.html (principal), turno-seguro-3d.html (plataformas), turno-seguro.html, examen-seguridad.html, surtido-express.html, conteo-ciclico.html, carga-unidades.html.
- `netlify/functions/results.mjs` + `netlify.toml` + `package.json` — base compartida (Netlify Blobs). Publicar vía Git o Netlify CLI (Drop no compila funciones).
- `respaldos/`, `LEEME.txt`, `PROCEDIMIENTO_RESPALDO_Y_RESTAURACION.md`.
- Motor 3D: Three.js r128 incrustado (funciona sin internet). Todo el 3D es procedural (sin modelos externos). Logos: DICKA oficial (PNG), PepsiCo/PISA/Perfetti/Whirlpool/Raymond recreados tipográficamente.

## 3. Simulador de montacarga: estado
- Registro: nombre, apellidos, No. empleado, puesto, almacén. Flota Raymond: 7500 Reach, 7700 Double Deep, 4750 Contrabalanceo, 4250-CC Carton Clamp, 5600 Orderpicker, 8250 Patín.
- Actividades (7): inspección pre-operativa (checklist por equipo, Cumple/No cumple/N/A, bloqueo hasta liberación de instructor PIN 2026), traslado piso→staging, estiba en ubicación exacta, retiro de ubicación exacta, cruce peatonal (peatón con prioridad), carga en caja de tráiler (Andén 3, claxon obligatorio, máx 5 km/h), estacionamiento.
- Racks: 8 racks doble profundidad, 6 niveles, 14 módulos; nomenclatura ALMACÉN-P-R-M-N-A/B (A externa, B interna solo doble reach). Placas por bahía y nivel. Pasillos con nombre (P0-P4). Pendones DICKA/PepsiCo/PISA/Perfetti.
- Física: gobernador 10 km/h ambos sentidos (SIM_CFG.limitFwd/limitRev), inercia, cabeceo/balanceo, caída de carga por CG, inserción real de horquillas, 15 cm para trasladar, distancia a rack 0.35 m, tarima como obstáculo real, tráiler.
- Tráfico: 3 montacargas NPC (10 km/h) y 3 peatones con rostro y uniforme DICKA; esperan 5 s tras el paso; prohibido compartir pasillo; claxon con respuesta; anti-bloqueo.
- Cámaras (manual): Horquillas, Reversa, Arriba. Sensación de impacto (sacudida, destello, sonido). Sonidos sintetizados (claxon, motor, reversa, hidráulico, impacto).
- Controles: táctil (joystick + botones), teclado, Logitech Extreme 3D Pro (curva progresiva), volante G920 solo dirección (botón Y = cámara), palanca de presión del clamp (gobernada/ajustable con PIN).
- Clamp: bahías de estiba en piso (6 × 2 columnas × 3 niveles, BAH-xx-Cx-Nx), refrigeradores Whirlpool en pilas de 2 tomados como una sola estiba, presión provisional 65 (rango 50-80).
- Faltas críticas (no aprueban): colisión, atropello, volcadura, operar con falla de inspección, caída de carga. Aprobación ≥ 80.

## 4. Datos
- Resultados en localStorage (dicka_console_results, dicka_evaluaciones, dicka_practicas) y sincronizados a Netlify Blobs cuando hay función. Dedupe: Fecha+No.empleado+Curso+Score. Registro #23424 marcado prueba (excluido del ranking).
- Respaldo/importación JSON/CSV en el dashboard.

## 5. Pendientes de validación por DICKA (no inventar)
- Checklists reales por equipo (los actuales son propuestos). Nomenclatura real de ubicaciones (no llegó ejemplo). Presión/unidades del carton clamp (Jesús Lugo). Logos oficiales PepsiCo, PISA, Perfetti, Whirlpool, Raymond (subir PNG para sustituir). Nombres reales de pasillos.

## 6. Siguientes bloques sugeridos
- Modelos glTF y audio 3D posicional. Panel de instructor para límites/faltas/pesos sin código. Reportes por competencia y certificado PDF. Evaluación en 3 pantallas.

## 7. Realismo de avatares (18-sep-2026, según ESPECIFICACION-REALISMO-AVATARES)
Aplicado: renderer PCFSoft + ACES 0.82 + pixelRatio 1.5; iluminación de tres puntos (hemisférica 0.42, ambiental 0.04, sol 0.95 con sombra 2048/bias −0.0002/radius 2, fill 0.20, rim 0.16); IBL procedural con PMREMGenerator; materiales PBR por superficie; esferas de articulación (cadera, rodilla, hombro, codo); receiveShadow en todo; Nivel B completo (texturas procedurales weave/twill/mesh/leather con normal y rugosidad y caché TEXCACHE, torso torneado LatheGeometry, sombra de contacto AOTEX, ciclo de marcha con contrarrotación, cabeza estable, talón-punta y transferencia lateral).
No aplicado (decisión pendiente de DICKA): Nivel C personaje glTF riggeado (rompe el archivo único o lo lleva a >30 MB). physicallyCorrectLights se mantiene en false a propósito.
Verificación automática: renderer.shadowMap.type PCFSoft · physicallyCorrectLights false · scene.environment activo · NPC.peds 3 · NPC.forks 3.
