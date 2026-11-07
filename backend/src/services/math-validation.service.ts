export interface MathValidation {
  supported: boolean;
  valid: boolean;
  kind: 'quadratic' | 'unsupported';
  normalizedInput: string;
  method?: string;
  result?: string;
  steps: string[];
  warnings: string[];
}

const parseCoefficient = (value: string | undefined, fallback: number): number => {
  const normalized = value?.replace(/\s+/g, '') || '';
  if (normalized === '' || normalized === '+') return fallback;
  if (normalized === '-') return -fallback;
  return Number(normalized);
};

const formatNumber = (value: number): string => {
  if (Number.isInteger(value)) return String(value);
  return value.toFixed(4).replace(/0+$/, '').replace(/\.$/, '');
};

export function validateMathProblem(content: string): MathValidation {
  const normalizedInput = content
    .replace(/²/g, '^2')
    .replace(/[−–—]/g, '-')
    .replace(/\s+/g, ' ')
    .trim();

  const quadratic = normalizedInput.match(
    /^([+-]?\s*\d*\.?\d*)\s*x\s*\^\s*2\s*([+-]\s*\d*\.?\d*)\s*x\s*([+-]\s*\d*\.?\d*)\s*=\s*0$/i,
  );

  if (!quadratic) {
    return {
      supported: false,
      valid: false,
      kind: 'unsupported',
      normalizedInput,
      steps: [],
      warnings: ['Por ahora la validación automática cubre ecuaciones cuadráticas en forma ax² + bx + c = 0.'],
    };
  }

  const a = parseCoefficient(quadratic[1], 1);
  const b = parseCoefficient(quadratic[2], 0);
  const c = parseCoefficient(quadratic[3], 0);

  if (!Number.isFinite(a) || !Number.isFinite(b) || !Number.isFinite(c) || a === 0) {
    return {
      supported: true,
      valid: false,
      kind: 'quadratic',
      normalizedInput,
      steps: [],
      warnings: ['El coeficiente cuadrático debe ser un número distinto de cero.'],
    };
  }

  const discriminant = b * b - 4 * a * c;
  const steps = [
    `Identificamos a = ${formatNumber(a)}, b = ${formatNumber(b)} y c = ${formatNumber(c)}.`,
    `Calculamos el discriminante: Δ = b² - 4ac = ${formatNumber(discriminant)}.`,
  ];

  if (discriminant < 0) {
    steps.push('Como Δ < 0, la ecuación no tiene soluciones reales.');
    return {
      supported: true,
      valid: true,
      kind: 'quadratic',
      normalizedInput,
      method: 'Fórmula cuadrática',
      result: 'No hay soluciones reales',
      steps,
      warnings: [],
    };
  }

  const sqrtDiscriminant = Math.sqrt(discriminant);
  const denominator = 2 * a;
  const x1 = (-b + sqrtDiscriminant) / denominator;
  const x2 = (-b - sqrtDiscriminant) / denominator;
  steps.push(`Aplicamos la fórmula: x = (-b ± √Δ) / (2a).`);
  steps.push(`Soluciones verificadas: x₁ = ${formatNumber(x1)} y x₂ = ${formatNumber(x2)}.`);

  return {
    supported: true,
    valid: true,
    kind: 'quadratic',
    normalizedInput,
    method: 'Fórmula cuadrática',
    result: `x₁ = ${formatNumber(x1)}, x₂ = ${formatNumber(x2)}`,
    steps,
    warnings: [],
  };
}
