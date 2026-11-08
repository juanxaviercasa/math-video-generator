# Pizarra Pedagógica 2.1 — sincronización por palabras reales

## Qué se corrigió

Antes, las escenas sin microcues (introducción, tarjetas, gráfica y recapitulación)
mostraban contenido usando intervalos **uniformes** calculados a partir de la duración
total de la narración. Un MP4 con 0.06 s de diferencia entre las duraciones de
audio y video podía seguir enseñando la raíz antes de que se pronunciase.

Esta versión conserva los microcues y también instrumenta los demás segmentos:

1. El archivo SRT WordBoundary de Edge TTS se valida contra el guion completo.
2. Cada escena define referencias semánticas **que realmente se pronuncian**
   (`visualBeatPhrases`). El algoritmo encuentra cada frase en orden entre las
   palabras emitidas por Edge, sin estimar tiempos por cantidad de caracteres.
3. Se reserva una entrada visual de 0.4 s antes de la locución; el audio se
   alinea con el mismo desplazamiento mediante FFmpeg.
4. `visualBeatOffsets` viaja hasta Manim. `_wait_spoken_beat` detiene el
   reloj hasta la palabra específica y registra la hora visual observada.
5. El reporte `<job>-spoken-beat-qa.json` compara ambos relojes y bloquea
   cualquier evento no observado o con error superior a 0.17 s.
6. Se rechazan palabras faltantes, marcadores reordenados, demasiado juntos
   para animarlos, o visuales que se exceden del tiempo real de su escena.

## Qué se sincroniza ahora

- **Apertura:** las tres metas aparecen cuando se pronuncian por primera vez.
- **Coeficientes:** a, b, c se revelan con «a es», «b es», «c es».
- **Discriminante y fórmula:** las referencias y sustituciones se presentan al
  nombrarlas, sin mostrar de antemano el resultado.
- **Verificación:** las sustituciones de cada raíz se muestran al hablar de ella.
- **Gráfica:** el vértice y los cortes reales se destacan cuando se mencionan.
- **Conclusión:** el resumen avanza al ritmo de la voz y conserva las dos
  raíces y sus verificaciones individuales hasta el último fotograma.

Las escenas de ecuaciones con `visualCueDurations` siguen usando sus segmentos
de voz neural y offsets propios, ya existentes. No deben sustituirse por
intervalos uniformes.

## Puertas de QA

- `npm test`: controles unitarios de palabras, orden, ausencia y desfase;
  generación de guiones con las cuatro familias de escenas.
- `npm run smoke:precision --workspace backend`: además de los casos
  tradicionales, renderiza `spoken-beats` en 16:9 y 9:16, audita los eventos
  de Manim y guarda el JSON en los artefactos privados.
- **Prueba de voz real** en el entorno de Antigravity/Oracle: generar el problema
  x²−5x+6=0 con Edge TTS es-PE-CamilaNeural, conservar los archivos
  `*-spoken-beats.json`, `*-spoken-beat-qa.json` y
  `*-voice-word-boundaries.json`; escuchar y contrastar fotogramas con la voz.

## Alcance y limitaciones honestas

Las marcas WordBoundary de Edge TTS permiten **anclar eventos visuales a
palabras**, no son mediciones acústicas independientes ni alineación por fonemas.
Si el objetivo futuro es colorear individualmente sílabas o símbolos
matemáticos conforme se escuchan, probar un *forced aligner* como WhisperX con
audio realmente decodificado y diccionario de pronunciación matemática en
español. Ese alineador requiere instalación de modelos, evaluación con audio
peruano y verificación de calidad; no está instalado por este cambio.

Cuando Edge TTS no aporta marcas, la ruta neural se detiene para las escenas
con eventos semánticos, en vez de declarar una sincronización ficticia.
Los proveedores locales pueden conservar el modo de duración como degradación
explícita y auditada. Nunca declarar «palabra por palabra» si el reporte marca
`duration-fallback`.


## Política de permanencia en la recapitulación (hotfix)

La pizarra de `recap` conserva la última fórmula o tarjeta visible
durante **todo el tramo hablado**, incluidas las pausas. El foco amarillo
(`_focus_math`) no termina la vida visual del objeto:

- Al comienzo del siguiente `WordBoundary` semántico, un único
  `self.play(FadeOut(anterior), FadeIn(siguiente))` sustituye el contenido
  sin dejar la pizarra vacía.
- Al último hito se muestra la respuesta y la comprobación individual;
  ambas permanecen hasta el último fotograma.
- En escenas sin marcas de voz también se mantiene la fórmula anterior
  hasta que comienza la transición al siguiente paso, sin desaparecer tras
  el foco.
- Se mantienen los offsets de Edge TTS y la auditoría de desviación de
  0.17 s. No se añaden duraciones extra ni se desplaza el audio para
  esconder el problema.

Validar con una muestra real de `x^2-5x+6=0` y observar la recapitulación
segundo a segundo. La CI de TypeScript verifica el orden y los comandos
generados; Precision Render Smoke valida la salida de Manim, pero la
certificación pedagógica definitiva exige revisar el MP4 con narración.
