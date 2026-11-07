export type SynchronizedSceneKind = 'intro' | 'step' | 'calculation' | 'formula' | 'graph' | 'conclusion';

export interface SynchronizedScene {
  id: string;
  kind: SynchronizedSceneKind;
  visualText: string;
  narrationText: string;
  estimatedDuration: number;
  duration?: number;
}

const normalize = (value: string): string => value.replace(/\s+/g, ' ').trim();

const numberWords: Record<string, string> = {
  '0': 'cero', '1': 'uno', '2': 'dos', '3': 'tres', '4': 'cuatro',
  '5': 'cinco', '6': 'seis', '7': 'siete', '8': 'ocho', '9': 'nueve',
};

const oralizeNumber = (value: string): string => value.split('').map((digit) => numberWords[digit] || digit).join(' ');
const variableWords: Record<string, string> = { a: 'a', b: 'be', c: 'ce', x: 'equis', y: 'ye', z: 'zeta' };
const oralizeVariables = (value: string): string => value.split('').map((letter) => variableWords[letter.toLowerCase()] || letter).join(' ');

const oralizeMath = (value: string): string => {
  let text = normalize(value)
    .replace(/²/g, ' al cuadrado')
    .replace(/³/g, ' al cubo')
    .replace(/₁/g, ' uno')
    .replace(/₂/g, ' dos')
    .replace(/₃/g, ' tres')
    .replace(/√\s*Δ/g, 'la raíz cuadrada del discriminante')
    .replace(/√\s*([A-Za-z0-9]+)/g, 'la raíz cuadrada de $1')
    .replace(/±/g, ' más o menos ')
    .replace(/\+/g, ' más ')
    .replace(/-/g, ' menos ')
    .replace(/≤/g, ' menor o igual que ')
    .replace(/≥/g, ' mayor o igual que ')
    .replace(/≠/g, ' diferente de ')
    .replace(/Δ/g, 'el discriminante')
    .replace(/\^/g, ' elevado a la potencia ')
    .replace(/elevado a la potencia 2/gi, 'elevado a la potencia dos')
    .replace(/elevado a la potencia 3/gi, 'elevado a la potencia tres')
    .replace(/\s*\/\s*/g, ' dividido entre ')
    .replace(/=/g, ' igual a ')
    .replace(/\s*,\s*/g, ', ')
    .replace(/\b([abcxyz])\s*([0-9]+)\b/gi, '$1 $2')
    .replace(/\s+/g, ' ')
    .trim();

  text = text
    .replace(/\b(\d+)([abcxyz]{1,3})\b/gi, (_, number: string, variables: string) => `${oralizeNumber(number)} ${oralizeVariables(variables)}`)
    .replace(/\b\d+\b/g, (number) => oralizeNumber(number))
    .replace(/\b([abcxyz])\b/gi, (variable) => variableWords[variable.toLowerCase()] || variable)
    .replace(/\bminus\b/gi, 'menos')
    .replace(/\bplus\b/gi, 'más')
    .replace(/\bformula\b/gi, 'fórmula');

  return text || 'este paso matemático';
};

const estimateDuration = (text: string): number => {
  const words = normalize(text).split(' ').filter(Boolean).length;
  return Math.max(3, Math.min(10, Math.ceil(words / 2.35) + 1));
};

export const buildSynchronizedScenes = (problem: string, steps: string[]): SynchronizedScene[] => {
  const cleanProblem = normalize(problem) || 'este problema matemático';
  const cleanSteps = steps.map(normalize).filter(Boolean).slice(0, 5);
  const scenes: SynchronizedScene[] = [
    {
      id: 'intro',
      kind: 'intro',
      visualText: cleanProblem,
      narrationText: `Hoy resolveremos ${oralizeMath(cleanProblem)}. Observaremos cada transformación y comprobaremos las soluciones.`,
      estimatedDuration: estimateDuration(cleanProblem) + 1,
    },
  ];

  cleanSteps.forEach((step, index) => {
    const isFormula = /(fórmula|formula).*x.*=/i.test(step) || /√|±|\//.test(step);
    const prefix = index === 0 ? 'Primero' : index === cleanSteps.length - 1 ? 'Finalmente' : 'Después';
    const narration = `${prefix}, ${oralizeMath(step)}.`;
    scenes.push({
      id: `step-${index + 1}`,
      kind: isFormula ? 'formula' : 'step',
      visualText: step,
      narrationText: narration,
      estimatedDuration: estimateDuration(narration),
    });
  });

  scenes.push({
    id: 'conclusion',
    kind: 'conclusion',
    visualText: 'Procedimiento terminado',
    narrationText: 'Con esto terminamos. Revisa cada transformación y comprueba el resultado con los datos del problema.',
    estimatedDuration: 6,
  });

  return scenes;
};

export const synchronization = {
  buildSynchronizedScenes,
  oralizeMath,
  estimateDuration,
};
