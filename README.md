# Math Video Generator

Generador local de videos educativos de matemáticas usando IA, Manim, LaTeX, FFmpeg y voz en off.

## Descripción

Este proyecto convierte problemas matemáticos en videos explicativos con:

- animaciones matemáticas con Manim Community
- ecuaciones y texto científico con LaTeX
- render de video con FFmpeg
- narración local con TTS
- IA para generar pasos, explicación y narración
- UI web para lanzar la generación desde el navegador

La idea del proyecto es crear un flujo práctico para producir contenido didáctico de matemáticas sin depender de una sola API ni de una solución manual compleja.

## Estado actual

El proyecto ya incluye:

- backend Express + TypeScript
- frontend React + Vite + Tailwind
- integraciones con Manim, FFmpeg y LaTeX
- soporte para proveedores de IA como OpenRouter, Gemini y OpenAI
- selector de narración, proveedor y uso opcional de ComfyUI
- pipeline local para generación y render de videos

## Stack

### Frontend
- React
- Vite
- TypeScript
- Tailwind CSS
- Zustand

### Backend
- Node.js
- Express
- TypeScript
- Axios

### Generación multimedia
- Manim Community
- MiKTeX / LaTeX
- FFmpeg

### IA
- OpenRouter
- Gemini
- OpenAI

## Estructura del proyecto

```text
math-video-generator/
├── backend/
│   ├── src/
│   ├── prisma/
│   └── package.json
├── frontend/
│   ├── src/
│   └── package.json
├── deploy/
├── docs/
├── scripts/
├── .env.example
├── package.json
├── README.md
├── QUICK_START.md
├── LICENSE
└── .gitignore
```

## Requisitos previos

- Node.js 18+
- npm
- Python 3.12 recomendado para Manim
- FFmpeg instalado y disponible en PATH
- MiKTeX o LaTeX para render de ecuaciones
- Windows recomendado para la voz local nativa, aunque también hay fallback con espeak

## Inicio rápido

### 1) Instalar dependencias

```bash
cd C:/Users/pc/Videos/math-video-generator
npm install
```

### 2) Instalar dependencias del backend y frontend

```bash
npm install --workspace backend
npm install --workspace frontend
```

### 3) Ejecutar proyecto en desarrollo

Terminal 1:

```bash
cd C:/Users/pc/Videos/math-video-generator
npm run dev --workspace backend
```

Terminal 2:

```bash
cd C:/Users/pc/Videos/math-video-generator
npm run dev --workspace frontend -- --host 0.0.0.0
```

### 4) Abrir la app

```text
http://localhost:5173
```

## Variables de entorno

Copia el ejemplo:

```bash
copy .env.example .env
```

Luego ajusta tus claves de IA si quieres usar OpenRouter, Gemini o OpenAI.

## Cómo funciona

1. El usuario escribe un problema o tema matemático.
2. El backend genera una explicación y pasos de solución con IA.
3. El render matemático se ejecuta con Manim.
4. FFmpeg procesa y optimiza la salida final.
5. La narración puede añadirse con TTS local.
6. El video final queda listo para descargar o compartir.

## Casos de uso

- resolución de ecuaciones
- explicación paso a paso de álgebra
- vídeos educativos para clase
- demostración de conceptos matemáticos
- material didáctico de apoyo docente

## Documentación adicional

- [QUICK_START.md](./QUICK_START.md)
- [docs/SETUP.md](./docs/SETUP.md)
- [docs/API.md](./docs/API.md)
- [docs/ARCHITECTURE.md](./docs/ARCHITECTURE.md)
- [docs/MANIM_FFMPEG_SETUP.md](./docs/MANIM_FFMPEG_SETUP.md)

## Licencia

MIT

## Repositorio

- GitHub: https://github.com/juanxaviercasa/math-video-generator

## Nota importante

Este proyecto está pensado como una base funcional para generar videos matemáticos con herramientas locales y con integración opcional de IA. El objetivo es seguir mejorando la calidad pedagógica, el render y la experiencia del usuario.


## Presentación profesional

Este proyecto demuestra un flujo multimedia completo: entrada educativa, generación asistida, render matemático, composición de video, narración y descarga desde una interfaz web. La combinación de React, Express, TypeScript, Manim, LaTeX y FFmpeg permite evaluar tanto experiencia de producto como integración con herramientas nativas.

## Arquitectura y operación

El frontend solicita trabajos al backend. El backend valida la entrada, registra el estado del proceso y coordina generación, render y composición. Los binarios externos deben verificarse mediante health checks y sus rutas deben configurarse por entorno. Las claves de IA nunca deben almacenarse en Git.

Para una evaluación de producción, el siguiente paso es documentar una cola de trabajos, límites de duración y tamaño, cancelación, limpieza de artefactos temporales, logs estructurados y una estrategia de despliegue reproducible con Docker.

## Calidad

La evolución recomendada incluye pruebas de contratos del API, pruebas de estados del render, fixtures de problemas matemáticos, smoke tests del frontend y un workflow de GitHub Actions que ejecute lint, typecheck y pruebas sin requerir claves reales. Las respuestas generadas por IA deben validarse antes de convertirse en instrucciones para Manim.

## Caso para reclutadores

La señal principal no es solamente generar un video, sino coordinar un pipeline con dependencias externas, fallos parciales y una experiencia comprensible para docentes y estudiantes. Este proyecto complementa `pymes-insights-platform` al demostrar procesamiento multimedia y productos educativos.
