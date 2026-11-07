# Biblioteca de voces y comprobación de audio

El motor usa **edge-tts** como biblioteca de síntesis neural en español. Incluye
Camila y Alex (Perú), Dalia y Jorge (México), Salomé y Gonzalo (Colombia),
Elvira y Álvaro (España). Puedes cambiar la voz desde la interfaz antes de
generar cada video.

## Instalación

```bash
# Desde la raíz del proyecto, en una terminal con Python y Node instalados:
npm run setup:voices --workspace backend
# Si el ejecutable no queda en PATH, el backend también probará python -m edge_tts.
python -m edge_tts --version
```

En Windows puede usarse `py -m pip install --upgrade edge-tts` si la orden
`python` no está disponible. Se necesita Internet para la síntesis Edge;
el servicio del proveedor puede quedar temporalmente inaccesible.

En el servidor/worker configura:

```dotenv
TTS_PROVIDER=edge
TTS_NEURAL_VOICE=es-PE-CamilaNeural
TTS_NEURAL_RATE=-8%
TTS_ALLOW_LOCAL_FALLBACK=false
```

**Por qué no hay fallback silencioso:** cuando se solicita voz neural y no se
puede generar, el trabajo falla explícitamente. Una voz local distinta no se
sustituye sin permiso y un MP4 mudo no debe aparecer como completado.

## Escuchar antes de generar

1. Inicia sesión en la aplicación.
2. Activa «Narración en Voz».
3. Elige una voz de la biblioteca.
4. Pulsa «Escuchar muestra de la voz».
5. Espera el archivo generado y pulsa **Reproducir** en el control de audio;
   revisa el volumen del sistema/navegador.
6. Genera de nuevo el video con narración habilitada.

La muestra se genera con la biblioteca real y se valida su volumen. No
reutiliza las señales sintéticas de los tests, ni modifica videos antiguos.

El backend ofrece `GET /api/voices` para el catálogo y
`POST /api/voices/preview` (requiere autenticación, sujeto a límite de
peticiones) para crear una muestra neural temporal. Se borra el directorio
temporal después de responder.

## Prueba real en servidor

```bash
npm run smoke:voice --workspace backend
```

La prueba genera un audio con la ecuación «x cuadrado menos cinco x más seis»,
mide sus niveles con FFmpeg y rechaza el silencio. Para conservar los MP3
y el reporte en una carpeta concreta, define `VOICE_SMOKE_OUTPUT_DIR`.

El informe de QA del MP4 final se guarda como
`<id>-audio-qa.json`; para voz habilitada, se rechaza audio sin niveles
audibles según el umbral configurado. Esta medición no demuestra que
todas las palabras sean correctas ni que exista sincronía fonética.

## Advertencias

- La síntesis de Edge requiere el programa `edge-tts` instalado **en el
  entorno que ejecuta el worker**; instalarlo solo en el navegador no sirve.
- Un MP4 generado antes de instalar la voz no gana narración retroactivamente.
- Al escuchar una muestra, ten en cuenta que la voz está generada por IA.
- Las aprobaciones CI con señales sintéticas verifican codificación y niveles,
  **no** certifican acceso a Edge TTS ni calidad de la voz real.
- El proyecto mantiene las limitaciones del solver y de la auditoría visual
  documentadas en `docs/IMAGE_TO_NARRATED_MATH_PIPELINE.md`.

Biblioteca: https://pypi.org/project/edge-tts/
