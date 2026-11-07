# Matriz de trabajo autónomo y bloqueos externos

## Alcance que puede completarse sin credenciales

| Área | Trabajo autónomo disponible | Evidencia local esperada |
|---|---|---|
| Backend | Contratos, validaciones, ownership, idempotencia, recuperación, errores y apagado ordenado | TypeScript, tests unitarios y smoke tests |
| Worker | Serialización de solicitudes, heartbeat, retry policy, limpieza y límites de concurrencia | Tests con doubles y compilación |
| Multimedia | Validación FFprobe, resolución, audio obligatorio, thumbnails y safe areas | QA sobre MP4 locales |
| Matemáticas | Solvers deterministas, AST, fórmula persistente, sustitución y checkpoints | Corpus y tests de regresión |
| Frontend | Polling reanudable, estados de error, URLs privadas, accesibilidad y code splitting | Build y pruebas de componentes |
| Remotion | Adaptador `LessonTimeline -> AnimatedDeck`, composiciones, audio por segmento y renders locales | Type-check, renders y QA de frames |
| Documentación | Runbooks, variables de entorno, migraciones, arquitectura y procedimientos de rollback | Archivos versionados |

## Trabajo que requiere configuración externa

| Área | Bloqueo | Qué debe configurarse |
|---|---|---|
| Auth y usuarios | No se puede validar sesión real sin proyecto Supabase | `SUPABASE_URL` y `SUPABASE_PUBLISHABLE_KEY` |
| Persistencia | No se puede ejecutar la migración contra datos reales sin PostgreSQL | `DATABASE_URL` y `DIRECT_URL` |
| Cola distribuida | No se puede probar recuperación entre procesos sin Redis persistente | `REDIS_URL` |
| Narración neural | Edge TTS puede probarse localmente, pero proveedores LLM externos requieren claves | Proveedor seleccionado y sus API keys |
| Despliegue | No se puede confirmar DNS, TLS, volúmenes, secretos ni límites del proveedor | Acceso al entorno de despliegue |
| Analítica | No se puede medir retención real sin tráfico y cuentas de analítica | Integración y permisos de la plataforma |

## Orden recomendado sin bloquear el avance

Primero se debe completar toda la superficie local: contratos, pruebas de integración con doubles, observabilidad, limpieza de artefactos, QA de formatos y render Remotion con audios de prueba. Después se configura un entorno de staging con Supabase, PostgreSQL y Redis. Solo después de comprobar reinicios, retries, ownership y publicación de media en staging se debe activar la ruta Remotion dentro del worker de producción.

Los placeholders no deben interpretarse como credenciales faltantes que impidan programar. Solo impiden comprobar el comportamiento contra servicios reales. El código debe fallar explícitamente cuando se ejecuta una operación que requiere esas dependencias, sin activar simulación silenciosa.
