# Informe de acción de mejoras
## Math Video Generator

**Autor:** Manus AI  
**Fecha de auditoría:** 16 de agosto de 2026  
**Repositorio evaluado:** [juanxaviercasa/math-video-generator](https://github.com/juanxaviercasa/math-video-generator)

> **Conclusión ejecutiva:** el repositorio contiene un prototipo funcional de demostración con una idea atractiva y un pipeline técnico razonable, pero todavía no es un producto confiable ni defendible comercialmente. La mayor oportunidad no está en añadir más proveedores de IA, sino en convertir la generación de un video genérico en una experiencia pedagógica verificable, editable, persistente y segura para estudiantes y docentes.

## 1. Dictamen general

El proyecto ya demuestra una dirección técnica clara: una interfaz React permite introducir un título y un problema matemático; un backend Express orquesta un proveedor LLM, Manim, FFmpeg y TTS; y el resultado se presenta como video descargable. La documentación también expresa una visión ambiciosa de SaaS con usuarios, planes, almacenamiento, colas y escalabilidad [[1]](#1) [[2]](#2).

Sin embargo, la implementación real está bastante por detrás de esa visión. El backend actualmente monta solamente un endpoint de generación, un endpoint de estado en memoria, un health check y una ruta informativa; no hay autenticación, persistencia de videos, cola de trabajos, almacenamiento durable, pagos, cuotas ni API de usuarios [[3]](#3) [[4]](#4). El propio pipeline devuelve “generación simulada completada” cuando Manim o FFmpeg no están instalados, pero sin URL de video ni miniatura [[5]](#5). Eso evita que la demo se rompa, pero también puede dar al usuario la impresión de que una generación exitosa produjo un activo que en realidad no existe.

Mi valoración actual es la siguiente:

| Área | Valoración | Diagnóstico |
|---|---:|---|
| Idea y oportunidad | 8/10 | Existe un problema comprensible: reducir el esfuerzo de crear explicaciones matemáticas visuales. |
| Prototipo técnico | 5/10 | Hay integración real con IA, Manim, FFmpeg y TTS, pero con acoplamiento fuerte al equipo local. |
| Producto utilizable | 3/10 | El flujo es de una sola sesión, sin biblioteca persistente, edición, recuperación ni colaboración. |
| Confiabilidad | 3/10 | No hay trabajos desacoplados, reintentos, cancelación, observabilidad ni garantía de que el resultado exista. |
| Seguridad y producción | 2/10 | No hay autenticación real en las rutas; CORS es permisivo y existen riesgos de abuso y consumo ilimitado. |
| Diferenciación | 4/10 | “IA + Manim” no basta como ventaja; la diferenciación debe estar en la calidad pedagógica y el control del docente. |
| **Madurez global** | **4/10** | **Buen prototipo técnico; todavía no es un producto listo para usuarios externos o monetización.** |

## 2. Lo que ya tiene y merece conservarse

La base técnica no debe desecharse. El repositorio tiene separación razonable entre frontend, backend y servicios multimedia, usa TypeScript en ambos lados, centraliza el acceso HTTP del frontend y cuenta con un modelo Prisma para usuarios y videos. El servicio LLM tiene fallback entre OpenRouter, Gemini y OpenAI, además de una función específica para producir pasos de solución y un guion de narración [[6]](#6). El servicio de Manim genera scripts, intenta reconocer expresiones matemáticas y contempla fallback a texto cuando no existe LaTeX [[7]](#7). El servicio de TTS también posee una estrategia local con PowerShell en Windows y espeak como alternativa [[8]](#8).

Las verificaciones técnicas realizadas muestran que el frontend y backend compilan correctamente con `npm run build`. El endpoint de salud responde HTTP 200 y la validación mínima del endpoint de generación responde HTTP 400 cuando faltan título o contenido. También existe una prueba automatizada para `buildNarrationScript`, la cual pasó al ejecutarse directamente con el runtime del workspace. Estos son fundamentos útiles para seguir construyendo.

La interfaz inicial es sencilla de entender: título, contenido matemático, calidad, narración, proveedor de IA y descarga. Esa simplicidad puede ser una fortaleza para el primer MVP, siempre que se corrijan los problemas de estado y se defina con precisión para quién se construye. En este momento, el repositorio parece intentar servir simultáneamente a estudiantes, docentes, creadores de contenido y clientes Enterprise; conviene empezar con un segmento único.

## 3. Brechas críticas que impiden que el proyecto “valga la pena” como producto

### 3.1. El resultado pedagógico no está validado

El sistema pide a un LLM que produzca pasos y luego transforma esos textos en escenas. No existe una etapa que compruebe algebraicamente si la solución es correcta, si las transformaciones preservan equivalencia, si la dificultad corresponde al nivel del estudiante o si el video explica por qué cada paso es válido. El resultado puede ser visualmente atractivo y matemáticamente incorrecto.

Esta es la brecha principal. Un generador de videos de matemáticas no puede competir solo por automatizar render; debe construir confianza. El MVP debe introducir una capa de validación matemática para tipos de problemas acotados, por ejemplo ecuaciones lineales, cuadráticas, sistemas y factorización. Esa capa debe mostrar una advertencia o detener la generación cuando la solución no pueda verificarse.

### 3.2. La arquitectura documentada no coincide con la implementación

La arquitectura documenta PostgreSQL, Redis, Bull, JWT, S3/R2, WebSockets, límites por plan y workers distribuidos [[2]](#2). En el código real, los trabajos viven en `Map<string, any>` dentro del proceso Node, el `userId` está fijado en `temp-user` y el resultado se escribe en el directorio temporal del sistema [[3]](#3) [[4]](#4). Si el proceso se reinicia, todos los estados desaparecen; si hay dos instancias, cada una conoce únicamente sus propios trabajos; y los archivos pueden perderse cuando se limpia el directorio temporal.

La documentación debe distinguir entre **implementado**, **parcial** y **planificado**. La falta de esa separación genera expectativas falsas y vuelve difícil evaluar el progreso.

### 3.3. No existe producto multiusuario

El esquema Prisma define `User` y `Video`, pero no existe un flujo de registro, inicio de sesión, autorización, propiedad de recursos ni uso efectivo de esas tablas. El frontend usa Zustand en memoria, por lo que la biblioteca de videos se pierde al refrescar la página. Las rutas no comprueban identidad ni autorización. Además, la API documenta endpoints de autenticación y CRUD que no están montados en el servidor actual [[9]](#9).

Antes de hablar de planes Free, Pro o Team, deben existir cuentas, persistencia, cuota medible y recuperación de proyectos. La tabla de monetización propone límites de videos, almacenamiento, equipos y API, pero ninguno de esos mecanismos está implementado [[10]](#10).

### 3.4. La generación es síncrona y frágil

El endpoint `POST /api/generate-video` espera a que termine todo el pipeline antes de responder. Un render puede tardar varios minutos, consumir CPU y bloquear capacidad del servidor. Aunque el frontend contiene polling, en la práctica el endpoint debe devolver el trabajo rápidamente para que el procesamiento ocurra en un worker. También falta cancelación, reintento por etapa, timeout, limpieza de temporales y control de concurrencia.

El progreso tampoco se actualiza de forma compartida durante la generación. El objeto interno cambia localmente, pero el `Map` de rutas no recibe actualizaciones por cada etapa. El usuario puede permanecer sin información mientras el servidor trabaja.

### 3.5. Existen fallos concretos en la experiencia de usuario

El componente de proveedor de IA coloca botones dentro de un formulario sin `type="button"`. En HTML, un botón dentro de un formulario puede actuar como submit por defecto; por tanto, cambiar de proveedor puede lanzar accidentalmente la generación. Debe corregirse de inmediato.

El frontend borra el formulario inmediatamente después de recibir respuesta, no ofrece previsualización del guion ni permite editar los pasos antes de renderizar. Los errores del polling se silencian, el usuario no recibe una explicación si el estado deja de actualizarse y no existe una acción de reintento. La tarjeta de video muestra una miniatura de reserva, pero no hay reproductor integrado, historial, duplicación, edición ni eliminación.

También hay detalles de calidad que reducen confianza: la interfaz muestra una referencia de GitHub distinta del repositorio auditado [[11]](#11), utiliza una mezcla de español e inglés, y presenta ComfyUI como opción visible aunque el pipeline únicamente imprime que queda para “futuras mejoras” [[5]](#5).

### 3.6. Seguridad, abuso y costos no están controlados

La API usa CORS abierto, acepta cuerpos JSON de hasta 50 MB, no impone autenticación, no limita solicitudes y no establece límites de duración, tamaño de texto, resolución o concurrencia. Un usuario anónimo podría disparar múltiples trabajos costosos de IA y render. Las claves de proveedores se manejan por variables de entorno, lo cual es correcto, pero falta una política de rotación, validación de configuración y protección contra filtraciones en logs.

Los comandos de FFmpeg y Manim se construyen como strings de shell. Aunque varios valores se generan internamente, esta estrategia debe sustituirse por ejecución con argumentos separados o una capa estricta de validación. También debe establecerse una lista permitida para calidad, FPS, resolución, identificadores y rutas de salida.

Durante la instalación reproducible se detectaron advertencias de dependencias obsoletas y `npm audit --omit=dev` reportó cuatro vulnerabilidades moderadas, relacionadas principalmente con `react-router` y `uuid` transitivo de Bull. El lint falla porque no existe configuración ESLint en ninguno de los workspaces. La compilación pasa, pero la cobertura automatizada es insuficiente: solo se localizó una prueba unitaria y el script raíz de test no ejecuta una suite real.

## 4. Decisión de producto recomendada

No recomiendo convertir inmediatamente este repositorio en un SaaS general para “cualquier video matemático”. Esa posición enfrenta productos que ya ofrecen entrada conversacional, galerías, historial, planes de pago y, en algunos casos, carga de imágenes o PDF [[12]](#12) [[13]](#13). Manim aporta calidad programática, pero es un motor y no una propuesta de valor completa [[14]](#14).

Recomiendo posicionarlo inicialmente como un **copiloto para docentes de matemáticas que crea microlecciones verificables y editables a partir de problemas estructurados**. La promesa debe ser más concreta:

> “Convierte una ecuación o concepto en una microlección matemática visual, revisa la solución, permite editar el guion y exporta un video accesible listo para clase.”

El producto debe ganar por confianza y control, no por cantidad de modelos de IA. El usuario objetivo inicial debería ser un profesor o tutor que necesita preparar explicaciones de 60 a 180 segundos, con solución correcta, narración, subtítulos, formato vertical u horizontal y una ficha de ejercicio asociada.

## 5. Plan de acción priorizado

| Prioridad | Acción | Resultado esperado | Criterio de aceptación |
|---|---|---|---|
| P0 | Corregir el flujo de generación y eliminar el “éxito simulado” en producción | El usuario nunca recibe una falsa confirmación | Si faltan Manim, FFmpeg, TTS o IA, se muestra un estado de configuración o error explícito; solo `completed` cuando existen MP4 y miniatura válidos. |
| P0 | Añadir validación Zod en backend | Contratos confiables y límites contra abuso | Se validan título, contenido, calidad, proveedor, tamaño máximo y valores permitidos; las entradas inválidas devuelven errores estructurados. |
| P0 | Sustituir el `Map` por persistencia y cola | Trabajos recuperables y escalables | `POST` devuelve 202 con `jobId`; un worker procesa; el estado persiste; un reinicio no borra el historial. |
| P0 | Implementar autenticación y propiedad de recursos | Base mínima multiusuario | Registro o proveedor OAuth, sesión segura, `userId` real y comprobación de que cada usuario solo ve sus videos. |
| P0 | Corregir bugs de UI | Flujo de creación predecible | Los botones de proveedor tienen `type="button"`; hay estados loading, error, reintento, cancelación y recuperación tras refrescar. |
| P1 | Introducir editor de guion y previsualización | El docente controla la explicación antes de pagar el render | Se pueden editar pasos, reordenarlos, ocultarlos y previsualizar texto/narración antes de generar el MP4. |
| P1 | Crear validadores matemáticos por dominio | Confianza pedagógica | Para al menos tres tipos de ejercicios se comprueba la respuesta con un motor simbólico y se guarda la verificación. |
| P1 | Añadir subtítulos y accesibilidad | Producto útil en aula y móvil | El video incluye archivo VTT, contraste suficiente, texto alternativo, controles de teclado y opción de desactivar narración. |
| P1 | Guardar archivos en almacenamiento durable | Descargas y enlaces estables | Los MP4, miniaturas y subtítulos se guardan en S3/R2 o equivalente; se eliminan por política y se generan URLs protegidas. |
| P1 | Incorporar reproductor y biblioteca | Retención y reutilización | El usuario puede ver, buscar, filtrar, duplicar, renombrar, descargar y eliminar videos. |
| P2 | Añadir formatos y plantillas didácticas | Diferenciación y mayor utilidad | Plantillas para álgebra, geometría, cálculo, explicación de error y examen; exportación 16:9, 9:16 y 1:1. |
| P2 | Medir costos y cuotas | Base real para Freemium | Cada trabajo registra tokens, tiempo CPU, tamaño, proveedor y costo estimado; se bloquea el exceso de cuota. |
| P2 | Añadir billing y equipos solo después del MVP | Monetización sostenible | Stripe, planes y permisos se implementan cuando haya usuarios que completen el flujo y métricas de retención. |
| P2 | Crear documentación viva y CI | Mantenimiento profesional | OpenAPI real, ESLint, tests, smoke tests y pipeline de GitHub que bloquee merges con build, test o lint fallido. |

## 6. Roadmap de 90 días

### Días 1–15: hacer que la demo sea honesta y repetible

Primero se deben corregir los botones del formulario, los errores de polling, la referencia incorrecta de GitHub y el manejo de estados. Después se añaden validación Zod, límites de entrada y un diagnóstico de dependencias visible. La generación simulada debe quedar únicamente detrás de un modo demo explícito. Al terminar esta etapa, una persona debe poder instalar el proyecto, generar un video real o recibir un error comprensible y reproducible.

### Días 16–35: convertir la generación en trabajos persistentes

Se debe elegir una sola estrategia de infraestructura para el MVP: PostgreSQL más Redis/Bull si se desea mantener la dirección actual, o una cola administrada equivalente. El endpoint debe responder 202, crear un registro, publicar un trabajo y actualizar estados por etapa. Se deben añadir reintentos, timeout, cancelación y limpieza. La tabla `Video` debe almacenar configuración, versión de plantilla, proveedor, errores, duración, tamaño y URLs.

### Días 36–55: construir la confianza pedagógica

Se debe limitar inicialmente el alcance matemático a tipos de problemas que puedan validarse. El pipeline debe generar una representación estructurada, no solo texto libre: problema, pasos, fórmulas, justificación, resultado y nivel. Un motor simbólico debe verificar las transformaciones cuando sea posible. La interfaz debe mostrar el guion y la solución antes del render, de modo que el docente pueda corregir una formulación.

### Días 56–75: entregar una experiencia completa de aula

Se debe añadir biblioteca persistente, reproductor, descarga de subtítulos, plantillas, formatos vertical/horizontal, miniatura editable y enlaces compartibles con permisos. La experiencia debe funcionar en móvil, con estados vacíos claros y accesibilidad básica. La narración debe tener selección de idioma y velocidad, no solamente activar o desactivar una voz local.

### Días 76–90: validar mercado antes de monetizar

Se debe probar el flujo con entre cinco y diez docentes o tutores reales. Las entrevistas y sesiones de uso deben medir tiempo hasta el primer video útil, porcentaje de videos aceptados sin edición, correcciones matemáticas, reintentos, descarga, compartición y retorno semanal. Solo si el usuario vuelve por la calidad pedagógica tiene sentido activar planes de pago, límites y billing. Las proyecciones financieras actuales deben considerarse hipótesis, no resultados esperados [[10]](#10).

## 7. Métricas de éxito recomendadas

| Métrica | Meta inicial | Por qué importa |
|---|---:|---|
| Tiempo hasta primer video válido | Menos de 5 minutos | Mide si la instalación y el flujo entregan valor rápidamente. |
| Generaciones que terminan con MP4 reproducible | Más de 95% | Mide confiabilidad real, no solo respuestas HTTP exitosas. |
| Soluciones matemáticas aceptadas sin corrección | Más de 90% en dominios acotados | Mide confianza pedagógica. |
| Usuarios que editan el guion antes de render | Registrarlo, no minimizarlo | Revela dónde la IA todavía necesita supervisión. |
| Reutilización a 7 días | Más de 30% de usuarios de prueba | Indica si el producto resuelve una tarea recurrente. |
| Costo promedio por video | Medido por proveedor y calidad | Determina si los planes son económicamente viables. |
| Incidencias de pérdida de trabajo | Cero en pruebas | La persistencia es requisito de confianza. |

## 8. Orden recomendado de implementación

La secuencia correcta es **confiabilidad → persistencia → corrección matemática → edición → accesibilidad → biblioteca → métricas → monetización**. Invertir ahora en más modelos, ComfyUI, app móvil o Enterprise sería prematuro: aumentaría la superficie del sistema sin resolver la razón principal por la que un docente podría abandonar el producto, que es no confiar en el resultado o perder su trabajo.

La decisión de continuar creando el proyecto sí puede valer la pena, pero con un cambio de enfoque. Como repositorio, ya tiene suficiente base para un MVP serio. Como producto, todavía necesita demostrar una ventaja concreta: que ahorra tiempo al docente y produce una explicación matemática correcta, revisable y reutilizable. Si se alcanza esa promesa en un dominio pequeño, el proyecto puede crecer; si se mantiene como una interfaz que llama a un LLM y renderiza texto con Manim, será fácil de probar pero difícil de justificar frente a alternativas existentes.

## Referencias

<a id="1"></a> [1] [README del repositorio](https://github.com/juanxaviercasa/math-video-generator/blob/main/README.md), descripción, stack y estado declarado del proyecto.

<a id="2"></a> [2] [Arquitectura documentada](https://github.com/juanxaviercasa/math-video-generator/blob/main/docs/ARCHITECTURE.md), visión de PostgreSQL, Redis, Bull, almacenamiento y autenticación.

<a id="3"></a> [3] [Rutas de video](https://github.com/juanxaviercasa/math-video-generator/blob/main/backend/src/routes/video.routes.ts), endpoint de generación y mapa de trabajos en memoria.

<a id="4"></a> [4] [Servicio de procesamiento](https://github.com/juanxaviercasa/math-video-generator/blob/main/backend/src/services/video-processing.service.ts), orquestación, usuario temporal y etapas del pipeline.

<a id="5"></a> [5] [Servicio de procesamiento multimedia](https://github.com/juanxaviercasa/math-video-generator/blob/main/backend/src/services/video-processing.service.ts), modo simulado cuando faltan dependencias.

<a id="6"></a> [6] [Servicio de IA](https://github.com/juanxaviercasa/math-video-generator/blob/main/backend/src/services/openai.service.ts), fallback de proveedores y generación de pasos/narración.

<a id="7"></a> [7] [Servicio de Manim](https://github.com/juanxaviercasa/math-video-generator/blob/main/backend/src/services/manim.service.ts), generación de scripts, detección matemática y render.

<a id="8"></a> [8] [Servicio TTS](https://github.com/juanxaviercasa/math-video-generator/blob/main/backend/src/services/tts.service.ts), PowerShell y espeak.

<a id="9"></a> [9] [Documentación API](https://github.com/juanxaviercasa/math-video-generator/blob/main/docs/API.md), endpoints aspiracionales de autenticación y CRUD no reflejados en las rutas actuales.

<a id="10"></a> [10] [Plan de monetización](https://github.com/juanxaviercasa/math-video-generator/blob/main/docs/MONETIZATION.md), planes, cuotas, hipótesis financieras y roadmap comercial.

<a id="11"></a> [11] [Interfaz principal](https://github.com/juanxaviercasa/math-video-generator/blob/main/frontend/src/App.tsx), referencia de GitHub mostrada en el footer.

<a id="12"></a> [12] [MathGPT AI Math Video Creator](https://math-gpt.org/tools/video), referencia externa revisada el 16 de agosto de 2026.

<a id="13"></a> [13] [NoteGPT AI Math Video Generator](https://notegpt.io/ai-math-video-generator), referencia externa revisada el 16 de agosto de 2026.

<a id="14"></a> [14] [Manim Community](https://www.manim.community/), descripción oficial del motor de animación matemática.
