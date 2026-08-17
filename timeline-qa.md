# QA inicial del timeline pedagógico

El primer render con `NARRATION_TIMELINE=true` completó con audio AAC 24 kHz mono y volumen real (`mean_volume=-19.5 dB`, `max_volume=-3.3 dB`). La línea de tiempo se ejecuta y muestra microeventos por escena, pero la hoja `/tmp/mvg-timeline-contact2.jpg` evidencia que varias fórmulas aparecen demasiado pequeñas y con captions débiles. El problema está localizado en la plantilla opcional de microeventos: conserva el panel estable, pero todavía usa una composición demasiado compacta para el contenido del evento. No se debe tocar el renderer baseline ni activar MPE; el siguiente ajuste debe aumentar la escala y jerarquía de los eventos timeline, mantener la fórmula de referencia visible y volver a renderizar el mismo caso.

El tercer render (`/tmp/mvg-restore-baseline-1786926137267/...-narrated.mp4`) conserva audio AAC válido, pero la hoja `/tmp/mvg-timeline-contact3.jpg` muestra el problema opuesto: algunos grupos de microeventos se amplían demasiado porque `scale_to_fit_width` escala hacia arriba cuando el contenido es pequeño. Se observan etiquetas gigantes y clipping en discriminante y resultado. La regla general debe ser `scale(min(maxEventScale, widthFit, heightFit))`, con un máximo menor que 1, para que el fitting solo reduzca contenido grande y nunca lo agrande hasta romper la jerarquía.

El cuarto render (`/tmp/mvg-restore-baseline-1786926308762/...-narrated.mp4`) ya no presenta clipping ni texto gigante y conserva audio válido. Sin embargo, el contacto `/tmp/mvg-timeline-contact4.jpg` muestra que el máximo `0.86` dejó los microeventos demasiado pequeños para una pantalla educativa. La siguiente regla será un máximo moderado de `1.18`, limitado siempre por ancho y alto disponibles; esto debe recuperar legibilidad sin permitir el desbordamiento observado en el tercer render.

Los frames nativos `/tmp/mvg-timeline-native-contact.jpg` confirman que la escala del quinto render no desborda y es legible en escenas simples. Sin embargo, la escena de sustitución del discriminante captura elementos superpuestos durante `ReplacementTransform`, y la composición sigue siendo demasiado pequeña para una experiencia educativa óptima. La regla siguiente no será aumentar globalmente la escala: se debe evitar capturar estados intermedios con objetos viejos y nuevos simultáneos, usando una transición controlada o `FadeOut` + `FadeIn` para sustituciones semánticamente distintas. También se debe conservar la fórmula de referencia como elemento estable separado del valor transformado.

El sexto render (`/tmp/mvg-restore-baseline-1786926642115/...-narrated.mp4`) mantiene AAC 24 kHz mono, `mean_volume=-19.5 dB` y `max_volume=-3.3 dB`. El contacto `/tmp/mvg-timeline-contact6.jpg` ya no muestra superposición de fórmulas: la transición usa salida/entrada limpia. No hay clipping. La escala es conservadora, por lo que la siguiente validación debe ser humana sobre el MP4 y no seguir aumentando globalmente la tipografía sin evidencia de resolución nativa.

## Pilot timeline 16:9 — primera auditoría real

Artefacto: `/tmp/mvg-timeline-pilot-16x9/timeline-pilot-16x9-narrated.mp4`.

El pipeline terminó correctamente con voz neural y audio AAC. La auditoría multimodal observó buena alineación general, fórmula de referencia persistente, coeficientes visibles, checkpoint de predicción y composición limpia. El video no se aprobó por tres clases de problemas: clipping del título inicial, posible error de pronunciación/representación del producto `4ac` negativo y superposición en las ramas `x_1` y `x_2`. También se reportó un frame transitorio con un símbolo incorrecto antes de `Δ = 100`.

Decisión: no activar el flag en producción. Corregir primero el título con fitting seguro, revisar el texto oralizado mediante transcripción y separar las ramas de solución en bloques independientes con escala y ancho máximos. Repetir el render real antes de continuar con 1:1 y 9:16.

### Evidencia adicional

La transcripción del MP4 confirmó el error de pronunciación: “Cuatro por tres por menos ocho es menos un definet dieciséis” en lugar de “menos noventa y seis”. El origen debe investigarse en la oralización de expresiones o en la segmentación del texto, no asumirse como un simple problema visual.

La inspección de fotogramas confirmó que la fórmula de referencia aparece, pero en la escena de discriminante la línea activa queda demasiado próxima y presenta una transición con apariencia de solapamiento. La solución de ramas requiere una revisión nativa; el análisis automático reportó duplicación visual en `x_1` y `x_2`, aunque la evidencia debe comprobarse en frames específicos antes de aceptar la corrección.

## Cuarto piloto 16:9 — apertura y correcciones confirmadas

Artefacto: `/tmp/mvg-timeline-pilot-16x9-v4/timeline-pilot-16x9-v4-narrated.mp4`.

La transcripción confirma que la corrección de pronunciación funciona: “cuatro por tres por menos ocho da como resultado menos noventa y seis”; también se redujo la repetición de decimales a “uno punto tres tres tres”. La auditoría visual confirma que las ramas se muestran secuencialmente y que la fórmula de referencia persiste.

La inspección nativa de los frames 0.2 s y 0.8 s confirma dos defectos pendientes: la narración empieza sobre fondo negro antes de que aparezca el panel y el título de apertura entra recortado durante el `Write`, aunque después termina completo. El fitting debe ejecutarse antes de animar/escribir el título, y la apertura debe mostrar un fondo/panel seguro antes de que empiece la primera narración.

La auditoría también reporta que el recap conserva un label heredado (“Identificar”) y que la operación visual `4 - -96` es confusa. Estos serán los siguientes ajustes del piloto.

## Validación social — 1:1 y 9:16

Artefactos aprobados por QA multimodal:

| Formato | Resolución | Audio | Duración | Resultado |
|---|---:|---|---:|---|
| 1:1 | 720×720 | AAC | 146 s | Aprobado |
| 9:16 | 720×1280 | AAC | 146 s | Aprobado |

Ambos formatos mantuvieron el safe frame, la fórmula persistente, los coeficientes, el checkpoint, las ramas secuenciales, el recap y la gráfica parametrizada con raíces `-2` y `1.333`. La inspección de miniaturas confirmó que la jerarquía se conserva en cuadrado y vertical, aunque el formato vertical naturalmente reduce el tamaño relativo de las fórmulas; no se detectó clipping.

El piloto 16:9 v6 también quedó aprobado después de corregir la apertura, la pronunciación de números negativos, la transición de ramas, el recap y la gráfica hardcodeada. Artefactos: `/tmp/mvg-timeline-pilot-16x9-v6/timeline-pilot-16x9-narrated.mp4`, `/tmp/mvg-timeline-pilot-1x1-v1/timeline-pilot-1x1-narrated.mp4`, `/tmp/mvg-timeline-pilot-9x16-v1/timeline-pilot-9x16-narrated.mp4`.

## No-regresión del renderer estable

Con `NARRATION_TIMELINE=false` se generó `/tmp/mvg-stable-regression-v1/timeline-pilot-16x9-narrated.mp4`. El artefacto terminó con H.264, AAC, 1280×720, 30 fps y 141 s. La miniatura conserva la composición baseline: panel completo, fórmula principal, fórmula general y ruta de solución sin clipping. La ruta estable no utiliza anchors, checkpoints ni la gráfica dinámica del piloto experimental.
