import React, { useMemo, useState } from 'react'
import {
  MACRO_CATEGORIES,
  MATH_TOOLS_CATALOG,
  type CategoryId,
  type MathToolSpec,
} from '../suite/catalog'
import { parseQuadraticInput } from '../suite/mathEngines'
import { buildWidgetEmbedSnippet } from '../suite/siteAuditor'
import { ToolWorkbench } from '../suite/ToolWorkbenches'

export type MathSuperSuiteProps = {
  initialCategory?: CategoryId
  initialToolId?: string
  initialExpression?: string
  onSendToVideoStudio?: (title: string, expression: string) => void
  onOpenWebAuditor?: () => void
}

export function MathSuperSuite({
  initialCategory = 'video_anim',
  initialToolId,
  initialExpression,
  onSendToVideoStudio,
  onOpenWebAuditor,
}: MathSuperSuiteProps) {
  const [activeCategory, setActiveCategory] = useState<CategoryId>(initialCategory)
  const [selectedToolId, setSelectedToolId] = useState<string>(() => {
    if (initialToolId) {
      const match = MATH_TOOLS_CATALOG.find((t) => t.id === initialToolId)
      if (match) return match.id
    }
    const first = MATH_TOOLS_CATALOG.find((t) => t.categoryId === initialCategory)
    return first ? first.id : MATH_TOOLS_CATALOG[0].id
  })
  const [searchQuery, setSearchQuery] = useState('')
  const [showGlobalDirectory, setShowGlobalDirectory] = useState(false)
  const [showEmbedDrawer, setShowEmbedDrawer] = useState(false)
  const [customExpressions, setCustomExpressions] = useState<Record<string, string>>(() => {
    if (initialToolId && initialExpression) {
      return { [initialToolId]: initialExpression }
    }
    return {}
  })
  const [sentToast, setSentToast] = useState<string | null>(null)

  const activeCategoryMeta = useMemo(
    () => MACRO_CATEGORIES.find((c) => c.id === activeCategory) ?? MACRO_CATEGORIES[0],
    [activeCategory]
  )

  const categoryTools = useMemo(() => {
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase()
      return MATH_TOOLS_CATALOG.filter(
        (t) =>
          t.name.toLowerCase().includes(q) ||
          t.repo.toLowerCase().includes(q) ||
          t.tagline.toLowerCase().includes(q) ||
          t.premise.toLowerCase().includes(q) ||
          `#${t.number}`.includes(q) ||
          String(t.number) === q
      )
    }
    return MATH_TOOLS_CATALOG.filter((t) => t.categoryId === activeCategory)
  }, [activeCategory, searchQuery])

  const activeTool: MathToolSpec = useMemo(() => {
    const foundInCurrent = categoryTools.find((t) => t.id === selectedToolId)
    if (foundInCurrent) return foundInCurrent
    if (categoryTools.length > 0) return categoryTools[0]
    return MATH_TOOLS_CATALOG[0]
  }, [categoryTools, selectedToolId])

  const currentExpression = customExpressions[activeTool.id] ?? activeTool.defaultInput

  const parsedQuadratic = useMemo(
    () => parseQuadraticInput(currentExpression),
    [currentExpression]
  )

  const embedInfo = useMemo(
    () => buildWidgetEmbedSnippet(activeTool, currentExpression),
    [activeTool, currentExpression]
  )

  const setToolExpression = (value: string) => {
    setCustomExpressions((prev) => ({
      ...prev,
      [activeTool.id]: value,
    }))
  }

  const handleSelectCategory = (catId: CategoryId) => {
    setSearchQuery('')
    setActiveCategory(catId)
    const firstInCat = MATH_TOOLS_CATALOG.find((t) => t.categoryId === catId)
    if (firstInCat) {
      setSelectedToolId(firstInCat.id)
    }
  }

  const handleSelectToolFromDirectory = (tool: MathToolSpec) => {
    setSearchQuery('')
    setActiveCategory(tool.categoryId)
    setSelectedToolId(tool.id)
    setShowGlobalDirectory(false)
  }

  const handleSendToStudio = () => {
    const title = `${activeTool.name} (#${activeTool.number}): ${currentExpression}`
    if (onSendToVideoStudio) {
      onSendToVideoStudio(title, currentExpression)
    }
    setSentToast(`Enviado a Pizarra Manim 2.2: "${currentExpression}"`)
    window.setTimeout(() => setSentToast(null), 3500)
  }

  const handleCopyEmbed = (text: string, label: string) => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      void navigator.clipboard.writeText(text)
    }
    setSentToast(`Copiado al portapapeles: ${label}`)
    window.setTimeout(() => setSentToast(null), 3000)
  }

  return (
    <div className="space-y-6">
      {/* Suite header: compact context instead of a second category grid */}
      <div className="suite-hero rounded-2xl border border-slate-700/80 bg-slate-900/90 p-5 shadow-xl">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-cyan-500/25 bg-cyan-500/10 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.12em] text-cyan-300">
              <span className="status-dot" /> Laboratorio unificado
              <span className="text-cyan-600">/</span>
              <span>12 áreas · 60 motores</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white mt-2">
              Explora, prueba y conecta tus motores matemáticos
            </h2>
            <p className="text-sm text-slate-400 mt-1 max-w-3xl">
              Elige una categoría en el panel, abre un motor y trabaja en el mismo espacio. Sin saltos verticales ni páginas largas: tu contexto permanece visible mientras navegas.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <div className="relative min-w-[250px]">
              <input
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar motor, repositorio o concepto…"
                className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2 text-xs text-white placeholder-slate-400 focus:border-blue-500 focus:outline-none"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-2 text-xs text-slate-400 hover:text-white"
                >
                  ✕
                </button>
              )}
            </div>

            {onOpenWebAuditor && (
              <button
                type="button"
                onClick={onOpenWebAuditor}
                className="rounded-xl border border-indigo-500/40 bg-indigo-500/15 hover:bg-indigo-500/25 px-3.5 py-2 text-xs font-semibold text-indigo-200 transition"
              >
                🕸️ Auditor e Inyector de Sitios Web
              </button>
            )}

            <button
              type="button"
              onClick={() => setShowGlobalDirectory((v) => !v)}
              className={`rounded-xl border px-3.5 py-2 text-xs font-semibold transition ${
                showGlobalDirectory
                  ? 'border-amber-400 bg-amber-500/20 text-amber-200'
                  : 'border-slate-700 bg-slate-800 text-slate-200 hover:border-slate-500'
              }`}
            >
              {showGlobalDirectory ? '📋 Ocultar Catálogo (60)' : '📋 Ver Catálogo (60 URLs)'}
            </button>
          </div>
        </div>

      </div>

      {/* Collapsible Full Directory of all 60 Repositories */}
      {showGlobalDirectory && (
        <div className="rounded-2xl border border-amber-500/40 bg-slate-900/95 p-5 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold text-white">
                Índice Maestro de las 60 Herramientas Open-Source de Matemáticas
              </h3>
              <p className="text-xs text-slate-400">
                Haz clic en cualquier herramienta para abrir su laboratorio interactivo o visita directamente su repositorio oficial en GitHub.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setShowGlobalDirectory(false)}
              className="rounded-lg bg-slate-800 px-3 py-1.5 text-xs text-slate-300 hover:text-white"
            >
              Cerrar índice ✕
            </button>
          </div>

          <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4 max-h-[520px] overflow-y-auto pr-1">
            {MACRO_CATEGORIES.map((cat, idx) => {
              const tools = MATH_TOOLS_CATALOG.filter((t) => t.categoryId === cat.id)
              return (
                <div key={cat.id} className="rounded-xl border border-slate-800 bg-slate-950 p-3.5 space-y-2">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                    <span className="text-xs font-bold text-blue-300">
                      {idx + 1}. {cat.icon} {cat.title}
                    </span>
                    <span className="text-[10px] font-mono text-slate-400">{tools.length} motores</span>
                  </div>
                  <div className="space-y-1.5">
                    {tools.map((t) => (
                      <div
                        key={t.id}
                        className="flex items-center justify-between gap-2 rounded-lg bg-slate-900/80 px-2.5 py-1.5 text-xs hover:bg-slate-800/80"
                      >
                        <button
                          type="button"
                          onClick={() => handleSelectToolFromDirectory(t)}
                          className="text-left font-medium text-slate-200 hover:text-blue-300 truncate"
                        >
                          <span className="font-mono text-slate-400 mr-1.5">#{String(t.number).padStart(2, '0')}</span>
                          {t.name}
                        </button>
                        <div className="flex items-center gap-2 shrink-0">
                          <span className="text-[10px] font-mono text-amber-300">⭐ {t.stars}</span>
                          <a
                            href={t.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="rounded bg-blue-500/15 px-1.5 py-0.5 text-[10px] font-mono text-blue-300 hover:bg-blue-500/30"
                          >
                            GitHub ↗
                          </a>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Persistent category navigation + active laboratory */}
      <div className="suite-layout">
        <aside className="category-rail rounded-2xl border border-slate-700/80 bg-slate-900/90 p-3" aria-label="Categorías matemáticas">
          <div className="px-2 pb-3">
            <div className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-500">Explorar por área</div>
            <div className="text-xs text-slate-400 mt-1">Selecciona una categoría</div>
          </div>
          <div className="category-list">
            {MACRO_CATEGORIES.map((cat, idx) => {
              const isActive = !searchQuery.trim() && activeCategory === cat.id
              const count = MATH_TOOLS_CATALOG.filter((t) => t.categoryId === cat.id).length
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => handleSelectCategory(cat.id)}
                  className={`category-nav-item ${isActive ? 'is-active' : ''}`}
                >
                  <span className="category-nav-icon">{cat.icon}</span>
                  <span className="category-nav-copy">
                    <span className="category-nav-title"><span className="category-number">{String(idx + 1).padStart(2, '0')}</span>{cat.shortTitle.replace(/^\d+\.\s*/, '')}</span>
                    <span className="category-nav-description">{cat.description}</span>
                  </span>
                  <span className="category-nav-count">{count}</span>
                </button>
              )
            })}
          </div>
        </aside>

      <section className="rounded-2xl border border-slate-700/80 bg-slate-900/90 p-5 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-slate-800 pb-3">
          <div>
            <div className="text-xs uppercase tracking-wider font-semibold text-blue-400">
              {searchQuery.trim()
                ? `Resultados de búsqueda (${categoryTools.length} herramientas encontradas)`
                : `${activeCategoryMeta.icon} ${activeCategoryMeta.title}`}
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              {searchQuery.trim()
                ? 'Selecciona cualquier motor filtrado para interactuar con él.'
                : activeCategoryMeta.description}
            </p>
          </div>
          <div className="text-xs font-mono text-slate-400">
            Herramienta activa: <span className="text-white font-bold">#{String(activeTool.number).padStart(2, '0')} {activeTool.name}</span>
          </div>
        </div>

        {/* Tool Sub-Tab Pills */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2.5">
          {categoryTools.map((tool) => {
            const isSelected = tool.id === activeTool.id
            return (
              <button
                key={tool.id}
                type="button"
                onClick={() => setSelectedToolId(tool.id)}
                className={`text-left rounded-xl border p-3 transition-all ${
                  isSelected
                    ? 'border-cyan-400 bg-cyan-500/15 text-white shadow-md shadow-cyan-950/50'
                    : 'border-slate-800 bg-slate-950/80 text-slate-300 hover:border-slate-700 hover:bg-slate-950'
                }`}
              >
                <div className="flex items-center justify-between gap-1">
                  <span className="rounded bg-slate-800 px-1.5 py-0.5 text-[10px] font-mono text-cyan-300">
                    #{String(tool.number).padStart(2, '0')}
                  </span>
                  <span className="text-[10px] font-mono text-amber-300">⭐ {tool.stars}</span>
                </div>
                <div className="mt-1.5 text-sm font-bold truncate">{tool.name}</div>
                <div className="text-[11px] font-mono text-slate-400 truncate">{tool.repo}</div>
                <div className="mt-1 text-[11px] text-slate-400 line-clamp-1">{tool.tagline}</div>
              </button>
            )
          })}
        </div>

        {/* Active Tool Specification Card & Interactive Controls */}
        <div className="rounded-xl border border-slate-700 bg-slate-950/90 p-4 space-y-4">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-md bg-cyan-500/20 border border-cyan-500/40 px-2.5 py-0.5 text-xs font-mono font-bold text-cyan-300">
                  Motor #{String(activeTool.number).padStart(2, '0')} / 60
                </span>
                <h3 className="text-xl font-bold text-white">{activeTool.name}</h3>
                <span className="rounded-md bg-amber-500/15 border border-amber-500/30 px-2 py-0.5 text-xs font-mono text-amber-300">
                  ⭐ {activeTool.stars} estrellas
                </span>
                <a
                  href={activeTool.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 rounded-md bg-blue-600/20 border border-blue-500/40 px-2.5 py-0.5 text-xs font-mono text-blue-300 hover:bg-blue-600/35 transition"
                >
                  <span>🔗 {activeTool.repo}</span>
                  <span>↗</span>
                </a>
              </div>
              <p className="text-xs text-slate-300">{activeTool.premise}</p>
            </div>

            <div className="flex flex-wrap items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => setShowEmbedDrawer((v) => !v)}
                className={`rounded-xl border px-3.5 py-2.5 text-xs font-bold transition ${
                  showEmbedDrawer
                    ? 'border-emerald-400 bg-emerald-500/20 text-emerald-200'
                    : 'border-emerald-500/40 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300'
                }`}
              >
                &lt;/&gt; Código Embed para mi Web
              </button>

              <button
                type="button"
                onClick={handleSendToStudio}
                className="rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 px-4 py-2.5 text-xs font-bold text-white shadow-lg shadow-blue-900/40 transition"
              >
                🎬 Enviar a Pizarra de Video (Manim 2.2)
              </button>
            </div>
          </div>

          {sentToast && (
            <div className="rounded-lg border border-emerald-500/40 bg-emerald-500/15 px-3 py-2 text-xs text-emerald-200">
              ✅ {sentToast}
            </div>
          )}

          {/* Expandable Embed Code Generator Drawer */}
          {showEmbedDrawer && (
            <div className="rounded-xl border border-emerald-500/40 bg-slate-900/95 p-4 space-y-3 text-xs">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <span className="font-bold text-emerald-300">
                    Inyectar Motor #{String(activeTool.number).padStart(2, '0')} ({activeTool.name}) en tu Sitio Web
                  </span>
                  <p className="text-[11px] text-slate-400">
                    Pega este código en cualquier artículo o lección de tu portal para cargar el laboratorio interactivo determinista con la ecuación actual.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <a
                    href={embedInfo.embedUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="rounded bg-blue-600/20 border border-blue-500/40 px-2.5 py-1 text-blue-300 hover:bg-blue-600/35"
                  >
                    Probar Vista Embed Independiente ↗
                  </a>
                  <button
                    type="button"
                    onClick={() => handleCopyEmbed(embedInfo.iframeCode, `<iframe> de ${activeTool.name}`)}
                    className="rounded bg-emerald-600 hover:bg-emerald-500 px-3 py-1 font-bold text-white"
                  >
                    Copiar &lt;iframe&gt;
                  </button>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-3">
                <div>
                  <div className="text-[11px] font-semibold text-slate-400 mb-1">HTML &lt;iframe&gt; Universal:</div>
                  <pre className="rounded bg-slate-950 p-3 font-mono text-[11px] text-emerald-200 overflow-x-auto">
                    {embedInfo.iframeCode}
                  </pre>
                </div>
                <div>
                  <div className="text-[11px] font-semibold text-slate-400 mb-1">Componente React / Next.js / Astro:</div>
                  <pre className="rounded bg-slate-950 p-3 font-mono text-[11px] text-cyan-200 overflow-x-auto">
                    {embedInfo.reactSnippet}
                  </pre>
                </div>
              </div>
            </div>
          )}

          {/* Equation Bar & Presets */}
          <div className="grid lg:grid-cols-12 gap-3 items-center pt-2 border-t border-slate-800/80">
            <div className="lg:col-span-6">
              <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-1">
                Expresión / Ecuación de Entrada en Vivo (Sincronizada con el Motor #{String(activeTool.number).padStart(2, '0')})
              </label>
              <input
                type="text"
                value={currentExpression}
                onChange={(e) => setToolExpression(e.target.value)}
                placeholder="Ej. x^2 - 5x + 6 = 0"
                className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 font-mono text-sm text-cyan-200 focus:border-cyan-400 focus:outline-none"
              />
            </div>

            <div className="lg:col-span-6">
              <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-1">
                Ejemplos Preconfigurados ({activeTool.name}):
              </div>
              <div className="flex flex-wrap gap-2">
                {activeTool.presets.map((preset) => (
                  <button
                    key={preset.label}
                    type="button"
                    onClick={() => setToolExpression(preset.expression)}
                    className={`rounded-lg border px-2.5 py-1.5 text-xs transition ${
                      currentExpression === preset.expression
                        ? 'border-cyan-400 bg-cyan-500/20 text-cyan-200 font-semibold'
                        : 'border-slate-700 bg-slate-900 text-slate-300 hover:border-slate-500'
                    }`}
                  >
                    <span>{preset.label}: </span>
                    <span className="font-mono text-[11px] text-slate-400">{preset.expression}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Interactive Workbench for the Active Tool */}
        <ToolWorkbench
          tool={activeTool}
          parsed={parsedQuadratic}
          expression={currentExpression}
          onExpressionChange={setToolExpression}
        />
      </section>
      </div>
    </div>
  )
}
