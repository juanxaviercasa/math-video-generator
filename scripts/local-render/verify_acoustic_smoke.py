import os
import json
import sys
from pathlib import Path
from faster_whisper import WhisperModel

SMOKE_DIR = Path(sys.argv[1] if len(sys.argv) > 1 else os.environ.get("SMOKE_DIR", Path.home() / ".gemini" / "antigravity" / "brain" / "52cd5083-359d-4be6-8911-3f7ce6700995" / "voice-smoke"))
audit_file = os.path.join(SMOKE_DIR, "voice-pronunciation-audit.json")
data = json.load(open(audit_file, encoding="utf-8"))

model = WhisperModel("base", device="cpu", compute_type="int8")

results = []

for sample in data["samples"]:
    audio_path = sample["audioPath"]
    sample_id = sample["id"]
    voice_id = sample["voiceId"]
    prepared = sample["prepared"]

    segments, info = model.transcribe(audio_path, language="es", word_timestamps=True)
    segments = list(segments)
    full_text = " ".join(s.text.strip() for s in segments)
    words = []
    for s in segments:
        if s.words:
            for w in s.words:
                words.append({"word": w.word.strip(), "start": round(w.start, 2), "end": round(w.end, 2)})

    # Key acoustic checks
    # 1. Check for cardinal twelve ('doce' vs 'uno dos')
    has_doce = "doce" in full_text.lower() or "12" in full_text
    has_uno_dos = "1 2" in full_text or "uno dos" in full_text.lower()

    # 2. Check for 'cuadrado'
    has_cuadrado = "cuadrado" in full_text.lower()

    # 3. Check for 'be labial' / 'bilabial' / 'bilavial'
    has_be_labial = any(term in full_text.lower() for term in ["be labial", "b labial", "bilabial", "bilavial"])

    # 4. Check for 'menos siete'
    has_menos_siete = "menos siete" in full_text.lower() or "menos 7" in full_text.lower()

    # 5. Check for decimal ('cero coma cinco' or '0.5' / 'cero punto cinco')
    has_decimal = "cero coma cinco" in full_text.lower() or "0,5" in full_text or "0.5" in full_text or "cinco" in full_text.lower()

    results.append({
        "id": sample_id,
        "voice": voice_id,
        "prepared_script": prepared,
        "acoustic_transcription": full_text,
        "checks": {
            "cardinal_doce": has_doce and not has_uno_dos,
            "cuadrado": has_cuadrado if "cuadrado" in prepared else None,
            "be_labial": has_be_labial if "labial" in prepared else None,
            "menos_siete": has_menos_siete if "menos siete" in prepared else None,
            "decimal_ok": has_decimal if "cero coma cinco" in prepared else None,
        },
        "words": words
    })

out_path = os.path.join(SMOKE_DIR, "acoustic-whisper-audit.json")
with open(out_path, "w", encoding="utf-8") as f:
    json.dump(results, f, indent=2, ensure_ascii=False)

print(f"Audit completed: {len(results)} samples analyzed.")
for r in results:
    print(f"\n[{r['id']}]")
    print(f"  Prepared: {r['prepared_script']}")
    print(f"  Acoustic: {r['acoustic_transcription']}")
    print(f"  Checks: {r['checks']}")
