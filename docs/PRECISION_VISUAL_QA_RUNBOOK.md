# Control de precisión visual y audiovisual

## Objetivo

El motor no debe publicar un MP4 por el solo hecho de existir. Esta fase establece puertas
de calidad sobre la matemática, el lienzo real de Manim, los tiempos de escena, el archivo
codificado y los fotogramas del video final.

**Límite importante:** la instrumentación de Manim mide objetos de texto y fórmulas en
fotogramas lógicos al concluir cada animación; no mide todos los píxeles durante las
transiciones. FFmpeg inspecciona el video completo buscando intervalos prácticamente vacíos.
La revisión humana de las muestras sigue siendo conveniente.

## Camino de producción

1. Validar el problema con solver determinista. No usar una gráfica de ejemplo si la función
   carece de coeficientes verificados.
2. Elaborar storyboard matemático con ramas reales o sin raíces reales según el discriminante.
3. Generar segmentos TTS, comprobar decodificación, convertir a WAV PCM mono de 24 kHz
   y añadir silencio al final de cada segmento hasta igualar su duración con la escena.
4. Renderizar con Manim en la relación de aspecto exacta y a 30 fotogramas por segundo.
5. Durante Manim, observar `Text`, `Tex` y `MathTex` después de cada `play()`.
   Guardar coordenadas reales, escena, tiempo y tamaño de cámara en JSON.
6. Proyectar los rectángulos observados al sistema de píxeles y bloquear clipping mayor
   de 2 px, colisiones de texto mayores de 2 px por eje y errores de cronología de más
   de 0,50 s por escena.
7. Exportar con FFmpeg; verificar codec/metadata con FFprobe: dimensiones, FPS,
   duración, presencia de narración y audio que se prolongue sobre una imagen terminada.
8. Analizar todos los fotogramas mediante `blackdetect` para bloquear intervalos casi
   vacíos de 0,70 s o más. Extraer fotogramas de revisión de la salida final.
9. Guardar los reportes antes de publicar el video; cualquier error crítico devuelve
   estado `failed`.

## Informes por trabajo

| Artefacto | Significado |
|---|---|
| `<id>-manim-geometry.json` | Objetos reales y marcas de tiempo medidas desde Manim |
| `<id>-geometry-qa.json` | Diagnóstico de posición, escala, colisiones y duración por escena |
| `<id>-render-integrity.json` | Resolución, FPS, duración y pistas de audio del MP4 final |
| `<id>-frame-qa.json` | Intervalos casi negros y rutas de fotogramas de inspección |
| `qa-frames/final-*.jpg` | Muestras del MP4 final para auditoría visual |

Las rutas anteriores son internas del trabajo y no se publican sin autorización de archivos.

## Reglas de aceptación

- **Exactitud matemática:** un solver no respaldado no habilita una solución ficticia.
- **Geometría:** los objetos de texto deben quedar dentro del área segura con tolerancia
  máxima de 2 px; no se aceptan colisiones entre textos simultáneos.
- **Legibilidad:** `Text` exige al menos `max(9 px, 1 % del alto)` y `Tex/MathTex`
  `max(12 px, 1,4 % del alto)`. Son pisos técnicos, no sustituyen una revisión
  editorial en pantalla móvil; su criterio puede endurecerse por tipo de elemento.
- **Sincronización:** variaciones de 0,15 a 0,50 s generan advertencia; desviaciones
  superiores a 0,50 s bloquean el video.
- **FPS:** se espera un valor promedio de 30 con tolerancia de 0,01 fps.
- **Fotogramas vacíos:** 0,40 a 0,70 s advierte, 0,70 s o más bloquea.
- **Audio:** si se pidió narración, una pista faltante o 0,50 s de audio después del
  fin de la imagen bloquean el video.

La cifra «2 px» no corresponde a milímetros físicos: es una tolerancia digital definida
en función de la resolución del archivo. No constituye garantía absoluta de ausencia de
errores perceptivos o pedagógicos.

## Smoke test real

Archivo: `backend/scripts/smoke-precision-render.ts`.

Ejecutar desde la raíz:

```bash
npm run smoke:precision --workspace backend
```

Requiere Manim Community, FFmpeg, FFprobe, LaTeX y dvisvgm instalados. El workflow
`.github/workflows/precision-render.yml` instala las dependencias en Ubuntu y prueba
tres lienzos: 16:9, 1:1, 9:16. Los MP4, mediciones y fotogramas quedan en el artefacto
`precision-render-samples` de GitHub Actions.

## Limitaciones y decisiones de seguridad

- El análisis geométrico se basa en objetos tipográficos de Manim y no detecta todos
  los defectos de gráficos complejos, objetos arbitrarios o colisiones intermedias
  entre keyframes.
- Los archivos de muestra permiten comparar y revisar visualmente errores que no
  se puedan formalizar como límites geométricos.
- Remotion es un compositor diferente. El reporte de Manim no certifica la salida de
  Remotion. `REMOTION_ENABLED=true` se bloquea por defecto hasta contar con un
  verificador independiente; `REMOTION_ALLOW_UNVERIFIED_LAYOUT=true` solo debe usarse
  en un entorno interno de QA, nunca para declarar calidad certificada.
- Un pass de pruebas unitarias no sustituye el smoke render en el runtime multimedia.
- El motor matemático requiere nuevos solvers verificables para familias que no sean
  las cuadráticas actualmente admitidas.
