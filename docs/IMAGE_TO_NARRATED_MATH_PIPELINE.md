# Entrada visual → explicación matemática narrada

## Flujo implementado

1. **Entrada controlada:** en `Generar Nuevo Video`, seleccionar JPG/PNG/WEBP (foto o manuscrito) o PDF de hasta 10 MB y, si procede, una página entre 1 y 50.
2. **Extracción visual:** el backend autentica al usuario, comprueba la firma binaria y convierte únicamente la página seleccionada de PDF a PNG mediante `pdftoppm`. Envía la imagen al proveedor visual configurado (Gemini, OpenAI u OpenRouter multimodal explícito).
3. **Transcripción, no solución inventada:** el modelo devuelve JSON con el enunciado principal, pasos *observados* en la fuente, confianza y advertencias. No se le pide que resuelva.
4. **Revisión humana del OCR:** el ejercicio reconocido aparece en el editor editable. El usuario confirma la transcripción antes de generar. Corregir el contenido anula la confirmación anterior.
5. **Validación determinista:** el solver actual valida ecuaciones cuadráticas en forma `ax^2 + bx + c = 0`, con raíces reales, dobles o sin raíces reales. Otros ejercicios se reconocen, pero no se declaran automáticamente resueltos ni publicables.
6. **Storyboard comprobado:** las transformaciones proceden del modelo matemático validado, nunca de los pasos OCR sin verificar.
7. **Voz neural por micro-paso:** las escenas clave de discriminante, sustitución, simplificación y ramas de solución disponen de frases explícitas asociadas a la fórmula que aparece.
8. **Reloj de la voz:** Edge TTS genera un archivo por transformación. FFprobe mide su duración; el planificador asigna un intervalo visual para cada clip. FFmpeg convierte a PCM de 24 kHz mono y concatena exactamente los segmentos.
9. **Animación sincronizada:** el inicio de cada clip tiene 450 ms de pausa para revelar el objeto; después comienza la explicación mientras Manim resalta su fórmula con `Indicate`. Las escenas que no tienen voz por micro-paso conservan narración por escena.
10. **QA antes de publicar:** Manim mide las cajas de texto reales y tiempos de escena; FFprobe valida las pistas y FPS; FFmpeg inspecciona fotogramas, zonas negras y tomas por escena. Un fallo bloqueante detiene la publicación.

## Configuración de servidor

```dotenv
# Al menos un proveedor de reconocimiento visual:
GEMINI_API_KEY=...
GEMINI_VISION_MODEL=gemini-2.5-flash
# o bien OPENAI_API_KEY y OPENAI_VISION_MODEL
# o bien OPENROUTER_API_KEY + OPENROUTER_VISION_MODEL (modelo multimodal)

PDFTOPPM_PATH=pdftoppm

TTS_PROVIDER=edge
TTS_NEURAL_VOICE=es-MX-DaliaNeural
TTS_NEURAL_RATE=-8%
TTS_ALLOW_LOCAL_FALLBACK=false
ALLOW_UNVERIFIED_MATH_VIDEO=false
```

Para PDF, instalar Poppler (`poppler-utils` en Ubuntu, o `pdftoppm.exe` de Poppler en Windows) y agregarlo a `PATH` o usar `PDFTOPPM_PATH`. El worker de video necesita Manim, LaTeX, FFmpeg, FFprobe y `edge-tts` como antes.

No se necesita activar `NARRATION_TIMELINE` para la voz sincronizada por micro-paso: funciona sobre la ruta estable de Manim. El compositor Remotion continúa siendo experimental y requiere QA propio.

## Seguridad, confidencialidad y límites

- Las imágenes de entrada y PDF se procesan en memoria y, para conversión PDF, en un directorio temporal borrado al concluir. Los contenidos enviados a un proveedor de visión externo están sujetos a las condiciones de ese proveedor; informar al usuario antes de subir archivos.
- La extracción devuelve **requiereConfirmación**; no inicia automáticamente un job de video.
- Los ejemplos y soluciones manuscritas pueden contener errores. Los pasos OCR se muestran solo como referencia; **nunca** se convierten en soluciones aprobadas sin pasar el solver.
- La confianza declarada por un modelo visual no constituye una medición calibrada de exactitud OCR. Un enunciado ambiguo se rechaza o se revisa.
- El reconocimiento de manuscritos y PDF depende de la legibilidad y disponibilidad del proveedor. Sin credenciales o conectividad, la API devuelve un error explícito.
- Los micro-pasos narrados disponen de temporización por **clip**. Todavía no existe alineación fonema a fonema ni resaltado palabra por palabra para cualquier clase matemática.
- La cobertura matemática productiva sigue limitada a la familia cuadrática soportada; ampliar a ecuaciones lineales, sistemas, funciones, límites, derivadas, integrales y geometría requiere solvers y guiones verificados.
- No se garantiza una calidad universal con un único conjunto de pruebas. La auditoría del render real es un filtro, no sustituye una revisión visual/pedagógica editorial.

## Verificación

```bash
npm ci
npm test
npm run build
npm run smoke:precision --workspace backend
```

El smoke multimedia en `.github/workflows/precision-render.yml` genera MP4 reales y reportes de geometría, incluye un micro-paso resaltado con duraciones conocidas sin depender de credenciales de Edge, y verifica una pista de audio multiplexada mediante FFmpeg. Una prueba sin TTS de red no acredita por sí sola la disponibilidad del servicio neural real: debe probarse el entorno de producción con credenciales, `edge-tts` y el endpoint accesible.

## Ampliaciones necesarias

1. Resolver deterministicamente más familias de ejercicios, con AST y verificación.
2. Reconocer y corregir regiones seleccionadas de páginas con varios ejercicios.
3. Añadir timestamps de palabra o fonema cuando el proveedor los permita para alineación sub-frase.
4. Certificar la composición HTML/Remotion de forma independiente cuando se habilite.
