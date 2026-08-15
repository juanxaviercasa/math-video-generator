# 📘 API Reference

## Base URL

```
http://localhost:3001/api
```

## Autenticación

Todos los endpoints protegidos requieren un JWT token en el header:

```
Authorization: Bearer <token>
```

---

## Auth Endpoints

### POST `/auth/register`

Registrar nuevo usuario.

**Request:**
```json
{
  "email": "profesor@example.com",
  "password": "SecurePass123",
  "name": "Juan Pérez"
}
```

**Response:**
```json
{
  "id": "user_123",
  "email": "profesor@example.com",
  "name": "Juan Pérez",
  "plan": "free",
  "createdAt": "2026-08-14T10:00:00Z"
}
```

---

### POST `/auth/login`

Iniciar sesión.

**Request:**
```json
{
  "email": "profesor@example.com",
  "password": "SecurePass123"
}
```

**Response:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": "user_123",
    "email": "profesor@example.com",
    "plan": "free"
  }
}
```

---

## Videos Endpoints

### GET `/videos`

Listar videos del usuario.

**Query Parameters:**
- `skip` (int): Número de registros a saltar (default: 0)
- `take` (int): Número de registros a retornar (default: 10)
- `status` (string): Filtrar por estado (pending, processing, completed, failed)

**Response:**
```json
{
  "data": [
    {
      "id": "vid_123",
      "title": "Teorema de Pitágoras",
      "status": "completed",
      "progress": 100,
      "videoUrl": "https://cdn.example.com/videos/vid_123.mp4",
      "duration": 120,
      "createdAt": "2026-08-14T10:00:00Z"
    }
  ],
  "total": 1,
  "page": 1
}
```

---

### POST `/videos`

Crear nuevo video.

**Request:**
```json
{
  "title": "Resolver ecuaciones cuadráticas",
  "description": "Tutorial paso a paso",
  "content": "x² - 5x + 6 = 0\nFactorizar: (x-2)(x-3)=0"
}
```

**Response:**
```json
{
  "id": "vid_456",
  "title": "Resolver ecuaciones cuadráticas",
  "status": "pending",
  "progress": 0,
  "createdAt": "2026-08-14T11:00:00Z"
}
```

**Nota:** El video entra en cola de procesamiento. Puedes monitorear el progreso con GET `/videos/{id}`.

---

### GET `/videos/{id}`

Obtener detalles de un video.

**Response:**
```json
{
  "id": "vid_456",
  "title": "Resolver ecuaciones cuadráticas",
  "description": "Tutorial paso a paso",
  "status": "processing",
  "progress": 45,
  "duration": null,
  "createdAt": "2026-08-14T11:00:00Z",
  "updatedAt": "2026-08-14T11:15:00Z"
}
```

---

### DELETE `/videos/{id}`

Eliminar un video.

**Response:**
```json
{
  "success": true,
  "message": "Video eliminado correctamente"
}
```

---

## User Endpoints

### GET `/user/profile`

Obtener perfil del usuario.

**Response:**
```json
{
  "id": "user_123",
  "email": "profesor@example.com",
  "name": "Juan Pérez",
  "plan": "pro",
  "videosUsed": 12,
  "videosLimit": 50,
  "storageUsed": 2.5,
  "storageLimit": 100,
  "createdAt": "2026-08-01T00:00:00Z"
}
```

---

### PUT `/user/profile`

Actualizar perfil.

**Request:**
```json
{
  "name": "Juan Carlos Pérez",
  "email": "juancarlos@example.com"
}
```

---

### POST `/user/upgrade`

Cambiar plan.

**Request:**
```json
{
  "plan": "team",
  "billingCycle": "annual"
}
```

---

## Error Responses

### 400 Bad Request
```json
{
  "error": "Invalid input",
  "details": {
    "field": "email",
    "message": "Email must be valid"
  }
}
```

### 401 Unauthorized
```json
{
  "error": "Unauthorized",
  "message": "Invalid or expired token"
}
```

### 429 Too Many Requests
```json
{
  "error": "Rate limit exceeded",
  "retryAfter": 60
}
```

### 500 Internal Server Error
```json
{
  "error": "Internal server error",
  "requestId": "req_123"
}
```

---

## Rate Limiting

- **Free plan**: 100 requests/hour
- **Pro plan**: 1000 requests/hour
- **Team plan**: 5000 requests/hour
- **Enterprise**: Unlimited

---

## WebSocket Events (Próximamente)

Para monitoreo en tiempo real del progreso de videos:

```javascript
const ws = new WebSocket('ws://localhost:3001/ws');

ws.on('video:progress', (data) => {
  console.log(`Video ${data.id}: ${data.progress}%`);
});

ws.on('video:completed', (data) => {
  console.log(`Video completado: ${data.videoUrl}`);
});

ws.on('video:error', (data) => {
  console.error(`Error: ${data.message}`);
});
```

---

**API v0.1.0 - Last Updated: 2026-08-14**
