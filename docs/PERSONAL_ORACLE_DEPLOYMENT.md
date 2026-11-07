# Math Video Generator — despliegue privado en Oracle + Cloudflare Pages

> Este repositorio contiene una **configuración preparada**, no una declaración de que el VPS, el DNS o Cloudflare Pages hayan sido desplegados. No tocar ViralForge, servicios Forjavia ni instalaciones existentes sin verificar los recursos reales.

## Arquitectura mínima (una sola persona)

- **Frontend privado**: React/Vite en Cloudflare Pages, con dominio propio en el mismo sitio que la API.
- **API**: Node/Express en Oracle VPS, `127.0.0.1:3001` solamente, publicada mediante Cloudflare Tunnel (HTTPS).
- **Worker**: Manim + FFmpeg + Edge TTS, un solo trabajo simultáneo, con límites de memoria y CPU.
- **Estado**: PostgreSQL y Redis privados dentro del proyecto Docker Compose; archivos MP4 y diagnósticos en volumen persistente.
- **IA externa**: Gemini u OpenAI para OCR visual según claves existentes; solver cuadrático local para resultados verificables.
- **ViralForge/Kaggle**: consulta opcional del catálogo de modelos; nunca inicia GPUs ni mueve datasets automáticamente.

La instalación solo admite a la cuenta existente definida por `OWNER_USER_ID` y no ofrece registro de nuevos usuarios.

## 0. Revisiones previas — no destructivas

En el VPS elegido, revisa:

```bash
uname -m                         # Oracle Ampere: aarch64
free -h
df -h
docker version
docker compose version
ss -lntup | grep -E ':(3001|5432|6379|8765|8501)\b' || true
```

Verifica también la forma (shape) y cuota real Always Free en la consola de Oracle. **No uses automáticamente una instancia que ya está al límite ni borres volúmenes existentes**.

## 1. Descarga y configuración de secretos privados

```bash
sudo mkdir -p /opt/math-video-generator
sudo chown "${USER}:${USER}" /opt/math-video-generator
git clone https://github.com/juanxaviercasa/math-video-generator.git /opt/math-video-generator
cd /opt/math-video-generator
cp .env.personal.example .env.personal
chmod 600 .env.personal
```

Si el repositorio es privado, emplea una credencial de GitHub de solo lectura / deploy key; no copies tokens al repositorio.

Edita `.env.personal` con:

- `OWNER_USER_ID`: el UUID real de **tu cuenta ya existente** en Supabase Auth, no un email ni un UUID inventado.
- `SUPABASE_URL` y `SUPABASE_PUBLISHABLE_KEY`: tus valores existentes; nunca se envían al navegador desde la API.
- `DB_PASSWORD`: una contraseña nueva para el Postgres **de esta instalación** (sin caracteres reservados en URI si no están percent-encoded).
- `JWT_SECRET`: un valor aleatorio largo (por ejemplo `openssl rand -hex 32`).
- `APP_URL`: origen HTTPS exacto del frontend, sin barra final.
- `GEMINI_API_KEY` u `OPENAI_API_KEY`: opcionales, necesarios para extracción de fotos y PDF. No se cargan en Cloudflare Pages.
- `TTS_PROVIDER=edge`, `TTS_ALLOW_LOCAL_FALLBACK=false`: para evitar videos con una voz inesperada o silencio.

**Nota:** El esquema usa un PostgreSQL nuevo privado del proyecto. Si prefieres reutilizar el servidor PostgreSQL de otra aplicación, se necesita otro compose y otra base/esquema aislado; no reuses ni sobreescribas una base de producción existente.

## 2. Validar el stack ANTES del primer arranque

```bash
docker compose --env-file .env.personal -f deploy/docker-compose.yml config --quiet
docker compose --env-file .env.personal -f deploy/docker-compose.yml config --services
```

Los servicios por defecto son `postgres`, `redis`, `backend`, `worker`.
`frontend` está bajo perfil `local-ui`, porque la web final vivirá en Cloudflare Pages.

El contenedor de la API solo publica `127.0.0.1:3001`. **Nunca** exponer 5432, 6379 ni 3001 a `0.0.0.0` en Internet.

## 3. Ejecutar y verificar sin modificar servicios de terceros

```bash
docker compose --env-file .env.personal -f deploy/docker-compose.yml up -d --build
docker compose --env-file .env.personal -f deploy/docker-compose.yml ps
curl --fail http://127.0.0.1:3001/health
curl --fail http://127.0.0.1:3001/readyz
docker compose --env-file .env.personal -f deploy/docker-compose.yml logs --tail=50 backend worker
```

Si no hay espacio suficiente para los paquetes LaTeX/Manim, detén **solo** este proyecto, revisa el consumo y selecciona otro host para el worker. No elimines contenedores ni volúmenes de ViralForge/Forjavia.

El backend ejecuta `prisma migrate deploy` solo contra la base nueva de Math Video Generator. El worker no ejecuta migraciones. Los MP4 se guardan en `media_data`.

## 4. Cloudflare Tunnel para la API

Usa una ruta nueva, independiente de túneles que atiendan otras apps. En la consola de Cloudflare crea un túnel nuevo o añade **únicamente** una ruta adicional a un túnel existente después de inspeccionar su configuración.

Propuesta de ruta: `api-math.forjavia.site` → `http://127.0.0.1:3001` (solo si `cloudflared` reside en el mismo VPS).

Para un túnel gestionado mediante archivos, parte de `deploy/cloudflared-math.example.yml`; sustituye UUID y ruta de credenciales localmente, valida las reglas con:

```bash
cloudflared tunnel ingress validate --config /RUTA/PRIVADA/config-math.yml
```

Si el túnel ya existe en Cloudflare Zero Trust, configúralo desde el panel; no ejecutes una segunda instancia con la misma configuración por error. El hostname sugerido **aún no está reservado ni creado desde este repo**.

## 5. Frontend Cloudflare Pages — GitHub

Crea el proyecto Pages desde el repositorio `juanxaviercasa/math-video-generator`, rama `main`:

| Campo | Valor |
|---|---|
| Root directory | `/` (raíz del monorepo) |
| Framework preset | None / custom |
| Build command | `npm ci && npm run build:frontend` |
| Build output | `frontend/dist` |
| Variable de compilación | `VITE_API_URL=https://api-math.forjavia.site/api` |

Asocia después el dominio `math.forjavia.site` si está libre en tu zona de Cloudflare y comprueba TLS. La SPA usa `frontend/public/_redirects` para rutas internas y `_headers` para respuestas de seguridad.

No subas `.env.personal` a Pages. Vite solo necesita la URL pública de la API, **nunca** tus secretos Gemini/OpenAI/Redis/Supabase privados.

**Cookies:** Las cookies actuales son `Secure; SameSite=Lax`. La ruta frontend `math.forjavia.site` y API `api-math.forjavia.site` comparte el sitio registrable `forjavia.site`. Para usar un dominio temporal `*.pages.dev` diferente se requiere reconsiderar la política de cookies; la prueba funcional completa debe hacerse en dominios finales con HTTPS.

## 6. Probar el uso personal

1. Abre el frontend en HTTPS; sin sesión no debe mostrar el generador ni tus videos.
2. Inicia sesión con **tu usuario Supabase existente**. Intenta otra cuenta de prueba: debe responder `403 OWNER_ONLY`.
3. Prueba `GET /api/auth/me` mediante el navegador autenticado y el botón de voces neurales.
4. Sube un ejercicio PNG/PDF, corrige el OCR y confirma el enunciado.
5. Genera un ejemplo de cuadrática con una sola tarea concurrente.
6. Reproduce el MP4, verifica voz audible, fórmulas, QA y acceso privado a los archivos.

### Comprobación de seguridad mínima

- `POST /api/auth/register` debe devolver `403 PRIVATE_INSTALLATION`.
- `POST /api/preview` y `GET /api/videos` sin autenticación deben devolver `401`.
- `GET /api/media/:id/:file` sin propietario válido debe devolver `401` o `404`.
- `GET /mcp` remoto sin token debe permanecer deshabilitado.
- Confirmar que ni Redis ni PostgreSQL aparecen como puertos públicos.

## 7. ViralForge y los modelos Kaggle ya inventariados

Configura `VIRALFORGE_INTERNAL_URL` en `.env.personal` **solo si tienes una URL privada alcanzable desde el contenedor backend**. La integración hace una consulta de lectura a `/api/kaggle/catalog`, filtra roles útiles para matemáticas y muestra metadatos seguros en «Mis modelos de IA». **Nunca publica tokens, rutas locales ni cuentas Kaggle**, y siempre indica que inferencia GPU no está verificada.

Si ViralForge escucha en `127.0.0.1:8765` **del host**, esa dirección no se comparte automáticamente con los contenedores Docker. Hace falta un gateway autenticado/privado compatible o una red Docker compartida explícitamente configurada. No expongas el API histórico de ViralForge públicamente para conseguirlo.

La conexión al catálogo no significa que Qwen2-VL, Qwen3-TTS, MuseTalk o Wan estén cargados en una GPU activa. La integración de inferencia necesita un servicio accesible, autenticado y con health checks reales.

## 8. Backups, operación y rollback

- Backup programado de PostgreSQL y del volumen de media; conserva una copia fuera del VPS.
- No elimines `postgres_data` ni `media_data` al actualizar.
- Limita trabajos simultáneos a 1 y monitoriza CPU/RAM/disco.
- En caso de fallo de voz, el proceso debe rechazar un MP4 sin audio, no publicar silenciosamente un video defectuoso.
- Para volver al commit anterior sin eliminar datos: despliega la versión Git anterior de `backend` y `worker` después de verificar compatibilidad de esquema; **no** uses `docker compose down -v`.

## Lo que requiere acceso a cuentas reales

Este repositorio **no** puede crear la instancia Pages, el túnel DNS, el UUID de Supabase, secretos ni alterar servicios de Oracle por sí mismo. Son pasos de despliegue que requieren las cuentas conectadas y verificación del servidor. No compartas claves privadas en el chat.
