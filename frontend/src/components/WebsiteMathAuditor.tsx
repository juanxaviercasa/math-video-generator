import React, { useMemo, useState } from 'react'
import { type CategoryId, type MathToolSpec } from '../suite/catalog'
import { parseQuadraticInput } from '../suite/mathEngines'
import {
  auditWebsiteContent,
  buildWidgetEmbedSnippet,
  SAMPLE_WEBSITE_TEMPLATES,
} from '../suite/siteAuditor'
import { ToolWorkbench } from '../suite/ToolWorkbenches'

export type WebsiteMathAuditorProps = {
  onOpenToolInSuite?: (categoryId: CategoryId, toolId: string, expression: string) => void
  onSendToVideoStudio?: (title: string, expression: string) => void
}

export function WebsiteMathAuditor({
  onOpenToolInSuite,
  onSendToVideoStudio,
}: WebsiteMathAuditorProps) {
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>(
    SAMPLE_WEBSITE_TEMPLATES[0].id
  )
  const [targetUrl, setTargetUrl] = useState<string>(SAMPLE_WEBSITE_TEMPLATES[0].url)
  const [htmlContent, setHtmlContent] = useState<string>(
    SAMPLE_WEBSITE_TEMPLATES[0].content
  )
  const [expandedPreviewIndex, setExpandedPreviewIndex] = useState<number | null>(1)
  const [expandedMcpIndex, setExpandedMcpIndex] = useState<number | null>(null)
  const [sectionToolOverrides, setSectionToolOverrides] = useState<Record<number, MathToolSpec>>({})
  const [sectionEqOverrides, setSectionEqOverrides] = useState<Record<number, string>>({})
  const [copiedMessage, setCopiedMessage] = useState<string | null>(null)

  const report = useMemo(
    () => auditWebsiteContent(targetUrl, htmlContent),
    [targetUrl, htmlContent]
  )

  const handleLoadTemplate = (templateId: string) => {
    const found = SAMPLE_WEBSITE_TEMPLATES.find((t) => t.id === templateId)
    if (!found) return
    setSelectedTemplateId(found.id)
    setTargetUrl(found.url)
    setHtmlContent(found.content)
    setSectionToolOverrides({})
    setSectionEqOverrides({})
    setExpandedPreviewIndex(1)
  }

  const handleCopy = (text: string, label: string) => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      void navigator.clipboard.writeText(text)
    }
    setCopiedMessage(`Copiado al portapapeles: ${label}`)
    window.setTimeout(() => setCopiedMessage(null), 3000)
  }

  return (
    <div className="space-y-6">
      {/* Architecture Pipeline Banner */}
      <div className="rounded-2xl border border-indigo-500/40 bg-gradient-to-br from-slate-900 via-slate-900 to-indigo-950/60 p-6 shadow-xl space-y-5">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-indigo-400/40 bg-indigo-500/15 px-3 py-1 text-xs font-semibold text-indigo-200">
              <span>🕸️ Pipeline Estratégico Web</span>
              <span>•</span>
              <span>Cerebro IA (Kaggle GPU + MCP)</span>
              <span>•</span>
              <span>60 Motores Deterministas Open-Source</span>
            </div>
            <h2 className="text-2xl font-bold text-white mt-2">
              Auditor e Inyector de Herramientas Interactivas para tu Sitio Web
            </h2>
            <p className="text-sm text-slate-300 mt-1 max-w-4xl">
              <strong>¿Cómo funciona por detrás?</strong> Los <strong>60 motores matemáticos</strong> son 100% código libre determinista (no usan IA para calcular ni graficar, garantizando cero errores). La <strong>IA (vía MCP de Antigravity/ChatGPT y tus modelos en Kaggle de <code>avatars-realistas</code>)</strong> actúa como el cerebro auditor que lee cada sección de tu web, detecta qué herramienta interactiva falta y asigna automáticamente el motor exacto con su ecuación lista para incrustar.
            </p>
          </div>

          <div className="rounded-xl border border-slate-700 bg-slate-950/90 p-3.5 text-xs space-y-1.5 shrink-0">
            <div className="font-bold text-cyan-300 uppercase tracking-wider text-[11px]">
              Estado del Ecosistema Conectado
            </div>
            <div className="flex items-center justify-between gap-4 text-slate-300">
              <span>Motores Deterministas:</span>
              <span className="font-mono font-bold text-emerald-400">60 / 60 activos</span>
            </div>
            <div className="flex items-center justify-between gap-4 text-slate-300">
              <span>Servidor MCP (Stdio + HTTP):</span>
              <span className="font-mono font-bold text-blue-400">8 Tools (Antigravity & ChatGPT)</span>
            </div>
            <div className="flex items-center justify-between gap-4 text-slate-300">
              <span>Puente Kaggle (ViralForge):</span>
              <span className="font-mono font-bold text-amber-300">openjutsu_vision + llm_reasoning</span>
            </div>
          </div>
        </div>

        {/* 4-Step Visual Pipeline */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-2">
          <div className="rounded-xl border border-slate-800 bg-slate-950/80 p-3.5">
            <div className="text-xs font-bold text-blue-400">1. Rastreo del Sitio Web</div>
            <p className="text-[11px] text-slate-400 mt-1">
              Analiza encabezados, párrafos, ecuaciones sueltas e imágenes estáticas (<code>&lt;img&gt;</code>) donde el alumno no puede interactuar.
            </p>
          </div>
          <div className="rounded-xl border border-slate-800 bg-slate-950/80 p-3.5">
            <div className="text-xs font-bold text-amber-400">2. Diagnóstico IA (Kaggle + MCP)</div>
            <p className="text-[11px] text-slate-400 mt-1">
              <code>openjutsu_vision</code> digitaliza imágenes y <code>llm_reasoning</code> / MCP identifican el tema y qué vacío pedagógico existe.
            </p>
          </div>
          <div className="rounded-xl border border-slate-800 bg-slate-950/80 p-3.5">
            <div className="text-xs font-bold text-emerald-400">3. Enrutamiento Determinista</div>
            <p className="text-[11px] text-slate-400 mt-1">
              Selecciona cuál de los <strong>60 motores open-source</strong> (#01–#60) usar y valida la ecuación con SymPy / AST sin alucinaciones.
            </p>
          </div>
          <div className="rounded-xl border border-slate-800 bg-slate-950/80 p-3.5">
            <div className="text-xs font-bold text-cyan-400">4. Inyección Web + Video Manim</div>
            <p className="text-[11px] text-slate-400 mt-1">
              Genera el widget <code>?embed=1</code> (<code>&lt;iframe&gt;</code> o React) para tu web y envía el ejercicio a la Pizarra de Video Manim 2.2.
            </p>
          </div>
        </div>
      </div>

      {/* Website Selector & HTML/Markdown Input */}
      <div className="rounded-2xl border border-slate-700/80 bg-slate-900/90 p-5 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <div>
            <h3 className="text-base font-bold text-white">
              1. Selecciona una Página de Ejemplo o Pega el HTML / Markdown de tu Sitio Web
            </h3>
            <p className="text-xs text-slate-400">
              Prueba cómo el auditor detecta cada sección temática y asigna el motor ideal entre las 12 macro-categorías.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            {SAMPLE_WEBSITE_TEMPLATES.map((tpl) => (
              <button
                key={tpl.id}
                type="button"
                onClick={() => handleLoadTemplate(tpl.id)}
                className={`rounded-xl border px-3 py-1.5 text-xs font-semibold transition ${
                  selectedTemplateId === tpl.id
                    ? 'border-cyan-400 bg-cyan-500/20 text-cyan-200'
                    : 'border-slate-700 bg-slate-950 text-slate-300 hover:border-slate-500'
                }`}
              >
                {tpl.badge}
              </button>
            ))}
          </div>
        </div>

        <div className="grid lg:grid-cols-12 gap-4">
          <div className="lg:col-span-4 space-y-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                URL de la Página de tu Sitio Web
              </label>
              <input
                type="text"
                value={targetUrl}
                onChange={(e) => setTargetUrl(e.target.value)}
                className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 font-mono text-xs text-blue-300 focus:border-blue-500 focus:outline-none"
              />
            </div>

            <div className="rounded-xl border border-slate-800 bg-slate-950 p-3.5 space-y-2 text-xs">
              <div className="font-semibold text-slate-200">Resumen del Rastreo en Vivo:</div>
              <div className="flex justify-between text-slate-400">
                <span>Secciones detectadas:</span>
                <span className="font-mono font-bold text-white">{report.totalSections} secciones</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Macro-Categorías activadas:</span>
                <span className="font-mono font-bold text-cyan-300">{report.categoriesUsed.length} categorías</span>
              </div>
              <div className="pt-2 border-t border-slate-800 text-[11px] text-slate-400">
                💡 <strong>Tip MCP:</strong> Desde Antigravity o ChatGPT puedes invocar la herramienta MCP <code>audit_webpage_math_opportunities</code> pasándole este mismo contenido para inyectar los widgets automáticamente en tu repositorio web.
              </div>
            </div>
          </div>

          <div className="lg:col-span-8">
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Contenido HTML / Markdown / Temario de la Página a Auditar (Editable en Vivo)
            </label>
            <textarea
              value={htmlContent}
              onChange={(e) => setHtmlContent(e.target.value)}
              rows={8}
              className="w-full rounded-xl border border-slate-700 bg-slate-950 p-3 font-mono text-xs text-slate-200 focus:border-cyan-400 focus:outline-none"
              placeholder="Pega aquí el HTML, Markdown o lista de temas de tu página web de matemáticas..."
            />
          </div>
        </div>
      </div>

      {copiedMessage && (
        <div className="rounded-xl border border-emerald-500/40 bg-emerald-500/15 px-4 py-2.5 text-xs font-semibold text-emerald-200">
          ✅ {copiedMessage}
        </div>
      )}

      {/* Audited Sections List & Live Widget Injector */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold text-white">
            2. Mapa de Inyección por Sección ({report.totalSections} Oportunidades Detectadas)
          </h3>
          <span className="text-xs text-slate-400">
            Cada sección recibe el motor determinista ideal (#01–#60) + su ecuación verificada
          </span>
        </div>

        {report.sections.map((sec) => {
          const activeTool = sectionToolOverrides[sec.index] ?? sec.recommendedTool
          const activeEq = sectionEqOverrides[sec.index] ?? sec.equation
          const activeParsed = parseQuadraticInput(activeEq)
          const activeEmbed = buildWidgetEmbedSnippet(activeTool, activeEq)
          const isPreviewOpen = expandedPreviewIndex === sec.index
          const isMcpOpen = expandedMcpIndex === sec.index

          return (
            <div
              key={sec.index}
              className="rounded-2xl border border-slate-700/90 bg-slate-900/95 p-5 shadow-lg space-y-4"
            >
              {/* Section Top Row */}
              <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4 border-b border-slate-800 pb-4">
                <div className="space-y-1.5">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-md bg-indigo-500/20 border border-indigo-500/40 px-2.5 py-0.5 text-xs font-mono font-bold text-indigo-300">
                      Sección #{sec.index}
                    </span>
                    <h4 className="text-lg font-bold text-white">{sec.heading}</h4>
                    <span className="rounded-md bg-slate-800 px-2.5 py-0.5 text-xs text-cyan-300">
                      {sec.categoryIcon} {sec.categoryTitle}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 line-clamp-2">{sec.rawExcerpt}</p>
                  <div className="flex flex-wrap items-center gap-2 pt-1">
                    <span className="rounded bg-amber-500/15 border border-amber-500/30 px-2 py-0.5 text-[11px] text-amber-200">
                      🔍 Déficit detectado: {sec.detectedGap}
                    </span>
                    <span className="rounded bg-purple-500/15 border border-purple-500/30 px-2 py-0.5 text-[11px] font-mono text-purple-200">
                      ⚡ Kaggle GPU: {sec.kaggleRole}
                    </span>
                  </div>
                </div>

                {/* Recommended Engine Card */}
                <div className="rounded-xl border border-cyan-500/40 bg-slate-950 p-3.5 min-w-[290px] space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-cyan-400">
                      Motor Determinista Asignado
                    </span>
                    <a
                      href={activeTool.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[11px] font-mono text-blue-400 hover:text-blue-300"
                    >
                      GitHub ⭐ {activeTool.stars} ↗
                    </a>
                  </div>
                  <div className="text-sm font-bold text-white">
                    #{String(activeTool.number).padStart(2, '0')} {activeTool.name}
                  </div>
                  <div className="text-[11px] text-slate-400">{sec.pedagogicalRationale}</div>

                  {/* Alternative Tools Selector within the same Category */}
                  <div className="pt-1">
                    <label className="block text-[10px] text-slate-400 mb-1">
                      Cambiar entre los 5 motores de esta categoría:
                    </label>
                    <select
                      value={activeTool.id}
                      onChange={(e) => {
                        const allInCat = [sec.recommendedTool, ...sec.alternativeTools]
                        const chosen = allInCat.find((t) => t.id === e.target.value)
                        if (chosen) {
                          setSectionToolOverrides((prev) => ({ ...prev, [sec.index]: chosen }))
                        }
                      }}
                      className="w-full rounded border border-slate-700 bg-slate-900 px-2 py-1 text-xs text-white"
                    >
                      {[sec.recommendedTool, ...sec.alternativeTools].map((t) => (
                        <option key={t.id} value={t.id}>
                          #{String(t.number).padStart(2, '0')} {t.name} ({t.repo})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Equation Configuration & Action Bar */}
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
                <div className="flex flex-wrap items-center gap-2 flex-1">
                  <span className="text-xs font-semibold text-slate-300">
                    Fórmula para este Widget:
                  </span>
                  <input
                    type="text"
                    value={activeEq}
                    onChange={(e) =>
                      setSectionEqOverrides((prev) => ({
                        ...prev,
                        [sec.index]: e.target.value,
                      }))
                    }
                    className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-1.5 font-mono text-xs text-cyan-200 min-w-[220px]"
                  />
                  <span className="rounded bg-emerald-500/15 border border-emerald-500/30 px-2 py-1 text-[11px] font-mono text-emerald-300">
                    ✓ Δ = {activeParsed.discriminant.toFixed(1)} | Raíces: {activeParsed.exactRootLabels.join(', ')}
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      setExpandedPreviewIndex(isPreviewOpen ? null : sec.index)
                    }
                    className={`rounded-lg border px-3 py-1.5 text-xs font-bold transition ${
                      isPreviewOpen
                        ? 'border-cyan-400 bg-cyan-500/20 text-cyan-200'
                        : 'border-slate-700 bg-slate-800 text-slate-200 hover:border-slate-500'
                    }`}
                  >
                    {isPreviewOpen ? '👁️ Ocultar Widget en Vivo' : '👁️ Ver Widget Interactivo Aquí'}
                  </button>

                  <button
                    type="button"
                    onClick={() => handleCopy(activeEmbed.iframeCode, `<iframe> de ${activeTool.name}`)}
                    className="rounded-lg border border-emerald-500/40 bg-emerald-500/15 hover:bg-emerald-500/25 px-3 py-1.5 text-xs font-semibold text-emerald-200 transition"
                  >
                    &lt;/&gt; Copiar &lt;iframe&gt; Web
                  </button>

                  <button
                    type="button"
                    onClick={() => setExpandedMcpIndex(isMcpOpen ? null : sec.index)}
                    className="rounded-lg border border-purple-500/40 bg-purple-500/15 hover:bg-purple-500/25 px-3 py-1.5 text-xs font-semibold text-purple-200 transition"
                  >
                    🤖 Código Embed &amp; MCP
                  </button>

                  {onOpenToolInSuite && (
                    <button
                      type="button"
                      onClick={() =>
                        onOpenToolInSuite(activeTool.categoryId, activeTool.id, activeEq)
                      }
                      className="rounded-lg border border-slate-700 bg-slate-800 hover:bg-slate-700 px-3 py-1.5 text-xs text-slate-200 transition"
                    >
                      🧭 Abrir en Pestaña #{String(activeTool.number).padStart(2, '0')}
                    </button>
                  )}

                  {onSendToVideoStudio && (
                    <button
                      type="button"
                      onClick={() =>
                        onSendToVideoStudio(
                          `${sec.heading} (${activeTool.name})`,
                          activeEq
                        )
                      }
                      className="rounded-lg bg-blue-600 hover:bg-blue-500 px-3 py-1.5 text-xs font-bold text-white transition"
                    >
                      🎬 Crear Video Manim 2.2
                    </button>
                  )}
                </div>
              </div>

              {/* Expandable Embed & MCP Inspector */}
              {isMcpOpen && (
                <div className="grid md:grid-cols-2 gap-4 rounded-xl border border-purple-500/30 bg-slate-950 p-4 text-xs">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-emerald-300">
                        Código HTML &lt;iframe&gt; para Inyectar en tu Sitio Web:
                      </span>
                      <a
                        href={activeEmbed.embedUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-400 hover:underline"
                      >
                        Abrir vista Embed en pestaña nueva ↗
                      </a>
                    </div>
                    <pre className="rounded bg-slate-900 p-3 font-mono text-[11px] text-emerald-200 overflow-x-auto">
                      {activeEmbed.iframeCode}
                    </pre>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-purple-300">
                        Llamada JSON-RPC MCP (Antigravity / ChatGPT):
                      </span>
                      <button
                        type="button"
                        onClick={() =>
                          handleCopy(
                            JSON.stringify(sec.mcpToolCall, null, 2),
                            'Payload MCP JSON-RPC'
                          )
                        }
                        className="text-purple-300 hover:underline"
                      >
                        Copiar JSON
                      </button>
                    </div>
                    <pre className="rounded bg-slate-900 p-3 font-mono text-[11px] text-purple-200 overflow-x-auto">
                      {JSON.stringify(sec.mcpToolCall, null, 2)}
                    </pre>
                  </div>
                </div>
              )}

              {/* Live Embedded Deterministic Workbench */}
              {isPreviewOpen && (
                <div className="rounded-xl border border-cyan-500/30 bg-slate-950/90 p-4 space-y-3">
                  <div className="flex items-center justify-between text-xs text-cyan-300">
                    <span className="font-bold">
                      ⚡ Vista Previa en Vivo del Widget Inyectado — Motor #{String(activeTool.number).padStart(2, '0')} ({activeTool.name})
                    </span>
                    <span className="font-mono text-[11px] text-slate-400">
                      100% Código Libre Determinista · 0 Alucinaciones
                    </span>
                  </div>
                  <ToolWorkbench
                    tool={activeTool}
                    parsed={activeParsed}
                    expression={activeEq}
                    onExpressionChange={(next) =>
                      setSectionEqOverrides((prev) => ({
                        ...prev,
                        [sec.index]: next,
                      }))
                    }
                  />
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
