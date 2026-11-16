import type { MathValidation } from './math-validation.service.js';
import { synchronization, type SynchronizedScene } from './synchronization.service.js';
import { prepareSpanishMathNarration } from './spanish-math-speech.service.js';
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
  /** Exact spoken phrases that trigger ordered visual reveals. */
  visualBeatPhrases?: string[];
  /** Seconds from the start of this scene, derived from Edge TTS SRT. */
  visualBeatOffsets?: number[];
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

const gcd = (x: number, y: number): number => {
  let u = Math.abs(Math.round(x));
  let v = Math.abs(Math.round(y));
  while (v) {
    const t = v;
    v = u % v;
    u = t;
  }
  return u || 1;
};

export const buildQuadraticStoryboard = (
  problem: string,
  validation: MathValidation,
  narrationStyle: 'warm_teacher' | 'neutral_teacher' = 'warm_teacher',
): PedagogicalScene[] => {
  if (!validation.supported || validation.kind !== 'quadratic' || !validation.valid) return [];

  let rawA: string | undefined;
  let rawB: string | undefined;
  let rawC: string | undefined;

  const complete = validation.normalizedInput.match(
    /^([+-]?\s*\d*\.?\d*)\s*x\s*\^\s*2\s*([+-]\s*\d*\.?\d*)\s*x\s*([+-]\s*\d*\.?\d*)\s*=\s*0$/i,
  );
  if (complete) {
    rawA = complete[1];
    rawB = complete[2];
    rawC = complete[3];
  } else {
    const pure = validation.normalizedInput.match(
      /^([+-]?\s*\d*\.?\d*)\s*x\s*\^\s*2\s*([+-]\s*\d*\.?\d*)\s*=\s*0$/i,
    );
    if (pure) {
      rawA = pure[1];
      rawB = '0';
      rawC = pure[2];
    } else {
      const mixed = validation.normalizedInput.match(
        /^([+-]?\s*\d*\.?\d*)\s*x\s*\^\s*2\s*([+-]\s*\d*\.?\d*)\s*x\s*=\s*0$/i,
      );
      if (mixed) {
        rawA = mixed[1];
        rawB = mixed[2];
        rawC = '0';
      }
    }
  }

  if (rawA === undefined) return [];

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
  const a = parse(rawA, 1);
  const b = parse(rawB, 0);
  const c = parse(rawC, 0);

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
    stepOverride?: PedagogicalStep,
    contractOverride?: PedagogicalContract,
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
    pedagogicalStep: stepOverride ?? 'context',
    pedagogicalContract: contractOverride,
    narrationText,
    emphasis,
    estimatedDuration,
    layout,
  });

  const rootRelation = (value: number): string => Math.abs(value - Number(formatRoot(value))) <= 1e-10 ? '=' : '\\approx';

  const buildCheckLatex = (rootVal: number): string => {
    const rootStr = formatRoot(rootVal);
    if (rootRelation(rootVal) !== '=') {
      const shown = Number(rootStr);
      const shownResidual = Number((a * shown * shown + b * shown + c).toPrecision(6));
      return `P(${rootStr}) \\approx ${formatValue(shownResidual)}`;
    }
    const aTerm = a === 1 ? `(${rootStr})^2` : a === -1 ? `-(${rootStr})^2` : `${formatValue(a)}(${rootStr})^2`;
    if (b === 0) {
      const cSign = c < 0 ? '-' : '+';
      const cTerm = `${cSign} ${formatValue(Math.abs(c))}`;
      const t1 = a * rootVal * rootVal;
      const t3Sign = c < 0 ? '-' : '+';
      return `${aTerm} ${cTerm} = ${formatValue(t1)} ${t3Sign} ${formatValue(Math.abs(c))} = 0`;
    }
    if (c === 0) {
      const bSign = b < 0 ? '-' : '+';
      const bTerm = `${bSign} ${formatValue(Math.abs(b))}(${rootStr})`;
      const t1 = a * rootVal * rootVal;
      const t2 = b * rootVal;
      const t2Sign = t2 < 0 ? '-' : '+';
      return `${aTerm} ${bTerm} = ${formatValue(t1)} ${t2Sign} ${formatValue(Math.abs(t2))} = 0`;
    }
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

  const withSpokenBeats = (scene: PedagogicalScene): PedagogicalScene => {
    let phrases: string[] = [];
    if (b !== 0 && c !== 0) {
      if (scene.id === 'hook' && delta >= 0) {
        phrases = ['Primero identificaremos', 'Después sustituiremos', 'Finalmente calcularemos'];
      } else if (scene.id === 'coefficients') {
        phrases = ['a es', 'be labial es', 'ce es'];
      } else if (scene.id === 'discriminant-setup') {
        phrases = ['definición del discriminante', 'reemplazamos'];
      } else if (scene.id === 'formula-symbolic') {
        phrases = ['fórmula general'];
      } else if (scene.id === 'verification' && repeatedRoot && !approximateRoots) {
        phrases = ['Sustituimos equis'];
      } else if (scene.id === 'verification' && !approximateRoots) {
        phrases = ['Para equis igual a', 'Para equis igual a'];
      } else if (scene.id === 'graph') {
        phrases = ['vértice', 'corta el eje horizontal'];
      } else if (scene.id === 'recap' && delta >= 0) {
        phrases = ['Recapitulamos', 'identificamos', 'calculamos', 'aplicamos', 'obtuvimos'];
      }
    } else if (c === 0 && b !== 0) {
      if (scene.id === 'recap') {
        phrases = ['Recapitulamos', 'identificamos', 'factorizamos', 'aplicamos', 'obtuvimos'];
      }
    } else if (b === 0 && c !== 0) {
      if (scene.id === 'recap') {
        phrases = ['Recapitulamos', 'identificamos', 'despejamos', 'extrajimos', 'obtuvimos'];
      }
    }

    const prepared = {
      ...scene,
      narrationText: prepareSpanishMathNarration(scene.narrationText),
      visualStages: scene.visualStages?.map((stage) => ({
        ...stage,
        voiceText: stage.voiceText ? prepareSpanishMathNarration(stage.voiceText) : stage.voiceText,
      })),
    };
    return phrases.length ? { ...prepared, visualBeatPhrases: phrases } : prepared;
  };

  // =========================================================================
  // ARQUETIPO 1: ECUACIÓN INCOMPLETA MIXTA (c === 0, ax² + bx = 0)
  // Método pedagógico estricto: Factor común monomio + Teorema del producto nulo.
  // NUNCA aplicar fórmula general ni discriminante a este caso.
  // =========================================================================
  if (c === 0 && b !== 0) {
    const x2 = -b / a;
    const sortedRoots: [number, number] = [0, x2].sort((p, q) => p - q) as [number, number];
    const g = gcd(a, b);
    const outerA = g;
    const innerA = a / g;
    const innerB = b / g;
    const outerCoeff = outerA === 1 ? '' : outerA === -1 ? '-' : `${formatValue(outerA)}`;
    const innerAText = innerA === 1 ? 'x' : innerA === -1 ? '-x' : `${formatValue(innerA)}x`;
    const innerBText = innerB >= 0 ? `+ ${formatValue(innerB)}` : `- ${formatValue(Math.abs(innerB))}`;
    const factoredEquation = `${outerCoeff}x(${innerAText} ${innerBText}) = 0`;
    const factor1Text = outerCoeff ? `${outerCoeff}x = 0` : 'x = 0';
    const factor1Voice = outerCoeff ? `${numberToSpanish(outerA)} equis` : 'equis';
    const factor2Text = `${innerAText} ${innerBText} = 0`;
    const factor2Voice = `${innerA === 1 ? 'equis' : `${numberToSpanish(innerA)} equis`} ${innerB < 0 ? 'menos' : 'más'} ${numberToSpanish(Math.abs(innerB))}`;
    const vertexX = -b / (2 * a);
    const vertexY = a * vertexX * vertexX + b * vertexX;
    const concavity: 'up' | 'down' = a > 0 ? 'up' : 'down';

    const mixedContract: PedagogicalContract = {
      requiredSteps: ['hook', 'identify', 'compute', 'simplify', 'solve', 'substitute', 'verify', 'interpret'],
      hook: 'Factorizar por término común monomio y aplicar el Teorema del Producto Nulo.',
      successCriterion: 'Las dos raíces x=0 y x=-b/a se comprueban en la ecuación original dando cero.',
    };

    const scenes = [
      make(
        'hook',
        'intro',
        `${lead}Hoy resolveremos la ecuación cuadrática incompleta mixta ${oralProblem}.${calm} Al no tener término independiente, no usamos la fórmula general: el método más rápido y exacto es factorizar por factor común y aplicar el teorema del producto nulo.`,
        [validation.normalizedInput, 'a x^2 + b x = 0 \\quad (c = 0)'],
        'hero',
        'Ecuación Incompleta Mixta',
        7,
        ['Identificar: c = 0', 'Factor común monomio', 'Teorema del producto nulo'],
        [],
        {},
        'hook',
        mixedContract,
      ),
      make(
        'coefficients',
        'step',
        `${lead}Identificamos los coeficientes: a es ${numberToSpanish(a)}, be labial es ${numberToSpanish(b)} y el término independiente ce es cero. Como la constante es nula, cada término contiene a la incógnita equis.`,
        [`a = ${formatValue(a)}`, `b = ${formatValue(b)}`, 'c = 0'],
        'card',
        'Coeficientes: c = 0',
        8,
        ['a · coeficiente cuadrático', 'b · coeficiente lineal', 'c = 0 · término independiente'],
        [],
        {},
        'identify',
        mixedContract,
      ),
      make(
        'factorization',
        'step',
        `${lead}Extraemos el factor común monomio ${factor1Voice}. Al factorizar, transformamos la ecuación en el producto ${factor1Voice} por entre paréntesis ${factor2Voice} igual a cero.`,
        [validation.normalizedInput, factoredEquation],
        'equation',
        'Factor común monomio',
        8,
        ['Ecuación original', 'Factor común'],
        [
          { label: 'Ecuación original', latex: validation.normalizedInput, voiceText: 'Partimos de la ecuación cuadrática incompleta.', role: 'context', semanticStep: 'Ecuación original' },
          { label: 'Factor común monomio', latex: factoredEquation, voiceText: `Extraemos el factor común monomio y obtenemos ${factoredEquation}.`, role: 'operation', semanticStep: 'Factorizar por término común' },
        ],
        {},
        'compute',
        mixedContract,
      ),
      make(
        'zero-product-property',
        'step',
        `${lead}Aplicamos el Teorema del Producto Nulo: si el producto de dos factores da cero, al menos uno de ellos debe ser cero. Esto divide la ecuación en dos caminos lineales independientes.`,
        ['A \\cdot B = 0 \\iff A = 0 \\quad \\lor \\quad B = 0', `${factor1Text} \\quad \\lor \\quad ${factor2Text}`],
        'equation',
        'Teorema del Producto Nulo',
        9,
        ['Propiedad fundamental', 'Separación en factores'],
        [
          { label: 'Teorema del Producto Nulo', latex: 'A \\cdot B = 0 \\iff A = 0 \\lor B = 0', voiceText: 'Si el producto de factores es cero, cada factor puede igualarse a cero.', role: 'context', semanticStep: 'Teorema del producto nulo' },
          { label: 'Dos ecuaciones independientes', latex: `${factor1Text} \\quad \\lor \\quad ${factor2Text}`, voiceText: `Planteamos las dos ramas: ${factor1Voice} es igual a cero, o ${factor2Voice} es igual a cero.`, role: 'operation', semanticStep: 'Separar los dos factores' },
        ],
        {},
        'simplify',
        mixedContract,
      ),
      make(
        'solution-branches',
        'step',
        `${lead}Resolvemos cada ecuación lineal. En el primer camino, ${factor1Voice} igual a cero nos da directamente equis uno igual a cero. En el segundo camino, despejamos y obtenemos equis dos igual a ${numberToSpanish(x2)}.`,
        ['x_1 = 0', `x_2 = ${formatRoot(x2)}`],
        'equation',
        'Dos soluciones',
        9,
        ['Primera raíz: x₁ = 0', `Segunda raíz: x₂ = ${formatRoot(x2)}`],
        [
          { label: 'Dos ecuaciones lineales', latex: `${factor1Text} \\quad \\lor \\quad ${factor2Text}`, voiceText: 'Resolvemos las dos ecuaciones lineales obtenidas.', role: 'context', semanticStep: 'Ecuaciones independientes' },
          { label: 'Primera raíz (x₁)', latex: 'x_1 = 0', voiceText: 'El primer factor nos entrega siempre equis uno igual a cero.', role: 'result', semanticStep: 'Primera solución x1 = 0' },
          { label: 'Segunda raíz (x₂)', latex: `x_2 = ${formatRoot(x2)}`, voiceText: `Despejamos la segunda ecuación y hallamos equis dos igual a ${numberToSpanish(x2)}.`, role: 'result', semanticStep: 'Segunda solución x2' },
        ],
        {},
        'solve',
        mixedContract,
      ),
      make(
        'solution-set',
        'step',
        `${lead}Reunimos las dos soluciones en el conjunto solución formal: C punto S es igual al conjunto formado por ${numberToSpanish(sortedRoots[0])} y ${numberToSpanish(sortedRoots[1])}. Ambas son raíces reales y exactas.`,
        [`C.S. = \\{${formatRoot(sortedRoots[0])},\\; ${formatRoot(sortedRoots[1])}\\}`],
        'card',
        'Conjunto Solución',
        7,
        ['Conjunto Solución', 'Dos raíces reales exactas'],
        [],
        {},
        'substitute',
        mixedContract,
      ),
      make(
        'verification',
        'step',
        `${lead}Comprobamos ambas soluciones en la ecuación original. Al sustituir equis por cero obtenemos cero igual a cero. Al sustituir equis por ${numberToSpanish(x2)} obtenemos también exactamente cero. Ambas raíces satisfacen la ecuación.`,
        [buildCheckLatex(sortedRoots[0]), buildCheckLatex(sortedRoots[1])],
        'split',
        'Comprobación algebraica',
        9,
        [`Para x = ${formatRoot(sortedRoots[0])}: 0 = 0`, `Para x = ${formatRoot(sortedRoots[1])}: 0 = 0`],
        [],
        {},
        'verify',
        mixedContract,
      ),
      make(
        'graph',
        'graph',
        `${lead}Finalmente, la gráfica confirma la solución. La parábola tiene vértice en ${numberToSpanish(Number(formatRoot(vertexX)))} con ${numberToSpanish(Number(formatRoot(vertexY)))}, abre hacia ${concavity === 'up' ? 'arriba' : 'abajo'}, y corta el eje horizontal en el origen cero y en equis igual a ${numberToSpanish(x2)}.`,
        [`y = (${formatValue(a)})x^2 ${b < 0 ? '-' : '+'} (${formatValue(Math.abs(b))})x`, `raíces: ${formatRoot(sortedRoots[0])} y ${formatRoot(sortedRoots[1])}`],
        'graph',
        'Comprobación gráfica',
        10,
        [],
        [],
        { graphSpec: { a, b, c: 0, roots: sortedRoots, vertex: [vertexX, vertexY], axisOfSymmetry: vertexX, concavity } },
        'verify',
        mixedContract,
      ),
      make(
        'recap',
        'conclusion',
        `${warm ? 'Excelente trabajo. ' : ''}Recapitulamos el procedimiento para ecuaciones incompletas mixtas: identificamos ce igual a cero; factorizamos por término común; aplicamos el teorema del producto nulo; obtuvimos las soluciones cero y ${numberToSpanish(x2)}; y comprobamos que ambas satisfacen la igualdad.`,
        [
          validation.normalizedInput,
          'c = 0 \\implies \\text{Incompleta mixta}',
          factoredEquation,
          'A \\cdot B = 0 \\iff A = 0 \\lor B = 0',
          `C.S. = \\{${formatRoot(sortedRoots[0])},\\; ${formatRoot(sortedRoots[1])}\\}`,
          `P(0)=0,\\; P(${formatRoot(x2)})=0`,
        ],
        'recap',
        'Solución comprobada',
        8,
        ['Ecuación original', 'Tipo de ecuación', 'Factor común', 'Producto nulo', 'Conjunto solución', 'Comprobado'],
        [],
        {},
        'interpret',
        mixedContract,
      ),
    ];
    return scenes.map(withSpokenBeats);
  }

  // =========================================================================
  // ARQUETIPO 2: ECUACIÓN INCOMPLETA PURA (b === 0, ax² + c = 0)
  // Método pedagógico estricto: Despeje directo de x² y extracción de raíz ±√.
  // NUNCA aplicar fórmula general ni discriminante a este caso.
  // =========================================================================
  if (b === 0 && c !== 0) {
    const val = -c / a;
    const concavity: 'up' | 'down' = a > 0 ? 'up' : 'down';

    if (val > 0) {
      const rootAbs = Math.sqrt(val);
      const isExact = Math.abs(rootAbs - Math.round(rootAbs)) <= 1e-9;
      const rootStr = isExact ? String(Math.round(rootAbs)) : formatRoot(rootAbs);
      const radicalStr = isExact ? rootStr : `\\sqrt{${formatValue(val)}}`;
      const sortedRoots: [number, number] = [-rootAbs, rootAbs];

      const pureContract: PedagogicalContract = {
        requiredSteps: ['hook', 'identify', 'compute', 'simplify', 'solve', 'substitute', 'verify', 'interpret'],
        hook: 'Despejar x² directamente y extraer la raíz cuadrada con doble signo ±.',
        successCriterion: 'Las dos raíces simétricas se comprueban en la ecuación original dando cero.',
      };

      const scenes = [
        make(
          'hook',
          'intro',
          `${lead}Hoy resolveremos la ecuación cuadrática incompleta pura ${oralProblem}.${calm} Al no tener término lineal (be igual a cero), no es necesario usar la fórmula general: el método más directo y elegante es aislar la incógnita al cuadrado y extraer raíz cuadrada con doble signo.`,
          [validation.normalizedInput, 'a x^2 + c = 0 \\quad (b = 0)'],
          'hero',
          'Ecuación Incompleta Pura',
          7,
          ['Identificar: b = 0', 'Despeje directo de x²', 'Raíz con doble signo ±'],
          [],
          {},
          'hook',
          pureContract,
        ),
        make(
          'coefficients',
          'step',
          `${lead}Identificamos los coeficientes: a es ${numberToSpanish(a)}, be labial es cero y el término independiente ce es ${numberToSpanish(c)}. Como no hay término en equis, podemos despejar equis al cuadrado directamente.`,
          [`a = ${formatValue(a)}`, 'b = 0', `c = ${formatValue(c)}`],
          'card',
          'Coeficientes: b = 0',
          8,
          ['a · coeficiente cuadrático', 'b = 0 · término lineal ausente', 'c · término independiente'],
          [],
          {},
          'identify',
          pureContract,
        ),
        make(
          'transposition',
          'step',
          `${lead}Transponemos la constante al segundo miembro sumando su opuesto. Obtenemos ${a === 1 ? '' : `${numberToSpanish(a)} `}equis al cuadrado igual a ${numberToSpanish(-c)}${a !== 1 ? `, y al dividir entre ${numberToSpanish(a)}, equis al cuadrado es igual a ${numberToSpanish(val)}` : ''}.`,
          [validation.normalizedInput, `${a === 1 ? 'x^2' : `${formatValue(a)}x^2`} = ${formatValue(-c)}`, ...(a !== 1 ? [`x^2 = ${formatValue(val)}`] : [])],
          'equation',
          'Despeje de x²',
          8,
          ['Ecuación original', 'Transposición', ...(a !== 1 ? ['División'] : [])],
          [
            { label: 'Ecuación original', latex: validation.normalizedInput, voiceText: 'Partimos de la ecuación incompleta pura.', role: 'context' as PedagogicalRole, semanticStep: 'Ecuación original' },
            { label: 'Transposición de la constante', latex: `${a === 1 ? 'x^2' : `${formatValue(a)}x^2`} = ${formatValue(-c)}`, voiceText: 'Pasamos el término independiente al segundo miembro.', role: 'operation' as PedagogicalRole, semanticStep: 'Transponer constante' },
            ...(a !== 1 ? [{ label: 'Aislamiento de x²', latex: `x^2 = ${formatValue(val)}`, voiceText: `Dividimos entre ${numberToSpanish(a)} y aislamos equis al cuadrado.`, role: 'operation' as PedagogicalRole, semanticStep: 'Aislar x²' }] : []),
          ],
          {},
          'compute',
          pureContract,
        ),
        make(
          'square-root-extraction',
          'step',
          `${lead}Extraemos la raíz cuadrada a ambos lados recordando que toda raíz par admite dos signos: positivo y negativo. Por tanto, equis es igual a más o menos ${isExact ? numberToSpanish(Math.round(rootAbs)) : `la raíz de ${numberToSpanish(val)}`}.`,
          [`x^2 = ${formatValue(val)}`, `x = \\pm \\sqrt{${formatValue(val)}}`, ...(isExact ? [`x = \\pm ${rootStr}`] : [])],
          'equation',
          'Extracción de raíz cuadrada',
          9,
          ['x² despejada', 'Raíz cuadrada ±', ...(isExact ? ['Valor exacto'] : [])],
          [
            { label: 'Término cuadrático aislado', latex: `x^2 = ${formatValue(val)}`, voiceText: 'Partimos de equis al cuadrado ya despejada.', role: 'context' as PedagogicalRole, semanticStep: 'Variable aislada' },
            { label: 'Raíz cuadrada con doble signo', latex: `x = \\pm \\sqrt{${formatValue(val)}}`, voiceText: 'Aplicamos la raíz cuadrada colocando el doble signo más o menos.', role: 'operation' as PedagogicalRole, semanticStep: 'Raíz con doble signo' },
            ...(isExact ? [{ label: 'Raíz calculada', latex: `x = \\pm ${rootStr}`, voiceText: `La raíz cuadrada de ${numberToSpanish(val)} es ${numberToSpanish(Math.round(rootAbs))}.`, role: 'result' as PedagogicalRole, semanticStep: 'Calcular raíz' }] : []),
          ],
          {},
          'simplify',
          pureContract,
        ),
        make(
          'solution-branches',
          'step',
          `${lead}El doble signo genera dos raíces reales simétricas respecto al origen: la raíz positiva equis uno igual a ${isExact ? numberToSpanish(Math.round(rootAbs)) : `raíz de ${numberToSpanish(val)}`}, y la raíz negativa equis dos igual a menos ${isExact ? numberToSpanish(Math.round(rootAbs)) : `raíz de ${numberToSpanish(val)}`}.`,
          [`x_1 = ${radicalStr}`, `x_2 = -${radicalStr}`],
          'equation',
          'Dos raíces simétricas',
          9,
          [`Rama positiva: x₁ = ${radicalStr}`, `Rama negativa: x₂ = -${radicalStr}`],
          [
            { label: 'Expresión con doble signo', latex: `x = \\pm ${radicalStr}`, voiceText: 'El doble signo se desdobla en dos soluciones simétricas.', role: 'context', semanticStep: 'Separar signos' },
            { label: 'Raíz positiva (x₁)', latex: `x_1 = ${radicalStr}`, voiceText: `La rama positiva nos da equis uno igual a ${isExact ? numberToSpanish(Math.round(rootAbs)) : `raíz de ${numberToSpanish(val)}`}.`, role: 'result', semanticStep: 'Raíz positiva x1' },
            { label: 'Raíz negativa (x₂)', latex: `x_2 = -${radicalStr}`, voiceText: `La rama negativa nos da equis dos igual a menos ${isExact ? numberToSpanish(Math.round(rootAbs)) : `raíz de ${numberToSpanish(val)}`}.`, role: 'result', semanticStep: 'Raíz negativa x2' },
          ],
          {},
          'solve',
          pureContract,
        ),
        make(
          'solution-set',
          'step',
          `${lead}Escribimos el conjunto solución formal: C punto S es igual al conjunto formado por menos ${isExact ? numberToSpanish(Math.round(rootAbs)) : `raíz de ${numberToSpanish(val)}`} y más ${isExact ? numberToSpanish(Math.round(rootAbs)) : `raíz de ${numberToSpanish(val)}`}.`,
          [`C.S. = \\{-${radicalStr},\\; ${radicalStr}\\}`],
          'card',
          'Conjunto Solución',
          7,
          ['Conjunto Solución', 'Dos raíces reales simétricas'],
          [],
          {},
          'substitute',
          pureContract,
        ),
        make(
          'verification',
          'step',
          `${lead}Comprobamos ambas soluciones elevándolas al cuadrado en la ecuación original. Al elevar al cuadrado tanto el valor positivo como el negativo, el resultado cancela exactamente el término independiente dando cero.`,
          [buildCheckLatex(rootAbs), buildCheckLatex(-rootAbs)],
          'split',
          'Comprobación algebraica',
          9,
          [`Para x₁ = ${radicalStr}: 0 = 0`, `Para x₂ = -${radicalStr}: 0 = 0`],
          [],
          {},
          'verify',
          pureContract,
        ),
        make(
          'graph',
          'graph',
          `${lead}Finalmente, la gráfica confirma la simetría de la solución. La parábola tiene vértice en el punto cero con ${numberToSpanish(c)}, abre hacia ${concavity === 'up' ? 'arriba' : 'abajo'}, y corta el eje horizontal en menos ${numberToSpanish(Math.round(rootAbs))} y en más ${numberToSpanish(Math.round(rootAbs))}.`,
          [`y = (${formatValue(a)})x^2 ${c < 0 ? '-' : '+'} (${formatValue(Math.abs(c))})`, `raíces: -${radicalStr} y ${radicalStr}`],
          'graph',
          'Comprobación gráfica',
          10,
          [],
          [],
          { graphSpec: { a, b: 0, c, roots: sortedRoots, vertex: [0, c], axisOfSymmetry: 0, concavity } },
          'verify',
          pureContract,
        ),
        make(
          'recap',
          'conclusion',
          `${warm ? 'Excelente trabajo. ' : ''}Recapitulamos el método de ecuaciones incompletas puras: identificamos be igual a cero; despejamos equis al cuadrado; extrajimos raíz cuadrada con signo más o menos; obtuvimos las dos raíces simétricas; y comprobamos que satisfacen la igualdad.`,
          [
            validation.normalizedInput,
            'b = 0 \\implies \\text{Incompleta pura}',
            `x^2 = ${formatValue(val)}`,
            `x = \\pm ${radicalStr}`,
            `C.S. = \\{-${radicalStr},\\; ${radicalStr}\\}`,
            `P(${radicalStr})=0,\\; P(-${radicalStr})=0`,
          ],
          'recap',
          'Solución comprobada',
          8,
          ['Ecuación original', 'Tipo de ecuación', 'Despeje de x²', 'Raíz con doble signo', 'Conjunto solución', 'Comprobado'],
          [],
          {},
          'interpret',
          pureContract,
        ),
      ];
      return scenes.map(withSpokenBeats);
    } else {
      // Incompleta pura sin raíces reales (val < 0, ej. x² + 16 = 0)
      const noRealPureContract: PedagogicalContract = {
        requiredSteps: ['hook', 'identify', 'compute', 'interpret'],
        hook: 'Despejar x² y comprobar que no existen soluciones reales.',
        successCriterion: 'Concluir que un cuadrado real no puede ser negativo.',
      };
      const scenes = [
        make('hook', 'intro',
          `${lead}Analizaremos ${oralProblem} y determinaremos si tiene soluciones reales.`,
          [validation.normalizedInput], 'hero', 'Analicemos la ecuación', 5, [], [], {}, 'hook', noRealPureContract),
        make('coefficients', 'step',
          `Identificamos los coeficientes: a es ${numberToSpanish(a)}, be es cero y ce es ${numberToSpanish(c)}.`,
          [`a = ${formatValue(a)}`, 'b = 0', `c = ${formatValue(c)}`],
          'card', 'Coeficientes', 6, [], [], {}, 'identify', noRealPureContract),
        make('transposition', 'calculation',
          `Despejamos: equis al cuadrado es igual a menos ${numberToSpanish(Math.abs(val))}. Ningún número real elevado al cuadrado da negativo.`,
          [validation.normalizedInput, `x^2 = ${formatValue(val)} < 0`],
          'equation', 'Sin solución real', 8, [], [], {}, 'compute', noRealPureContract),
        make('recap', 'conclusion',
          'Como equis al cuadrado es negativo, esta ecuación no tiene soluciones reales en el conjunto de los números reales.',
          [`x^2 = ${formatValue(val)} < 0`, '\\text{No hay raíces reales}'],
          'recap', 'Conclusión en los números reales', 7, [], [], {}, 'interpret', noRealPureContract),
      ];
      return scenes.map(withSpokenBeats);
    }
  }

  // =========================================================================
  // ARQUETIPO 3: ECUACIÓN COMPLETA (b !== 0, c !== 0)
  // Fórmula general y discriminante Δ = b² - 4ac
  // =========================================================================
  const delta = b * b - 4 * a * c;
  const sqrtDelta = Math.sqrt(Math.max(delta, 0));
  const denominator = 2 * a;
  const discriminantFormula = '\\Delta = b^2 - 4ac';
  const discriminantSubstitution = `\\Delta = (${formatValue(b)})^2 - 4(${formatValue(a)})(${formatValue(c)})`;
  const productTerm = 4 * a * c;
  const discriminantOperation = `\\Delta = ${formatValue(b * b)} ${productTerm < 0 ? '+' : '-'} ${formatValue(Math.abs(productTerm))}`;
  const formulaSubstitution = `x = \\frac{-(${formatValue(b)}) \\pm \\sqrt{${formatValue(delta)}}}{2(${formatValue(a)})}`;
  const sqrtExpression = Number(formatValue(sqrtDelta)) ** 2 === delta
    ? formatValue(sqrtDelta)
    : `\\sqrt{${formatValue(delta)}}`;
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
        [validation.normalizedInput], 'hero', 'Analicemos la ecuación', 5, [], [], {}, 'hook', noRealRootsContract),
      make('coefficients', 'step',
        `Identificamos los coeficientes: a es ${numberToSpanish(a)}, b es ${numberToSpanish(b)} y c es ${numberToSpanish(c)}.`,
        [`a = ${formatValue(a)}`, `b = ${formatValue(b)}`, `c = ${formatValue(c)}`],
        'card', 'Coeficientes', 6, [], [], {}, 'identify', noRealRootsContract),
      make('discriminant-calculate', 'calculation',
        `Calculamos el discriminante: ${numberToSpanish(b * b)} menos cuatro por ${numberToSpanish(a)} por ${numberToSpanish(c)}. El resultado es negativo: ${numberToSpanish(delta)}.`,
        [discriminantFormula, discriminantSubstitution, `\\Delta = ${formatValue(delta)} < 0`],
        'equation', 'Discriminante negativo', 8, [], [], {}, 'compute', noRealRootsContract),
      make('recap', 'conclusion',
        'Como el discriminante es menor que cero, esta ecuación no tiene soluciones reales. No dibujamos intersecciones inexistentes con el eje horizontal.',
        [`\\Delta = ${formatValue(delta)} < 0`, '\\text{No hay raices reales}'],
        'recap', 'Conclusión en los números reales', 7, [], [], {}, 'interpret', noRealRootsContract),
    ];
    return scenes.map((scene) => withSpokenBeats({ ...scene, pedagogicalContract: noRealRootsContract }));
  }

  return [
    make(
      'hook',
      'intro',
      `${lead}Hoy resolveremos ${oralProblem}.${calm} Primero identificaremos los coeficientes. Después sustituiremos los valores. Finalmente calcularemos y comprobaremos cada resultado.`,
      [`${validation.normalizedInput}`, `a x^2 + b x + c = 0`],
      'hero',
      'Ruta de solución',
      7,
      ['Identificar coeficientes', 'Sustituir valores', 'Calcular y comprobar'],
      [],
      {},
      pedagogicalSteps['hook'],
      pedagogicalContract,
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
      [],
      {},
      pedagogicalSteps['coefficients'],
      pedagogicalContract,
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
      [],
      {},
      pedagogicalSteps['discriminant-setup'],
      pedagogicalContract,
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
      pedagogicalSteps['discriminant-calculate'],
      pedagogicalContract,
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
      {},
      pedagogicalSteps['formula-symbolic'],
      pedagogicalContract,
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
      pedagogicalSteps['formula-substitution'],
      pedagogicalContract,
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
      pedagogicalSteps['formula-simplify'],
      pedagogicalContract,
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
      pedagogicalSteps['solution-branches'],
      pedagogicalContract,
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
      repeatedRoot
        ? (approximateRoots
          ? [`Para x ≈ ${formatRoot(x1)}: P(x) ≈ 0`]
          : [`Comprobación con x = ${formatRoot(x1)}: 0 = 0`])
        : approximateRoots
          ? [`Para x_1 ≈ ${formatRoot(x1)}: P(x) ≈ 0`, `Para x_2 ≈ ${formatRoot(x2)}: P(x) ≈ 0`]
          : [`Para x_1 = ${formatRoot(x1)}: 0 = 0`, `Para x_2 = ${formatRoot(x2)}: 0 = 0`],
      [],
      {},
      pedagogicalSteps['verification'],
      pedagogicalContract,
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
      pedagogicalSteps['graph'],
      pedagogicalContract,
    ),
    make(
      'recap',
      'conclusion',
      `${warm ? 'Excelente trabajo. ' : ''}Recapitulamos el procedimiento completo: identificamos los coeficientes a, b y c; calculamos el discriminante; aplicamos la fórmula general; obtuvimos las soluciones ${numberToSpanish(Number(formatRoot(x1)))} y ${numberToSpanish(Number(formatRoot(x2)))}; ${approximateRoots ? 'sus valores decimales son aproximados y el residuo numérico es cercano a cero' : 'y comprobamos que ambas satisfacen la ecuación exactamente'}.`,
      [
        validation.normalizedInput,
        `a = ${formatValue(a)},\\; b = ${formatValue(b)},\\; c = ${formatValue(c)}`,
        `\\Delta = ${formatValue(delta)}`,
        'x = \\frac{-b \\pm \\sqrt{\\Delta}}{2a}',
        `x_1 ${rootRelation(x1)} ${formatRoot(x1)},\\; x_2 ${rootRelation(x2)} ${formatRoot(x2)}`,
        approximateRoots ? `\\text{Comprobación numérica: } P(x) \\approx 0` : repeatedRoot ? `P(${formatRoot(x1)})=0` : `P(${formatRoot(x1)})=0,\\;P(${formatRoot(x2)})=0`,
      ],
      'recap',
      'Solución comprobada',
      8,
      ['Ecuación original', 'Coeficientes', 'Discriminante', 'Fórmula general', 'Raíces', 'Comprobado'],
      [],
      {},
      pedagogicalSteps['recap'],
      pedagogicalContract,
    ),
  ].map(withSpokenBeats);
};
