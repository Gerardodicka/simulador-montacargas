# Simulador de Operaciones (DOJO Virtual) · Procedimiento de respaldo, exportación y recuperación de resultados

## Dónde viven los datos
La consola es una aplicación web sin servidor: los resultados se guardan en el navegador (localStorage) del
equipo/liga donde se juega, bajo las claves `dicka_console_results`, `dicka_evaluaciones` y `dicka_practicas`.
Cambiar de liga, de archivo o borrar datos del navegador equivale a perder la base. Por eso:

## Respaldo (cada semana o antes de publicar una versión)
1. Consola → 📊 Dashboard → **💾 Respaldar base** → se descarga `respaldo-dicka-play-FECHA.json`.
2. Guarda el archivo en la carpeta autorizada de Capacitación (no lo publiques en la web).
   (Alternativa: **⬇ CSV** genera la exportación tabular para Excel.)

## Restauración
1. Abre la versión nueva → 📊 Dashboard → **⬆ Importar / restaurar** → elige el .json o los .csv.
2. El importador valida fila por fila (fecha, curso, score, porcentaje 0-100, estado permitido);
   si alguna fila es inválida NO inserta nada y muestra el reporte (transaccional).
3. Deduplica con la clave Fecha + No. empleado + Curso + Score: reimportar no crea duplicados.
4. **🗄️ Restauración** muestra el dry run y la conciliación del lote versionado incluido en el código.

## Lote versionado incluido en esta versión
- `restore-2026-09-07-b1` · archivo `resultados-dicka-2026-09-07 (1).csv` (copia en `respaldos/`, no enlazada desde la web)
- 6 registros · 2 APROBADO · 4 NO APROBADO · almacén Agave 1 · campo Codigo vacío (se acepta como nulo)
- Se aplica automáticamente una sola vez al abrir la consola, con copia de seguridad previa
  (`dicka_backup_before_restore-2026-09-07-b1`) y campos de auditoría `source_file`, `import_batch_id`, `imported_at`, `import_key`.
- El Estado histórico se conserva tal cual; el umbral (80) sólo genera advertencias.

## Clasificación y aprobación (simulador de montacarga)
- Errores críticos configurables en `CRITICAL_FAULTS` (colisión, atropello, volcadura, operar con falla de inspección): impiden aprobar.
- Umbral de aprobación `PASS_SCORE = 80`.

## Base de datos compartida en Netlify (todos los almacenes ven los mismos resultados)
Archivos: `netlify.toml`, `package.json`, `netlify/functions/results.mjs` (Netlify Functions + Netlify Blobs).
- La consola detecta sola la función `/.netlify/functions/results`; el encabezado muestra **☁️ Base compartida**.
- Sincroniza al abrir, al terminar un curso, al volver a la pestaña y cada 2 minutos. Sin nube (archivo local
  o tiiny.host) sigue funcionando con la base local y avisa **💾 Base local**.
- Deduplicación en servidor con la misma clave (Fecha + No. empleado + Curso + Score); marcar Oficial/Prueba se guarda en la nube.

### Publicar con base compartida (una sola vez)
Netlify Drop NO compila funciones; hay que publicar desde Git o con la CLI:
A) **Git**: sube la carpeta a un repositorio (GitHub) → Netlify → "Add new site → Import an existing project"
   → Build command: (vacío) · Publish directory: `.` → Deploy. Netlify instala `@netlify/blobs` y activa la función.
B) **CLI** (en una PC con Node.js): `npm i -g netlify-cli` → `netlify login` → dentro de la carpeta:
   `npm install` → `netlify deploy --prod --dir=. --functions=netlify/functions`
Actualizaciones posteriores: mismo comando o `git push`. Los datos viven en Netlify Blobs, no en el archivo,
así que publicar una versión nueva **no borra** la base. Respaldo semanal: Dashboard → 💾 Respaldar base.
