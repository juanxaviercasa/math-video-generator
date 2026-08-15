# 🎥 Configuración de Manim + FFmpeg

## ¿Qué es Manim?

**Manim** es una librería Python que genera animaciones matemáticas profesionales. Es la que usa 3Blue1Brown en sus famosos videos de YouTube.

## ¿Qué es FFmpeg?

**FFmpeg** es el estándar de la industria para procesamiento de video (encoding, compresión, conversión).

---

## 📦 Instalación

### 1. Instalar FFmpeg

#### Windows
```powershell
# Opción A: Con Chocolatey
choco install ffmpeg

# Opción B: Manual
# 1. Descarga desde https://ffmpeg.org/download.html
# 2. Descomprime en C:\ffmpeg
# 3. Agrega a PATH: C:\ffmpeg\bin
```

**Verificar:**
```bash
ffmpeg -version
```

#### macOS
```bash
brew install ffmpeg
```

#### Linux (Ubuntu/Debian)
```bash
sudo apt-get update
sudo apt-get install ffmpeg
```

---

### 2. Instalar Manim

#### Requisitos Previos

```bash
# Python 3.10+
python --version

# pip actualizado
pip install --upgrade pip

# FFmpeg (ya instalado arriba)
ffmpeg -version
```

#### Instalación

```bash
# Instalar Manim
pip install manim

# Verificar
manim --version
```

**Si hay errores** (especialmente en Windows):

```bash
# Instalar dependencias adicionales
pip install pycairo pillow
pip install numpy scipy
pip install mapbox_earcut
pip install manim --upgrade
```

---

## 🧪 Pruebas

### Probar Manim

Crea `test_manim.py`:

```python
from manim import *

class TestScene(Scene):
    def construct(self):
        text = Text("¡Manim funciona!", font_size=48)
        self.play(Write(text))
        self.wait(2)
```

Ejecuta:
```bash
manim -pql test_manim.py TestScene
```

Deberías ver un video reproducirse 🎉

### Probar FFmpeg

```bash
# Crear video de prueba
ffmpeg -f lavfi -i color=c=blue:s=320x240:d=1 test.mp4 -y

# Convertir resolución
ffmpeg -i test.mp4 -s 1920x1080 output.mp4 -y
```

---

## ⚙️ Configuración Avanzada

### Optimizar Manim para Videos Largos

En `backend/.env`:

```env
# Reducir calidad para desarrollo (más rápido)
MANIM_QUALITY=low_quality

# Calidades disponibles:
# - low_quality (480p, rápido)
# - medium_quality (720p, balance)
# - high_quality (1080p, lento)
# - ultra_4k_quality (4K, muy lento)
```

### Configurar FFmpeg para Mejor Compresión

Usar H.265 (HEVC) para videos más pequeños:

```bash
ffmpeg -i input.mp4 -c:v libx265 -preset fast -b:v 5000k output.mp4
```

---

## 🐛 Troubleshooting

### Error: "manim: command not found"

```bash
# Verificar instalación
pip list | grep manim

# Reinstalar
pip install --force-reinstall manim
```

### Error: "ffmpeg: command not found"

```bash
# Windows: Agregar a PATH
# 1. Sistema → Variables de entorno
# 2. PATH → Editar
# 3. Agregar: C:\ffmpeg\bin

# macOS/Linux: Verificar
which ffmpeg
```

### Error: "cairo not found" (Manim en Windows)

```bash
# Instalar dependencias binarias
pip install pycairo pyopengl --upgrade
pip install manim --upgrade
```

### Error: "Out of memory"

Reducir resolución en `.env`:
```env
MANIM_QUALITY=low_quality
```

---

## 📚 Recursos

- **Manim Docs**: https://docs.manim.community
- **FFmpeg Docs**: https://ffmpeg.org/documentation.html
- **3Blue1Brown Manim Playlist**: https://www.youtube.com/playlist?list=PLZHQObOWTQDNU6R4_67421l3NzpклерXG

---

**Última actualización**: 2026-08-14
