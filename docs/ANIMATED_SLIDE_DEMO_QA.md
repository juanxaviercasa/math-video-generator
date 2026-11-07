# QA de demo: presentación animada cuadrática

## Artefacto

La demo se construye desde `demoTimeline`, se transforma mediante `timelineToAnimatedDeck` y se compone con Remotion. Contiene siete diapositivas: hook, identificación, fórmula de referencia, sustitución, cálculo, solución y comprobación.

## Línea temporal observada

| Intervalo aproximado | Diapositiva | Evidencia hablada y visual |
|---|---|---|
| 00:00–00:04 | Hook | Aparece `3x² + 2x − 8 = 0` y se anuncia que no se saltarán pasos |
| 00:04–00:12 | Identificación | Se muestran `a = 3`, `b = 2`, `c = −8` |
| 00:12–00:20 | Referencia | Permanece visible `Δ = b² − 4ac` |
| 00:20–00:28 | Sustitución | Aparece `Δ = (2)² − 4(3)(−8)` antes de operar |
| 00:28–00:40 | Cálculo | Se muestra `Δ = 4 + 96 = 100` |
| 00:40–00:50 | Solución | Se conserva la fórmula general y aparecen `x₁ = 1.333`, `x₂ = −2` |
| 00:50–01:02 | Verificación | Aparecen raíces y gráfica con ambos cruces del eje `x` |

## Validación técnica

| Formato | Resolución | Duración | Video | Audio |
|---|---:|---:|---|---|
| 16:9 | 1280×720 | 61.40 s | H.264, 30 fps | AAC mono, 24 kHz |
| 1:1 | 720×720 | 61.40 s | H.264, 30 fps | AAC mono, 24 kHz |
| 9:16 | 720×1280 | 61.40 s | H.264, 30 fps | AAC mono, 24 kHz |

La pista de voz se genera con `es-MX-DaliaNeural` a `-8%` y se concatena en el mismo orden que las diapositivas. El análisis audiovisual del MP4 16:9 no detectó pantallas negras, transiciones vacías, clipping, fórmulas incorrectas ni solapamientos. La transcripción confirmó el orden de las siete explicaciones.

## Observación crítica

La sincronización actual se valida por segmentos de audio de la demo y por el `AnimatedDeck`, pero todavía no consume un `audioPath` producido por `video-processing.service.ts`. El siguiente incremento debe sustituir `demoTimeline` por un `LessonTimeline` serializado desde el backend, conservar sus duraciones reales y pasar la pista neural existente sin crear un segundo reloj.

La demo es un **piloto aprobado**, no una activación de producción. `NARRATION_TIMELINE=false` permanece intacto y el compositor de diapositivas no se conecta al pipeline oficial hasta completar esa integración.
