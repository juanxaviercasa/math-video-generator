# Plan estratégico de sincronización pedagógica

## Decisión principal

El sistema no debe intentar “dibujar todo” ni dejar que un motor visual decida libremente qué mostrar. La producción debe partir de una **línea de tiempo pedagógica explícita**, donde cada frase de la narración tenga uno o varios eventos visuales asociados. El renderer restaurado continúa siendo la base de producción. No se reintroducirá todavía el Math Presentation Engine completo ni se modificarán las reglas de layout hasta validar esta estrategia con un único problema cuadrático.

> Principio rector: **la narración no describe una escena; la narración activa una secuencia de transformaciones visuales verificables**.

## 1. Objetivo de una lección correcta

La persona debe poder responder, en cada momento, tres preguntas: qué parte del problema estamos trabajando, qué operación estamos realizando y qué resultado parcial acabamos de obtener. La pantalla no debe adelantarse a la voz ni mostrar una fórmula final mientras la explicación todavía está presentando los datos iniciales.

La secuencia ideal para la ecuación `x² − 5x + 6 = 0` no es una colección de tarjetas independientes. Es una historia matemática continua:

| Orden | La voz explica | La pantalla muestra | Acción visual |
|---:|---|---|---|
| 1 | “Esta es la ecuación que vamos a resolver” | `x² − 5x + 6 = 0` | Aparece la ecuación completa y permanece visible |
| 2 | “Identificamos a, b y c” | La ecuación arriba; debajo `a=1`, `b=−5`, `c=6` | Se resaltan uno por uno los coeficientes correspondientes |
| 3 | “Sustituimos en la fórmula de la discriminante” | Fórmula base arriba; sustitución numérica debajo | Se transforma la expresión, no se reemplaza de golpe |
| 4 | “Operamos: 25 menos 24” | `Δ = 25 − 24` | Se resaltan los dos términos que se están operando |
| 5 | “La discriminante es 1” | `Δ = 1` | El resultado queda grande y estable antes de continuar |
| 6 | “Ahora usamos la fórmula general” | Fórmula general sin valores | Se presenta la plantilla antes de sustituir |
| 7 | “Reemplazamos a, b y la discriminante” | Fórmula con números, fracción vertical | Se conserva la fórmula de referencia arriba |
| 8 | “Calculamos las dos ramas” | `x₁ = 3` y `x₂ = 2` | Aparecen por separado y luego juntas |
| 9 | “Comprobamos gráficamente” | Parábola y raíces | El gráfico confirma; no introduce información nueva |
| 10 | “Resultado final” | Soluciones y resumen | Se mantiene el resultado mientras termina la voz |

## 2. Modelo mínimo de sincronización

Cada escena debe dividirse en `NarrationSegment` y `VisualEvent`. El segmento de audio es la unidad temporal; el evento visual es la unidad pedagógica. Una escena puede contener varios eventos, pero cada evento debe tener un propósito único.

```ts
interface NarrationSegment {
  id: string;
  text: string;
  audioPath: string;
  durationSeconds: number;
  emphasis?: string[];
}

interface VisualEvent {
  id: string;
  segmentId: string;
  action: 'show' | 'highlight' | 'transform' | 'write' | 'replace' | 'plot' | 'hold' | 'hide';
  targetId: string;
  from?: string;
  to?: string;
  startOffset: number;
  duration: number;
  holdAfter: number;
  pedagogicalRole: 'context' | 'data' | 'operation' | 'result' | 'verification';
}
```

El pipeline debe construir primero el texto y los eventos, después generar el audio por segmento, medir la duración real y finalmente ajustar los tiempos visuales. No se debe estimar la duración solo contando palabras. La duración del archivo de audio generado es la fuente de verdad.

## 3. Regla de permanencia visual

Un elemento importante no desaparece inmediatamente después de ser pronunciado. Cada resultado parcial debe permanecer visible durante una pausa breve para permitir comprensión. La regla inicial recomendada es:

| Tipo de elemento | Permanencia mínima después de aparecer |
|---|---:|
| Enunciado o fórmula base | 0,8 s |
| Dato o coeficiente | 0,6 s |
| Operación intermedia | 0,8 s |
| Resultado importante | 1,2 s |
| Resultado final | 2,0 s |
| Gráfico de verificación | 1,5 s |

Estas pausas no deben agregarse al final de todos los audios de forma indiscriminada. Deben formar parte de la línea de tiempo de cada evento y deben ser visibles en el video sin crear una pantalla negra.

## 4. Transformaciones, no tarjetas aisladas

El error principal de los prompts anteriores fue tratar cada paso como una tarjeta nueva. La estrategia correcta es una **escena persistente** con un objeto matemático que se transforma. La ecuación original puede permanecer en una franja superior pequeña; el área central muestra la transformación actual; una franja lateral o inferior muestra el objetivo del paso y el resultado parcial.

La transición debe ser semántica. Para sustituir `a=1`, `b=−5` y `c=6`, se resaltan los coeficientes de la ecuación y se desplazan hacia sus posiciones en la fórmula. Para pasar de `Δ = (−5)² − 4(1)(6)` a `Δ = 25 − 24`, se reemplazan únicamente los subcomponentes correspondientes. No se debe borrar toda la pantalla y volver a escribir una fórmula final sin explicar la relación entre ambas.

## 5. División de responsabilidades

La solución matemática debe producir una estructura semántica. El storyboard pedagógico decide el orden humano de la explicación. El sincronizador convierte cada frase en eventos visuales. Manim solo debe ejecutar esos eventos. El renderer no debe inferir la matemática a partir de texto libre.

```text
Problema
  -> solución validada
  -> pasos pedagógicos
  -> segmentos de narración
  -> eventos visuales sincronizados
  -> línea de tiempo con duraciones reales
  -> renderer restaurado
  -> validación de audio y sincronización
```

En esta primera versión no se necesita un nuevo layout engine. Se reutilizarán las posiciones y tipografías del renderer estable. La mejora debe estar en el **qué aparece y cuándo**, no en cambiar el tamaño de todos los elementos.

## 6. Estrategia de voces

La voz aprobada queda como predeterminada: `es-MX-DaliaNeural`, estilo cálido y ritmo `-8%`. La voz debe ser intercambiable por configuración, no por lógica visual. Se puede agregar un catálogo con voces masculinas y femeninas, pero cada voz debe pasar una prueba corta de pronunciación matemática antes de aparecer en producción.

| Perfil | Uso recomendado |
|---|---|
| Dalia neural, cálida, `-8%` | Perfil educativo predeterminado aprobado |
| Voz masculina neural cálida | Alternativa para cursos o personalidad de marca |
| Voz neutral neural | Lecciones breves, técnicas o de repaso |
| Fallback local | Solo diagnóstico explícito; nunca debe mezclarse silenciosamente con Edge |

La selección de voz no debe cambiar la estructura de los eventos. Solo puede cambiar las duraciones reales de los segmentos. Si una voz habla más lento, la línea de tiempo se estira; la pantalla no debe adelantarse.

## 7. Arquitectura mínima y reversible

La primera implementación debe añadir únicamente tres conceptos: `NarrationSegment`, `VisualEvent` y `LessonTimeline`. No se debe modificar aún el sistema completo de constraints ni activar Auto-Repair durante la validación inicial.

Los flags recomendados son:

```env
NARRATION_TIMELINE=true
NARRATION_VOICE=es-MX-DaliaNeural
NARRATION_RATE=-8%
NARRATION_STRICT_AUDIO=true
MPE_PRODUCTION_ENABLED=false
```

`MPE_PRODUCTION_ENABLED=false` mantiene el renderer estable. `NARRATION_TIMELINE=true` habilita solo el sincronizador nuevo. Si algo falla, se puede volver a `false` sin cambiar el resto de la producción.

## 8. Plan de validación incremental

La validación debe comenzar con un único problema cuadrático y una sola voz. Primero se valida el audio segmentado; después, la línea de tiempo sin render; luego, el video sin narración; finalmente, el video narrado.

| Fase | Prueba | Criterio de aceptación |
|---:|---|---|
| A | Generar 10 segmentos de voz | Todos tienen tamaño, duración y decodificación válidos |
| B | Imprimir la línea de tiempo | No hay solapamientos, huecos inesperados ni eventos fuera del segmento |
| C | Render sin audio | Cada evento aparece en el orden previsto y ningún paso queda vacío |
| D | Render narrado | La voz explica el evento visible correspondiente en el mismo intervalo |
| E | Revisión humana | El usuario puede identificar la fórmula, sustitución y resultado sin pausar el video |
| F | Regresión | La salida restaurada anterior sigue disponible y no cambia cuando el flag está desactivado |

No se debe aceptar un cambio porque el score numérico aumente. La aceptación exige simultáneamente: audio audible, continuidad visual, ecuaciones legibles, ausencia de desbordamiento, relación correcta entre voz y pantalla y resultado matemático correcto.

## 9. Orden recomendado de implementación posterior

Primero se implementará la línea de tiempo para la cuadrática actual, porque es la única familia con solver y storyboard confiables. Después se corregirá la pronunciación segmento por segmento, no mediante una narración larga generada de una sola vez. Luego se añadirán eventos de resaltado y transformación. Solo cuando la secuencia cuadrática sea aprobada se extraerá el patrón para ecuaciones lineales y sistemas.

Las demás familias no deben entrar todavía al renderer como si estuvieran resueltas. Cada nueva familia requerirá solver, AST, storyboard y pruebas propias. De esta forma el sistema crecerá de manera controlada y no volverá a producir videos visualmente atractivos pero matemáticamente genéricos o incorrectos.

## Decisión pendiente del usuario

Antes de escribir código, se debe elegir una de estas dos opciones de producto:

| Opción | Descripción | Recomendación |
|---|---|---|
| A | Mantener Dalia neural como única voz durante la primera implementación de timeline | Recomendada para estabilizar sincronización |
| B | Probar desde el inicio perfiles masculino y femenino | Posponer hasta que la sincronización de Dalia sea aprobada |

La recomendación es comenzar con **Opción A**, usando la voz ya aprobada como referencia fija. Una vez que la sincronización sea correcta, cambiar de voz será una variación controlada de duración, no un nuevo problema de diseño.
