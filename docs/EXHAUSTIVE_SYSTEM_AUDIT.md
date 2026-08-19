# Auditoría exhaustiva del sistema Math Video Generator

**Autor:** Manus AI  
**Repositorio:** [`juanxaviercasa/math-video-generator`](https://github.com/juanxaviercasa/math-video-generator)  
**Rama auditada:** `improvements/production-mvp`  
**Fecha:** 19 de agosto de 2026  
**Alcance:** backend, persistencia, jobs, multimedia, sincronización pedagógica, seguridad, exposición de archivos, frontend, contratos HTTP, despliegue y calidad de pruebas.  
**Restricción respetada:** no se aplicaron cambios de código ni correcciones funcionales durante esta auditoría.

## Resumen ejecutivo

El sistema **compila y sus pruebas unitarias cubiertas pasan**, pero todavía no es una plataforma SaaS de generación de video robusta. El riesgo principal no está en una fórmula aislada ni en el piloto visual, sino en la combinación de cuatro capas que hoy no forman un contrato operacional único: una API que encola trabajos en memoria, un pipeline multimedia que depende de binarios locales, una persistencia parcial en Prisma y un frontend que trata el polling como una operación temporal y no como un workflow reanudable.

La discrepancia más importante es arquitectónica. La documentación describe PostgreSQL, Redis y Bull como componentes centrales de producción, mientras que el flujo ejecutable usa `Map`, `setImmediate` y un proceso Node único. Redis aparece en Docker Compose y en dependencias, pero no participa en la ejecución real de jobs. Por tanto, un reinicio, un segundo proceso, un despliegue horizontal o una caída durante la renderización pueden producir jobs huérfanos, estados inconsistentes y artefactos imposibles de recuperar.

El segundo riesgo crítico es el despliegue multimedia. La imagen de runtime del Dockerfile contiene Node y el backend compilado, pero no instala Python, Manim, FFmpeg, FFprobe, Edge TTS ni LaTeX. Además, el build usa `pnpm install --frozen-lockfile` sin que exista un `pnpm-lock.yaml` en la estructura auditada y Compose referencia un `frontend/Dockerfile` que no fue encontrado. El despliegue documentado no es, en consecuencia, equivalente al entorno en el que el piloto fue generado.

La recomendación es **no activar todavía la integración Remotion-Manim como ruta principal**. El siguiente incremento debe ser un vertical slice de infraestructura: job persistente, worker real, artefactos gestionados, idempotencia, estado recuperable y verificación de dependencias multimedia. Remotion puede continuar como piloto aislado y preview editorial, pero no debe ocultar que el sistema todavía carece de garantías de ejecución SaaS.

## Línea base comprobada

| Área | Resultado observado | Interpretación |
|---|---:|---|
| Pruebas unitarias | 54 aprobadas, 0 fallos | Buena cobertura de los módulos pedagógicos y de layout actualmente testeados. |
| Build backend | Aprobado | El TypeScript del backend compila. |
| Build frontend | Aprobado | El frontend compila; Vite advierte un chunk de MathLive de aproximadamente 783 kB. |
| Lint | 0 errores; 2 warnings | Hay imports no usados en `timeline.service.ts`; además, TypeScript 5.9.3 está fuera del rango oficialmente soportado por la versión de `@typescript-eslint` instalada. |
| Dependencias en el entorno actual | Manim, FFmpeg, FFprobe, Edge TTS y `pdflatex` disponibles | Esto demuestra que el sandbox puede ejecutar el pipeline; no demuestra que la imagen Docker pueda hacerlo. |
| Estado Git | Rama limpia al iniciar la comprobación | No se detectaron cambios de código previos sin registrar en la rama auditada. |

La evidencia reproducible está guardada en [`AUDIT_BASELINE_EVIDENCE.md`](./AUDIT_BASELINE_EVIDENCE.md).

> **Conclusión de la línea base:** el proyecto tiene salud estática en el código cubierto, pero la salud estática no prueba persistencia, disponibilidad de herramientas externas, recuperación ante reinicios, autorización de artefactos ni sincronización audiovisual.

## Mapa de arquitectura real frente a arquitectura documentada

| Capacidad | Arquitectura documentada | Implementación real auditada | Riesgo |
|---|---|---|---|
| Cola | Bull sobre Redis | `Map<string, GenerationJob>` y `setImmediate` | Pérdida de jobs y ausencia de backpressure. |
| Estado | PostgreSQL como fuente operativa | Memoria para estado inmediato; Prisma solo persiste parcialmente | Dos fuentes de verdad que pueden divergir. |
| Worker | Worker separado y escalable | El mismo proceso HTTP ejecuta todo el pipeline | Bloqueo de recursos y fallos acoplados. |
| Multimedia | Entorno reproducible con Manim y FFmpeg | Binarios locales descubiertos dinámicamente | El resultado depende de la máquina. |
| Archivos | Storage gestionado | Directorios en `os.tmpdir()` expuestos por Express | Retención, limpieza y autorización insuficientes. |
| Narración | Voz neural sincronizada | Segmentos TTS secuenciales; el audio ajusta duración de escenas | Sin contrato explícito de timecodes y sin limpieza robusta. |
| Visual QA | Auditoría y Auto Repair | QA geométrico y muestreo de frames; `repairIterations` queda en 0 | Se detectan problemas, pero no se repara automáticamente el artefacto final. |
| Preview editorial | Remotion como capa futura | Piloto separado, no conectado al pipeline oficial | Riesgo de duplicar relojes y contratos de timeline. |

La descripción documental de la arquitectura se encuentra en [`ARCHITECTURE.md`](./ARCHITECTURE.md), mientras que el servicio ejecutable de jobs está en [`job.service.ts`](../backend/src/services/job.service.ts).

## Hallazgos críticos

### AUD-001 — Cola en memoria presentada como cola distribuida

**Severidad:** crítica. **Esfuerzo:** medio-alto. **Prioridad:** P0.

`generationJobs` mantiene los trabajos en dos mapas en memoria y los lanza mediante `setImmediate`. Prisma solo se actualiza de manera asíncrona y condicional: no se persisten trabajos sin usuario autenticado, el resultado de `persist()` no se espera y los errores de persistencia se reducen a un log. El sistema documenta Bull/Redis, pero no los usa en el recorrido de generación.

Esto explica fallos del tipo “explota bajo carga”: varios renders pesados compiten dentro del mismo proceso Node, no existe límite de concurrencia real, no hay reintento durable, no hay recuperación de jobs `processing` tras reinicio y no hay garantía de que el estado observado por el frontend coincida con el registro de base de datos.

**Corrección sistémica recomendada:** elegir una fuente de verdad única para el job; persistir la solicitud, estado, intentos, heartbeat, error y artefactos; ejecutar el render en un worker separado; utilizar Redis/BullMQ o una alternativa equivalente con configuración real; incorporar idempotency key y reconciliación de jobs abandonados.

### AUD-002 — Despliegue Docker no contiene el runtime multimedia

**Severidad:** crítica. **Esfuerzo:** medio. **Prioridad:** P0.

[`deploy/Dockerfile`](../deploy/Dockerfile) usa `node:20-alpine`, copia el backend compilado y arranca `node dist/index.js`. No instala Python, Manim, FFmpeg, FFprobe, Edge TTS ni compilador LaTeX. El servicio ejecutable, en cambio, rechaza el render si Manim o FFmpeg no están disponibles y el renderer selecciona MathTex únicamente cuando detecta LaTeX.

Hay dos inconsistencias adicionales: el Dockerfile ejecuta `pnpm install --frozen-lockfile` aunque el repositorio auditado tiene `package-lock.json` y no `pnpm-lock.yaml`; y [`docker-compose.yml`](../deploy/docker-compose.yml) referencia `frontend/Dockerfile`, que no fue encontrado.

**Corrección sistémica recomendada:** construir imágenes reproducibles separadas para API, worker Manim/TTS/FFmpeg y frontend; fijar versión de Node/Python/Manim/FFmpeg/Edge TTS/TeX; usar el gestor de paquetes coherente con el lockfile; ejecutar un smoke test de render durante CI y validar que el frontend tenga una imagen realmente construible.

### AUD-003 — Generación sin autenticación y status sin autorización

**Severidad:** crítica. **Esfuerzo:** bajo-medio. **Prioridad:** P0.

Las rutas de video aplican `optionalAuth`. `POST /api/generate-video` acepta generación anónima, y `GET /api/generate-video/status/:id` devuelve el job solo con conocer el identificador. El control de pertenencia existe para `/videos/:id`, pero no para el endpoint de status que usa el frontend durante la generación.

El identificador generado por el cliente es predecible (`video_${Date.now()}`), por lo que el diseño no debe tratarlo como secreto. La combinación de IDs previsibles, status sin autorización y archivos accesibles por URL expone metadatos y potencialmente videos de otros usuarios.

**Corrección sistémica recomendada:** exigir autenticación para producción, autorizar cada consulta por `userId`, generar IDs no enumerables, añadir ownership al registro persistente y devolver URLs firmadas o un endpoint autorizado de descarga en lugar de asumir que una ruta estática es suficiente.

### AUD-004 — Exposición de todo el directorio temporal del sistema

**Severidad:** crítica. **Esfuerzo:** medio. **Prioridad:** P0.

El servidor monta `express.static(os.tmpdir())` en `/media`. Aunque el orquestador verifica que el archivo generado esté bajo el directorio temporal, la ruta estática expone el directorio temporal completo, no únicamente los artefactos pertenecientes a la aplicación. La URL se deriva de rutas internas y no contiene una comprobación de autorización.

**Corrección sistémica recomendada:** usar un directorio de artefactos dedicado, separar staging de distribución, registrar propietario y expiración, servir mediante endpoint autorizado o storage privado con URL firmada, y aplicar una tarea de limpieza que no elimine un archivo todavía referenciado.

## Hallazgos altos

### AUD-005 — El proceso HTTP ejecuta render, TTS y FFmpeg

**Severidad:** alta. **Esfuerzo:** alto. **Prioridad:** P0.

El request crea el job, pero el executor se dispara desde el mismo proceso que atiende Express. Cada generación puede ejecutar Manim, varias llamadas de TTS, FFprobe, concatenación de audio, FFmpeg, extracción de thumbnail y merge final. No existe worker pool, límite de CPU/memoria por job ni aislamiento de procesos más allá de los timeouts parciales.

**Consecuencia:** un render lento consume recursos del API; un proceso hijo colgado puede acumularse; una ráfaga de usuarios puede saturar CPU, memoria, disco temporal y conexiones externas de TTS/LLM simultáneamente.

### AUD-006 — Persistencia parcial y errores de persistencia no bloqueantes

**Severidad:** alta. **Esfuerzo:** medio. **Prioridad:** P0.

`persist()` descarta la operación para usuarios temporales y se invoca con `void persist(next)`. Si Prisma falla, el job continúa como si el estado se hubiera almacenado. `listForUser()` consulta exclusivamente Prisma, mientras que status consulta exclusivamente la memoria. El resultado es que una generación puede aparecer en status y no aparecer en la biblioteca, o aparecer en la biblioteca con un estado anterior.

### AUD-007 — El gate matemático no es un gate global del endpoint

**Severidad:** alta. **Esfuerzo:** medio-alto. **Prioridad:** P0.

El solver determinista actual cubre ecuaciones cuadráticas en una forma específica. Para problemas no soportados, el servicio puede pedir pasos a un proveedor LLM y construir escenas sincronizadas genéricas. Visual QA marca posteriormente `productionReady=false`, pero el endpoint de generación no exige ese estado antes de crear el artefacto. La propiedad `requiresReview` solo se devuelve en preview y no impide por sí misma el render.

La documentación del motor ya reconoce que solo 2 de 21 casos del corpus tienen solver determinista. La regla correcta es que un fallback puede servir para inspección interna, pero no debe publicarse como solución matemática verificada.

### AUD-008 — El renderer Manim conserva lógica hardcodeada en rutas legacy

**Severidad:** alta. **Esfuerzo:** medio-alto. **Prioridad:** P1.

La ruta sincronizada y la ruta legacy contienen gráficos de parábolas con dominio, raíces y expresión fijos en algunos casos. La ruta timeline sí usa `graphSpec`, pero la existencia de múltiples caminos de render aumenta la probabilidad de que un formato o flag termine usando una escena que no corresponde al problema real. El archivo también contiene lógica duplicada para tarjetas, gráficas, recapitulaciones, escenas sincronizadas y pasos legacy.

**Corrección sistémica recomendada:** convertir el AST/Storyboard validado en la única entrada del renderer; eliminar escenas matemáticas hardcodeadas de producción; mantener legacy únicamente detrás de un contrato explícito y tests de paridad.

### AUD-009 — Visual QA inspecciona el video, pero no ejecuta Auto Repair ni QA audiovisual completo

**Severidad:** alta. **Esfuerzo:** medio-alto. **Prioridad:** P1.

`auditRenderedVideo()` captura un frame central por escena, consulta FFprobe, detecta frames casi negros y valida geometría del plan. El reporte devuelve `repairIterations: 0`. El reviewer multimodal es opcional y queda `skipped` si no se configura. No se valida la alineación semántica entre cada segmento hablado y el objeto matemático que aparece en pantalla, ni se analiza toda la secuencia de frames o el waveform.

El sistema puede aprobar la geometría del plan y, aun así, presentar una fórmula demasiado pequeña, una transición que ocurre antes de la palabra correspondiente, una pantalla vacía durante la narración o un audio que termina antes que la escena.

### AUD-010 — Contrato de tiempo duplicado entre audio, Manim y timeline

**Severidad:** alta. **Esfuerzo:** alto. **Prioridad:** P1.

El orquestador genera audio por escena y asigna `scene.duration` a partir de FFprobe. Después construye `LessonTimeline`, pero el renderer Manim vuelve a interpretar `duration`, `event.duration`, `holdAfter`, `wait` y duraciones mínimas propias. La ruta `NARRATION_TIMELINE` está protegida por flag, pero si se activa no existe aún una única fuente de timecodes compartida también por la mezcla FFmpeg.

**Corrección sistémica recomendada:** el timeline debe contener timecodes absolutos y eventos semánticos; el audio debe ser una pista con segmentos identificables; Manim y Remotion deben consumir el mismo contrato; el QA debe comparar duración de audio, duración de escena y duración de video con tolerancias explícitas.

### AUD-011 — TTS neural depende de CLI externa y el fallback puede producir inconsistencia operacional

**Severidad:** alta. **Esfuerzo:** medio. **Prioridad:** P1.

La voz neural aprobada es `es-MX-DaliaNeural`, invocada mediante `edge-tts`. Se realizan reintentos y se valida el archivo con FFprobe, lo cual es positivo. Sin embargo, la disponibilidad del binario y la conectividad del proveedor no están declaradas como dependencia de despliegue. El fallback local solo se habilita con flag, pero el servicio usa `ffprobe` directo en lugar de resolver el binario mediante una configuración unificada. La narración se genera escena por escena y puede fallar parcialmente después de haber creado archivos intermedios.

### AUD-012 — No hay límites de recursos por job ni limpieza transaccional

**Severidad:** alta. **Esfuerzo:** medio. **Prioridad:** P1.

El esquema limita el texto y el número de pasos, pero no hay cuota de duración, tamaño final, disco disponible, memoria, tiempo total de render o número de jobs concurrentes por usuario. La rate limit de generación es global al proceso y cuenta solicitudes, no trabajo efectivo ni costo de render. Los directorios `mvg-*` temporales no se limpian al terminar con éxito ni al fallar.

## Hallazgos medios y de mantenibilidad

| ID | Hallazgo | Impacto | Esfuerzo |
|---|---|---|---|
| AUD-013 | El frontend hace polling fijo cada 1.5 s sin backoff, cancelación, reanudación tras refresh ni cleanup garantizado al desmontar el componente. | Carga innecesaria, estados huérfanos y mala UX. | Bajo-medio |
| AUD-014 | El frontend actualiza una store local con un ID y luego puede sustituirlo por otro ID del backend, complicando reconciliación y duplicados. | Inconsistencia de biblioteca. | Bajo |
| AUD-015 | Los errores de API no se normalizan en un interceptor; se muestran mensajes genéricos y se pierde estructura de `code`, `fields` y `details`. | Diagnóstico pobre y soporte difícil. | Bajo |
| AUD-016 | CORS acepta un único `APP_URL`; el despliegue de Compose configura `REACT_APP_API_URL`, mientras Vite usa `VITE_API_URL`. | El frontend puede compilar apuntando a una variable ignorada. | Bajo |
| AUD-017 | El backend anuncia `/api-docs` en el log, pero no se observó el montaje de documentación OpenAPI en el bootstrap revisado. | Contrato operativo engañoso. | Bajo |
| AUD-018 | `auth.middleware.ts` implementa parsing manual de cookies y refresh por request; `optionalAuth` silencia todos los errores. | Diagnóstico de sesión ambiguo y posible degradación silenciosa. | Medio |
| AUD-019 | Cookies de sesión usan `sameSite: 'lax'`, `secure` solo en producción y no se observa protección CSRF explícita para acciones mutantes basadas en cookies. | Riesgo dependiente del despliegue y del dominio. | Medio |
| AUD-020 | `supabase.ts` exige variables al importar y desactiva `autoRefreshToken` y `persistSession`. | Startup frágil y más responsabilidad en middleware custom. | Bajo-medio |
| AUD-021 | El bundle de MathLive supera 500 kB minificados. | Carga inicial peor en editor web. | Bajo |
| AUD-022 | Lint muestra dos variables/imports no usados y la versión TypeScript está fuera del rango soportado por `@typescript-eslint`. | Señal de deriva de toolchain. | Bajo |
| AUD-023 | Existen múltiples flags de transición (`ALLOW_SIMULATION`, `NARRATION_TIMELINE`, ComfyUI) sin un inventario central de capacidades y estados de producción. | Combinaciones no testeadas. | Medio |
| AUD-024 | La lógica de `manim.service.ts` genera código Python por interpolación y compone expresiones LaTeX con heurísticas de detección de texto matemático. | Casos límite de escape, parseo y layout. | Medio-alto |

## Por qué el sistema “explota” bajo carga

El patrón de fallo probable es acumulativo. Una petición aceptada crea un directorio temporal y un job en memoria. `setImmediate` inicia el pipeline sin reservar capacidad ni comprobar una cola durable. El pipeline puede lanzar varias llamadas TTS, ejecutar Manim, producir frames intermedios y pedir múltiples operaciones FFmpeg. Si llegan varias solicitudes, todos esos procesos compiten por CPU, RAM, disco y red dentro del mismo contenedor.

Si el proceso muere, el mapa de jobs desaparece. Si Prisma estaba ocupado o falló, la biblioteca no tiene el estado final. Si el TTS produjo un segmento inválido, quedan archivos parciales. Si el render terminó pero el merge de audio falló, no existe una transacción que marque el artefacto como incompleto ni una política de limpieza. Si el usuario refresca la página, el frontend no rehidrata su generación activa desde el backend; el trabajo puede seguir ejecutándose, pero la interfaz ya no tiene un controlador fiable para él.

La causa no es “Remotion pesado” por sí misma. La causa es que la plataforma todavía no separa **API**, **orquestación durable**, **worker multimedia**, **almacenamiento de artefactos** y **contrato temporal audiovisual**.

## Arquitectura objetivo recomendada

```text
Frontend React / Editor
        |
        | HTTPS, sesión, idempotency key
        v
API Express
  - auth y ownership
  - validación Zod
  - preview sin side effects
  - crea Job persistente
        |
        v
PostgreSQL / Prisma -------------------- Object Storage privado
  Job, Video, Artifact, Event, AuditLog       MP4, thumbnail, audio, frames
        |
        v
Redis + BullMQ
  - cola durable
  - retries/backoff
  - concurrency y prioridades
        |
        v
Worker multimedia aislado
  1. solver/AST
  2. storyboard + LessonTimeline
  3. TTS por segmentos
  4. Manim o Remotion compositor
  5. FFmpeg mux/export
  6. FFprobe + Visual QA + audio QA
        |
        v
Publisher
  - solo publica si mathReady && visualPassed && audioPassed
  - URL firmada o endpoint autorizado
```

La regla central debe ser `solver/AST -> storyboard -> timeline -> renderer -> QA -> publish`. El solver y el timeline siguen siendo la fuente semántica. Manim continúa siendo el renderer de precisión matemática. Remotion puede componerse después como capa editorial y de preview, siempre que consuma el mismo timeline y no cree un segundo reloj.

## Plan de mejoras priorizado

| Fase | Entregable | Criterio de aceptación | Prioridad |
|---|---|---|---|
| 1 | Contrato persistente de Job y Artifact | Un job sobrevive a reinicio, tiene ownership, estado, intento, heartbeat, error y timestamps. | P0 |
| 2 | Worker real y cola durable | El API no ejecuta Manim/TTS/FFmpeg; hay concurrencia configurable, backoff y reintentos. | P0 |
| 3 | Imagen multimedia reproducible | Un smoke test Docker genera un MP4 narrado con Manim, FFmpeg, FFprobe, Edge TTS y LaTeX. | P0 |
| 4 | Seguridad de generación y media | Generación y status requieren ownership; los artefactos no están bajo el tmp global ni son públicos por defecto. | P0 |
| 5 | Gate matemático de publicación | Problemas sin solver determinista quedan en `needs_review` y no alcanzan `completed/published`. | P0 |
| 6 | Contrato único de timeline | Audio, Manim y Remotion reciben eventos con timecodes y anchors idénticos. | P1 |
| 7 | QA audiovisual | Se valida metadata, black frames, loudness, existencia de audio, duración, cobertura de escena y correspondencia de eventos. | P1 |
| 8 | Reanudación frontend | La biblioteca rehidrata jobs activos; polling tiene backoff, cleanup, cancelación y recuperación tras refresh. | P1 |
| 9 | Consolidación del renderer | AST y storyboard son la única ruta; se eliminan hardcodes y se reduce la lógica legacy. | P1 |
| 10 | Remotion editorial | Se conecta solo después de paridad con el baseline narrado y aprobación QA en los tres formatos. | P1 |

## Siguiente incremento recomendado

La decisión recomendada es **arreglar primero la infraestructura central, no avanzar todavía con la integración oficial Remotion-Manim**. El siguiente incremento debe ser pequeño pero vertical: crear un job persistente, procesarlo en un worker aislado, escribir artefactos en una ubicación gestionada, registrar heartbeat y completar una generación cuadrática narrada con la voz `es-MX-DaliaNeural` en 16:9. Después se debe repetir en 1:1 y 9:16.

Ese incremento debe mantener `NARRATION_TIMELINE=false` para la ruta estable y dejar Remotion en su workspace piloto. Cuando el vertical slice sea recuperable tras reinicio, idempotente y pase la validación de audio, formato y ownership, se podrá transportar el `LessonTimeline` real al compositor editorial. Hacerlo antes produciría una demo más vistosa sobre una base que todavía puede perder trabajos y publicar artefactos sin autorización.

## Definición operativa de “listo” para salir de auditoría

> El sistema no está listo porque 54 tests pasen. Está listo cuando una generación autenticada puede sobrevivir a un reinicio, reanudarse o fallar de forma explícita, conservar su ownership, producir un artefacto reproducible con las dependencias declaradas, validar matemática, geometría, audio y formato, y publicar únicamente después de todos esos gates.

| Gate | Estado auditado | Condición futura |
|---|---|---|
| Build backend/frontend | Aprobado | Mantener en CI. |
| Tests pedagógicos/layout | 54 aprobados | Añadir integración y contrato de datos. |
| Solver determinista | Parcial; cuadráticas | Definir catálogo soportado y bloquear lo demás. |
| Job durable | No | PostgreSQL + cola + worker. |
| Render Docker reproducible | No demostrado | Smoke test multimedia en CI. |
| Ownership de status/media | No | Autorización por usuario y storage privado. |
| Audio QA | Parcial | Validar pista, duración, loudness y sincronización. |
| Visual QA | Parcial | Añadir secuencia audiovisual y reparación verificable. |
| Remotion oficial | No; piloto separado | Integrar después de paridad temporal. |

## Referencias internas

[1]: ../backend/src/services/job.service.ts "Servicio de jobs en memoria"  
[2]: ../backend/src/routes/video.routes.ts "Rutas de generación, preview y status"  
[3]: ../backend/src/index.ts "Bootstrap HTTP, CORS, rate limits y media estática"  
[4]: ../backend/src/services/video-processing.service.ts "Orquestador multimedia"  
[5]: ../backend/src/services/manim.service.ts "Renderer Manim y generación de scripts"  
[6]: ../backend/src/services/ffmpeg.service.ts "Procesamiento FFmpeg y mux de audio"  
[7]: ../backend/src/services/tts.service.ts "Generación de voz neural y fallback"  
[8]: ../backend/src/services/visual-qa.service.ts "Visual QA y métricas geométricas"  
[9]: ../frontend/src/services/api.ts "Cliente HTTP del frontend"  
[10]: ../frontend/src/components/VideoGenerator.tsx "Flujo de generación y polling"  
[11]: ../deploy/Dockerfile "Imagen de backend"  
[12]: ../deploy/docker-compose.yml "Composición de servicios"  
[13]: ./ARCHITECTURE.md "Arquitectura documentada"  
[14]: ./MATH_PRESENTATION_ENGINE_VISUAL_AUDIT.md "Auditoría visual matemática previa"  
[15]: ./ANIMATED_SLIDE_ARCHITECTURE.md "Arquitectura de diapositivas animadas"  

## Veredicto final

**Calidad de prototipo pedagógico:** prometedora.  
**Calidad de renderer matemático para la cuadrática pilotada:** buena, con flags y rutas que todavía deben consolidarse.  
**Madurez SaaS multiusuario:** insuficiente.  
**Preparación para producción:** bloqueada por jobs no durables, runtime Docker incompleto, exposición de archivos y ausencia de autorización en status/media.  
**Siguiente acción:** infraestructura y confiabilidad; Remotion continúa como piloto hasta que exista un contrato temporal y operativo estable.
