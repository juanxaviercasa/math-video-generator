/**
 * Pronunciation-first Spanish mathematics text for any speech provider.
 *
 * Never feed an unexpanded coefficient or a digit-by-digit integer to TTS.
 * This is the spoken representation only; MathTex/geometry stays untouched.
 */
const ones = [
  'cero', 'uno', 'dos', 'tres', 'cuatro', 'cinco', 'seis', 'siete',
  'ocho', 'nueve', 'diez', 'once', 'doce', 'trece', 'catorce',
  'quince', 'dieciséis', 'diecisiete', 'dieciocho', 'diecinueve',
];
const twenties = ['veinte', 'veintiuno', 'veintidós', 'veintitrés', 'veinticuatro',
  'veinticinco', 'veintiséis', 'veintisiete', 'veintiocho', 'veintinueve'];
const tens = ['', '', '', 'treinta', 'cuarenta', 'cincuenta', 'sesenta',
  'setenta', 'ochenta', 'noventa'];
const hundreds = ['', 'ciento', 'doscientos', 'trescientos', 'cuatrocientos',
  'quinientos', 'seiscientos', 'setecientos', 'ochocientos', 'novecientos'];

export function cardinalSpanish(n: number): string {
  if (!Number.isSafeInteger(n) || Math.abs(n) >= 1_000_000_000) {
    throw new Error('SPEECH_NUMBER_UNSUPPORTED: número fuera del rango seguro para locución.');
  }
  if (n < 0) return 'menos ' + cardinalSpanish(-n);
  if (n < 20) return ones[n];
  if (n < 30) return twenties[n - 20];
  if (n < 100) {
    const unit = n % 10;
    return tens[Math.floor(n / 10)] + (unit ? ' y ' + ones[unit] : '');
  }
  if (n < 1000) {
    if (n === 100) return 'cien';
    const rest = n % 100;
    return hundreds[Math.floor(n / 100)] + (rest ? ' ' + cardinalSpanish(rest) : '');
  }
  if (n < 1_000_000) {
    const thousands = Math.floor(n / 1000);
    const rest = n % 1000;
    return (thousands === 1 ? 'mil' : cardinalSpanish(thousands) + ' mil')
      + (rest ? ' ' + cardinalSpanish(rest) : '');
  }
  const millions = Math.floor(n / 1_000_000);
  const rest = n % 1_000_000;
  return (millions === 1 ? 'un millón' : cardinalSpanish(millions) + ' millones')
    + (rest ? ' ' + cardinalSpanish(rest) : '');
}

function speakNumber(literal: string): string {
  const [integer, fraction] = literal.replace(',', '.').split('.');
  if (!fraction) return cardinalSpanish(Number(integer));
  // Fractions must retain *every* digit, including leading/trailing zeros.
  return cardinalSpanish(Number(integer)) + ' coma '
    + fraction.split('').map((digit) => ones[Number(digit)]).join(' ');
}

/**
 * Use only for audio text, never for visual formulae. Variable b and v are
 * homophones in Spanish; adding "labial" makes the mathematical referent
 * unambiguous, independently of which voice synthesizer is used.
 *
 * Idempotent: normalizing an already prepared cue must not change its text.
 */
export function prepareSpanishMathNarration(source: string): string {
  let text = (source || '').replace(/\s+/g, ' ').trim();
  if (!text) return '';
  text = text
    .replace(/\b([xX])\s*(?:\^|\*\*)\s*2\b/g, 'equis al cuadrado')
    .replace(/\b([xX])\s*(?:\^|\*\*)\s*3\b/g, 'equis al cubo')
    .replace(/\b([xX])\s*²/g, 'equis al cuadrado')
    .replace(/\b([xX])\s*³/g, 'equis al cubo')
    .replace(/\b([xX])\s*(?:\^|\*\*)\s*(\d+)\b/g,
      (_whole, exponent: string) => 'equis elevado a la potencia ' + cardinalSpanish(Number(exponent)))
    .replace(/\b(\d+)([xX])\b/g, '$1 equis')
    // A normal integer is a cardinal: 12 -> doce, NOT uno dos.
    .replace(/\b\d+(?:[.,]\d+)?\b/g, speakNumber)
    // Avoid treating B as V; all Spanish accents share the same /b/ phoneme.
    .replace(/\b(?:be|b)\b(?!\s+labial\b)/gi, 'be labial')
    .replace(/\b[xX]\b/g, 'equis')
    .replace(/\b[cC]\b/g, 'ce')
    .replace(/\bΔ\b/g, 'discriminante')
    .replace(/\s+/g, ' ')
    .trim();
  return text;
}
