# Hallazgos iniciales de comentarios públicos

## Método y límites

Se intentó recolectar hasta 100 comentarios ordenados por popularidad mediante `youtube-comment-downloader`, sin utilizar la API de YouTube. La muestra no representa a toda la audiencia ni permite inferir retención; sirve para detectar temas cualitativos recurrentes. La herramienta devolvió 44 comentarios de JulioProfe, 100 de Matemáticas profe Alex y 100 de Derivando. Otros videos devolvieron errores de respuesta y deben reintentarse con una fuente alternativa o quedar marcados como no disponibles.

## JulioProfe — sistemas 2×2 por igualación

Fuente: [video público](https://www.youtube.com/watch?v=ooBVD4JpoLg). En la muestra aparecen elogios a la claridad y al método: “El mejor! Muy metódico. Así recuerdo mucho y avanzo rápido”; “Me gusta su forma de dar clases, hace ver todo más claro y nítido”; “Excelente explicación profe”. También aparece una señal de transferencia práctica: “Gracias profe, excelente explicación, a comprar la calculadora”, coherente con el segmento de verificación tecnológica observado en el video.

Los comentarios también muestran usos contextuales y necesidades concretas. Un espectador indica que el contenido coincidió con su examen del día; otro pregunta cómo obtener derivadas de un cociente; otro solicita libros para construir bases de aritmética, álgebra, geometría y cálculo. Se observan comentarios de audiencia distribuida por varios países —Bolivia, Venezuela, Perú, Australia y otros— y una fuerte relación afectiva con el docente. También aparecen dudas sobre despeje y comentarios críticos aislados que cuestionan una parte de la ecuación 4.

**Interpretación prudente:** la audiencia valora el método repetible, la claridad, la sensación de acompañamiento y la utilidad inmediata para exámenes. La presencia de preguntas posteriores sugiere que el video funciona como puerta de entrada a una relación de aprendizaje más amplia, no solo como respuesta única.

## Matemáticas profe Alex — ¿Qué es una función?

Fuente: [video público](https://www.youtube.com/watch?v=HAeSkQH1C-I). Los comentarios más votados contienen señales fuertes de transformación percibida: una persona de 70 años afirma que ahora quiere entender matemáticas; un profesor de secundaria llama al video “clase magistralmente didáctica” y destaca que comprendió la analogía de la “maquinita”; otros usuarios dicen que los videos les ayudan para ingresar a ingeniería, preparar exámenes o ayudar a sus hijos.

La audiencia describe el valor diferencial con términos de pedagogía y afecto: “explica con y por amor”, “bien explicado y con mucha paciencia”, “me hace perderle el miedo a las matemáticas”, “genial manera de explicar” y “hace todo fácil de entender”. Un comentario pregunta qué tipo de “pizarrón mágico” usa, señal de que la interfaz visual también se convierte en parte de la identidad percibida.

Hay comentarios que revelan el contexto de consumo: espectadores que estudian a última hora, que ven el video durante un examen o que se preparan para entrar a la universidad. Una conversación extensa discute si la dificultad proviene de malos profesores o de estudiantes poco comprometidos. La respuesta más relevante para el producto es que **saber matemáticas no equivale a saber enseñarlas** y que la audiencia valora la armonía entre conocimiento y explicación simple.

**Interpretación prudente:** los comentarios no prueban causalidad, pero sugieren cuatro señales de alto valor percibido: reducción del miedo, paciencia, claridad visual/analógica y transferencia a situaciones reales de estudio. La marca personal del profesor y sus respuestas directas también generan comunidad.

## Reglas de análisis para el resto del corpus

Se clasificarán los comentarios en seis categorías: claridad y comprensión; afecto y confianza; utilidad para examen; dudas o solicitudes de ayuda; crítica de ritmo, signos o legibilidad; y conversación comunitaria/identidad del docente. Se distinguirán comentarios espontáneos de respuestas del creador y se registrará la cantidad de votos solo como señal de visibilidad dentro de la muestra.


## Disponibilidad y límites adicionales

La extracción alternativa de comentarios para math2me mediante identificador directo devolvió `Expecting value` y no produjo archivo. La navegación pública del video sí confirmó el título y una descripción orientada a mejorar el desempeño escolar, pero la carga de la zona de comentarios también terminó en timeout del navegador. Por tanto, math2me no debe incluirse todavía en la matriz cuantitativa de comentarios; se conservará como evidencia visual y de metadatos, y se marcará como comentario no disponible en esta pasada.


## Métricas exploratorias de clasificación

Se ejecutó una clasificación heurística por palabras clave sobre las muestras disponibles. Los resultados no deben leerse como porcentajes de toda la audiencia ni como causa de popularidad; sirven para orientar una lectura manual.

| Video | Comentarios | Votos promedio | Preguntas o solicitudes | Claridad | Afecto/confianza | Utilidad de estudio | Motivación matemática |
|---|---:|---:|---:|---:|---:|---:|---:|
| JulioProfe, sistemas 2×2 | 44 | 1.41 | 7 | 8 | 27 | 10 | 2 |
| Profe Alex, funciones | 100 | 35.75 | 12 | 14 | 42 | 30 | 9 |
| Derivando, para qué sirven las matemáticas | 100 | 25.89 | 16 | 7 | 22 | 8 | 49 |

En la muestra de Profe Alex, la combinación de claridad, utilidad de estudio y afecto aparece con mayor frecuencia que en las otras dos muestras; esto es coherente con los testimonios que mencionan paciencia, reducción del miedo, preparación de exámenes y ayuda a familiares. En Derivando domina la motivación y el debate conceptual: los comentarios discuten para qué sirven las matemáticas, si son lenguaje, herramienta o fin en sí mismas. En JulioProfe predominan agradecimiento, respeto al profesor y reconocimiento del método, con preguntas prácticas y referencias a exámenes o calculadora.

La cifra de `creator_or_thread_replies` incluye respuestas dentro de hilos, no necesariamente respuestas del creador; por ello no se interpreta como tasa de interacción del canal.
