# Math Video Generator — Pizarra Pedagógica 2.2

## Resumen de la Versión 2.2

La versión **Pizarra Pedagógica 2.2** consolida la precisión pedagógica y audiovisual del motor matemático, garantizando que el estudiante observe exactamente lo que la narradora explica paso a paso, sin vacíos en la pizarra ni desajustes temporales.

## Novedades Principales

### 1. Secuencia Completa de Recapitulación (6 Fórmulas / 5 Transiciones Semánticas)
En la recapitulación de ecuaciones cuadráticas con discriminante no negativo ($\Delta \ge 0$), la versión 2.2 incorpora explícitamente la fórmula general durante la explicación oral *"aplicamos la fórmula general"*:

1. **Ecuación original:** `$x^2 - 5x + 6 = 0$` (Beat 0: *"Recapitulamos"*)
2. **Coeficientes identificados:** `$a = 1,\; b = -5,\; c = 6$` (Beat 1: *"identificamos"*)
3. **Discriminante calculado:** `$\Delta = 1$` (Beat 2: *"calculamos"*)
4. **Fórmula general aplicada:** `$x = \frac{-b \pm \sqrt{\Delta}}{2a}$` (Beat 3: *"aplicamos"*)
5. **Raíces obtenidas:** `$x_1 = 3,\; x_2 = 2$` (Beat 4: *"obtuvimos"*)
6. **Comprobación final:** `$P(3)=0,\; P(2)=0$` (permanente en el lienzo final)

### 2. Sincronización Neural WordBoundary (Tolerancia $\le 0.170\text{ s}$)
- Cada hito visual (`visualBeatPhrases`: `['Recapitulamos', 'identificamos', 'calculamos', 'aplicamos', 'obtuvimos']`) se sincroniza directamente con el inicio de la palabra en la voz neural `es-PE-CamilaNeural` de Microsoft Edge TTS.
- Ninguna fórmula se oculta prematuramente. Se mantiene visible hasta el instante exacto en que la siguiente fórmula la sustituye mediante un crossfade suave (`FadeOut(anterior)` + `FadeIn(siguiente)`).
- La respuesta final y su comprobación algebraica permanecen en pantalla hasta el último fotograma del video.

### 3. Especificaciones Audiovisuales y de QA
- **Resolución:** 1920 × 1080 (16:9), 1080 × 1080 (1:1), 1080 × 1920 (9:16).
- **Video:** H.264 (libx264, baseline profile, 30 fps exactos).
- **Audio:** AAC mono nativo (Edge TTS 24000 Hz, 64 kbps, niveles broadcast compliant EBU R128 con audio gate y sin silencios artificiales).
- **Puertas de Integridad:**
  - `spoken-beat-qa`: desviación temporal $\le 0.17\text{ s}$.
  - `geometry-qa`: legibilidad de fórmulas ($\ge 27\text{ px}$ math-primary, $\ge 25\text{ px}$ ancla, márgenes $\ge 19.05\text{ px}$).
  - `render-integrity`: safe frame respetado, sin colisiones de texto ni desbordes.
  - `frame-qa`: muestreo en cada punto medio de escena y verificación del fotograma final.
