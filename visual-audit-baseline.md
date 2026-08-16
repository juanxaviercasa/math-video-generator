# Auditoría visual de regresión: baseline inicial

## Referencias inspeccionadas

La referencia estable es `/tmp/mvg-render_presentation_engine_narrated_final_1786918532/render_presentation_engine_narrated_final_1786918532-final.mp4`, con contacto `/tmp/mvg-stable-contact.jpg`. El estado actual inspeccionado es `/tmp/mvg-debug-1786920058475/mpe-debug-1786920058475-final.mp4`, con contacto `/tmp/mvg-current-contact.jpg`.

## Hallazgos visuales confirmados

La referencia estable conserva una secuencia completa de 12 escenas, tarjetas uniformes, safe frame limpio, fórmulas de tamaño moderado y progresión clara: ruta, coeficientes, sustitución, discriminante, fórmula, reemplazo, simplificación, soluciones, gráfica y comprobación.

El estado actual inspeccionado muestra una regresión clara. El overlay DEBUG aparece superpuesto y no debe formar parte del video final. La secuencia perdió escenas o las condensó: la segunda escena pasó a sustitución, desaparecen o se reducen escenas intermedias, y algunas tarjetas quedan negras o muy apagadas. Las cajas de diagnóstico atraviesan textos y fórmulas. La composición de sustitución y discriminante está demasiado extendida horizontalmente, con fórmulas grandes y elementos próximos a los bordes. La fórmula de reemplazo queda visualmente pequeña dentro de un espacio vacío, mientras que otras escenas concentran objetos en una sola fila. La escena de soluciones presenta cajas sobre la línea de resultados. La referencia estable es claramente superior para distribución, equilibrio y claridad pedagógica.

## Hipótesis sistémicas iniciales

1. El modo DEBUG está habilitado por variable de entorno durante la validación y sus overlays se están mezclando en el artefacto inspeccionado; debe quedar estrictamente aislado de la salida de distribución.
2. El ciclo de reparación está aplicando un `PresentationPlan` modificado al renderer, pero el renderer mantiene plantillas propias que no respetan completamente los bounding boxes del plan.
3. La reparación cambia layouts o escalas sin una política de regresión visual contra la referencia estable, y puede conservar una puntuación numérica alta aunque la composición real empeore.
4. La selección del mejor candidato se basa en el score QA, pero el score no penaliza suficientemente overlay activo, escenas faltantes, concentración horizontal ni discrepancia entre plan y renderer.
5. El corpus de auditoría debe medir integridad de escenas, ocupación, legibilidad y consistencia, no solo ausencia de overflow técnico.

## Verificación posterior al rollback inicial

Se ejecutó el renderer actual con `MPE_DEBUG=false`, `MPE_MAX_REPAIR_ITERATIONS=0` y narración desactivada. El artefacto `/tmp/mvg-current-1786921884628/mpe-current-1786921884628-final.mp4` pasó QA con score 95 y sin overlay. La hoja `/tmp/mvg-current-after-rollback-contact.jpg` recupera una composición visual limpia y cercana a la referencia: tarjetas contenidas, gráfica dentro del panel, fórmulas sin overflow técnico y escalas moderadas. La diferencia que permanece es la duración de 84 segundos frente a los 143 segundos del render narrado anterior, porque sin audio no se extienden las escenas al ritmo de la narración. Esto confirma que el overlay DEBUG no debe considerarse un defecto de producción y que la siguiente auditoría debe separar claramente: composición, integridad temporal de escenas y audio.

## Muestra antes/después del corpus

Para `equation-quadratic`, el contacto antes y después es visualmente idéntico: paneles contenidos, discriminante y fórmula legibles, gráfica no incluida en este recorte. El reporte pasó de 23 a 18 issues internos, pero el score permaneció en 95 y la salida visual no cambió de forma perceptible. Esto revela que varias reparaciones actuales actúan sobre anclas o captions del plan, mientras que las plantillas Manim no consumen todas esas decisiones de forma efectiva. La auditoría deberá penalizar esta divergencia plan-renderer y no considerar suficiente una reducción de issues si el frame no cambia o la claridad no mejora.

El caso `function-linear` confirma un fallo grave de presentación: tanto antes como después, el contacto muestra casi toda la pantalla negra y solo aparecen el título y una línea de evaluación. El reportado `afterScore=88` no representa una herramienta matemática profesional. El Auto-Repair reduce captions en el plan, pero no arregla la plantilla de render ni recupera la explicación. Este patrón obliga a añadir una regla general de `BLACK_FRAME`/contenido insuficiente que invalide el resultado y a distinguir el fallback genérico de una escena matemática desarrollada.

La corrección del fallback mejoró los pasos centrales: `frame-5`? La hoja `/tmp/mvg-fallback-one/contact.jpg` muestra paneles contenidos para Paso 2, Paso 3 y resumen. Sin embargo, el frame `/tmp/mvg-fallback-one/frame-5.jpg` es completamente negro. El fallo no es solo de layout: existe un hueco temporal entre la introducción y el primer paso o la escena inicial no está siendo mostrada con contenido. Por tanto, la regla sistémica debe exigir contenido visible en cada ventana de escena, no solo en el centro estadístico de algunas escenas.

Después de quitar el título aislado, el frame `/tmp/mvg-fallback-one/frame-1-after-title-removal.jpg` muestra una tarjeta completa y legible para Paso 1, sin desbordamiento. El contacto `/tmp/mvg-fallback-one/contact-after-title-removal.jpg` muestra pasos contenidos y una conclusión neutral. La secuencia visual mejoró de forma sistémica; el contacto no captura todos los pasos por el intervalo de muestreo, por lo que el QA final debe capturar al menos un frame por escena usando timestamps derivados de duración, además del muestreo global.
