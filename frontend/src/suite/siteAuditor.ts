import {
  MACRO_CATEGORIES,
  MATH_TOOLS_CATALOG,
  type CategoryId,
  type MathToolSpec,
} from './catalog'
import { parseQuadraticInput, type ParsedQuadratic } from './mathEngines'

export type WebsiteAuditSection = {
  index: number
  heading: string
  rawExcerpt: string
  detectedGap: string
  categoryId: CategoryId
  categoryTitle: string
  categoryIcon: string
  recommendedTool: MathToolSpec
  alternativeTools: MathToolSpec[]
  equation: string
  parsedMath: ParsedQuadratic
  pedagogicalRationale: string
  kaggleRole: string
  mcpToolCall: {
    tool: 'audit_webpage_math_opportunities' | 'recommend_engine_for_topic'
    arguments: Record<string, unknown>
  }
  embedUrl: string
  iframeCode: string
  reactSnippet: string
}

export type WebsiteAuditReport = {
  targetUrl: string
  totalSections: number
  categoriesUsed: CategoryId[]
  sections: WebsiteAuditSection[]
}

export type SampleWebsiteTemplate = {
  id: string
  title: string
  url: string
  badge: string
  description: string
  content: string
}

export const SAMPLE_WEBSITE_TEMPLATES: SampleWebsiteTemplate[] = [
  {
    id: 'portal-algebra',
    title: 'Portal Web: Curso de Álgebra y Ecuaciones Cuadráticas',
    url: 'https://mi-academia-matematica.edu/cursos/algebra-cuadratica',
    badge: 'Álgebra · 4 Secciones',
    description: 'Página educativa con teoría de despejes, factorización con áreas, relaciones de Vieta y zona de práctica del alumno.',
    content: `<h1>Curso de Álgebra: Dominando la Ecuación de Segundo Grado</h1>
<h2>1. Resolución y Despeje Paso a Paso</h2>
<p>En esta sección explicamos cómo resolver la ecuación cuadrática x^2 - 7x + 12 = 0 aplicando factorización y fórmula general con discriminante.</p>

<h2>2. Intuición Visual: Completando el Cuadrado con Bloques de Área</h2>
<p>Muchos estudiantes de secundaria memorizan la fórmula sin ver el área geométrica. Necesitamos un mosaico manipulable para visualizar x^2 - 5x + 6 = 0 con bloques interactivos.</p>

<h2>3. Propiedades de las Raíces y Relaciones de Cardano-Vieta</h2>
<p>Analizamos la forma canónica y la suma y producto de raíces en 2x^2 - 10x + 12 = 0 usando un árbol sintáctico simbólico.</p>

<h2>4. Zona de Práctica: Escribe tu Respuesta</h2>
<p>Aquí el estudiante debe ingresar su ecuación y practicar con un teclado matemático virtual LaTeX para verificar x^2 - 4x + 3 = 0.</p>`,
  },
  {
    id: 'portal-calculo',
    title: 'Portal Web: Cálculo Diferencial, Integral y Multivariable 3D',
    url: 'https://mi-academia-matematica.edu/cursos/calculo-1-y-3d',
    badge: 'Cálculo 2D/3D · 4 Secciones',
    description: 'Lección de límites, derivada como pendiente de la recta tangente, sumas de Riemann y superficies 3D.',
    content: `<h1>Cálculo Diferencial, Integral y Superficies en el Espacio</h1>
<h2>1. Límites, Derivada y Pendiente de la Recta Tangente</h2>
<p>Observa cómo la recta secante se convierte en recta tangente sobre la parábola x^2 - 4x + 3 = 0. Actualmente solo hay una imagen fija sin deslizador.</p>
<img src="/assets/recta-tangente-estatica.png" alt="Recta tangente estática" />

<h2>2. Integral Definida y Particiones de Riemann</h2>
<p>Calculamos el área encerrada bajo la curva x^2 - 6x + 5 = 0 aumentando el número de rectángulos de aproximación N.</p>

<h2>3. Cálculo Multivariable: Paraboloide y Silla de Montar en 3D</h2>
<p>Extensión a tres dimensiones z = f(x, y) con derivadas parciales y gradiente a partir del perfil x^2 - 4x + 3 = 0.</p>

<h2>4. Sólidos de Revolución en el Espacio</h2>
<p>Rotación espacial del perfil parabólico x^2 - 2x - 3 = 0 alrededor del eje para visualizar el volumen en 3D.</p>`,
  },
  {
    id: 'portal-geometria-ocr',
    title: 'Aula Virtual: Geometría Analítica, Cónicas, OCR y Video Manim',
    url: 'https://mi-academia-matematica.edu/cursos/geometria-conicas',
    badge: 'Geometría + OCR + Video · 4 Secciones',
    description: 'Página de secciones cónicas (foco y directriz), subida de fotos de cuaderno por alumnos y clase en video Manim 2.2.',
    content: `<h1>Geometría Analítica: Estudio de la Parábola como Lugar Geométrico</h1>
<h2>1. Definición de Cónica: Foco y Recta Directriz</h2>
<p>Una parábola es el lugar geométrico de los puntos que equidistan del foco F y la directriz. Analizamos x^2 - 4x + 3 = 0.</p>
<img src="/assets/foco-directriz-fijo.png" alt="Foco y directriz" />

<h2>2. Clase Magistral Animada Paso a Paso</h2>
<p>Resumen en video animado cuadro a cuadro de la resolución completa de x^2 - 5x + 6 = 0 con narración docente.</p>

<h2>3. Sube la Foto de tu Cuaderno para Revisión</h2>
<p>Los alumnos toman una foto o suben un PDF con su ejercicio manuscrito x^2 - 6x + 8 = 0 para digitalizarlo con OCR matemático antes de resolver.</p>

<h2>4. Diagrama de Flujo del Algoritmo de Clasificación</h2>
<p>Árbol de decisión y grafo dirigido que muestra cómo el signo del discriminante determina las raíces en 2x^2 - 8x + 6 = 0.</p>`,
  },
  {
    id: 'portal-universitario',
    title: 'Portal Universitario: Métodos Numéricos, Lógica Formal y Caos',
    url: 'https://mi-academia-matematica.edu/cursos/matematica-avanzada',
    badge: 'Numérico + Lean 4 + Caos · 4 Secciones',
    description: 'Curso avanzado con iteraciones de Newton-Raphson, verificación formal de teoremas en Lean 4/Z3 y sistemas dinámicos.',
    content: `<h1>Matemática Avanzada y Computacional</h1>
<h2>1. Aproximación Numérica de Raíces con Newton-Raphson</h2>
<p>Estudio de convergencia cuadrática e iteraciones numéricas para encontrar las raíces de x^2 - 7x + 10 = 0 cambiando la semilla inicial.</p>

<h2>2. Demostración Formal y Certificación en Lean 4</h2>
<p>Verificación formal del teorema de factorización e invariantes algebraicos para x^2 - 5x + 6 = 0 mediante asistente de pruebas.</p>

<h2>3. Satisfacibilidad Lógica y Restricciones SMT con Z3</h2>
<p>Comprobación formal de existencia de soluciones reales cuando el discriminante es no negativo en x^2 - 6x + 8 = 0.</p>

<h2>4. Sistemas Dinámicos, Fractales de Julia y Bifurcaciones</h2>
<p>Exploración del mapa complejo iterado z_{n+1} = z_n^2 + c y el diagrama de bifurcación asociado a x^2 - 2x - 8 = 0.</p>`,
  },
]

const CLIENT_ROUTING_RULES: Array<{
  categoryId: CategoryId
  regex: RegExp
  preferredToolId: string
  rationale: string
  kaggleRole: string
}> = [
  {
    categoryId: 'space_3d',
    regex: /\b(3d|tres dimensiones|multivariable|paraboloide|superficie|gradiente|derivada parcial|silla de montar|revoluci[oó]n|volumen)\b/i,
    preferredToolId: 'mathbox2',
    rationale: 'Se detecta contenido de cálculo multivariable o geometría en el espacio; se asigna un visor 3D orbitable (Yaw/Pitch) determinista.',
    kaggleRole: 'llm_reasoning (identifica superficie z=f(x,y) y configura proyección 3D)',
  },
  {
    categoryId: 'geometry',
    regex: /\b(c[oó]nica|foco|directriz|lugar geom[eé]trico|euclid|comp[aá]s|circunferencia|elipse|hip[eé]rbola|simetr[ií]a axial)\b/i,
    preferredToolId: 'cindyjs',
    rationale: 'El texto explica lugares geométricos o secciones cónicas; CindyJS traza el foco F, la directriz y el parámetro focal p en vivo.',
    kaggleRole: 'openjutsu_vision (si hay diagrama fijo) + llm_reasoning (parametriza foco y directriz)',
  },
  {
    categoryId: 'graph_2d',
    regex: /\b(l[ií]mite|derivada|tangente|integral|riemann|[aá]rea bajo la curva|funci[oó]n|gr[aá]fica|continuidad|pendiente)\b/i,
    preferredToolId: 'mafs-react',
    rationale: 'Para funciones, límites, derivadas o integrales de Riemann, Mafs y Function Plot permiten deslizar el punto de tangencia x₀ y las particiones N.',
    kaggleRole: 'openjutsu_vision (convierte gráfica PNG fija en expresión) + llm_reasoning (define rango de deslizador x₀)',
  },
  {
    categoryId: 'manipulatives',
    regex: /\b(mosaico|tile|manipulable|completando el cuadrado|completar el cuadrado|secundaria|bloques de [aá]rea|pizarra interactiva)\b/i,
    preferredToolId: 'mathigon-polypad',
    rationale: 'La sección busca intuición geométrica de áreas; Mathigon Polypad aporta mosaicos manipulables x², x y 1.',
    kaggleRole: 'llm_reasoning (detecta necesidad didáctica visual y configura algebra tiles)',
  },
  {
    categoryId: 'latex_input',
    regex: /\b(teclado|escribir|escribe tu respuesta|pr[aá]ctica|examen|input|editor latex|mathlive)\b/i,
    preferredToolId: 'mathlive',
    rationale: 'Se requiere entrada activa del estudiante; MathLive incorpora teclado virtual WYSIWYG con conversión a LaTeX y lectura fonética.',
    kaggleRole: 'word_aligner + tts_fast (genera retroalimentación hablada en español)',
  },
  {
    categoryId: 'stats_num',
    regex: /\b(newton|raphson|bisecci[oó]n|num[eé]rico|aproximaci[oó]n|iteraci[oó]n|estad[ií]stica|probabilidad|regresi[oó]n|convergencia)\b/i,
    preferredToolId: 'scipy-optimize',
    rationale: 'Para métodos numéricos o estadística, el motor genera la tabla de iteraciones de Newton-Raphson con semilla x₀ interactiva.',
    kaggleRole: 'llm_reasoning (selecciona semilla inicial x₀ y tolerancia de convergencia)',
  },
  {
    categoryId: 'graphs_networks',
    regex: /\b(grafo|red|[aá]rbol|nodo|arista|discreta|diagrama de flujo|algoritmo|mermaid)\b/i,
    preferredToolId: 'cytoscape-js',
    rationale: 'El contenido describe un flujo algorítmico o grafo de dependencias; Cytoscape.js y Mermaid.js renderizan el grafo dirigido interactivo.',
    kaggleRole: 'llm_reasoning (estructura el árbol de decisión desde coeficientes hasta raíces)',
  },
  {
    categoryId: 'ai_ocr',
    regex: /\b(foto|imagen|manuscrito|cuaderno|pdf|escanear|ocr|captura)\b/i,
    preferredToolId: 'latex-ocr',
    rationale: 'La sección pide digitalizar ejercicios desde fotos o PDFs; LaTeX-OCR / Nougat extraen el LaTeX y exigen confirmación antes de resolver.',
    kaggleRole: 'openjutsu_vision (ejecuta Qwen2-VL / Nougat / Pix2Tex en GPU Kaggle)',
  },
  {
    categoryId: 'formal_logic',
    regex: /\b(demostraci[oó]n formal|teorema|l[oó]gica|lean|coq|z3|inducci[oó]n|smt|satisfacibilidad|certificaci[oó]n)\b/i,
    preferredToolId: 'lean4',
    rationale: 'Se requiere verificación formal de teoremas o restricciones SMT; Lean 4 y Z3 generan el certificado formal determinista.',
    kaggleRole: 'llm_reasoning (traduce el enunciado en lenguaje natural a esqueleto Lean 4 / SMT)',
  },
  {
    categoryId: 'fractals_chaos',
    regex: /\b(fractal|caos|julia|mandelbrot|bifurcaci[oó]n|din[aá]mico|[oó]rbita|atractor|edo|ecuaci[oó]n diferencial)\b/i,
    preferredToolId: 'p5-chaos',
    rationale: 'El tema estudia sistemas dinámicos, caos o variable compleja; el laboratorio traza órbitas iteradas z_{n+1} = z_n^2 + c en tiempo real.',
    kaggleRole: 'llm_reasoning (vincula el discriminante con el parámetro complejo c del conjunto de Julia)',
  },
  {
    categoryId: 'video_anim',
    regex: /\b(video|animada|animaci[oó]n|manim|clase magistral|reel|audiovisual)\b/i,
    preferredToolId: 'manim-ce',
    rationale: 'Ideal para incrustar una pizarra animada cuadro a cuadro generada con Manim 2.2 y voz neural sincronizada.',
    kaggleRole: 'openjutsu_video + tts_clone + word_aligner (renderizado Manim 2.2 + audio neural)',
  },
  {
    categoryId: 'cas_algebra',
    regex: /\b(ecuaci[oó]n|cuadr[aá]tica|[aá]lgebra|factorizar|factorizaci[oó]n|despeje|despejar|ra[ií]ces|discriminante|vieta|can[oó]nica)\b/i,
    preferredToolId: 'mathsteps',
    rationale: 'Para despejes algebraicos y análisis de raíces, SymPy, mathsteps y CortexJS desglosan cada paso sin saltar operaciones.',
    kaggleRole: 'llm_reasoning (identifica el nivel del alumno y selecciona la ecuación ejemplo)',
  },
]

export function extractEquationFromSnippet(text: string): string | null {
  const match = text.match(/([+-]?\s*\d*\s*x(?:\^2|²)\s*(?:[+-]\s*\d+\s*x)?\s*(?:[+-]\s*\d+)?\s*=\s*[+-]?\s*\d+)/i)
  if (match && match[1]) {
    return match[1].replace(/²/g, '^2').replace(/\s+/g, ' ').trim()
  }
  return null
}

export function buildWidgetEmbedSnippet(
  tool: MathToolSpec,
  expression: string,
  height = 560
): {
  embedUrl: string
  iframeCode: string
  reactSnippet: string
} {
  const origin =
    typeof window !== 'undefined' && window.location.origin
      ? window.location.origin
      : 'https://math.forjavia.site'
  const cleanExpr = expression.trim() || tool.defaultInput
  const params = new URLSearchParams({
    embed: '1',
    tool: tool.id,
    expr: cleanExpr,
  })
  const embedUrl = `${origin}/?${params.toString()}`
  const iframeCode = `<iframe\n  src="${embedUrl}"\n  title="${tool.name} (#${String(tool.number).padStart(2, '0')}) — Widget Matemático Interactivo"\n  width="100%"\n  height="${height}"\n  style="border:1px solid #334155;border-radius:12px;background:#020617;"\n  loading="lazy"\n></iframe>`
  const reactSnippet = `<MathSuiteEmbed\n  toolId="${tool.id}"\n  toolNumber={${tool.number}}\n  expression="${cleanExpr.replace(/"/g, '&quot;')}"\n  height={${height}}\n/>`

  return {
    embedUrl,
    iframeCode,
    reactSnippet,
  }
}

export function auditWebsiteContent(
  targetUrl: string,
  htmlOrMarkdown: string
): WebsiteAuditReport {
  const raw = htmlOrMarkdown.trim()
  const blocks = raw
    .split(/(?=<h[2-4]\b|^#{2,4}\s+|^\d+\.\s+[A-ZÁÉÍÓÚÑ])/im)
    .map((b) => b.trim())
    .filter((b) => b.length > 0 && !/^<h1[^>]*>[^<]*<\/h1>$/i.test(b))

  const effectiveBlocks = blocks.length > 0 ? blocks : [raw]

  const sections: WebsiteAuditSection[] = effectiveBlocks.slice(0, 12).map((block, idx) => {
    const headingMatch =
      block.match(/<h[1-4][^>]*>(.*?)<\/h[1-4]>/i) ||
      block.match(/^#{1,4}\s+(.+)$/m) ||
      block.match(/^(\d+\.\s+[^\n]+)/)

    const plainText = block
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()

    const heading = headingMatch
      ? headingMatch[1].replace(/<[^>]+>/g, '').trim()
      : `Sección ${idx + 1}: ${plainText.slice(0, 52)}`

    const hasStaticImg = /<img\b|!\[.*?\]\(.*?\)/i.test(block)
    const extractedEq = extractEquationFromSnippet(plainText)

    let matchedRule = CLIENT_ROUTING_RULES[CLIENT_ROUTING_RULES.length - 1]
    for (const rule of CLIENT_ROUTING_RULES) {
      if (rule.regex.test(`${heading} ${plainText}`)) {
        matchedRule = rule
        break
      }
    }

    // Refine specific sub-tool within the category when specific keywords appear
    let preferredId = matchedRule.preferredToolId
    if (matchedRule.categoryId === 'graph_2d' && /riemann|integral|[aá]rea bajo/i.test(plainText)) {
      preferredId = 'function-plot'
    } else if (matchedRule.categoryId === 'space_3d' && /revoluci[oó]n|rotaci[oó]n/i.test(plainText)) {
      preferredId = 'three-math'
    } else if (matchedRule.categoryId === 'cas_algebra' && /vieta|can[oó]nica|ast|mathjson/i.test(plainText)) {
      preferredId = 'cortex-ce'
    } else if (matchedRule.categoryId === 'formal_logic' && /z3|smt|satisfacibilidad/i.test(plainText)) {
      preferredId = 'z3-prover'
    }

    const recommendedTool =
      MATH_TOOLS_CATALOG.find((t) => t.id === preferredId) ??
      MATH_TOOLS_CATALOG.find((t) => t.categoryId === matchedRule.categoryId) ??
      MATH_TOOLS_CATALOG[0]

    const alternativeTools = MATH_TOOLS_CATALOG.filter(
      (t) => t.categoryId === recommendedTool.categoryId && t.id !== recommendedTool.id
    )

    const catMeta =
      MACRO_CATEGORIES.find((c) => c.id === recommendedTool.categoryId) ?? MACRO_CATEGORIES[0]

    const equation = extractedEq || recommendedTool.defaultInput
    const parsedMath = parseQuadraticInput(equation)

    const detectedGap = hasStaticImg
      ? 'Imagen fija detectada (<img>) sin controles interactivos: el estudiante no puede mover parámetros ni explorar la curva.'
      : extractedEq
        ? `Fórmula estática (${extractedEq}) en texto plano: falta laboratorio interactivo para manipular y verificar pasos.`
        : 'Explicación puramente textual: requiere insertar un simulador interactivo con casos preconfigurados.'

    const embed = buildWidgetEmbedSnippet(recommendedTool, equation)

    return {
      index: idx + 1,
      heading,
      rawExcerpt: plainText.slice(0, 220),
      detectedGap,
      categoryId: recommendedTool.categoryId,
      categoryTitle: catMeta.title,
      categoryIcon: catMeta.icon,
      recommendedTool,
      alternativeTools,
      equation,
      parsedMath,
      pedagogicalRationale: matchedRule.rationale,
      kaggleRole: matchedRule.kaggleRole,
      mcpToolCall: {
        tool: 'recommend_engine_for_topic',
        arguments: {
          topic: heading,
          sampleEquations: [equation],
          baseEmbedUrl: typeof window !== 'undefined' ? window.location.origin : 'https://math.forjavia.site',
        },
      },
      embedUrl: embed.embedUrl,
      iframeCode: embed.iframeCode,
      reactSnippet: embed.reactSnippet,
    }
  })

  const categoriesUsed = Array.from(new Set(sections.map((s) => s.categoryId)))

  return {
    targetUrl: targetUrl.trim() || 'https://mi-academia-matematica.edu/curso',
    totalSections: sections.length,
    categoriesUsed,
    sections,
  }
}
