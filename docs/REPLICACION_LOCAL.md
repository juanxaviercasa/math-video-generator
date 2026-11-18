# Replicación Local en Cualquier Computadora (Mismas Habilidades y Pipeline)

Este repositorio ya incluye todo lo necesario para que cualquiera de tus computadoras produzca videos con el mismo flujo, reglas, habilidades y motores que la máquina principal:

## Qué ya viene automáticamente al clonar `main`

1. **Habilidades de Antigravity (`.agents/skills/`):**
   - `guion-retencion`: estructura viral de 9 partes para Reels, TikToks y Shorts + banco y ejemplos.
   - `qwen-code`, `vite_vercel_deploy_guide`, `skill-creator`, `skill-repair`.
2. **Reglas obligatorias de diseño 9:16:**
   - [`AGENTS.md`](../AGENTS.md) y [`MOBILE_TYPOGRAPHY_AND_SAFE_ZONES_SPEC.md`](./MOBILE_TYPOGRAPHY_AND_SAFE_ZONES_SPEC.md).
3. **Escenas y scripts de los 5 modelos virales (`scripts/viral-shorts/`):**
   - `poshenloh`, `mcd_olimpiada`, `origen_formula`, `mru_ciencia`, `binomio_cuadrado` (escena Manim, guion y script de muxing/verificación).
4. **Scripts locales de renderizado y verificación (`scripts/local-render/` y `backend/scripts/render-single-case.ts`):**
   - Usan rutas portables basadas en `%USERPROFILE%\Videos\ecuaciones-cuadraticas-finales` (o la variable `MVG_OUTPUT_ROOT` / `MEDIA_ROOT`).
5. **Dependencias Python fijadas (`backend/python/requirements.txt`) y bootstrap (`scripts/setup-local-env.ps1`).**

---

## Cómo replicarlo en una máquina nueva (Windows)

### Opción rápida (con script automático)

```powershell
git clone https://github.com/juanxaviercasa/math-video-generator.git
cd "math-video-generator"
powershell -ExecutionPolicy Bypass -File scripts/setup-local-env.ps1
```

### Requisitos previos del sistema operativo

- **Git** y **Node.js** (v20/v22/v24 LTS).
- **FFmpeg + FFprobe** en el `PATH` (`winget install Gyan.FFmpeg`).
- **MiKTeX** instalado (para `MathTex` en Manim, con instalación de paquetes al vuelo habilitada o `standalone`, `amsmath`, `amssymb`, `babel`, `preview`, `xcolor`).
- **Opcional según lo que uses:**
  - Si quieres conectar el backend/worker local a la misma base de datos de Supabase y usar las mismas API keys (Gemini/OpenAI/OpenRouter), copia manualmente por un medio privado tu archivo `.env.personal` (no se sube a GitHub).
  - Si vas a levantar la cola completa BullMQ (`backend` + `worker`) en local, instala/ejecuta también **Redis** o Docker (`deploy/docker-compose.yml`).
  - Si usas `qwen-code`, instala la CLI global de Qwen; si usas las skills de `science` o `data-agent-kit-plugin`, instálalas desde el Plugins Manager de Antigravity.
  - La ruta absoluta de `mcp-config.json` debe apuntar a la carpeta real del repo en esa PC si utilizas el servidor MCP local por `stdio`.

---

## Prompt listo para darle a Antigravity en tu otra computadora

```text
Acabo de clonar este proyecto ("Math Video Generator"). Necesito dejar esta computadora exactamente lista para producir videos locales con Manim, LaTeX, Edge TTS y FFmpeg igual que en la máquina principal.

Haz lo siguiente paso a paso y verifica cada resultado:
1. Lee `AGENTS.md`, `docs/REPLICACION_LOCAL.md` y revisa las skills disponibles en `.agents/skills/` (en especial `guion-retencion`).
2. Verifica que existan en el sistema: Git, Node.js/npm, FFmpeg, FFprobe y MiKTeX (`latex` y `dvisvgm`). Si falta alguno que puedas instalar con `winget` o informarme, indícamelo o instálalo.
3. Ejecuta `powershell -ExecutionPolicy Bypass -File scripts/setup-local-env.ps1` para crear `.venv` con `uv`, instalar `backend/python/requirements.txt` (`manim==0.22.1`, `edge-tts==7.3.1`, `sympy==1.14.0`, etc.), ejecutar `npm install`, `prisma:generate` y `npm run build`.
4. Haz una prueba real de humo con `.\.venv\Scripts\manim.exe` (renderizando una escena breve con `MathTex`), `.\.venv\Scripts\edge-tts.exe` y `ffmpeg` para confirmar que todo funciona sin errores.
5. Verifica si existe `.env.personal` o `.env` sin mostrar secretos; si no existe, recuérdame qué necesito copiar manualmente solo si quiero conectar el backend local a Supabase/APIs.
```
