import React, { useState, useMemo } from 'react'
import {
  Flame,
  Sparkles,
  Copy,
  Check,
  Smartphone,
  Monitor,
  Square,
  Play,
  Share2,
  Code2,
  FileText,
  Image as ImageIcon,
  CheckCircle2,
  Layers,
  ArrowRight,
  TrendingUp,
  AlertTriangle,
  Lightbulb
} from 'lucide-react'

type AspectRatio = '9:16' | '16:9' | '1:1'
type TemplateType = 'poshenloh' | 'mcd_olimpiada' | 'origen_formula' | 'mru_ciencia' | 'binomio_cuadrado' | 'custom'

interface QuadraticPreset {
  label: string
  a: number
  b: number
  c: number
  description: string
}

const QUADRATIC_PRESETS: QuadraticPreset[] = [
  { label: 'x² - 6x + 5 = 0 (Ganador Video 1)', a: 1, b: -6, c: 5, description: 'Centro x₀=3, raíces simétricas x=1 y x=5, corte (0,5)' },
  { label: 'x² - 8x + 15 = 0', a: 1, b: -8, c: 15, description: 'Centro x₀=4, u²=1 (u=1), raíces x=3 y x=5, corte (0,15)' },
  { label: 'x² - 4x - 5 = 0', a: 1, b: -4, c: -5, description: 'Centro x₀=2, u²=9 (u=3), raíces x=-1 y x=5, corte (0,-5)' },
  { label: 'x² - 10x + 21 = 0', a: 1, b: -10, c: 21, description: 'Centro x₀=5, u²=4 (u=2), raíces x=3 y x=7, corte (0,21)' },
  { label: 'x² + 2x - 8 = 0', a: 1, b: 2, c: -8, description: 'Centro x₀=-1, u²=9 (u=3), raíces x=-4 y x=2, corte (0,-8)' },
]

interface ViralClonerStudioProps {
  onSendToVideoStudio?: (title: string, expression: string) => void
}

export function ViralClonerStudio({ onSendToVideoStudio }: ViralClonerStudioProps) {
  const [selectedTemplate, setSelectedTemplate] = useState<TemplateType>('poshenloh')
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>('9:16')
  const [activeOutputTab, setActiveOutputTab] = useState<'all' | 'tiktok' | 'youtube' | 'cover' | 'manim'>('all')
  const [copiedKey, setCopiedKey] = useState<string | null>(null)

  // Parametros Modelo 1 (Po-Shen Loh)
  const [quadA, setQuadA] = useState<number>(1)
  const [quadB, setQuadB] = useState<number>(-6)
  const [quadC, setQuadC] = useState<number>(5)

  // Parametros Modelo 2 (Olimpiada M.C.D.)
  const [mcdExpression, setMcdExpression] = useState('3^3 - 3, \\dots, 2007^{2007} - 2007')
  const [mcdTecho, setMcdTecho] = useState(24)

  // Parametros Modelo 3 (Custom)
  const [customTitle, setCustomTitle] = useState('El truco matemático que nadie te enseñó')
  const [customProblem, setCustomProblem] = useState('x^2 - 12x + 35 = 0')
  const [customApproach, setCustomApproach] = useState<'geometric' | 'algebraic'>('geometric')

  // Cálculos matemáticos en vivo para Po-Shen Loh
  const quadCalculations = useMemo(() => {
    const a = quadA || 1
    const b = quadB
    const c = quadC

    const x0 = -b / (2 * a)
    const uSquared = Math.pow(x0, 2) - (c / a)
    const isReal = uSquared >= 0
    const u = isReal ? Math.sqrt(uSquared) : 0
    const r1 = isReal ? x0 - u : NaN
    const r2 = isReal ? x0 + u : NaN
    const vertexY = (c / a) - Math.pow(x0, 2) // -u^2

    // Signos formateados para display
    const bSign = b >= 0 ? `+ ${b}` : `- ${Math.abs(b)}`
    const cSign = c >= 0 ? `+ ${c}` : `- ${Math.abs(c)}`
    const eqDisplay = `${a === 1 ? '' : a === -1 ? '-' : a}x² ${bSign}x ${cSign} = 0`

    return {
      a, b, c, x0, uSquared, isReal, u, r1, r2, vertexY, eqDisplay
    }
  }, [quadA, quadB, quadC])

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text)
    setCopiedKey(key)
    setTimeout(() => setCopiedKey(null), 2500)
  }

  // Generador de Copy TikTok (Unicode Seguro, sin LaTeX roto)
  const tiktokCopy = useMemo(() => {
    if (selectedTemplate === 'poshenloh') {
      const { eqDisplay, x0, uSquared, u, r1, r2, isReal } = quadCalculations
      return `¿Nos engañaron 4.000 años con la fórmula general? 🤯❌

En 2019, el matemático de Carnegie Mellon, Po-Shen Loh, reveló que toda ecuación cuadrática se resuelve en segundos usando pura simetría geométrica:

Dada la ecuación: ${eqDisplay}
1️⃣ Centro del espejo: x₀ = -b / 2a = ${-quadB} / ${2 * quadA} = ${x0}
2️⃣ Raíces simétricas: ${x0} - u  y  ${x0} + u
3️⃣ Propiedad del producto: (${x0} - u)(${x0} + u) = ${quadC}
   ➡️ ${Math.pow(x0, 2)} - u² = ${quadC}  ➡️  u² = ${uSquared}  ➡️  u = ${u}
4️⃣ Soluciones exactas:
   x₁ = ${x0} - ${u} = ${r1}
   x₂ = ${x0} + ${u} = ${r2}  ✅

¡Cero adivinanzas, cero aspa simple y sin memorizar raíces cuadradas monstruosas! ⚡

¿Te enseñaron este método en la escuela o te hicieron sufrir con la fórmula larga? Cuéntamelo en los comentarios 👇

#matematicas #trucosmatematicos #ecuaciones #poshenloh #algebra #educacion #aprendeentiktok #cienciadivertida #parati`
    } else if (selectedTemplate === 'mcd_olimpiada') {
      return `¿Una supercomputadora para este examen de olimpiada? 🤖❌ ¡Los humanos vemos la estructura oculta!

Nos piden calcular el Máximo Común Divisor (M.C.D.) de:
3³ - 3, 5⁵ - 5, ..., 2007²⁰⁰⁷ - 2007

1️⃣ Techo límite: Evaluamos el primer término:
   3³ - 3 = 27 - 3 = 24. ¡El M.C.D. nunca puede ser mayor a 24!
2️⃣ Factorización maestra:
   nⁿ - n = n(nⁿ⁻¹ - 1)
   Como n es impar, n - 1 es PAR, por lo que (n² - 1) siempre divide a (nⁿ⁻¹ - 1).
3️⃣ Diferencia de cuadrados:
   n² - 1 = (n - 1)(n + 1)
   ¡El producto (n - 1)·n·(n + 1) son TRES enteros consecutivos! Siempre múltiplo de 3 y de 8 = 24.

Resultad final: ¡El M.C.D. es exactamente 24! 🏆⚡

¿Intentarías resolverlo por fuerza bruta o con álgebra pura? 👇

#olimpiadamatematica #algebra #trucosmatematicos #matematicas #retoviral #educacion #aprendeentiktok #shorts`
    } else if (selectedTemplate === 'origen_formula') {
      return `¿Por qué la Fórmula General tiene esa forma tan extraña? 🤯🧩

Todo el mundo se sabe de memoria x = (-b ± √(b² - 4ac)) / 2a, pero casi nadie sabe que nació hace más de 1.000 años como un ROMPECABEZAS GEOMÉTRICO al que le faltaba una esquina:

1️⃣ Limpiamos la ecuación ax² + bx + c = 0:
   Pasamos c restando y dividimos entre a ➡️ x² + (b/a)x = -c/a
2️⃣ Ojos geométricos:
   • x² es un cuadrado de lado x.
   • (b/a)x es un rectángulo azul pegado a un costado.
3️⃣ El truco de los antiguos:
   Partimos el rectángulo azul a la mitad: dejamos una tira (b/2a)x a la derecha y pegamos la otra tira (b/2a)x arriba.
4️⃣ ¡La esquina faltante! 🟨
   Queda un hueco vacío de (b/2a) × (b/2a). Su área exacta es:
   (b/2a)² = b² / 4a²
5️⃣ Completamos el cuadrado:
   Al sumar esa pieza dorada en ambos lados aparece el famoso discriminante:
   (x + b/2a)² = (b² - 4ac) / 4a²
   Sacamos raíz cuadrada y despejamos x... ¡y nace la Fórmula General! ⚡✅

¿Te enseñaron de dónde salía en la escuela o solo te obligaron a memorizarla? Cuéntamelo en los comentarios 👇

#matematicas #formulageneral #ecuacionescuadraticas #geometria #algebra #trucosmatematicos #aprendeentiktok #cienciadivertida #parati`
    } else if (selectedTemplate === 'mru_ciencia') {
      return `¡Olvida memorizar el triangulito de física! 🤯❌ En la escuela te obligan a aprender d, v y t de memoria, pero jamás te muestran qué significan visualmente. 👇⚡

El Secreto Geométrico del M.R.U. (Movimiento Rectilíneo Uniforme) en Zénit Ciencia:

1️⃣ ¿Qué significa su nombre? 🚗
• Rectilíneo = Moverse en línea recta.
• Uniforme = Avanzar un bloque exactamente del mismo tamaño en cada segundo, sin acelerar ni frenar.

2️⃣ ¿Qué significa DIVIDIR (v = d / t)? ✂️🟦
Si recorres una barra de 12 metros en 3 segundos:
• Dividir 12 ÷ 3 significa partir esa barra en 3 pedazos iguales (1 para cada segundo).
• En cada segundo caben exactamente 4 metros:
👉 v = 12 m / 3 s = 4 m/s (el bloque que avanzas en 1 solo segundo).

3️⃣ ¿Por qué MULTIPLICAR (d = v × t)? 🚂🚃
Multiplicar es repetir bloques iguales uno tras otro, como los vagones de un tren:
• 3 vagones de 4 m = 4 m/s × 3 s = 12 m.

4️⃣ ¡Adiós al Triangulito! El Secreto es un RECTÁNGULO: 📐
Si dibujas la velocidad como la Altura (v = 4) y el tiempo como la Base (t = 3), formas un rectángulo de 12 cuadrados:
• Área (Distancia): d = v × t
• Altura (Velocidad): v = d / t
• Base (Tiempo): t = d / v

🌍 En tu vida diaria: Así calcula el GPS en cuántos minutos llegas (ETA), tu cerebro al cruzar una calle y el ritmo de una escalera eléctrica.

💾 ¡Guarda este video para tus exámenes de física y síguenos en Zénit Ciencia!

#fisica #ciencia #mru #cinematica #zenitciencia #trucosdefisica #matematicas #aprendeentiktok #edutok #ingenieria #examenes #estudio`
    } else if (selectedTemplate === 'binomio_cuadrado') {
      return `¿Qué significa realmente (a + b)²? 🤯📐 El 90% de los estudiantes cree por error que es solo a² + b², porque en la escuela nunca les mostraron este dibujo. 👇❌

El Secreto Geométrico del Binomio al Cuadrado paso a paso:

1️⃣ El Cuadrado de Partida (a²): 🟦
Tomamos un cuadrado de lado a. Su área interna es:
👉 a × a = a²

2️⃣ El Crecimiento (+b): 📈
Si hacemos crecer ese cuadrado agregándole un tramo b a la derecha y arriba, el nuevo lado total mide (a + b).

3️⃣ Dividimos la Figura Nueva: ✂️
Al trazar dos líneas rectas sobre la parte que creció, aparecen exactamente 3 piezas nuevas:
• Dos rectángulos iguales de lados a y b ➡️ área de cada uno = ab
• Un cuadrado pequeño en la esquina de lado b ➡️ área = b²

4️⃣ La Suma Total de las 4 Piezas: 🧩✅
Si sumamos todas las áreas que forman el cuadrado grande de lado (a + b):
👉 (a + b)² = a² + ab + ab + b²
👉 (a + b)² = a² + 2ab + b²

¡Por eso NUNCA debes olvidar el 2ab del centro! Olvidarlo es como borrar los 2 rectángulos laterales del cuadrado. 💡

💾 ¡Guarda este video para no volver a fallar en un examen y compártelo!

#matematicas #algebra #binomioalcuadrado #productosnotables #geometria #trucosmatematicos #aprendeentiktok #edutok #examenes #estudio #zenitmatematica`
    } else {
      return `¡El truco matemático definitivo que tu profesor nunca te enseñó! ⚡🧠

Resolviendo: ${customProblem}
Sigue la estructura geométrica paso a paso y ahorra minutos en tus exámenes.

Guarda este video y etiqueta a tu amigo que siempre sufre con matemáticas. 👇

#matematicas #trucomatematico #educacion #examen #estudiantes #parati`
    }
  }, [selectedTemplate, quadCalculations, customProblem])

  // Generador de Título y Descripción para YouTube Shorts
  const youtubeCopy = useMemo(() => {
    if (selectedTemplate === 'poshenloh') {
      return {
        title: `El método de 2019 que DESTRUYÓ la fórmula cuadrática 🤯 (Po-Shen Loh) #shorts`,
        description: `¿Sabías que en 2019 un matemático simplificó un método que llevaba más de 4.000 años enseñándose igual?

El profesor Po-Shen Loh (Carnegie Mellon) demostró que cualquier ecuación cuadrática se resuelve con 4 sencillos pasos simétricos:

Ecuación: ${quadCalculations.eqDisplay}
• Centro de simetría: x₀ = -b/2a = ${quadCalculations.x0}
• Raíces a distancia u: (${quadCalculations.x0} - u) y (${quadCalculations.x0} + u)
• Producto de Vieta: (${quadCalculations.x0} - u)(${quadCalculations.x0} + u) = ${quadCalculations.c}
• Solución final: x₁ = ${quadCalculations.r1}, x₂ = ${quadCalculations.r2}

Guarda este Short para tu próximo examen y compártelo con quien siga sufriendo con la fórmula general.

🔔 Suscríbete para más atajos y joyas matemáticas explicadas visualmente.

#matematica #algebra #ecuacionescuadraticas #poshenloh #trucomatematico #educacion #shorts #viral`
      }
    } else if (selectedTemplate === 'mcd_olimpiada') {
      return {
        title: `Problema Real de Olimpiada: M.C.D. de potencias gigantes 🧠🏆 #shorts`,
        description: `Determina el Máximo Común Divisor de 3³ - 3, 5⁵ - 5, ..., 2007²⁰⁰⁷ - 2007.

La fuerza bruta es para computadoras; los humanos encontramos patrones por ingeniería inversa.
Paso 1: El techo límite con n=3 nos da 24.
Paso 2: Factorizamos n(nⁿ⁻¹ - 1) demostrando que siempre contiene 3 enteros consecutivos.
Resultado: M.C.D. = 24.

#olimpiadamatematica #algebra #trucosmatematicos #matematicas #shorts`
      }
    } else if (selectedTemplate === 'origen_formula') {
      return {
        title: `¿De dónde sale realmente la Fórmula General? 🤯🧩 El secreto geométrico #shorts`,
        description: `Todo el mundo memoriza x = (-b ± √(b² - 4ac)) / 2a en la escuela, pero casi nadie ha visto el rompecabezas geométrico de hace 1.000 años que le dio origen.

En este Short descubrirás visualmente:
• Cómo ax² + bx + c = 0 se transforma en un cuadrado de área x² y un rectángulo (b/a)x.
• Por qué partir el rectángulo a la mitad deja una esquina vacía de área b²/4a².
• Cómo al encajar esa pieza dorada nace el famoso discriminante b² - 4ac.
• Qué significa el signo ± en la física real (cohetes, tiros libres, puentes colgantes y motores de videojuegos).

🔔 Guarda este video y suscríbete para ver las matemáticas como nunca te las contaron.

#matematicas #formulageneral #geometria #algebra #ecuaciones #educacion #curiosidades #shorts #viral`
      }
    } else if (selectedTemplate === 'mru_ciencia') {
      return {
        title: `¡Adiós al Triangulito de Física! 🤯❌ El Secreto Geométrico del M.R.U. | Zénit Ciencia #Shorts`,
        description: `¿En la escuela te hicieron memorizar el triangulito de d, v y t para el Movimiento Rectilíneo Uniforme (M.R.U.) sin explicarte por qué se divide o se multiplica? 🤯

En Zénit Ciencia descubrirás cómo se ve realmente la velocidad y la distancia con bloques, vagones de tren y un rectángulo geométrico:
• Dividir (v = d / t): Partir una barra de 12 m en 3 segundos iguales = 4 m por cada segundo (4 m/s).
• Multiplicar (d = v × t): Acoplar 3 vagones de tren de 4 m cada uno = 12 m en total.
• El Rectángulo 4 × 3: Altura (v) × Base (t) = Área (d). Dividir el área entre un lado siempre te devuelve el otro lado, ¡sin memorizar triangulitos!
• Aplicaciones reales: Cómo calcula el GPS tu tiempo estimado de llegada (ETA), cómo estima tu cerebro si puedes cruzar una avenida y el movimiento de las escaleras eléctricas.

🔔 ¡Suscríbete a Zénit Ciencia para ver la física y las matemáticas como nunca te las enseñaron!

#Fisica #Ciencia #MRU #Cinematica #ZenitCiencia #Educacion #TrucosDeEstudio #Ingenieria #Matematicas #Shorts #YouTubeShorts`
      }
    } else if (selectedTemplate === 'binomio_cuadrado') {
      return {
        title: `¿Qué significa realmente (a + b)²? 🤯📐 Por qué NO es a² + b² #Shorts`,
        description: `¿Alguna vez te preguntaste por qué (a + b)² = a² + 2ab + b² y de dónde sale ese "2ab" del centro que tantos olvidan en los exámenes? 🤯

En lugar de memorizarlo a ciegas, descubre la demostración geométrica visual que usaban las civilizaciones antiguas:
• 1. Empezamos con un cuadrado de lado a, cuya área es a².
• 2. Si el lado crece una medida b, ahora el cuadrado grande mide (a + b) por cada lado.
• 3. Al dividir la región que creció, aparecen DOS rectángulos iguales de área a·b = ab y UN cuadrado pequeño en la esquina de área b·b = b².
• 4. Sumando las 4 áreas: (a + b)² = a² + ab + ab + b² = a² + 2ab + b².

🔔 ¡Suscríbete a Zénit Matemática para entender las matemáticas visualmente!

#Matematicas #Algebra #ProductosNotables #BinomioAlCuadrado #Geometria #TrucosMatematicos #Educacion #Shorts #YouTubeShorts`
      }
    } else {
      return {
        title: `${customTitle} ⚡ #shorts`,
        description: `Resolución optimizada de: ${customProblem}.\n\nSuscríbete para dominar matemáticas con intuición y rapidez.`
      }
    }
  }, [selectedTemplate, quadCalculations, customTitle, customProblem])

  // Información y Asset de Portada Dinámica
  const coverInfo = useMemo(() => {
    if (selectedTemplate === 'poshenloh') {
      return {
        src: '/cover_poshenloh_9x16.jpg',
        filename: 'cover_poshenloh_9x16.jpg',
        localPath: 'C:\\Users\\cabel\\Videos\\ecuaciones-cuadraticas-finales\\VIRAL_SHORTS_POSHENLOH\\cover_poshenloh_9x16.jpg',
        badge: 'MÉTODO PO-SHEN LOH (2019)',
        headline: '¡ADIÓS FÓRMULA GENERAL! ❌',
        subheadline: quadCalculations.eqDisplay,
        bullets: [
          'Tipografía 3D metálica de alto impacto visible en el feed móvil.',
          'Fórmula tradicional tachada en rojo (genera controversia instantánea).',
          'Solución simétrica rápida en verde neón con checkmark dorado.',
          'Parábola espaciosa con eje de simetría sobre fondo cósmico.'
        ]
      }
    } else if (selectedTemplate === 'mcd_olimpiada') {
      return {
        src: '/cover_mcd_olimpiada_9x16.jpg',
        filename: 'cover_mcd_olimpiada_9x16.jpg',
        localPath: 'C:\\Users\\cabel\\Videos\\Math Video Generator\\frontend\\public\\cover_mcd_olimpiada_9x16.jpg',
        badge: 'RETO REAL DE OLIMPIADA',
        headline: 'M.C.D. DE POTENCIAS 🏆',
        subheadline: '3³ - 3 ... 2007²⁰⁰⁷ - 2007 = 24',
        bullets: [
          'Planteamiento misterioso de potencias gigantes en tarjeta superior.',
          'Número 24 dorado tridimensional gigante en el centro.',
          'Pregunta ganadora de alto CTR para despertar curiosidad inmediata.',
          'Formato vertical 9:16 de alta resolución optimizado para TikTok y YouTube Shorts.'
        ]
      }
    } else if (selectedTemplate === 'origen_formula') {
      return {
        src: '/cover_origen_formula_9x16.jpg',
        filename: 'cover_origen_formula_9x16.jpg',
        localPath: 'C:\\Users\\cabel\\Videos\\ecuaciones-cuadraticas-finales\\VIRAL_SHORTS_ORIGEN_FORMULA\\cover_origen_formula_9x16.jpg',
        badge: 'EL DIBUJO OCULTO DE HACE 1,000 AÑOS ⚡',
        headline: 'EL SECRETO DE LA FÓRMULA GENERAL 🧩',
        subheadline: 'ax² + bx + c = 0  ⟹  x = (-b ± √(b² - 4ac)) / 2a',
        bullets: [
          'Titular 3D metálico dorado "EL SECRETO DE LA FÓRMULA GENERAL" en zona segura.',
          'Rompecabezas 3D iluminado mostrando x², las tiras (b/2a)x y la pieza dorada b²/4a².',
          'Fórmula general destacada en cristal verde esmeralda y oro en la parte inferior.',
          '1080×1920 vertical diseñado para máxima retención y curiosidad.'
        ]
      }
    } else if (selectedTemplate === 'mru_ciencia') {
      return {
        src: '/cover_mru_ciencia_9x16.jpg',
        filename: 'cover_mru_ciencia_9x16.jpg',
        localPath: 'C:\\Users\\cabel\\Videos\\ecuaciones-cuadraticas-finales\\VIRAL_SHORTS_MRU_CIENCIA\\cover_mru_ciencia_9x16.jpg',
        badge: 'ZÉNIT CIENCIA ⚡ FÍSICA VISUAL',
        headline: '¡ADIÓS AL TRIANGULITO! ❌',
        subheadline: 'v = d / t = 4 m/s  •  d = v × t = 12 m',
        bullets: [
          'Triangulito escolar d-v-t tachado en rojo neón para generar curiosidad.',
          'Rectángulo geométrico 4×3 iluminado mostrando Área d = 12 m.',
          'Tres vagones de tren acoplados de 4 m sobre riel numérico.',
          'Tarjeta inferior esmeralda y oro con las fórmulas clave del M.R.U.'
        ]
      }
    } else if (selectedTemplate === 'binomio_cuadrado') {
      return {
        src: '/cover_binomio_cuadrado_9x16.jpg',
        filename: 'cover_binomio_cuadrado_9x16.jpg',
        localPath: 'C:\\Users\\cabel\\Videos\\ecuaciones-cuadraticas-finales\\VIRAL_SHORTS_BINOMIO_CUADRADO\\cover_binomio_cuadrado_9x16.jpg',
        badge: '¡EL ERROR QUE EL 90% COMETE! ❌',
        headline: '¿QUÉ SIGNIFICA REALMENTE (a + b)²? 📐',
        subheadline: '(a + b)² = a² + 2ab + b² ✅',
        bullets: [
          'Error clásico (a + b)² = a² + b² tachado en rojo neón arriba.',
          'Disección geométrica 3D en 4 piezas: cuadrado a², dos rectángulos ab y esquina b².',
          'Narración dinámica a dos voces (masculina y femenina alternadas).',
          'Tarjeta inferior verde esmeralda con la identidad verdadera completa.'
        ]
      }
    } else {
      return {
        src: '',
        filename: 'cover_custom_9x16.jpg',
        localPath: '',
        badge: 'REEL VIRAL',
        headline: customTitle,
        subheadline: customProblem,
        bullets: [
          'Estructura de alto contraste y tipografía bold para móvil.',
          'Elemento de intriga o misterio visible en los primeros 50 ms.',
          'Compatible con el generador de imágenes y miniaturas de la suite.'
        ]
      }
    }
  }, [selectedTemplate, quadCalculations, customTitle, customProblem])

  // Código Manim Calibrado según Aspect Ratio
  const manimCodeSnippet = useMemo(() => {
    const isVertical = aspectRatio === '9:16'
    const isWidescreen = aspectRatio === '16:9'
    const isSquare = aspectRatio === '1:1'

    const pixelW = isVertical ? 720 : isWidescreen ? 1920 : 1080
    const pixelH = isVertical ? 1280 : isWidescreen ? 1080 : 1080
    const frameW = isVertical ? 9.0 : isWidescreen ? 16.0 : 10.0
    const frameH = isVertical ? 16.0 : isWidescreen ? 9.0 : 10.0

    if (selectedTemplate === 'poshenloh') {
      const { a, b, c, x0, uSquared, u, r1, r2 } = quadCalculations
      return `# -*- coding: utf-8 -*-
from manim import *
import numpy as np

# Configuración ${aspectRatio} (${isVertical ? 'Vertical para TikTok y YouTube Shorts' : isWidescreen ? 'Widescreen para YouTube' : 'Cuadrado para Feed'})
config.pixel_width = ${pixelW}
config.pixel_height = ${pixelH}
config.frame_width = ${frameW}
config.frame_height = ${frameH}

class PoShenLohViralShort(Scene):
    def construct(self):
        self.camera.background_color = "#FDFBF7"

        # 1. ZONA SUPERIOR: ECUACIÓN PROTAGONISTA EN Y = ${isVertical ? '5.48' : '3.4'} (${isVertical ? '54 pt' : '48 pt'})
        eq_box = RoundedRectangle(
            corner_radius=0.22, width=${isVertical ? '7.2' : '9.0'}, height=0.96,
            stroke_color="#2C3E50", stroke_width=2.6,
            fill_color="#FFFFFF", fill_opacity=0.98
        ).move_to(np.array([-0.2, ${isVertical ? '5.48' : '3.4'}, 0]))
        eq_text = MathTex(r"x^2", r"${b >= 0 ? '+' : '-'}", r"${Math.abs(b)}x", r"${c >= 0 ? '+' : '-'}", r"${Math.abs(c)}", r"= 0", font_size=${isVertical ? 54 : 48}, color="#1B2631").move_to(eq_box.get_center())

        # BADGES FLOTANTES SUPERIORES EN Y = ${isVertical ? '6.35' : '4.1'} (28 pt)
        badge_a = RoundedRectangle(corner_radius=0.14, width=1.55, height=0.55, stroke_color="#2980B9", stroke_width=2.5, fill_color="#EBF5FB", fill_opacity=0.98).move_to(np.array([-1.85, ${isVertical ? '6.35' : '4.1'}, 0]))
        txt_a = MathTex(r"\\mathbf{a = ${a}}", font_size=28, color="#1B4F72").move_to(badge_a.get_center())

        badge_b = RoundedRectangle(corner_radius=0.14, width=1.75, height=0.55, stroke_color="#D35400", stroke_width=2.5, fill_color="#FDEDEC", fill_opacity=0.98).move_to(np.array([-0.35, ${isVertical ? '6.35' : '4.1'}, 0]))
        txt_b = MathTex(r"\\mathbf{b = ${b}}", font_size=28, color="#922B21").move_to(badge_b.get_center())

        badge_c = RoundedRectangle(corner_radius=0.14, width=1.55, height=0.55, stroke_color="#B7950B", stroke_width=2.5, fill_color="#FEF9E7", fill_opacity=0.98).move_to(np.array([1.15, ${isVertical ? '6.35' : '4.1'}, 0]))
        txt_c = MathTex(r"\\mathbf{c = ${c}}", font_size=28, color="#7D6608").move_to(badge_c.get_center())

        # 2. GRÁFICA AMPLIADA Y ESPACIOSA (${isVertical ? 'Y = 2.05, altura 5.4u' : 'Y = 0.5, altura 4.2u'})
        axes = Axes(
            x_range=[-0.8, 6.8, 1], y_range=[-4.5, 5.5, 1],
            x_length=${isVertical ? '6.6' : '7.5'}, y_length=${isVertical ? '5.4' : '4.2'},
            axis_config={"color": "#34495E", "stroke_width": 2.5, "include_tip": True}
        ).move_to(np.array([-0.10, ${isVertical ? '2.05' : '0.5'}, 0]))
        axes.get_x_axis().add_numbers([2, 4, 6], font_size=28, color="#2C3E50")
        tick_center = MathTex(r"${x0}", font_size=28, color="#C0392B").next_to(axes.c2p(${x0}, 0), DOWN, buff=0.16).shift(LEFT * 0.16)
        axes.get_y_axis().add_numbers([${c}, -4], font_size=26, color="#2C3E50")

        parabola = axes.plot(lambda x: (x - ${x0})**2 - ${uSquared}, x_range=[0.0, 6.0], color="#E67E22", stroke_width=5.0)
        dot_y_int = Dot(axes.c2p(0, ${c}), color="#D35400", radius=0.15)
        lbl_y_int = MathTex(r"(0, ${c})", font_size=26, color="#D35400").next_to(dot_y_int, RIGHT, buff=0.18)

        tag_curva = MathTex(r"\\mathbf{y = x^2 ${b >= 0 ? '+' : '-'} ${Math.abs(b)}x ${c >= 0 ? '+' : '-'} ${Math.abs(c)}}", font_size=28, color="#D35400").move_to(axes.c2p(4.7, 3.3))
        curve_arrow = Arrow(start=tag_curva.get_bottom() + DOWN*0.06, end=axes.c2p(5.2, 1.8), color="#D35400", stroke_width=3.2, buff=0.10)

        # 3. TARJETA DE DEDUCCIÓN DINÁMICA INFERIOR (34 pt)
        card_ded = RoundedRectangle(corner_radius=0.28, width=${isVertical ? '7.2' : '9.0'}, height=${isVertical ? '2.90' : '2.20'}, stroke_color="#2C3E50", stroke_width=2.8, fill_color="#FFFFFF", fill_opacity=0.98).move_to(np.array([-0.2, ${isVertical ? '-2.45' : '-2.8'}, 0]))
        step_active = MathTex(r"\\text{Centro: } x_0 = -\\frac{b}{2a} = \\mathbf{${x0}}", font_size=34, color="#1B2631").move_to(card_ded.get_center())

        self.play(Create(eq_box), Write(eq_text), FadeIn(axes), Create(parabola), FadeIn(tag_curva), Create(curve_arrow))
        self.play(FadeIn(badge_a), FadeIn(txt_a), FadeIn(badge_b), FadeIn(txt_b), FadeIn(badge_c), FadeIn(txt_c))
        self.play(FadeIn(card_ded), Write(step_active))
        self.wait(2)
`
    } else if (selectedTemplate === 'origen_formula') {
      return `# -*- coding: utf-8 -*-
from manim import *
import numpy as np

# Configuración ${aspectRatio} — Origen Geométrico Fórmula General (Sin Colisiones ni Huecos Muertos)
config.pixel_width = ${pixelW}
config.pixel_height = ${pixelH}
config.frame_width = ${frameW}
config.frame_height = ${frameH}

class OrigenFormulaViralShort(Scene):
    def construct(self):
        self.camera.background_color = "#F6F3EC"

        # 1. BADGES FLOTANTES EN Y = ${isVertical ? '6.82' : '4.10'} + ECUACIÓN PROTAGONISTA EN Y = ${isVertical ? '5.62' : '3.30'}
        eq_box = RoundedRectangle(corner_radius=0.22, width=${isVertical ? '7.2' : '9.0'}, height=1.44, stroke_color="#2C3E50", stroke_width=2.8, fill_color="#FFFFFF", fill_opacity=0.98).move_to(np.array([-0.2, ${isVertical ? '5.62' : '3.30'}, 0]))
        eq_main = MathTex(r"\\left(x + \\frac{b}{2a}\\right)^2 = \\frac{b^2 - 4ac}{4a^2}", font_size=40, color="#1B2631").move_to(eq_box.get_center())

        # 2. GEOMETRÍA CENTRAL CON RESPIRO AMPLIO ARRIBA (>= 0.52u) Y ABAJO (>= 0.60u)
        sq_x2 = Rectangle(width=2.50, height=2.50, stroke_color="#154360", stroke_width=3.5, fill_color="#1B4F72", fill_opacity=0.92).move_to(np.array([-0.70, 1.25, 0]))
        strip_right = Rectangle(width=1.10, height=2.50, stroke_color="#1F618D", stroke_width=3.2, fill_color="#2980B9", fill_opacity=0.90).move_to(np.array([1.10, 1.25, 0]))
        strip_top = Rectangle(width=2.50, height=1.10, stroke_color="#1F618D", stroke_width=3.2, fill_color="#2980B9", fill_opacity=0.90).move_to(np.array([-0.70, 3.05, 0]))
        golden_piece = Square(side_length=1.10, stroke_color="#B7950B", stroke_width=3.6, fill_color="#F1C40F", fill_opacity=0.95).move_to(np.array([1.10, 3.05, 0]))
        lbl_hole_top = MathTex(r"\\mathbf{\\frac{b}{2a}}", font_size=28, color="#C0392B").next_to(golden_piece, UP, buff=0.14)

        full_sq = VGroup(sq_x2, strip_right, strip_top, golden_piece)
        brace_bot = Brace(full_sq, DOWN, buff=0.14, color="#B7950B")
        lbl_bot = MathTex(r"\\mathbf{x + \\frac{b}{2a}}", font_size=34, color="#9A7D0A").next_to(brace_bot, DOWN, buff=0.10)

        # 3. TARJETA DE DEDUCCIÓN INFERIOR EN Y = ${isVertical ? '-3.45' : '-2.80'} (Aprovecha zona inferior sin tocar llaves)
        card_ded = RoundedRectangle(corner_radius=0.28, width=${isVertical ? '7.2' : '9.0'}, height=3.40, stroke_color="#2C3E50", stroke_width=2.8, fill_color="#FFFFFF", fill_opacity=0.98).move_to(np.array([-0.2, ${isVertical ? '-3.45' : '-2.80'}, 0]))
        ded_title = Text("DESPEJE FINAL DEL LADO X", font_size=21, weight=BOLD, color="#196F3D").move_to(np.array([-0.2, -2.12, 0]))
        step_sqrt = MathTex(r"\\text{6. Raíz: } x + \\frac{b}{2a} = \\frac{\\pm\\sqrt{b^2 - 4ac}}{2a}", font_size=33, color="#1B2631").move_to(np.array([-0.2, -2.92, 0]))
        sol_box = RoundedRectangle(corner_radius=0.18, width=6.8, height=1.34, stroke_color="#27AE60", stroke_width=3.0, fill_color="#E8F8F5", fill_opacity=0.98).move_to(np.array([-0.2, -4.22, 0]))
        sol_formula = MathTex(r"\\mathbf{x = \\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}}", font_size=38, color="#196F3D").move_to(sol_box.get_center())

        self.add(eq_box, eq_main, full_sq, lbl_hole_top, brace_bot, lbl_bot, card_ded, ded_title, step_sqrt, sol_box, sol_formula)
`
    } else {
      return `# -*- coding: utf-8 -*-
from manim import *
import numpy as np

# Configuración ${aspectRatio} para Retos de Olimpiada (M.C.D. 24)
config.pixel_width = ${pixelW}
config.pixel_height = ${pixelH}
config.frame_width = ${frameW}
config.frame_height = ${frameH}

class OlimpadaMCDShort(Scene):
    def construct(self):
        self.camera.background_color = "#FDFBF7"

        # Encabezado de Reto en Y = ${isVertical ? '5.60' : '3.6'}
        badge_top = RoundedRectangle(corner_radius=0.18, width=${isVertical ? '7.2' : '9.0'}, height=0.80, stroke_color="#7B241C", stroke_width=2.5, fill_color="#FDEDEC", fill_opacity=0.95).move_to(np.array([-0.2, ${isVertical ? '5.60' : '3.6'}, 0]))
        txt_top = Text("OLIMPIADA MATEMÁTICA · RETO REAL", font_size=24, weight=BOLD, color="#7B241C").move_to(badge_top.get_center())

        # Problema Central en Y = ${isVertical ? '4.20' : '2.3'}
        card_prob = RoundedRectangle(corner_radius=0.24, width=${isVertical ? '7.2' : '9.0'}, height=1.60, stroke_color="#2C3E50", stroke_width=2.6, fill_color="#FFFFFF", fill_opacity=0.98).move_to(np.array([-0.2, ${isVertical ? '4.20' : '2.3'}, 0]))
        prob_title = Text("Determinar el Máximo Común Divisor:", font_size=23, weight=BOLD, color="#1B4F72").next_to(card_prob.get_top(), DOWN, buff=0.25)
        prob_math = MathTex(r"3^3 - 3, \\; 5^5 - 5, \\; \\dots, \\; 2007^{2007} - 2007", font_size=32, color="#1B2631").next_to(prob_title, DOWN, buff=0.25)

        # Tarjeta de Deducción Inferior (${isVertical ? 'Y = -1.80' : 'Y = -1.50'}) (34 pt)
        card_ded = RoundedRectangle(corner_radius=0.28, width=${isVertical ? '7.2' : '9.0'}, height=${isVertical ? '4.20' : '3.00'}, stroke_color="#2C3E50", stroke_width=2.8, fill_color="#FFFFFF", fill_opacity=0.98).move_to(np.array([-0.2, ${isVertical ? '-1.80' : '-1.50'}, 0]))
        ded_title = Text("INGENIERÍA INVERSA POLINÓMICA", font_size=24, weight=BOLD, color="#1B4F72").move_to(np.array([-0.2, 0.0, 0]))
        step1 = MathTex(r"n^n - n = n(n^{n-1} - 1)", font_size=34, color="#C0392B").move_to(np.array([-0.2, ${isVertical ? '-0.90' : '-1.1'}, 0]))
        step2 = MathTex(r"n^2 - 1 = (n - 1)(n + 1)", font_size=34, color="#D35400").move_to(np.array([-0.2, ${isVertical ? '-1.80' : '-1.8'}, 0]))
        step3 = MathTex(r"\\mathbf{M.C.D.} = \\mathbf{24}", font_size=${isVertical ? 52 : 44}, color="#196F3D").move_to(np.array([-0.2, ${isVertical ? '-2.90' : '-2.5'}, 0]))

        self.play(FadeIn(badge_top), FadeIn(txt_top), FadeIn(card_prob), FadeIn(prob_title), Write(prob_math))
        self.play(FadeIn(card_ded), FadeIn(ded_title), Write(step1), Write(step2))
        self.play(Write(step3))
        self.wait(2)
`
    }
  }, [selectedTemplate, quadCalculations, aspectRatio])

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="rounded-2xl border border-amber-500/30 bg-gradient-to-r from-amber-950/40 via-slate-900 to-indigo-950/40 p-6 shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-amber-400/40 bg-amber-400/10 px-3 py-1 text-xs font-semibold text-amber-300 mb-2">
              <Flame className="h-4 w-4 text-amber-400 animate-pulse" />
              <span>NUEVO MOTOR · CLONADOR &amp; OPTIMIZADOR VIRAL (9:16)</span>
            </div>
            <h2 className="text-2xl font-bold text-white flex items-center gap-2">
              Clonador de Videos Virales Matemáticos
            </h2>
            <p className="mt-1 text-sm text-slate-300 max-w-2xl">
              Convierte cualquier problema o video viral en un reel vertical <strong>9:16 de alta retención</strong>. 
              Aplica automáticamente la escala tipográfica gigante (34 pt), safe zones de TikTok/Shorts y la estructura de 9 actos sin apretujamientos.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="rounded-xl border border-emerald-500/40 bg-emerald-500/10 px-4 py-2 text-xs font-bold text-emerald-300 flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-400" />
              <span>Calibrado con 2 Videos Ganadores (+2k vistas)</span>
            </span>
          </div>
        </div>
      </div>

      {/* Grid Principal: Configuración a la izquierda, Output a la derecha */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* COLUMNA IZQUIERDA: Selector de Plantilla y Parámetros */}
        <div className="lg:col-span-5 space-y-6">
          
          {/* 1. Selector de Plantilla Viral */}
          <div className="rounded-xl border border-slate-700 bg-slate-800/90 p-5 space-y-4">
            <label className="text-sm font-bold text-white flex items-center gap-2">
              <Layers className="h-4 w-4 text-blue-400" />
              <span>1. Selecciona el Modelo Viral de Referencia</span>
            </label>

            <div className="grid grid-cols-1 gap-2.5">
              <button
                type="button"
                onClick={() => setSelectedTemplate('poshenloh')}
                className={`rounded-xl border p-3.5 text-left transition flex items-start gap-3 ${
                  selectedTemplate === 'poshenloh'
                    ? 'border-amber-400 bg-amber-500/15 shadow-md shadow-amber-950/40'
                    : 'border-slate-700 bg-slate-900/60 hover:border-slate-600'
                }`}
              >
                <div className={`p-2 rounded-lg ${selectedTemplate === 'poshenloh' ? 'bg-amber-400 text-slate-950' : 'bg-slate-800 text-amber-400'}`}>
                  ⚡
                </div>
                <div>
                  <div className="text-xs font-bold text-white flex items-center gap-2">
                    <span>Modelo 1: Simetría Parabólica (Po-Shen Loh)</span>
                    <span className="text-[10px] bg-amber-400/20 text-amber-300 px-1.5 py-0.5 rounded font-mono">Ganador</span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1">
                    Ecuaciones cuadráticas, corte en (0,c), profundidad del vértice u², sin fórmula general ni aspas.
                  </p>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setSelectedTemplate('mcd_olimpiada')}
                className={`rounded-xl border p-3.5 text-left transition flex items-start gap-3 ${
                  selectedTemplate === 'mcd_olimpiada'
                    ? 'border-blue-400 bg-blue-500/15 shadow-md shadow-blue-950/40'
                    : 'border-slate-700 bg-slate-900/60 hover:border-slate-600'
                }`}
              >
                <div className={`p-2 rounded-lg ${selectedTemplate === 'mcd_olimpiada' ? 'bg-blue-400 text-slate-950' : 'bg-slate-800 text-blue-400'}`}>
                  🏆
                </div>
                <div>
                  <div className="text-xs font-bold text-white flex items-center gap-2">
                    <span>Modelo 2: Reto de Olimpiada (M.C.D. 24)</span>
                    <span className="text-[10px] bg-blue-400/20 text-blue-300 px-1.5 py-0.5 rounded font-mono">Ganador</span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1">
                    Ingeniería inversa polinómica, techo límite, diferencia de cuadrados y enteros consecutivos.
                  </p>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setSelectedTemplate('origen_formula')}
                className={`rounded-xl border p-3.5 text-left transition flex items-start gap-3 ${
                  selectedTemplate === 'origen_formula'
                    ? 'border-emerald-400 bg-emerald-500/15 shadow-md shadow-emerald-950/40'
                    : 'border-slate-700 bg-slate-900/60 hover:border-slate-600'
                }`}
              >
                <div className={`p-2 rounded-lg ${selectedTemplate === 'origen_formula' ? 'bg-emerald-400 text-slate-950' : 'bg-slate-800 text-emerald-400'}`}>
                  🧩
                </div>
                <div>
                  <div className="text-xs font-bold text-white flex items-center gap-2">
                    <span>Modelo 3: Origen Geométrico Fórmula General</span>
                    <span className="text-[10px] bg-emerald-400/20 text-emerald-300 px-1.5 py-0.5 rounded font-mono">Matemática</span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1">
                    El rompecabezas de hace 1.000 años: completando el cuadrado x² + (b/a)x con la esquina dorada b²/4a².
                  </p>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setSelectedTemplate('mru_ciencia')}
                className={`rounded-xl border p-3.5 text-left transition flex items-start gap-3 ${
                  selectedTemplate === 'mru_ciencia'
                    ? 'border-cyan-400 bg-cyan-500/15 shadow-md shadow-cyan-950/40'
                    : 'border-slate-700 bg-slate-900/60 hover:border-slate-600'
                }`}
              >
                <div className={`p-2 rounded-lg ${selectedTemplate === 'mru_ciencia' ? 'bg-cyan-400 text-slate-950' : 'bg-slate-800 text-cyan-400'}`}>
                  🚂
                </div>
                <div>
                  <div className="text-xs font-bold text-white flex items-center gap-2">
                    <span>Modelo 4: Zénit Ciencia — M.R.U. Sin Triangulito</span>
                    <span className="text-[10px] bg-cyan-400/20 text-cyan-300 px-1.5 py-0.5 rounded font-mono">Zénit Ciencia</span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1">
                    Física visual: velocidad como bloques por segundo, distancia como vagones de tren y rectángulo de área d = v × t.
                  </p>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setSelectedTemplate('binomio_cuadrado')}
                className={`rounded-xl border p-3.5 text-left transition flex items-start gap-3 ${
                  selectedTemplate === 'binomio_cuadrado'
                    ? 'border-orange-400 bg-orange-500/15 shadow-md shadow-orange-950/40'
                    : 'border-slate-700 bg-slate-900/60 hover:border-slate-600'
                }`}
              >
                <div className={`p-2 rounded-lg ${selectedTemplate === 'binomio_cuadrado' ? 'bg-orange-400 text-slate-950' : 'bg-slate-800 text-orange-400'}`}>
                  📐
                </div>
                <div>
                  <div className="text-xs font-bold text-white flex items-center gap-2">
                    <span>Modelo 5: Secreto Geométrico de (a + b)² (2 Voces)</span>
                    <span className="text-[10px] bg-orange-400/20 text-orange-300 px-1.5 py-0.5 rounded font-mono">Dual Voice</span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1">
                    Demostración visual de productos notables con voces alternadas (Hombre + Mujer): por qué (a+b)² = a² + 2ab + b².
                  </p>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setSelectedTemplate('custom')}
                className={`rounded-xl border p-3.5 text-left transition flex items-start gap-3 ${
                  selectedTemplate === 'custom'
                    ? 'border-purple-400 bg-purple-500/15 shadow-md shadow-purple-950/40'
                    : 'border-slate-700 bg-slate-900/60 hover:border-slate-600'
                }`}
              >
                <div className={`p-2 rounded-lg ${selectedTemplate === 'custom' ? 'bg-purple-400 text-slate-950' : 'bg-slate-800 text-purple-400'}`}>
                  ✨
                </div>
                <div>
                  <div className="text-xs font-bold text-white">
                    <span>Modelo 4: Clonador Libre (Cualquier Problema / Link)</span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1">
                    Introduce cualquier ecuación o transcripción para adaptarla a la estructura de 9 actos vertical.
                  </p>
                </div>
              </button>
            </div>
          </div>

          {/* 2. Selector de Aspect Ratio (Con 9:16 como opción ganadora destacada) */}
          <div className="rounded-xl border border-slate-700 bg-slate-800/90 p-5 space-y-3">
            <label className="text-sm font-bold text-white flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Smartphone className="h-4 w-4 text-emerald-400" />
                <span>2. Formato de Salida y Safe Zones</span>
              </span>
              <span className="text-[10px] uppercase font-bold text-emerald-400 bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-500/30">
                Optimizado para Algoritmo
              </span>
            </label>

            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setAspectRatio('9:16')}
                className={`rounded-xl border p-3 text-center transition ${
                  aspectRatio === '9:16'
                    ? 'border-emerald-400 bg-emerald-500/20 text-white shadow-md shadow-emerald-950/50'
                    : 'border-slate-700 bg-slate-900/70 text-slate-400 hover:border-slate-600'
                }`}
              >
                <div className="mx-auto w-4 h-7 border-2 border-current rounded-sm mb-1.5 flex items-center justify-center">
                  <div className="w-1.5 h-0.5 bg-current rounded-full" />
                </div>
                <div className="text-xs font-bold">9:16 Reels</div>
                <div className="text-[10px] text-emerald-300 font-semibold mt-0.5">TikTok/Shorts</div>
              </button>

              <button
                type="button"
                onClick={() => setAspectRatio('16:9')}
                className={`rounded-xl border p-3 text-center transition ${
                  aspectRatio === '16:9'
                    ? 'border-blue-400 bg-blue-500/20 text-white shadow-md'
                    : 'border-slate-700 bg-slate-900/70 text-slate-400 hover:border-slate-600'
                }`}
              >
                <div className="mx-auto w-7 h-4 border-2 border-current rounded-sm mb-1.5" />
                <div className="text-xs font-bold">16:9 HD</div>
                <div className="text-[10px] text-slate-400 mt-0.5">YouTube / PC</div>
              </button>

              <button
                type="button"
                onClick={() => setAspectRatio('1:1')}
                className={`rounded-xl border p-3 text-center transition ${
                  aspectRatio === '1:1'
                    ? 'border-purple-400 bg-purple-500/20 text-white shadow-md'
                    : 'border-slate-700 bg-slate-900/70 text-slate-400 hover:border-slate-600'
                }`}
              >
                <div className="mx-auto w-5 h-5 border-2 border-current rounded-sm mb-1.5" />
                <div className="text-xs font-bold">1:1 Feed</div>
                <div className="text-[10px] text-slate-400 mt-0.5">Instagram</div>
              </button>
            </div>

            {aspectRatio === '9:16' && (
              <div className="rounded-lg border border-emerald-500/30 bg-emerald-950/30 p-2.5 text-[11px] text-emerald-200 space-y-1">
                <p className="font-semibold flex items-center gap-1.5">
                  <Check className="h-3.5 w-3.5 text-emerald-400" />
                  Reglas de Oro 9:16 aplicadas:
                </p>
                <ul className="list-disc pl-4 space-y-0.5 text-emerald-300/90 text-[10px]">
                  <li>Ecuación elevada a Y = 5.48 con tipografía gigante (54 pt).</li>
                  <li>Badges de variables flotantes arriba en Y = 6.35 (28 pt).</li>
                  <li>Gráfica amplia de 5.4u de altura con corte en (0, c) visible.</li>
                  <li>Deducción inferior activa en 34 pt (libre de botones de TikTok).</li>
                </ul>
              </div>
            )}
          </div>

          {/* 3. Parámetros del Modelo Seleccionado */}
          <div className="rounded-xl border border-slate-700 bg-slate-800/90 p-5 space-y-4">
            <label className="text-sm font-bold text-white flex items-center justify-between">
              <span>3. Parámetros del Ejercicio</span>
              {selectedTemplate === 'poshenloh' && (
                <span className="text-xs font-mono text-cyan-300 font-bold">
                  {quadCalculations.eqDisplay}
                </span>
              )}
            </label>

            {selectedTemplate === 'poshenloh' && (
              <div className="space-y-3">
                {/* Presets Rápidos */}
                <div>
                  <span className="text-[11px] text-slate-400 block mb-1">Cargar caso de prueba:</span>
                  <div className="grid grid-cols-2 gap-1.5">
                    {QUADRATIC_PRESETS.map((preset, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => {
                          setQuadA(preset.a)
                          setQuadB(preset.b)
                          setQuadC(preset.c)
                        }}
                        className={`text-left rounded-lg border px-2.5 py-1.5 text-[11px] transition ${
                          quadA === preset.a && quadB === preset.b && quadC === preset.c
                            ? 'border-amber-400 bg-amber-500/20 text-amber-200'
                            : 'border-slate-700 bg-slate-900/60 text-slate-300 hover:border-slate-500'
                        }`}
                      >
                        <div className="font-mono font-bold">{preset.label.split(' ')[0]}</div>
                        <div className="text-[9px] text-slate-400 truncate">{preset.description}</div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Sliders / Inputs para a, b, c */}
                <div className="grid grid-cols-3 gap-2.5 pt-2 border-t border-slate-700">
                  <div>
                    <label className="block text-[11px] text-blue-300 font-bold mb-1">Coef. a</label>
                    <input
                      type="number"
                      value={quadA}
                      onChange={(e) => setQuadA(Number(e.target.value))}
                      className="w-full rounded border border-blue-500/50 bg-slate-900 px-2.5 py-1.5 text-center text-sm font-bold text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-red-300 font-bold mb-1">Coef. b</label>
                    <input
                      type="number"
                      value={quadB}
                      onChange={(e) => setQuadB(Number(e.target.value))}
                      className="w-full rounded border border-red-500/50 bg-slate-900 px-2.5 py-1.5 text-center text-sm font-bold text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-amber-300 font-bold mb-1">Coef. c</label>
                    <input
                      type="number"
                      value={quadC}
                      onChange={(e) => setQuadC(Number(e.target.value))}
                      className="w-full rounded border border-amber-500/50 bg-slate-900 px-2.5 py-1.5 text-center text-sm font-bold text-white"
                    />
                  </div>
                </div>

                {/* Métricas Calculadas en Tiempo Real */}
                <div className="rounded-lg border border-slate-700 bg-slate-900/80 p-3 text-xs space-y-1.5">
                  <div className="flex justify-between text-slate-300">
                    <span>Centro del espejo (x₀):</span>
                    <strong className="text-blue-300 font-mono font-bold">{quadCalculations.x0}</strong>
                  </div>
                  <div className="flex justify-between text-slate-300">
                    <span>Profundidad (u²):</span>
                    <strong className="text-amber-300 font-mono font-bold">{quadCalculations.uSquared}</strong>
                  </div>
                  <div className="flex justify-between text-slate-300">
                    <span>Distancia simétrica (u):</span>
                    <strong className="text-emerald-300 font-mono font-bold">{quadCalculations.u}</strong>
                  </div>
                  <div className="flex justify-between text-slate-300 pt-1 border-t border-slate-800">
                    <span>Raíces finales (x₁, x₂):</span>
                    <strong className="text-white font-mono font-bold">{quadCalculations.r1} y {quadCalculations.r2}</strong>
                  </div>
                </div>
              </div>
            )}

            {selectedTemplate === 'mcd_olimpiada' && (
              <div className="space-y-3">
                <div>
                  <label className="block text-xs text-slate-300 mb-1">Expresión de la serie de olimpiada</label>
                  <input
                    type="text"
                    value={mcdExpression}
                    onChange={(e) => setMcdExpression(e.target.value)}
                    className="w-full rounded border border-slate-600 bg-slate-900 px-3 py-2 text-xs font-mono text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-300 mb-1">Techo del primer término (3³ - 3 = 24)</label>
                  <input
                    type="number"
                    value={mcdTecho}
                    onChange={(e) => setMcdTecho(Number(e.target.value))}
                    className="w-full rounded border border-slate-600 bg-slate-900 px-3 py-2 text-xs font-mono text-white"
                  />
                </div>
              </div>
            )}

            {selectedTemplate === 'custom' && (
              <div className="space-y-3">
                <div>
                  <label className="block text-xs text-slate-300 mb-1">Título del Reel / Short</label>
                  <input
                    type="text"
                    value={customTitle}
                    onChange={(e) => setCustomTitle(e.target.value)}
                    className="w-full rounded border border-slate-600 bg-slate-900 px-3 py-2 text-xs text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-300 mb-1">Ecuación o Reto Central</label>
                  <input
                    type="text"
                    value={customProblem}
                    onChange={(e) => setCustomProblem(e.target.value)}
                    className="w-full rounded border border-slate-600 bg-slate-900 px-3 py-2 text-xs font-mono text-white"
                  />
                </div>
              </div>
            )}

            {/* Botón de Enviar al Generador de Videos */}
            <div className="pt-2">
              <button
                type="button"
                onClick={() => {
                  const titleToSend = selectedTemplate === 'poshenloh'
                    ? `Método Po-Shen Loh: ${quadCalculations.eqDisplay}`
                    : selectedTemplate === 'mcd_olimpiada'
                    ? 'Reto de Olimpiada: M.C.D. de Potencias'
                    : customTitle
                  const contentToSend = selectedTemplate === 'poshenloh'
                    ? quadCalculations.eqDisplay
                    : selectedTemplate === 'mcd_olimpiada'
                    ? mcdExpression
                    : customProblem

                  onSendToVideoStudio?.(titleToSend, contentToSend)
                }}
                className="w-full rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 py-3 text-xs font-bold text-slate-950 transition flex items-center justify-center gap-2 shadow-lg shadow-amber-950/40"
              >
                <Play className="h-4 w-4 fill-current" />
                <span>Enviar este Ejercicio al Generador de Video</span>
              </button>
            </div>
          </div>
        </div>

        {/* COLUMNA DERECHA: Salidas Virales (Mockup, Copy TikTok, YouTube y Código Manim) */}
        <div className="lg:col-span-7 space-y-6">
          
          {/* Tabs de Resultados */}
          <div className="rounded-xl border border-slate-700 bg-slate-800/90 overflow-hidden shadow-xl">
            <div className="flex flex-wrap border-b border-slate-700 bg-slate-900/80 px-4 pt-3 gap-2">
              <span className="text-xs font-bold text-slate-400 py-2 mr-2">Contenido Generado:</span>
              <button
                type="button"
                onClick={() => setActiveOutputTab('all')}
                className={`pb-2 text-xs font-bold flex items-center gap-1.5 transition ${
                  activeOutputTab === 'all'
                    ? 'border-b-2 border-amber-400 text-amber-300'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Layers className="h-3.5 w-3.5" />
                <span>Todo el Pack</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveOutputTab('tiktok')}
                className={`pb-2 text-xs font-bold flex items-center gap-1.5 transition ${
                  activeOutputTab === 'tiktok'
                    ? 'border-b-2 border-emerald-400 text-emerald-300'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <FileText className="h-3.5 w-3.5" />
                <span>Copy TikTok (Unicode)</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveOutputTab('youtube')}
                className={`pb-2 text-xs font-bold flex items-center gap-1.5 transition ${
                  activeOutputTab === 'youtube'
                    ? 'border-b-2 border-red-400 text-red-300'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Share2 className="h-3.5 w-3.5" />
                <span>YouTube Shorts</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveOutputTab('cover')}
                className={`pb-2 text-xs font-bold flex items-center gap-1.5 transition ${
                  activeOutputTab === 'cover'
                    ? 'border-b-2 border-amber-400 text-amber-300'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <ImageIcon className="h-3.5 w-3.5" />
                <span>Portada 9:16</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveOutputTab('manim')}
                className={`pb-2 text-xs font-bold flex items-center gap-1.5 transition ${
                  activeOutputTab === 'manim'
                    ? 'border-b-2 border-cyan-400 text-cyan-300'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Code2 className="h-3.5 w-3.5" />
                <span>Script Manim</span>
              </button>
            </div>

            <div className="p-5 space-y-5">
              
              {/* Box Copy TikTok */}
              {(activeOutputTab === 'all' || activeOutputTab === 'tiktok') && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-white flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                      Copy Optimizado para TikTok (100% Caracteres Seguros, Cero LaTeX Roto)
                    </span>
                    <button
                      type="button"
                      onClick={() => copyToClipboard(tiktokCopy, 'tiktok')}
                      className="rounded-lg border border-amber-500/50 bg-amber-500/10 hover:bg-amber-500/20 px-3 py-1.5 text-xs font-semibold text-amber-300 transition flex items-center gap-1.5"
                    >
                      {copiedKey === 'tiktok' ? (
                        <>
                          <Check className="h-3.5 w-3.5 text-emerald-400" />
                          <span>¡Copiado!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="h-3.5 w-3.5" />
                          <span>Copiar Copy</span>
                        </>
                      )}
                    </button>
                  </div>

                  <div className="relative rounded-xl border border-slate-700 bg-slate-950 p-4 text-xs font-mono text-slate-200 whitespace-pre-wrap max-h-72 overflow-y-auto leading-relaxed">
                    {tiktokCopy}
                  </div>
                </div>
              )}

              {/* Box YouTube Shorts */}
              {(activeOutputTab === 'all' || activeOutputTab === 'youtube') && (
                <div className="rounded-xl border border-slate-700/80 bg-slate-900/60 p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-red-300 flex items-center gap-1.5">
                      📺 Título YouTube Shorts (Alto CTR):
                    </span>
                    <button
                      type="button"
                      onClick={() => copyToClipboard(youtubeCopy.title, 'yt-title')}
                      className="text-[11px] text-slate-400 hover:text-slate-200 flex items-center gap-1"
                    >
                      {copiedKey === 'yt-title' ? 'Copiado' : 'Copiar título'}
                    </button>
                  </div>
                  <p className="text-xs font-semibold text-white bg-slate-950 p-2.5 rounded border border-slate-800">
                    {youtubeCopy.title}
                  </p>

                  <div className="pt-1">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-bold text-slate-300">Descripción estructurada:</span>
                      <button
                        type="button"
                        onClick={() => copyToClipboard(youtubeCopy.description, 'yt-desc')}
                        className="text-[11px] text-slate-400 hover:text-slate-200 flex items-center gap-1"
                      >
                        {copiedKey === 'yt-desc' ? 'Copiada' : 'Copiar descripción'}
                      </button>
                    </div>
                    <pre className="text-xs text-slate-300 bg-slate-950 p-2.5 rounded border border-slate-800 whitespace-pre-wrap font-sans max-h-40 overflow-y-auto">
                      {youtubeCopy.description}
                    </pre>
                  </div>
                </div>
              )}

              {/* Miniatura / Portada 9:16 Generada */}
              {(activeOutputTab === 'all' || activeOutputTab === 'cover') && (
                <div className="rounded-xl border border-slate-700 bg-slate-900/60 p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-white flex items-center gap-2">
                      <ImageIcon className="h-4 w-4 text-amber-400" />
                      <span>Portada / Miniatura Viral Vertical (1080×1920)</span>
                    </span>
                    <span className="text-[10px] text-amber-300 font-mono">{coverInfo.filename}</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
                    <div className="relative aspect-[9/16] max-h-64 mx-auto rounded-xl overflow-hidden border-2 border-amber-500/50 shadow-2xl bg-slate-950 group">
                      {coverInfo.src ? (
                        <img
                          src={coverInfo.src}
                          alt="Portada Viral 9:16"
                          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                          onError={(e) => {
                            (e.target as HTMLElement).style.display = 'none'
                          }}
                        />
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center p-4 text-center bg-gradient-to-b from-slate-900 to-indigo-950">
                          <span className="text-amber-400 text-lg font-black">{coverInfo.headline}</span>
                          <span className="text-cyan-300 text-xs font-bold mt-1">{coverInfo.subheadline}</span>
                        </div>
                      )}
                      <div className="absolute top-2 left-2 bg-slate-900/90 backdrop-blur-md rounded-md px-2 py-0.5 text-[10px] font-bold text-amber-300 border border-amber-400/40">
                        {aspectRatio} · 1080×1920
                      </div>
                    </div>

                    <div className="space-y-2 text-xs text-slate-300">
                      <div className="inline-block rounded bg-amber-400/10 border border-amber-400/30 px-2 py-0.5 text-[10px] font-bold text-amber-300">
                        {coverInfo.badge}
                      </div>
                      <p className="font-semibold text-white">{coverInfo.headline}</p>
                      <p className="text-[11px] text-cyan-300 font-mono">{coverInfo.subheadline}</p>
                      <ul className="list-disc pl-4 space-y-1 text-slate-400 text-[11px] pt-1">
                        {coverInfo.bullets.map((b, i) => (
                          <li key={i}>{b}</li>
                        ))}
                      </ul>
                      {coverInfo.localPath && (
                        <div className="pt-2">
                          <button
                            type="button"
                            onClick={() => copyToClipboard(coverInfo.localPath, 'cover-path')}
                            className="rounded-lg border border-slate-700 bg-slate-950 hover:bg-slate-800 px-3 py-1.5 text-[11px] text-amber-300 font-mono flex items-center gap-1.5 transition"
                          >
                            <Copy className="h-3 w-3" />
                            <span>{copiedKey === 'cover-path' ? '¡Ruta copiada al portapapeles!' : 'Copiar ruta local de la imagen'}</span>
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Código Manim Generado */}
              {(activeOutputTab === 'all' || activeOutputTab === 'manim') && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                      <Code2 className="h-4 w-4 text-cyan-400" />
                      <span>Script Manim 2.2 Calibrado ({aspectRatio}):</span>
                    </span>
                    <button
                      type="button"
                      onClick={() => copyToClipboard(manimCodeSnippet, 'manim-code')}
                      className="text-xs font-semibold text-cyan-400 hover:text-cyan-300 flex items-center gap-1"
                    >
                      {copiedKey === 'manim-code' ? '¡Código Copiado!' : 'Copiar Código Python'}
                    </button>
                  </div>
                  <pre className="rounded-xl border border-slate-700 bg-slate-950 p-3.5 text-[11px] font-mono text-cyan-200 overflow-x-auto max-h-56 leading-relaxed">
                    {manimCodeSnippet}
                  </pre>
                </div>
              )}

            </div>
          </div>

        </div>

      </div>
    </div>
  )
}
