import type { MathValidation } from './math-validation.service.js';
import { synchronization, type SynchronizedScene } from './synchronization.service.js';

export interface PedagogicalScene extends SynchronizedScene {
  visualLatex?: string[];
  visualTextLines?: string[];
  emphasis?: string;
  layout: 'hero' | 'card' | 'split' | 'equation' | 'graph' | 'recap';
}

const numberToSpanish = (value: number): string => {
  if (!Number.isFinite(value)) return String(value);
  if (!Number.isInteger(value)) {
    const [integer, decimals] = String(value).split('.');
    return `${numberToSpanish(Number(integer))} punto ${decimals.split('').map((digit) => numberToSpanish(Number(digit))).join(' ')}`;
  }

  const units = ['cero', 'uno', 'dos', 'tres', 'cuatro', 'cinco', 'seis', 'siete', 'ocho', 'nueve', 'diez', 'once', 'doce', 'trece', 'catorce', 'quince', 'dieciséis', 'diecisiete', 'dieciocho', 'diecinueve'];
  const twenties = ['veinte', 'veintiuno', 'veintidós', 'veintitrés', 'veinticuatro', 'veinticinco', 'veintiséis', 'veintisiete', 'veintiocho', 'veintinueve'];
  const tens = ['', '', 'treinta', 'cuarenta', 'cincuenta', 'sesenta', 'setenta', 'ochenta', 'noventa'];
  const hundreds = ['', 'ciento', 'doscientos', 'trescientos', 'cuatrocientos', 'quinientos', 'seiscientos', 'setecientos', 'ochocientos', 'novecientos'];

  if (value < 0) return `menos ${numberToSpanish(-value)}`;
  if (value < 20) return units[value];
  if (value < 30) return twenties[value - 20];
  if (value < 100) {
    const ten = Math.floor(value / 10);
    const unit = value % 10;
    return unit === 0 ? tens[ten] : `${tens[ten]} y ${units[unit]}`;
  }
  if (value < 1000) {
    const hundred = Math.floor(value / 100);
    const remainder = value % 100;
    const prefix = value === 100 ? 'cien' : hundreds[hundred];
    return remainder === 0 ? prefix : `${prefix} ${numberToSpanish(remainder)}`;
  }
  return String(value);
};

const formatValue = (value: number): string => Number.isInteger(value) ? String(value) : value.toFixed(3).replace(/0+$/, '').replace(/\.$/, '');

export const buildQuadraticStoryboard = (
  problem: string,
  validation: MathValidation,
  narrationStyle: 'warm_teacher' | 'neutral_teacher' = 'warm_teacher',
): PedagogicalScene[] => {
  if (!validation.supported || validation.kind !== 'quadratic' || !validation.valid) return [];

  const match = validation.normalizedInput.match(/^([+-]?\s*\d*\.?\d*)\s*x\s*\^\s*2\s*([+-]\s*\d*\.?\d*)\s*x\s*([+-]\s*\d*\.?\d*)\s*=\s*0$/i);
  if (!match) return [];

  const parse = (value: string | undefined, fallback: number): number => {
    const clean = value?.replace(/\s+/g, '') || '';
    if (clean === '' || clean === '+') return fallback;
    if (clean === '-') return -fallback;
    return Number(clean);
  };

  const oralProblem = synchronization.oralizeMath(problem);
  const warm = narrationStyle === 'warm_teacher';
  const lead = warm ? 'Muy bien. ' : '';
  const calm = warm ? ' Vamos con calma y sin saltarnos ningún paso.' : '';
  const a = parse(match[1], 1);
  const b = parse(match[2], 0);
  const c = parse(match[3], 0);
  const delta = b * b - 4 * a * c;
  const sqrtDelta = Math.sqrt(Math.max(delta, 0));
  const denominator = 2 * a;
  const x1 = denominator === 0 ? 0 : (-b + sqrtDelta) / denominator;
  const x2 = denominator === 0 ? 0 : (-b - sqrtDelta) / denominator;

  const make = (
    id: string,
    kind: SynchronizedScene['kind'],
    narrationText: string,
    visualLatex: string[],
    layout: PedagogicalScene['layout'],
    emphasis: string,
    estimatedDuration: number,
    visualTextLines: string[] = [],
  ): PedagogicalScene => ({
    id,
    kind,
    visualText: visualTextLines.join(' · ') || emphasis,
    visualLatex,
    visualTextLines,
    narrationText,
    emphasis,
    estimatedDuration,
    layout,
  });

  return [
    make(
      'hook',
      'intro',
      `${lead}Hoy resolveremos ${oralProblem}.${calm} Primero veremos el mapa completo del procedimiento y después comprobaremos cada resultado.`,
      [`${validation.normalizedInput}`, `a x^2 + b x + c = 0`],
      'hero',
      'Ruta de solución',
      7,
      ['Identificar coeficientes', 'Sustituir valores', 'Calcular y comprobar'],
    ),
    make(
      'coefficients',
      'step',
      `${lead}Antes de calcular, identifiquemos todos los coeficientes. A es ${numberToSpanish(a)}, B es ${numberToSpanish(b)} y C es ${numberToSpanish(c)}. Los tres valores quedan visibles para que no perdamos ninguna información.`,
      [`a = ${formatValue(a)}`, `b = ${formatValue(b)}`, `c = ${formatValue(c)}`],
      'card',
      'a, b y c',
      8,
      ['a · coeficiente de x²', 'b · coeficiente de x', 'c · término independiente'],
    ),
    make(
      'discriminant-setup',
      'step',
      `${lead}Ahora usamos la definición del discriminante. Todavía no simplificamos: primero reemplazamos cada letra por su valor numérico y lo comprobamos juntos.`,
      ['\\Delta = b^2 - 4ac', `\\Delta = (${formatValue(b)})^2 - 4(${formatValue(a)})(${formatValue(c)})`],
      'split',
      'Sustitución del discriminante',
      8,
      ['Fórmula', 'Reemplazo numérico'],
    ),
    make(
      'discriminant-calculate',
      'calculation',
      `${lead}Fíjate en cada operación: ${numberToSpanish(b)} al cuadrado es ${numberToSpanish(b * b)}; cuatro por ${numberToSpanish(a)} por ${numberToSpanish(c)} es ${numberToSpanish(4 * a * c)}; y la resta nos da un discriminante de ${numberToSpanish(delta)}.`,
      [`\\Delta = (${formatValue(b)})^2 - 4(${formatValue(a)})(${formatValue(c)})`, `\\Delta = ${formatValue(b * b)} - ${formatValue(4 * a * c)}`, `\\Delta = ${formatValue(delta)}`],
      'equation',
      'Discriminante = ' + formatValue(delta),
      9,
      ['Paso 1 · elevar', 'Paso 2 · multiplicar', 'Paso 3 · restar'],
    ),
    make(
      'formula-symbolic',
      'formula',
      `${lead}Con el discriminante listo, presentamos la fórmula general en su forma simbólica. Esta es la estructura que vamos a completar juntos.`,
      ['x = \\frac{-b \\pm \\sqrt{\\Delta}}{2a}'],
      'equation',
      'Fórmula general',
      7,
    ),
    make(
      'formula-substitution',
      'formula',
      `${lead}Ahora reemplazamos cada símbolo. El signo menos delante de B se convierte en menos, entre paréntesis, ${numberToSpanish(b)}; la raíz contiene ${numberToSpanish(delta)} y el denominador es dos por ${numberToSpanish(a)}.`,
      [`x = \\frac{-(${formatValue(b)}) \\pm \\sqrt{${formatValue(delta)}}}{2(${formatValue(a)})}`],
      'equation',
      'Reemplazo en la fórmula',
      8,
    ),
    make(
      'formula-simplify',
      'calculation',
      `${lead}Ya casi terminamos. Simplificamos la expresión antes de separar las dos soluciones: la raíz de ${numberToSpanish(delta)} es ${numberToSpanish(sqrtDelta)} y el denominador vale ${numberToSpanish(denominator)}.`,
      [`x = \\frac{${formatValue(-b)} \\pm ${formatValue(sqrtDelta)}}{${formatValue(denominator)}}`],
      'equation',
      'Simplificación',
      8,
    ),
    make(
      'solution-branches',
      'step',
      `${lead}La expresión más o menos produce dos caminos. En el primero sumamos; en el segundo restamos. Así obtenemos x uno igual a ${numberToSpanish(x1)} y x dos igual a ${numberToSpanish(x2)}.`,
      [`x_1 = \\frac{${formatValue(-b)} + ${formatValue(sqrtDelta)}}{${formatValue(denominator)}} = ${formatValue(x1)}`, `x_2 = \\frac{${formatValue(-b)} - ${formatValue(sqrtDelta)}}{${formatValue(denominator)}} = ${formatValue(x2)}`],
      'split',
      'Dos soluciones',
      10,
      ['Camino +', 'Camino −'],
    ),
    make(
      'graph',
      'graph',
      `${lead}Finalmente, la gráfica confirma la respuesta: la parábola corta el eje horizontal en ${numberToSpanish(x2)} y ${numberToSpanish(x1)}.`,
      ['y = ax² + bx + c', `raíces: ${formatValue(x2)} y ${formatValue(x1)}`],
      'graph',
      'Comprobación gráfica',
      10,
    ),
    make(
      'recap',
      'conclusion',
      `${warm ? 'Excelente. ' : ''}Recapitulamos: identificamos a, b y c; sustituimos sus valores; calculamos el discriminante; aplicamos la fórmula y comprobamos las dos raíces en la gráfica.`,
      [`x_1 = ${formatValue(x1)}`, `x_2 = ${formatValue(x2)}`],
      'recap',
      'Solución comprobada',
      8,
      ['Identificar', 'Sustituir', 'Calcular', 'Comprobar'],
    ),
  ];
};
