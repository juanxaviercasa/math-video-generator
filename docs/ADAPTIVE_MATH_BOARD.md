# Pizarra matemática persistente y composición adaptativa

## Objetivo

En una explicación matemática el estudiante debe poder ver **qué se está
resolviendo**, **qué operación cambió** y **por qué el resultado es válido**.

La versión del 8 de noviembre de 2026 incorpora este comportamiento en el
renderizador **estable** de Manim Community, no solo en el renderer experimental
de timeline. Se conserva la narración neural por micro-paso, la comprobación
matemática determinista y la auditoría real de geometría.

## Implementación

- `backend/src/services/adaptive-math-layout.service.ts`
  - `selectProblemAnchor()`: obtiene la expresión original a partir del
    `hook` del storyboard o del problema suministrado; no confunde la
    fórmula actual con el ejercicio que el alumno debe recordar.
  - `_create_problem_anchor()`: la fija **fuera** de los grupos de
    `FadeOut` y la mantiene visible durante la resolución, gráfica y recap.
  - `_work_bounds()`: reserva una zona superior y define el rectángulo
    de trabajo según proporción 16:9, 1:1 o 9:16.
  - `_fit_work()`: mide la anchura y altura **efectiva** después de compilar
    cada `MathTex`, incluidos subíndices, fracciones y radicales.
  - `_arrange_equation_stages()`: distribuye los pasos verticalmente;
    si necesitarían una reducción ilegible, pasa al modo focalizado (un paso
    visible por vez) sin eliminar el enunciado original.
  - `_animate_equation_step()`: utiliza `TransformMatchingTex` con
    fórmulas separadas en términos izquierdo, igual y derecho; anima los
    términos compartidos y respeta la duración preexistente del clip neural.
- `backend/src/services/manim.service.ts`: usa esos helpers también en
  las escenas ordinarias de resolución, recapitulación y verificación.
  Las gráficas ahora se sitúan debajo del área anclada.
- `backend/src/services/manim-geometry-qa.service.ts`: el reporte de
  objetos medidos identifica roles (`problem-anchor`, `math-primary`).
  Comprueba legibilidad, posición y permanencia del ejercicio en cada escena,
  además de recortes y colisiones.

## Reglas de diseño

El ejercicio original debe seguir visible de una escena a otra. No debe
mostrarse cuatro derivaciones completas en horizontal solo para ahorrar
altura: las operaciones se ordenan verticalmente y se alternan cuando el
ancho o alto reales lo exigen.

Una fórmula que no cabe con el escalado mínimo permitido provoca
`LAYOUT_UNREADABLE`, no un render con números microscópicos. Para expresiones
que todavía requieren partirse semánticamente en varias líneas o ejercicios
extensos en prosa, hace falta ampliar el storyboard y el anclaje; **no se
declara soporte universal** de problemas manuscritos o multirrenglón con estas
mejoras.

Los cambios no alteran el reloj de los clips neurales: la transición
matemática utiliza el tiempo que ya estaba reservado para revelar la fórmula.
La precisión palabra por palabra requiere un alineador real (por ejemplo
Qwen3 Forced Aligner o Whisper cuando exista un endpoint autorizado) y no se
afirma certificada con solo la duración global del MP4.

## Cómo ejecutar pruebas

```bash
npm ci
npm run prisma:generate --workspace backend
npm run lint
npm test
npm run build
```

Prueba multimedia en GitHub Actions: workflow `Precision Render Smoke`.
Incluye escenas reales Manim, audio de prueba y salidas en tres formatos.
La certificación en Oracle requiere además Edge TTS **real**, escucha humana,
QA del MP4 generado y recursos del VPS monitoreados.

Antes de actualizar Oracle:

1. Confirmar que los dos workflows del último commit aprobaron.
2. `git pull --ff-only` desde `main`; no parchear `dist/` en contenedores.
3. Ejecutar `scripts/deploy-oracle-personal.sh --check` y después `--apply`
   solo si no se comprometen los servicios preexistentes.
4. Regenerar la misma cuadrática en 1080p y revisar que el enunciado quede
   visible incluso durante la gráfica y el resumen.
5. Comparar tamaños reales, pausas, superposiciones, voz y persistencia.

## Investigación y licencias

| Repositorio | Técnica aplicada | Uso |
|---|---|---|
| [Manim Community](https://github.com/ManimCommunity/manim) | `MathTex`, `VGroup`, `TransformMatchingTex`, bounding boxes | Motor de producción; licencia MIT |
| [3Blue1Brown videos](https://github.com/3b1b/videos) | Persistencia de contexto y transformaciones semánticas | Solo referencia conceptual; contenido bajo CC BY-NC-SA; no se ha copiado código |
| [Manim Voiceover](https://github.com/ManimCommunity/manim-voiceover) | Marcadores y alineación de la narración | Referencia de diseño; no se instaló porque se conserva Edge TTS + FFmpeg existente |
| [SymPy](https://github.com/sympy/sympy) | Álgebra simbólica y generación LaTeX | Candidato para ampliar solvers verificados; no se importa todavía al runtime de esta fase |

Referencias: [Manim MathTex](https://docs.manim.community/en/stable/reference/manim.mobject.text.tex_mobject.MathTex.html),
[TransformMatchingTex](https://docs.manim.community/en/stable/reference/manim.animation.transform_matching_parts.TransformMatchingTex.html),
[Manim Voiceover](https://voiceover.manim.community/en/stable/quickstart.html).
