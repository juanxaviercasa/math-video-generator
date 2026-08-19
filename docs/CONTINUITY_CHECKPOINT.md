# Checkpoint de continuidad del proyecto

**Fecha del checkpoint:** 19 de agosto de 2026  
**Repositorio:** `juanxaviercasa/math-video-generator`  
**Rama:** `improvements/production-mvp`  
**Commit remoto:** `5ef4c09d736c8d7f2714a18b143b892533393406`  
**Estado Git:** limpio y sincronizado con `origin/improvements/production-mvp`.

## Estado alcanzado

El proyecto dejó de depender de mapas en memoria para la gestión principal de trabajos. La API persiste la solicitud y el estado del job en PostgreSQL, Bull/Redis distribuye el trabajo, y un worker separado ejecuta el pipeline multimedia. La creación espera la persistencia antes de publicar en Redis, las escrituras por job se serializan, los reintentos respetan la semántica de Bull y los jobs antiguos pueden recuperarse mediante heartbeat y políticas de stale jobs.

La generación cuenta con ownership por usuario, idempotencia, protección por `Origin` para mutaciones con cookies, media privada con validación de ownership y traversal guard, apagado ordenado, readiness de PostgreSQL/Redis, request IDs y limpieza de artefactos fallidos. El gate final verifica video, resolución, duración, audio solicitado y thumbnail; el gate matemático evita publicar problemas sin solver determinista salvo una bandera explícita de revisión interna.

La arquitectura multimedia mantiene Manim como renderer matemático estable y FFmpeg como empaquetador. Remotion está conectado como compositor editorial opt-in basado en el `LessonTimeline` real: recibe anchors, eventos, checkpoints, segmentos y audios TTS por segmento; soporta 16:9, 1:1 y 9:16; y fue validado con voz neural local `es-MX-DaliaNeural`.

El frontend conserva polling con backoff y cleanup, genera IDs e idempotency keys con `crypto.randomUUID`, normaliza errores HTTP con código, status, campos y request ID, muestra información durable del job y carga MathLive de forma diferida para no bloquear la primera carga del formulario.

## Evidencia local

| Verificación | Resultado |
|---|---|
| Suite backend | 57 tests aprobados |
| Build backend | Aprobado |
| Build frontend | Aprobado |
| Lint | Sin errores propios; solo advertencias informativas de compatibilidad del parser TypeScript |
| Type-check Remotion | Aprobado |
| Diff de espacios | `git diff --check` limpio |
| Runner Remotion 16:9 | QA aprobado: 1280 × 720, H.264 + AAC |
| Runner Remotion 1:1 | QA aprobado: 720 × 720, H.264 + AAC |
| Runner Remotion 9:16 | QA aprobado: 720 × 1280, H.264 + AAC |
| Estado remoto | HEAD local igual a `origin/improvements/production-mvp` |

## Configuración que sigue siendo placeholder

Los siguientes valores no deben introducirse en el repositorio. Se deben configurar en un entorno seguro de staging o producción:

| Placeholder | Uso |
|---|---|
| `DATABASE_URL` | PostgreSQL de runtime |
| `DIRECT_URL` | Prisma Migrate |
| `REDIS_URL` | Bull/Redis |
| `SUPABASE_URL` | Supabase Auth |
| `SUPABASE_PUBLISHABLE_KEY` | Cliente Supabase |
| `METRICS_TOKEN` | Acceso protegido a `/metrics` |
| `TTS_PROVIDER` y `TTS_NEURAL_VOICE` | Voz y proveedor de narración |
| `REMOTION_PROJECT_DIR` | Workspace Remotion del runtime |
| Secretos TLS, dominio y proveedor de despliegue | Operación externa |

Los placeholders no bloquean más desarrollo local. Sí bloquean la certificación real de migraciones, autenticación, Redis, reinicios, concurrencia, TLS, almacenamiento persistente, límites de recursos y despliegue.

## Próxima continuidad recomendada

El siguiente bloque debe ejecutarse en staging, no en el repositorio local: crear el entorno seguro, aplicar la migración Prisma, arrancar PostgreSQL y Redis, comprobar `/health` y `/readyz`, registrar un usuario Supabase, generar un video con Manim, reiniciar API y worker durante un job, confirmar recuperación, validar media privada y consultar `/metrics` con el token.

Después de certificar la ruta estable, se debe activar `REMOTION_ENABLED=true` únicamente en staging, repetir el smoke test con audio real y comparar el artefacto Remotion con la salida Manim. Remotion no debe convertirse en renderer predeterminado hasta que la recuperación, el consumo de memoria, la concurrencia y la retención de artefactos sean medidos en el entorno real.

## Comandos de reanudación

```bash
cd /home/ubuntu/math-video-generator
git fetch origin improvements/production-mvp
git checkout improvements/production-mvp
git pull --ff-only origin improvements/production-mvp
npm test
npm run build:backend
npm run build:frontend
npm run lint
(cd tools/remotion-pilot && npm run type-check)
```

Para la configuración de Docker, migraciones, smoke tests, Remotion, rollback y secretos, consultar `docs/DEPLOYMENT_RUNBOOK.md` y `docs/IMPLEMENTATION_SETUP.md`. Para el alcance de lo que puede hacerse sin credenciales, consultar `docs/AUTONOMOUS_WORK_MATRIX.md`.
