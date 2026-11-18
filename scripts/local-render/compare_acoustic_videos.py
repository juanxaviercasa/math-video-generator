import os
import json
import sys
from pathlib import Path
from faster_whisper import WhisperModel

_default_batch = Path.home() / ".gemini" / "antigravity" / "brain" / "52cd5083-359d-4be6-8911-3f7ce6700995" / "batch-certification"
DEFECT_VIDEO = sys.argv[1] if len(sys.argv) > 1 else os.environ.get("DEFECT_VIDEO", str(_default_batch / "mvg_batch_01-narrated.mp4"))
FIXED_VIDEO = sys.argv[2] if len(sys.argv) > 2 else os.environ.get("FIXED_VIDEO", str(_default_batch / "mvg_pilot_01_fixed" / "mvg_pilot_01_fixed-narrated.mp4"))
OUT_REPORT = sys.argv[3] if len(sys.argv) > 3 else os.environ.get("OUT_REPORT", str(_default_batch / "mvg_pilot_01_fixed" / "acoustic_ab_comparison.json"))

print("Loading WhisperModel ('base')...")
model = WhisperModel("base", device="cpu", compute_type="int8")

def transcribe_clip(path, max_duration=35.0):
    print(f"Transcribing {os.path.basename(path)} (first {max_duration}s)...")
    segments, info = model.transcribe(path, language="es", word_timestamps=True)
    results = []
    full_words = []
    for s in segments:
        if s.start > max_duration:
            break
        text = s.text.strip()
        words = []
        if s.words:
            for w in s.words:
                words.append({"word": w.word.strip(), "start": round(w.start, 2), "end": round(w.end, 2)})
                full_words.append(w.word.strip())
        results.append({
            "start": round(s.start, 2),
            "end": round(s.end, 2),
            "text": text,
            "words": words
        })
    full_text = " ".join(r["text"] for r in results)
    return {
        "full_text": full_text,
        "segments": results,
        "words": full_words
    }

print("Running defect video transcription...")
defect_data = transcribe_clip(DEFECT_VIDEO, max_duration=35.0)

print("Running fixed video transcription...")
fixed_data = transcribe_clip(FIXED_VIDEO, max_duration=35.0)

comparison = {
    "defect_video": {
        "path": DEFECT_VIDEO,
        "transcript_preview": defect_data["full_text"],
        "segments": defect_data["segments"],
        "has_digit_by_digit_1_2": "1 2" in defect_data["full_text"],
        "has_elevado_a_la_potencia": "elevado a la potencia" in defect_data["full_text"].lower(),
        "has_be_labial": any(w in defect_data["full_text"].lower() for w in ["be labial", "bilabial", "bilavial"])
    },
    "fixed_video": {
        "path": FIXED_VIDEO,
        "transcript_preview": fixed_data["full_text"],
        "segments": fixed_data["segments"],
        "has_cardinal_12": "12" in fixed_data["full_text"] and "1 2" not in fixed_data["full_text"],
        "has_al_cuadrado": "al cuadrado" in fixed_data["full_text"].lower(),
        "has_be_labial": any(w in fixed_data["full_text"].lower() for w in ["be labial", "bilabial", "bilavial"]),
        "has_menos_siete": "menos 7" in fixed_data["full_text"] or "menos siete" in fixed_data["full_text"].lower()
    }
}

with open(OUT_REPORT, "w", encoding="utf-8") as f:
    json.dump(comparison, f, indent=2, ensure_ascii=False)

print("\n--- ACOUSTIC A/B COMPARISON SUMMARY ---")
print(f"DEFECT VIDEO: '1 2' digit-by-digit? {comparison['defect_video']['has_digit_by_digit_1_2']} | 'elevado a la potencia'? {comparison['defect_video']['has_elevado_a_la_potencia']} | 'be labial'? {comparison['defect_video']['has_be_labial']}")
print(f"FIXED VIDEO:  Cardinal '12' (doce)? {comparison['fixed_video']['has_cardinal_12']} | 'al cuadrado'? {comparison['fixed_video']['has_al_cuadrado']} | 'be labial'? {comparison['fixed_video']['has_be_labial']} | 'menos 7'? {comparison['fixed_video']['has_menos_siete']}")
print(f"Report saved to: {OUT_REPORT}")
