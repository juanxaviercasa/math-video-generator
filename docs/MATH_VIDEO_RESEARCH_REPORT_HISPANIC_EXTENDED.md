# Investigación ampliada de videos virales de matemáticas en español

**Autor:** Manus AI  
**Repositorio:** `juanxaviercasa/math-video-generator`  
**Rama:** `improvements/production-mvp`  
**Fecha:** 17 de agosto de 2026  
**Alcance:** análisis público, observacional y multimodal de diez canales hispanohablantes de matemáticas y de videos representativos.

## Resumen ejecutivo

La investigación ampliada confirma que no existe una única receta visual para un video matemático de alta difusión. Los canales con autoridad estudiados utilizan pizarras físicas, interfaces digitales, avatares, divulgación narrativa y clases intensivas. Sin embargo, los formatos que mejor sostienen la comprensión repiten una arquitectura común: **promesa clara, referencia persistente, transformación visible, ritmo por dificultad, participación del estudiante y comprobación**.

El patrón más importante para `math-video-generator` es la **permanencia de contexto**. JulioProfe, Daniel Carrión, Matemáticas profe Alex, Profesor10demates, unicoos, Matemáticas con Juan, Khan Academy en Español y Tareasplus mantienen de alguna manera el problema original, la fórmula, la función o el enunciado mientras ejecutan la operación. El espectador no tiene que reconstruir de memoria qué significa cada término.

El segundo patrón es que la explicación humana no avanza con una duración uniforme. Los conceptos, signos y errores reciben más pausa; las operaciones mecánicas se aceleran; la comprobación recibe un cierre reconocible. El timeline del producto debe modelar tipos de evento y no limitarse a dividir la duración de la narración en bloques iguales.

El tercer patrón es afectivo. Los comentarios públicos de Profe Alex y Derivando muestran que la audiencia no solo busca una respuesta: busca perder el miedo, comprender después de años de frustración y sentir que el profesor acompaña. Esto no implica copiar personalidades o branding. Sí implica diseñar una voz cálida, lenguaje inclusivo, empatía explícita y pequeñas invitaciones a participar.

> **Conclusión operativa:** el generador debe comportarse como una pizarra inteligente con memoria: conservar el problema, señalar la parte activa, mostrar el paso intermedio, dejar tiempo para pensar y cerrar verificando.

## 1. Metodología y límites

Se seleccionaron diez canales hispanohablantes con presencia pública, corpus educativo reconocible o alta difusión observable. Para cada canal se escogió un video representativo, priorizando resolución de ejercicios, explicación de fórmulas, funciones, ecuaciones o divulgación matemática. La inspección multimodal registró hook, promesa, presencia humana, pizarra o interfaz, disposición espacial, color, fórmula de referencia, sustitución, pausas, ritmo, voz, transiciones, comprobación y cierre.

Los metadatos de vistas, likes, duración y suscriptores son instantáneas públicas de las páginas consultadas. No equivalen a retención. YouTube reserva métricas como duración media, porcentaje visto, picos y caídas para el propietario mediante YouTube Analytics [1]. Los análisis audiovisuales se guardaron individualmente en `docs/research/visual-inspections/`. Los comentarios se recolectaron únicamente cuando la vía pública estuvo disponible y se conservaron en `docs/research/comments/`.

La muestra de comentarios tiene valor cualitativo, no estadístico. La extracción devolvió 44 comentarios de JulioProfe, 100 de Matemáticas profe Alex y 100 de Derivando. Otros videos presentaron errores de respuesta o timeouts, por lo que no se inventaron comentarios faltantes. La clasificación por categorías es heurística y se utiliza para orientar una lectura humana, no para afirmar causalidad.

## 2. Corpus y señales públicas

| Canal | Video inspeccionado | Señal pública recuperada | Rol pedagógico |
|---|---|---:|---|
| JulioProfe | [Sistemas 2×2 por igualación](https://www.youtube.com/watch?v=ooBVD4JpoLg) | 44:35; 44,355 vistas en la consulta | Método, pizarra, calculadora y gráfica |
| Daniel Carrión | [Graficar funciones cuadráticas](https://www.youtube.com/watch?v=gnAdna_tLK0) | 8.65 M de vistas en la consulta | Avatar, tabla, fórmula y gráfica |
| Matemáticas profe Alex | [¿Qué es una función?](https://www.youtube.com/watch?v=HAeSkQH1C-I) | 27:08; 2.4 M en la playlist | Analogía, definición y ejemplos |
| Profesor10demates | [Problemas de sistemas](https://www.youtube.com/watch?v=lLIclhQVtJc) | 25:11; 25,230 vistas; 686 K suscriptores del canal | Problemas verbales y secuencia algorítmica |
| math2me | [Diferencia de cuadrados](https://www.youtube.com/watch?v=ghdUhvxVIec) | 12:00; capítulos; 2.48 M suscriptores del canal | Prerrequisitos y factorización |
| unicoos | [Ecuación de segundo grado](https://www.youtube.com/watch?v=zmL12JP8_pM) | 11:42; 856 K vistas | Fórmula general y casos |
| Matemáticas con Juan | [Álgebra desde cero](https://www.youtube.com/watch?v=_6uyQISZvBc) | Playlist pública “Aprender matemáticas desde cero” | Clase intensiva y analogías |
| Derivando | [¿Para qué sirven las matemáticas?](https://www.youtube.com/watch?v=RlUZv0MoVWk) | Canal con 1.58 M suscriptores en la página consultada; video relacionado de logaritmos con 2.5 M | Motivación y divulgación |
| Khan Academy en Español | [Interpretando ecuaciones gráficamente](https://www.youtube.com/watch?v=GGSgkjsaqc4) | 2,038 vistas; 6 likes; 742 K suscriptores del canal | Interfaz, pausa activa y feedback |
| Tareasplus | [Ecuación de primer grado, ejercicio 6 de 15](https://www.youtube.com/watch?v=1NYxg5Q7u3c) | 491 vistas; ejercicio 7 relacionado con 9.4 K | Serie modular de ejercicios |

Las cifras no se utilizan para ordenar “el mejor canal”. Un video de divulgación, un ejercicio de tres minutos y un directo de 45 minutos tienen objetivos y superficies de distribución diferentes. El valor del corpus está en comparar comportamientos visuales y pedagógicos que se repiten entre formatos.

## 3. Análisis detallado por canal

### 3.1 JulioProfe: método, acompañamiento y verificación tecnológica

El video de sistemas 2×2 comienza con un saludo cálido y una declaración directa del tema. Al ser un directo grabado, reserva un tramo amplio para interacción con el chat antes de comenzar la clase formal. En una versión editada para consumo bajo demanda, esa parte debería convertirse en un saludo breve y un capítulo de navegación, no copiarse completa.

La pizarra física organiza el sistema original a la izquierda y el desarrollo hacia el centro y la derecha. El problema inicial permanece visible. El negro sostiene la escritura base, el rojo marca etiquetas y resultados, y azul o verde sirven para notas y pasos. El profesor alterna una explicación conceptual pausada con una ejecución aritmética más ágil. Usa “nosotros” —“despejamos”, “tenemos”— para convertir la resolución en actividad compartida.

El rasgo diferencial es la verificación tecnológica: el profesor introduce coeficientes en una calculadora y después muestra la intersección gráfica. La herramienta no reemplaza el razonamiento; funciona como autoevaluación. Los comentarios valoran que el docente es metódico, claro y útil para exámenes, y algunos preguntan por libros, derivadas o herramientas alternativas.

**Transferencia:** conservar el problema original, explicar la justificación formal detrás de los atajos, dedicar una escena a comprobar y añadir capítulos cuando la lección sea larga.

### 3.2 Daniel Carrión: energía, avatar y composición de fórmula-tabla-gráfica

El video de función cuadrática abre con una cortina animada, un avatar entusiasta y una promesa explícita. El profesor desaparece durante el cálculo para liberar espacio a la pizarra digital. La composición ubica la ecuación arriba, la tabla de valores a la izquierda y la gráfica a la derecha.

La fórmula y los valores de `a`, `b` y `c` permanecen en una esquina. Los números entran en los paréntesis de la fórmula original, en lugar de aparecer como una respuesta desconectada. La tabla se construye alrededor del vértice y los puntos aparecen uno por uno antes de trazar la parábola. El tono es energético y utiliza refuerzos breves después de los hitos.

**Transferencia:** el color debe representar variables de forma estable; la sustitución debe respetar la estructura de la fórmula; una gráfica no debe aparecer de golpe si antes puede mostrar tabla, puntos y simetría.

### 3.3 Matemáticas profe Alex: intuición inductiva y analogías persistentes

El video sobre funciones comienza con una pregunta directa: qué es una función. La definición formal se retrasa hasta que el espectador ha visto ejemplos y una analogía de “máquina”. El profesor ocupa aproximadamente un tercio de la pantalla y utiliza el resto para animaciones, conjuntos y transformaciones.

La fórmula de referencia permanece visible mientras entran valores. El color distingue función, entradas y salidas. Las pausas en puntos concretos invitan al espectador a adivinar la regla antes de revelarla. También se incluyen negativos, decimales y casos restringidos, por lo que la intuición no queda limitada a ejemplos cómodos.

Los comentarios son especialmente reveladores: aparecen testimonios de personas mayores que retoman matemáticas, profesores que utilizan el canal para preparar sus clases, estudiantes que lo ven antes de exámenes y familias que ayudan a sus hijos. Las palabras recurrentes son paciencia, claridad, amor por enseñar y reducción del miedo. En la muestra heurística de 100 comentarios aparecen 42 con señales de afecto/confianza, 30 de utilidad de estudio y 14 de claridad; estas categorías pueden solaparse.

**Transferencia:** comenzar con una analogía visual, retrasar la definición hasta que exista un modelo mental, insertar pausas predictivas, usar color semántico y diseñar la narración para que el estudiante se sienta acompañado.

### 3.4 Profesor10demates: plantilla repetible para problemas verbales

El video abre con energía y una lista visual de los tipos de problemas que cubrirá. Las cortinillas separan bloques y reducen la sensación de una lección larga. El instructor aparece en PIP durante advertencias y trucos, mientras la pizarra digital ocupa la mayor parte de la pantalla.

Cada problema repite una estructura: leer, definir variables, plantear ecuaciones, elegir método, resolver, responder en lenguaje natural y comprobar. Las dos ecuaciones usan colores diferentes y se conservan mientras se sustituyen. Los errores clásicos reciben una advertencia explícita y una pausa dramática.

**Transferencia:** convertir la secuencia `definir → plantear → resolver → responder → comprobar` en una plantilla de storyboard para problemas verbales. La presencia humana debe aparecer en momentos de consejo, no competir con una fórmula compleja.

### 3.5 math2me: prerrequisitos y el paso intermedio invisible

El video de diferencia de cuadrados dedica los primeros minutos a raíces cuadradas y prerrequisitos. La pizarra blanca física se filma de cerca, con la mano escribiendo y una superficie limpia por ejercicio. El negro contiene la base; rojo y azul señalan las bases que se extraen.

La fórmula `a²−b²=(a+b)(a−b)` se presenta en un recuadro y luego se utilizan paréntesis vacíos antes de colocar números. El paso intermedio `base²−base²` evita que la factorización parezca magia. La voz tiene velocidad media-alta pero no deja silencios muertos.

**Transferencia:** el generador debe declarar prerrequisitos, mostrar el paso puente y dibujar la estructura vacía antes de completar números o signos. Esto es más didáctico que saltar directamente a una fórmula factorizada.

### 3.6 unicoos: fórmula encuadrada y progresión de casos

El video de ecuación de segundo grado utiliza ejemplos preescritos en una columna lateral. La fórmula general aparece en un recuadro y permanece mientras los valores se sustituyen debajo. Flechas y borrado parcial expresan el flujo de despeje. El profesor continúa hablando mientras borra, evitando silencios muertos.

La lección progresa desde ecuaciones incompletas hasta completas, sin solución real y factorizadas. La advertencia “cuidado con los signos” tiene función preventiva. La pizarra se satura al final, lo que muestra el límite de mantener demasiados desarrollos simultáneos.

**Transferencia:** mantener el recuadro de referencia, usar flechas para relaciones lógicas, preescribir enunciados y limpiar el área activa antes de que la densidad vuelva ilegible la pantalla.

### 3.7 Matemáticas con Juan: intensidad y analogías concretas

La clase de álgebra utiliza una pizarra verde tradicional. La izquierda aloja el desarrollo y la derecha mantiene reglas y fórmulas. El profesor se mueve, escribe y señala, conservando una presencia humana completa.

El ritmo es extremadamente alto: la inspección describe 44 ejercicios en aproximadamente 11 minutos. Ese formato funciona como mapa o repaso, no como plantilla universal para un estudiante que necesita copiar cada paso. Las analogías de objetos, balanzas y alimentos desmitifican variables y términos semejantes. El borrado y los tiempos muertos están editados.

**Transferencia:** separar referencia y trabajo activo; reutilizar analogías concretas en la introducción; ofrecer capítulos y resúmenes para que una clase densa sea navegable.

### 3.8 Derivando: motivación antes de procedimiento

El video abre con una pregunta amplia: para qué sirven las matemáticas. El profesor habla a cámara, usa una pizarra negra saturada como atmósfera y alterna overlays, números grandes y clips de aplicaciones reales. Tres pilares numerados organizan el discurso. Los cortes son frecuentes, aproximadamente cada pocos segundos, y hay pausas dramáticas antes de ideas nuevas.

Los comentarios no se concentran en una técnica de cálculo. Dominan la motivación, la filosofía de la matemática, la relación con el mundo y testimonios de personas que superaron frustraciones. En 100 comentarios, la clasificación heurística detectó 49 señales de motivación matemática, 22 de afecto/confianza y 16 preguntas o solicitudes. Un comentario muy votado afirma que la enseñanza por comprensión supera la memorización y la mecanización.

**Transferencia:** incorporar un modo de lección de motivación o contexto, con tres ideas numeradas, empatía explícita y aplicaciones visuales. No usar una pizarra saturada como superficie para una derivación paso a paso.

### 3.9 Khan Academy en Español: inmersión directa y pausa activa

La lección comienza directamente con las funciones, sin saludo largo. No aparece un profesor en cámara; la interfaz se divide entre área de trabajo y navegación. El cursor actúa como puntero láser. El color de las expresiones coincide con el de sus curvas.

La fórmula permanece visible y la solución se traduce en intersección. En torno al segundo 0:54 se invita al estudiante a pausar y resolver. El botón de comprobación ofrece un feedback visual y sonoro al final. Este formato demuestra que la participación activa puede diseñarse sin avatar si la interfaz mantiene contexto, objetivo y feedback.

**Transferencia:** añadir checkpoints explícitos, pointer events y feedback de comprobación. El generador puede producir un cursor simulado o una marca de atención sin introducir elementos decorativos.

### 3.10 Tareasplus: serie modular y contraste alto

El video de Tareasplus pertenece a una serie de 15 ejercicios de ecuaciones de primer grado. La ficha pública muestra un tutorial corto con fondo oscuro y letras claras. El enunciado o fórmula base permanece visible y el resultado se destaca mediante subrayado. El lenguaje inclusivo utiliza “nosotros”.

La serie modular permite separar un problema de otro y buscar una necesidad concreta, aunque cada pieza individual tiene menor difusión observable que los grandes canales. La composición empieza en el tercio superior para reservar espacio al desarrollo vertical.

**Transferencia:** producir episodios cortos y encadenables, usar contraste alto y mantener un breadcrumb o fórmula de referencia cuando el desarrollo crece.

## 4. Pausas, ritmo y voz: lo que realmente cambia

La voz de los canales no tiene una velocidad única. La diferencia clave es la relación entre densidad verbal, densidad visual y dificultad. Una operación mecánica puede narrarse con más rapidez; una sustitución con signos, una definición nueva o una pausa de predicción debe ralentizarse.

| Tipo de momento | Comportamiento observado | Regla para el timeline |
|---|---|---|
| Hook | Pregunta, promesa o entrada directa | Mostrar objetivo en los primeros segundos; evitar logo largo |
| Prerrequisito | Alex y math2me construyen base antes de aplicar | Crear escena de requisito solo cuando evita un salto cognitivo |
| Identificación | `a`, `b`, `c`, dominio, variables o datos | Mostrar cada entidad con color y etiqueta antes de operar |
| Sustitución | Fórmula persistente y línea activa | Mantener referencia; usar paréntesis explícitos |
| Predicción | Alex y Khan invitan a adivinar | Pausar con pregunta visual sin revelar resultado |
| Operación mecánica | Unicoos, Juan y Julio aceleran | Agrupar solo transformaciones equivalentes y legibles |
| Error crítico | Signos, paréntesis, restricciones | Insertar `notice` con pausa y ejemplo del error |
| Resultado | Separar ramas o casos | Fade-out y fade-in secuencial; evitar superposición |
| Comprobación | Calculadora, gráfica, sustitución o check | Escena propia; nunca comprimir en la última frase |
| Transferencia | Cierre con práctica o interpretación | Pregunta final, ejercicio paralelo o aplicación |

La voz aprobada del producto, `es-MX-DaliaNeural` a `-8%`, debe seguir como baseline. Las observaciones respaldan perfiles de ritmo por evento, no un cambio de proveedor ni una sustitución silenciosa. Si el producto incorpora WordBoundary, Bookmarks o alineación offline, debe hacerlo como auditoría y metadata, no como condición para reemplazar la voz estable.

## 5. Comentarios: qué dicen los humanos que valoran

Los comentarios de JulioProfe expresan que el método, la claridad y la sensación de avance son valiosos. Aparecen frases como “muy metódico”, “así recuerdo mucho y avanzo rápido” y “hace ver todo más claro y nítido”. También aparecen preguntas concretas y referencias a exámenes. Esto apunta a un producto que debe ser navegable por necesidad concreta y no únicamente bonito.

En Profe Alex se observa la señal más fuerte de transformación percibida. Personas mayores retoman matemáticas; docentes usan el canal para preparar clases; estudiantes lo usan para exámenes; familias lo utilizan con sus hijos. Las palabras “paciencia”, “amor”, “miedo” y “fácil de entender” muestran que la pedagogía percibida incluye una dimensión emocional. Una conversación extensa distingue entre conocer un tema y saber explicarlo.

En Derivando, los comentarios se convierten en debate conceptual. Los usuarios discuten si las matemáticas son herramienta, lenguaje, forma de pensar o fin en sí mismas. La audiencia responde a la motivación y a la posibilidad de reinterpretar una experiencia escolar negativa.

| Señal pública | Evidencia observada | Decisión de producto |
|---|---|---|
| Método | “Muy metódico”, “recuerdo y avanzo rápido” | Etiquetas de etapa y fórmula persistente |
| Claridad | “Todo más claro”, “fácil de entender” | Menor simultaneidad y más contexto visible |
| Paciencia | “Bien explicado”, “con mucha paciencia” | Pausas por tipo de operación y voz más lenta en puntos críticos |
| Reducción del miedo | “Me hace perderle el miedo” | Hook empático y error normalizado |
| Utilidad | Examen, ingreso, ayudar a hijos | Modos tutorial, repaso y práctica |
| Comunidad | Saludos por país, respuestas del profesor | Cierre inclusivo y CTA específico |
| Confusión | Dudas de signos, derivadas y despejes | QA de cobertura semántica y advertencias |
| Motivación | Matemáticas como lenguaje o pensamiento | Modo contexto separado del modo procedimental |

## 6. Arquitectura visual que debe adoptar el producto

La composición recomendada tiene tres capas: **contexto persistente**, **operación activa** y **orientación**. El contexto contiene el problema, fórmula o definición. La operación contiene la transformación actual. La orientación contiene etiqueta, color, flecha, cursor simulado o pregunta. Cada `VisualEvent` debe declarar qué capa cambia y cuáles permanecen.

En 16:9, el contexto puede ocupar una franja superior o lateral y el cálculo el centro. En 1:1, la gráfica o tabla debe entrar después de consolidar la sustitución. En 9:16, la fórmula de referencia debe apilarse arriba y el cálculo activo abajo; nunca debe reducirse una fracción horizontalmente hasta parecer una línea lateral.

La regla de permanencia debe ser general: una fórmula maestra no desaparece mientras se sustituyen sus valores; una ecuación original no desaparece mientras se despeja una variable; una función no pierde su color cuando se dibuja; una tabla no se borra antes de usar sus puntos.

## 7. Recomendaciones tecnológicas

| Necesidad | Tecnología | Decisión |
|---|---|---|
| Render matemático final | Manim Community, MathTex, LaTeX, FFmpeg | Mantener como camino determinista y protegido por QA [2] |
| Modelo pedagógico | TypeScript, Zod, AST, timeline | Extender contratos semánticos antes de añadir otro renderer |
| Preview web | React, MathLive, KaTeX/MathJax | Mantener para edición, lectura y validación rápida |
| Gráfica interactiva | Desmos o GeoGebra | Usar en preview y práctica; no convertir todavía en dependencia del MP4 [3] |
| Composición editorial futura | Remotion | Evaluar para plantillas React, no reemplazar Manim [4] |
| Voz neural | Edge TTS, `es-MX-DaliaNeural` | Mantener; fallar explícitamente si falla |
| Marcadores finos | SSML, Bookmarks, WordBoundary | Spike reversible; conservar el timeline como fuente semántica [5] |
| Auditoría offline | WhisperX | Usar primero para drift y timestamps, no para reemplazar la voz [6] |
| Distribución | YouTube chapters, metadata y Analytics propio | Registrar modo, hook, formato y duración; no confundir vistas con retención [1] |

La arquitectura no necesita más herramientas para resolver el problema inmediato. Necesita mejores contratos entre voz, matemática y escena. La tecnología debe responder a una necesidad pedagógica ya definida, no añadir complejidad visual.

## 8. Plan de implementación priorizado

### P0 — Convertir la evidencia en contratos

Cada storyboard debe declarar `lessonMode`, promesa, objetivo, prerrequisito, fórmula de referencia y cierre. El modo puede ser `tutorial`, `intuition`, `challenge`, `practice` o `context`. El hook y las pausas dependerán del modo.

Los eventos deben distinguir `identify`, `substitute`, `compute`, `simplify`, `solve`, `verify`, `interpret`, `predict` y `notice`. Un evento no puede declarar “resolver” si la narración contiene tres transformaciones distintas. La validación debe comprobar cobertura narrativa y no solo geometría.

### P0 — Mantener el contexto durante toda la operación

`FormulaAnchor` debe incluir expresión, región segura, tamaño mínimo, relación con el evento activo y regla de permanencia. La sustitución debe mostrar paréntesis y signos explícitos. La fórmula general, los coeficientes `a`, `b`, `c` y la ecuación original deben poder permanecer visibles sin provocar overflow.

### P1 — Crear pausas con propósito

Implementar tipos `predict`, `notice`, `write`, `check` y `reflect`. Cada pausa debe tener texto de pregunta, duración base, evento posterior y política de no-vacío visual. La pausa no puede ser un hueco negro mientras la voz continúa.

### P1 — Introducir perfiles de ritmo

La narración debe ralentizarse en signos, fracciones, definiciones y resultados; puede acelerarse en operaciones repetitivas. Los perfiles deben ser configurables por modo y formato, pero la voz aprobada no debe cambiar de manera silenciosa.

### P1 — Comprobación como escena de primera clase

Todo solver habilitado debe producir una escena de comprobación: sustitución en la ecuación original, gráfica, calculadora o feedback equivalente. El resultado final debe estar validado matemáticamente y marcado visualmente.

### P2 — Crear modos adicionales sin mezclar objetivos

El modo `intuition` puede usar analogía de máquina o geometría. `challenge` puede presentar un patrón y pausar antes de revelar. `context` puede usar tres pilares y aplicaciones. `practice` puede encadenar ejercicios cortos. Ninguno debe contaminar el modo `tutorial` con decoración no necesaria.

## 9. Criterios de terminado para el siguiente piloto

| Criterio | Prueba |
|---|---|
| Hook | El objetivo y la ganancia para el estudiante aparecen en los primeros segundos |
| Cobertura | Cada operación narrada tiene un evento visual correspondiente |
| Permanencia | Fórmula y problema original permanecen mientras se sustituyen valores |
| Pausa | Existe al menos un checkpoint activo antes de un resultado crítico |
| Legibilidad | 16:9, 1:1 y 9:16 no tienen clipping ni fórmula ilegible |
| Audio | MP3 neural válido, merge AAC y cero fallback silencioso |
| Comprobación | Las raíces o resultados se verifican en el problema original |
| Observabilidad | El timeline registra anchors, pausas, duración real y drift |
| Reversibilidad | `NARRATION_TIMELINE=false` conserva el renderer estable |
| Matemática | Solo se habilitan familias con solver determinista |

## Conclusión

Los diez canales no deben copiarse como una estética combinada. Deben leerse como un catálogo de decisiones: JulioProfe aporta método y acompañamiento; Daniel Carrión, energía y tabla-gráfica; Profe Alex, analogía y reducción del miedo; Profesor10demates, plantilla repetible; math2me, prerrequisitos y paso puente; unicoos, fórmula encuadrada y progresión de casos; Matemáticas con Juan, analogías y referencia lateral; Derivando, motivación y contexto; Khan Academy, pausa activa y feedback; Tareasplus, modularidad y contraste.

La ventaja competitiva posible de `math-video-generator` es unir esos principios con algo que los videos humanos no pueden garantizar de forma automática: **solver determinista, timeline semántico, safe area, voz neural confiable, QA temporal, formatos sociales y reversibilidad**. El siguiente incremento debe ser pequeño, medible y probado con otro caso cuadrático antes de activar producción.

## Referencias

[1]: https://support.google.com/youtube/answer/9314415?hl=es "YouTube Help — Momentos clave de retención"
[2]: https://docs.manim.community/en/stable/index.html "Manim Community Edition documentation"
[3]: https://www.desmos.com/api "Desmos API"
[4]: https://www.remotion.dev/docs/parameterized-rendering "Remotion — Parameterized rendering"
[5]: https://learn.microsoft.com/en-us/azure/ai-services/speech-service/how-to-speech-synthesis "Azure Speech — Speech synthesis and events"
[6]: https://github.com/m-bain/whisperx "WhisperX — Word-level timestamps and forced alignment"
[7]: https://www.youtube.com/watch?v=ooBVD4JpoLg "JulioProfe — Sistemas de ecuaciones lineales 2×2 por igualación"
[8]: https://www.youtube.com/watch?v=gnAdna_tLK0 "Daniel Carrión — Graficar funciones cuadráticas"
[9]: https://www.youtube.com/watch?v=HAeSkQH1C-I "Matemáticas profe Alex — ¿Qué es una Función?"
[10]: https://www.youtube.com/watch?v=lLIclhQVtJc "Profesor10demates — Problemas de sistemas de ecuaciones"
[11]: https://www.youtube.com/watch?v=ghdUhvxVIec "math2me — Factorización por diferencia de cuadrados"
[12]: https://www.youtube.com/watch?v=zmL12JP8_pM "unicoos — Ecuación de segundo grado"
[13]: https://www.youtube.com/watch?v=_6uyQISZvBc "Matemáticas con Juan — Álgebra desde cero"
[14]: https://www.youtube.com/watch?v=RlUZv0MoVWk "Derivando — ¿Para qué sirven las matemáticas?"
[15]: https://www.youtube.com/watch?v=GGSgkjsaqc4 "Khan Academy en Español — Interpretando ecuaciones de manera gráfica"
[16]: https://www.youtube.com/watch?v=1NYxg5Q7u3c "Tareasplus — Ecuación de primer grado, ejercicio 6 de 15"
[17]: https://www.youtube.com/channel/UCanMxWvOoiwtjLYm08Bo8QQ "Canal Matemáticas profe Alex"
[18]: https://www.youtube.com/channel/UCH-Z8ya93m7_RD02WsCSZYA "Canal Derivando"
