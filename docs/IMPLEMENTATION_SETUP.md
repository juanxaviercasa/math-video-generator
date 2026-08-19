# Guía de implementación y configuración

## Estado del incremento

Este incremento implementa la primera capa de confiabilidad recomendada por la auditoría. La generación ya no debe depender de un cierre `setImmediate` dentro del proceso HTTP: el API persiste la solicitud, crea una clave de idempotencia y publica un job en Bull/Redis; el worker reconstruye la solicitud desde PostgreSQL, ejecuta el pipeline multimedia y actualiza progreso, heartbeat, intentos y artefactos.

También se reemplazó la exposición global de `os.tmpdir()` por un endpoint de media autorizado por usuario y video. El despliegue Docker ahora declara una imagen de runtime con Python, Manim, FFmpeg, FFprobe, Edge TTS y LaTeX, además de una imagen Nginx para el frontend.

## Variables obligatorias que siguen siendo placeholders

| Variable | Propósito | Valor que debe proporcionar el operador |
|---|---|---|
| `SUPABASE_URL` | Proyecto Supabase Auth | URL real del proyecto. |
| `SUPABASE_PUBLISHABLE_KEY` | Cliente de autenticación | Publishable key real; nunca usar una service-role key en frontend. |
| `DATABASE_URL` | Pool de PostgreSQL para la aplicación | Connection string real, preferentemente pooler. |
| `DIRECT_URL` | Conexión directa para Prisma CLI/migraciones | URL directa del proyecto. |
| `REDIS_URL` | Cola Bull y recuperación de jobs | Redis persistente con autenticación/TLS en producción. |
| `JWT_SECRET` | Compatibilidad de configuración heredada | Secreto aleatorio de al menos 32 caracteres. |
| `APP_URL` | Origin permitido por CORS | URL pública del frontend. |
| `OPENROUTER_API_KEY`, `GEMINI_API_KEY`, `OPENAI_API_KEY` | Proveedores LLM opcionales | Solo se requiere el proveedor que se decida activar. |
| `TTS_PROVIDER` | Proveedor de narración | `edge` para conservar `es-MX-DaliaNeural`. |
| `TTS_NEURAL_VOICE` | Voz neural | Por defecto `es-MX-DaliaNeural`. |

Los valores de ejemplo en `docker-compose.yml` para Supabase son placeholders deliberados. No representan credenciales válidas y deben sustituirse antes de ejecutar una instancia real.

## Migración de base de datos

La migración [`20260819170000_durable_video_jobs`](../backend/prisma/migrations/20260819170000_durable_video_jobs/migration.sql) añade a `videos` el mensaje operativo, errores estructurados, intentos, heartbeat, worker, idempotency key, solicitud serializada, directorio de artefactos y timestamps de ejecución.

En Supabase se debe ejecutar, después de revisar el SQL, mediante Prisma:

```bash
cd backend
npx prisma migrate deploy
```

Si el proyecto todavía no tiene una tabla `_prisma_migrations` coherente con el historial local, debe hacerse primero una revisión de baseline. No se recomienda ejecutar `prisma migrate reset` sobre una base con datos reales.

## Smoke test de runtime

Antes de iniciar el worker se puede ejecutar `./scripts/runtime-smoke.sh`. El script verifica Node, Python, Manim, FFmpeg, FFprobe, Edge TTS y LaTeX, además de comprobar que Supabase, PostgreSQL y Redis no sigan usando placeholders. En el entorno de desarrollo actual las herramientas multimedia están instaladas, pero el script debe fallar con código 2 mientras no se configuren las credenciales reales; ese fallo es intencional y evita confundir una imagen estructural con un despliegue listo.

## Ejecución local

Para ejecutar la API y el worker por separado:

```bash
npm run build:backend
npm --workspace backend run prisma:generate
npm run start:backend
npm --workspace backend run start:worker
```

La API necesita Redis, PostgreSQL y Supabase configurados. El worker necesita además acceso a Manim, FFmpeg, FFprobe, Edge TTS y LaTeX. En Windows o macOS se deben configurar los binarios mediante `PATH` o variables específicas antes de iniciar el worker.

## Ejecución con Compose

```bash
docker compose -f deploy/docker-compose.yml up --build
```

El servicio `backend` aplica migraciones y expone el API. El servicio `worker` consume `math-video-generation`. El volumen `media_data` contiene los artefactos y no debe publicarse directamente en un servidor web.

En producción se recomienda sustituir los valores por secretos administrados, habilitar TLS para Redis/PostgreSQL cuando el proveedor lo requiera, cambiar el secreto JWT, revisar `APP_URL` y evitar publicar los puertos de PostgreSQL y Redis a Internet.

## Remotion y Manim

Remotion permanece en modo piloto. La integración oficial debe consumir el mismo `LessonTimeline` generado por el backend, con una única duración por segmento. No se debe activar `NARRATION_TIMELINE=true` ni sustituir el renderer estable hasta que el smoke test confirme:

| Verificación | Condición |
|---|---|
| Persistencia | El job sobrevive al reinicio de API. |
| Recuperación | Un job con heartbeat vencido vuelve a `pending`. |
| Ownership | Otro usuario no puede consultar status ni media. |
| Audio | Cada segmento existe, se decodifica y se mezcla. |
| Visual | El canvas coincide en 16:9, 1:1 y 9:16. |
| Tiempo | Audio, timeline y video no difieren más de la tolerancia definida. |
| Matemática | Solo se publica si existe solver determinista válido. |

El siguiente trabajo de Remotion debe transformar `LessonTimeline` en una cubierta animada con anchors persistentes, sustitución paso a paso, pausas activas y gráficos derivados del AST. Remotion debe encargarse de composición editorial; Manim debe conservar la precisión matemática.

## Placeholders que no bloquean la estructura

La elección final de proveedor Redis, el dominio público, las credenciales Supabase, la política de almacenamiento y cualquier API LLM de pago quedan como decisiones operativas. La estructura ya contiene puntos de configuración para ellas. Hasta que se proporcionen valores reales, la aplicación debe tratar esos servicios como no configurados y fallar de manera explícita, nunca simular una generación real en producción.
