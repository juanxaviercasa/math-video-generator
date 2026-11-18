# -*- coding: utf-8 -*-
"""
Muxing and verification script for Origen Geométrico de la Fórmula General Short (modelo_math_3)
"""
import os
import subprocess
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[3]
OUTPUT_ROOT = Path(os.environ.get("MVG_OUTPUT_ROOT", Path.home() / "Videos" / "ecuaciones-cuadraticas-finales"))
MODEL_DIR = OUTPUT_ROOT / "VIRAL_SHORTS_ORIGEN_FORMULA"
VIDEO_DIR = REPO_ROOT / "media" / "videos" / "origen_formula_viral_short_scene" / "1280p30"
RAW_VIDEO = VIDEO_DIR / "OrigenFormulaViralShort.mp4"
AUDIO_FILE = MODEL_DIR / "narration_origen_formula.mp3"
FINAL_OUTPUT = MODEL_DIR / "viral_short_origen_formula_9x16.mp4"
KEYFRAMES_DIR = MODEL_DIR / "verification_frames"

def main():
    if not RAW_VIDEO.exists():
        print(f"ERROR: Raw video {RAW_VIDEO} not found.")
        return

    KEYFRAMES_DIR.mkdir(parents=True, exist_ok=True)

    print("🎬 Muxing video and audio with FFmpeg...")
    cmd_mux = [
        "ffmpeg", "-y",
        "-i", str(RAW_VIDEO),
        "-i", str(AUDIO_FILE),
        "-c:v", "copy",
        "-c:a", "aac",
        "-b:a", "192k",
        "-shortest",
        str(FINAL_OUTPUT)
    ]
    res = subprocess.run(cmd_mux, capture_output=True, text=True)
    if res.returncode != 0:
        print("FFmpeg error:", res.stderr)
        return
    print(f"✅ Final video created: {FINAL_OUTPUT}")
    import shutil
    shutil.copy2(FINAL_OUTPUT, REPO_ROOT / "viral_short_origen_formula_9x16.mp4")

    timestamps = [6, 17, 38, 55, 86, 118, 125, 130, 142, 165, 174]
    print("📸 Extracting verification keyframes...")
    for t in timestamps:
        frame_out = KEYFRAMES_DIR / f"frame_{t:03d}s.jpg"
        cmd_frame = [
            "ffmpeg", "-y",
            "-ss", str(t),
            "-i", str(FINAL_OUTPUT),
            "-vframes", "1",
            "-q:v", "2",
            str(frame_out)
        ]
        subprocess.run(cmd_frame, capture_output=True)
        print(f"  - Extracted frame at {t}s -> {frame_out.name}")

    print("🚀 All keyframes extracted successfully.")

if __name__ == "__main__":
    main()
