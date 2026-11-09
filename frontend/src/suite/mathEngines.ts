export type ParsedQuadratic = {
  raw: string
  normalized: string
  a: number
  b: number
  c: number
  discriminant: number
  nature: 'two_real' | 'one_real' | 'complex'
  roots: number[]
  complexRoots?: { re: number; im: number }
  exactRootLabels: [string, string]
  vertex: { x: number; y: number }
  focus: { x: number; y: number }
  directrixY: number
  factoredForm: string
  vertexForm: string
  derivativeLatex: string
  integralLatex: string
  areaBetweenRoots: number
  vietaSum: number
  vietaProduct: number
  spanishPhonetic: string
  mathJsonAst: string
  steps: { rule: string; title: string; formula: string; explanation: string }[]
  newtonIterations: { step: number; x: number; fx: number; fpx: number; nextX: number; error: number }[]
  manimSnippet: string
  lean4Snippet: string
  mermaidSnippet: string
}

function gcd(x: number, y: number): number {
  let a = Math.abs(Math.round(x))
  let b = Math.abs(Math.round(y))
  while (b !== 0) {
    const t = b
    b = a % b
    a = t
  }
  return a || 1
}

function formatNum(n: number): string {
  if (Math.abs(n) < 1e-10) return '0'
  if (Number.isInteger(Number(n.toFixed(6)))) return String(Math.round(n))
  return Number(n.toFixed(4)).toString()
}

function numberToSpanishWords(n: number): string {
  const units: Record<number, string> = {
    0: 'cero', 1: 'uno', 2: 'dos', 3: 'tres', 4: 'cuatro', 5: 'cinco',
    6: 'seis', 7: 'siete', 8: 'ocho', 9: 'nueve', 10: 'diez',
    11: 'once', 12: 'doce', 13: 'trece', 14: 'catorce', 15: 'quince',
    16: 'dieciséis', 18: 'dieciocho', 20: 'veinte', 21: 'veintiuno',
    24: 'veinticuatro', 25: 'veinticinco', 32: 'treinta y dos', 35: 'treinta y cinco',
  }
  const abs = Math.abs(Math.round(n))
  const word = units[abs] ?? String(abs)
  return n < 0 ? `menos ${word}` : word
}

export function parseQuadraticInput(input: string): ParsedQuadratic {
  const cleaned = input
    .replace(/−/g, '-')
    .replace(/\s+/g, '')
    .replace(/=0$/i, '')

  let a = 1
  let b = -5
  let c = 6

  // Parse ax^2 + bx + c patterns
  const quadRegex = /^([+-]?\d*(?:\.\d+)?)x(?:\^2|²)(?:([+-]\d*(?:\.\d+)?)x)?([+-]\d+(?:\.\d+)?)?$/i
  const match = cleaned.match(quadRegex)

  if (match) {
    const rawA = match[1]
    const rawB = match[2]
    const rawC = match[3]

    if (rawA === '' || rawA === '+') a = 1
    else if (rawA === '-') a = -1
    else a = parseFloat(rawA)

    if (!rawB) b = 0
    else if (rawB === '+') b = 1
    else if (rawB === '-') b = -1
    else b = parseFloat(rawB)

    if (!rawC) c = 0
    else c = parseFloat(rawC)
  }

  if (!Number.isFinite(a) || Math.abs(a) < 1e-9) a = 1
  if (!Number.isFinite(b)) b = 0
  if (!Number.isFinite(c)) c = 0

  const aTerm = a === 1 ? 'x^2' : a === -1 ? '-x^2' : `${formatNum(a)}x^2`
  const bTerm = b === 0 ? '' : b === 1 ? ' + x' : b === -1 ? ' - x' : b > 0 ? ` + ${formatNum(b)}x` : ` - ${formatNum(Math.abs(b))}x`
  const cTerm = c === 0 ? '' : c > 0 ? ` + ${formatNum(c)}` : ` - ${formatNum(Math.abs(c))}`
  const normalized = `${aTerm}${bTerm}${cTerm} = 0`

  const discriminant = b * b - 4 * a * c
  const vx = -b / (2 * a)
  const vy = a * vx * vx + b * vx + c
  const focalDist = 1 / (4 * a)
  const focus = { x: vx, y: vy + focalDist }
  const directrixY = vy - focalDist

  let nature: 'two_real' | 'one_real' | 'complex' = 'two_real'
  let roots: number[] = []
  let complexRoots: { re: number; im: number } | undefined
  let exactRootLabels: [string, string] = ['0', '0']

  if (Math.abs(discriminant) < 1e-9) {
    nature = 'one_real'
    const r = -b / (2 * a)
    roots = [r]
    exactRootLabels = [formatNum(r), formatNum(r)]
  } else if (discriminant > 0) {
    nature = 'two_real'
    const sqrtD = Math.sqrt(discriminant)
    const r1 = (-b - sqrtD) / (2 * a)
    const r2 = (-b + sqrtD) / (2 * a)
    roots = [Math.min(r1, r2), Math.max(r1, r2)]
    if (Number.isInteger(Math.round(sqrtD)) && Math.abs(sqrtD - Math.round(sqrtD)) < 1e-7) {
      exactRootLabels = [formatNum(roots[0]), formatNum(roots[1])]
    } else {
      const denom = 2 * a
      exactRootLabels = [
        `(${formatNum(-b)} - √${formatNum(discriminant)}) / ${formatNum(denom)} ≈ ${formatNum(roots[0])}`,
        `(${formatNum(-b)} + √${formatNum(discriminant)}) / ${formatNum(denom)} ≈ ${formatNum(roots[1])}`,
      ]
    }
  } else {
    nature = 'complex'
    const re = -b / (2 * a)
    const im = Math.sqrt(Math.abs(discriminant)) / Math.abs(2 * a)
    complexRoots = { re, im }
    exactRootLabels = [
      `${formatNum(re)} - ${formatNum(im)}i`,
      `${formatNum(re)} + ${formatNum(im)}i`,
    ]
  }

  // Factored & Vertex forms
  let factoredForm = normalized
  if (nature === 'two_real') {
    const [r1, r2] = roots
    const p1 = r1 === 0 ? 'x' : r1 > 0 ? `(x - ${formatNum(r1)})` : `(x + ${formatNum(Math.abs(r1))})`
    const p2 = r2 === 0 ? 'x' : r2 > 0 ? `(x - ${formatNum(r2)})` : `(x + ${formatNum(Math.abs(r2))})`
    const prefix = a === 1 ? '' : a === -1 ? '-' : `${formatNum(a)}`
    factoredForm = `${prefix}${p1}${p2} = 0`
  } else if (nature === 'one_real') {
    const r = roots[0]
    const p = r === 0 ? 'x^2' : r > 0 ? `(x - ${formatNum(r)})^2` : `(x + ${formatNum(Math.abs(r))})^2`
    const prefix = a === 1 ? '' : a === -1 ? '-' : `${formatNum(a)}`
    factoredForm = `${prefix}${p} = 0`
  } else if (complexRoots) {
    factoredForm = `No factorizable en ℝ (Δ = ${formatNum(discriminant)} < 0)`
  }

  const hPart = vx === 0 ? 'x^2' : vx > 0 ? `(x - ${formatNum(vx)})^2` : `(x + ${formatNum(Math.abs(vx))})^2`
  const kPart = Math.abs(vy) < 1e-9 ? '' : vy > 0 ? ` + ${formatNum(vy)}` : ` - ${formatNum(Math.abs(vy))}`
  const aPrefix = a === 1 ? '' : a === -1 ? '-' : `${formatNum(a)}`
  const vertexForm = `f(x) = ${aPrefix}${hPart}${kPart}`

  const derivA = 2 * a
  const derivativeLatex = `f'(x) = ${formatNum(derivA)}x ${b >= 0 ? `+ ${formatNum(b)}` : `- ${formatNum(Math.abs(b))}`}`
  const integralLatex = `∫f(x)dx = (${formatNum(a)}/3)x³ ${b >= 0 ? `+ (${formatNum(b)}/2)x²` : `- (${formatNum(Math.abs(b))}/2)x²`} ${c >= 0 ? `+ ${formatNum(c)}x` : `- ${formatNum(Math.abs(c))}x`} + C`

  let areaBetweenRoots = 0
  if (nature === 'two_real') {
    const [r1, r2] = roots
    const F = (x: number) => (a / 3) * x ** 3 + (b / 2) * x ** 2 + c * x
    areaBetweenRoots = Math.abs(F(r2) - F(r1))
  }

  const vietaSum = -b / a
  const vietaProduct = c / a

  // Spanish TTS Phonetic string
  const aSpoken = a === 1 ? 'equis al cuadrado' : a === -1 ? 'menos equis al cuadrado' : `${numberToSpanishWords(a)} equis al cuadrado`
  const bSpoken = b === 0 ? '' : b > 0 ? ` más ${numberToSpanishWords(b)} equis` : ` menos ${numberToSpanishWords(Math.abs(b))} equis`
  const cSpoken = c === 0 ? '' : c > 0 ? ` más ${numberToSpanishWords(c)}` : ` menos ${numberToSpanishWords(Math.abs(c))}`
  const spanishPhonetic = `${aSpoken}${bSpoken}${cSpoken} igual a cero. Coeficientes: a igual a ${numberToSpanishWords(a)}, be labial igual a ${numberToSpanishWords(b)}, ce igual a ${numberToSpanishWords(c)}. Discriminante igual a ${numberToSpanishWords(discriminant)}.`

  const mathJsonAst = JSON.stringify(
    ['Equal', ['Add', ['Multiply', a, ['Power', 'x', 2]], ['Multiply', b, 'x'], c], 0],
    null,
    2
  )

  const commonDiv = gcd(gcd(a, b), c)
  const steps = [
    {
      rule: 'IDENTIFY_COEFFICIENTS',
      title: '1. Identificación de coeficientes canónicos',
      formula: `a = ${formatNum(a)},   b = ${formatNum(b)},   c = ${formatNum(c)}`,
      explanation: commonDiv > 1
        ? `Comparamos con ax² + bx + c = 0 (divisible por factor común ${commonDiv}).`
        : 'Extraemos los coeficientes del término cuadrático, lineal e independiente.',
    },
    {
      rule: 'COMPUTE_DISCRIMINANT',
      title: '2. Cálculo del discriminante (Δ = b² - 4ac)',
      formula: `Δ = (${formatNum(b)})² - 4(${formatNum(a)})(${formatNum(c)}) = ${formatNum(b * b)} - (${formatNum(4 * a * c)}) = ${formatNum(discriminant)}`,
      explanation: discriminant > 0
        ? 'Como Δ > 0, existen dos raíces reales y distintas.'
        : discriminant === 0
          ? 'Como Δ = 0, existe una única raíz real de multiplicidad doble (vértice sobre el eje X).'
          : 'Como Δ < 0, no existen cortes con el eje real; las soluciones son complejas conjugadas.',
    },
    {
      rule: 'QUADRATIC_FORMULA_SUBSTITUTION',
      title: '3. Sustitución en la Fórmula General',
      formula: `x = [ -(${formatNum(b)}) ± √(${formatNum(discriminant)}) ] / [ 2(${formatNum(a)}) ] = [ ${formatNum(-b)} ± ${discriminant >= 0 ? formatNum(Math.sqrt(discriminant)) : `i√${formatNum(Math.abs(discriminant))}`} ] / ${formatNum(2 * a)}`,
      explanation: 'Sustituimos con paréntesis protectores para preservar la ley de signos en -b y 2a.',
    },
    {
      rule: 'ROOT_BRANCHES_AND_VERTEX',
      title: '4. Desglose de ramas y coordenadas del vértice',
      formula: `x₁ = ${exactRootLabels[0]}   |   x₂ = ${exactRootLabels[1]}   |   V(${formatNum(vx)}, ${formatNum(vy)})`,
      explanation: `Verificación por relaciones de Cardano-Vieta: x₁ + x₂ = ${formatNum(vietaSum)} y x₁ · x₂ = ${formatNum(vietaProduct)}.`,
    },
  ]

  // Newton-Raphson iterations
  const newtonIterations: ParsedQuadratic['newtonIterations'] = []
  let currX = vx + 2.2
  for (let i = 1; i <= 5; i++) {
    const fx = a * currX * currX + b * currX + c
    const fpx = 2 * a * currX + b
    const safeFpx = Math.abs(fpx) < 1e-6 ? 1e-6 : fpx
    const nextX = currX - fx / safeFpx
    const error = Math.abs(nextX - currX)
    newtonIterations.push({
      step: i,
      x: Number(currX.toFixed(6)),
      fx: Number(fx.toFixed(6)),
      fpx: Number(fpx.toFixed(6)),
      nextX: Number(nextX.toFixed(6)),
      error: Number(error.toExponential(3)),
    })
    currX = nextX
  }

  const manimSnippet = `from manim import *

class PizarraCuadraticaScene(Scene):
    def construct(self):
        anchor = MathTex(r"${normalized}").to_edge(UP, buff=0.45)
        coeffs = MathTex(r"a=${formatNum(a)},\\; b=${formatNum(b)},\\; c=${formatNum(c)}").next_to(anchor, DOWN)
        disc = MathTex(r"\\Delta = (${formatNum(b)})^2 - 4(${formatNum(a)})(${formatNum(c)}) = ${formatNum(discriminant)}").next_to(coeffs, DOWN)
        roots = MathTex(r"x_1 = ${exactRootLabels[0]},\\quad x_2 = ${exactRootLabels[1]}").next_to(disc, DOWN)
        self.play(Write(anchor))
        self.play(FadeIn(coeffs), Write(disc))
        self.play(Circumscribe(roots, color=YELLOW))
        self.wait(2)`

  const lean4Snippet = `import Mathlib.Data.Real.Basic
import Mathlib.Tactic.Ring

-- Certificación Formal Lean 4 para: ${normalized}
theorem certificacion_cuadratica (x : ℝ) :
    ${a === 1 ? '' : `${formatNum(a)} * `}x^2 ${b >= 0 ? `+ ${formatNum(b)} * x` : `- ${formatNum(Math.abs(b))} * x`} ${c >= 0 ? `+ ${formatNum(c)}` : `- ${formatNum(Math.abs(c))}`} =
    ${a === 1 ? '' : `${formatNum(a)} * `}(x - (${formatNum(vx)}))^2 + (${formatNum(vy)}) := by
  ring`

  const mermaidSnippet = `flowchart LR
  A["Ancla: ${normalized}"] --> B["Coeficientes: a=${formatNum(a)}, b=${formatNum(b)}, c=${formatNum(c)}"]
  B --> C["Discriminante: Δ = ${formatNum(discriminant)}"]
  C --> D["Rama 1: x₁ = ${exactRootLabels[0]}"]
  C --> E["Rama 2: x₂ = ${exactRootLabels[1]}"]
  D --> F["Vértice: V(${formatNum(vx)}, ${formatNum(vy)})"]
  E --> F`

  return {
    raw: input,
    normalized,
    a,
    b,
    c,
    discriminant,
    nature,
    roots,
    complexRoots,
    exactRootLabels,
    vertex: { x: vx, y: vy },
    focus,
    directrixY,
    factoredForm,
    vertexForm,
    derivativeLatex,
    integralLatex,
    areaBetweenRoots,
    vietaSum,
    vietaProduct,
    spanishPhonetic,
    mathJsonAst,
    steps,
    newtonIterations,
    manimSnippet,
    lean4Snippet,
    mermaidSnippet,
  }
}

export function evalQuadraticAt(q: ParsedQuadratic, x: number): number {
  return q.a * x * x + q.b * x + q.c
}

export function evalDerivativeAt(q: ParsedQuadratic, x: number): number {
  return 2 * q.a * x + q.b
}
