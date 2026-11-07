#!/usr/bin/env bash
set -euo pipefail

required_commands=(node python3 manim ffmpeg ffprobe edge-tts pdflatex)
for command_name in "${required_commands[@]}"; do
  if ! command -v "$command_name" >/dev/null 2>&1; then
    echo "[runtime-smoke] Falta dependencia: $command_name" >&2
    exit 1
  fi
done

node --version
python3 --version
manim --version | head -n 1
ffmpeg -version | head -n 1
ffprobe -version | head -n 1
edge-tts --version
pdflatex --version | head -n 1

if [[ "${SUPABASE_URL:-}" == *"your-project-ref"* || -z "${SUPABASE_URL:-}" ]]; then
  echo "[runtime-smoke] SUPABASE_URL sigue siendo placeholder o no está definida" >&2
  exit 2
fi
if [[ "${SUPABASE_PUBLISHABLE_KEY:-}" == *"your-key"* || -z "${SUPABASE_PUBLISHABLE_KEY:-}" ]]; then
  echo "[runtime-smoke] SUPABASE_PUBLISHABLE_KEY sigue siendo placeholder o no está definida" >&2
  exit 2
fi
if [[ -z "${DATABASE_URL:-}" || -z "${REDIS_URL:-}" ]]; then
  echo "[runtime-smoke] DATABASE_URL y REDIS_URL son obligatorias" >&2
  exit 2
fi

echo "[runtime-smoke] Runtime multimedia y configuración mínima detectados."
