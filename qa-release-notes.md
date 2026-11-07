# QA del release pedagógico

Render aceptado: `render_pedagogical_release_accepted_1786906583`.

El video generado contiene diez escenas pedagógicas para `x^2 - 5x + 6 = 0`: gancho, coeficientes, configuración del discriminante, cálculo del discriminante, fórmula simbólica, sustitución numérica, simplificación, dos ramas, comprobación gráfica y recapitulación.

La inspección visual de los renders mostró paneles de pantalla completa con fondo azul oscuro y borde, fórmula general con fracción vertical LaTeX, valores `a = 1`, `b = -5`, `c = 6` simultáneamente, sustitución numérica `(-5)^2 - 4(1)(6)`, cálculo intermedio `25 - 24`, fórmula sustituida, simplificación `x = (5 ± 1) / 2`, raíces `x_1 = 3` y `x_2 = 2`, y la parábola con raíces marcadas en `x = 2` y `x = 3`.

Se corrigió el inicio para que la portada sea breve y el gancho visual aparezca inmediatamente. Se corrigió la composición del gancho, los cálculos multilínea y la recapitulación. La escena de simplificación quedó con una única fracción completa, evitando duplicación y recorte. El encabezado del discriminante dejó de mostrar comandos LaTeX literales.

La narración usa voz neural `es-MX-DaliaNeural` con fallback disponible y números completos en español; se sustituyó el problema de lectura dígito-por-dígito, por ejemplo `25` ahora se oraliza como `veinticinco` y `24` como `veinticuatro`.

Validación técnica: build TypeScript correcto, 15/15 pruebas pasando, lint correcto con la advertencia conocida de compatibilidad de TypeScript del parser ESLint, `git diff --check` sin errores. El archivo final es H.264 854x480 a 30 fps con pista AAC y duración aproximada de 110 segundos.
