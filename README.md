# Math Video Generator

Generador local de videos educativos de matemáticas usando IA, Manim, LaTeX, FFmpeg y voz en off.


## De foto o PDF a video narrado

El editor admite extracción de ejercicios desde PNG, JPG, WEBP o una página PDF (incluidas fotografías de escritura a mano). La transcripción se revisa y confirma antes de generar; los pasos presentes en la imagen no se consideran matemáticamente comprobados hasta pasar la validación. Las escenas de resolución cuadrática pueden narrarse con clips neurales por transformación, coordinando aparición, resaltado y explicación.

Requisitos, límites y pruebas del flujo: [Pipeline de imagen/PDF a matemática narrada](docs/IMAGE_TO_NARRATED_MATH_PIPELINE.md).

## Despliegue privado para una sola persona

La instalación Oracle se ha adaptado al **modo personal**: sin registro abierto,
con acceso exclusivo al UUID existente del propietario en Supabase, frontend
protegido por sesión, PostgreSQL/Redis sin puertos públicos y worker de video
limitado a una ejecución simultánea.

- [Manual de despliegue privado Cloudflare Pages + Oracle](docs/PERSONAL_ORACLE_DEPLOYMENT.md)
- [Variables privadas del servidor](.env.personal.example)
- [Compose aislado del resto de servicios](deploy/docker-compose.yml)

El panel privado ofrece la consulta opcional del catálogo de IA ya mantenido
por ViralForge/avatars. **Consultar pesos Kaggle no prueba una sesión GPU
activa**; el puente no inicia notebooks ni consume cuotas.

La configuración está lista en el repositorio, pero el DNS, Cloudflare Pages,
los secretos y el arranque efectivo de Oracle requieren acceso a esos servicios.

## Voces neurales y MCP

El editor incorpora un catálogo de voces en español (Perú, México, Colombia,
España) y una **muestra audible** antes de renderizar. El MP4 con narración
habilitada se rechaza si su pista de audio es silenciosa o demasiado tenue.
Los videos anteriores deben regenerarse para incorporar la nueva voz.

- [Instalar y probar las voces](docs/NEURAL_VOICES.md)
- [Conectar Antigravity, Gemini CLI o ChatGPT con MCP](docs/MCP_CONNECTORS.md)

Las herramientas MCP son de solo lectura y no permiten publicar videos ni
acceder a los archivos privados de otros usuarios. Para ChatGPT se necesita
un servidor remoto autenticado detrás de HTTPS y una conexión explícita.

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
- [docs/PRECISION_VISUAL_QA_RUNBOOK.md](./docs/PRECISION_VISUAL_QA_RUNBOOK.md)

## Licencia

MIT

## Repositorio

- GitHub: https://github.com/juanxaviercasa/math-video-generator

## Nota importante

Este proyecto está pensado como una base funcional para generar videos matemáticos con herramientas locales y con integración opcional de IA. El objetivo es seguir mejorando la calidad pedagógica, el render y la experiencia del usuario.
