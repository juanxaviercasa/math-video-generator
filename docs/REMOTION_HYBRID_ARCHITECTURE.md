# Arquitectura híbrida Manim + Remotion

## Decisión

Remotion se integrará inicialmente como **compositor editorial y preview interactivo**, no como sustituto de Manim ni del solver. El objetivo es mejorar el impacto visual, la continuidad narrativa y la experiencia de configuración sin duplicar la lógica matemática ni abrir una segunda fuente de verdad.

> Principio rector: el solver decide qué es matemáticamente verdadero; el timeline decide cuándo debe aparecer; el compositor decide cómo envolverlo visualmente; el QA decide si se puede entregar.

## Responsabilidades por capa

| Capa | Responsabilidad | Tecnología inicial | No debe hacer |
|---|---|---|---|
| Solver y soporte matemático | AST, coeficientes, raíces, verificación y gráficas derivadas de datos reales | TypeScript + validadores existentes | Inventar resultados o aceptar familias no verificadas |
| Timeline pedagógico | Hook, identificación, sustitución, cálculo, simplificación, solución, verificación, pausas y anchors | `LessonTimeline` existente | Calcular de nuevo la matemática |
| Render matemático de precisión | LaTeX, `MathTex`, transformaciones por subpartes y geometría exacta | Manim + LaTeX | Sustituir el contrato pedagógico |
| Compositor editorial | Títulos, tarjetas, subtítulos, barras de progreso, escenas sociales, overlays y transiciones de producto | Remotion, detrás de flag | Cambiar fórmulas o raíces |
| Preview y configuración | Edición validada de contenido, formato, ritmo, colores y estilo | React actual + Zustand; Remotion Player opcional | Persistir props inválidas o depender de Studio en producción |
| Preview interactivo de gráficas | Explorar viewport, sliders y expresiones antes del render final | Desmos opcional | Ser la fuente de verdad del MP4 |
| Ensamblaje final | Audio neural, muxing, codecs, thumbnails y artefactos | FFmpeg + TTS actual | Activar fallback silencioso |
| QA | Safe frame, overflow, audio, duración, sincronía, soporte matemático y comparación visual | Visual QA existente | Aprobar solo por compilación |

## Flujo propuesto

```text
Problema
  ↓
Solver determinista + soporte matemático
  ↓
Storyboard cuadrático / escenas sincronizadas
  ↓
LessonTimeline validado
  ├──→ Manim: fórmulas y gráficas precisas
  └──→ Remotion: composición editorial / preview / formato social
          ↓
     FFmpeg + audio neural
          ↓
       Visual QA + audio QA
          ↓
        Artefacto entregable
```

En la primera fase Remotion no reemplazará la salida de Manim. El piloto renderizará una composición breve y parametrizada usando un JSON derivado del `LessonTimeline`; su función será medir si mejora la jerarquía, la continuidad y la percepción de calidad. La integración completa solo se aprobará si el piloto supera criterios explícitos de legibilidad, sincronización, dimensiones, duración y ausencia de regresión.

## Flags y reversibilidad

Se añadirán flags separados para evitar mezclar preview y producción:

```env
REMOTION_PREVIEW=false
REMOTION_COMPOSITOR=false
```

`NARRATION_TIMELINE=false` continuará protegiendo la ruta estable actual. El primer piloto podrá ejecutarse con `REMOTION_PREVIEW=true` sin cambiar el renderer de producción. No se incorporará Remotion al flujo por defecto hasta que exista un render real comparable contra Manim.

## Config UI

“Config UI” se implementará como una interfaz propia y pequeña, inspirada en el Props Editor de Remotion pero adaptada al dominio. Sus controles iniciales serán formato (`16:9`, `1:1`, `9:16`), densidad, estilo de narración, intensidad de hook, mostrar fórmula de referencia y duración de pausas. Todos los valores estarán validados por Zod/Zustand y se convertirán en props de una composición o en configuración del pipeline.

Remotion Studio se reservará para desarrollo local, inspección de composiciones y diseño. No se asumirá que sus controles deban ejecutarse en producción ni se importará el Editor Starter completo antes de revisar licencia, peso y compatibilidad con la aplicación actual.

## Criterios de aprobación del piloto

El piloto no se considerará exitoso por generar un MP4. Debe demostrar que la fórmula de referencia permanece legible, que la sustitución y el resultado se distinguen, que el hook aparece antes de la primera operación, que la voz neural sigue siendo la misma, que no existen pantallas negras durante narración, que no hay overflow en los tres formatos y que el resultado mejora la continuidad visual respecto a una secuencia de paneles aislados.

## Decisión provisional de librerías

Manim + LaTeX permanecen como motor matemático. Remotion será el primer candidato a compositor editorial y preview. MathLive continúa como editor de fórmulas en frontend; KaTeX puede añadirse para preview server-side rápido; Desmos queda como preview interactivo opcional; Motion Canvas no se añade ahora porque introduciría un tercer motor de animación con solapamiento funcional. MathJax no se añade mientras KaTeX cubra la necesidad de preview y MathLive cubra edición.

## Resultado del piloto visual

El piloto aislado se renderizó con Remotion 4.0.512 y KaTeX en 1280×720, 720×720 y 720×1280, a 30 fps y aproximadamente 14.25 segundos por composición. El render completó correctamente y produjo H.264 con pista AAC generada por Remotion. La composición demuestra una mejora clara sobre un panel aislado: tiene rail de progreso, título editorial, hook, color semántico, fórmula de referencia, tarjeta de explicación, pausa predictiva y comprobación gráfica.

La revisión nativa mostró que 16:9 y 9:16 conservan la jerarquía principal y no presentan clipping visible. En 1:1, la verificación gráfica inicialmente reducía demasiado el ancho en dos columnas; se corrigió apilándola en una sola columna para cualquier viewport compacto. El piloto sigue siendo visual: todavía no está conectado al audio neural ni al `LessonTimeline` real, y por eso no se debe activar como compositor de producción.

## Comparación con Manim

La comparación técnica se realizó con el piloto Remotion de 14.25 s y los artefactos Manim narrados de 146 s. En los tres formatos, ambos producen H.264 a 30 fps con las dimensiones esperadas. Remotion genera una pista AAC estéreo de 48 kHz en el piloto; Manim + FFmpeg conserva la pista neural AAC mono de 24 kHz del producto. Por tanto, el audio del piloto Remotion no es evidencia de compatibilidad con la narración neural: la integración real deberá insertar el audio existente y validar sincronización.

| Dimensión | Remotion piloto | Manim baseline | Lectura |
|---|---:|---:|---|
| 16:9 | 1280×720 | 1280×720 | Equivalentes |
| 1:1 | 720×720 | 720×720 | Equivalentes |
| 9:16 | 720×1280 | 720×1280 | Equivalentes |
| Duración de muestra | 14.25 s | 146 s | No es comparación de rendimiento directa |
| Fórmula | KaTeX HTML | MathTex/LaTeX | Debe probarse equivalencia antes de mezclar |
| Audio | AAC estéreo 48 kHz del piloto | AAC neural mono 24 kHz | Manim/FFmpeg sigue siendo la ruta aprobada |
| Editorial | Rail, cards, hook, progreso, overlay | Paneles pedagógicos y microeventos | Remotion aporta continuidad de producto |
| Precisión matemática | Props manuales del piloto | Solver + storyboard + gráfica verificada | Manim conserva autoridad |

La revisión visual muestra la oportunidad concreta: Remotion aporta una composición editorial más rica y continua, mientras Manim aporta la precisión matemática y la estructura de pasos ya validada. La conclusión no es sustituir uno por otro, sino usar el `LessonTimeline` como contrato compartido y probar una composición híbrida donde Manim entregue los elementos matemáticos validados y Remotion envuelva esos elementos con la capa de retención visual.
