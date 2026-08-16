# Auditoría de restauración visual y de audio

## Evidencia inicial

El render aprobado anterior `/tmp/mvg-render_responsive_warm_fixed_1786908979/...-narrated.mp4` muestra fórmulas grandes pero recortadas en varias escenas: el baseline visual no es perfecto, aunque conserva la voz y una presentación más clara que la versión posterior. El render actual `/tmp/mvg-render_presentation_engine_narrated_final_1786918532/...-narrated.mp4` evita algunos recortes, pero reduce de forma extrema las fórmulas de discriminante, sustitución y simplificación; la comparación queda visualmente pequeña y con demasiado espacio vacío. Las dos hojas de contacto se guardaron como `/tmp/mvg-baseline-approved-contact.jpg` y `/tmp/mvg-current-bad-contact.jpg`.

El dato objetivo de audio es más claro: el render previo aprobado contiene segmentos MP3 neurales válidos de 69–107 KB y WAV de mezcla; el render actual contiene segmentos `.mp3` de **0 bytes** para todas las escenas, aunque conserva WAV válidos y un AAC final con señal medible. Esto explica por qué el usuario puede percibir ausencia de voz dependiendo de qué archivo se reproduce o descarga: la ruta MP3 está rota aunque el contenedor MP4 tenga audio AAC.

El historial muestra que el último baseline funcional previo a la cadena MPE fue `d8212e3` (`fix: compact multi-stage discriminant layout`), después del cual se añadieron `f4aa585`, `9b65f8a`, `d04c305` y `a175004`. El baseline de audio que el usuario aprobó está representado por los renders `pedagogical_release_accepted`, `responsive_warm_fixed` y `microsteps_release_final`, todos con AAC 24 kHz mono y señal real; el render MPE posterior usa AAC 22.05 kHz y mezcla WAV derivada de MP3 vacíos.
