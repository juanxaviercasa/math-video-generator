# 📋 Setup & Instalación

## Requisitos Previos

Asegúrate de tener instalado:

- **Node.js** v18+ (https://nodejs.org)
- **pnpm** v8+ (o npm/yarn)
- **PostgreSQL** 14+ (https://www.postgresql.org)
- **Python** 3.10+ (para Manim - video math rendering)
- **FFmpeg** (para procesamiento de video)
- **Git**

## 1️⃣ Clonar el Repositorio

```bash
git clone https://github.com/duckmartians/math-video-generator.git
cd math-video-generator
```

## 2️⃣ Instalar Dependencias

### Opción A: Con pnpm (Recomendado)

```bash
# Instalar pnpm globalmente
npm install -g pnpm

# Instalar dependencias del workspace
pnpm install
```

### Opción B: Con npm

```bash
npm install
cd frontend && npm install
cd ../backend && npm install
```

## 3️⃣ Configurar Variables de Entorno

### Backend

```bash
cd backend
cp .env.example .env
```

Edita `backend/.env`:

```env
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/math_video_generator

# JWT
JWT_SECRET=your-super-secret-key-min-32-chars
JWT_EXPIRY=7d

# Server
BACKEND_PORT=3001
NODE_ENV=development

# API Keys (opcional por ahora)
OPENAI_API_KEY=sk-...
```

### Frontend

El frontend usa variables de entorno automáticamente desde `.env.local`:

```bash
cd ../frontend
cp .env.example .env.local
```

## 4️⃣ Configurar Base de Datos

### Crear base de datos PostgreSQL

```bash
# En PostgreSQL CLI
createdb math_video_generator
```

O en Windows (si usas pgAdmin):
1. Abre pgAdmin
2. Haz clic derecho en "Databases" → "Create" → "Database"
3. Nombre: `math_video_generator`
4. Click en "Save"

### Ejecutar migraciones

```bash
cd backend
pnpm prisma migrate dev --name init
```

Esto creará las tablas automáticamente.

## 5️⃣ Instalar Dependencias del Sistema

### En Windows (PowerShell Admin)

```powershell
# Instalar FFmpeg
choco install ffmpeg

# Instalar Python
choco install python

# Instalar Manim
pip install manim
```

### En macOS

```bash
# Instalar FFmpeg
brew install ffmpeg

# Python ya viene instalado, pero actualiza:
brew install python@3.11

# Instalar Manim
pip install manim
```

### En Linux (Ubuntu/Debian)

```bash
# Instalar FFmpeg
sudo apt-get install ffmpeg

# Instalar Python
sudo apt-get install python3.11

# Instalar Manim
pip install manim
```

## 6️⃣ Iniciar Desarrollo

### Terminal 1 - Backend

```bash
cd backend
pnpm dev
```

Deberías ver:
```
🚀 Server running on http://localhost:3001
```

### Terminal 2 - Frontend

```bash
cd frontend
pnpm dev
```

Deberías ver:
```
VITE v4.x.x ready in XXX ms

➜ Local:   http://localhost:5173/
```

## ✅ Verificar Instalación

1. Abre http://localhost:5173 en tu navegador
2. Deberías ver la página de inicio de Math Video Generator
3. Haz clic en "Get Started Free"

## 🐛 Troubleshooting

### Error: `DATABASE_URL not found`
```bash
# Asegúrate de tener el .env correcto en backend/
cd backend
cat .env | grep DATABASE_URL
```

### Error: `Port 3001 already in use`
```bash
# Cambia el puerto en backend/.env
BACKEND_PORT=3002
```

### Error: `Manim not found`
```bash
# Instala Manim correctamente
pip install --upgrade pip
pip install manim
manim --version
```

### Error en Prisma
```bash
# Regenera Prisma client
cd backend
pnpm prisma generate
pnpm prisma db push
```

## 📚 Próximos Pasos

1. Lee [API.md](./API.md) para documentación de endpoints
2. Explora [ARCHITECTURE.md](./ARCHITECTURE.md) para entender el flujo
3. Mira [MONETIZATION.md](./MONETIZATION.md) para estrategia de precios

## 🆘 Soporte

Si tienes problemas:
1. Revisa los logs en las consolas
2. Abre un issue en GitHub
3. Contacta: dangduc131@gmail.com

---

**Happy coding! 🚀**
