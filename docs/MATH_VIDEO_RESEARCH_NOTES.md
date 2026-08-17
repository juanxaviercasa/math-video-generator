# Investigación de videos educativos de matemáticas

## Estado inicial

La investigación compara principios transferibles de videos públicos, no diseños ni branding propietarios. La retención exacta de YouTube no suele ser pública; por eso se separará la retención real de sus proxies públicos: vistas, antigüedad, comentarios, likes cuando estén disponibles, duración, recurrencia de temas y señales cualitativas de audiencia.

## Fuentes consultadas

| Fuente | Evidencia inicial | Uso |
|---|---|---|
| [3Blue1Brown](https://www.3blue1brown.com/) | Se presenta como matemáticas con una perspectiva visual distintiva y organiza su contenido en lecciones; la página también describe el valor de los videos como comparable a un libro o curso y menciona que el feedback de supporters ayuda a refinar las versiones finales. | Estudiar visualización conceptual, continuidad de una lección y refinamiento editorial |
| [Canal de 3Blue1Brown](https://www.youtube.com/c/3blue1brown) | El catálogo público muestra series de cálculo y álgebra lineal con millones de vistas; el buscador destacó “The essence of calculus” y una serie de álgebra lineal como referencias de alta audiencia. | Corpus de matemáticas conceptuales y visuales |
| [Numberphile](https://www.numberphile.com/) | Sitio oficial con publicaciones periódicas y catálogo centrado en números y matemáticas; el buscador muestra un canal con cientos de videos y millones de vistas en videos individuales. | Estudiar curiosidad, storytelling y problemas con gancho |
| [We Are Teachers: Math Videos for Kids](https://www.weareteachers.com/math-videos-for-kids/) | Revisión editorial que agrupa canales por edades y destaca patrones como playlists por nivel, canciones, personajes, animación, tutoriales directos, refuerzo y videos de trigonometría/cálculo. | Comparar estilos para infancia, refuerzo y educación secundaria |

## Criterio de investigación

El corpus debe incluir al menos cuatro familias editoriales: visual-conceptual, tutorial paso a paso, curiosidad/problema viral y formato corto/rápido. Se analizarán hooks, promesa inicial, mapa de la explicación, cantidad de cambios visuales, permanencia de fórmulas, relación voz-pantalla, uso de gráficos, pausas, conclusión, comentarios y tecnologías declaradas por los creadores.

## Limitación importante

Los videos públicos no permiten afirmar por sí solos que un video tenga alta retención. La investigación reportará “alta difusión pública” y “señales de retención aparente” cuando corresponda, y no presentará las vistas como una medición privada de retención.

## Hallazgos de videos representativos

| Video | Señales públicas observables | Hipótesis transferible |
|---|---|---|
| [The essence of calculus](https://www.youtube.com/watch?v=WUvTyaaNkzM) | Video de apertura de una serie; la descripción del canal enfatiza visualización del núcleo de ideas y simplificación mediante cambios de perspectiva. El propio catálogo muestra capítulos relacionados y recomendaciones de continuidad. | La lección debe prometer una intuición concreta, conectar con una serie y usar visuales para explicar una relación, no solo decorar una fórmula. |
| [Vectors, capítulo 1 de Essence of linear algebra](https://www.youtube.com/watch?v=fNk_zzaMoSs) | La página muestra 12,114,705 vistas y 233K likes, capítulos visibles desde 0:53, y una progresión desde “vectores como listas” a vectores 2D, coordenadas, suma y recta numérica. | Las explicaciones de alta difusión suelen tener capítulos conceptuales explícitos y una progresión de representaciones: definición, ejemplo, operación y conexión geométrica. |
| [The Josephus Problem, Numberphile](https://www.youtube.com/watch?v=uCsD3ZGzMgE) | La página muestra 6,958,686 vistas y presenta un problema con una pregunta implícita de estrategia; el canal usa un presentador y un experto como formato de curiosidad. | Un problema con tensión (“¿cómo ganar?”) puede ser el hook; la solución debe revelarse gradualmente y mantener una pregunta abierta. |
| [Solución de problemas con ecuaciones de primer grado, ejemplo 9](https://www.youtube.com/watch?v=1t1X4Be46nA) | La página muestra 298,985 vistas, capítulos “Saludo”, “Recomendaciones”, “Solución por lógica”, “Solución con ecuaciones”, “Ejercicio de práctica” y “Despedida”. El canal aparece con 10.7M suscriptores y agrupa el video en un curso de 14 lecciones. | El tutorial directo gana claridad cuando separa lógica, formalización, práctica y cierre; además, el curso y los videos recomendados forman una ruta de continuidad. |

## Evidencia académica relevante

La revisión de Brame [1] organiza el diseño efectivo en carga cognitiva, engagement y aprendizaje activo. Entre sus recomendaciones aparecen señalización, segmentación, eliminación de información extra, combinación complementaria de audio y visuales, videos breves, lenguaje conversacional, ritmo con entusiasmo y preguntas de guía.

La revisión señala que las señales visuales —color, contraste, palabras clave, flechas— dirigen la atención y reducen carga extrínseca. La segmentación permite que el alumno procese piezas pequeñas y controle el flujo. La modalidad debe ser complementaria: mostrar animación mientras la voz explica puede usar canales auditivo y visual, pero poner texto largo adicional puede sobrecargar el canal visual.

El análisis citado de 6,9 millones de sesiones de MOOCs encontró que los videos menores de 6 minutos tendían a verse casi completos, mientras que el engagement medio descendía a cerca de la mitad en videos de 9–12 minutos y era mucho menor en videos de 12–40 minutos. Esto no constituye una ley universal para YouTube, pero respalda producir lecciones cortas o dividirlas por capítulos.

La investigación de Bos y Wigmans [2] sobre videos animados de matemáticas con estudiantes universitarios encontró que las visualizaciones dinámicas pueden apoyar imágenes mentales, comprensión y atención, pero también pueden dificultar el aprendizaje cuando no están alineadas con un objetivo de aprendizaje claro. La consecuencia para nuestro sistema es crítica: cada animación debe declarar qué relación matemática ayuda a comprender.

## Fuentes de evidencia

[1] [Brame, Effective Educational Videos](https://pmc.ncbi.nlm.nih.gov/articles/PMC5132380/)

[2] [Bos & Wigmans, Dynamic Visualization in Animated Mathematics Videos](https://doi.org/10.1564/tme_v32.1.03)

## Métricas públicas y límites de retención

La ayuda oficial de YouTube [3] indica que el informe de momentos clave de retención se consulta en YouTube Studio del propietario. Allí se observan introducciones, momentos destacados, picos, caídas y segmentos, además de duración media de visualización y tiempo de reproducción. Por lo tanto, la retención exacta de videos ajenos no debe inferirse como si fuera pública.

La documentación de YouTube Data API [4] permite consultar datos públicos de videos, canales y playlists; sus ejemplos incluyen título, fecha de publicación, duración, vistas, likes y comentarios. La API requiere proyecto y credenciales, y aplica cuota. Estos datos sirven para construir una muestra reproducible de difusión pública, no para medir retención privada.

La documentación de YouTube Analytics [5] define métricas de retención como `averageViewDuration`, `averageViewPercentage`, `audienceWatchRatio`, `relativeRetentionPerformance`, `startedWatching` y `stoppedWatching`. Estas métricas son las que deberíamos conectar en el futuro para medir nuestros propios videos después de publicarlos.

## Tecnologías candidatas

| Tecnología | Capacidad relevante | Recomendación para el proyecto |
|---|---|---|
| [Manim Community](https://docs.manim.community/en/stable/examples.html) | Animación matemática programática, MathTex, transformaciones, resaltados, `ValueTracker`, gráficas con `Axes`, cámaras y ejemplos reutilizables bajo licencia MIT. | Mantenerlo como renderer principal para ecuaciones y transformaciones deterministas. El timeline debe producir eventos Manim más pequeños y semánticos. |
| [Remotion](https://www.remotion.dev/) | Videos programáticos con React, composición por frames, render masivo y aplicaciones de edición; tiene licencia y costos comerciales que deben evaluarse. | Considerarlo para una futura capa de composición editorial o preview web, no reemplazar Manim ahora. |
| [Desmos API](https://www.desmos.com/api) | Calculadora gráfica embebible, expresiones, viewport, estado serializable, screenshots PNG/SVG y bounds matemáticos. Requiere API key para uso embebido. | Útil como referencia y posible preview interactivo; para renders de producción conviene generar la gráfica con Manim o SVG controlado para evitar dependencia de UI externa. |
| [GeoGebra](https://www.geogebra.org/) | Calculadoras y recursos interactivos, solver paso a paso, gráficas, geometría, colaboración y materiales educativos. | Referencia de exploración y posible integración futura; no usar como sustituto del solver interno ni copiar su interfaz. |
| KaTeX/MathJax | Render web de fórmulas para editor y preview. | Mantener la separación: KaTeX/MathLive en frontend, MathTex/LaTeX en video, con una representación semántica común. |

## Fuentes

[3] [YouTube Help: Momentos clave de retención](https://support.google.com/youtube/answer/9314415?hl=es)

[4] [YouTube Data API: Getting Started](https://developers.google.com/youtube/v3/getting-started)

[5] [YouTube Analytics API: Metrics](https://developers.google.com/youtube/analytics/metrics)

## Hallazgos hispanohablantes y comentarios

El video [Quadratic Equation - Second Degree by General Formula | Example 1](https://www.youtube.com/watch?v=gV8Iu5M1sac) muestra 497,227 vistas en la página consultada. La descripción del canal promete cursos sencillos, paso a paso, desde conceptos básicos hasta ejercicios difíciles, y explícitamente afirma que busca explicar por qué se realiza cada paso. En las recomendaciones aparecen una demostración de la fórmula general, completación de cuadrados y función cuadrática.

El resultado de sistemas 3x3 de [Matemáticas profe Alex](https://www.youtube.com/watch?v=dervJEVZZQY) aparece asociado a 1.3M vistas y el catálogo relacionado muestra métodos alternativos: Gauss, Cramer y eliminación. El canal de Julioprofe aparece con 904K suscriptores y organiza playlists por sistemas 2x2 y 3x3. Esto sugiere que la repetición estructurada por método y dificultad es una ventaja de producto, no una redundancia.

La discusión pública [How can I explain things like 3Blue1Brown does?](https://www.reddit.com/r/learnmath/comments/1qazymr/how_can_i_explain_things_like_3blue1brown_does_in/) no es una muestra estadística, pero aporta señales cualitativas consistentes: usuarios destacan intuición visual, profundidad matemática, capacidad de simplificar, tono empático, claridad, memorabilidad y conexión con la forma en que piensa un matemático. También se menciona que Manim es una herramienta importante, pero no suficiente: el conocimiento del concepto y la traducción pedagógica preceden al polish técnico.

El video [What makes a great math explanation?](https://www.youtube.com/watch?v=cDofhN-RJqg) estructura su evaluación en motivación macro, motivación micro, claridad, novedad y memorabilidad. Esa taxonomía resulta útil para nuestro producto porque permite evaluar una lección más allá de la geometría del frame.

## Conclusión parcial

Los formatos de mayor valor combinan dos capas. La primera es la enseñanza directa: pasos completos, capítulos, ejemplos y práctica. La segunda es la capa de significado: por qué importa, qué intuición se busca y qué imagen mental debe quedar. Nuestro generador debe seleccionar explícitamente el modo de lección: `tutorial paso a paso`, `intuición visual`, `problema reto` o `repaso/práctica`, en vez de intentar que una misma plantilla cumpla todos los objetivos.

## Tecnología: evidencia documental y decisión preliminar

La documentación oficial de [Manim Community](https://docs.manim.community/en/stable/index.html) lo define como una biblioteca Python para animaciones matemáticas programáticas y precisas. También advierte que existen versiones incompatibles y que los personajes de 3Blue1Brown son activos protegidos; por tanto, el producto debe conservar Manim como motor de escenas matemáticas, pero usar identidad visual propia y fijar la versión en CI.

[Remotion](https://www.remotion.dev/docs/parameterized-rendering) permite pasar props validadas por esquema, calcular dinámicamente metadatos como ancho, alto, duración y framerate, editar visualmente valores en Studio y usar Player para previsualizar componentes sin renderizar. Es atractivo como capa futura para composición social, plantillas y previsualización React, pero no sustituye de inmediato la precisión geométrica de Manim ni debe introducirse en el renderer estable sin una prueba de paridad audiovisual.

La [API de Desmos](https://www.desmos.com/api) permite incrustar un GraphingCalculator, establecer expresiones, controlar viewport, guardar/restaurar estado y producir capturas PNG/SVG; también expone eventos de cambio. Es adecuada como complemento interactivo en la web y como fuente de gráficos parametrizados, pero requiere evaluar API key, condiciones de uso y consistencia de captura antes de usarla en renders productivos. La opción recomendada es: Desmos para preview/interactividad del editor; Manim para el video final determinista.

GeoGebra queda como referencia de capacidades interactivas, no como dependencia inicial: la extracción pública de su página no fue suficiente para validar una integración concreta en esta investigación. KaTeX/MathJax sigue siendo el camino adecuado para fórmulas web y MathLive para edición, mientras que LaTeX/Manim debe continuar como camino de render final.

## Decisión de arquitectura preliminar

No conviene reemplazar Manim por una pila nueva. Conviene separar tres productos: (a) un **modelo pedagógico semántico** con hook, objetivo, prerequisitos, pasos, pausas y preguntas; (b) un **renderer matemático determinista** con Manim, timeline y QA; (c) una **capa de preview/editor** en React que use MathLive, KaTeX y, cuando aporte valor, Desmos. Remotion puede evaluarse después para composición multiplataforma y plantillas, pero no debe ser una migración reactiva motivada por problemas del renderer actual.

## Sincronización fina de voz

La documentación oficial de [Azure Speech Synthesis](https://learn.microsoft.com/en-us/azure/ai-services/speech-service/how-to-speech-synthesis) confirma que un sintetizador neural puede emitir eventos `WordBoundary`, `BookmarkReached` y `VisemeReceived`, además de aceptar SSML para controlar voz, velocidad, pausas y marcadores. Esto es conceptualmente más preciso que inferir todos los tiempos únicamente por duración de frases. Sin embargo, introducir Azure ahora cambiaría el proveedor aprobado y exigiría revisar credenciales, costos, privacidad y disponibilidad de `es-MX-DaliaNeural`; por eso la recomendación inmediata es no sustituir Edge TTS.

[WhisperX](https://github.com/m-bain/whisperx) ofrece timestamps a nivel de palabra mediante alineación forzada con wav2vec2, además de VAD y diarización. Su documentación advierte que los modelos de alineación son específicos por idioma y que algunas palabras, solapamientos y diarización pueden fallar. Para nuestro producto podría usarse como herramienta offline de QA o auditoría de drift después de generar audio, no como dependencia obligatoria del camino de render hasta validar latencia, memoria y precisión en español.

[Coqui TTS](https://github.com/coqui-ai/TTS) ofrece modelos multilingües, fine-tuning y conversión de voz, pero añadirlo implicaría operar otra familia de modelos y revisar licencias, recursos y consistencia de pronunciación matemática. No es una solución automática al problema de didáctica. La voz actual aprobada debe permanecer como contrato de producción; cualquier voz alternativa requiere comparación A/B y un flag reversible.

## Recomendación de sincronización

Adoptar una escalera de precisión: primero sincronización semántica por escena y micro-evento; después marcadores SSML o eventos de palabra si el proveedor vigente los soporta sin cambiar la voz; finalmente alineación offline para QA. El sistema debe permitir que cada evento tenga una tolerancia explícita y registrar desviaciones, en lugar de perseguir una sincronía de labios que no aporta valor a una explicación matemática.
