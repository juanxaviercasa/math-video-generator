# Math Video Generator — instalación personal con Supabase + Oracle + Cloudflare Pages

**Estado comprobado (7 nov 2026):** el proyecto Supabase **Video Generator**
(`jplhbgyhswvbghhzhjvm`, `sa-east-1`) está creado y saludable. Se aplicó
la migración `20261107185018_personal_math_video_private_schema`, con tablas
`public.users` y `public.videos`, RLS activado y ningún permiso Data API
para `anon` ni `authenticated`.

Este documento configura exclusivamente tu estudio. No crea un servicio
público multiusuario, no cobra ni modifica ViralForge.

## Arquitectura

| Servicio | Dónde corre |
|---|---|
| React/Vite (pantalla privada) | Cloudflare Pages, `math.forjavia.site` (propuesto, aún sin desplegar) |
| Supabase Auth | Proyecto `jplhbgyhswvbghhzhjvm` |
| PostgreSQL de videos | El **mismo Supabase**, NO un Postgres duplicado en Oracle |
| API Express y worker Manim/FFmpeg/Edge TTS | Oracle VPS, Docker Compose independiente |
| Cola BullMQ | Redis privado en ese Compose |
| Videos MP4 | Volumen persistente `media_data` en Oracle |
| Kaggle/ViralForge | Catálogo opcional de lectura, inferencia GPU aún no conectada |

## 1. Crear tu única cuenta autorizada (imprescindible)

Al crear el proyecto se verificó que **`auth.users` está vacío**. No existe
un propietario aún. El complemento de Supabase disponible no administra
directamente usuarios Auth y no debe fabricarlos con SQL.

1. Abre [Supabase — Authentication/Users](https://supabase.com/dashboard/project/jplhbgyhswvbghhzhjvm/auth/users).
2. Selecciona **Add user** para crear tu propia cuenta por correo y contraseña, preferentemente marcada como confirmada o confirmándola por correo.
3. Copia el **UUID** que Supabase asigna a ese usuario.
4. Configura `OWNER_USER_ID` con ese UUID **solo en el archivo privado del VPS**.
5. En [Authentication — URL Configuration](https://supabase.com/dashboard/project/jplhbgyhswvbghhzhjvm/auth/url-configuration), establece el Site URL definitivo `https://math.forjavia.site` y agrega los redirect URLs que sean necesarios una vez publicado.
6. En Authentication > Providers, desactiva el registro público si está disponible. De cualquier modo, el backend ya bloquea `/api/auth/register` y las tablas Prisma no son accesibles vía la Data API.

Nunca guardes la contraseña, el UUID de otros usuarios ni un token secreto en el código. **`OWNER_USER_ID` no es una clave de API, pero conviene mantenerlo en el entorno privado**.

## 2. Credenciales de Supabase y PostgreSQL

En Supabase Dashboard > **Connect** copia la URL de conexión **Session Pooler**
(port `5432`) si Oracle no tiene IPv6. La URL directa en el plan Free
suele requerir IPv6; no inventes el hostname regional del pooler. Usa la
cadena exacta que muestre Supabase.

En [API Keys](https://supabase.com/dashboard/project/jplhbgyhswvbghhzhjvm/settings/api-keys)
copia la clave **publishable** activa (nunca service-role/secret).

Variables obligatorias en `.env.personal` del servidor:

```dotenv
PERSONAL_MODE=true
OWNER_USER_ID=UUID_DE_TU_CUENTA_CONFIRMADA
SUPABASE_URL=https://jplhbgyhswvbghhzhjvm.supabase.co
SUPABASE_PUBLISHABLE_KEY=CLAVE_PUBLICABLE_DE_SUPABASE
DATABASE_URL=POSTGRES_SESSION_POOLER_URL_CON_CONTRASENA
DIRECT_URL=POSTGRES_SESSION_POOLER_URL_CON_CONTRASENA
JWT_SECRET=CADENA_ALEATORIA_LARGA
APP_URL=https://math.forjavia.site
VITE_API_URL=https://api-math.forjavia.site/api
```

Para `DIRECT_URL` puedes usar el endpoint directo si el VPS soporta IPv6;
en caso contrario, el pooler **session** es la alternativa IPv4. La contraseña
de PostgreSQL debe estar percent-encoded si contiene caracteres reservados
en una URL. No pongas estas cadenas en GitHub, Pages, capturas o conversaciones.

La migración ya se aplicó desde el complemento Supabase; el backend ejecuta
**`node dist/index.js` sin `prisma migrate deploy`** para no volver a
ejecutar las migraciones antiguas incompatibles con una base ya provisionada.
El archivo reproducible es
[`supabase/migrations/20261107185018_personal_math_video_private_schema.sql`](../supabase/migrations/20261107185018_personal_math_video_private_schema.sql).
Para evoluciones futuras usa una única estrategia de migraciones y actualiza
`backend/prisma/schema.prisma` en paralelo.

Las advertencias informativas `rls_enabled_no_policy` para estas dos tablas
son **intencionales**: su acceso está reservado a Prisma con credenciales
privilegiadas del servidor, nunca a clientes `anon` o `authenticated`.
Consulta [Supabase RLS sin política](https://supabase.com/docs/guides/database/database-linter?lint=0008_rls_enabled_no_policy).

## 3. Preparar Oracle sin tocar otras aplicaciones

Antes de instalar nada:

```bash
uname -m
free -h
df -h
docker version
docker compose version
ss -lntup | grep -E ':(3001|5432|6379|8765|8501)\b' || true
```

No pares, reemplaces ni elimines contenedores existentes de ViralForge,
Forjavia ni túneles actuales. El Dockerfile con Manim/LaTeX puede requerir
mucho disco y tiempo de compilación en Ampere A1. Si faltan recursos, mueve
el worker a otro host antes de forzar el VPS gratuito.

Instala en un directorio propio:

```bash
sudo mkdir -p /opt/math-video-generator
sudo chown "${USER}:${USER}" /opt/math-video-generator
git clone https://github.com/juanxaviercasa/math-video-generator.git /opt/math-video-generator
cd /opt/math-video-generator
cp .env.personal.example .env.personal
chmod 600 .env.personal
```

Si el repositorio es privado, usa deploy key GitHub de lectura. Completa
`.env.personal` con las variables del apartado anterior y las credenciales
opcionales de visión (`GEMINI_API_KEY`, `OPENAI_API_KEY`), nunca con
credenciales de otras apps.

Validación y arranque:

```bash
docker compose --env-file .env.personal -f deploy/docker-compose.yml config --quiet
docker compose --env-file .env.personal -f deploy/docker-compose.yml config --services
docker compose --env-file .env.personal -f deploy/docker-compose.yml up -d --build
docker compose --env-file .env.personal -f deploy/docker-compose.yml ps
curl --fail http://127.0.0.1:3001/health
curl --fail http://127.0.0.1:3001/readyz
```

Servicios por defecto: `redis`, `backend`, `worker`. Los contenedores
usan `PERSONAL_MODE=true`; la API publica solamente
`127.0.0.1:3001:3001`; Redis no publica ningún puerto; el worker limita
el paralelismo a un trabajo. El frontend Docker local es optativo.

**No usar `docker compose down -v`**, ya que borraría Redis y los MP4
persistidos. No almacenar videos permanentemente solo en el sistema de
archivos del contenedor; se usa el volumen `media_data`.

## 4. Cloudflare — API y frontend

Usa el hostname propuesto `api-math.forjavia.site` apuntando mediante un
Cloudflare Tunnel privado de administración a `127.0.0.1:3001` en Oracle.
El ejemplo está en `deploy/cloudflared-math.example.yml`. El dominio todavía
no está creado por este proceso. No reemplaces ni dupliques el túnel de
ViralForge. Activa HTTPS en el acceso público a la API.

En Cloudflare Pages crea un proyecto desde la rama `main`:

| Opción | Valor |
|---|---|
| Root | `/` |
| Build | `npm ci && npm run build:frontend` |
| Output | `frontend/dist` |
| Variable de frontend | `VITE_API_URL=https://api-math.forjavia.site/api` |
| Dominio | `math.forjavia.site`, después de comprobar que esté disponible |

La aplicación depende de cookies HttpOnly/Secure con `SameSite=Lax`; usa
los **dos subdominios del mismo sitio** y prueba autenticación en HTTPS. La
URL temporal de `pages.dev` podría no compartir cookies con la API final.

Los secretos de IA, PostgreSQL y JWT **nunca** deben añadirse a Pages.

## 5. Pruebas reales de aceptación

1. Abre la aplicación sin iniciar sesión: no debe mostrar videos ni editor.
2. Inicia sesión con tu usuario confirmado; cualquier otro usuario debe ser rechazado.
3. Comprueba que `POST /api/auth/register` está deshabilitado (403).
4. Escucha una muestra **real** de Edge TTS y verifica el audio con auriculares.
5. Sube un PNG de una cuadrática, revisa la transcripción y confirma el ejercicio.
6. Genera un MP4; comprueba voz, animaciones, subtítulos si aplica y reporte QA.
7. Revisa que el archivo se mantenga privado y que ninguna tabla Prisma sea
   consultable con la clave pública de Supabase.
8. Comprueba `GET /api/ai-infrastructure` de manera autenticada; si no hay
   puente configurado, debe informar `inferenceReady=false`.

Los datasets Kaggle del repositorio `avatars` **no equivalen a una API GPU
activa**. El panel solo consulta el catálogo mediante un puente privado
configurado y no gasta sesiones GPU automáticamente.

## 6. Backups y actualización

La base de datos está en Supabase; gestiona las copias de sus datos en
[Database Backups](https://supabase.com/dashboard/project/jplhbgyhswvbghhzhjvm/database/backups)
según las opciones de tu plan. El volumen `media_data` de Oracle **sigue
requiriendo un backup propio**; los MP4 no están almacenados en Supabase.
No se automatizan cambios DNS, backups ni despliegue en Oracle desde GitHub.

Cualquier error de render o de voz debe bloquear la publicación del MP4
en vez de declarar un trabajo completo.
