#!/usr/bin/env bash
# Deploy only Math Video Generator; does not change other VPS applications.
# Defaults to preflight. Explicit --apply is required to start containers.
set -Eeuo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"
ENVFILE="${MATH_ENV_FILE:-.env.personal}"
COMPOSE=(docker compose --env-file "$ENVFILE" -f deploy/docker-compose.yml)
MODE="${1:---check}"

if [[ "$MODE" != "--check" && "$MODE" != "--apply" ]]; then
  echo "Uso: bash scripts/deploy-oracle-personal.sh [--check|--apply]" >&2
  exit 2
fi

echo "[Math Video Generator] Oracle personal: $MODE"
if [[ ! -f "$ENVFILE" ]]; then
  echo "Falta $ENVFILE. Copia .env.personal.example y completa los datos privados del VPS." >&2
  exit 1
fi
if ! command -v docker >/dev/null 2>&1; then
  echo "Docker no está instalado en este servidor." >&2
  exit 1
fi
docker compose version >/dev/null

# Do not log or print DATABASE_URL, JWT_SECRET or provider keys.
if ! "${COMPOSE[@]}" config --quiet >/dev/null; then
  echo "La configuración de Docker Compose está incompleta. Comprueba las variables obligatorias." >&2
  exit 1
fi

python3 - "$ENVFILE" <<'PY'
import os,sys,stat,re
f=sys.argv[1]
mode=stat.S_IMODE(os.stat(f).st_mode)
if mode & 0o077:
    sys.exit("Protege el archivo de secretos: chmod 600 "+f)
d={}
for line in open(f,encoding="utf-8"):
    if not line.strip() or line.lstrip().startswith("#") or "=" not in line: continue
    k,v=line.split("=",1)
    d[k.strip()]=v.strip().strip('"').strip("'")
for k in ("DATABASE_URL","DIRECT_URL","JWT_SECRET","OWNER_USER_ID","SUPABASE_PUBLISHABLE_KEY"):
    if not d.get(k): sys.exit("Falta variable obligatoria en "+f+": "+k)
if not re.fullmatch(r"[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}",d["OWNER_USER_ID"]):
    sys.exit("OWNER_USER_ID debe ser el UUID de tu usuario Supabase.")
if not d["DATABASE_URL"].startswith("postgresql://") or "jplhbgyhswvbghhzhjvm" not in d["DATABASE_URL"]:
    sys.exit("DATABASE_URL no parece apuntar al proyecto Supabase Video Generator.")
if len(d["JWT_SECRET"])<32: sys.exit("JWT_SECRET debe contener al menos 32 caracteres.")
if d.get("APP_URL")!="https://math.forjavia.site":
    sys.exit("APP_URL debe ser https://math.forjavia.site")
print("Configuración obligatoria validada (sin mostrar secretos).")
PY

# Avoid exhausting a free-tier ARM machine with a large LaTeX/Manim image.
if command -v df >/dev/null; then
  disk_kb="$(df -Pk "$ROOT" | awk 'NR==2 {print $4}')"
  if [[ "$disk_kb" =~ ^[0-9]+$ ]] && ((disk_kb < 10 * 1024 * 1024)); then
    echo "Espacio libre insuficiente (<10 GiB) para construir Manim/LaTeX de forma segura." >&2
    exit 1
  fi
fi
if [[ -r /proc/meminfo ]]; then
  mem_kb="$(awk '/^MemAvailable:/ {print $2}' /proc/meminfo)"
  if [[ "$mem_kb" =~ ^[0-9]+$ ]] && ((mem_kb < 2 * 1024 * 1024)); then
    echo "Memoria libre insuficiente (<2 GiB). No se iniciará el render para proteger otras apps." >&2
    exit 1
  fi
fi
if command -v ss >/dev/null 2>&1; then
  if ss -H -ltn '( sport = :3001 )' 2>/dev/null | grep -q .; then
    existing="$(docker ps -q --filter name=^/math-video-backend$)"
    if [[ -z "$existing" ]]; then
      echo "El puerto 3001 ya lo utiliza otro proceso; no se reemplazará." >&2
      exit 1
    fi
  fi
fi

echo "Comprobación de recursos y conflictos superada."
echo "Se usarán Redis privado, API 127.0.0.1:3001 y worker de una tarea. No se crea Postgres local."
if [[ "$MODE" == "--check" ]]; then
  echo "Preflight completado. Para desplegar: bash scripts/deploy-oracle-personal.sh --apply"
  exit 0
fi

"${COMPOSE[@]}" up -d --build redis backend worker
echo "Contenedores creados. Estado:"
"${COMPOSE[@]}" ps
echo "Comprobando disponibilidad de API y Supabase..."
if ! curl --fail --silent --show-error http://127.0.0.1:3001/readyz; then
  echo "La API aún no está lista. Revisa solo este proyecto: docker compose --env-file $ENVFILE -f deploy/docker-compose.yml logs --tail=100 backend worker" >&2
  exit 1
fi
printf '\nLa API local está lista. Aún se necesita configurar el túnel HTTPS de Cloudflare.\n'
