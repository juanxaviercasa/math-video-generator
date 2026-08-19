# Estado del proyecto

## Resumen ejecutivo

El proyecto ya no depende de mapas en memoria para gestionar jobs: la API persiste solicitudes y estados en PostgreSQL, Bull/Redis distribuye el trabajo y un worker separado ejecuta el pipeline multimedia. La salida final se valida antes de publicarse y la media se entrega mediante rutas autorizadas por ownership.

La generación estable usa Manim para precisión matemática y FFmpeg para el empaquetado. Remotion está conectado como compositor opt-in basado en el `LessonTimeline` real, con audio TTS por segmento y formatos horizontal, cuadrado y vertical. Su activación predeterminada continúa deshabilitada hasta completar staging.

## Estado por capa

| Capa | Estado | Evidencia |
|---|---|---|
| Validación matemática | Listo para familias soportadas; problemas no soportados quedan en revisión | Suite de solvers y gate de publicación |
| Timeline pedagógico | Integrado y validado | 56 tests y eventos con anchors/checkpoints |
| API y jobs | Estructuralmente listo | Prisma, idempotencia, heartbeat, retries y recuperación |
| Worker | Separado y con apagado ordenado | Bull/Redis, cleanup y retry policy |
| Media | Protegida y validada | Ownership, traversal guard y media QA |
| Frontend | Contratos endurecidos | Polling con backoff, IDs criptográficos, errores normalizados y MathLive lazy |
| Remotion | Integrado como opt-in | Smoke test backend en 16:9, 1:1 y 9:16 con AAC |
| Docker | Definido y documentado | Compose, healthcheck `/readyz` y runtime multimedia |
| Observabilidad | Lista para staging | Request IDs, `/metrics` protegido y latencias HTTP agregadas |
| Staging real | Pendiente | Requiere PostgreSQL, Redis, Supabase y secretos |

## Validación local actual

La última ronda aprobó **56 tests**, compilación del backend, compilación del frontend, lint sin errores, type-check de Remotion y QA audiovisual en los tres formatos del runner Remotion. MathLive ahora se carga de forma diferida: el bundle inicial queda separado del chunk matemático pesado. Vite todavía puede advertir sobre el tamaño del chunk lazy de MathLive, pero ya no bloquea la primera carga del formulario.

## Decisión de activación

La configuración recomendada para una primera puesta en staging es:

```env
REMOTION_ENABLED=false
NARRATION_TIMELINE=false
ALLOW_UNVERIFIED_MATH_VIDEO=false
TTS_PROVIDER=edge
TTS_NEURAL_VOICE=es-MX-DaliaNeural
```

Después de comprobar migraciones, Redis, reinicios, ownership, audio real y volúmenes persistentes, se puede activar `REMOTION_ENABLED=true` en un worker de staging y comparar sus artefactos contra la ruta Manim. No se recomienda activar ambos cambios experimentales al mismo tiempo; primero se debe validar Remotion con `NARRATION_TIMELINE=false` y después evaluar la sincronización microtemporal.

## Próxima frontera externa

El siguiente trabajo que no puede certificarse únicamente en el sandbox es la ejecución contra servicios reales: aplicar la migración en PostgreSQL, autenticar con Supabase, probar recuperación de jobs después de reinicio, medir concurrencia Redis, verificar TLS, revisar límites de CPU/memoria y comprobar que el proveedor de despliegue conserva `MEDIA_ROOT`. Esos pasos son de staging y no deben resolverse con placeholders permanentes en producción.
