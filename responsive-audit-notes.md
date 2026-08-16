# Auditoría responsive del generador

## Hallazgos críticos

La API actual solo acepta `quality` y no tiene un contrato explícito para proporción, orientación, ancho, alto, zona segura ni estrategia de composición. El backend produce una escena Manim con coordenadas fijas basadas en una cámara implícita de 14 × 8 unidades y luego FFmpeg escala únicamente por calidad. Esto permite que un bloque diseñado para 16:9 se recorte o se desborde al cambiar de formato.

El procesador actual traduce `low`, `medium` y `high` a `480`, `1080` y `4k`, pero `ffmpeg.service.ts` solo reconoce `1080` y `4k`; el caso `480` no fija una dimensión explícita. La miniatura usa siempre `scale=1280:720`, lo que distorsiona formatos cuadrados o verticales.

El renderizador usa paneles de `13.5 × 7.0`, fórmulas y tipografías fijas, y varias escenas colocan grupos con `move_to`, `scale_to_fit_width` o `scale_to_fit_height` sin un sistema común de margen interior. La estrategia correcta será diseñar cada escena dentro de un `content_frame` calculado desde la cámara y aplicar escalado uniforme con margen seguro, además de validar bounding boxes antes de renderizar.

El formulario frontend no permite escoger formato ni muestra una vista previa de la zona segura. La API frontend tampoco transporta un perfil de formato. La nueva interfaz debe ofrecer `16:9`, `1:1` y `9:16`, mostrar dimensiones resultantes, recomendar safe margins y mantener un preset por defecto `16:9`.

## Contrato propuesto

| Campo | Valores iniciales | Propósito |
|---|---|---|
| `aspectRatio` | `landscape`, `square`, `portrait` | Seleccionar 16:9, 1:1 o 9:16 |
| `canvasPreset` | `youtube_hd`, `square_social`, `shorts` | Resolver dimensiones y límites de exportación |
| `safeMargin` | `0.08` del ancho/alto menor | Evitar recortes y zonas de interfaz de redes |
| `layoutDensity` | `comfortable`, `compact` | Controlar cuánto contenido se muestra sin forzar pantalla completa |
| `narrationStyle` | `warm_teacher`, `neutral_teacher` | Añadir emoción controlada sin perder precisión |

## Criterio de aceptación

Ningún objeto visual debe salir del `content_frame`; las fórmulas deben conservar fracción vertical y legibilidad; el mismo storyboard debe producir composiciones específicas para los tres formatos; las miniaturas deben conservar la proporción; el frontend debe enviar el perfil; y cada formato debe tener al menos un render de regresión validado por ffprobe y revisión visual.
