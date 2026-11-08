import type { MathValidation } from './math-validation.service.js';
import { synchronization, type SynchronizedScene } from './synchronization.service.js';
import type { CheckpointKind, FormulaPersistence, PedagogicalContract, PedagogicalRole, PedagogicalStep } from './timeline.types.js';

export interface VisualStage {
  label: string;
  latex: string;
  voiceText?: string;
  detail?: string;
  role?: PedagogicalRole;
  semanticStep?: string;
  formulaAnchorId?: string;
}

export interface PedagogicalFormulaAnchor {
  latex: string;
  label?: string;
  persistence: FormulaPersistence;
  position: 'top' | 'side';
}

export interface PedagogicalCheckpoint {
  kind: CheckpointKind;
  prompt: string;
  pauseSeconds: number;
}

export interface QuadraticGraphSpec {
  a: number;
  b: number;
  c: number;
  roots: [number, number];
  vertex?: [number, number];
  axisOfSymmetry?: number;
  concavity?: 'up' | 'down';
}

export interface PedagogicalScene extends SynchronizedScene {
  visualLatex?: string[];
  visualTextLines?: string[];
  visualStages?: VisualStage[];
  formulaAnchor?: PedagogicalFormulaAnchor;
  checkpoints?: PedagogicalCheckpoint[];
  graphSpec?: QuadraticGraphSpec;
  visualCueDurations?: number[];
  visualCueHighlightOffsets?: number[];
  pedagogicalStep?: PedagogicalStep;
  pedagogicalContract?: PedagogicalContract;
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
  const tens = ['', '', '', 'treinta', 'cuarenta', 'cincuenta', 'sesenta', 'setenta', 'ochenta', 'noventa'];
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

const formatValue = (value: number): string => Number.isFinite(value) ? String(Number(value.toPrecision(12))) : String(value);
const formatRoot = (value: number): string => Number.isInteger(value) ? String(value) : value.toFixed(3).replace(/0+$/, '').replace(/\.$/, '');

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
  const discriminantFormula = '\\Delta = b^2 - 4ac';
  const discriminantSubstitution = `\\Delta = (${formatValue(b)})^2 - 4(${formatValue(a)})(${formatValue(c)})`;
  const productTerm = 4 * a * c;
  const discriminantOperation = `\\Delta = ${formatValue(b * b)} ${productTerm < 0 ? '+' : '-'} ${formatValue(Math.abs(productTerm))}`;
  const formulaSubstitution = `x = \\frac{-(${formatValue(b)}) \\pm \\sqrt{${formatValue(delta)}}}{2(${formatValue(a)})}`;
  // Preserve an exact radical when the square root is not exactly representable.
  const sqrtExpression = Number(formatValue(sqrtDelta)) ** 2 === delta
    ? formatValue(sqrtDelta)
    : `\\sqrt{${formatValue(delta)}}`;
  const rootRelation = (value: number): string => Math.abs(value - Number(formatRoot(value))) <= 1e-10 ? '=' : '\\approx';
  const formulaSimplified = `x = \\frac{${formatValue(-b)} \\pm ${sqrtExpression}}{${formatValue(denominator)}}`;
  const x1 = denominator === 0 ? 0 : (-b + sqrtDelta) / denominator;
  const x2 = denominator === 0 ? 0 : (-b - sqrtDelta) / denominator;
  const vertexX = denominator === 0 ? 0 : -b / (2 * a);
  const vertexY = a * vertexX * vertexX + b * vertexX + c;
  const concavity: 'up' | 'down' = a > 0 ? 'up' : 'down';
  const repeatedRoot = Math.abs(x1 - x2) < 1e-8;
  const pedagogicalContract: PedagogicalContract = {
    requiredSteps: ['hook', 'identify', 'substitute', 'compute', 'simplify', 'solve', 'verify', 'interpret'],
    hook: 'Aprender a identificar coeficientes, sustituir sin perder signos y comprobar las dos raíces.',
    successCriterion: 'Las dos raíces se sustituyen de vuelta en la ecuación original y coinciden con cero.',
  };
  const pedagogicalSteps: Record<string, PedagogicalStep> = {
    hook: 'hook',
    coefficients: 'identify',
    'discriminant-setup': 'substitute',
    'discriminant-calculate': 'compute',
    'formula-symbolic': 'context',
    'formula-substitution': 'substitute',
    'formula-simplify': 'simplify',
    'solution-branches': 'solve',
    verification: 'verify',
    graph: 'verify',
    recap: 'interpret',
  };

  const approximateRoots = rootRelation(x1) !== '=' || rootRelation(x2) !== '=';
  const buildCheckLatex = (rootVal: number): string => {
    const rootStr = formatRoot(rootVal);
    if (rootRelation(rootVal) !== '=') {
      // Evaluate the displayed rounded number, not the hidden full-precision root.
      // This avoids claiming that a three-decimal approximation satisfies P(x)=0 exactly.
      const shown = Number(rootStr);
      const shownResidual = Number((a * shown * shown + b * shown + c).toPrecision(6));
      return `P(${rootStr}) \\approx ${formatValue(shownResidual)}`;
    }
    const aTerm = a === 1 ? `(${rootStr})^2` : a === -1 ? `-(${rootStr})^2` : `${formatValue(a)}(${rootStr})^2`;
    const bSign = b < 0 ? '-' : '+';
    const bTerm = `${bSign} ${formatValue(Math.abs(b))}(${rootStr})`;
    const cSign = c < 0 ? '-' : '+';
    const cTerm = `${cSign} ${formatValue(Math.abs(c))}`;
    const t1 = a * rootVal * rootVal;
    const t2 = b * rootVal;
    const t2Sign = t2 < 0 ? '-' : '+';
    const t3Sign = c < 0 ? '-' : '+';
    return `${aTerm} ${bTerm} ${cTerm} = ${formatValue(t1)} ${t2Sign} ${formatValue(Math.abs(t2))} ${t3Sign} ${formatValue(Math.abs(c))} = 0`;
  };

  const make = (
    id: string,
    kind: SynchronizedScene['kind'],
    narrationText: string,
    visualLatex: string[],
    layout: PedagogicalScene['layout'],
    emphasis: string,
    estimatedDuration: number,
    visualTextLines: string[] = [],
    visualStages: VisualStage[] = [],
    options: Pick<PedagogicalScene, 'formulaAnchor' | 'checkpoints' | 'graphSpec'> = {},
  ): PedagogicalScene => ({
    id,
    kind,
    visualText: visualTextLines.join(' · ') || emphasis,
    visualLatex,
    visualTextLines,
    visualStages,
    formulaAnchor: options.formulaAnchor,
    checkpoints: options.checkpoints,
    graphSpec: options.graphSpec,
    pedagogicalStep: pedagogicalSteps[id] ?? 'context',
    pedagogicalContract,
    narrationText,
    emphasis,
    estimatedDuration,
    layout,
  });

  // A negative discriminant has no real roots. Never build fictitious
  // real-root branches or a graph with x-axis intercepts.
  if (delta < 0) {
    const noRealRootsContract: PedagogicalContract = {
      requiredSteps: ['hook', 'identify', 'compute', 'interpret'],
      hook: 'Identificar los coeficientes y estudiar el signo del discriminante.',
      successCriterion: 'Concluir correctamente que no existen raíces reales.',
    };
    const scenes = [
      make('hook', 'intro',
        `${lead}Analizaremos ${oralProblem} y determinaremos si tiene soluciones reales.`,
        [validation.normalizedInput], 'hero', 'Analicemos la ecuación', 5),
      make('coefficients', 'step',
        `Identificamos los coeficientes: a es ${numberToSpanish(a)}, b es ${numberToSpanish(b)} y c es ${numberToSpanish(c)}.`,
        [`a = ${formatValue(a)}`, `b = ${formatValue(b)}`, `c = ${formatValue(c)}`],
        'card', 'Coeficientes', 6),
      make('discriminant-calculate', 'calculation',
        `Calculamos el discriminante: ${numberToSpanish(b * b)} menos cuatro por ${numberToSpanish(a)} por ${numberToSpanish(c)}. El resultado es negativo: ${numberToSpanish(delta)}.`,
        [discriminantFormula, discriminantSubstitution, `\\Delta = ${formatValue(delta)} < 0`],
        'equation', 'Discriminante negativo', 8),
      make('recap', 'conclusion',
        'Como el discriminante es menor que cero, esta ecuación no tiene soluciones reales. No dibujamos intersecciones inexistentes con el eje horizontal.',
        [`\\Delta = ${formatValue(delta)} < 0`, '\\text{No hay raices reales}'],
        'recap', 'Conclusión en los números reales', 7),
    ];
    return scenes.map((scene) => ({ ...scene, pedagogicalContract: noRealRootsContract }));
  }

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
      `${lead}Fíjate en cada operación: ${numberToSpanish(b)} al cuadrado es ${numberToSpanish(b * b)}; cuatro por ${numberToSpanish(a)} por ${numberToSpanish(c)} da como resultado ${numberToSpanish(4 * a * c)}; y la resta nos da un discriminante de ${numberToSpanish(delta)}.`,
      [`\\Delta = (${formatValue(b)})^2 - 4(${formatValue(a)})(${formatValue(c)})`, `\\Delta = ${formatValue(b * b)} - ${formatValue(4 * a * c)}`, `\\Delta = ${formatValue(delta)}`],
      'equation',
      'Discriminante = ' + formatValue(delta),
      9,
      ['Paso 1 · elevar', 'Paso 2 · multiplicar', 'Paso 3 · restar'],
      [
        { label: 'Fórmula base', latex: discriminantFormula, voiceText: 'El discriminante se calcula con be al cuadrado menos cuatro por a por ce.', role: 'operation', semanticStep: 'Mostrar la fórmula del discriminante' },
        { label: 'Reemplazamos', latex: discriminantSubstitution, voiceText: `Reemplazamos be por ${numberToSpanish(b)}, a por ${numberToSpanish(a)} y ce por ${numberToSpanish(c)}.`, role: 'operation', semanticStep: 'Sustituir b, a y c en la fórmula' },
        { label: 'Operamos', latex: discriminantOperation, voiceText: `Be al cuadrado es ${numberToSpanish(b * b)}; cuatro por a por ce es ${numberToSpanish(4 * a * c)}.`, role: 'operation', semanticStep: 'Calcular las operaciones del discriminante' },
        { label: 'Resultado', latex: `\\Delta = ${formatValue(delta)}`, voiceText: `Al restar, el discriminante vale ${numberToSpanish(delta)}.`, role: 'result', semanticStep: 'Conservar el valor del discriminante' },
      ],
      {
        formulaAnchor: { latex: discriminantFormula, label: 'Referencia', persistence: 'segment', position: 'top' },
      },
    ),
    make(
      'formula-symbolic',
      'formula',
      `${lead}Con el discriminante listo, presentamos la fórmula general en su forma simbólica. Esta es la estructura que vamos a completar juntos.`,
      ['x = \\frac{-b \\pm \\sqrt{\\Delta}}{2a}'],
      'equation',
      'Fórmula general',
      7,
      [],
      [{ label: 'Fórmula general', latex: 'x = \\frac{-b \\pm \\sqrt{\\Delta}}{2a}', detail: 'La estructura que vamos a completar' }],
    ),
    make(
      'formula-substitution',
      'formula',
      `${lead}Ahora reemplazamos cada símbolo. El signo menos delante de B se convierte en menos, entre paréntesis, ${numberToSpanish(b)}; la raíz contiene ${numberToSpanish(delta)} y el denominador es dos por ${numberToSpanish(a)}.`,
      [formulaSubstitution],
      'equation',
      'Reemplazo en la fórmula',
      8,
      [],
      [
        { label: 'Fórmula de partida', latex: 'x = \\frac{-b \\pm \\sqrt{\\Delta}}{2a}', voiceText: 'Recordamos la fórmula general para resolver una ecuación cuadrática.', role: 'context', semanticStep: 'Mantener visible la fórmula de referencia' },
        { label: 'Sustituimos a, b y Δ', latex: formulaSubstitution, voiceText: `En la fórmula sustituimos a por ${numberToSpanish(a)}, be por ${numberToSpanish(b)} y el discriminante por ${numberToSpanish(delta)}.`, role: 'operation', semanticStep: 'Reemplazar cada símbolo por su valor' },
      ],
      {
        formulaAnchor: { latex: 'x = \\frac{-b \\pm \\sqrt{\\Delta}}{2a}', label: 'Fórmula de referencia', persistence: 'segment', position: 'top' },
        checkpoints: [{ kind: 'predict', prompt: 'Pausa: ¿qué valores deben reemplazar a, b y Δ?', pauseSeconds: 1.4 }],
      },
    ),
    make(
      'formula-simplify',
      'calculation',
      `${lead}Ya casi terminamos. Simplificamos la expresión antes de separar las dos soluciones: ${sqrtExpression.startsWith('\\sqrt') ? `conservamos la raíz exacta de ${numberToSpanish(delta)}` : `la raíz de ${numberToSpanish(delta)} es ${numberToSpanish(sqrtDelta)}`} y el denominador vale ${numberToSpanish(denominator)}.`,
      [formulaSimplified],
      'equation',
      'Simplificación',
      8,
      [],
      [
        { label: 'Después de sustituir', latex: formulaSubstitution, voiceText: 'Partimos de la fórmula que acabamos de completar.', role: 'context', semanticStep: 'Conservar la sustitución completa' },
        { label: 'Simplificamos', latex: formulaSimplified, voiceText: `Simplificamos el denominador, dos por a, y la raíz cuadrada del discriminante ${numberToSpanish(delta)}.`, role: 'operation', semanticStep: 'Simplificar raíz y denominador' },
      ],
      {
        formulaAnchor: { latex: formulaSubstitution, label: 'Sustitución de referencia', persistence: 'segment', position: 'top' },
      },
    ),
    make(
      'solution-branches',
      'step',
      `${lead}La expresión más o menos produce dos caminos. En el primero sumamos; en el segundo restamos. Así obtenemos x uno ${rootRelation(x1) === '=' ? 'igual a' : 'aproximadamente'} ${numberToSpanish(Number(formatRoot(x1)))} y x dos ${rootRelation(x2) === '=' ? 'igual a' : 'aproximadamente'} ${numberToSpanish(Number(formatRoot(x2)))}.`,
      [`x_1 = \\frac{${formatValue(-b)} + ${sqrtExpression}}{${formatValue(denominator)}} ${rootRelation(x1)} ${formatRoot(x1)}`, `x_2 = \\frac{${formatValue(-b)} - ${sqrtExpression}}{${formatValue(denominator)}} ${rootRelation(x2)} ${formatRoot(x2)}`],
      'equation',
      'Dos soluciones',
      10,
      ['Camino +', 'Camino −'],
      [
        { label: 'Expresión simplificada', latex: formulaSimplified, voiceText: 'La expresión contiene el símbolo más o menos, que genera dos caminos.', role: 'context', semanticStep: 'Conservar la expresión simplificada' },
        { label: 'Camino +', latex: `x_1 = \\frac{${formatValue(-b)} + ${sqrtExpression}}{${formatValue(denominator)}} ${rootRelation(x1)} ${formatRoot(x1)}`, voiceText: `En el primer camino sumamos y obtenemos equis uno ${rootRelation(x1) === '=' ? 'igual a' : 'aproximadamente'} ${numberToSpanish(Number(formatRoot(x1)))}.`, role: 'result', semanticStep: 'Resolver la primera rama' },
        { label: 'Camino −', latex: `x_2 = \\frac{${formatValue(-b)} - ${sqrtExpression}}{${formatValue(denominator)}} ${rootRelation(x2)} ${formatRoot(x2)}`, voiceText: `En el segundo camino restamos y obtenemos equis dos ${rootRelation(x2) === '=' ? 'igual a' : 'aproximadamente'} ${numberToSpanish(Number(formatRoot(x2)))}.`, role: 'result', semanticStep: 'Resolver la segunda rama' },
      ],
      {
        formulaAnchor: { latex: formulaSimplified, label: 'Expresión de referencia', persistence: 'segment', position: 'top' },
      },
    ),
    make(
      'verification',
      'step',
      repeatedRoot && !approximateRoots
        ? `${lead}Comprobamos la raíz en la ecuación original. Sustituimos equis por ${numberToSpanish(Number(formatRoot(x1)))}: el resultado es exactamente cero, confirmando la solución.`
        : approximateRoots
          ? `${lead}Las raíces exactas se obtienen con la fórmula general. Los decimales que mostramos son aproximados: al sustituirlos en el polinomio se obtiene un residuo pequeño, no necesariamente cero exacto.`
          : `${lead}Comprobamos ambas soluciones en la ecuación original. Para equis igual a ${numberToSpanish(Number(formatRoot(x1)))}, sustituimos y obtenemos cero. Para equis igual a ${numberToSpanish(Number(formatRoot(x2)))}, sustituimos igualmente y confirmamos que da cero. Ambas raíces satisfacen la ecuación.`,
      repeatedRoot
        ? [buildCheckLatex(x1)]
        : [buildCheckLatex(x1), buildCheckLatex(x2)],
      'split',
      'Comprobación algebraica',
      9,
      repeatedRoot && !approximateRoots
        ? [`Comprobación con x = ${formatRoot(x1)}: 0 = 0`]
        : approximateRoots
          ? ['Comprobación numérica: raíces aproximadas, residuo cercano a cero']
          : [`Para x_1 = ${formatRoot(x1)}: 0 = 0`, `Para x_2 = ${formatRoot(x2)}: 0 = 0`],
    ),
    make(
      'graph',
      'graph',
      `${lead}Finalmente, la gráfica confirma la respuesta. La parábola tiene vértice en ${numberToSpanish(Number(formatRoot(vertexX)))} con ${numberToSpanish(Number(formatRoot(vertexY)))}, abre hacia ${concavity === 'up' ? 'arriba' : 'abajo'}, y corta el eje horizontal en ${numberToSpanish(Number(formatRoot(x2)))} y ${numberToSpanish(Number(formatRoot(x1)))}.`,
      [`y = (${formatValue(a)})x^2 + (${formatValue(b)})x + (${formatValue(c)})`, `raíces: ${formatRoot(x2)} y ${formatRoot(x1)}`],
      'graph',
      'Comprobación gráfica',
      10,
      [],
      [],
      { graphSpec: { a, b, c, roots: [x2, x1], vertex: [vertexX, vertexY], axisOfSymmetry: vertexX, concavity } },
    ),
    make(
      'recap',
      'conclusion',
      `${warm ? 'Excelente trabajo. ' : ''}Recapitulamos el procedimiento completo: identificamos los coeficientes a, b y c; calculamos el discriminante; aplicamos la fórmula general; obtuvimos las soluciones ${numberToSpanish(Number(formatRoot(x1)))} y ${numberToSpanish(Number(formatRoot(x2)))}; ${approximateRoots ? 'sus valores decimales son aproximados y el residuo numérico es cercano a cero' : 'y comprobamos que ambas satisfacen la ecuación exactamente'}.`,
      [
        validation.normalizedInput,
        `a = ${formatValue(a)},\\; b = ${formatValue(b)},\\; c = ${formatValue(c)}`,
        `\\Delta = ${formatValue(delta)}`,
        `x_1 ${rootRelation(x1)} ${formatRoot(x1)},\\; x_2 ${rootRelation(x2)} ${formatRoot(x2)}`,
        approximateRoots ? `\\text{Comprobación numérica: } P(x) \\approx 0` : `\\text{Comprobación: } 0 = 0`,
      ],
      'recap',
      'Solución comprobada',
      8,
      ['Ecuación original', 'Coeficientes', 'Discriminante', 'Raíces', 'Comprobado'],
    ),
  ];
};
