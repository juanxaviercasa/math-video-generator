import glob, json, subprocess, os
from pathlib import Path

output_root = Path(os.environ.get("MVG_OUTPUT_ROOT", Path.home() / "Videos" / "ecuaciones-cuadraticas-finales"))
files = sorted(glob.glob(str(output_root / "VIDEOS_FINALES_LIMPIOS" / "*.mp4")))
print(f"Total videos found: {len(files)}")
for f in files:
    cmd = ['ffprobe', '-v', 'error', '-show_streams', '-show_format', '-of', 'json', f]
    data = json.loads(subprocess.check_output(cmd).decode())
    v_stream = next((s for s in data['streams'] if s['codec_type'] == 'video'), None)
    a_stream = next((s for s in data['streams'] if s['codec_type'] == 'audio'), None)
    dur = round(float(data['format']['duration']), 1)
    sz_mb = round(int(data['format']['size']) / (1024*1024), 2)
    name = os.path.basename(f)
    v_info = f"{v_stream['codec_name']} ({v_stream['width']}x{v_stream['height']})" if v_stream else "None"
    a_info = f"{a_stream['codec_name']} ({a_stream.get('sample_rate', '?')}Hz)" if a_stream else "None"
    print(f"• {name}\n   Video: {v_info} | Audio: {a_info} | Duración: {dur}s | Peso: {sz_mb} MB")
