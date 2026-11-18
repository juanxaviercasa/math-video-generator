# -*- coding: utf-8 -*-
"""
Generates Dual-Voice (Male + Female) neural narration for Modelo 4: (a + b)^2
and outputs exact segment timestamps for Manim synchronization.
"""
import os
import shutil
import subprocess
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[3]
OUTPUT_ROOT = Path(os.environ.get("MVG_OUTPUT_ROOT", Path.home() / "Videos" / "ecuaciones-cuadraticas-finales"))
OUT_DIR = OUTPUT_ROOT / "VIRAL_SHORTS_BINOMIO_CUADRADO"
OUT_DIR.mkdir(parents=True, exist_ok=True)
_venv_edge_tts = REPO_ROOT / ".venv" / "Scripts" / "edge-tts.exe"
EDGE_TTS = str(_venv_edge_tts) if _venv_edge_tts.exists() else (shutil.which("edge-tts") or "edge-tts")

SEGMENTS = [
    (
        "seg1_male",
        "es-MX-JorgeNeural",
        "+12%",
        "¿Qué significa realmente a más b al cuadrado? En la escuela nos lo enseñan de memoria sin que tengamos idea de qué implica esto, y muchos creen por error que es solo a cuadrada más b cuadrada. Veamos qué hay detrás del concepto. Esto se puede explicar de forma algebraica o de forma geométrica."
    ),
    (
        "seg2_female",
        "es-MX-DaliaNeural",
        "+12%",
        "Veremos la geometría por su sutileza visual, y además porque las sociedades antiguas hicieron de la geometría las reglas más básicas del juego de las matemáticas."
    ),
    (
        "seg3_female",
        "es-MX-DaliaNeural",
        "+12%",
        "Tomamos un cuadrado. Como no sabemos cuánto mide, diremos que mide lado a, lo que significa que su área es a al cuadrado. Ahora me pregunto: ¿qué pasaría si este cuadrado se hace más grande? Vemos que ha crecido, pero ¿cuánto?"
    ),
    (
        "seg4_female",
        "es-MX-DaliaNeural",
        "+12%",
        "No lo sabemos aún, pero a este lado sobrante le podemos llamar b. Vemos que la parte nueva hizo una figura en ele más compleja. Entonces busquemos dividirla en figuras más fáciles para todos."
    ),
    (
        "seg5_female",
        "es-MX-DaliaNeural",
        "+12%",
        "Observa que ahora tenemos dos rectángulos iguales de lados a y b, y un cuadrado más pequeño en la esquina. Entonces el área de cada rectángulo será a por b igual a ab. Y ese cuadrado pequeño es de lado b, así que su área será b por b igual a b al cuadrado."
    ),
    (
        "seg6_male",
        "es-MX-JorgeNeural",
        "+12%",
        "Y recordemos que hicimos esto porque queríamos ver qué pasaba al crecer todo el cuadrado de lado a más b. Si sumamos todas sus áreas interiores obtenemos a cuadrada, más ab, más ab, más b cuadrada. Al juntar los dos rectángulos iguales nace la famosa fórmula: a más b al cuadrado es igual a a cuadrada, más dos ab, más b cuadrada."
    ),
    (
        "seg7_female",
        "es-MX-DaliaNeural",
        "+12%",
        "Así nunca volverás a olvidar el dos ab del centro, porque son los dos rectángulos que completan el cuadrado. Guarda este video y síguenos en Zénit Matemática."
    ),
]


def get_duration(mp3_path: Path) -> float:
    res = subprocess.run(
        [
            "ffprobe", "-v", "error",
            "-show_entries", "format=duration",
            "-of", "default=noprint_wrappers=1:nokey=1",
            str(mp3_path)
        ],
        capture_output=True, text=True
    )
    return float(res.stdout.strip())


def main():
    concat_lines = []
    cum_time = 0.0
    print("=== GENERATING DUAL-VOICE SEGMENTS ===")
    for name, voice, rate, text in SEGMENTS:
        txt_file = OUT_DIR / f"{name}.txt"
        mp3_file = OUT_DIR / f"{name}.mp3"
        vtt_file = OUT_DIR / f"{name}.vtt"
        txt_file.write_text(text, encoding="utf-8")
        subprocess.run(
            [
                EDGE_TTS,
                "--voice", voice,
                f"--rate={rate}",
                "--file", str(txt_file),
                "--write-media", str(mp3_file),
                "--write-subtitles", str(vtt_file),
            ],
            check=True
        )
        dur = get_duration(mp3_file)
        print(f"{name} ({voice}): start={cum_time:.2f}s, dur={dur:.2f}s, end={cum_time + dur:.2f}s")
        cum_time += dur
        concat_lines.append(f"file '{mp3_file.as_posix()}'")

    concat_list = OUT_DIR / "concat_list.txt"
    concat_list.write_text("\n".join(concat_lines), encoding="utf-8")
    final_mp3 = OUT_DIR / "narration_binomio_cuadrado.mp3"
    subprocess.run(
        [
            "ffmpeg", "-y", "-f", "concat", "-safe", "0",
            "-i", str(concat_list),
            "-c:a", "libmp3lame", "-b:a", "192k",
            str(final_mp3)
        ],
        check=True, capture_output=True
    )
    total_dur = get_duration(final_mp3)
    print(f"TOTAL DURATION: {total_dur:.3f}s")


if __name__ == "__main__":
    main()
