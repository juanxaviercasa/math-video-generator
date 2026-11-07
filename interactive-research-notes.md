# Investigación de recursos interactivos web

## Symbolab

La página oficial describe un solucionador de IA que interpreta problemas, selecciona métodos estructurados y presenta explicaciones paso a paso. En la revisión no apareció una documentación pública clara de API, widget embebible ni un contrato de integración para terceros. Por prudencia, no se debe automatizar scraping ni depender de endpoints internos. Symbolab puede servir como referencia de experiencia pedagógica: entender primero, elegir un método, explicar sin saltos y permitir preguntas sobre cada paso.

## Desmos

La documentación oficial ofrece una API JavaScript para incrustar un `GraphingCalculator` en una página web mediante un API key. La instancia permite configurar tamaño, viewport, expresiones, sliders, puntos, accesibilidad, idioma, modo de movimiento reducido y capturas PNG/SVG. La API también permite exportar screenshots con dimensiones específicas, lo cual es útil para generar un recurso visual consistente o una miniatura sin deformar la relación de aspecto. La integración debe revisar los términos de API y manejar la key según sus reglas; no debe asumir que el uso comercial es libre sin validar la licencia.

## MathLive

MathLive ofrece un componente web `<math-field>` para editar y mostrar fórmulas con salida LaTeX, teclado virtual, accesibilidad y soporte amplio de comandos. Es una buena opción para el editor de problemas y para permitir que docentes corrijan una fórmula antes de producir el video. Es open source y puede instalarse como dependencia frontend, sin herramientas matemáticas locales.

## GeoGebra

GeoGebra documenta embedding parameters y applets reutilizables. Es adecuado como referencia o complemento para exploraciones dinámicas de funciones y geometría, pero la experiencia de exportación automatizada y la licencia deben validarse antes de usarlo como parte del pipeline de producción. La opción primaria de exportación controlada será mantener el gráfico determinista dentro de Manim y usar una capa interactiva opcional en la web.

## Recomendación

Adoptar una arquitectura híbrida: Manim/FFmpeg genera el video determinista con safe zones; MathLive aporta edición matemática web; Desmos o GeoGebra se cargan opcionalmente en el navegador para exploración interactiva y preview, no como dependencia obligatoria del render. El backend debe conservar una ruta fallback propia para que el SaaS funcione aunque no haya API key, cambien las políticas o falle un recurso externo.
