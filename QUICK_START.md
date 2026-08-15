# 🚀 Quick Start Guide

## Estado Actual

✅ **Completado:**
- Estructura completa del proyecto (frontend + backend)
- Servicios de Manim, FFmpeg y OpenAI integrados
- API REST lista con endpoint de generación de videos
- Frontend React con interfaz para generar videos
- Documentación completa

🔄 **En Progreso:**
- Instalación de npm dependencies

⏳ **Próximos Pasos:**
1. Esperar a que npm install termine
2. Instalar Manim + FFmpeg
3. Probar generación de videos

---

## ⚡ Inicio Rápido (5 minutos)

### 1. Esperar Instalación

```bash
# Verificar que npm install terminó
cd C:\Users\pc\Videos\math-video-generator
dir node_modules  # Debería existir

cd backend
dir node_modules

cd ../frontend
dir node_modules
```

### 2. Instalar Manim + FFmpeg

```powershell
# Windows PowerShell (Admin)

# FFmpeg
choco install ffmpeg
# O descargar desde https://ffmpeg.org/download.html

# Python + Manim
pip install manim
pip install pycairo  # Si hay errores

# Verificar
ffmpeg -version
manim --version
```

### 3. Configurar Backend

```bash
cd backend
cp .env.example .env

# Edita backend\.env y agrega:
# OPENAI_API_KEY=sk-... (opcional por ahora)
# DATABASE_URL=postgresql://...
# JWT_SECRET=tu-clave-super-secreta-123456789
```

### 4. Iniciar Desarrollo

**Terminal 1 - Backend:**
```bash
cd backend
npm run dev
# Debería mostrar: 🚀 Server running on http://localhost:3001
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
# Debería mostrar: http://localhost:5173
```

### 5. Abre el Navegador

```
http://localhost:5173
```

¡Deberías ver la interfaz de Math Video Generator! 🎉

---

## 🧪 Probar API Manualmente

### Usar cURL o Postman

```bash
curl -X POST http://localhost:3001/api/generate-video \
  -H "Content-Type: application/json" \
  -d '{
    "id": "test_1",
    "title": "Resolver x² - 5x + 6 = 0",
    "content": "x² - 5x + 6 = 0\nFactorizar: (x-2)(x-3)=0\nSoluciones: x=2, x=3",
    "quality": "medium"
  }'
```

### Respuesta Esperada

```json
{
  "status": "processing",
  "progress": 20,
  "message": "Verificando Manim y FFmpeg...",
  "videoUrl": null
}
```

---

## 📝 Archivos Importantes

| Archivo | Propósito |
|---------|-----------|
| `backend/src/services/manim.service.ts` | Generación de animaciones |
| `backend/src/services/ffmpeg.service.ts` | Procesamiento de video |
| `backend/src/services/video-processing.service.ts` | Orquestación completa |
| `backend/src/routes/video.routes.ts` | Endpoints API |
| `frontend/src/components/VideoGenerator.tsx` | Formulario de generación |
| `frontend/src/store/video.store.ts` | Estado global |

---

## 🐛 Si Algo No Funciona

### Error: "Manim not found"

```bash
pip install --force-reinstall manim
manim --version
```

### Error: "FFmpeg not found"

```bash
# Windows
choco install ffmpeg

# Verificar PATH
ffmpeg -version
```

### Error: "Port 3001 already in use"

```bash
# Cambiar puerto en backend/.env
BACKEND_PORT=3002
```

### Error: "Cannot find module"

```bash
# Reinstalar dependencias
cd backend
rm -r node_modules
npm install

cd ../frontend
rm -r node_modules
npm install
```

---

## 📊 Arquitectura

```
User Input
    ↓
Frontend (React)
    ↓
Backend API
    ↓
VideoProcessing Service
    ├─→ OpenAI (genera pasos)
    ├─→ Manim (renderiza animaciones)
    └─→ FFmpeg (procesa video)
    ↓
Video Output
```

---

## 🎯 Próximos Pasos

1. **Prueba Local**: Genera tu primer video
2. **Integración BD**: Conecta con PostgreSQL
3. **Autenticación**: Implementa JWT
4. **Stripe**: Agregar pagos
5. **Deploy**: Vercel (frontend) + Railway (backend)

---

**¿Problemas? Ver:**
- [docs/SETUP.md](./docs/SETUP.md)
- [docs/MANIM_FFMPEG_SETUP.md](./docs/MANIM_FFMPEG_SETUP.md)
- [docs/API.md](./docs/API.md)
