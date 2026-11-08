# Salto de calidad: álgebra, voz por palabras y autorreparación visual

Fecha: noviembre de 2026. Esta implementación reutiliza la infraestructura Manim Community + Edge TTS + FFmpeg + Prisma/Redis. No sustituye el renderizador de producción por Remotion ni copia código de proyectos sujetos a restricciones no comerciales.

## 1. Oráculo de raíces con SymPy

`backend/python/symbolic_verifier.py` recibe exclusivamente JSON `{"a":"1","b":"-5","c":"6"}` validado por TypeScript. El intérprete **nunca** usa `eval`, `parse_expr`, `sympify` ni un fragmento LaTeX del usuario como programa. Coeficientes finitos hasta seis decimales y magnitud máxima un millón. Calcula discriminante exacto con `Rational`, `solveset(..., domain=S.Reals)` y comprueba residuales simbólicos. Registra las raíces exactas en LaTeX y sus aproximaciones en `<id>-sympy-verification.json`.

`backend/src/services/sympy-verification.service.ts` compara el resultado SymPy con el solver determinista existente. **Una discrepancia bloquea el video**, sin reparación por IA. La cuadrática sin raíces reales es un resultado válido (conjunto vacío), no una falla. Se mantienen explícitos los problemas aún no soportados (no se publican automáticamente).

Configuración:

- `SYMPY_VERIFY_MODE=required`: obligatorio, falla si falta SymPy; valor predeterminado en producción.
- `SYMPY_VERIFY_MODE=auto`: desarrollo; tolera exclusivamente la ausencia del intérprete/módulo, nunca discrepancias matemáticas.
- `SYMPY_VERIFY_MODE=off`: desactivación explícita para diagnóstico local, **no recomendada en producción**.
- `SYMPY_PYTHON_COMMAND`: ejecutable Python opcional. Docker instala SymPy y copia el script.

No se anuncia soporte universal de problemas. El storyboard estable continúa cubriendo cuadráticas verificadas; el oráculo proporciona infraestructura segura para ampliar dominios futuros.

## 2. Sincronización de voz

Edge TTS produce audio y SRT con marcas `WordBoundary`. El lector valida índice, orden, duración, superposición, tamaño y límites del audio. Para cada micro-paso:

1. TTS devuelve un clip neural y sus palabras temporizadas.
2. FFprobe mide la duración real del clip.
3. Se alinea el audio con el tiempo del micro-paso y se coloca el resaltado `Indicate` a partir de la primera palabra real, respetando el tiempo de revelación de fórmula.
4. Manim y `LessonTimeline` consumen el mismo desfase; se preserva la duración total.
5. Se genera `<id>-voice-word-boundaries.json` con evidencia temporal.

Si no hay SRT (voz local o proveedor sin marcas), se conserva el modo previo de clips individuales medidos, registrado como `duration-fallback`; **no se declara sincronización por palabra** en ese caso. Los archivos SRT se conservan junto al audio para revisión.

## 3. Recuperación acotada de Manim

El renderizador ejecuta como máximo dos intentos en total:

- `standard`: diseño original, álgebra, anclaje, narración y QA completos.
- `formula-first`: únicamente ante fallo recuperable de legibilidad o colisión; elimina descripciones decorativas y reduce etiquetas sin cambiar expresiones, raí­ces, audios ni orden de escenas.

Se elimina el informe geométrico viejo antes de cada nuevo intento. Ambos pases deben aprobar el validador de geometría **real**, que comprueba clipping, tamaño, colisiones, duración y ejercicio anclado. Nunca se reintenta por errores simbólicos, errores de voz, falta de infraestructura o pérdida del ejercicio original. Se genera `<id>-visual-recovery.json` incluso cuando ambos intentos fallan. Si la segunda pasada no supera QA, **no se publica el video**.

## 4. Pruebas y criterios de publicación

```bash
npm ci
npm run prisma:generate --workspace backend
npm run lint
npm test
npm run build
python3 -m pip install 'sympy>=1.13,<1.16'
python3 backend/python/symbolic_verifier.py <<< '{"a":"1","b":"-5","c":"6"}'
npm run smoke:precision --workspace backend
```

El workflow `CI` ejecuta además el oráculo Python real (dos raíces, raíz doble, conjunto vacío e intento de inyección). `Precision Render Smoke` de `main` prueba Manim/LaTeX y geometría en tres formatos, pero **no equivale** a certificar el audio real de Edge TTS de Oracle. Antes del despliegue, validar por separado una generación con voz `es-PE` o la voz configurada; revisar SRT, JSON, cuadros, labios *no aplicable*, transiciones y escuchar todo el MP4.

## Origen de conceptos y licencias

- [Manim Community](https://github.com/ManimCommunity/manim): motor utilizado; `MathTex`, grupos y QA de geometría.
- [SymPy](https://github.com/sympy/sympy): aritmética simbólica verificable. Se emplea su API de expresiones construidas, no un parser de texto de usuario.
- [Edge TTS](https://github.com/rany2/edge-tts): marcas temporales SRT del audio real ya usado por el proyecto.
- [Manim Voiceover](https://github.com/ManimCommunity/manim-voiceover) y [MathLens](https://github.com/sagittaprolifer245/MathLens): referencias conceptuales para bookmarks; no se importa código ni sus dependencias.
- [Manimator](https://github.com/ManimatorTechnologies/Manimator), [Manim Slides](https://github.com/jeertmans/manim-slides), [Motion Canvas](https://github.com/motion-canvas/motion-canvas): candidatos futuros para previsualización/editor; **no integrados en esta fase**.

Las mejoras implementadas mantienen el código propio e independiente; ningún ejemplo no comercial se copia al repositorio.
