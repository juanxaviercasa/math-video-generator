# Implementación del timeline de narración y microeventos

## Estado

La primera versión del timeline pedagógico fue implementada sobre el renderer restaurado y permanece desactivada por defecto. La bandera es:

```env
NARRATION_TIMELINE=false
```

Al activarla de forma explícita, la generación cuadrática construye una línea de tiempo con segmentos de narración y eventos visuales por escena. El baseline anterior no se reemplaza.

## Componentes

`timeline.types.ts` define `NarrationSegment`, `VisualEvent`, `LessonTimeline`, `TimelineIssue`, `TimelineValidationReport` y la entrada de escenas con `visualStages`, `visualLatex` y `visualTextLines`.

`timeline.service.ts` construye los segmentos usando la duración real de cada escena cuando está disponible. Para escenas con etapas visuales, genera un evento por etapa. Cada evento contiene acción, etiqueta, target, valor anterior, valor siguiente, offset, duración, permanencia y rol pedagógico.

El validador rechaza segmentos vacíos, duraciones no positivas, eventos fuera del segmento, IDs duplicados y solapamientos. La duración reservada para el panel y las transiciones se descuenta antes de distribuir el tiempo entre microeventos.

`video-processing.service.ts` construye y valida el timeline después de generar el audio neural. Si la línea de tiempo es inválida, el proceso se detiene. El timeline se pasa al renderer solo cuando la bandera experimental está activa.

`manim.service.ts` conserva la plantilla estable como ruta por defecto. La ruta experimental muestra una escena persistente, presenta el primer evento y después cambia cada visualStage con una transición limpia de salida/entrada. La fórmula de cada evento se mantiene en MathTex, el fitting nunca supera un máximo de escala y se limita por ancho y altura disponibles.

## Validación

La suite pasó con **48 tests**. Se cubren construcción de segmentos, duración real, expansión de visualStages, orden de eventos, permanencia, eventos fuera de tiempo y solapamientos.

El render experimental narrado más reciente se generó en:

```text
/tmp/mvg-restore-baseline-1786926642115/restore-baseline-1786926642115-narrated.mp4
```

Su pista de audio es AAC, 24 kHz, mono, con `mean_volume=-19.5 dB` y `max_volume=-3.3 dB`. La voz utilizada es `es-MX-DaliaNeural` con ritmo `-8%`.

## Hallazgos visuales

Durante la validación se corrigieron tres problemas de forma general. Primero, los eventos que solo recibían `visualText` podían perder sus fórmulas; ahora también se consideran `visualLatex` y `visualTextLines`. Segundo, el fitting inicial podía ampliar grupos pequeños hasta generar texto gigante; se sustituyó por un factor máximo y límites de ancho/altura. Tercero, `ReplacementTransform` producía capturas intermedias con fórmulas superpuestas; se cambió por una salida y entrada controladas.

El timeline ya muestra una progresión ordenada y no produce clipping en el contacto final. La escala aún debe recibir aprobación humana sobre el MP4 completo, porque una hoja de contacto reducida no basta para juzgar lectura de ecuaciones en movimiento.

## Próximo paso controlado

La siguiente iteración no debe activar el MPE completo. Debe revisar una sola escena de sustitución en resolución nativa, ajustar únicamente su jerarquía si es necesario y luego comparar el video experimental con el baseline restaurado. Solo después de aprobar la cuadrática se podrá generalizar el timeline a ecuaciones lineales y sistemas.
