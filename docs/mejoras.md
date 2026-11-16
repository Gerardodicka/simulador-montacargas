# Bitácora de mejoras · DICKA Play

Una mejora cada 2 horas, tomada de lo que ofrecen simuladores del mercado (Mursion, Yoodli, FLIGBY, Attensi, Speaksage, simuladores de montacargas y de almacén). Cada mejora se entrega en un PR para revisión; se publica con "haz merge".

Estado: ⬜ pendiente · 🔨 en curso · ✅ en PR · 🚀 publicada

## Hechas antes de la bitácora

| Fecha | Simulador | Tipo | Mejora | Inspirada en | Estado |
|---|---|---|---|---|---|
| 2026-11-07 | Dojo de Mando | Funcionalidad | Plática de voz con IA, presión adaptativa, objetivos de liderazgo | Mursion, Yoodli | 🚀 |
| 2026-11-08 | Dojo de Mando | Nuevo contenido | Situaciones críticas por nivel (Supervisor, Jefatura, Gerencia, HRBP) | Attensi | 🚀 |
| 2026-11-08 | Dojo de Mando | Funcionalidad | Pruebas psicométricas Evaluatest y plan de capacitación | — | 🚀 |
| 2026-11-08 | Dojo de Mando | Usabilidad | "Cómo hablaste", SBI/GROW, reformula tu frase | Yoodli, Spoke | 🚀 |
| 2026-11-09 | Dojo de Mando | Usabilidad | Primera persona 3D, oficina detallada, avatares de oficina, gestos y boca | Mursion | 🚀 |
| 2026-11-09 | Dojo de Mando | Medición | Exportación CSV/JSON, línea base, guía para líderes, reporte del grupo | Replay, Outdoo | 🚀 |
| 2026-11-09 | Dojo de Mando | Funcionalidad | Ver cómo lo manejaría, evaluación con evidencia, número de empleado, Mi avance | Rehearsal, ELB | 🚀 |

## Cola (una por ciclo, en este orden)

| # | Simulador | Tipo | Mejora | Inspirada en | Estado |
|---|---|---|---|---|---|
| 1 | Dojo de Mando | Usabilidad | Gestos naturales también en operadores y sindicato | Mursion | ✅ |
| 2 | Dojo de Mando | Nuevo contenido | 5 casos de logística: auditoría del cliente, cambio de WMS, operador nuevo sin capacitar, robo hormiga reportado, chofer agresivo en andén | Attensi | ✅ |
| 3 | Dojo de Mando | Funcionalidad | "Repite lo que fallaste": reintento enfocado en el criterio más bajo con pista previa | FLIGBY | ✅ |
| 4 | Dojo de Mando | Usabilidad | Práctica rápida de 5 minutos en celular | Yoodli | ✅ |
| 5 | Montacargas | Medición | Métricas de seguridad: choques, velocidad en curva, carga caída, claxon, con reporte | Simuladores de montacargas comerciales | ✅ |
| 6 | Montacargas | Funcionalidad | Inyección de fallas: frenos con retardo, deriva de dirección, alarma | Simuladores de montacargas comerciales | ✅ |
| 7 | Nuevo simulador | Nuevo simulador | Recepción y decantado: verificar SKU, cantidades y daños antes de ubicar | Simuladores de procesos de almacén | ✅ |
| 8 | Nuevo simulador | Nuevo simulador | Carga de tráiler: acomodo por peso y secuencia de entrega | Simuladores de carga | ➖ ya cubierto por "Carga de Unidades" |
| 9 | Nuevo simulador | Nuevo simulador | Patio y andenes: asignar citas y andenes, evitar colas | Simuladores de yard management | ✅ |
| 10 | Dojo de Mando | Funcionalidad | Editor de situaciones (formulario → JSON) para RH/Operaciones | — | ⬜ |
| 11 | Todos | Usabilidad | Guía para el líder y plan en PDF real | — | ⬜ |
| 12 | Todos | Usabilidad | Modo accesible: texto grande, alto contraste, subtítulos | Attensi | ⬜ |

Pendientes que requieren decisión del usuario (no se hacen solos): tablero central con consentimiento (F3-01), voz de pago (F3-03), facilitador humano (F3-04), calibración con evaluadores de RH (F2-07).

## Proceso de testeo (obligatorio en cada mejora)

Una mejora no se marca ✅ ni se sube al PR si falla cualquier paso.

1. **Pruebas existentes:** `node pruebas/dojo-ia.test.mjs` y `node pruebas/validar.js` al 100 %.
2. **Prueba nueva:** cada mejora agrega al menos una prueba automática que verifica su funcionalidad.
3. **Regresión:** flujo completo (registro → situación → plática → resultado → descarga) sin errores.
4. **Consola limpia:** cero errores de JavaScript en el navegador.
5. **Visual:** capturas con Playwright en computadora (1280 px) y celular (390 px), revisadas.
6. **Privacidad:** ningún dato personal se envía a servidores ni se sube al repositorio.
7. **Registro:** el resultado de las pruebas se anota en la bitácora (columna Pruebas).

## Bitácora de ciclos

| Fecha y hora | # | Mejora | Pruebas | PR | Estado |
|---|---|---|---|---|---|
| 2026-11-15 20:39 UTC | 1 | Gestos naturales en operadores y sindicato (v18.6) | 17/17 IA · validar.js 100 % (+2 nuevas) · regresión OK · consola limpia · 1280/390 px revisadas · privacidad OK | #116 | ✅ |
| 2026-11-15 22:39 UTC | 2 | 5 casos de logística: chofer agresivo, operador nuevo sin DC-3, robo hormiga (Supervisor); cambio de WMS (Jefatura); auditoría del cliente (Gerencia) (v18.7) | 17/17 IA · validar.js 99/99 (+2 nuevas) · regresión OK · consola limpia · 1280/390 px revisadas · privacidad OK | #117 | ✅ |
| 2026-11-16 00:39 UTC | 3 | Repite lo que fallaste: reintento en el criterio más bajo con pista y comparación antes/después (v18.8) | 17/17 IA · validar.js 101/101 (+2 nuevas) · regresión OK · consola limpia · 1280/390 px revisadas · privacidad OK (solo sessionStorage) | #118 | ✅ |
| 2026-11-16 02:39 UTC | 4 | Práctica rápida de 5 minutos: situación al azar (prioriza no practicadas), cronómetro y cierre automático (v18.9) | 17/17 IA · validar.js 103/103 (+2 nuevas; pruebas del Dojo aisladas en contexto limpio para evitar falsos negativos) · consola limpia · 1280/390 px revisadas · privacidad OK | #119 | ✅ |
| 2026-11-16 04:39 UTC | 5 | Montacargas: tablero de métricas de seguridad en el resumen (índice, choques, velocidad y curvas, carga, claxon y peatones, usos de claxon, vel. máx. y en curva; se guarda en el historial) (v19.0) | 17/17 IA · validar.js 104/104 (+1 nueva) · consola limpia · 1280/390 px revisadas · privacidad OK (solo localStorage) | #120 | ✅ |
| 2026-11-16 06:40 UTC | 6 | Montacargas: inyección de fallas (frenos con retardo, deriva de dirección, alarma) en niveles intermedio y certificación; detener y reportar en ≤12 s o falta de 15 pts (v19.1) | 17/17 IA · validar.js 105/105 (+1 nueva) · consola limpia · 1280/390 px revisadas · privacidad OK | #121 | ✅ |
| 2026-11-16 08:39 UTC | 7 | Nuevo simulador Recepción y Decantado: 8 tarimas contra ASN (SKU, cantidad, caducidad, daño), recibir/diferencia/rechazar con motivo y ubicación seco/frío; en el catálogo (v19.2) | 17/17 IA · validar.js 111/111 (+3 nuevas y carga en escritorio/celular) · consola limpia · 1280/390 px revisadas · privacidad OK (mismo esquema de resultados que los demás cursos) | #121 | ✅ |
| 2026-11-16 10:40 UTC | 8 | Carga de tráiler: no se duplica, ya existe "Carga de Unidades" (secuencia de ruta, balance, peso) | — | — | ➖ |
| 2026-11-16 10:40 UTC | 9 | Nuevo simulador Patio y Andenes: 12 unidades en turno de 4 h, 6 andenes (2 refrigerados), prioridad por cita, cadena de frío y colas; en el catálogo (v19.3) | 17/17 IA · validar.js 118/118 (+4 nuevas y carga en escritorio/celular) · consola limpia · 1280/390 px revisadas · privacidad OK | #121 | ✅ |
