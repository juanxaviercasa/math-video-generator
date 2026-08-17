# Implementación del timeline de narración y microeventos

## Estado

La primera versión del timeline pedagógico fue implementada sobre el renderer restaurado y permanece desactivada por defecto. La bandera es:

```env
NARRATION_TIMELINE=false
```

Al activarla de forma explícita, la generación cuadrática construye una línea de tiempo con segmentos de narración y eventos visuales por escena. El baseline anterior no se reemplaza.

## Componentes

`timeline.types.ts` define `NarrationSegment`, `VisualEvent`, `LessonTimeline`, `TimelineIssue`, `TimelineValidationReport` y la entrada de escenas con `visualStages`, `visualLatex` y `visualTextLines`. La versión pedagógica añade `lessonMode`, `formulaAnchors`, `checkpoints`, `formulaAnchorId` y `semanticStep`; todos son opcionales para conservar compatibilidad con la ruta estable.

`timeline.service.ts` construye los segmentos usando la duración real de cada escena cuando está disponible. Para escenas con etapas visuales, genera un evento por etapa. Cada evento contiene acción, etiqueta, target, valor anterior, valor siguiente, offset, duración, permanencia y rol pedagógico.

El validador rechaza segmentos vacíos, duraciones no positivas, eventos fuera del segmento, IDs duplicados y solapamientos. La duración reservada para el panel y las transiciones se descuenta antes de distribuir el tiempo entre microeventos.

`video-processing.service.ts` construye y valida el timeline después de generar el audio neural. Si la línea de tiempo es inválida, el proceso se detiene. El timeline se pasa al renderer solo cuando la bandera experimental está activa.

`manim.service.ts` conserva la plantilla estable como ruta por defecto. La ruta experimental muestra un panel seguro desde el primer frame, mantiene una fórmula de referencia en una ancla superior durante el segmento, presenta cada visualStage con una transición secuencial limpia de salida/entrada y puede insertar una pausa predictiva antes de revelar la siguiente transformación. La fórmula de cada evento se mantiene en MathTex, el fitting nunca supera un máximo de escala y se limita por ancho y altura disponibles. Las gráficas cuadráticas reciben `a`, `b`, `c` y las raíces verificadas desde el storyboard; no se permiten raíces visuales hardcodeadas en el piloto.

## Validación

La suite pasó con **52 tests**. Además de construcción de segmentos, duración real, expansión de visualStages, orden de eventos, permanencia, eventos fuera de tiempo y solapamientos, se cubren anchors de fórmula, checkpoints, referencias inexistentes, regresiones de oralización y gráficas cuadráticas derivadas del problema.

El render experimental narrado más reciente se generó en:

```text
/tmp/mvg-timeline-pilot-16x9-v6/timeline-pilot-16x9-narrated.mp4
```

Su pista de audio es AAC, 24 kHz, mono, con `mean_volume=-19.5 dB` y `max_volume=-3.3 dB`. La voz utilizada es `es-MX-DaliaNeural` con ritmo `-8%`.

## Evidencia de QA multiplataforma

El piloto cuadrático con `3x^2 + 2x - 8 = 0` se renderizó con voz neural `es-MX-DaliaNeural`, tasa `-8%`, sin fallback local y con FFmpeg. Los tres formatos aprobaron la auditoría audiovisual:

| Formato | Resolución | Audio | Veredicto |
|---|---:|---|---|
| 16:9 | 1280×720 | AAC, 30 fps | Aprobado en v6 |
| 1:1 | 720×720 | AAC, 30 fps | Aprobado |
| 9:16 | 720×1280 | AAC, 30 fps | Aprobado |

La transcripción comprobó “menos noventa y seis” y “uno punto tres tres tres”. La auditoría visual comprobó fórmula persistente, coeficientes `a`, `b`, `c`, checkpoint, ramas secuenciales, recap y gráfica con raíces `x=-2` y `x=1.333`. La ruta estable también fue renderizada con `NARRATION_TIMELINE=false` y conservó la composición baseline.

## Hallazgos visuales

Durante la validación se corrigieron tres problemas de forma general. Primero, los eventos que solo recibían `visualText` podían perder sus fórmulas; ahora también se consideran `visualLatex` y `visualTextLines`. Segundo, el fitting inicial podía ampliar grupos pequeños hasta generar texto gigante; se sustituyó por un factor máximo y límites de ancho/altura. Tercero, `ReplacementTransform` producía capturas intermedias con fórmulas superpuestas; se cambió por una salida y entrada controladas.

El timeline muestra una progresión ordenada, no produce clipping en los tres formatos aprobados y fue revisado sobre MP4 completo mediante análisis audiovisual, transcripción y frames nativos. La apertura, la persistencia de fórmulas, la pausa predictiva, la separación de ramas y la gráfica dinámica quedaron validadas en el piloto.

## Próximo paso controlado

La siguiente iteración no debe activar el MPE completo ni generalizar todavía a otra familia matemática. La cuadrática ya superó el piloto real en los tres formatos, pero la bandera continúa desactivada por defecto. Antes de activar una exposición controlada, debe añadirse observabilidad de timeline y una política explícita de habilitación por tipo de problema. Solo después de registrar más de un caso cuadrático aprobado se podrá generalizar a ecuaciones lineales y sistemas, cada uno con solver determinista.
