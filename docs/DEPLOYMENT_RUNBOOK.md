# Runbook de despliegue y operación

## Estado actual

La rama `improvements/production-mvp` contiene la implementación durable del pipeline, el worker separado, media privada, gates matemático y audiovisual, recuperación del frontend y el runner Remotion opt-in. La ruta estable continúa siendo Manim + FFmpeg mientras `REMOTION_ENABLED=false`.

> Las credenciales reales no deben almacenarse en GitHub. Se configuran como secretos del entorno de staging o producción.

## Configuración mínima

| Variable | Propósito | Requerida para |
|---|---|---|
| `DATABASE_URL` | Conexión de Prisma al PostgreSQL de runtime | API, worker y migraciones |
| `DIRECT_URL` | Conexión directa para Prisma Migrate | Migraciones |
| `REDIS_URL` | Cola Bull y recuperación de jobs | API y worker |
| `SUPABASE_URL` | Proyecto Supabase Auth | Login y ownership |
| `SUPABASE_PUBLISHABLE_KEY` | Cliente público de Supabase | Login y ownership |
| `TTS_PROVIDER` | Proveedor de narración, normalmente `edge` | Narración |
| `TTS_NEURAL_VOICE` | Voz, por ejemplo `es-MX-DaliaNeural` | Narración neural |
| `REMOTION_ENABLED` | Activa el renderer editorial opt-in | Solo después del smoke test |
| `REMOTION_PROJECT_DIR` | Ruta al workspace Remotion | Runner Remotion |

## Arranque local sin servicios externos

El frontend y el backend pueden compilarse localmente con:

```bash
npm install
npm run build:backend
npm run build:frontend
npm test
```

El smoke test de dependencias comprueba Manim, FFmpeg, FFprobe, Edge TTS, LaTeX, PostgreSQL y Redis. Sin las variables reales, debe fallar de forma informativa; no se debe activar simulación silenciosa en producción.

## Arranque con Docker Compose

Después de crear un `.env` fuera del control de versiones, el orden recomendado es:

```bash
docker compose -f deploy/docker-compose.yml config
docker compose -f deploy/docker-compose.yml up -d --build
docker compose -f deploy/docker-compose.yml ps
curl http://localhost:3001/health
curl http://localhost:3001/readyz
```

El servicio `backend` ejecuta migraciones antes de iniciar la API. El servicio `worker` espera la readiness del backend y consume la cola durable. PostgreSQL, Redis y media se mantienen en volúmenes separados. No se debe publicar PostgreSQL ni Redis directamente a Internet.

## Migración durable

La migración `backend/prisma/migrations/20260819170000_durable_video_jobs/migration.sql` añade estado operativo, solicitud serializada, idempotencia, heartbeat, intentos y timestamps. Debe aplicarse en staging antes de levantar el worker de producción:

```bash
npm --workspace backend run prisma:generate
npm --workspace backend run prisma:migrate:deploy
```

## Activación controlada de Remotion

Primero se debe ejecutar el smoke test local del runner con un archivo de audio generado por Edge TTS:

```bash
edge-tts --voice es-MX-DaliaNeural \
  --text 'Identificamos los coeficientes de la ecuación.' \
  --write-media /tmp/mvg-remotion-runner-input.mp3

npm exec --workspace backend -- tsx \
  scripts/remotion-runner-smoke.ts /tmp/mvg-remotion-runner-input.mp3

./scripts/media-qa.sh \
  /tmp/mvg-remotion-runner-smoke/runner-smoke-remotion.mp4 1280 720
```

Solo después de que el smoke test pase se puede usar `REMOTION_ENABLED=true` en staging. El runner exige narración, reutiliza las duraciones del `LessonTimeline`, copia los audios temporalmente y limpia los props y clips al terminar. Si falla, el job se marca como fallido y no debe publicarse como completado.

## Operación y diagnóstico

`/health` indica liveness y `/readyz` verifica PostgreSQL y Redis. Cada respuesta incluye `x-request-id`; ese identificador debe conservarse al reportar un error. Los jobs exponen estado, progreso, código de error, intentos y heartbeat. Los artefactos fallidos antiguos se limpian según `FAILED_ARTIFACT_RETENTION_MS`; los completados requieren una política de retención separada.

## Rollback

Para volver a la ruta estable sin eliminar la infraestructura durable, definir `REMOTION_ENABLED=false`, mantener las migraciones aplicadas y redeplegar API y worker con la misma versión de esquema. No se debe borrar Redis o PostgreSQL durante un rollback porque se perdería la recuperación de jobs y la idempotencia.

## Pendientes que requieren acceso externo

La validación de sesión real, la migración en Supabase, la recuperación después de reinicios de contenedores, TLS, DNS, secretos, límites de CPU/memoria y métricas de producción requieren un entorno de staging o producción con credenciales. Esos pasos no deben simularse ni resolverse guardando claves en el repositorio.
