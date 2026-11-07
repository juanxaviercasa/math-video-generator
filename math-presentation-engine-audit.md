# Auditoría y propuesta técnica: Math Presentation Engine

**Proyecto:** Math Video Generator  
**Rama auditada:** `improvements/production-mvp`  
**Commit auditado:** `d8212e3`  
**Alcance:** diagnóstico exhaustivo y diseño técnico. **No se implementa código en esta fase.**

## 1. Resumen ejecutivo

El sistema ya contiene un pipeline funcional para producir videos educativos: recibe un problema, lo valida parcialmente, construye pasos, genera un storyboard especial para cuadráticas, produce narración segmentada, renderiza escenas con Manim, ensambla y normaliza el video con FFmpeg, crea una miniatura y expone el resultado mediante una API REST. También dispone de autenticación Supabase, Prisma, perfiles de formato `16:9`, `1:1` y `9:16`, editor MathLive y una previsualización guiada en el frontend.

El problema principal no es la falta de herramientas de render, sino la ausencia de una capa intermedia formal que convierta una solución matemática semántica en un **plan visual medible**. Actualmente esa responsabilidad está distribuida entre `math-validation.service.ts`, `pedagogy.service.ts`, `synchronization.service.ts` y, sobre todo, interpolaciones imperativas dentro de `manim.service.ts`. Esa dispersión explica las inconsistencias observadas: tamaños arbitrarios, decisiones especiales por identificador de escena, escalados que pueden volver a agrandar grupos, falta de detección objetiva de colisiones y ausencia de un plan persistido que permita auditar o reparar un render.

La recomendación es crear un **Math Presentation Engine** entre la validación pedagógica y Manim. El motor debe recibir una estructura matemática semántica, producir un `VisualScenePlan` versionado, resolver restricciones de layout de forma determinista, generar diagnósticos objetivos y entregar a Manim una especificación ya validada. La IA puede asistir en interpretación, estilo y revisión semántica, pero no debe decidir por sí sola posiciones, tamaños, márgenes ni ausencia de overflow.

> Diagnóstico central: el renderer actual sabe dibujar escenas, pero todavía no existe un motor responsable de decidir qué debe mostrarse, en qué orden, con qué prioridad, dentro de qué límites y con qué evidencia de que la composición es válida.

## 2. Arquitectura actualmente implementada

La implementación real es una SPA React/Vite que consume una API Express/TypeScript. La ruta `POST /api/generate-video` valida la entrada con Zod, crea un job, construye un directorio temporal y delega a `videoProcessing.generateVideo()`. La ruta `POST /api/preview` valida el problema y devuelve pasos, validación y perfil de formato. La biblioteca requiere autenticación y consulta videos persistidos mediante Prisma.

La arquitectura documentada en `docs/ARCHITECTURE.md` describe Redis, Bull, S3/R2, WebSockets y una autenticación JWT con `localStorage`; esa descripción está desactualizada respecto al código actual. El job real está en `job.service.ts`, donde se utilizan dos `Map` en memoria y `setImmediate()`. Prisma persiste parcialmente el estado cuando existe un usuario real, pero no hay cola durable, worker separado, reintentos, backoff ni recuperación después de reiniciar el proceso. Los archivos se sirven desde `os.tmpdir()` mediante `/media`, no desde S3/R2.

| Capa | Implementación real | Estado frente al Math Presentation Engine |
|---|---|---|
| Frontend | React 18, Vite, Tailwind, Zustand, Axios, MathLive | Tiene formulario, editor y preview; no consume un plan visual real |
| API | Express + Zod | Contrato de generación válido, pero sin `presentationPlanId` ni diagnósticos |
| Persistencia | Prisma + PostgreSQL/Supabase | Solo `User` y `Video`; no guarda escenas, restricciones, QA ni reparaciones |
| Jobs | `Map` en memoria + `setImmediate` | Adecuado para MVP local; insuficiente para un SaaS multiworker |
| Solución matemática | Validador determinista de cuadráticas | Correcto para un caso; devuelve texto plano, no AST |
| Pedagogía | Storyboard especializado para cuadráticas | Útil y probado; acoplado a una familia de problemas |
| Layout | Heurísticas dentro de `manim.service.ts` | Principal fuente de inconsistencias |
| Render | Manim con script Python generado dinámicamente | Reutilizable, pero recibe decisiones ya mezcladas con render |
| Exportación | FFmpeg con escala, padding, H.264 y AAC | Buena base; debe recibir un contrato de exportación versionado |
| TTS | edge-tts con fallback local y timeouts | Funcional y sincronizado por segmento; proveedor externo no determinista |
| QA visual | Inspección manual y checks de artefactos | Falta un motor objetivo de bounding boxes, overflow y colisiones |

## 3. Pipeline de generación real

El flujo actual observado es el siguiente:

```text
Math problem + options
        |
        v
videoGenerationSchema.safeParse()
        |
        v
validateMathProblem()
        |
        +--> unsupported/general -> OpenAI steps or requested steps
        |
        +--> valid quadratic -> validation.steps + buildQuadraticStoryboard()
                                      |
                                      v
                             SynchronizedScene[]
                                      |
                                      v
                         per-scene TTS + duration measurement
                                      |
                                      v
                         manim.generatePythonScript()
                                      |
                                      v
                                  Manim render
                                      |
                                      v
                              FFmpeg scale/pad
                                      |
                                      v
                          concatenate/mux narration
                                      |
                                      v
                         thumbnail + ffprobe validation
                                      |
                                      v
                          temporary media URL + Prisma job
```

### 3.1 Entrada y validación

`video.schema.ts` limita el contenido a 10.000 caracteres, permite hasta 12 pasos y define `quality`, `aspectRatio`, `layoutDensity`, `narrationStyle`, `enableNarration`, `aiProvider` y `enableComfyUI`. El esquema es estricto, lo cual debe conservarse.

`math-validation.service.ts` solo reconoce ecuaciones cuadráticas en una forma textual equivalente a `ax^2 + bx + c = 0`. Extrae `a`, `b`, `c`, calcula el discriminante y raíces, y devuelve una lista de frases. Esta salida es suficiente para una demo determinista, pero no conserva operadores, subexpresiones, dependencias ni evidencias de verificación.

### 3.2 Estructuración pedagógica

`pedagogy.service.ts` crea diez escenas especializadas para cuadráticas: gancho, coeficientes, preparación del discriminante, cálculo, fórmula simbólica, sustitución, simplificación, ramas, gráfica y recapitulación. La mejora reciente añade `VisualStage` con etiqueta y fórmula para mostrar fórmula base, reemplazo, operación y resultado.

La ventaja de este servicio es su claridad pedagógica. Su límite arquitectónico es que la escena decide directamente el texto, el LaTeX, el layout y la duración. No existe una separación formal entre **qué significa matemáticamente el paso** y **cómo se debe presentar visualmente**.

### 3.3 Sincronización y narración

`synchronization.service.ts` ofrece un fallback genérico con `SynchronizedScene`, oralización básica y duración estimada por conteo de palabras. La ruta cuadrática utiliza el storyboard especializado. `video-processing.service.ts` genera un archivo de audio por escena, mide su duración con FFprobe y actualiza la duración efectiva de la escena antes de renderizar Manim.

`openai.service.ts` puede solicitar pasos a OpenRouter, Gemini u OpenAI con temperatura `0.7`, y después usa fallbacks deterministas. Por tanto, el sistema tiene una frontera de no determinismo clara: la interpretación o redacción LLM puede variar; el cálculo matemático y el layout futuro deberían ser reproducibles a partir de una estructura normalizada.

### 3.4 Render y exportación

`manim.service.ts` genera un script Python completo mediante strings. Calcula perfiles de cámara, tamaños de panel, posiciones, tamaños de fuente y arreglos directamente dentro de la función `generatePythonScript()`. Hay ramas especiales por `pedScene.layout`, por identificadores como `coefficients` y `solution-branches`, y por la cantidad de `visualStages`.

El renderer actual ya admite cámara explícita y formatos responsive. Sin embargo, su responsabilidad es demasiado amplia: parsea texto matemático, decide composición, crea objetos Manim, aplica escalado y descubre el MP4 generado. El futuro motor debe extraer de aquí todas las decisiones de composición y dejar a Manim como adaptador de ejecución.

`ffmpeg.service.ts` aplica escala con `force_original_aspect_ratio=decrease` y padding, define FPS, bitrate, H.264 y AAC, concatena audio PCM, mezcla la narración y extrae miniaturas. Esta capa es reutilizable, pero el padding negro no debe ocultar errores de layout interno; debe quedar reservado como fallback de exportación, no como solución visual.

## 4. Problemas arquitectónicos que provocan la inconsistencia

### 4.1 No existe un Math AST

La solución actual se reduce pronto a frases como `Calculamos el discriminante...` o a arrays de strings LaTeX. Eso impide que el sistema sepa objetivamente qué parte de una fórmula corresponde a `b²`, `4ac`, numerador, denominador, raíz o resultado. Sin esa semántica no puede resaltar el término que se está reemplazando ni dividir una ecuación de forma inteligente.

### 4.2 El storyboard mezcla pedagogía y geometría

`PedagogicalScene` combina `narrationText`, `visualLatex`, `visualTextLines`, `emphasis` y `layout`. Un cambio educativo termina modificando el renderer y un cambio de formato termina modificando el storyboard. Esta mezcla produce ramas especiales y dificulta probar cada responsabilidad de forma aislada.

### 4.3 Layout imperativo y heurístico

El código usa valores como `font_size=34`, `move_to(DOWN * 0.42)`, `buff=0.30` y escalados específicos por tipo de escena. Son útiles como defaults de un prototipo, pero no constituyen un sistema de restricciones. Algunos escalados anteriores podían limitar la altura y volver a agrandar el grupo al limitar el ancho; el problema solo se detectó mediante inspección de frames.

### 4.4 No se calculan diagnósticos objetivos de composición

No existe un objeto que registre bounding boxes, área disponible, margen consumido, colisiones, densidad, overflow, ratio de contraste o jerarquía. La validación final solo comprueba que existan MP4, miniatura y duración positiva. Un video puede completar correctamente y aun así tener texto cortado o superpuesto.

### 4.5 El plan visual no es persistido

El modelo Prisma `Video` guarda contenido, estado, URLs y duración, pero no guarda AST, storyboard, layout plan, versión del design system, diagnósticos, imágenes de QA, reparación aplicada ni hash de entrada. Esto impide reproducibilidad forense y comparación entre renders.

### 4.6 Cola no durable

Aunque `bull` y `redis` aparecen en `backend/package.json`, el servicio real no los utiliza. La ejecución ocurre en el mismo proceso del API. Un reinicio pierde jobs en memoria; dos instancias no comparten estado; no hay prioridad, concurrencia controlada, reintentos ni cancelación robusta. Esto será especialmente problemático cuando el motor agregue render, QA multimodal y reparaciones.

### 4.7 Documentación y contrato API desactualizados

`docs/API.md` describe endpoints `/videos`, JWT en header y respuestas paginadas que no coinciden con la implementación actual centrada en `/api/generate-video`, `/api/preview`, polling por estado y cookies HttpOnly. `docs/ARCHITECTURE.md` también describe componentes no conectados. Antes de abrir una API nueva para el Presentation Engine se debe establecer una especificación versionada y eliminar la ambigüedad documental.

### 4.8 KaTeX no interviene actualmente

El frontend incluye MathLive, pero no `katex`, MathJax ni una librería equivalente de render de fórmulas. La composición final se produce principalmente con MathTex/Manim en backend. La propuesta debe distinguir claramente entre edición web, preview web y render final de video.

### 4.9 Preview no es una representación del render

`InteractiveLessonPreview.tsx` usa cuatro etapas fijas y una parábola SVG hard-coded para raíces 2 y 3. No consume el storyboard real ni el plan visual calculado por backend. Eso puede crear una promesa de interfaz diferente de lo que finalmente aparece en el MP4.

## 5. Componentes reutilizables, modificables y protegibles

| Tratamiento | Componentes | Motivo |
|---|---|---|
| Reutilizar | `math-validation.service.ts`, `ffmpeg.service.ts`, `tts.service.ts`, `video-format.service.ts`, auth Supabase/Prisma, rate limiting | Ya resuelven capacidades valiosas y tienen pruebas o comportamiento validado |
| Adaptar | `pedagogy.service.ts`, `synchronization.service.ts`, `video-processing.service.ts`, `video.routes.ts`, `VideoGenerator.tsx` | Deben consumir y exponer AST, plan visual, versión y diagnósticos |
| Extraer | bloques de composición de `manim.service.ts` | Deben convertirse en renderer/adaptadores, no continuar como centro de decisión |
| Crear | `math-ast`, `pedagogical-planner`, `presentation-engine`, `layout-engine`, `constraint-engine`, `visual-qa`, `repair-engine`, contratos versionados | No hay equivalentes actuales |
| No tocar inicialmente | autenticación, migraciones Supabase existentes, servicio TTS base, exportación H.264/AAC | Reducir superficie de regresión mientras se estabiliza el motor visual |
| Revisar después | Redis/Bull, almacenamiento de objetos, WebSockets/SSE, documentación API | Son necesarios para producción, pero no deben bloquear el primer motor determinista |

## 6. Arquitectura propuesta: Math Presentation Engine

La arquitectura propuesta introduce una frontera explícita entre solución matemática, pedagogía, presentación y render.

```text
MathProblemInput
       |
       v
MathParser / Validator
       |
       v
MathematicalSolutionStructure (AST + proof/evidence)
       |
       v
PedagogicalPlanner
       |
       v
VisualScenePlan (semantic blocks + timing + priority)
       |
       v
LayoutEngine + ConstraintEngine
       |
       v
ValidatedLayoutPlan + diagnostics
       |
       +--> deterministic Visual QA
       |
       +--> optional multimodal semantic reviewer
       |
       v
Renderer Adapter (Manim / SVG / Web preview)
       |
       v
FFmpeg Export
       |
       v
Final QA + artifact manifest + audit trail
```

El motor debe ser independiente de Manim. Manim sería el primer adaptador de render, mientras que el frontend podría consumir el mismo `VisualScenePlan` para mostrar una preview web honesta. Esa decisión elimina la divergencia entre lo que el usuario ve antes de generar y lo que se renderiza después.

## 7. Diseño de módulos solicitado

### A. Math AST / estructura semántica

El AST debe representar expresiones y transformaciones, no frases. Una forma inicial sería:

```ts
type MathNode =
  | { kind: 'number'; value: number; display: string }
  | { kind: 'variable'; name: string }
  | { kind: 'power'; base: MathNode; exponent: MathNode }
  | { kind: 'sum'; terms: MathNode[] }
  | { kind: 'product'; factors: MathNode[] }
  | { kind: 'fraction'; numerator: MathNode; denominator: MathNode }
  | { kind: 'radical'; radicand: MathNode }
  | { kind: 'equation'; left: MathNode; right: MathNode };

interface SolutionStep {
  id: string;
  operation: 'identify' | 'substitute' | 'expand' | 'multiply' | 'simplify' | 'solve' | 'verify';
  before: MathNode;
  after: MathNode;
  substitutions: Array<{ symbol: string; value: MathNode }>;
  explanation: string;
  evidence?: string[];
}

interface MathematicalSolutionStructure {
  problemId: string;
  parserVersion: string;
  problem: MathNode;
  entities: Record<string, MathNode>;
  steps: SolutionStep[];
  result: MathNode;
  warnings: string[];
}
```

El parser determinista debe producir un AST para los tipos soportados. Si un problema no se puede parsear, debe devolver una estructura `unsupported` explícita y no fingir que una lista LLM equivale a una solución verificada.

### B. Visual Scene Specification

```ts
interface VisualSceneSpec {
  id: string;
  purpose: 'hook' | 'identify' | 'substitute' | 'operate' | 'simplify' | 'solve' | 'verify' | 'recap';
  durationPolicy: { min: number; max: number; source: 'tts' | 'fixed' | 'hybrid' };
  blocks: VisualBlockSpec[];
  narration: { text: string; emphasisTokens?: string[] };
  transition: { enter: string; exit: string };
  priority: 'primary' | 'secondary' | 'supporting';
}

interface VisualBlockSpec {
  id: string;
  semanticRole: 'formula-base' | 'substitution' | 'operation' | 'result' | 'caption' | 'chart' | 'badge';
  content: MathNode | string | ChartSpec;
  styleToken: string;
  anchor: 'header' | 'center' | 'top' | 'bottom' | 'left' | 'right';
  minReadableSize: number;
  maxLines?: number;
  canSplit: boolean;
  priority: number;
}
```

La escena debe declarar qué se está enseñando y qué papel cumple cada bloque. De ese modo, la fórmula de origen puede permanecer arriba mientras el bloque de sustitución se resalta debajo, sin que el renderer tenga que deducirlo desde un array de strings.

### C. Design System matemático

El sistema de diseño debe tener tokens versionados: colores para referencia, sustitución, operación y resultado; familias tipográficas; tamaños por escala; grosor de fracción; espaciado; radios; bordes; contraste mínimo; estilos para gráfica; y reglas de énfasis. El token debe depender del formato y densidad, no de identificadores de escenas.

```ts
interface MathDesignTokens {
  version: string;
  colors: { background: string; reference: string; active: string; result: string; muted: string };
  typography: { title: number; stageLabel: number; reference: number; active: number; result: number; caption: number };
  spacing: { panel: number; block: number; stage: number; caption: number };
  minContrastRatio: number;
  safeMargin: number;
}
```

### D. Layout Engine

El Layout Engine recibe bloques semánticos y un `CanvasSpec`, mide tamaños reales o estimados, genera candidatos de distribución y selecciona el mejor layout válido. No debe conocer los detalles de HTTP ni de TTS.

El algoritmo inicial debe ser determinista: medir texto/fórmulas, escoger una plantilla por propósito, colocar según anchors, escalar con `min(widthFactor, heightFactor)`, verificar restricciones y probar plantillas alternativas si falla. Para ecuaciones largas debe dividir por grupos semánticos, no por caracteres arbitrarios.

### E. Constraint Engine

Debe convertir reglas de diseño en restricciones evaluables:

```ts
interface LayoutConstraint {
  id: string;
  type: 'inside-safe-frame' | 'no-overlap' | 'min-readable-size' | 'max-density' | 'aligned' | 'timing-match';
  severity: 'error' | 'warning';
  blocks: string[];
  evaluate(layout: ResolvedLayout): ConstraintResult;
}
```

Las restricciones duras deben bloquear el render: cualquier overflow, bloque fuera del panel, tamaño mínimo incumplido o colisión grave. Las restricciones blandas deben producir warnings para revisión.

### F. Collision Detection

Cada bloque resuelto debe tener `BoundingBox` en unidades del canvas y, opcionalmente, en píxeles. La detección inicial puede usar AABB; para grupos rotados o gráficas se debe añadir una caja conservadora. El engine debe reportar pares, intersección, área y severidad.

### G. Overflow Detection

Se debe comparar cada bounding box contra el `safeFrame`, no solo contra el frame completo. El resultado debe incluir cuánto excede cada lado, en unidades absolutas y porcentaje.

```ts
interface OverflowDiagnostic {
  blockId: string;
  left: number;
  right: number;
  top: number;
  bottom: number;
  exceeded: boolean;
}
```

### H. Visual Density Analysis

La densidad no debe medirse solo por número de objetos. Debe combinar área ocupada, número de líneas, jerarquía, longitud de texto, cantidad de fórmulas activas y contraste. Un umbral inicial puede producir `comfortable`, `compact` y `overloaded`, pero debe ser configurable por formato.

### I. Visual Hierarchy System

Cada escena debe tener exactamente un bloque primario y un máximo controlado de bloques secundarios. La fórmula de referencia debe tener menor escala y color neutro; el paso activo debe tener mayor prioridad; el resultado debe usar color de confirmación y espacio negativo. La narración debe referirse al bloque activo mediante IDs semánticos, no solo mediante texto libre.

### J. Scene Splitting

El planner debe dividir una escena cuando se cumpla cualquiera de estas condiciones: más de un bloque primario, más de `N` líneas, densidad superior al umbral, fórmula activa bajo el tamaño mínimo o narración más larga que el tiempo legible. La división debe conservar continuidad narrativa y declarar `previousSceneId` y `nextSceneId`.

### K. Formula Scaling

El escalado debe usar un único factor conservador:

```text
scale = min(
  availableWidth / measuredWidth,
  availableHeight / measuredHeight,
  readabilityCap
)
```

No se debe encadenar `scale_to_fit_height()` y `scale_to_fit_width()` si una segunda operación puede agrandar el grupo. El tamaño mínimo debe ser una restricción explícita; si no se cumple, el planner debe dividir la fórmula o crear otra escena.

### L. Chart/Image Boundary Management

Las gráficas deben ser bloques medidos con un bounding box propio. Ejes, etiquetas, curva, puntos y leyenda deben estar dentro de un `ChartFrame`. El engine debe reservar espacio para etiquetas antes de calcular el tamaño del gráfico. Ninguna gráfica debe usar dimensiones fijas independientes del `CanvasSpec`.

### M. Visual QA Engine

El QA determinista debe ejecutar después de resolver el layout y después del render. Antes del render verifica geometría; después del render puede extraer frames representativos y comparar metadatos, frames negros, proporción, duración y presencia de contenido. Debe producir un `VisualQAReport` versionado.

```ts
interface VisualQAReport {
  engineVersion: string;
  sceneReports: Array<{
    sceneId: string;
    constraints: ConstraintResult[];
    density: number;
    blackFrameRatio?: number;
    sampleFrames?: string[];
  }>;
  errors: string[];
  warnings: string[];
  passed: boolean;
}
```

### N. AI Multimodal Visual Reviewer

La IA multimodal debe ser secundaria y explícita. Debe recibir frames con su `sceneId`, propósito, texto narrado y diagnóstico geométrico. Sus preguntas deben estar cerradas y estructuradas: ¿se entiende qué valor se sustituye?, ¿el resultado destaca?, ¿hay una superposición semántica?, ¿la gráfica corresponde al texto? No debe sustituir el detector geométrico.

Su salida debe ser JSON validado por Zod, con confianza y evidencia visual. La IA no debe poder modificar directamente un script; debe proponer un `RepairAction` permitido por catálogo.

### O. Automatic Repair Loop

El loop debe ser acotado y reproducible:

```text
plan -> resolve -> deterministic QA
  if pass: render
  if fail: choose allowed repair
       -> resolve again
       -> deterministic QA
  after max 3 attempts: mark failed + preserve diagnostics
render -> sampled visual QA
  if semantic issue: optional multimodal review
       -> allowed repair or human review
```

Las reparaciones permitidas inicialmente deben ser: reducir escala, cambiar plantilla, aumentar separación, dividir escena, mover bloque a anchor alternativo, reducir texto auxiliar y ocultar elementos secundarios. Cada reparación debe guardar su razón, parámetros y resultado.

### P. Regression Testing

Cada fixture matemático debe generar una estructura esperada, un plan visual esperado y restricciones verificables. Los snapshots de layout deben ser JSON, no solo imágenes. Las imágenes pueden complementar con golden frames por formato. Cada cambio del Design System debe ejecutar fixtures en 16:9, 1:1 y 9:16.

## 8. Contratos entre módulos

```ts
interface CanvasSpec {
  aspectRatio: '16:9' | '1:1' | '9:16';
  width: number;
  height: number;
  frameWidth: number;
  frameHeight: number;
  safeFrame: BoundingBox;
  density: 'comfortable' | 'compact';
}

interface PresentationRequest {
  problem: string;
  solution: MathematicalSolutionStructure;
  narrationStyle: 'warm_teacher' | 'neutral_teacher';
  canvas: CanvasSpec;
  designVersion: string;
}

interface PresentationPlan {
  engineVersion: string;
  designVersion: string;
  solutionHash: string;
  scenes: VisualSceneSpec[];
  canvas: CanvasSpec;
  diagnostics: LayoutDiagnostic[];
}

interface ResolvedSceneLayout {
  sceneId: string;
  blocks: Array<{
    blockId: string;
    bbox: BoundingBox;
    scale: number;
    position: { x: number; y: number };
    visibleFrom: number;
    visibleUntil: number;
  }>;
  diagnostics: LayoutDiagnostic[];
}
```

El backend debería exponer inicialmente un endpoint interno o administrativo `POST /api/presentation/preview` que devuelva `PresentationPlan`, `ResolvedSceneLayout` y diagnósticos. El frontend debe consumir ese mismo plan para la preview y para la solicitud de render; no debe mantener una parábola hard-coded ni una lista de etapas desconectada.

## 9. Persistencia propuesta

El modelo `Video` actual debe conservarse durante la migración, pero agregarse una relación o tablas nuevas:

```text
PresentationPlan
  id, videoId, engineVersion, designVersion, solutionHash, canvasJson, planJson, createdAt

PresentationScene
  id, planId, sceneIndex, purpose, narrationText, duration, specJson, resolvedLayoutJson

VisualDiagnostic
  id, sceneId, severity, type, blockId, payloadJson, repairAttempt, createdAt

RenderArtifact
  id, videoId, kind, pathOrUrl, codec, width, height, duration, checksum
```

No se recomienda guardar únicamente JSON sin versionado. Cada plan debe poder reproducirse con la misma entrada, versión del parser, versión del engine y tokens de diseño.

## 10. Estrategia de pruebas

| Nivel | Prueba | Criterio |
|---|---|---|
| Parser | AST para cuadráticas, fracciones, raíces, signos y casos inválidos | AST estable y advertencias explícitas |
| Pedagogía | Orden de micro-pasos y correspondencia narración-bloque | Cada frase apunta a un bloque existente |
| Layout | Fixtures por formato y densidad | Sin overflow ni colisiones duras |
| Escalado | Fórmulas cortas, largas y multilínea | Tamaño dentro de min/max y sin segunda ampliación accidental |
| Gráficas | Ejes, etiquetas, raíces, leyenda | Todo dentro de `ChartFrame` |
| QA | Frames negros, metadata, duración y proporción | Reporte reproducible y fallos bloqueantes |
| Reparación | Fallos sintéticos de overflow y densidad | Reparación válida en máximo tres intentos |
| Integración | API preview y render | Preview y MP4 comparten `planHash` |
| Regresión | Golden JSON + frames representativos | Cambios visuales intencionales y revisables |
| Operación | Reinicio de worker, duplicación, reintentos | Jobs durables y estados consistentes |

Fixtures iniciales recomendados: `x² − 5x + 6 = 0`, discriminante negativo, coeficiente `a` negativo, fracciones, raíces no enteras, fórmula larga, problema no soportado, formato 16:9, 1:1 y 9:16.

## 11. Riesgos y mitigaciones

| Riesgo | Impacto | Mitigación |
|---|---|---|
| Scope creep hacia un CAS completo | Muy alto | Empezar con cuadráticas y un AST pequeño, versionado y extensible |
| Medir LaTeX antes de renderizar | Alto | Medir con SVG/DVI o cajas conservadoras; validar también post-render |
| Diferencias Manim/preview web | Alto | Ambos consumen `PresentationPlan`; adaptadores separados |
| IA genera pasos matemáticamente incorrectos | Crítico | Parser/validator determinista y evidencia; LLM solo propone texto |
| Reparación automática degrada pedagogía | Alto | Catálogo de repairs, máximo 3 iteraciones y snapshots |
| Jobs en memoria pierden renders | Crítico | Separar API y worker durable antes del lanzamiento multiusuario |
| Archivos temporales expuestos | Alto | Storage de objetos con URLs firmadas y limpieza por TTL |
| Crecimiento de MathLive bundle | Medio | Carga diferida, análisis de chunks y revisión de licencia |
| Cambios visuales difíciles de revisar | Medio | Golden frames, snapshots JSON y reporte por escena |
| Documentación desfasada | Medio | OpenAPI generado desde contratos y actualización en cada release |

## 12. Estrategia de implementación incremental

### Fase 0: contrato y observabilidad

No cambiar todavía el resultado visual. Crear tipos versionados, hashes de entrada, registro de engine/design version y métricas de escena. Persistir el plan legado como `legacyPlan` para comparar.

### Fase 1: AST de cuadráticas

Convertir el resultado actual de `math-validation.service.ts` en `MathematicalSolutionStructure`, conservando `MathValidation` como adaptador de compatibilidad. Añadir fixtures y snapshots.

### Fase 2: planner pedagógico

Extraer la lógica de `pedagogy.service.ts` a un planner que produzca `VisualSceneSpec`. El storyboard existente debe convertirse en una plantilla, no desaparecer. Cada bloque debe tener `semanticRole` y `priority`.

### Fase 3: layout determinista

Crear `CanvasSpec`, tokens, medición, anchors, restricciones, colisiones y overflow. Inicialmente soportar las plantillas actuales: hero, card, split, equation, graph y recap.

### Fase 4: adapter Manim

Hacer que `manim.service.ts` consuma `ResolvedSceneLayout`. El renderer ya no debe decidir qué bloques existen ni aplicar heurísticas por identificador; únicamente traducirá bloques a objetos Manim y animaciones.

### Fase 5: preview web honesta

Reemplazar el SVG hard-coded y las cuatro etapas fijas por el mismo `PresentationPlan`. MathLive seguirá siendo el editor de entrada; la preview mostrará bloques, orden, duración y warnings reales.

### Fase 6: QA y reparación

Ejecutar QA determinista antes y después del render. Añadir frames de referencia y reparar automáticamente solo cambios permitidos. Integrar el revisor multimodal después de que las reglas objetivas sean estables.

### Fase 7: operación SaaS

Mover jobs a una cola durable con worker separado, almacenar artefactos en objeto con URLs firmadas, persistir planes/diagnósticos, añadir cancelación/reintentos y sustituir polling por SSE/WebSocket cuando la infraestructura lo justifique.

## 13. Definición de éxito

El Math Presentation Engine estará listo para producción cuando, para cada render soportado, pueda responder de forma auditable:

1. Qué estructura matemática se resolvió y con qué versión de parser.
2. Qué escenas se planificaron y por qué.
3. Qué fórmula de origen acompaña a cada sustitución.
4. Qué bloques estaban visibles durante cada frase de narración.
5. Qué tamaño, posición y escala recibió cada bloque.
6. Qué restricciones se evaluaron y cuáles se incumplieron.
7. Qué reparaciones se ejecutaron, si hubo alguna.
8. Qué frames y metadatos validaron el resultado final.
9. Qué versión de engine, design system y renderer produjo el MP4.
10. Si el resultado de preview y el video final proceden del mismo plan.

## 14. Conclusión

La base actual es suficiente para evolucionar sin reescribir todo el producto. La prioridad no debe ser añadir más excepciones a `manim.service.ts`, sino extraer las decisiones de presentación a un motor independiente, determinista y versionado. El trabajo reciente de formatos responsive, `VisualStage`, voz segmentada y storyboard de cuadráticas proporciona buenos componentes iniciales; el siguiente salto de calidad consiste en convertirlos en contratos semánticos, restricciones y diagnósticos reutilizables.

La recomendación inmediata es **no implementar todavía reparaciones multimodales ni ampliar a muchas familias matemáticas**. Primero debe construirse el contrato `MathematicalSolutionStructure → PresentationPlan → ResolvedLayout`, probarlo con cuadráticas en los tres formatos y demostrar que preview, render y QA comparten exactamente el mismo plan.

## Archivos inspeccionados

- `backend/src/routes/video.routes.ts`
- `backend/src/schemas/video.schema.ts`
- `backend/src/services/job.service.ts`
- `backend/src/services/math-validation.service.ts`
- `backend/src/services/pedagogy.service.ts`
- `backend/src/services/synchronization.service.ts`
- `backend/src/services/video-processing.service.ts`
- `backend/src/services/manim.service.ts`
- `backend/src/services/ffmpeg.service.ts`
- `backend/src/services/openai.service.ts`
- `backend/prisma/schema.prisma`
- `frontend/package.json`
- `docs/API.md`
- `docs/ARCHITECTURE.md`

## Referencias externas

No se requirieron fuentes web externas para este diagnóstico; las conclusiones se basan en la inspección directa del repositorio y de los artefactos de render existentes.
