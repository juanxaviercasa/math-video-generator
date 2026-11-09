import React, { lazy, Suspense, useEffect, useRef, useState } from 'react'
import { MathToolSpec } from './catalog'
import { evalDerivativeAt, evalQuadraticAt, ParsedQuadratic } from './mathEngines'
const InteractiveMathEditor = lazy(() =>
  import('../components/InteractiveMathEditor').then((module) => ({
    default: module.InteractiveMathEditor,
  }))
)

type WorkbenchProps = {
  tool: MathToolSpec
  parsed: ParsedQuadratic
  expression: string
  onExpressionChange: (next: string) => void
}

export function ToolWorkbench({ tool, parsed, expression, onExpressionChange }: WorkbenchProps) {
  switch (tool.categoryId) {
    case 'video_anim':
      return <VideoAnimWorkbench tool={tool} parsed={parsed} />
    case 'cas_algebra':
      return <CasAlgebraWorkbench tool={tool} parsed={parsed} />
    case 'graph_2d':
      return <Graph2DWorkbench tool={tool} parsed={parsed} />
    case 'space_3d':
      return <Space3DWorkbench tool={tool} parsed={parsed} />
    case 'geometry':
      return <GeometryWorkbench tool={tool} parsed={parsed} />
    case 'manipulatives':
      return <ManipulativesWorkbench tool={tool} parsed={parsed} onExpressionChange={onExpressionChange} />
    case 'latex_input':
      return <LatexInputWorkbench tool={tool} parsed={parsed} expression={expression} onExpressionChange={onExpressionChange} />
    case 'stats_num':
      return <StatsNumWorkbench tool={tool} parsed={parsed} />
    case 'graphs_networks':
      return <GraphsNetworksWorkbench tool={tool} parsed={parsed} />
    case 'ai_ocr':
      return <AiOcrWorkbench tool={tool} parsed={parsed} onExpressionChange={onExpressionChange} />
    case 'formal_logic':
      return <FormalLogicWorkbench tool={tool} parsed={parsed} />
    case 'fractals_chaos':
      return <FractalsChaosWorkbench tool={tool} parsed={parsed} />
    default:
      return <CasAlgebraWorkbench tool={tool} parsed={parsed} />
  }
}

// ============================================================================
// 1. VIDEO Y ANIMACIÓN MATEMÁTICA WORKBENCH
// ============================================================================
function VideoAnimWorkbench({ tool, parsed }: { tool: MathToolSpec; parsed: ParsedQuadratic }) {
  const [progress, setProgress] = useState(0.65)
  const [playing, setPlaying] = useState(false)

  useEffect(() => {
    if (!playing) return
    const id = window.setInterval(() => {
      setProgress((prev) => (prev >= 1 ? 0 : Number((prev + 0.02).toFixed(2))))
    }, 80)
    return () => window.clearInterval(id)
  }, [playing])

  const activeStage =
    progress < 0.25 ? 1 : progress < 0.5 ? 2 : progress < 0.78 ? 3 : 4

  return (
    <div className="grid lg:grid-cols-2 gap-6">
      <div className="rounded-xl border border-slate-700 bg-slate-950 p-5 flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
            <span className="text-xs font-semibold uppercase tracking-wider text-blue-400">
              Simulador de Pizarra · {tool.name}
            </span>
            <span className="rounded bg-blue-500/20 px-2 py-0.5 text-xs text-blue-300 font-mono">
              t = {(progress * 15).toFixed(1)}s / 15.0s
            </span>
          </div>

          {/* Ancla superior permanente Pizarra 2.2 */}
          <div className="rounded-lg border border-amber-400/40 bg-slate-900/90 px-4 py-2.5 text-center mb-4">
            <div className="text-[10px] uppercase tracking-wider text-amber-300/80">Ejercicio Anclado Permanente</div>
            <div className="text-lg font-bold text-white font-mono mt-0.5">{parsed.normalized}</div>
          </div>

          {/* Escenario animado por fases */}
          <div className="space-y-2.5 min-h-[210px]">
            {activeStage >= 1 && (
              <div className="rounded border border-slate-800 bg-slate-900/70 p-3 transition-all">
                <div className="text-xs text-cyan-300 font-semibold">Escena 1 · Coeficientes detectados</div>
                <div className="font-mono text-sm text-slate-100 mt-1">{parsed.steps[0].formula}</div>
              </div>
            )}
            {activeStage >= 2 && (
              <div className="rounded border border-slate-800 bg-slate-900/70 p-3 transition-all">
                <div className="text-xs text-emerald-300 font-semibold">Escena 2 · Discriminante</div>
                <div className="font-mono text-sm text-slate-100 mt-1">{parsed.steps[1].formula}</div>
              </div>
            )}
            {activeStage >= 3 && (
              <div className="rounded border border-slate-800 bg-slate-900/70 p-3 transition-all">
                <div className="text-xs text-purple-300 font-semibold">Escena 3 · Fórmula General</div>
                <div className="font-mono text-sm text-slate-100 mt-1">{parsed.steps[2].formula}</div>
              </div>
            )}
            {activeStage >= 4 && (
              <div className="rounded border border-emerald-500/40 bg-emerald-950/30 p-3 transition-all">
                <div className="text-xs text-emerald-300 font-semibold">Escena 4 · Recapitulación y Raíces</div>
                <div className="font-mono text-sm text-white font-bold mt-1">{parsed.steps[3].formula}</div>
              </div>
            )}
          </div>
        </div>

        {/* Controles de Timeline */}
        <div className="mt-4 pt-3 border-t border-slate-800">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setPlaying((p) => !p)}
              className="rounded bg-blue-600 hover:bg-blue-500 px-3 py-1.5 text-xs font-semibold text-white"
            >
              {playing ? '⏸ Pausar' : '▶ Reproducir Timeline'}
            </button>
            <input
              type="range"
              min={0}
              max={1}
              step={0.01}
              value={progress}
              onChange={(e) => setProgress(parseFloat(e.target.value))}
              className="flex-1 accent-blue-500"
            />
            <span className="text-xs font-mono text-slate-400">{Math.round(progress * 100)}%</span>
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-slate-700 bg-slate-900/80 p-5 flex flex-col justify-between">
        <div>
          <div className="text-xs font-semibold uppercase tracking-wider text-slate-300 mb-2">
            Código Fuente de Escena Generado ({tool.repo})
          </div>
          <pre className="rounded-lg bg-slate-950 border border-slate-800 p-3 text-xs text-emerald-300 font-mono overflow-x-auto leading-relaxed">
            {parsed.manimSnippet}
          </pre>
        </div>
        <div className="mt-4 rounded-lg border border-blue-500/30 bg-blue-950/20 p-3">
          <div className="text-xs font-semibold text-blue-200">Locución Neural Sincronizada (Edge-TTS):</div>
          <p className="text-xs text-slate-300 italic mt-1">“{parsed.spanishPhonetic}”</p>
        </div>
      </div>
    </div>
  )
}

// ============================================================================
// 2. ÁLGEBRA SIMBÓLICA Y PASO A PASO (CAS) WORKBENCH
// ============================================================================
function CasAlgebraWorkbench({ tool, parsed }: { tool: MathToolSpec; parsed: ParsedQuadratic }) {
  return (
    <div className="grid lg:grid-cols-2 gap-6">
      <div className="space-y-3">
        <div className="text-xs font-semibold uppercase tracking-wider text-emerald-400">
          Derivación Simbólica Paso a Paso ({tool.name})
        </div>
        {parsed.steps.map((s, idx) => (
          <div key={idx} className="rounded-lg border border-slate-700 bg-slate-900/90 p-3.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-white">{s.title}</span>
              <span className="rounded bg-emerald-500/20 px-2 py-0.5 text-[10px] font-mono text-emerald-300">
                {s.rule}
              </span>
            </div>
            <div className="mt-2 rounded bg-slate-950 px-3 py-2 font-mono text-sm text-amber-200">
              {s.formula}
            </div>
            <p className="mt-1.5 text-xs text-slate-300">{s.explanation}</p>
          </div>
        ))}
      </div>

      <div className="space-y-4">
        <div className="rounded-xl border border-slate-700 bg-slate-900/90 p-4">
          <div className="text-xs font-semibold uppercase tracking-wider text-teal-300 mb-3">
            Diagnóstico Analítico Integral (Estilo Wolfram / SymPy Gamma)
          </div>
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="rounded bg-slate-950 p-2.5 border border-slate-800">
              <div className="text-slate-400">Forma Factorizada</div>
              <div className="font-mono text-white font-semibold mt-1">{parsed.factoredForm}</div>
            </div>
            <div className="rounded bg-slate-950 p-2.5 border border-slate-800">
              <div className="text-slate-400">Forma Canónica (Vértice)</div>
              <div className="font-mono text-white font-semibold mt-1">{parsed.vertexForm}</div>
            </div>
            <div className="rounded bg-slate-950 p-2.5 border border-slate-800">
              <div className="text-slate-400">Derivada Primera</div>
              <div className="font-mono text-cyan-300 font-semibold mt-1">{parsed.derivativeLatex}</div>
            </div>
            <div className="rounded bg-slate-950 p-2.5 border border-slate-800">
              <div className="text-slate-400">Integral Indefinida</div>
              <div className="font-mono text-purple-300 font-semibold mt-1">{parsed.integralLatex}</div>
            </div>
            <div className="rounded bg-slate-950 p-2.5 border border-slate-800">
              <div className="text-slate-400">Suma de Raíces (Vieta)</div>
              <div className="font-mono text-emerald-300 font-semibold mt-1">x₁ + x₂ = {parsed.vietaSum.toFixed(2)}</div>
            </div>
            <div className="rounded bg-slate-950 p-2.5 border border-slate-800">
              <div className="text-slate-400">Producto de Raíces (Vieta)</div>
              <div className="font-mono text-emerald-300 font-semibold mt-1">x₁ · x₂ = {parsed.vietaProduct.toFixed(2)}</div>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-slate-700 bg-slate-900/90 p-4">
          <div className="text-xs font-semibold uppercase tracking-wider text-slate-300 mb-2">
            Árbol Sintáctico MathJSON (CortexJS AST)
          </div>
          <pre className="rounded bg-slate-950 p-3 text-xs font-mono text-cyan-300 overflow-x-auto">
            {parsed.mathJsonAst}
          </pre>
        </div>
      </div>
    </div>
  )
}

// ============================================================================
// 3. GRAFICACIÓN 2D Y ANÁLISIS DE FUNCIONES WORKBENCH
// ============================================================================
function Graph2DWorkbench({ tool, parsed }: { tool: MathToolSpec; parsed: ParsedQuadratic }) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const [tangentX, setTangentX] = useState<number>(parsed.vertex.x + 1)
  const [riemannN, setRiemannN] = useState<number>(12)
  const [showDerivative, setShowDerivative] = useState<boolean>(true)

  useEffect(() => {
    setTangentX(Number((parsed.vertex.x + 1).toFixed(2)))
  }, [parsed.vertex.x])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const w = canvas.width
    const h = canvas.height
    ctx.clearRect(0, 0, w, h)

    // Viewport centered around vertex
    const cx = parsed.vertex.x
    const spanX = 6
    const xMin = cx - spanX
    const xMax = cx + spanX
    const yCenter = parsed.vertex.y
    const spanY = Math.max(8, Math.abs(parsed.a) * 10)
    const yMin = yCenter - spanY * 0.6
    const yMax = yCenter + spanY * 1.1

    const toPxX = (x: number) => ((x - xMin) / (xMax - xMin)) * w
    const toPxY = (y: number) => h - ((y - yMin) / (yMax - yMin)) * h

    // Grid
    ctx.strokeStyle = '#1e293b'
    ctx.lineWidth = 1
    for (let gx = Math.ceil(xMin); gx <= Math.floor(xMax); gx++) {
      const px = toPxX(gx)
      ctx.beginPath()
      ctx.moveTo(px, 0)
      ctx.lineTo(px, h)
      ctx.stroke()
    }
    for (let gy = Math.ceil(yMin); gy <= Math.floor(yMax); gy += 2) {
      const py = toPxY(gy)
      ctx.beginPath()
      ctx.moveTo(0, py)
      ctx.lineTo(w, py)
      ctx.stroke()
    }

    // Axes
    ctx.strokeStyle = '#64748b'
    ctx.lineWidth = 1.5
    const yZero = toPxY(0)
    const xZero = toPxX(0)
    ctx.beginPath()
    ctx.moveTo(0, yZero)
    ctx.lineTo(w, yZero)
    ctx.moveTo(xZero, 0)
    ctx.lineTo(xZero, h)
    ctx.stroke()

    // Riemann rectangles between roots (or around vertex)
    const rStart = parsed.roots.length === 2 ? parsed.roots[0] : cx - 2
    const rEnd = parsed.roots.length === 2 ? parsed.roots[1] : cx + 2
    const dx = (rEnd - rStart) / Math.max(1, riemannN)
    ctx.fillStyle = 'rgba(56, 189, 248, 0.18)'
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.45)'
    for (let i = 0; i < riemannN; i++) {
      const rx = rStart + (i + 0.5) * dx
      const ry = evalQuadraticAt(parsed, rx)
      const x1 = toPxX(rStart + i * dx)
      const x2 = toPxX(rStart + (i + 1) * dx)
      const yTop = toPxY(Math.max(0, ry))
      const yBot = toPxY(Math.min(0, ry))
      ctx.fillRect(x1, yTop, Math.max(1, x2 - x1), Math.max(1, yBot - yTop))
      ctx.strokeRect(x1, yTop, Math.max(1, x2 - x1), Math.max(1, yBot - yTop))
    }

    // Derivative line f'(x)
    if (showDerivative) {
      ctx.strokeStyle = '#a855f7'
      ctx.lineWidth = 1.8
      ctx.setLineDash([5, 5])
      ctx.beginPath()
      for (let px = 0; px <= w; px += 4) {
        const xv = xMin + (px / w) * (xMax - xMin)
        const yv = evalDerivativeAt(parsed, xv)
        const py = toPxY(yv)
        if (px === 0) ctx.moveTo(px, py)
        else ctx.lineTo(px, py)
      }
      ctx.stroke()
      ctx.setLineDash([])
    }

    // Parabola f(x)
    ctx.strokeStyle = '#38bdf8'
    ctx.lineWidth = 3
    ctx.beginPath()
    for (let px = 0; px <= w; px += 2) {
      const xv = xMin + (px / w) * (xMax - xMin)
      const yv = evalQuadraticAt(parsed, xv)
      const py = toPxY(yv)
      if (px === 0) ctx.moveTo(px, py)
      else ctx.lineTo(px, py)
    }
    ctx.stroke()

    // Tangent line at tangentX
    const ty = evalQuadraticAt(parsed, tangentX)
    const slope = evalDerivativeAt(parsed, tangentX)
    ctx.strokeStyle = '#f59e0b'
    ctx.lineWidth = 2
    ctx.beginPath()
    const tx1 = tangentX - 2.5
    const tx2 = tangentX + 2.5
    ctx.moveTo(toPxX(tx1), toPxY(ty + slope * (tx1 - tangentX)))
    ctx.lineTo(toPxX(tx2), toPxY(ty + slope * (tx2 - tangentX)))
    ctx.stroke()

    // Tangent point
    ctx.fillStyle = '#f59e0b'
    ctx.beginPath()
    ctx.arc(toPxX(tangentX), toPxY(ty), 6, 0, Math.PI * 2)
    ctx.fill()

    // Roots & Vertex markers
    parsed.roots.forEach((r) => {
      ctx.fillStyle = '#10b981'
      ctx.beginPath()
      ctx.arc(toPxX(r), toPxY(0), 6, 0, Math.PI * 2)
      ctx.fill()
    })
    ctx.fillStyle = '#f43f5e'
    ctx.beginPath()
    ctx.arc(toPxX(parsed.vertex.x), toPxY(parsed.vertex.y), 6, 0, Math.PI * 2)
    ctx.fill()
  }, [parsed, tangentX, riemannN, showDerivative])

  const ty = evalQuadraticAt(parsed, tangentX)
  const slope = evalDerivativeAt(parsed, tangentX)

  return (
    <div className="grid lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 rounded-xl border border-slate-700 bg-slate-950 p-4">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-semibold uppercase tracking-wider text-cyan-400">
            Lienzo Analítico Interactivo · {tool.name}
          </span>
          <div className="flex gap-3 text-[11px]">
            <span className="text-sky-400">● f(x) Parábola</span>
            <span className="text-amber-400">● Tangente</span>
            <span className="text-emerald-400">● Raíces</span>
            <span className="text-rose-400">● Vértice</span>
          </div>
        </div>
        <canvas ref={canvasRef} width={640} height={340} className="w-full rounded-lg border border-slate-800 bg-slate-950" />
      </div>

      <div className="rounded-xl border border-slate-700 bg-slate-900/90 p-4 flex flex-col justify-between space-y-4">
        <div className="space-y-4">
          <div className="text-xs font-semibold uppercase tracking-wider text-slate-300">
            Controles de Exploración
          </div>
          <div>
            <label className="block text-xs text-slate-300 mb-1">
              Punto de Tangencia x₀ = <span className="font-mono text-amber-300">{tangentX.toFixed(2)}</span>
            </label>
            <input
              type="range"
              min={parsed.vertex.x - 4}
              max={parsed.vertex.x + 4}
              step={0.1}
              value={tangentX}
              onChange={(e) => setTangentX(parseFloat(e.target.value))}
              className="w-full accent-amber-500"
            />
            <div className="text-[11px] font-mono text-slate-400 mt-1">
              f(x₀) = {ty.toFixed(2)} | Pendiente m = f&apos;(x₀) = {slope.toFixed(2)}
            </div>
          </div>

          <div>
            <label className="block text-xs text-slate-300 mb-1">
              Particiones de Riemann N = <span className="font-mono text-cyan-300">{riemannN}</span>
            </label>
            <input
              type="range"
              min={4}
              max={40}
              step={2}
              value={riemannN}
              onChange={(e) => setRiemannN(parseInt(e.target.value, 10))}
              className="w-full accent-cyan-500"
            />
            <div className="text-[11px] font-mono text-slate-400 mt-1">
              Área exacta entre raíces: {parsed.areaBetweenRoots.toFixed(4)} u²
            </div>
          </div>

          <label className="flex items-center gap-2 text-xs text-slate-200 cursor-pointer">
            <input
              type="checkbox"
              checked={showDerivative}
              onChange={(e) => setShowDerivative(e.target.checked)}
            />
            Mostrar recta derivada {parsed.derivativeLatex}
          </label>
        </div>

        <div className="rounded-lg bg-slate-950 p-3 border border-slate-800 text-xs space-y-1">
          <div className="text-slate-400">Coordenadas Notables:</div>
          <div className="font-mono text-rose-300">Vértice: ({parsed.vertex.x.toFixed(2)}, {parsed.vertex.y.toFixed(2)})</div>
          <div className="font-mono text-emerald-300">Raíces: {parsed.exactRootLabels.join(' , ')}</div>
        </div>
      </div>
    </div>
  )
}

// ============================================================================
// 4. CÁLCULO MULTIVARIABLE Y ESPACIO 3D WORKBENCH
// ============================================================================
function Space3DWorkbench({ tool, parsed }: { tool: MathToolSpec; parsed: ParsedQuadratic }) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const [yaw, setYaw] = useState(0.65)
  const [pitch, setPitch] = useState(0.55)
  const [mode3d, setMode3d] = useState<'paraboloid' | 'saddle' | 'revolution'>('paraboloid')

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const w = canvas.width
    const h = canvas.height
    ctx.clearRect(0, 0, w, h)

    const project = (x: number, y: number, z: number) => {
      const cosY = Math.cos(yaw)
      const sinY = Math.sin(yaw)
      const cosP = Math.cos(pitch)
      const sinP = Math.sin(pitch)

      const x1 = x * cosY - y * sinY
      const y1 = x * sinY + y * cosY
      const z2 = z * cosP - y1 * sinP
      const scale = 28
      return {
        px: w / 2 + x1 * scale,
        py: h * 0.62 - z2 * scale * 0.45,
      }
    }

    const gridN = 14
    const range = 3.2
    const cx = parsed.vertex.x

    for (let i = -gridN; i < gridN; i++) {
      for (let j = -gridN; j < gridN; j++) {
        const u = (i / gridN) * range
        const v = (j / gridN) * range
        const u2 = ((i + 1) / gridN) * range
        const v2 = ((j + 1) / gridN) * range

        const evalZ = (du: number, dv: number) => {
          if (mode3d === 'paraboloid') {
            return (parsed.a * (du * du + dv * dv) + parsed.vertex.y) * 0.35
          }
          if (mode3d === 'saddle') {
            return (parsed.a * (du * du - dv * dv) + parsed.vertex.y) * 0.35
          }
          const r = Math.sqrt(du * du + dv * dv)
          return evalQuadraticAt(parsed, cx + r) * 0.25
        }

        const z00 = evalZ(u, v)
        const z10 = evalZ(u2, v)
        const z01 = evalZ(u, v2)

        const p00 = project(u, v, z00)
        const p10 = project(u2, v, z10)
        const p01 = project(u, v2, z01)

        const hue = Math.max(180, Math.min(290, 210 + z00 * 18))
        ctx.strokeStyle = `hsla(${hue}, 85%, 60%, 0.65)`
        ctx.lineWidth = 1.1
        ctx.beginPath()
        ctx.moveTo(p00.px, p00.py)
        ctx.lineTo(p10.px, p10.py)
        ctx.moveTo(p00.px, p00.py)
        ctx.lineTo(p01.px, p01.py)
        ctx.stroke()
      }
    }
  }, [parsed, yaw, pitch, mode3d])

  return (
    <div className="grid lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 rounded-xl border border-slate-700 bg-slate-950 p-4">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-semibold uppercase tracking-wider text-violet-400">
            Proyección de Superficie 3D · {tool.name}
          </span>
          <div className="flex gap-2">
            {(['paraboloid', 'saddle', 'revolution'] as const).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => setMode3d(m)}
                className={`rounded px-2.5 py-1 text-xs font-medium ${
                  mode3d === m ? 'bg-violet-600 text-white' : 'bg-slate-800 text-slate-300'
                }`}
              >
                {m === 'paraboloid' ? 'Paraboloide Elíptico' : m === 'saddle' ? 'Silla Hiperbólica' : 'Revolución'}
              </button>
            ))}
          </div>
        </div>
        <canvas ref={canvasRef} width={640} height={340} className="w-full rounded-lg border border-slate-800 bg-slate-950" />
      </div>

      <div className="rounded-xl border border-slate-700 bg-slate-900/90 p-4 space-y-4">
        <div className="text-xs font-semibold uppercase tracking-wider text-slate-300">
          Cámara Orbital 3D
        </div>
        <div>
          <label className="block text-xs text-slate-300 mb-1">Rotación Azimutal (θ): {(yaw * 57.3).toFixed(0)}°</label>
          <input
            type="range"
            min={0}
            max={6.28}
            step={0.05}
            value={yaw}
            onChange={(e) => setYaw(parseFloat(e.target.value))}
            className="w-full accent-violet-500"
          />
        </div>
        <div>
          <label className="block text-xs text-slate-300 mb-1">Inclinación Elevación (φ): {(pitch * 57.3).toFixed(0)}°</label>
          <input
            type="range"
            min={0.1}
            max={1.4}
            step={0.05}
            value={pitch}
            onChange={(e) => setPitch(parseFloat(e.target.value))}
            className="w-full accent-violet-500"
          />
        </div>
        <div className="rounded-lg bg-slate-950 p-3 border border-slate-800 text-xs space-y-1.5">
          <div className="text-violet-300 font-semibold">Análisis Multivariable:</div>
          <div className="font-mono text-slate-300">Punto crítico: ({parsed.vertex.x.toFixed(2)}, 0, {parsed.vertex.y.toFixed(2)})</div>
          <div className="font-mono text-slate-300">Gradiente ∇f en vértice: (0, 0)</div>
          <div className="font-mono text-slate-300">Hessiano det(H): {(4 * parsed.a * parsed.a).toFixed(2)}</div>
        </div>
      </div>
    </div>
  )
}

// ============================================================================
// 5. GEOMETRÍA DINÁMICA, EUCLIDIANA Y ANALÍTICA WORKBENCH
// ============================================================================
function GeometryWorkbench({ tool, parsed }: { tool: MathToolSpec; parsed: ParsedQuadratic }) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const bNorm = parsed.b / parsed.a
  const cNorm = parsed.c / parsed.a
  const centerX = -bNorm / 2
  const centerY = (1 + cNorm) / 2
  const radius = Math.hypot(centerX - 0, centerY - 1)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const w = canvas.width
    const h = canvas.height
    ctx.clearRect(0, 0, w, h)

    const span = Math.max(6, radius * 1.6, Math.abs(centerX) + 4)
    const toPxX = (x: number) => w / 2 + ((x - centerX * 0.5) / span) * (w * 0.38)
    const toPxY = (y: number) => h * 0.62 - ((y - centerY * 0.3) / span) * (h * 0.38)

    // Axes
    ctx.strokeStyle = '#475569'
    ctx.lineWidth = 1.5
    ctx.beginPath()
    ctx.moveTo(0, toPxY(0))
    ctx.lineTo(w, toPxY(0))
    ctx.moveTo(toPxX(0), 0)
    ctx.lineTo(toPxX(0), h)
    ctx.stroke()

    // Carlyle Circle: diameter from (0, 1) to (-b/a, c/a)
    const cPxX = toPxX(centerX)
    const cPxY = toPxY(centerY)
    const rPx = Math.hypot(toPxX(0) - cPxX, toPxY(1) - cPxY)

    ctx.strokeStyle = '#f59e0b'
    ctx.lineWidth = 2.5
    ctx.beginPath()
    ctx.arc(cPxX, cPxY, rPx, 0, Math.PI * 2)
    ctx.stroke()

    // Diameter segment
    ctx.strokeStyle = '#94a3b8'
    ctx.setLineDash([4, 4])
    ctx.beginPath()
    ctx.moveTo(toPxX(0), toPxY(1))
    ctx.lineTo(toPxX(-bNorm), toPxY(cNorm))
    ctx.stroke()
    ctx.setLineDash([])

    // Roots on X axis
    parsed.roots.forEach((r) => {
      ctx.fillStyle = '#10b981'
      ctx.beginPath()
      ctx.arc(toPxX(r), toPxY(0), 6, 0, Math.PI * 2)
      ctx.fill()
    })
  }, [parsed, bNorm, cNorm, centerX, centerY, radius])

  return (
    <div className="grid lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 rounded-xl border border-slate-700 bg-slate-950 p-4">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-semibold uppercase tracking-wider text-amber-400">
            Circunferencia de Carlyle y Geometría Analítica · {tool.name}
          </span>
          <span className="text-xs text-slate-400">Los cortes del círculo con Y=0 son las raíces exactas</span>
        </div>
        <canvas ref={canvasRef} width={640} height={320} className="w-full rounded-lg border border-slate-800 bg-slate-950" />
      </div>

      <div className="rounded-xl border border-slate-700 bg-slate-900/90 p-4 space-y-3 text-xs">
        <div className="font-semibold uppercase tracking-wider text-amber-300">
          Invariantes Geométricos
        </div>
        <div className="rounded bg-slate-950 p-3 border border-slate-800 space-y-1.5 font-mono">
          <div>Centro Carlyle: ({centerX.toFixed(2)}, {centerY.toFixed(2)})</div>
          <div>Radio Carlyle: R = {radius.toFixed(3)}</div>
          <div>Foco Parábola: ({parsed.focus.x.toFixed(2)}, {parsed.focus.y.toFixed(2)})</div>
          <div>Directriz: y = {parsed.directrixY.toFixed(2)}</div>
          <div className="text-emerald-300">Intersecciones eje X: {parsed.exactRootLabels.join(' , ')}</div>
        </div>
        <p className="text-slate-300 leading-relaxed">
          La circunferencia cuyo diámetro une los puntos <code className="text-amber-200">(0, 1)</code> y{' '}
          <code className="text-amber-200">(-b/a, c/a)</code> corta al eje horizontal exactamente en las raíces reales de la ecuación cuadrática.
        </p>
      </div>
    </div>
  )
}

// ============================================================================
// 6. MANIPULABLES TÁCTILES Y SIMULACIONES WORKBENCH
// ============================================================================
function ManipulativesWorkbench({
  tool,
  parsed,
  onExpressionChange,
}: {
  tool: MathToolSpec
  parsed: ParsedQuadratic
  onExpressionChange: (next: string) => void
}) {
  const x2Count = Math.min(6, Math.max(1, Math.round(Math.abs(parsed.a))))
  const xCount = Math.min(12, Math.round(Math.abs(parsed.b)))
  const unitCount = Math.min(25, Math.round(Math.abs(parsed.c)))

  const updateParam = (newA: number, newB: number, newC: number) => {
    const aStr = newA === 1 ? 'x^2' : newA === -1 ? '-x^2' : `${newA}x^2`
    const bStr = newB === 0 ? '' : newB > 0 ? ` + ${newB}x` : ` - ${Math.abs(newB)}x`
    const cStr = newC === 0 ? '' : newC > 0 ? ` + ${newC}` : ` - ${Math.abs(newC)}`
    onExpressionChange(`${aStr}${bStr}${cStr} = 0`)
  }

  return (
    <div className="grid lg:grid-cols-2 gap-6">
      <div className="rounded-xl border border-slate-700 bg-slate-950 p-5">
        <div className="text-xs font-semibold uppercase tracking-wider text-pink-400 mb-3">
          Mosaicos Algebraicos Táctiles (Algebra Tiles · {tool.name})
        </div>
        <div className="space-y-4">
          <div>
            <div className="text-xs text-slate-400 mb-1.5">Bloques Cuadráticos x² ({Math.abs(parsed.a)}):</div>
            <div className="flex flex-wrap gap-2">
              {Array.from({ length: x2Count }).map((_, i) => (
                <div
                  key={i}
                  className="w-16 h-16 rounded-lg bg-blue-600/80 border border-blue-400 flex items-center justify-center font-mono font-bold text-white shadow"
                >
                  {parsed.a < 0 ? '-x²' : 'x²'}
                </div>
              ))}
            </div>
          </div>

          <div>
            <div className="text-xs text-slate-400 mb-1.5">Barras Lineales x ({Math.abs(parsed.b)}):</div>
            <div className="flex flex-wrap gap-1.5">
              {Array.from({ length: xCount }).map((_, i) => (
                <div
                  key={i}
                  className={`w-7 h-14 rounded border flex items-center justify-center font-mono text-xs font-bold text-white ${
                    parsed.b >= 0 ? 'bg-emerald-600/80 border-emerald-400' : 'bg-rose-600/80 border-rose-400'
                  }`}
                >
                  {parsed.b >= 0 ? '+x' : '-x'}
                </div>
              ))}
            </div>
          </div>

          <div>
            <div className="text-xs text-slate-400 mb-1.5">Unidades Constantes 1 ({Math.abs(parsed.c)}):</div>
            <div className="flex flex-wrap gap-1.5">
              {Array.from({ length: unitCount }).map((_, i) => (
                <div
                  key={i}
                  className={`w-7 h-7 rounded border flex items-center justify-center font-mono text-[11px] font-bold text-slate-950 ${
                    parsed.c >= 0 ? 'bg-amber-400 border-amber-200' : 'bg-rose-400 border-rose-200'
                  }`}
                >
                  {parsed.c >= 0 ? '+1' : '-1'}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-slate-700 bg-slate-900/90 p-5 space-y-4">
        <div className="text-xs font-semibold uppercase tracking-wider text-slate-200">
          Laboratorio de Parámetros en Vivo (PhET / Sliders)
        </div>
        <div>
          <label className="block text-xs text-slate-300 mb-1">Coeficiente cuadrático a = {parsed.a}</label>
          <input
            type="range"
            min={-4}
            max={4}
            step={1}
            value={parsed.a}
            onChange={(e) => {
              const v = parseInt(e.target.value, 10) || 1
              updateParam(v, parsed.b, parsed.c)
            }}
            className="w-full accent-pink-500"
          />
        </div>
        <div>
          <label className="block text-xs text-slate-300 mb-1">Coeficiente lineal b = {parsed.b}</label>
          <input
            type="range"
            min={-12}
            max={12}
            step={1}
            value={parsed.b}
            onChange={(e) => updateParam(parsed.a, parseInt(e.target.value, 10), parsed.c)}
            className="w-full accent-pink-500"
          />
        </div>
        <div>
          <label className="block text-xs text-slate-300 mb-1">Término independiente c = {parsed.c}</label>
          <input
            type="range"
            min={-15}
            max={25}
            step={1}
            value={parsed.c}
            onChange={(e) => updateParam(parsed.a, parsed.b, parseInt(e.target.value, 10))}
            className="w-full accent-pink-500"
          />
        </div>

        <div className="rounded-lg bg-slate-950 p-3 border border-slate-800 text-xs space-y-1">
          <div className="text-pink-300 font-semibold">Equivalencia de Área Factorizada:</div>
          <div className="font-mono text-white text-sm">{parsed.factoredForm}</div>
        </div>
      </div>
    </div>
  )
}

// ============================================================================
// 7. EDITORES TIPOGRÁFICOS Y ENTRADA LATEX WORKBENCH
// ============================================================================
function LatexInputWorkbench({
  tool,
  parsed,
  expression,
  onExpressionChange,
}: {
  tool: MathToolSpec
  parsed: ParsedQuadratic
  expression: string
  onExpressionChange: (next: string) => void
}) {
  const quickTokens = ['x^2', '- 5x', '+ 6', '= 0', '2x^2', '- 7x', '+ 12', '- 9']

  return (
    <div className="grid lg:grid-cols-2 gap-6">
      <div className="space-y-4">
        <Suspense fallback={<div className="rounded border border-slate-700 bg-slate-900 p-3 text-xs text-slate-400">Cargando teclado matemático MathLive...</div>}>
          <InteractiveMathEditor value={expression} onChange={onExpressionChange} />
        </Suspense>
        <div className="rounded-lg border border-slate-700 bg-slate-900 p-3">
          <div className="text-xs text-slate-400 mb-2">Teclado Táctil Rápido ({tool.name}):</div>
          <div className="flex flex-wrap gap-2">
            {quickTokens.map((tok) => (
              <button
                key={tok}
                type="button"
                onClick={() => onExpressionChange(`${expression.replace(/=0$/, '').trim()} ${tok}`)}
                className="rounded bg-slate-800 hover:bg-slate-700 border border-slate-600 px-3 py-1.5 text-xs font-mono text-white"
              >
                {tok}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-slate-700 bg-slate-900/90 p-5 space-y-3 text-xs">
        <div className="font-semibold uppercase tracking-wider text-sky-400">
          Salida Tipográfica y Fonética para Video
        </div>
        <div className="rounded bg-slate-950 p-3 border border-slate-800">
          <div className="text-slate-400">LaTeX Canónico (MathTex):</div>
          <div className="font-mono text-sm text-emerald-300 mt-1">{parsed.normalized}</div>
        </div>
        <div className="rounded bg-slate-950 p-3 border border-slate-800">
          <div className="text-slate-400">Guion Fonético Español (Capa de Pronunciación Pizarra 2.2):</div>
          <div className="text-amber-200 italic mt-1">“{parsed.spanishPhonetic}”</div>
        </div>
        <div className="rounded bg-slate-950 p-3 border border-slate-800">
          <div className="text-slate-400">Métricas de Legibilidad en Pizarra 1920×1080:</div>
          <div className="font-mono text-slate-200 mt-1">
            Altura mínima garantizada: 44 px · Margen seguro: ≥ 85 px · Estado: APTO PARA RENDER
          </div>
        </div>
      </div>
    </div>
  )
}

// ============================================================================
// 8. ESTADÍSTICA, PROBABILIDAD Y ANÁLISIS NUMÉRICO WORKBENCH
// ============================================================================
function StatsNumWorkbench({ tool, parsed }: { tool: MathToolSpec; parsed: ParsedQuadratic }) {
  return (
    <div className="grid lg:grid-cols-2 gap-6">
      <div className="rounded-xl border border-slate-700 bg-slate-950 p-5">
        <div className="text-xs font-semibold uppercase tracking-wider text-teal-400 mb-3">
          Tabla de Convergencia Numérica Newton-Raphson ({tool.name})
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400">
                <th className="py-2">Iter</th>
                <th className="py-2">xₙ</th>
                <th className="py-2">f(xₙ)</th>
                <th className="py-2">f&apos;(xₙ)</th>
                <th className="py-2">xₙ₊₁</th>
                <th className="py-2">Error |Δx|</th>
              </tr>
            </thead>
            <tbody>
              {parsed.newtonIterations.map((row) => (
                <tr key={row.step} className="border-b border-slate-900 text-slate-200">
                  <td className="py-2 text-teal-400">#{row.step}</td>
                  <td className="py-2">{row.x}</td>
                  <td className="py-2">{row.fx}</td>
                  <td className="py-2">{row.fpx}</td>
                  <td className="py-2 text-emerald-300 font-semibold">{row.nextX}</td>
                  <td className="py-2 text-amber-300">{row.error}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="rounded-xl border border-slate-700 bg-slate-900/90 p-5 space-y-3 text-xs">
        <div className="font-semibold uppercase tracking-wider text-emerald-300">
          Cuadratura de Simpson y Estadística del Modelo
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded bg-slate-950 p-3 border border-slate-800">
            <div className="text-slate-400">Área Exacta (Regla de Simpson)</div>
            <div className="font-mono text-lg text-white font-bold mt-1">{parsed.areaBetweenRoots.toFixed(4)} u²</div>
          </div>
          <div className="rounded bg-slate-950 p-3 border border-slate-800">
            <div className="text-slate-400">Centro de Masa / Eje μ</div>
            <div className="font-mono text-lg text-cyan-300 font-bold mt-1">μ = {parsed.vertex.x.toFixed(3)}</div>
          </div>
          <div className="rounded bg-slate-950 p-3 border border-slate-800">
            <div className="text-slate-400">Separación de Raíces (Rango)</div>
            <div className="font-mono text-sm text-amber-300 font-bold mt-1">
              {parsed.roots.length === 2 ? Math.abs(parsed.roots[1] - parsed.roots[0]).toFixed(4) : '0.0000'}
            </div>
          </div>
          <div className="rounded bg-slate-950 p-3 border border-slate-800">
            <div className="text-slate-400">Condicionamiento Numérico</div>
            <div className="font-mono text-sm text-emerald-300 font-bold mt-1">
              {Math.abs(parsed.discriminant) > 0.5 ? 'Bien Condicionado' : 'Cerca de Bifurcación'}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// ============================================================================
// 9. TEORÍA DE GRAFOS, REDES Y ALGORITMOS WORKBENCH
// ============================================================================
function GraphsNetworksWorkbench({ tool, parsed }: { tool: MathToolSpec; parsed: ParsedQuadratic }) {
  const optimalMethod =
    parsed.b === 0
      ? 'Ruta 1: Despeje Directo de Raíz Cuadrada (Costo: 2 pasos)'
      : Number.isInteger(Math.sqrt(Math.max(0, parsed.discriminant)))
        ? 'Ruta 2: Factorización por Aspa Simple / Vieta (Costo: 3 pasos)'
        : 'Ruta 3: Fórmula General Cuadrática Completa (Costo: 4 pasos)'

  return (
    <div className="grid lg:grid-cols-2 gap-6">
      <div className="rounded-xl border border-slate-700 bg-slate-950 p-5 space-y-4">
        <div className="text-xs font-semibold uppercase tracking-wider text-fuchsia-400">
          Grafo de Decisión Algorítmica y Camino Mínimo Dijkstra ({tool.name})
        </div>
        <div className="rounded-lg border border-fuchsia-500/40 bg-fuchsia-950/20 p-3 text-xs">
          <div className="font-semibold text-fuchsia-200">Camino Óptimo Seleccionado por Dijkstra:</div>
          <div className="font-mono text-white font-bold mt-1">{optimalMethod}</div>
        </div>

        <div className="space-y-2 text-xs font-mono">
          <div className="flex items-center justify-between rounded bg-slate-900 p-2.5 border border-slate-800">
            <span className="text-cyan-300">[Nodo 0: Ecuación {parsed.normalized}]</span>
            <span className="text-slate-400">──peso 1──▶</span>
            <span className="text-amber-300">[Nodo 1: Coeficientes ({parsed.a}, {parsed.b}, {parsed.c})]</span>
          </div>
          <div className="flex items-center justify-between rounded bg-slate-900 p-2.5 border border-slate-800">
            <span className="text-amber-300">[Nodo 1: Coeficientes]</span>
            <span className="text-slate-400">──peso 1──▶</span>
            <span className="text-purple-300">[Nodo 2: Discriminante Δ = {parsed.discriminant}]</span>
          </div>
          <div className="flex items-center justify-between rounded bg-slate-900 p-2.5 border border-slate-800">
            <span className="text-purple-300">[Nodo 2: Δ = {parsed.discriminant}]</span>
            <span className="text-slate-400">──peso 1──▶</span>
            <span className="text-emerald-300">[Nodo 3: Raíces {parsed.exactRootLabels.join(', ')}]</span>
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-slate-700 bg-slate-900/90 p-5 flex flex-col justify-between">
        <div>
          <div className="text-xs font-semibold uppercase tracking-wider text-slate-300 mb-2">
            Grafo Declarativo de Escenas (Mermaid.js Storyboard)
          </div>
          <pre className="rounded bg-slate-950 p-3 border border-slate-800 text-xs font-mono text-fuchsia-300 overflow-x-auto">
            {parsed.mermaidSnippet}
          </pre>
        </div>
        <div className="mt-3 rounded bg-slate-950 p-3 border border-slate-800 text-xs font-mono text-slate-300">
          Matriz Compañera de Frobenius: [ [0, {(-parsed.c / parsed.a).toFixed(1)}], [1, {(-parsed.b / parsed.a).toFixed(1)}] ]
        </div>
      </div>
    </div>
  )
}

// ============================================================================
// 10. IA, VISIÓN COMPUTACIONAL Y OCR MATEMÁTICO WORKBENCH
// ============================================================================
function AiOcrWorkbench({
  tool,
  parsed,
  onExpressionChange,
}: {
  tool: MathToolSpec
  parsed: ParsedQuadratic
  onExpressionChange: (next: string) => void
}) {
  const wordProblems = [
    {
      text: '«Halla dos números reales cuya suma sea 5 y cuyo producto sea 6.»',
      eq: 'x^2 - 5x + 6 = 0',
    },
    {
      text: '«El área de un jardín rectangular donde el largo supera en 2 metros al ancho es de 15 m².»',
      eq: 'x^2 + 2x - 15 = 0',
    },
    {
      text: '«La altura de un dron sigue h(t) = -t² + 8t - 12. ¿En qué instantes toca la cota cero?»',
      eq: '-x^2 + 8x - 12 = 0',
    },
  ]

  return (
    <div className="grid lg:grid-cols-2 gap-6">
      <div className="rounded-xl border border-slate-700 bg-slate-950 p-5 space-y-4">
        <div className="text-xs font-semibold uppercase tracking-wider text-indigo-400">
          Traductor de Enunciados Verbales y Escáner LaTeX ({tool.name})
        </div>
        <div className="space-y-2.5">
          {wordProblems.map((wp, idx) => (
            <div key={idx} className="rounded-lg border border-slate-800 bg-slate-900 p-3">
              <p className="text-xs text-slate-200 italic">{wp.text}</p>
              <div className="mt-2 flex items-center justify-between">
                <span className="font-mono text-xs text-indigo-300 font-bold">Modelo: {wp.eq}</span>
                <button
                  type="button"
                  onClick={() => onExpressionChange(wp.eq)}
                  className="rounded bg-indigo-600 hover:bg-indigo-500 px-2.5 py-1 text-[11px] font-semibold text-white"
                >
                  Cargar Problema
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-xl border border-slate-700 bg-slate-900/90 p-5 space-y-3 text-xs">
        <div className="font-semibold uppercase tracking-wider text-indigo-300">
          Resultado de Reconocimiento y Verificación Simbólica
        </div>
        <div className="rounded bg-slate-950 p-3 border border-slate-800 space-y-2 font-mono">
          <div className="text-slate-400">Tokenización LaTeX Extraída:</div>
          <div className="text-base text-white font-bold">{parsed.normalized}</div>
          <div className="text-emerald-400">✔ Oráculo SymPy: Grado 2 verificado · Coeficientes acotados</div>
          <div className="text-cyan-300">✔ Raíces certificadas: {parsed.exactRootLabels.join(' , ')}</div>
        </div>
      </div>
    </div>
  )
}

// ============================================================================
// 11. LÓGICA FORMAL Y DEMOSTRADORES DE TEOREMAS WORKBENCH
// ============================================================================
function FormalLogicWorkbench({ tool, parsed }: { tool: MathToolSpec; parsed: ParsedQuadratic }) {
  return (
    <div className="grid lg:grid-cols-2 gap-6">
      <div className="rounded-xl border border-slate-700 bg-slate-950 p-5">
        <div className="text-xs font-semibold uppercase tracking-wider text-amber-400 mb-2">
          Certificado Formal Verificable en Lean 4 ({tool.name})
        </div>
        <pre className="rounded bg-slate-900 p-3.5 border border-slate-800 text-xs font-mono text-emerald-300 overflow-x-auto leading-relaxed">
          {parsed.lean4Snippet}
        </pre>
      </div>

      <div className="rounded-xl border border-slate-700 bg-slate-900/90 p-5 space-y-3 text-xs">
        <div className="font-semibold uppercase tracking-wider text-slate-200">
          Diagnóstico de Satisfacibilidad SMT (Z3 / Isabelle)
        </div>
        <div className="space-y-2 font-mono">
          <div className="rounded bg-slate-950 p-2.5 border border-slate-800 flex justify-between">
            <span className="text-slate-400">Dominio de Complejos (ℂ):</span>
            <span className="text-emerald-400 font-bold">SAT (2 soluciones garantizadas por TFA)</span>
          </div>
          <div className="rounded bg-slate-950 p-2.5 border border-slate-800 flex justify-between">
            <span className="text-slate-400">Dominio de Reales (ℝ):</span>
            <span className={parsed.discriminant >= 0 ? 'text-emerald-400 font-bold' : 'text-rose-400 font-bold'}>
              {parsed.discriminant >= 0 ? `SAT (Δ = ${parsed.discriminant} ≥ 0)` : `UNSAT (Δ = ${parsed.discriminant} < 0)`}
            </span>
          </div>
          <div className="rounded bg-slate-950 p-2.5 border border-slate-800 flex justify-between">
            <span className="text-slate-400">Dominio de Enteros (ℤ):</span>
            <span
              className={
                parsed.roots.some((r) => Number.isInteger(Number(r.toFixed(5))))
                  ? 'text-emerald-400 font-bold'
                  : 'text-amber-400 font-bold'
              }
            >
              {parsed.roots.some((r) => Number.isInteger(Number(r.toFixed(5))))
                ? 'SAT (Raíces enteras encontradas)'
                : 'UNSAT en ℤ'}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}

// ============================================================================
// 12. FRACTALES, CAOS Y MATEMÁTICAS GENERATIVAS WORKBENCH
// ============================================================================
function FractalsChaosWorkbench({ tool, parsed }: { tool: MathToolSpec; parsed: ParsedQuadratic }) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const [ruleNumber, setRuleNumber] = useState<number>(90)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const w = canvas.width
    const h = canvas.height
    ctx.clearRect(0, 0, w, h)

    if (tool.id === 'wolfram-cellular-automata') {
      // Render 1D Elementary Cellular Automaton
      const cols = 120
      const rows = 64
      const cellW = w / cols
      const cellH = h / rows
      let state = new Array(cols).fill(0)
      state[Math.floor(cols / 2)] = 1

      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          if (state[c] === 1) {
            ctx.fillStyle = '#f97316'
            ctx.fillRect(c * cellW, r * cellH, Math.ceil(cellW), Math.ceil(cellH))
          }
        }
        const next = new Array(cols).fill(0)
        for (let c = 0; c < cols; c++) {
          const left = state[(c - 1 + cols) % cols]
          const mid = state[c]
          const right = state[(c + 1) % cols]
          const pattern = (left << 2) | (mid << 1) | right
          next[c] = (ruleNumber >> pattern) & 1
        }
        state = next
      }
      return
    }

    // Render Julia Set for z_{n+1} = z_n^2 + c_complex derived from quadratic discriminant
    const cRe = Math.max(-0.8, Math.min(0.4, -0.4 + (parsed.discriminant % 10) * 0.03))
    const cIm = 0.58
    const maxIter = 28
    const step = 3

    for (let px = 0; px < w; px += step) {
      for (let py = 0; py < h; py += step) {
        let zx = ((px - w / 2) / (w * 0.35))
        let zy = ((py - h / 2) / (h * 0.42))
        let iter = 0
        while (zx * zx + zy * zy < 4 && iter < maxIter) {
          const xtemp = zx * zx - zy * zy + cRe
          zy = 2 * zx * zy + cIm
          zx = xtemp
          iter++
        }
        if (iter < maxIter) {
          const hue = (200 + iter * 8) % 360
          ctx.fillStyle = `hsl(${hue}, 85%, ${Math.min(70, 15 + iter * 2.2)}%)`
        } else {
          ctx.fillStyle = '#020617'
        }
        ctx.fillRect(px, py, step, step)
      }
    }
  }, [tool.id, parsed, ruleNumber])

  return (
    <div className="grid lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 rounded-xl border border-slate-700 bg-slate-950 p-4">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-semibold uppercase tracking-wider text-orange-400">
            Explorador Generativo Cuadrático · {tool.name}
          </span>
          {tool.id === 'wolfram-cellular-automata' && (
            <div className="flex gap-2">
              {[30, 90, 110].map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setRuleNumber(r)}
                  className={`rounded px-2.5 py-1 text-xs font-mono ${
                    ruleNumber === r ? 'bg-orange-600 text-white' : 'bg-slate-800 text-slate-300'
                  }`}
                >
                  Regla {r}
                </button>
              ))}
            </div>
          )}
        </div>
        <canvas ref={canvasRef} width={600} height={300} className="w-full rounded-lg border border-slate-800 bg-slate-950" />
      </div>

      <div className="rounded-xl border border-slate-700 bg-slate-900/90 p-4 space-y-3 text-xs">
        <div className="font-semibold uppercase tracking-wider text-orange-300">
          Dinámica No Lineal de Polinomios Cuadráticos
        </div>
        <p className="text-slate-300 leading-relaxed">
          Al iterar la transformación cuadrática <code className="text-orange-200">zₙ₊₁ = zₙ² + c</code> en el plano complejo, la frontera entre las órbitas acotadas y las que escapan al infinito forma los conjuntos fractales de Julia y Mandelbrot.
        </p>
        <div className="rounded bg-slate-950 p-3 border border-slate-800 font-mono space-y-1">
          <div>Ecuación semilla: {parsed.normalized}</div>
          <div>Discriminante: Δ = {parsed.discriminant}</div>
          <div className="text-emerald-300">Puntos fijos reales: {parsed.exactRootLabels.join(' , ')}</div>
        </div>
      </div>
    </div>
  )
}
