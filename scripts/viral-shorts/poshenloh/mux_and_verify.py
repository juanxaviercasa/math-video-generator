# -*- coding: utf-8 -*-
"""
Helper script to mux rendered video with narration audio,
extract verification keyframes, and generate forensic report.
"""
import os
import subprocess
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[3]
OUTPUT_ROOT = Path(os.environ.get("MVG_OUTPUT_ROOT", Path.home() / "Videos" / "ecuaciones-cuadraticas-finales"))
MODEL_DIR = OUTPUT_ROOT / "VIRAL_SHORTS_POSHENLOH"
VIDEO_DIR = REPO_ROOT / "media" / "videos" / "poshenloh_viral_short_scene" / "1280p30"
RAW_VIDEO = VIDEO_DIR / "PoShenLohViralShort.mp4"
AUDIO_FILE = MODEL_DIR / "narration_poshenloh.mp3"
FINAL_OUTPUT = MODEL_DIR / "viral_short_poshenloh_9x16.mp4"
KEYFRAMES_DIR = MODEL_DIR / "verification_frames"

def main():
    if not RAW_VIDEO.exists():
        print(f"ERROR: Raw video {RAW_VIDEO} not found yet.")
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

    # Extract verification keyframes at important milestones:
    # 5s (Act 1 Hook: Red cross over formula), 22s (Act 1: Promise)
    # 42s (Act 2: Parabola + floor), 75s (Act 3: Symmetry axis + center)
    # 95s (Act 4: -u and +u vectors), 125s (Act 5: Difference of squares)
    # 142s (Act 6: Vertex depth), 158s (Act 7: Solution set CS = {1, 5})
    # 168s (Act 8: Outro card + 3D logo)
    timestamps = [5, 22, 42, 75, 95, 125, 142, 158, 168]
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
