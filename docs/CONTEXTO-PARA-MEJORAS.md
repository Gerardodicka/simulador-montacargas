# DICKA Play · Contexto completo para proponer mejoras

> **Para quien lea esto (persona o IA):** este documento describe a detalle la plataforma de simuladores de capacitación de **DICKA Logistics**. Úsalo como contexto para proponer mejoras concretas. Al final hay una sección **"Qué te pido"** con el formato de respuesta esperado.
>
> Versión documentada: **v23.3** (noviembre 2026) · Sitio: `simuladordickalogistics.netlify.app` · Repositorio: `Gerardodicka/simulador-montacargas`.

---

## 1. Qué es

**DICKA Play** es un portal web de **simuladores de capacitación para personal de almacenes y centros de distribución (CEDIS)** de un operador logístico (3PL) en México. Sirve para entrenar y evaluar:

- **Personal operativo:** montacarguistas, auxiliares de almacén, surtidores, recibidores, embarcadores, estibadores.
- **Mandos medios:** supervisores y jefes de turno.
- **Gerencia:** gerentes de operaciones (liderazgo y toma de decisiones).

Cada simulador termina con **puntaje, aprobado/no aprobado, código de verificación** y opción de **enviar el resultado por WhatsApp** a Capacitación. Los resultados se juntan en un **Dashboard de Capacitación** para RH.

### Almacenes (CEDIS) que usan la plataforma
Agave 1, Agave 3, Mezquite 1, Mezquite 2, BIC, Celaya, Toluca, Escobedo.

### Dónde se usa
- **PC de capacitación** con Edge/Chrome, a veces instalada como **app (PWA)** en Windows.
- **Celulares** (Android/iPhone) de los colaboradores, a veces con poca señal.
- **TV en modo kiosco** (Dashboard en "Modo TV").
- Algunos equipos con **volante/joystick USB** para el simulador de montacargas.

---

## 2. Tecnología

| Pieza | Detalle |
|---|---|
| Frontend | HTML + CSS + JavaScript **sin framework**. **Cada juego es un solo archivo HTML** autocontenido en `juegos/`. |
| 3D | **Three.js r128** (`juegos/js/three.min.js`), `GLTFLoader`, `SkeletonUtils`. |
| Avatares | Modelos **GLB** (Mixamo/Rocketbox) en `juegos/assets/models/`: `operario.glb`, `operario_lod.glb`, `operario2/3.glb`, `operaria*.glb`, `oficina_hombre/mujer.glb`. Pose procedural, casco, chaleco DICKA y guantes en `juegos/js/dicka-avatar.js`. |
| Texturas | `juegos/assets/textures/`: `piso.jpg`, `piso_rough.jpg`, `lamina.jpg`, `carton.jpg`, `madera.jpg`, `piel.jpg`. |
| Voz | `speechSynthesis` (el personaje habla) y `webkitSpeechRecognition` (el usuario habla) en el Dojo. |
| IA | Netlify Function `netlify/functions/dojo-ia.mjs` → API de Claude (motor de conversación del Dojo de Mando). La clave vive solo en Netlify (`ANTHROPIC_API_KEY`). |
| Base compartida | Netlify Function `netlify/functions/results.mjs` + **Netlify Blobs** (un registro por resultado, sin duplicados). |
| Almacenamiento local | `localStorage` del navegador (resultados, perfil del empleado, rutas por puesto). |
| Hosting | **Netlify** (publica desde `main`; el build corre pruebas de BD y del Dojo IA antes de desplegar). |
| Offline | Lista de páginas para "Usar sin conexión". |

### Estructura de carpetas
```
index.html                    ← Portal: catálogo, identificación, Dashboard de Capacitación
juegos/*.html                 ← 34 páginas (31 juegos + 3 herramientas)
juegos/js/                    ← three.min.js, GLTFLoader, SkeletonUtils, dicka-avatar.js,
                                dicka-sync.js, accesible.js, inicio.js, perfil.js, escena3d.js
juegos/comun/                 ← almacen-comun.js (motor del montacargas), avatares.js,
                                escenarios-dojo.js, oficina-dojo.js, psicometria.js, three-libs.js
juegos/assets/                ← equipos (fotos de montacargas), models (GLB), textures
netlify/functions/            ← dojo-ia.mjs, results.mjs
pruebas/                      ← validar.js (283 pruebas Playwright), dojo-ia.test.mjs (17), db.test.mjs
docs/mejoras.md               ← Cola de mejoras + bitácora con resultado de pruebas
```

---

## 3. Flujo del usuario

1. **Entra al portal** → ventana **"👤 ¿Quién eres?"** (una sola vez): nombre, apellidos, número de empleado, puesto y almacén. Se guarda en el equipo (`dicka_perfil`).
2. **Catálogo ordenado por su puesto:** primero los simuladores de su **ruta** (etiqueta "TU RUTA · n" o "✓ APROBADO"), luego "Otros simuladores". Selector para ver la ruta de otro puesto.
3. **Abre un juego:** ya **no le vuelve a pedir datos** (entra directo; arriba a la derecha "👤 nombre · No soy yo").
4. **Juega** → resultado con puntaje, aprobado, código `REG|...|hash`, botón WhatsApp y copiar.
5. El resultado se guarda en `localStorage` (`dicka_console_results`) y se **sincroniza** con la base compartida.
6. Botón fijo **"← Inicio"** en todos los juegos para regresar al portal.

---

## 4. Catálogo de simuladores (32 en el portal)

### 4.1 Montacargas (el simulador estrella)
| Simulador | Tipo | Detalle |
|---|---|---|
| **Simulador de Montacarga** | 3D completo | Evaluación de 20 situaciones + práctica 3D con 7 actividades (inspección pre-operativa, traslado, estiba y retiro en ubicación exacta, paso peatonal, carga en caja de tráiler, estacionamiento). Flota **Raymond**: contrapeso, reach, double reach, patín eléctrico 8250, order picker, clamp. Fallas inyectadas, diagnóstico de nivel, métricas de seguridad, soporte volante/joystick USB. Aprueba 160/200 · 80/100. |
| **CLAMP SAFE · Actos y Condiciones Inseguras** | 3D | 6 escenas con clamp de cartón: identificar riesgos tocando la escena. 70/100. |
| **Turno Seguro (versión rápida)** | Tarjetas | Las mismas 20 situaciones para celular con poca señal. 160/200. |
| **Validación de joystick y volante USB** | Herramienta | Prueba de controles. |

### 4.2 Recorridos 3D (motor común "recorrido")
Escena de almacén navegable (girar, acercar, tocar). **10 puntos marcados**; en cada uno se lee la situación y se elige entre **5 categorías + "está bien"**. Cada respuesta vale 10; aprueban con **75/100**. Tienen: recuadro fijo **🎯 Objetivo / ✅ Qué debes hacer / 📊 Cómo se califica**, guía **"¿Cómo se juega?"**, explicación de cada opción, cámara que se acerca, retroalimentación con **lo correcto, por qué y por qué no tu respuesta**, avatares 3D de operario, texturas, luminarias.

| Simulador | Norma / tema | Las 5 categorías |
|---|---|---|
| 5S en el Almacén | Lean | Seiri, Seiton, Seiso, Seiketsu, Shitsuke |
| Materiales Peligrosos | NOM-018-STPS | Etiquetar SGA, separar incompatibles, contener derrame, Hoja de Datos de Seguridad, EPP |
| Ergonomía | NOM-036-1-STPS | Reducir/compartir carga, corregir técnica, ayuda mecánica, altura/alcance, pausas y rotación |
| Emergencias en el Almacén | NOM-002 / NOM-030 | Alertar, evacuar, combatir conato, primeros auxilios, despejar salidas |
| Bloqueo y Etiquetado (LOTO) | NOM-004-STPS | Desenergizar, candado y etiqueta, energía residual, verificar energía cero, retiro autorizado |
| Trabajo en Alturas | NOM-009-STPS | Arnés y línea de vida, escalera correcta, plataforma/andamio, delimitar área, permiso |
| Señalización y Colores | NOM-026-STPS | Prohibición, obligación, precaución, emergencia, contra incendio |
| Andenes y Rampas | Seguridad en andén | Asegurar tráiler, placa niveladora, revisar caja, semáforo/comunicación, andén y rampa |
| Cargas No Estándar | Montacargas | Cambiar tarima, asegurar carga, verificar capacidad, carga larga/ancha, centro de gravedad alto |
| Excepciones de Surtido | Inventarios | Reabasto, separar dañado, conteo cíclico, verificar SKU/lote, FEFO |
| Flujo de Materiales | Operación | Reasignar personal, priorizar por hora de salida, liberar espacio, reparar equipo, corregir información |
| Cross-Docking | Operación | Directo a su andén, almacenar, consolidar, retener, urgente (con tablero "Salidas de hoy") |
| Slotting ABC | Operación | Zona dorada, alejar baja rotación, afinidad, pesado abajo, separar parecidos |
| Armado de Embarques | Distribución | LIFO por parada, peso por ejes, asegurar carga, verificar vs lista, sellar y documentar |
| Conteo Cíclico ABC | Inventarios | Frecuencia ABC, recontar, investigar causa, congelar ubicación, ajustar con autorización |

### 4.3 Simuladores de proceso (operación)
| Simulador | Estado visual | Qué se hace |
|---|---|---|
| Recepción y Decantado | **3D** (andén con tráiler) | 8 tarimas: escanear con RF (tocando la tarima 3D), comparar contra el ASN, recibir completo / con diferencia / rechazar, decidir zona. 90/120. |
| Patio y Andenes | **3D** (patio con 6 andenes) | Turno de 4 h, 12 unidades: asignar tráileres a andenes (refrigerados, con/sin cita) tocando tráiler y andén. 75/100. |
| Métodos de Surtido | **3D** (6 pasillos) | 4 escenarios para elegir método (pedido, lote, zona, ola) + ruta de un lote de 8 ubicaciones tocadas en 3D, comparada con la ruta óptima. 70/100. |
| Surtido Express | 2D (pendiente 3D) | Picking contra reloj por ubicación Pasillo-Columna-Nivel, 3 pedidos. 160/270. |
| Cadena de Frío | 2D (pendiente 3D) | 8 lotes refrigerados/congelados con gráfica del registrador: liberar, retener o rechazar. 75/100. |
| Inspección de Tráiler y Sellos | 2D (pendiente 3D) | 3 unidades, 17 puntos (OEA/C-TPAT), sello con VVTT, aceptar o detener. 75/100. |
| Devoluciones | 2D (pendiente 3D) | 8 devoluciones con RMA, empaque, estado y caducidad: reintegrar, reacondicionar, proveedor, merma, retener. 75/100. |
| Carga de Unidades | 2D (pendiente 3D) | Carga de caja de tráiler. 150/200. |
| Conteo Cíclico (original) | 2D | Conteo de inventario. 150/212. |

### 4.4 Liderazgo
| Simulador | Detalle |
|---|---|
| **Dojo de Mando** | Simulador de conversaciones difíciles con **avatares 3D que hablan** en escenarios (oficina, sala, andén, comedor). Niveles por puesto (jefatura, gerencia, etc.). Situaciones como: el mejor operador sin cinturón, faltante de inventario, antidoping positivo, tiempo extra, renuncia del mejor elemento, accidente y causa raíz, presupuesto, sucesión, automatización, crisis en andén, regalo de proveedor, conflicto entre áreas, revisión salarial, cultura de seguridad, delegar con cliente, 5 casos logísticos, situaciones personalizadas por RH. El usuario **habla** (micrófono) o escribe; la IA (Claude) interpreta y los personajes responden. Incluye: **prueba de micrófono** previa, aviso de dictado (Windows + H / teclado del celular), práctica rápida de 5 min, repaso espaciado, reintentar lo más débil, "Mi avance", exportar PDF, plan con pruebas psicométricas (los PDF se leen solo en el navegador). 62/100. |
| Planeación de Personal | Programar personal por día contra demanda; costo por caja; óptimo por programación dinámica. (Pendiente: avatar gerente). |
| Tablero del Gerente | 4 meses de temporada: decisiones de personal, tiempo extra, mantenimiento y capacitación con efecto en OTIF, costo, accidentes y rotación. (Pendiente: avatar en oficina 3D). |

### 4.5 Otros
Examen de Conocimientos Básicos de Seguridad (80/100), Uso y Manejo de Extintores 3D (5 escenarios, técnica J-A-A-B, 400/500).

---

## 5. Portal y Dashboard de Capacitación

- **Identificación única** del colaborador y **catálogo por ruta de su puesto**.
- **Mis logros y racha**, **Tabla de líderes**.
- **Dashboard** (pestañas): Resumen (aprobación por curso, evolución por periodo, por almacén/puesto), Ranking, Por colaborador (detalle), Seguridad, **👥 Perfiles**.
- **👥 Perfiles (RH):** rutas de simuladores por puesto (8 sugeridas, editables, agregar puesto, exportar/importar JSON) y **perfil de cada colaborador**: avance de su ruta, pendientes y competencias por categoría (Seguridad, Operaciones, Liderazgo, Calidad…).
- Sincronizar con base compartida, respaldo/restauración, CSV, PDF, Modo TV.
- Accesibilidad: botón "Aa" (texto grande, alto contraste, subtítulos de voz).

---

## 6. Datos y privacidad (reglas que NO se negocian)

- **Nunca** pedir ni pegar la API key en chat; vive solo en Netlify.
- **PDF psicométricos y base de empleados** son datos personales: se leen **solo en el navegador**, nunca se suben al repositorio ni a servidores.
- El perfil del empleado (`dicka_perfil`) y las rutas (`dicka_puestos`) se guardan **solo en el equipo**.
- El audio del micrófono **no sale del navegador** (lo transcribe el propio navegador).
- Los resultados (nombre, número, puesto, almacén, curso, puntaje, fecha) sí se sincronizan con la base compartida de DICKA.

---

## 7. Calidad: proceso de testeo de cada mejora

1. `node pruebas/dojo-ia.test.mjs` y `node pruebas/validar.js` al 100 % (hoy **17/17** y **283/283**).
2. Al menos una **prueba automática nueva** por mejora (Playwright, Chromium con WebGL por software).
3. Regresión del flujo completo (registro → situación → resultado → descarga).
4. **Cero errores de consola**.
5. Capturas a **1280 px y 390 px** revisadas.
6. Verificación de **privacidad**.
7. Resultado anotado en la bitácora (`docs/mejoras.md`).

Ciclo automático: cada 2 horas se toma la siguiente mejora de la cola, se implementa, se prueba y se abre PR; el merge lo autoriza el dueño.

---

## 8. Reglas de diseño acordadas con el dueño

- **Todo simulador debe ser 3D o usar los avatares existentes.**
- Cada juego debe explicar claramente **objetivo, qué hacer y cómo se califica**.
- Las explicaciones deben decir **lo correcto, por qué y por qué no** la respuesta elegida.
- **Un solo registro** de datos del empleado para toda la plataforma.
- Botón de **regreso** siempre visible.
- Letra legible (15–16 px en paneles), funcionar en **celular**.
- Lenguaje en **español de México**, sencillo, de piso de almacén.

---

## 9. Pendientes conocidos (cola actual)

| # | Pendiente |
|---|---|
| C4 | Cadena de Frío en 3D (cámara fría con registrador) |
| C5 | Inspección de Tráiler en 3D (17 puntos tocables) |
| C6 | Devoluciones en 3D |
| C7 | Carga de Unidades en 3D (caja de tráiler) |
| C8 | Surtido Express en 3D (racks para surtir) |
| C9 | Turno Seguro: unificar con la versión 3D |
| C10 | Planeación de Personal con avatar gerente |
| C11 | Tablero del Gerente con avatar en oficina 3D |
| 40 | Nuevo: Kitting y valor agregado |
| 41 | Nuevo: Indicadores del almacén (OTIF, exactitud, productividad) |

### Limitaciones y problemas conocidos
- **Micrófono en la app instalada (PWA) de Windows/iPhone:** el reconocimiento de voz del navegador suele bloquearse; la alternativa es Windows + H o el dictado del teclado.
- Solo se usa el avatar de **operario** en recorridos (el de operaria se veía negro y en pose T).
- Los recorridos 3D son de **opción múltiple**: el usuario observa y elige; aún no **actúa** físicamente en la escena (mover, levantar, colocar).
- Los recorridos comparten código copiado en cada HTML (no hay un módulo único para todos).
- No hay inicio de sesión real: la identidad se basa en datos capturados en el equipo.
- Sin modo multijugador ni competencia en tiempo real.
- Los resultados dependen de sincronizar; si un equipo nunca sincroniza, RH no los ve.
- La suite de pruebas tarda ~15–20 min (cada juego 3D abre su propio navegador).

---

## 10. Qué te pido

Con base en todo lo anterior, propón **mejoras priorizadas** para que DICKA Play sea **más útil, más claro y más atractivo** para el personal de almacén y para RH. Considera:

1. **Aprendizaje real:** ¿cómo hacer que los simuladores enseñen mejor (no solo evaluar)? Ej. práctica guiada, errores comunes, microlecciones, repetición espaciada.
2. **Interacción 3D:** ideas para que el usuario **haga** cosas en la escena (no solo elija opciones) sin volverlo difícil en celular.
3. **Liderazgo (Dojo):** nuevas situaciones, mejores métricas de habilidades, retroalimentación más útil.
4. **RH y Capacitación:** reportes, rutas por puesto, certificaciones, recordatorios, evidencia para auditorías (STPS, DC-3, clientes).
5. **Motivación:** logros, retos por almacén, rankings sanos, recompensas.
6. **Accesibilidad y uso en piso:** celular con poca señal, personas con baja escolaridad, ruido, guantes, voz.
7. **Nuevos simuladores** que falten en un 3PL mexicano.
8. **Calidad técnica:** riesgos, deuda técnica, rendimiento en equipos modestos.

**Formato de respuesta esperado** (una tabla y luego detalle):

| Prioridad | Mejora | Para quién | Problema que resuelve | Cómo se vería | Esfuerzo (S/M/L) |
|---|---|---|---|---|---|

Después, para las **5 mejoras de mayor prioridad**, describe paso a paso cómo funcionaría en pantalla (qué ve y qué hace el usuario) y cómo se mediría su éxito.

**Restricciones:** respeta las reglas de privacidad (sección 6) y de diseño (sección 8); todo debe correr en navegador (sin instalar nada), en celular y en PC; sin servidores nuevos salvo funciones de Netlify.
