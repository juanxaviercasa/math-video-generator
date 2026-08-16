# Math Presentation Engine: implementación incremental

## Estado

El Math Presentation Engine se integró de forma modular sobre el pipeline existente. El renderer Manim, FFmpeg, TTS, Supabase y el storyboard de cuadráticas se conservaron. El nuevo flujo añade una capa de estructura semántica, plan visual, layout determinista, restricciones, score y QA post-render.

```text
Math problem
  -> validateMathProblem
  -> MathematicalSolutionStructure
  -> existing pedagogical storyboard
  -> PresentationPlan
  -> deterministic layout + constraints
  -> existing Manim renderer
  -> FFmpeg export + narration
  -> Visual QA report
```

## Módulos

| Módulo | Responsabilidad |
|---|---|
| `math-ast.service.ts` | Convierte una cuadrática validada en AST, entidades, ecuaciones, transformaciones, resultados y gráfica |
| `presentation.types.ts` | Contratos de AST, bloques visuales, escenas, bounding boxes, score, QA y reparaciones |
| `presentation-design.service.ts` | Tokens centralizados de color, tipografía, espaciado, escala mínima y canvas seguro |
| `presentation-layout.service.ts` | Medición conservadora, fitting progresivo y plantillas verticales, horizontales y grid |
| `presentation-constraint.service.ts` | Safe frame, colisiones, tamaño legible, containment, densidad y score 0–100 |
| `presentation-engine.service.ts` | Orquesta AST, storyboard, layout, constraints y auto-repair de máximo tres intentos |
| `visual-qa.service.ts` | Metadata FFprobe, frames centrales por escena, brillo real, reporte QA y hook multimodal opcional |

## Reglas de fitting

Las fórmulas intentan conservar primero tamaño normal. Si no caben, se reduce de forma controlada, se ajusta al ancho, se hace wrapping estructural o se marca la necesidad de dividir la escena. El layout nunca acepta silenciosamente una escala inferior al mínimo legible sin emitir diagnóstico.

Las pilas verticales y horizontales calculan el tamaño del grupo completo antes de posicionar sus hijos. El factor aplicado es el mínimo entre ancho y alto disponibles. Se incluye una tolerancia numérica de `1e-6` para no marcar como overflow una caja que coincide exactamente con el borde seguro.

## Jerarquía

Las escenas declaran roles semánticos: `formula-base`, `substitution`, `operation`, `result`, `caption` y `chart`. La fórmula de referencia recibe prioridad secundaria, el paso activo prioridad primaria o terciaria según el momento y el resultado recibe el color de confirmación.

En formato horizontal, las escenas de cuatro etapas usan fórmula base arriba y operaciones agrupadas debajo. En formato vertical, las cuatro etapas se apilan y se centran para evitar una fila comprimida en la parte inferior.

## Auto-repair

Cuando el plan incumple restricciones duras, se ejecutan como máximo tres intentos de reparación. La primera implementación reduce la densidad y el tamaño mínimo de forma controlada, vuelve a resolver el layout y vuelve a validar. Si el plan continúa fallando, el job se marca como fallido y conserva el diagnóstico en el flujo de progreso.

## Visual QA

El QA se ejecuta después de producir el video y antes de generar la miniatura final. Comprueba existencia del artefacto, dimensiones, relación de aspecto, frames centrales por escena y brillo medio del frame. El detector de brillo evita confundir el fondo oscuro intencional del diseño con una pantalla vacía. El hook `reviewFrameWithOptionalAI()` devuelve un diagnóstico estructurado y permanece deshabilitado salvo que `AI_VISUAL_REVIEWER=true`.

## Cobertura

La suite actual contiene **38 tests**. Incluye AST determinista, estructura de storyboard, layout 16:9/1:1/9:16, fitting de fórmulas, overflow, colisiones, chart containment, auto-repair y fixtures para ecuaciones cortas y largas, sistemas, fracciones, raíces, matrices, derivadas, integrales, geometría, gráficas y múltiples pasos.

## Validación real

Se ejecutaron renders de aceptación en los tres formatos. Los renders 16:9, 1:1 y 9:16 completaron con `presentationPlanVersion=math-presentation-engine-v1`, score entre 87 y 88, `visualQaPassed=true` y sin warnings de frames vacíos. También se completó un render narrado 16:9 con duración aproximada de 143 segundos, audio neural segmentado y QA visual aprobado.

## Limitaciones actuales

El AST determinista implementado cubre de forma completa la familia cuadrática existente. Los fixtures de sistemas, fracciones, raíces, matrices, derivadas, integrales y geometría ejercitan la capa de presentación, fitting y containment, pero todavía no convierten todas esas familias en soluciones matemáticas verificadas. El siguiente incremento debe añadir parsers/solvers por familia sin permitir que el LLM sustituya la verificación determinista.

El revisor multimodal está preparado como interfaz, pero no se activa por defecto ni modifica código. Sus futuros diagnósticos deberán convertirse exclusivamente en acciones de reparación permitidas por catálogo.
