# 🎓 Math Video Generator

> Transforma problemas matemáticos en videos explicativos automáticamente

## 📋 Descripción

**Math Video Generator** es una herramienta SaaS que permite a profesores de matemáticas crear videos educativos de calidad profesional sin necesidad de edición.

**Características:**
- 🎥 Generación automática de videos desde texto
- 📝 Escritura elegante de ecuaciones matemáticas
- 🎨 Temas personalizables (oscuro, claro, colorido)
- 📊 Incluye gráficos y diagramas automáticos
- 🌐 API REST para integración
- 📱 Dashboard intuitivo

## 🚀 Stack Tecnológico

### Frontend
- **Framework**: React 18 + TypeScript
- **Build**: Vite
- **UI**: Tailwind CSS + shadcn/ui
- **State**: TanStack Query + Zustand
- **Video Preview**: Three.js + Canvas API

### Backend
- **Runtime**: Node.js 20 + Express
- **Language**: TypeScript
- **Database**: PostgreSQL + Prisma
- **Video Processing**: FFmpeg + Manim
- **Storage**: AWS S3 / Cloudflare R2
- **Queue**: Bull (Redis)

## 📁 Estructura del Proyecto

```
math-video-generator/
├── frontend/              # React app (SPA)
│   ├── src/
│   │   ├── components/   # Componentes reutilizables
│   │   ├── pages/        # Páginas principales
│   │   ├── hooks/        # Hooks personalizados
│   │   ├── services/     # API calls
│   │   ├── store/        # Zustand state
│   │   └── App.tsx
│   ├── public/
│   ├── vite.config.ts
│   ├── tsconfig.json
│   └── package.json
│
├── backend/               # Express API
│   ├── src/
│   │   ├── routes/       # API endpoints
│   │   ├── controllers/  # Lógica de negocio
│   │   ├── services/     # Servicios (IA, video, etc)
│   │   ├── models/       # Database models (Prisma)
│   │   ├── middleware/   # Auth, validación, etc
│   │   ├── utils/        # Utilities
│   │   ├── config/       # Configuración
│   │   └── index.ts
│   ├── prisma/
│   │   ├── schema.prisma
│   │   └── migrations/
│   ├── .env.example
│   ├── tsconfig.json
│   └── package.json
│
├── docs/                  # Documentación
│   ├── SETUP.md          # Guía de instalación
│   ├── API.md            # Documentación API
│   ├── ARCHITECTURE.md   # Arquitectura del sistema
│   └── MONETIZATION.md   # Estrategia de ingresos
│
├── deploy/               # Configuración de deploy
│   ├── Dockerfile
│   ├── docker-compose.yml
│   ├── vercel.json
│   └── .github/workflows/ci-cd.yml
│
├── .gitignore
├── .env.example
├── LICENSE
├── package.json          # Workspace root (pnpm/yarn)
└── README.md
```

## ⚡ Quick Start

### Prerequisitos
- Node.js 18+
- Python 3.10+ (para Manim)
- FFmpeg
- PostgreSQL

### Instalación

```bash
# Clonar repo
git clone https://github.com/tu-usuario/math-video-generator
cd math-video-generator

# Instalar dependencias (recomendado pnpm)
pnpm install

# Setup backend
cd backend
cp .env.example .env
pnpm prisma migrate dev

# Setup frontend
cd ../frontend
pnpm install

# Iniciar dev servers
# Terminal 1
cd backend && pnpm dev

# Terminal 2
cd frontend && pnpm dev
```

## 📊 Planes de Precios

| Plan | Precio | Límite | Usuarios |
|------|--------|--------|----------|
| **Free** | $0 | 5 videos/mes | 1 |
| **Pro** | $29.99 | 50 videos/mes | 1 |
| **Team** | $79.99 | 500 videos/mes | 5 |
| **Enterprise** | Custom | Ilimitado | Ilimitado |

## 📚 Documentación

- [Setup & Instalación](./docs/SETUP.md)
- [API REST](./docs/API.md)
- [Arquitectura del Sistema](./docs/ARCHITECTURE.md)
- [Estrategia de Monetización](./docs/MONETIZATION.md)

## 🔐 Seguridad

- ✅ Autenticación JWT
- ✅ Rate limiting
- ✅ CORS configurado
- ✅ Validación de input
- ✅ Sanitización de datos

## 📈 Roadmap

- [ ] v0.1 - MVP básico (generador de videos simple)
- [ ] v0.2 - Integración con IA (GPT-4 para descriptions)
- [ ] v0.3 - Múltiples idiomas
- [ ] v0.4 - API pública
- [ ] v1.0 - Lanzamiento beta pública

## 💰 Monetización

Ver [MONETIZATION.md](./docs/MONETIZATION.md) para estrategia completa.

## 🤝 Contribuciones

Las contribuciones son bienvenidas. Por favor:
1. Fork el repo
2. Crea branch feature (`git checkout -b feature/AmazingFeature`)
3. Commit cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push (`git push origin feature/AmazingFeature`)
5. Open Pull Request

## 📄 Licencia

MIT License - ver [LICENSE](LICENSE) para detalles

## 📧 Contacto

**Email**: tu-email@duckmartians.info
**Twitter**: [@duckmartians](https://twitter.com/duckmartians)
**Discord**: [Servidor privado](https://discord.gg/duckmartians)

---

**Last Updated**: 2026-08-14
**Status**: 🟡 En Desarrollo
