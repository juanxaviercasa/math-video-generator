# Math Presentation Engine: implementación incremental

## Estado

El Math Presentation Engine se integró de forma modular sobre el pipeline existente. Se conservaron Manim, FFmpeg, TTS, Supabase y el storyboard pedagógico de cuadráticas. La tercera fase convierte el engine en una capa de **Visual QA + Auto-Repair**: mide la composición con código, genera feedback estructurado, aplica reparaciones permitidas, vuelve a renderizar y conserva el candidato con mejor score.

```text
Solution
  -> validateMathProblem
  -> MathematicalSolutionStructure / Math AST
  -> existing pedagogical storyboard
  -> PresentationPlan
  -> deterministic layout + constraints
  -> Render
  -> Visual QA objective + optional multimodal reviewer
  -> actionable issues
  -> repair plan
  -> rerender, max 3–5 iterations
  -> best final scene/video
```

## Módulos

| Módulo | Responsabilidad |
|---|---|
| `math-ast.service.ts` | Convierte una cuadrática validada en AST, entidades, ecuaciones, transformaciones, resultados y gráfica. |
| `presentation.types.ts` | Contratos de AST, bloques visuales, escenas, bounding boxes, score, issues, reviewer abstracto, debug overlay y reparaciones. |
| `presentation-design.service.ts` | Tokens centralizados de color, tipografía, espaciado, escala mínima y canvas seguro. |
| `presentation-layout.service.ts` | Medición conservadora, fitting progresivo y plantillas verticales, horizontales, comparación y grid. |
| `presentation-constraint.service.ts` | Safe frame, colisiones, tamaño mínimo específico por bloque, containment, densidad y score configurable. |
| `presentation-engine.service.ts` | Orquesta AST, storyboard, layout, constraints y auto-repair inicial; cambia comparación comprimida a pila vertical cuando la legibilidad falla. |
| `visual-qa.service.ts` | Metadata FFprobe, frames centrales por escena, brillo real, issues objetivos, geometría, jerarquía, densidad, score global, debug data y reviewer opcional. |
| `visual-repair.service.ts` | Traduce issues a `RepairAction`, deduplica acciones y aplica cambios acotados sobre la `PresentationPlan`. |
| `manim.service.ts` | Renderiza el plan existente y, cuando `MPE_DEBUG=true`, superpone safe area, bounding boxes, IDs, roles, escalas, score e iteración. |
| `ffmpeg.service.ts` | Rechaza segmentos de audio vacíos o no decodificables antes de concatenar y mezclar. |
| `tts.service.ts` | Mantiene `es-MX-DaliaNeural` y `-8%` como defaults aprobados, valida MP3 neural, reintenta Edge y evita fallback silencioso. |

## Issues accionables

Cada problema objetivo se transforma en un objeto con esta forma semántica:

```json
{
  "type": "overflow",
  "severity": "error",
  "element": "equation-E7",
  "scene": "discriminant-setup",
  "measuredValue": "outside safe frame",
  "expectedValue": "inside safe frame",
  "suggestedRepair": "Reduce scale or move the block inside the safe frame.",
  "reason": "The element crosses the configured safe area."
}
```

El sistema cubre overflow horizontal y vertical, clipping implícito por safe frame, colisiones, containment de gráficas, relaciones de aspecto, tamaño mínimo, densidad excesiva, espacio vacío excesivo, márgenes inconsistentes, distancia excesiva, inversión de jerarquía y diagnósticos de fitting. Cada issue contiene la ubicación, la medición, el valor esperado, la causa y una reparación concreta.

## Reviewer multimodal abstracto

El contrato `VisualReviewer` no depende de Gemini, OpenAI, Claude ni un modelo local. Recibe el screenshot, la Scene Specification, el objetivo pedagógico y el contexto de solución, y devuelve JSON estructurado con score, issues y resumen. El reviewer no puede modificar código directamente: sus observaciones solo pueden convertirse en reparaciones del catálogo `RepairAction`.

El reviewer permanece opcional. Si no se inyecta una implementación, el reporte registra el estado `skipped` y el análisis objetivo sigue funcionando sin proveedor externo.

## Scoring

Los pesos se centralizan en `DEFAULT_VISUAL_SCORE_WEIGHTS` y se pueden sobrescribir por configuración. El modelo predeterminado sigue el esquema solicitado de 100 puntos.

| Dimensión | Peso |
|---|---:|
| Geometry | 25 |
| Readability | 20 |
| Hierarchy | 20 |
| Spacing | 15 |
| Consistency | 10 |
| Pedagogical clarity | 10 |

La densidad permanece como sub-score informativo y participa en spacing y en los issues de densidad. Los errores críticos reducen el total y marcan el score como `critical=true`; una reparación no puede considerarse válida si empeora significativamente la composición o mantiene errores duros.

## Auto-Repair y conservación del mejor resultado

El pipeline ahora ejecuta un ciclo controlado de render, análisis, reparación y rerender. El límite se configura con `MPE_MAX_REPAIR_ITERATIONS` y se acota internamente a cinco. El sistema conserva el artefacto con mayor score, aunque una iteración posterior falle o tenga un score menor.

| Issue | Reparación permitida |
|---|---|
| Overflow o chart containment | Reducción controlada de escala y nueva resolución. |
| Colisión | Cambio de plantilla a `vertical-stack` u otra composición no superpuesta. |
| Fórmula ilegible | Wrapping estructural, división semántica o cambio a pila vertical. |
| Densidad excesiva | Reducción de captions, ocultamiento de secundarios o división. |
| Distancia o margen inconsistente | Reubicación del ancla y reagrupación. |
| Jerarquía invertida | Ocultamiento de bloques secundarios y preservación del objeto primario. |

La fase inicial de reparación también detecta comparaciones con fórmula por debajo de legibilidad y las cambia a distribución vertical antes del render. Esto elevó el caso real de prueba de score 89 rechazado a score 95 aprobado.

## Modo DEBUG

Con `MPE_DEBUG=true`, el renderer inserta en el video una capa de diagnóstico que muestra la safe area, cajas de cada elemento, identificador, rol semántico, escala, score e iteración. Las cajas asociadas a diagnósticos duros se muestran en rojo; las demás, en verde. El reporte JSON conserva además las guías, colisiones, overflow y elementos para depuración programática.

El modo DEBUG está destinado a QA interno y no debe activarse en los videos de distribución final.

## Narración neural aprobada

La configuración de referencia es:

```env
TTS_PROVIDER=edge
TTS_NEURAL_VOICE=es-MX-DaliaNeural
TTS_NEURAL_RATE=-8%
TTS_NEURAL_RETRIES=2
TTS_ALLOW_LOCAL_FALLBACK=false
```

El servicio elimina archivos parciales, verifica tamaño y decodificación con FFprobe y reintenta Edge. Cuando Edge está configurado y no produce audio neural válido para todas las escenas, el job se detiene. Esto evita repetir el problema anterior, en el que archivos MP3 vacíos provocaron una caída silenciosa a espeak y una voz perceptiblemente peor.

## Cobertura

La suite contiene **42 tests aprobados**. Incluye AST determinista, storyboard, layout 16:9/1:1/9:16, fitting de fórmulas, overflow, colisiones, chart containment, scoring, issues accionables, auto-repair y fixtures para ecuaciones cortas y largas, sistemas, fracciones, raíces, matrices, derivadas, integrales, geometría, gráficas y múltiples pasos.

## Validación real

Se ejecutó un render real DEBUG en 16:9 con `mpe-debug-1786920058475`. Terminó en la iteración 0 con `presentationScore=95`, `visualQaPassed=true`, duración aproximada de 84 segundos y miniatura válida. La hoja de contacto y un frame nativo fueron inspeccionados visualmente. Las fórmulas de discriminante, sustitución, operación y resultado permanecen legibles; el overlay aparece sin clipping crítico.

La prueba neural controlada mantuvo la configuración aprobada, pero el entorno actual no pudo conectarse a `speech.platform.bing.com` después de dos reintentos. El sistema devolvió ausencia de audio y no usó espeak, por lo que no se acepta como narrado un video con una voz distinta. La referencia narrada previa sigue siendo el artefacto de comparación hasta que Edge vuelva a estar disponible en el entorno de ejecución.

## Limitaciones actuales

El AST determinista implementado cubre de forma completa la familia cuadrática existente. Los fixtures de sistemas, fracciones, raíces, matrices, derivadas, integrales y geometría ejercitan la presentación, fitting y containment, pero todavía no convierten todas esas familias en soluciones matemáticas verificadas. El siguiente incremento debe añadir parsers y solvers deterministas por familia.

El reviewer multimodal está preparado como interfaz y no se activa por defecto. La conectividad de Edge neural depende del entorno de ejecución y de la disponibilidad del endpoint externo; el código ahora falla de forma segura en vez de degradar la voz sin informar.
