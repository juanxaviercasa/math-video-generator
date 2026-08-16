import * as fs from 'node:fs';
import * as path from 'node:path';
import { validateMathProblem } from '../src/services/math-validation.service.js';
import { buildPresentationPlan, buildPresentationPlanFromSynchronizedScenes } from '../src/services/presentation-engine.service.js';
import { buildQuadraticStoryboard } from '../src/services/pedagogy.service.js';
import { synchronization, type SynchronizedScene } from '../src/services/synchronization.service.js';
import { getVideoFormatProfile } from '../src/services/video-format.service.js';
import { manim } from '../src/services/manim.service.js';
import { ffmpeg } from '../src/services/ffmpeg.service.js';
import { auditRenderedVideo } from '../src/services/visual-qa.service.js';
import { applyVisualRepairPlan, buildVisualRepairPlan } from '../src/services/visual-repair.service.js';
import type { PedagogicalScene } from '../src/services/pedagogy.service.js';
import type { VideoAspectRatio } from '../src/services/video-format.service.js';

interface CorpusCase {
  id: string;
  category: string;
  problem: string;
  formulas: string[];
  steps: string[];
  layout?: PedagogicalScene['layout'];
  aspectRatio?: VideoAspectRatio;
}

interface AuditRow {
  id: string;
  category: string;
  problem: string;
  mathematicalSupported: boolean;
  mathematicalValid: boolean;
  beforePassed: boolean;
  afterPassed: boolean;
  beforeScore: number;
  afterScore: number;
  beforeIssues: number;
  afterIssues: number;
  repairs: string[];
  renderBefore: string;
  renderAfter: string;
  warnings: string[];
  error?: string;
}

const corpus: CorpusCase[] = [
  { id: 'algebra-linear', category: 'álgebra', problem: '3x + 5 = 20', formulas: ['3x + 5 = 20', '3x = 15', 'x = 5'], steps: ['Aislamos el término con x', 'Restamos 5', 'Dividimos entre 3'], layout: 'equation' },
  { id: 'algebra-factorization', category: 'álgebra', problem: 'x^2 + 5x + 6 = 0', formulas: ['x^2 + 5x + 6 = 0', '(x + 2)(x + 3) = 0', 'x_1 = -2, x_2 = -3'], steps: ['Buscamos factores', 'Aplicamos producto nulo', 'Obtenemos las raíces'], layout: 'equation' },
  { id: 'equation-quadratic', category: 'ecuaciones', problem: 'x^2 - 5x + 6 = 0', formulas: ['x^2 - 5x + 6 = 0', '\\Delta = b^2 - 4ac', 'x = \\frac{-b \\pm \\sqrt{\\Delta}}{2a}'], steps: ['Identificamos coeficientes', 'Calculamos discriminante', 'Aplicamos fórmula general'], layout: 'equation' },
  { id: 'equation-rational', category: 'ecuaciones', problem: '2/(x-1) = 4', formulas: ['\\frac{2}{x-1} = 4', '2 = 4(x-1)', 'x = \\frac{3}{2}'], steps: ['Eliminamos denominador', 'Distribuimos', 'Despejamos x'], layout: 'equation' },
  { id: 'system-two', category: 'sistemas', problem: 'x + y = 7; 2x - y = 5', formulas: ['x + y = 7', '2x - y = 5', '3x = 12 \\Rightarrow x=4, y=3'], steps: ['Escribimos el sistema', 'Sumamos ecuaciones', 'Sustituimos el resultado'], layout: 'split' },
  { id: 'system-three', category: 'sistemas', problem: 'x+y+z=6; 2x-y+z=3; x+2y-z=3', formulas: ['x+y+z=6', '2x-y+z=3', 'x+2y-z=3'], steps: ['Organizamos la matriz', 'Eliminamos variables', 'Verificamos la solución'], layout: 'split' },
  { id: 'function-linear', category: 'funciones', problem: 'f(x) = 2x + 1', formulas: ['f(x)=2x+1', 'f(0)=1', 'f(3)=7'], steps: ['Identificamos pendiente', 'Evaluamos en cero', 'Evaluamos en tres'], layout: 'card' },
  { id: 'function-quadratic', category: 'funciones', problem: 'f(x) = x^2 - 4x + 3', formulas: ['f(x)=x^2-4x+3', 'f(x)=(x-1)(x-3)', 'V=(2,-1)'], steps: ['Factorizamos', 'Encontramos raíces', 'Localizamos el vértice'], layout: 'graph' },
  { id: 'geometry-triangle', category: 'geometría', problem: 'Triángulo base 8 y altura 5', formulas: ['A=\\frac{b\\cdot h}{2}', 'A=\\frac{8\\cdot5}{2}', 'A=20'], steps: ['Elegimos la fórmula', 'Sustituimos datos', 'Calculamos el área'], layout: 'card' },
  { id: 'geometry-circle', category: 'geometría', problem: 'Círculo de radio 3', formulas: ['A=\\pi r^2', 'A=\\pi(3)^2', 'A=9\\pi'], steps: ['Recordamos el área', 'Sustituimos el radio', 'Simplificamos'], layout: 'card' },
  { id: 'trig-sine', category: 'trigonometría', problem: 'sen(30°) = 1/2', formulas: ['\\sin(30^\\circ)=\\frac{opuesto}{hipotenusa}', '\\sin(30^\\circ)=\\frac{1}{2}', 'opuesto=\\frac{hipotenusa}{2}'], steps: ['Definimos seno', 'Usamos el valor notable', 'Interpretamos'], layout: 'equation' },
  { id: 'trig-pythagorean', category: 'trigonometría', problem: 'sin²(x) + cos²(x) = 1', formulas: ['\\sin^2(x)+\\cos^2(x)=1', '\\sin^2(x)=1-\\cos^2(x)', '\\sin(x)=\\sqrt{1-\\cos^2(x)}'], steps: ['Partimos de la identidad', 'Despejamos seno cuadrado', 'Tomamos raíz'], layout: 'equation' },
  { id: 'calculus-derivative', category: 'cálculo', problem: 'Derivada de x^3 + 2x', formulas: ['f(x)=x^3+2x', "f'(x)=3x^2+2", "f'(1)=5"], steps: ['Aplicamos regla de potencia', 'Derivamos cada término', 'Evaluamos en x=1'], layout: 'equation' },
  { id: 'calculus-integral', category: 'cálculo', problem: 'Integral de 2x entre 0 y 3', formulas: ['\\int_0^3 2x\\,dx', '[x^2]_0^3', '9'], steps: ['Integramos', 'Aplicamos límites', 'Calculamos el área'], layout: 'equation' },
  { id: 'calculus-limit', category: 'cálculo', problem: 'límite de (x²-1)/(x-1) cuando x tiende a 1', formulas: ['\\lim_{x\\to1}\\frac{x^2-1}{x-1}', '\\lim_{x\\to1}(x+1)', '2'], steps: ['Factorizamos', 'Cancelamos el factor', 'Evaluamos el límite'], layout: 'equation' },
  { id: 'statistics-mean', category: 'estadística', problem: 'Media de 2, 4, 6, 8', formulas: ['\\bar{x}=\\frac{2+4+6+8}{4}', '\\bar{x}=\\frac{20}{4}', '\\bar{x}=5'], steps: ['Sumamos datos', 'Contamos observaciones', 'Dividimos'], layout: 'card' },
  { id: 'statistics-probability', category: 'estadística', problem: 'Probabilidad de obtener un 6 en un dado', formulas: ['P(6)=\\frac{casos\\ favorables}{casos\\ posibles}', 'P(6)=\\frac{1}{6}', 'P(6)\\approx16.7\\%'], steps: ['Definimos casos', 'Formamos la razón', 'Convertimos a porcentaje'], layout: 'card' },
  { id: 'matrix-product', category: 'matrices', problem: 'Producto de matrices 2x2', formulas: ['A=\\begin{bmatrix}1&2\\3&4\\end{bmatrix}', 'B=\\begin{bmatrix}2&0\\1&2\\end{bmatrix}', 'AB=\\begin{bmatrix}4&4\\10&8\\end{bmatrix}'], steps: ['Alineamos dimensiones', 'Multiplicamos filas por columnas', 'Verificamos entradas'], layout: 'split' },
  { id: 'matrix-determinant', category: 'matrices', problem: 'Determinante de matriz 2x2', formulas: ['A=\\begin{bmatrix}3&1\\2&4\\end{bmatrix}', '\\det(A)=3\\cdot4-1\\cdot2', '\\det(A)=10'], steps: ['Aplicamos fórmula', 'Multiplicamos diagonales', 'Restamos'], layout: 'equation' },
  { id: 'word-rate', category: 'problemas verbales', problem: 'Un tren recorre 180 km en 3 horas', formulas: ['v=\\frac{d}{t}', 'v=\\frac{180}{3}', 'v=60\\,km/h'], steps: ['Elegimos velocidad', 'Sustituimos distancia y tiempo', 'Interpretamos unidades'], layout: 'card' },
  { id: 'word-mixture', category: 'problemas verbales', problem: 'Mezcla de 2 litros al 20% y 3 litros al 40%', formulas: ['0.20(2)+0.40(3)', '0.4+1.2=1.6', '\\frac{1.6}{5}=0.32=32\\%'], steps: ['Calculamos soluto', 'Sumamos cantidades', 'Dividimos por volumen'], layout: 'card' },
];

const makeScenes = (item: CorpusCase): PedagogicalScene[] => {
  const steps = item.steps.length ? item.steps : ['Planteamos el problema', 'Desarrollamos el procedimiento', 'Comprobamos el resultado'];
  return steps.map((step, index) => ({
    id: `${item.id}-scene-${index + 1}`,
    kind: index === 0 ? 'intro' : index === steps.length - 1 ? 'conclusion' : 'step',
    visualText: step,
    visualTextLines: [step],
    visualLatex: [item.formulas[index] || item.formulas[item.formulas.length - 1] || 'x = 0'],
    narrationText: `${step}.`,
    emphasis: step,
    estimatedDuration: 4,
    layout: item.layout || 'equation',
  }));
};

const renderCase = async (item: CorpusCase, root: string): Promise<AuditRow> => {
  const caseRoot = path.join(root, item.id);
  fs.mkdirSync(caseRoot, { recursive: true });
  try {
    const validation = validateMathProblem(item.problem);
    const pedagogicalScenes = validation.supported && validation.kind === 'quadratic' && validation.valid
      ? buildQuadraticStoryboard(item.problem, validation, 'warm_teacher')
      : [];
    const synchronizedScenes: SynchronizedScene[] = pedagogicalScenes.length
      ? pedagogicalScenes
      : synchronization.buildSynchronizedScenes(item.problem, item.steps);
    const aspectRatio = item.aspectRatio || '16:9';
    const profile = getVideoFormatProfile(aspectRatio, 'low');
    let plan = pedagogicalScenes.length
      ? buildPresentationPlan({ problem: item.problem, validation, pedagogicalScenes, aspectRatio, quality: 'low', density: 'comfortable' })
      : buildPresentationPlanFromSynchronizedScenes({ problem: item.problem, validation, synchronizedScenes, aspectRatio, quality: 'low', density: 'comfortable' });
    const render = async (iteration: number) => {
      const out = path.join(caseRoot, `iteration-${iteration}`);
      fs.mkdirSync(out, { recursive: true });
      const raw = await manim.renderVideo({ title: `${item.id} auditoria`, content: item.problem, steps: item.steps, pedagogicalScenes, synchronizedScenes, outputDir: out, formatProfile: profile, layoutDensity: 'comfortable', narrationStyle: 'warm_teacher', debug: false, debugIteration: iteration, presentationPlan: plan });
      const processed = await ffmpeg.processVideo({ inputPath: raw, outputPath: path.join(out, `${item.id}-final.mp4`), width: profile.width, height: profile.height, bitrate: '2500k', fps: 30 });
      const qa = await auditRenderedVideo(processed, plan, out, { debug: false, maxRepairIterations: 1 });
      return { processed, qa };
    };
    const before = await render(0);
    let after = before;
    let repairs: string[] = [];
    if (!before.qa.passed || (before.qa.issues || []).length > 0) {
      const repairPlan = buildVisualRepairPlan(before.qa.issues || [], 1);
      repairs = repairPlan.actions.map((action) => `${action.type}:${action.sceneId}`);
      if (repairPlan.actions.length) {
        plan = applyVisualRepairPlan(plan, repairPlan);
        after = await render(1);
      }
    }
    return {
      id: item.id,
      category: item.category,
      problem: item.problem,
      mathematicalSupported: validation.supported,
      mathematicalValid: validation.valid,
      beforePassed: before.qa.passed,
      afterPassed: after.qa.passed,
      beforeScore: before.qa.score?.total ?? plan.score.total,
      afterScore: after.qa.score?.total ?? plan.score.total,
      beforeIssues: before.qa.issues?.length || 0,
      afterIssues: after.qa.issues?.length || 0,
      repairs,
      renderBefore: before.processed,
      renderAfter: after.processed,
      warnings: [...(before.qa.warnings || []), ...(after.qa.warnings || [])],
    };
  } catch (error) {
    return { id: item.id, category: item.category, problem: item.problem, mathematicalSupported: false, mathematicalValid: false, beforePassed: false, afterPassed: false, beforeScore: 0, afterScore: 0, beforeIssues: 0, afterIssues: 0, repairs: [], renderBefore: '', renderAfter: '', warnings: [], error: error instanceof Error ? error.message : String(error) };
  }
};

const main = async () => {
  const root = '/tmp/mvg-audit-20';
  fs.mkdirSync(root, { recursive: true });
  const rows: AuditRow[] = [];
  const concurrency = 3;
  for (let index = 0; index < corpus.length; index += concurrency) {
    const batch = corpus.slice(index, index + concurrency);
    const results = await Promise.all(batch.map((item) => renderCase(item, root)));
    rows.push(...results);
    console.log(`completed ${Math.min(index + concurrency, corpus.length)}/${corpus.length}`);
  }
  rows.sort((a, b) => a.id.localeCompare(b.id));
  fs.writeFileSync(path.join(root, 'audit-20-results.json'), JSON.stringify({ generatedAt: new Date().toISOString(), corpus, rows }, null, 2));
  const csv = ['id,category,mathematicalSupported,mathematicalValid,beforePassed,afterPassed,beforeScore,afterScore,beforeIssues,afterIssues,repairs,error', ...rows.map((row) => [row.id, row.category, row.mathematicalSupported, row.mathematicalValid, row.beforePassed, row.afterPassed, row.beforeScore, row.afterScore, row.beforeIssues, row.afterIssues, row.repairs.join('|'), row.error || ''].map((value) => `"${String(value).replace(/"/g, '""')}"`).join(','))].join('\n');
  fs.writeFileSync(path.join(root, 'audit-20-results.csv'), csv);
  console.log(JSON.stringify({ root, total: rows.length, supported: rows.filter((row) => row.mathematicalSupported).length, beforePassed: rows.filter((row) => row.beforePassed).length, afterPassed: rows.filter((row) => row.afterPassed).length, meanBefore: rows.reduce((sum, row) => sum + row.beforeScore, 0) / rows.length, meanAfter: rows.reduce((sum, row) => sum + row.afterScore, 0) / rows.length }, null, 2));
};

main().catch((error) => { console.error(error); process.exitCode = 1; });
