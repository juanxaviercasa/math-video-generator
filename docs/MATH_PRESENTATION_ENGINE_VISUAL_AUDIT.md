# Auditoría de calidad visual del Math Presentation Engine

## Alcance y criterio

Esta auditoría evalúa la consistencia visual del sistema como herramienta educativa matemática profesional. La referencia conceptual se tomó de principios observables en plataformas educativas modernas: jerarquía estable, ecuaciones centradas y legibles, separación explícita de transformaciones, uso intencional del espacio, resultados destacados, gráficos contenidos y progresión pedagógica. No se copiaron marcas, branding ni elementos propietarios.

El corpus contiene **21 problemas**, supera el mínimo solicitado de 20 y cubre álgebra, ecuaciones, sistemas, funciones, geometría, trigonometría, cálculo, estadística, matrices y problemas verbales. Cada caso ejecutó una corrida de render inicial, Visual QA, generación de `RepairAction`, rerender cuando correspondía y comparación de métricas.

> Distinción esencial: un score visual no prueba que la matemática sea correcta. A partir de esta auditoría, el reporte separa `mathematicalSupport`, `Visual Score` y `productionReady`.

## Corpus auditado

| ID | Categoría | Problema | Solver determinista actual | Resultado de producción |
|---|---|---|---|---|
| `algebra-linear` | Álgebra | `3x + 5 = 20` | No | Bloqueado hasta implementar solver lineal |
| `algebra-factorization` | Álgebra | `x² + 5x + 6 = 0` | Sí, vía cuadrática | Visual aprobado; requiere ampliar semántica de factorización |
| `equation-quadratic` | Ecuaciones | `x² − 5x + 6 = 0` | Sí | Visual aprobado; referencia estable |
| `equation-rational` | Ecuaciones | `2/(x−1) = 4` | No | Bloqueado |
| `system-two` | Sistemas | `x+y=7; 2x−y=5` | No | Bloqueado |
| `system-three` | Sistemas | Sistema lineal de 3 variables | No | Bloqueado |
| `function-linear` | Funciones | `f(x)=2x+1` | No | Bloqueado; fallback visual contenido, sin solver |
| `function-quadratic` | Funciones | `f(x)=x²−4x+3` | No | Bloqueado; no se inventa gráfica |
| `geometry-triangle` | Geometría | Triángulo base 8, altura 5 | No | Bloqueado |
| `geometry-circle` | Geometría | Círculo de radio 3 | No | Bloqueado |
| `trig-sine` | Trigonometría | `sen(30°)=1/2` | No | Bloqueado |
| `trig-pythagorean` | Trigonometría | `sen²x+cos²x=1` | No | Bloqueado |
| `calculus-derivative` | Cálculo | Derivada de `x³+2x` | No | Bloqueado |
| `calculus-integral` | Cálculo | Integral de `2x` entre 0 y 3 | No | Bloqueado |
| `calculus-limit` | Cálculo | Límite de `(x²−1)/(x−1)` en 1 | No | Bloqueado |
| `statistics-mean` | Estadística | Media de 2, 4, 6, 8 | No | Bloqueado |
| `statistics-probability` | Estadística | Probabilidad de obtener 6 en un dado | No | Bloqueado |
| `matrix-product` | Matrices | Producto de matrices 2×2 | No | Bloqueado |
| `matrix-determinant` | Matrices | Determinante 2×2 | No | Bloqueado |
| `word-rate` | Problemas verbales | Tren: 180 km en 3 horas | No | Bloqueado |
| `word-mixture` | Problemas verbales | Mezcla al 20% y 40% | No | Bloqueado |

## Métricas globales

| Métrica | Resultado |
|---|---:|
| Casos ejecutados | 21 |
| Categorías cubiertas | 10 |
| Casos con solver determinista | 2/21 (9,5 %) |
| QA visual aprobado y producción lista | 2/21 (9,5 %) |
| Score visual medio inicial | 88,7 |
| Score visual medio posterior | 88,7 |
| Score de los casos cuadráticos | 95 |
| Score del fallback visual no soportado | 88 |
| Reparación con reducción de issues en caso cuadrático | 23 → 18 |
| Tests de backend | 43/43 aprobados |
| Build TypeScript | Aprobado |

El hecho más importante no es el promedio visual, sino que **19 de 21 problemas no poseen todavía un solver determinista**. Por eso el estado de producción se marca como bloqueado aunque algunas escenas de fallback se vean ordenadas. El sistema ya no presenta un video genérico como si fuera una solución matemática verificada.

## Comparación antes/después

### Caso soportado: ecuación cuadrática

El caso `equation-quadratic` obtuvo `Visual Score=95` antes y después. Visualmente, los paneles, la discriminante, la fórmula general, la sustitución y las soluciones permanecieron estables. Visual QA redujo issues internos de 23 a 18, pero el frame final no cambió de forma perceptible. Este resultado demostró que una reparación sobre el plan no es suficiente si las plantillas Manim no consumen la decisión de layout. Se añadió esta observación como regla de auditoría: **una reparación solo cuenta como efectiva cuando mejora el frame o una métrica objetiva relevante**.

### Caso no soportado: función lineal

El caso `function-linear` mostró inicialmente una pantalla casi negra con título y texto aislado. El fallback se corrigió de forma sistémica: cada paso ahora usa panel, encabezado, contenido centrado, escala contenida y transición uniforme; la conclusión es neutral y no inventa raíces ni gráficas. Un frame temprano posterior muestra una tarjeta completa para “Paso 1”. Aun así, el caso continúa bloqueado porque la validación matemática devuelve `unsupported`; el layout no sustituye al solver.

Los artefactos visuales utilizados para la revisión son `visual-audit-baseline.md`, `/tmp/mvg-fallback-one/frame-1-after-title-removal.jpg` y `/tmp/mvg-fallback-one/contact-after-title-removal.jpg`.

## Problemas recurrentes identificados

| Problema | Evidencia | Tratamiento sistémico |
|---|---|---|
| El score visual podía ocultar falta de solver | 19/21 casos no soportados obtenían QA geométrico positivo | `PresentationPlan.mathematicalSupport`, `VisualQAReport.productionReady` y gate `ALLOW_UNVERIFIED_MATH_VIDEO=false` |
| Fallback con texto sobre fondo negro | `function-linear` antes de la corrección | Paneles contenidos, encabezados, escala al área de contenido y conclusión neutral |
| Gráfica cuadrática inventada para contenido no validado | Fallback anterior activaba gráfica por regex `x²` y hardcodeaba raíces 2 y 3 | Eliminación de gráfica hardcodeada del fallback; las gráficas requieren storyboard/AST válido |
| Título aislado provocaba frames negros iniciales | Frame temprano del fallback | El storyboard controla sus encabezados; no se agrega título aislado cuando existen escenas |
| Drift temporal entre plan y video | QA de conclusión fuera de duración en fallback | Timestamps acotados, medición de duración real y issue crítico `timing-drift` |
| Auto-Repair modificaba el plan sin cambiar el render | Caso cuadrático: issues 23→18, frame casi idéntico | La auditoría registra divergencia plan-renderer y exige mejora observable |
| Umbral de legibilidad demasiado agresivo | Comparaciones cambiaban a pila vertical y se alejaban del baseline | Mínimo específico calibrado a `0.38` y safe frame como restricción prioritaria |
| DEBUG podía confundirse con distribución | Contactos con cajas verdes y texto `DEBUG` | `MPE_DEBUG` queda aislado; debe estar desactivado en producción |
| Audio neural podía degradar silenciosamente | MP3 Edge vacío seguido de espeak | Validación de audio, reintentos y `TTS_ALLOW_LOCAL_FALLBACK=false` |

## Reglas generales incorporadas

La primera regla es que **la matemática se valida antes de presentar la salida como lista para distribución**. Un fallback puede servir para depurar sincronización y composición, pero no obtiene `productionReady=true` sin solver determinista válido.

La segunda regla es que el fallback nunca puede inventar una gráfica, raíces, solución o narración específica a partir de una expresión parcial. Los gráficos deben provenir de `Math AST` o de una estructura semántica validada.

La tercera regla es que todos los pasos sincronizados deben usar el mismo sistema visual: panel, encabezado, safe frame, contenido centrado, escala ajustada y transición. No se permite mezclar una tarjeta pedagógica con texto suelto en la parte superior salvo que una plantilla lo declare explícitamente.

La cuarta regla es temporal: Visual QA debe comparar la duración real contra la duración planificada, acotar timestamps al video disponible y tomar al menos un frame representativo por escena. Un video con escenas ausentes o tiempos desalineados no puede pasar por score geométrico.

La quinta regla es de reparación: una acción de Auto-Repair debe ser trazable y debe mejorar una métrica o frame. Reducir el número de issues del plan sin alterar el resultado renderizado se registra como reparación no efectiva.

## Arquitectura final auditada

```text
Entrada matemática
  -> validateMathProblem
  -> solver determinista / estado unsupported explícito
  -> Math AST cuando existe
  -> storyboard pedagógico validado o fallback visual neutral
  -> PresentationPlan con mathematicalSupport
  -> design tokens + safe frame
  -> layout y fitting
  -> constraints
  -> Manim / FFmpeg
  -> duración real y frames por escena
  -> Visual QA geométrico y temporal
  -> issues accionables
  -> Auto-Repair catalogado
  -> rerender y selección del mejor candidato
  -> productionReady solo si matemática y visual están aprobadas
```

## Estado de la definición de terminado

La definición solicitada —“el sistema produce de forma consistente escenas matemáticas legibles, ordenadas, equilibradas y pedagógicamente claras sin necesitar intervención manual en cada video”— **todavía no se cumple para el producto completo**. Sí se cumple parcialmente para la familia de ecuaciones cuadráticas: su composición permanece contenida, la voz neural aprobada está protegida, el score visual observado es 95 y la suite tiene 43 tests aprobados.

La causa que impide declarar el sistema 10/10 no es principalmente el layout. Es la cobertura matemática: 19 categorías auditadas aún no tienen parser/solver determinista ni storyboard semántico específico. La siguiente fase correcta no es seguir aumentando heurísticas genéricas, sino implementar por módulos los solvers de ecuaciones lineales, sistemas, funciones, geometría, trigonometría, cálculo, estadística, matrices y problemas verbales. Cada solver debe emitir su AST y su estructura pedagógica; después se reutilizarán los mismos tokens, layout, constraints, QA temporal y Auto-Repair.

## Archivos y reproducibilidad

El corpus está en `backend/scripts/audit-20-math-corpus.ts`. La ejecución final produjo resultados en `/tmp/mvg-audit-20-final2/audit-20-results.json` y `/tmp/mvg-audit-20-final2/audit-20-results.csv`. La evidencia de regresión y baseline está en `visual-audit-baseline.md`.
