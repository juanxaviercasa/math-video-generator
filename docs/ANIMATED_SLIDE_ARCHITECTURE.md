# Arquitectura de diapositivas animadas pedagógicas

## Idea central

El producto dejará de tratar el video como una secuencia monolítica y lo modelará como una **presentación animada**. Cada diapositiva representa una idea pedagógica estable; dentro de ella ocurren microeventos temporales como escribir una fórmula, resaltar un coeficiente, revelar una sustitución, pausar para predecir o mostrar una comprobación.

> Una diapositiva es una unidad de comprensión; una secuencia es una unidad de tiempo; el video es una exportación de la presentación completa.

El solver y el `LessonTimeline` continúan siendo la fuente de verdad. Remotion será responsable de componer las diapositivas y sus transiciones; Manim seguirá aportando las fórmulas y gráficas matemáticas de precisión cuando corresponda.

## Modelo conceptual

```text
Problema validado
  ↓
Storyboard + LessonTimeline
  ↓
AnimatedSlide[]
  ├── contenido matemático
  ├── fórmula de referencia
  ├── microeventos
  ├── checkpoints
  ├── narración asociada
  └── reglas de transición
       ↓
Presentación animada
  ├── preview navegable
  ├── exportación MP4
  ├── imágenes por diapositiva
  └── storyboard JSON auditable
```

## Contrato de diapositiva

El contrato inicial será deliberadamente pequeño y compatible con `LessonTimeline`:

```ts
export type AnimatedSlideKind =
  | 'hook'
  | 'concept'
  | 'worked_step'
  | 'checkpoint'
  | 'graph'
  | 'verification'
  | 'summary';

export interface SlideCue {
  id: string;
  kind: 'enter' | 'write' | 'highlight' | 'transform' | 'hold' | 'reveal' | 'exit';
  targetId: string;
  startSeconds: number;
  durationSeconds: number;
  from?: string;
  to?: string;
  narrationEventId?: string;
}

export interface AnimatedSlide {
  id: string;
  index: number;
  kind: AnimatedSlideKind;
  title: string;
  objective?: string;
  durationSeconds: number;
  narrationSegmentId?: string;
  formulaAnchorIds: string[];
  visualBlocks: Array<{
    id: string;
    type: 'formula' | 'text' | 'badge' | 'graph' | 'callout' | 'progress';
    content: string;
    latex?: string;
    role?: 'context' | 'data' | 'operation' | 'result' | 'verification' | 'reflection';
    position: 'top' | 'center' | 'side' | 'bottom';
  }>;
  cues: SlideCue[];
  checkpointId?: string;
  transition: 'cut' | 'crossfade' | 'push' | 'morph';
}

export interface AnimatedDeck {
  id: string;
  problem: string;
  format: '16:9' | '1:1' | '9:16';
  narrationStyle: 'warm_teacher' | 'neutral_teacher';
  slides: AnimatedSlide[];
  sourceTimelineId?: string;
  totalDurationSeconds: number;
}
```

## Mapeo desde `LessonTimeline`

Cada `NarrationSegment` se convierte inicialmente en una diapositiva principal. Sus `VisualEvent` se convierten en `SlideCue`. Los `FormulaAnchor` pasan a ser bloques persistentes y los `PedagogicalCheckpoint` pasan a ser diapositivas o subestados de pausa según su duración. No se crea un segundo reloj: todos los offsets se conservan relativos al segmento original.

| Timeline | Diapositiva animada |
|---|---|
| `NarrationSegment` | `AnimatedSlide` |
| `VisualEvent` | `SlideCue` |
| `FormulaAnchor` | bloque `formula` persistente |
| `PedagogicalCheckpoint` | `checkpointId` y cue de pausa |
| `pedagogicalStep` | `kind`, objetivo y jerarquía |
| `durationSeconds` | duración de la diapositiva |
| `lessonMode` | perfil editorial y densidad |

## Ejemplo de la demo cuadrática

La demo se organizará como siete diapositivas comprensibles, no como una sucesión de pantallas arbitrarias:

| Orden | Diapositiva | Idea que debe comprender el estudiante |
|---:|---|---|
| 1 | Hook | Existe una ruta clara y no se saltarán pasos |
| 2 | Identificación | `a`, `b` y `c` tienen valores concretos |
| 3 | Referencia | La fórmula de la discriminante permanece visible |
| 4 | Sustitución | Los valores aparecen dentro de la fórmula antes de operar |
| 5 | Cálculo | Cada operación tiene su propio momento visual |
| 6 | Solución | La fórmula general conduce a dos raíces |
| 7 | Verificación | Las raíces se comprueban algebraica o gráficamente |

Una diapositiva puede contener varias cues, pero no debe competir con otra idea central. La transición entre diapositivas será un recurso editorial; no reemplazará las transformaciones matemáticas necesarias.

## Salidas del sistema

La misma presentación deberá poder producir cuatro salidas sin reconstruir el contenido:

| Salida | Uso |
|---|---|
| Preview navegable | Revisión humana, edición de props y selección de formato |
| MP4 narrado | Distribución en redes y aula |
| PNG por diapositiva | Miniaturas, carruseles y materiales didácticos |
| JSON auditable | QA, debugging, analítica y regeneración determinista |

## Reglas de calidad

Una presentación no se aprueba si una diapositiva queda vacía mientras habla el audio, si una fórmula persistente desaparece antes de la operación, si una transición oculta el resultado sin intención pedagógica, si una pausa no tiene propósito, si los bloques salen de la safe area o si el exportador inventa una operación que no existe en el timeline.

La ruta estable se conserva con `NARRATION_TIMELINE=false`. El piloto de diapositivas se ejecutará detrás de `ANIMATED_SLIDES_PREVIEW=false` y `ANIMATED_SLIDES_COMPOSITOR=false`. Ningún cambio visual se promoverá a producción sin render real y comparación contra el baseline.

## Evolución posterior

La primera versión será una presentación animada renderizada por Remotion. Después podrá añadirse un reproductor con navegación por diapositiva, edición de tiempos, comentarios del docente y exportación a formatos de curso. Desmos, MathLive y KaTeX pueden enriquecer preview e interacción, pero no reemplazarán el solver ni la verificación del backend.

## Evidencia del piloto

El piloto derivado del `demoTimeline` produjo siete diapositivas animadas y se exportó a 19.86 segundos en 16:9, 1:1 y 9:16. La revisión visual confirmó que la diapositiva de sustitución mantiene la fórmula de la discriminante arriba y coloca los valores dentro de la operación; la diapositiva de cálculo muestra `Δ = 4 + 96 = 100`; la diapositiva de solución conserva la fórmula general y muestra las dos raíces; y la diapositiva de verificación separa las raíces de la gráfica. El formato cuadrado apila correctamente la comprobación para conservar espacio y legibilidad.

La salida actual sigue siendo un piloto editorial sin la pista de voz neural del pipeline oficial. El siguiente paso no debe ser activar producción, sino transportar un `LessonTimeline` real y su `audioPath` al `AnimatedDeck`, validar que los tiempos de cada diapositiva coincidan con el audio y exportar un MP4 narrado mediante FFmpeg sin duplicar relojes.
