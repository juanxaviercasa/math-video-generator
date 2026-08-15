# Estructura de Arquitectura

## Visión General

Math Video Generator es una arquitectura **moderna y escalable** con:
- Frontend SPA (React + Vite)
- Backend API REST (Express + TypeScript)
- Base de datos PostgreSQL
- Cache Redis
- Queue de procesamiento (Bull)
- Integración con IA (OpenAI)

```
┌─────────────┐
│   Browser   │
└──────┬──────┘
       │ HTTP/JSON
       ▼
┌─────────────────────┐
│  Frontend (React)   │
│   - SPA moderna     │
│   - TypeScript      │
│   - Vite build      │
└──────┬──────────────┘
       │ API Calls
       ▼
┌─────────────────────────────────────┐
│   Backend (Express + TypeScript)    │
│   - REST API                        │
│   - JWT Authentication              │
│   - Business Logic                  │
└──────┬──────────────┬───────────────┘
       │              │
       ▼              ▼
  ┌────────┐    ┌──────────────┐
  │  Pgdb  │    │ Redis Cache  │
  └────────┘    └──────┬───────┘
                       │
                       ▼
                ┌────────────────┐
                │  Bull Queue    │
                │ Video Process  │
                └────────┬───────┘
                         │
        ┌────────────────┼────────────────┐
        ▼                ▼                ▼
   ┌────────┐       ┌────────┐       ┌────────┐
   │ Manim  │       │ FFmpeg │       │ OpenAI │
   │ Render │       │ Process│       │ API    │
   └────────┘       └────────┘       └────────┘
        │                │                │
        └────────────────┼────────────────┘
                         │
                         ▼
                    ┌─────────────┐
                    │  S3/R2      │
                    │  Storage    │
                    └─────────────┘
```

## Componentes

### Frontend

**Stack:**
- React 18 + TypeScript
- Vite (build tool)
- Tailwind CSS
- TanStack Query (data fetching)
- Zustand (state management)

**Responsabilidades:**
- UI interactiva
- Manejo de autenticación
- Preview de videos
- Dashboard y estadísticas

### Backend

**Stack:**
- Express.js
- TypeScript
- Prisma ORM
- JWT Authentication
- Bull Queue

**Responsabilidades:**
- REST API
- Autenticación y autorización
- Lógica de negocio
- Orquestación de procesamiento

### Database

**PostgreSQL:**
- Users (autenticación)
- Videos (metadata)
- Subscriptions (pagos)
- Audit logs

### Cache & Queue

**Redis:**
- Session cache
- Rate limiting
- Bull Queue (job processing)
- Real-time notifications

### Procesamiento de Videos

**Arquitectura:**
1. Usuario envía contenido
2. Entra en Bull Queue
3. Worker procesa:
   - Manim genera animaciones
   - FFmpeg procesa video
   - Comprime para almacenamiento
4. Se guarda en S3/R2
5. Se notifica al usuario

## Flujo de Datos

### Crear Video (Happy Path)

```
1. User submits form
   POST /api/videos
   {title, description, content}
   │
   ▼
2. Backend validates & saves to DB
   Status: "pending"
   │
   ▼
3. Job entra a Bull Queue
   │
   ▼
4. Worker pickup
   - Render con Manim
   - Process con FFmpeg
   - Upload a S3
   │
   ▼
5. Update DB
   Status: "completed"
   videoUrl: "https://..."
   │
   ▼
6. Send notification (WebSocket)
   Video is ready!
   │
   ▼
7. Frontend muestra link descarga
```

### Autenticación

```
1. User registra
   POST /auth/register
   {email, password, name}
   │
   ▼
2. Server hashea password (bcrypt)
   Guarda en DB
   │
   ▼
3. User login
   POST /auth/login
   {email, password}
   │
   ▼
4. Server verifica credenciales
   │
   ▼
5. Genera JWT token
   {userId, email, plan, iat, exp}
   │
   ▼
6. Retorna token
   Token válido por 7 días
   │
   ▼
7. Client guarda en localStorage
   Incluye en headers: Authorization: Bearer <token>
```

## Escalabilidad

### Horizontal Scaling

```
┌──────────────────────────────────────┐
│           Load Balancer              │
└────┬──────────────────────────────┬──┘
     │                              │
  ┌──▼──┐                       ┌──▼──┐
  │ API │                       │ API │
  │  #1 │                       │  #2 │
  └──┬──┘                       └──┬──┘
     │                              │
     └──────────────┬───────────────┘
                    │
            ┌───────▼─────────┐
            │  Shared Redis   │
            │  Shared PgSQL   │
            │  Shared S3      │
            └─────────────────┘
```

### Workers Distribution

```
┌─────────────────────────────────────────┐
│          Bull Queue (Redis)             │
└─────────────────┬───────────────────────┘
                  │
      ┌───────────┼───────────┐
      │           │           │
   ┌──▼──┐    ┌──▼──┐    ┌──▼──┐
   │Worker│   │Worker│   │Worker│
   │  #1  │   │  #2  │   │  #3  │
   └──────┘   └──────┘   └──────┘
```

## Seguridad

### Autenticación & Autorización

```
┌─────────────┐
│  JWT Token  │
└──────┬──────┘
       │
       ▼
┌──────────────────────────────┐
│  Verify signature            │
│  Check expiration            │
│  Extract user info           │
└──────┬───────────────────────┘
       │
       ▼
┌──────────────────────────────┐
│  Check authorization         │
│  - User owns resource?       │
│  - Has plan permission?      │
└──────────────────────────────┘
```

### Data Validation

- Zod schemas en backend
- Validación de input en frontend
- Rate limiting por IP/usuario
- CORS configurado

## Deployment

### Opciones

**Desarrollo:**
```
npm run dev
Backend: http://localhost:3001
Frontend: http://localhost:5173
```

**Producción:**

Opción 1: Docker
```bash
docker-compose up
```

Opción 2: Vercel (Frontend) + Railway/Fly.io (Backend)

Opción 3: AWS ECS + RDS + ElastiCache

---

**Última actualización**: 2026-08-14
