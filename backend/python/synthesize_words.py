#!/usr/bin/env python3
"""
Synthesizes speech with Microsoft Edge TTS and extracts word-level subtitles.
"""
import asyncio
import sys
import edge_tts


async def synthesize(voice: str, rate: str, media_path: str, sub_path: str, text: str) -> None:
    comm = edge_tts.Communicate(text, voice, rate=rate, boundary="WordBoundary")
    sub = edge_tts.SubMaker()
    with open(media_path, "wb") as f:
        async for chunk in comm.stream():
            if chunk["type"] == "audio":
                f.write(chunk["data"])
            elif chunk["type"] == "WordBoundary":
                sub.feed(chunk)
    with open(sub_path, "w", encoding="utf-8") as f:
        f.write(sub.get_srt())


def main() -> None:
    if len(sys.argv) < 6:
        print("Usage: synthesize_words.py <voice> <rate> <media_path> <sub_path> <text>", file=sys.stderr)
        sys.exit(1)

    voice = sys.argv[1]
    rate = sys.argv[2]
    media_path = sys.argv[3]
    sub_path = sys.argv[4]
    text = sys.argv[5]

    asyncio.run(synthesize(voice, rate, media_path, sub_path, text))


if __name__ == "__main__":
    main()
