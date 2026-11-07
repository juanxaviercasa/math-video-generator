#!/usr/bin/env bash
set -euo pipefail

if [[ $# -lt 1 ]]; then
  echo "Uso: $0 <video.mp4> [ancho alto]" >&2
  exit 64
fi

file="$1"
expected_width="${2:-}"
expected_height="${3:-}"

[[ -f "$file" ]] || { echo "No existe el artefacto: $file" >&2; exit 66; }

json="$(ffprobe -v error -show_entries format=duration:stream=codec_type,codec_name,width,height -of json "$file")"
python3 - "$json" "$expected_width" "$expected_height" <<'PY'
import json
import sys

payload = json.loads(sys.argv[1])
expected_width = int(sys.argv[2]) if sys.argv[2] else None
expected_height = int(sys.argv[3]) if sys.argv[3] else None
streams = payload.get('streams', [])
video = next((item for item in streams if item.get('codec_type') == 'video'), None)
audio = next((item for item in streams if item.get('codec_type') == 'audio'), None)
duration = float(payload.get('format', {}).get('duration', 0))

errors = []
if not video:
    errors.append('falta stream de video')
if not audio:
    errors.append('falta stream de audio')
if duration <= 0:
    errors.append('duracion invalida')
if expected_width and video and video.get('width') != expected_width:
    errors.append(f"ancho inesperado: {video.get('width')} != {expected_width}")
if expected_height and video and video.get('height') != expected_height:
    errors.append(f"alto inesperado: {video.get('height')} != {expected_height}")

print(json.dumps({'duration': duration, 'video': video, 'audio': audio}, ensure_ascii=False))
if errors:
    print('MEDIA_QA_FAILED: ' + '; '.join(errors), file=sys.stderr)
    sys.exit(1)
print('MEDIA_QA_OK')
PY
