import type { MathValidation } from './math-validation.service.js';
import type { MathematicalSolutionStructure, MathNode, SolutionStep } from './presentation.types.js';

const numberNode = (value: number): MathNode => ({ kind: 'number', value, display: String(value) });
const variableNode = (name: string): MathNode => ({ kind: 'variable', name });
const textNode = (value: string): MathNode => ({ kind: 'text', value });
const sumNode = (...terms: MathNode[]): MathNode => ({ kind: 'sum', terms });
const productNode = (...factors: MathNode[]): MathNode => ({ kind: 'product', factors });
const powerNode = (base: MathNode, exponent: number): MathNode => ({ kind: 'power', base, exponent: numberNode(exponent) });
const equationNode = (left: MathNode, right: MathNode): MathNode => ({ kind: 'equation', left, right });

const parseQuadraticCoefficients = (normalizedInput: string): { a: number; b: number; c: number } | null => {
  const match = normalizedInput.match(/^([+-]?\s*\d*\.?\d*)\s*x\s*\^\s*2\s*([+-]\s*\d*\.?\d*)\s*x\s*([+-]\s*\d*\.?\d*)\s*=\s*0$/i);
  if (!match) return null;
  const parse = (value: string | undefined, fallback: number): number => {
    const clean = value?.replace(/\s+/g, '') || '';
    if (!clean || clean === '+') return fallback;
    if (clean === '-') return -fallback;
    return Number(clean);
  };
  return { a: parse(match[1], 1), b: parse(match[2], 0), c: parse(match[3], 0) };
};

const quadraticEquation = (a: number, b: number, c: number): MathNode => equationNode(
  sumNode(
    productNode(numberNode(a), powerNode(variableNode('x'), 2)),
    productNode(numberNode(b), variableNode('x')),
    numberNode(c),
  ),
  numberNode(0),
);

export const buildMathematicalSolutionStructure = (
  problem: string,
  validation: MathValidation,
): MathematicalSolutionStructure => {
  const coefficients = validation.kind === 'quadratic' ? parseQuadraticCoefficients(validation.normalizedInput) : null;
  if (!coefficients || !validation.valid) {
    return {
      problemId: `problem-${Buffer.from(problem).toString('hex').slice(0, 16)}`,
      parserVersion: 'quadratic-ast-v1',
      problem: textNode(problem),
      entities: {},
      equations: [],
      steps: [],
      results: [],
      explanations: validation.warnings,
      charts: [],
      conclusion: validation.result,
      supported: false,
      warnings: validation.warnings,
    };
  }

  const { a, b, c } = coefficients;
  const delta = b * b - 4 * a * c;
  const sqrtDelta = Math.sqrt(Math.max(0, delta));
  const denominator = 2 * a;
  const x1 = denominator === 0 ? 0 : (-b + sqrtDelta) / denominator;
  const x2 = denominator === 0 ? 0 : (-b - sqrtDelta) / denominator;
  const discriminant = equationNode(
    textNode('Δ'),
    sumNode(powerNode(numberNode(b), 2), productNode(numberNode(-4), numberNode(a), numberNode(c))),
  );
  const formula = textNode('x = (-b ± √Δ) / (2a)');
  const steps: SolutionStep[] = [
    {
      id: 'identify-coefficients',
      operation: 'identify',
      after: quadraticEquation(a, b, c),
      substitutions: [
        { symbol: 'a', value: numberNode(a) },
        { symbol: 'b', value: numberNode(b) },
        { symbol: 'c', value: numberNode(c) },
      ],
      explanation: 'Identificamos simultáneamente los coeficientes a, b y c.',
    },
    {
      id: 'substitute-discriminant',
      operation: 'substitute',
      before: discriminant,
      after: textNode(`Δ = (${b})² - 4(${a})(${c})`),
      substitutions: [
        { symbol: 'a', value: numberNode(a) },
        { symbol: 'b', value: numberNode(b) },
        { symbol: 'c', value: numberNode(c) },
      ],
      explanation: 'Reemplazamos cada símbolo por su valor numérico.',
    },
    {
      id: 'calculate-discriminant',
      operation: 'multiply',
      before: textNode(`Δ = (${b})² - 4(${a})(${c})`),
      after: textNode(`Δ = ${b * b} - ${4 * a * c} = ${delta}`),
      substitutions: [],
      explanation: 'Elevamos, multiplicamos y restamos en ese orden.',
      evidence: [`discriminant=${delta}`],
    },
    {
      id: 'apply-quadratic-formula',
      operation: 'solve',
      before: formula,
      after: textNode(`x = (-(${b}) ± √${delta}) / (2(${a}))`),
      substitutions: [
        { symbol: 'a', value: numberNode(a) },
        { symbol: 'b', value: numberNode(b) },
        { symbol: 'Δ', value: numberNode(delta) },
      ],
      explanation: 'Aplicamos la fórmula general y sustituimos los valores.',
    },
    {
      id: 'verify-solutions',
      operation: 'verify',
      before: textNode(`x = (${ -b } ± ${sqrtDelta}) / ${denominator}`),
      after: textNode(`x₁ = ${x1}, x₂ = ${x2}`),
      substitutions: [],
      explanation: 'Separamos las dos ramas y comprobamos las raíces en la gráfica.',
      evidence: [`x1=${x1}`, `x2=${x2}`],
    },
  ];

  return {
    problemId: `problem-${Buffer.from(problem).toString('hex').slice(0, 16)}`,
    parserVersion: 'quadratic-ast-v1',
    problem: quadraticEquation(a, b, c),
    entities: { a: numberNode(a), b: numberNode(b), c: numberNode(c), delta: numberNode(delta), x1: numberNode(x1), x2: numberNode(x2) },
    equations: [quadraticEquation(a, b, c), discriminant],
    steps,
    results: [numberNode(x1), numberNode(x2)],
    explanations: validation.steps,
    charts: [{ id: 'quadratic-parabola', type: 'parabola', expression: `(x - ${x1}) * (x - ${x2})`, roots: [x1, x2] }],
    conclusion: validation.result,
    supported: true,
    warnings: validation.warnings,
  };
};
