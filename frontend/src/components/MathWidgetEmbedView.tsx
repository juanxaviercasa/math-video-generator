import React, { useMemo, useState } from 'react'
import { MACRO_CATEGORIES, MATH_TOOLS_CATALOG } from '../suite/catalog'
import { parseQuadraticInput } from '../suite/mathEngines'
import { ToolWorkbench } from '../suite/ToolWorkbenches'

export type MathWidgetEmbedViewProps = {
  initialToolId?: string
  initialExpression?: string
}

export function MathWidgetEmbedView({
  initialToolId,
  initialExpression,
}: MathWidgetEmbedViewProps) {
  const tool = useMemo(() => {
    if (initialToolId) {
      const found = MATH_TOOLS_CATALOG.find(
        (t) => t.id === initialToolId || String(t.number) === initialToolId
      )
      if (found) return found
    }
    return MATH_TOOLS_CATALOG[10] // Default to #11 Mafs
  }, [initialToolId])

  const category = useMemo(
    () => MACRO_CATEGORIES.find((c) => c.id === tool.categoryId) ?? MACRO_CATEGORIES[0],
    [tool]
  )

  const [expression, setExpression] = useState<string>(
    initialExpression?.trim() || tool.defaultInput
  )

  const parsed = useMemo(() => parseQuadraticInput(expression), [expression])

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-3 sm:p-5">
      <div className="max-w-5xl mx-auto rounded-2xl border border-slate-800 bg-slate-900/95 p-4 shadow-2xl space-y-4">
        {/* Compact Embed Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-slate-800 pb-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded bg-cyan-500/20 border border-cyan-500/40 px-2 py-0.5 text-xs font-mono font-bold text-cyan-300">
              Motor #{String(tool.number).padStart(2, '0')}
            </span>
            <h1 className="text-base font-bold text-white">{tool.name}</h1>
            <span className="text-xs text-slate-400">
              {category.icon} {category.shortTitle}
            </span>
          </div>

          <div className="flex items-center gap-2 text-xs">
            <a
              href={tool.url}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded bg-slate-800 hover:bg-slate-700 px-2.5 py-1 font-mono text-blue-300 transition"
            >
              {tool.repo} ⭐ {tool.stars} ↗
            </a>
            <a
              href="/"
              target="_blank"
              rel="noopener noreferrer"
              className="rounded bg-blue-600/20 border border-blue-500/40 hover:bg-blue-600/35 px-2.5 py-1 font-semibold text-blue-200 transition"
            >
              Abrir Suite 60 Motores ↗
            </a>
          </div>
        </div>

        {/* Interactive Formula Bar & Presets */}
        <div className="grid md:grid-cols-12 gap-3 items-center">
          <div className="md:col-span-5">
            <label className="block text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-1">
              Expresión Matemática Interactiva
            </label>
            <input
              type="text"
              value={expression}
              onChange={(e) => setExpression(e.target.value)}
              className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-1.5 font-mono text-sm text-cyan-200 focus:border-cyan-400 focus:outline-none"
            />
          </div>

          <div className="md:col-span-7">
            <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-1">
              Casos Preconfigurados:
            </div>
            <div className="flex flex-wrap gap-1.5">
              {tool.presets.map((p) => (
                <button
                  key={p.label}
                  type="button"
                  onClick={() => setExpression(p.expression)}
                  className={`rounded-md border px-2 py-1 text-xs transition ${
                    expression === p.expression
                      ? 'border-cyan-400 bg-cyan-500/20 text-cyan-200 font-semibold'
                      : 'border-slate-800 bg-slate-950 text-slate-300 hover:border-slate-600'
                  }`}
                >
                  {p.label}: <span className="font-mono text-[11px]">{p.expression}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Deterministic Open-Source Workbench */}
        <ToolWorkbench
          tool={tool}
          parsed={parsed}
          expression={expression}
          onExpressionChange={setExpression}
        />
      </div>
    </div>
  )
}
