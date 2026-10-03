# Traspaso a Claude Code · Simulador de Operaciones · Dojo Virtual (DICKA Logistics)
Fecha: 3-oct-2026 · Consola v2.5 · Para continuar en Claude Code: clonar el repo `Gerardodicka/simulador-montacargas` (o descomprimir `DOJO_Virtual_Netlify.zip`) y leer este archivo primero. Complementa a `TRASPASO_DESARROLLO.md` (historia hasta el 18-sep) y `LEEME.txt` (manual de uso).

## 1. Estado actual (qué funciona)
Plataforma web sin instalación: consola (`index.html`) + 7 cursos en `juegos/` + función Netlify de resultados. Motor 3D Three.js r128 incrustado.
- **Simulador de Montacarga** (`juegos/simulador-montacarga.html`, ~8,900 líneas, un solo archivo): flota Raymond (reach, doble reach, contrabalanceo, orderpicker, carton clamp, patín), 7 actividades evaluadas, racks doble profundidad, tráfico NPC con rutas dinámicas, peatones con prioridad, tráiler, validación de joystick/volante al inicio, cámaras Horquillas/Reversa/Arriba/**Operador (1ª persona)**, HUD compacto (pastilla arriba a la derecha), modo 3 pantallas (Surround / multiventana), **Cabina VR** (laptop + celular por WebRTC/PeerJS), **VR Meta Quest 3S** (WebXR) y **VR celular** (estéreo + giroscopio, con/sin visor), ajuste de **Calidad gráfica** Auto/Alta/Media/Baja, avatar realista glTF (ver §3).
- **CLAMP SAFE** (`juegos/turno-seguro-3d.html`): simulador Whirlpool × DICKA de actos y condiciones inseguras: 6 escenas 3D con hotspots tocables + decisión de 4 opciones, 100 pts, niveles, fortalezas/refuerzo por competencia; reemplazó al antiguo "Turno Seguro 3D" en el catálogo (id `turno-seguro-3d`). Está construido sobre una copia del simulador de montacarga (`CS.on = true`) → **cualquier arreglo del motor hay que portarlo a ambos archivos**.
- Línea blanca v2 (clamp): 14 bahías de ESPACIO DOBLE × 6 niveles por categoría (REF 4, LAV 3, SEC 3, EST 2, LVJ 2), paso 3.4 m, nomenclatura `BAH-<CAT>-<nn>-N<nivel>`, el clamp toma 2 piezas por traslado; staging con una pareja por categoría; estibar en bahía de otra categoría = falta.
- Datos: localStorage (`dicka_console_results`, `dicka_evaluaciones`, `dicka_practicas`) + Netlify Blobs vía `netlify/functions/results.mjs`. Dashboard con respaldo/importación JSON/CSV.

## 2. Decisiones tomadas (y por qué)
- **Un solo archivo HTML por simulador**, Three.js r128 y loaders (GLTFLoader, SkeletonUtils, BufferGeometryUtils, StereoEffect, DeviceOrientationControls) incrustados → funciona sin internet y se incrusta en la consola todo-en-uno por base64.
- **Rendimiento**: fusión de mallas estáticas por material (`mergeStaticMeshes`, `mergeSceneStatics`), LOD de avatares procedurales (3 niveles, un solo avatar denso), sombras cada 2 cuadros, far plane 150 m con niebla, pixelRatio según preset. Draw calls ~300–360/cuadro.
- **Avatares**: procedural v5 como respaldo; **modelo realista** `juegos/assets/models/operario.glb` (5.5 MB, 45k tris, rig Mixamo de 65 huesos, textura 2K JPEG) + `operario_lod.glb` (1.9 MB, 19k tris). Solo trae el clip "Take 001" = pose de conducción (se usa como `sit`). La marcha y la pose de pie se generan **proceduralmente sobre los huesos** (`gltfWalkPose`, `gltfStandPose`, `setBoneWorld` con calibración automática de signos `gltfCalibrate`). El operador del jugador se reconstruye al terminar la carga del GLB (`buildPlayerOperator`).
- **Controles de cabina**: joystick + barra anclados a las manos del avatar (`buildCabinJoystick`, `snapControlsToHands`, `supportControls`).
- **Tráfico**: huella hasta la punta de horquillas (`inForkBox`), NPC ceden/retroceden/cambian de pasillo, peatones se apartan a los 5 s; cero encimados en pruebas de 5 min.
- **PIN de instructor**: 2026 (liberar checklist, modo de presión del clamp, administración).
- **Seguridad del sitio**: se recomendó hacerlo público en Netlify + "puerta de acceso" propia con código DICKA (no implementada aún).
- **Supabase**: aprobado conceptualmente para historial por colaborador (esquema en §4); pendiente de URL y clave `anon`.

## 3. Cambios en curso (abiertos al cortar la sesión)
1. **Despliegue** (resuelto 3-oct-2026): el contenido del ZIP vive en la raíz del repo `Gerardodicka/simulador-montacargas` (rama `main`), Netlify `simuladordickalogistics` publica desde ahí. `netlify.toml` bloquea `/respaldos/*` con 404. Pendiente: poner el repo privado.
2. **Rendimiento en laptop con gráficos integrados**: aún se percibe lento. Último paso: presets de calidad (Auto detecta Intel → Media). Siguiente escalón sugerido: modelo ligero también para peatones cercanos en "Media", o `detail: 2.2` para avatares procedurales; medir con `renderer.info` en el equipo real.
3. **Modelo realista**: faltan clips Walk/Idle/Wave con nombre (el usuario los puede exportar desde Maya/Unity); al llegar, `loadOperarioModel` los detecta por nombre y sustituye la marcha procedural. Chaleco sigue naranja (DICKA es #1769AA).
4. **CLAMP SAFE**: el documento de reglas prevé una versión de **10 escenarios** con imagen por escena; hoy hay 6. Cada escena es un objeto en `CS_SCENES` (setup / hotspots / q / q2).
5. **Supabase**: crear proyecto y conectar (§4).

## 4. Pendientes (backlog priorizado)
1. ~~Arreglar despliegue (§3.1)~~ resuelto; verificar el sitio publicado.
2. ~~Puerta de acceso~~ implementada (`netlify/edge-functions/puerta.js`, ver LEEME). Pendiente: resolución adaptativa también en CLAMP SAFE (no tiene sistema QUALITY).
3. Supabase: tablas `colaboradores, cursos, sesiones, actividades, faltas, competencias`, RLS (insert público / select admin), migración del JSON de Netlify Blobs + CSV, dashboard leyendo de Supabase, cola sin conexión.
4. Validación por DICKA (no inventar): checklists reales por equipo, nomenclatura real de ubicaciones, presión/unidades del clamp (provisional 65, rango 50–80), logos oficiales PNG de clientes, nombres reales de pasillos y categorías.
5. Modelos definitivos: GLB de los montacargas (nodos `Mast, Carriage, Fork_L/R, ClampPad_L/R, Wheel_*, SteeringWheel, Seat, OperatorAnchor, Beacon`) — el kit Unity `DICKA_Unity_Kit.zip` documenta la convención.
6. Nuevo almacén del plano 8,000 m² (80×100 m, 9 calles, 18 racks): está implementado en una **previsualización aprobada visualmente** pero no en producción (archivo `preview.html` de la sesión; habría que rehacer sobre el simulador actual con la constante `PLAN`).
7. Panel de instructor para límites/faltas sin código; reportes por competencia y certificado PDF.

## 5. Archivos involucrados
```
index.html                         consola (catálogo, dashboard, administración, modo TV, respaldo)
juegos/simulador-montacarga.html   simulador principal (motor + avatares + tráfico + VR + 3 pantallas + calidad)
juegos/turno-seguro-3d.html        CLAMP SAFE (copia del motor + bloque CS_* al inicio de la lógica)
juegos/turno-seguro.html           versión rápida de tarjetas (20 situaciones)
juegos/examen-seguridad.html · surtido-express.html · conteo-ciclico.html · carga-unidades.html
juegos/diagnostico-usb.html        validación de joystick/volante (también incrustada en el simulador)
juegos/js/GLTFLoader.js · SkeletonUtils.js   (copias sueltas; también van incrustadas)
juegos/assets/models/operario.glb · operario_lod.glb · LEEME.txt
netlify/functions/results.mjs · netlify.toml · package.json
LEEME.txt · PROCEDIMIENTO_RESPALDO_Y_RESTAURACION.md · TRASPASO_DESARROLLO.md · FILOSOFIA_DISENO_AVATAR.md
lamina_avatar_dicka.png · lamina_02_ojos_piernas.png   láminas de diseño del avatar
```
Fuera del repo (entregados en el chat): `DOJO_Virtual.html` (todo-en-uno), `DICKA_Unity_Kit.zip` (proyecto Unity con scripts C# por elemento), `avatar_dicka_ligero.zip` (módulo JS del avatar procedural), `operario_optimizado.glb`.

## 6. Mapa rápido del código del simulador (buscar por estas cadenas)
- `const FORK_SPECS` fichas de equipos · `spec()` equipo actual · `createForklift` / `buildPlayerOperator` / `buildCabinJoystick`
- `WG_CATS`, `WG_BLOCKS`, `buildBays`, `placeBayPair`, `setActBay` línea blanca · `grabLoad` / `releaseLoad` / `clampRelease`
- `npcPed`, `npcForklift`, `updateTraffic`, `buildAisleRoute`, `assignNewRoute`, `assignPedRoute`, `inForkBox`, `pushOutOfFork`
- `buildHuman` / `buildBody` (avatar procedural v5) · `loadOperarioModel`, `makeGLTFAvatar`, `gltfWalkPose`, `gltfStandPose`, `setBoneWorld`, `gltfCalibrate`, `snapControlsToHands`
- `CAMS`, `updateCamera` (modos forks/rear/bird/first; cuidado con la cadena `else if (!target)`)
- `showCtrlCheck` validación de controles · `openGpPanel` · `GP_MAP` · `WHEEL`
- `SCREENS`, `renderScreens`, `broadcastState`, `applyState`, `HYB` (cabina híbrida) · `XR` (Quest) · `MVR` (VR celular) · `QUALITY`
- `CS_SCENES`, `csPick`, `csQuestion`, `csScore`, `csFinish` (solo en turno-seguro-3d.html)
- `finishPractice` guarda resultados; `dicka_console_results` es la clave que lee el dashboard.

## 7. Cómo probar (sin Netlify)
- Abrir `index.html` directamente en Chrome/Edge (no dentro de visores/iframes: WebGL se bloquea y el canvas queda negro).
- Regresión usada en el desarrollo: Playwright headless con `three.min.js` local; flujos: registro → equipo → `ctrlCheckDone()` → `updateTraffic` 5 min → sin encimados; CLAMP SAFE → 3 hotspots → decisión → resultado guardado.
- VR y cabina híbrida requieren https (Netlify) y, en el caso de PeerJS, internet en ambos dispositivos.

## 8. Convenciones
- Español en UI, código y comentarios; paleta `#1D2586 #2138D3 #011131 #f5c400 #c8102e #1769AA #F2D21B`.
- Antes de modificar: hacer previsualización en imagen, luego aplicar, luego regresión y regenerar `DOJO_Virtual.html` y el ZIP (script de empaquetado: incrusta cada juego en base64 dentro de la consola).
