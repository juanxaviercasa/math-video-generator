# Spanish mathematics pronunciation — production quality gate

## Verified regression in pilot 01

The previous `synchronization.service.ts` mapped each digit separately:
`12` became `uno dos` and `x^2` became the unnatural
`equis elevado a la potencia dos`. A TTS vendor cannot correct a speech
script that already contains the wrong words. The Spanish letters **b** and
**v** are homophones: changing the voice alone will not make them audibly
distinct. Say **be labial** when a mathematical coefficient must be named.

## Current implementation

`spanish-math-speech.service.ts` is the provider-independent spoken
canonicalizer. It expands multi-digit whole numbers to real cardinal words,
preserves decimal digits, names negative coefficients with `menos`, renders
`x^2` as `equis al cuadrado`, and disambiguates coefficient `b`.
Never apply this transform to visual LaTeX, only narration and microcues.

- `synchronization.service.ts` oralizes arbitrary equations.
- `pedagogy.service.ts` normalizes spoken storyboards and cue strings before
  their timings and phrase anchors are calculated.
- `tts.service.ts` enforces the same normalization for direct audio calls.
- `backend/src/services/spanish-math-speech.service.test.ts` checks all eight
  pilot equations, including `x^2 - 7x + 12 = 0`.

## Actual neural voice audit (required before production)

Run these commands from the repo root on a machine with TTS access:

```bash
npm test
VOICE_SMOKE_VOICES=es-PE-CamilaNeural,es-MX-DaliaNeural,es-CO-SalomeNeural npm run smoke:voice --workspace backend
```

For every voice, `smoke:voice` generates the following separate real clips:
`quadratic-twelve`, `labial-b`, and `fractions`. It saves the exact
script sent to TTS, word boundaries, audio validity checks and paths in
`voice-pronunciation-audit.json`. Audition **every** clip, preferably with
a native Spanish-speaking reviewer; WordBoundary only shows the provider's
text offsets, NOT whether the produced waveform sounded right.

Do not dispatch the next eight-video batch while any teacher voice says
`uno dos` in place of `doce` or skips/duplicates mathematical content.

## Alternate provider A/B evaluation

If the corrected script still sounds wrong, run the same exact samples
without changing the core Manim compositor:

1. **Google Cloud TTS:** supports SSML `say-as=cardinal`, custom `sub`,
   and `<mark>` timepoints (`SSML_MARK`). Evaluate actual Spanish voices,
   cost, regional timbre and whether semantic marks match audio.
2. **ElevenLabs:** supports audio-with-timestamps and forced alignment.
   Evaluate actual Spanish pronunciation and voice continuity; do not treat
   any vendor's own alignment metadata as independent acoustic certification.
3. **Current Edge TTS:** keep available as a controlled fallback during A/B.

All vendor credentials must remain in the existing secret-management system,
never in commits or chat. A provider is promoted only after direct listening,
semantic timing checks, and successful rerender of the same quadratic sample.
Recalculate durations from newly synthesized clips; never reuse Edge timing
for a different voice.

Do not claim that the new speech is acoustically verified based only on CI.
