# Quick Start

## Requisitos

- Node.js 18+
- npm
- Python 3.12
- FFmpeg instalado y en PATH
- MiKTeX o LaTeX para compilar ecuaciones

## 1) Instalar dependencias

```bash
cd C:/Users/pc/Videos/math-video-generator
npm install
npm install --workspace backend
npm install --workspace frontend
```

## 2) Ejecutar backend

```bash
cd C:/Users/pc/Videos/math-video-generator
npm run dev --workspace backend
```

## 3) Ejecutar frontend

```bash
cd C:/Users/pc/Videos/math-video-generator
npm run dev --workspace frontend -- --host 0.0.0.0
```

## 4) Abrir la app

```text
http://localhost:5173
```

## 5) Probar una generación

Desde la interfaz, introduce un problema como:

```text
x^2 - 5x + 6 = 0
Factoriza y resuelve
```

Luego activa o desactiva narración y genera el video.

## Solución rápida si algo falla

### FFmpeg no detecta el binario

```bash
ffmpeg -version
```

Si no funciona, instala FFmpeg y vuelve a abrir el terminal.

### Manim no está disponible

```bash
python --version
manim --version
```

### Error de dependencias

```bash
cd C:/Users/pc/Videos/math-video-generator
npm install
npm install --workspace backend
npm install --workspace frontend
```

## Documentación extra

- [README.md](./README.md)
- [docs/SETUP.md](./docs/SETUP.md)
- [docs/MANIM_FFMPEG_SETUP.md](./docs/MANIM_FFMPEG_SETUP.md)
- [docs/API.md](./docs/API.md)
