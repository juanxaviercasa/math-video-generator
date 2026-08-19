# Evaluación inicial de Remotion

## Evidencia oficial consultada

Remotion se presenta como una plataforma para crear videos programáticamente con React y permite registrar composiciones renderizables, parametrizar contenido y ejecutar renders desde código. La documentación de videos parametrizados indica que el flujo admite props, esquemas de validación, edición visual de valores en Remotion Studio, cálculo dinámico de metadata —incluyendo dimensiones, duración y framerate— y props de entrada durante el render. Fuente: [Parameterized videos](https://www.remotion.dev/docs/parameterized-rendering).

La documentación del `@remotion/player` confirma que el Player puede incrustar una composición Remotion dentro de cualquier aplicación React y cambiar su contenido en tiempo de ejecución sin renderizar el video final. Esto lo vuelve especialmente atractivo para un preview interactivo de nuestro editor, no necesariamente como sustituto del solver ni del renderer matemático determinista. Fuente: [@remotion/player](https://www.remotion.dev/docs/player).

## Implicación para math-video-generator

La evidencia favorece una arquitectura híbrida. Manim debe conservar la autoridad sobre fórmulas, transformaciones matemáticas, gráficas verificadas y escenas con precisión geométrica. Remotion puede aportar una capa editorial y de producto: preview en vivo, composición social, títulos, subtítulos, tarjetas, hooks, transiciones, barras de progreso, indicadores de pasos y controles de configuración. La integración debe recibir un `LessonTimeline` ya validado y no recalcular la matemática.

La expresión “Config UI” se tratará provisionalmente como la interfaz de configuración y preview de parámetros —similar al flujo de props editables/Studio—, no como un motor matemático separado. Antes de añadir una dependencia debe comprobarse si el usuario se refería a Remotion Studio, al Player embebido o a una interfaz propia del editor.

## Riesgos a controlar

Remotion no resuelve por sí mismo el solver determinista, la validación matemática ni la calidad de composición de fórmulas. Añadirlo directamente al backend de producción podría aumentar el peso de instalación, la complejidad de render y el número de rutas de sincronización. La primera integración recomendada es un piloto aislado detrás de una bandera, usando el mismo JSON de timeline y comparando un clip corto contra Manim antes de decidir si se incorpora al pipeline completo.

## Librerías matemáticas y visuales verificadas

La documentación oficial de Manim describe `MathTex` como una cadena compilada con LaTeX en modo matemático. Permite aislar subcadenas, colorear partes y usar `TransformMatchingTex`, lo que es valioso para mantener la fórmula de referencia y transformar solamente los términos que cambian. Fuente: [Manim MathTex](https://docs.manim.community/en/stable/reference/manim.mobject.text.tex_mobject.MathTex.html).

La API oficial de Desmos permite incrustar un `GraphingCalculator` en una aplicación web, controlar expresiones, viewport, ejes, puntos, sliders y otras opciones interactivas. Es una buena candidata para un preview de gráfica en el editor, pero no debe ser la autoridad del cálculo final ni del render exportado. Fuente: [Desmos API](https://www.desmos.com/api).

La decisión preliminar es conservar Manim + LaTeX como ruta de precisión, añadir Remotion como capa editorial/preview y evaluar Desmos únicamente como componente interactivo web. KaTeX, MathJax y MathLive deben permanecer en la interfaz de edición o previsualización; no se deben mezclar directamente con la exportación Manim sin una prueba de equivalencia tipográfica.

La documentación de Motion Canvas muestra un flujo TypeScript con editor local y preview en tiempo real, escenas, jerarquía, layouts, señales, tweening, transiciones y render. Puede ser útil para prototipos de motion design en TypeScript, pero introduciría un tercer motor de animación junto a Manim y Remotion. Por ahora queda como alternativa de investigación, no como dependencia del producto. Fuente: [Motion Canvas Quickstart](https://motioncanvas.io/docs/quickstart).

KaTeX se describe oficialmente como un renderer rápido, sin dependencias, basado en layout TeX y con renderizado server-side consistente entre navegador y entorno. Es una buena opción para la UI, previews, tarjetas y validación visual rápida de fórmulas, pero no reemplaza la capacidad de Manim para animar subpartes de una expresión con geometría de video. Fuente: [KaTeX](https://katex.org/).

La documentación de Remotion define la edición visual como un Props Editor dentro de Remotion Studio: el componente registra un esquema, el usuario modifica props en vivo y puede usarlos como input del render. También permite cambiar offset, escala, rotación, origen y opacidad de elementos de una `Sequence`. Esto confirma que “Config UI” probablemente se refería a esa experiencia, pero no obliga a instalar Studio en producción. Podemos construir una versión propia más pequeña basada en Zod/Zustand y reutilizar el principio de props validadas. Fuente: [Visual editing](https://www.remotion.dev/docs/visual-editing).

El Editor Starter de Remotion ofrece una base de editor con timeline y scrubber, pero debe evaluarse como producto/licencia y superficie adicional antes de incorporarlo. Para nuestro caso, conviene replicar solo los patrones necesarios —preview, scrubber, tracks semánticos, controles de formato y undo— sobre el frontend actual, en lugar de importar un editor completo que agregue otra arquitectura. Fuente: [Editor Starter features](https://www.remotion.dev/docs/editor-starter/features).
