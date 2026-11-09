import React, { useEffect, useMemo, useState } from 'react'
import { type CategoryId, type MathToolSpec } from '../suite/catalog'
import { parseQuadraticInput } from '../suite/mathEngines'
import {
  auditWebsiteContent,
  buildWidgetEmbedSnippet,
  crawlDomainAndAudit,
  SAMPLE_DOMAIN_PRESETS,
  SAMPLE_WEBSITE_TEMPLATES,
  type DomainAuditSummary,
  type WebsiteAuditSection,
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
  // Mode switcher: 'domain' (auto-crawl all pages) vs 'page' (single page / code editor)
  const [auditMode, setAuditMode] = useState<'domain' | 'page'>('domain')

  // Domain mode states
  const [domainInput, setDomainInput] = useState<string>(SAMPLE_DOMAIN_PRESETS[0].domain)
  const [selectedDomainPresetId, setSelectedDomainPresetId] = useState<string>(
    SAMPLE_DOMAIN_PRESETS[0].id
  )
  const [domainSummary, setDomainSummary] = useState<DomainAuditSummary | null>(null)
  const [crawling, setCrawling] = useState<boolean>(false)
  const [selectedDomainPageIndex, setSelectedDomainPageIndex] = useState<number | 'all'>(0)

  // Single page mode states
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>(
    SAMPLE_WEBSITE_TEMPLATES[0].id
  )
  const [targetUrl, setTargetUrl] = useState<string>(SAMPLE_WEBSITE_TEMPLATES[0].url)
  const [htmlContent, setHtmlContent] = useState<string>(
    SAMPLE_WEBSITE_TEMPLATES[0].content
  )

  // Section interactive previews and overrides
  const [expandedPreviewKey, setExpandedPreviewKey] = useState<string | null>('p0-s1')
  const [expandedMcpKey, setExpandedMcpKey] = useState<string | null>(null)
  const [sectionToolOverrides, setSectionToolOverrides] = useState<Record<string, MathToolSpec>>({})
  const [sectionEqOverrides, setSectionEqOverrides] = useState<Record<string, string>>({})
  const [copiedMessage, setCopiedMessage] = useState<string | null>(null)

  // Initial domain crawl on mount
  useEffect(() => {
    let active = true
    void crawlDomainAndAudit(domainInput, 6).then((res) => {
      if (active) setDomainSummary(res)
    })
    return () => {
      active = false
    }
  }, [])

  const handleCrawlDomain = async (domainToCrawl = domainInput) => {
    setCrawling(true)
    setExpandedPreviewKey(null)
    setExpandedMcpKey(null)
    try {
      const summary = await crawlDomainAndAudit(domainToCrawl, 8)
      setDomainSummary(summary)
      setSelectedDomainPageIndex(0)
    } catch {
      // Fallback handled inside crawlDomainAndAudit
    } finally {
      setCrawling(false)
    }
  }

  const handleSelectDomainPreset = (presetId: string) => {
    const found = SAMPLE_DOMAIN_PRESETS.find((p) => p.id === presetId)
    if (!found) return
    setSelectedDomainPresetId(found.id)
    setDomainInput(found.domain)
    void handleCrawlDomain(found.domain)
  }

  // Single page report
  const singlePageReport = useMemo(
    () => auditWebsiteContent(targetUrl, htmlContent),
    [targetUrl, htmlContent]
  )

  const handleLoadSingleTemplate = (templateId: string) => {
    const found = SAMPLE_WEBSITE_TEMPLATES.find((t) => t.id === templateId)
    if (!found) return
    setSelectedTemplateId(found.id)
    setTargetUrl(found.url)
    setHtmlContent(found.content)
    setSectionToolOverrides({})
    setSectionEqOverrides({})
    setExpandedPreviewKey('single-s1')
  }

  const handleCopy = (text: string, label: string) => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      void navigator.clipboard.writeText(text)
    }
    setCopiedMessage(`Copiado al portapapeles: ${label}`)
    window.setTimeout(() => setCopiedMessage(null), 3000)
  }

  const handleDownloadMasterJson = () => {
    if (!domainSummary) return
    const exportData = {
      domain: domainSummary.domain,
      generatedAt: new Date().toISOString(),
      crawledPages: domainSummary.pagesCount,
      totalInjectionPoints: domainSummary.totalOpportunities,
      enginesDistribution: domainSummary.enginesDistribution,
      pages: domainSummary.pages.map((p) => ({
        url: p.url,
        path: p.path,
        title: p.title,
        injectionPointsCount: p.opportunitiesCount,
        sections: p.sections.map((s) => ({
          sectionHeading: s.heading,
          detectedTopic: s.categoryTitle,
          formula: s.equation,
          recommendedEngine: {
            number: s.recommendedTool.number,
            name: s.recommendedTool.name,
            repo: s.recommendedTool.repo,
            githubUrl: s.recommendedTool.url,
          },
          embedIframeHtml: s.iframeCode,
          reactComponentSnippet: s.reactSnippet,
        })),
      })),
    }

    const blob = new Blob([JSON.stringify(exportData, null, 2)], {
      type: 'application/json',
    })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `plan-inyeccion-${domainSummary.domain.replace(/[^a-z0-9]/gi, '_')}.json`
    a.click()
    URL.revokeObjectURL(url)
    setCopiedMessage(`Descargado plan maestro JSON para ${domainSummary.domain}`)
    window.setTimeout(() => setCopiedMessage(null), 3500)
  }

  // Active sections to render based on current mode and page selection
  const displayedSections: Array<{
    uniqueKey: string
    pageTitle?: string
    pagePath?: string
    pageUrl?: string
    section: WebsiteAuditSection
  }> = useMemo(() => {
    if (auditMode === 'page') {
      return singlePageReport.sections.map((s) => ({
        uniqueKey: `single-s${s.index}`,
        pageTitle: 'Página Individual Auditada',
        pagePath: targetUrl,
        pageUrl: targetUrl,
        section: s,
      }))
    }

    if (!domainSummary || domainSummary.pages.length === 0) return []

    if (selectedDomainPageIndex === 'all') {
      return domainSummary.pages.flatMap((page, pIdx) =>
        page.sections.map((sec) => ({
          uniqueKey: `p${pIdx}-s${sec.index}`,
          pageTitle: page.title,
          pagePath: page.path,
          pageUrl: page.url,
          section: sec,
        }))
      )
    }

    const activePage = domainSummary.pages[selectedDomainPageIndex] || domainSummary.pages[0]
    return activePage.sections.map((sec) => ({
      uniqueKey: `p${selectedDomainPageIndex}-s${sec.index}`,
      pageTitle: activePage.title,
      pagePath: activePage.path,
      pageUrl: activePage.url,
      section: sec,
    }))
  }, [auditMode, singlePageReport, domainSummary, selectedDomainPageIndex, targetUrl])

  return (
    <div className="space-y-6">
      {/* Top Architecture Banner */}
      <div className="rounded-2xl border border-indigo-500/40 bg-gradient-to-br from-slate-900 via-slate-900 to-indigo-950/60 p-6 shadow-xl space-y-5">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-indigo-400/40 bg-indigo-500/15 px-3 py-1 text-xs font-semibold text-indigo-200">
              <span>🌐 Rastreador Autónomo de Dominio</span>
              <span>•</span>
              <span>Cerebro IA (Kaggle GPU + MCP)</span>
              <span>•</span>
              <span>60 Motores Deterministas Open-Source</span>
            </div>
            <h2 className="text-2xl font-bold text-white mt-2">
              Auditor e Inyector Estructural de Sitios Web de Matemáticas
            </h2>
            <p className="text-sm text-slate-300 mt-1 max-w-4xl">
              Introduce el <strong>dominio principal</strong> (ej: <code>miacademia.edu</code>) o cualquier URL/subdominio. La herramienta rastrea de forma autónoma todas las páginas y lecciones del sitio, analiza la estructura pedagógica de cada sección y asigna automáticamente <strong>cuál de los 60 motores deterministas</strong> debe inyectarse y con <strong>qué fórmula exacta</strong>.
            </p>
          </div>

          <div className="rounded-xl border border-slate-700 bg-slate-950/90 p-3.5 text-xs space-y-1.5 shrink-0">
            <div className="font-bold text-cyan-300 uppercase tracking-wider text-[11px]">
              Ecosistema Activo
            </div>
            <div className="flex items-center justify-between gap-4 text-slate-300">
              <span>Motores Deterministas:</span>
              <span className="font-mono font-bold text-emerald-400">60 Motores (#01..#60)</span>
            </div>
            <div className="flex items-center justify-between gap-4 text-slate-300">
              <span>Herramientas MCP:</span>
              <span className="font-mono font-bold text-blue-400">crawl_and_audit_domain (9 Tools)</span>
            </div>
            <div className="flex items-center justify-between gap-4 text-slate-300">
              <span>Cálculo Simbólico:</span>
              <span className="font-mono font-bold text-amber-300">100% Exacto (SymPy / AST)</span>
            </div>
          </div>
        </div>

        {/* Audit Mode Selector Bar */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-800">
          <button
            type="button"
            onClick={() => setAuditMode('domain')}
            className={`rounded-xl px-4 py-2 text-xs font-bold transition flex items-center gap-2 ${
              auditMode === 'domain'
                ? 'bg-gradient-to-r from-indigo-600 to-blue-600 text-white shadow-lg shadow-indigo-950/60'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            <span>🌐 Modo Dominio Completo (Rastreo Multi-Página Autónomo)</span>
            <span className="rounded-full bg-emerald-400/20 px-2 py-0.5 text-[10px] text-emerald-300 font-mono">
              Recomendado
            </span>
          </button>

          <button
            type="button"
            onClick={() => setAuditMode('page')}
            className={`rounded-xl px-4 py-2 text-xs font-bold transition flex items-center gap-2 ${
              auditMode === 'page'
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-950/60'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            <span>📄 Modo Página Específica / Subdominio / Editor HTML</span>
          </button>
        </div>
      </div>

      {copiedMessage && (
        <div className="rounded-xl border border-emerald-500/40 bg-emerald-500/15 px-4 py-2.5 text-xs font-semibold text-emerald-200">
          ✅ {copiedMessage}
        </div>
      )}

      {/* DOMAIN MODE CONTROLS */}
      {auditMode === 'domain' && (
        <div className="rounded-2xl border border-slate-700/80 bg-slate-900/90 p-5 space-y-4">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
            <div>
              <h3 className="text-base font-bold text-white">
                1. Rastreador Autónomo: Ingresa el Dominio Principal de tu Sitio Web
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Rastreará la raíz y descubrirá automáticamente las páginas internas (ej: <code>/algebra</code>, <code>/calculo</code>, <code>/geometria</code>).
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs text-slate-400">Dominios de prueba:</span>
              {SAMPLE_DOMAIN_PRESETS.map((preset) => (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => handleSelectDomainPreset(preset.id)}
                  className={`rounded-lg border px-2.5 py-1 text-xs transition ${
                    selectedDomainPresetId === preset.id && domainInput === preset.domain
                      ? 'border-cyan-400 bg-cyan-500/20 text-cyan-200 font-semibold'
                      : 'border-slate-700 bg-slate-950 text-slate-300 hover:border-slate-500'
                  }`}
                >
                  {preset.title}
                </button>
              ))}
            </div>
          </div>

          {/* Big Domain Crawl Bar */}
          <div className="flex flex-col sm:flex-row items-center gap-3">
            <div className="relative flex-1 w-full">
              <span className="absolute left-3.5 top-2.5 text-slate-400 text-xs">🌐</span>
              <input
                type="text"
                value={domainInput}
                onChange={(e) => setDomainInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') void handleCrawlDomain()
                }}
                placeholder="Ingresa tu dominio (ej. mi-academia-matematica.edu o https://sitio.edu)"
                className="w-full rounded-xl border border-slate-700 bg-slate-950 pl-8 pr-4 py-2.5 text-sm font-mono text-cyan-200 focus:border-cyan-400 focus:outline-none"
              />
            </div>

            <button
              type="button"
              disabled={crawling || !domainInput.trim()}
              onClick={() => void handleCrawlDomain()}
              className="w-full sm:w-auto rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 px-6 py-2.5 text-xs font-bold text-white shadow-lg shadow-indigo-900/40 disabled:opacity-50 transition shrink-0"
            >
              {crawling ? '⏳ Rastreando Dominio...' : '🚀 Rastrear Dominio Completo'}
            </button>
          </div>

          {/* Domain Crawl Results Dashboard */}
          {domainSummary && (
            <div className="pt-2 space-y-4">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="rounded-xl border border-slate-800 bg-slate-950 p-3.5 text-center">
                  <div className="text-[11px] uppercase tracking-wider text-slate-400">Dominio Rastreado</div>
                  <div className="mt-1 text-sm font-bold font-mono text-blue-300 truncate">
                    {domainSummary.domain}
                  </div>
                </div>

                <div className="rounded-xl border border-slate-800 bg-slate-950 p-3.5 text-center">
                  <div className="text-[11px] uppercase tracking-wider text-slate-400">Páginas Descubiertas</div>
                  <div className="mt-1 text-lg font-bold text-white">
                    {domainSummary.pagesCount} páginas
                  </div>
                </div>

                <div className="rounded-xl border border-slate-800 bg-slate-950 p-3.5 text-center">
                  <div className="text-[11px] uppercase tracking-wider text-slate-400">Puntos de Inyección</div>
                  <div className="mt-1 text-lg font-bold text-cyan-300">
                    {domainSummary.totalOpportunities} widgets
                  </div>
                </div>

                <div className="rounded-xl border border-slate-800 bg-slate-950 p-3.5 text-center">
                  <div className="text-[11px] uppercase tracking-wider text-slate-400">Cero Alucinaciones</div>
                  <div className="mt-1 text-lg font-bold text-emerald-400">
                    100% Determinista
                  </div>
                </div>
              </div>

              {/* Discovered Pages Tabs Bar */}
              <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-800 pt-3">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs font-semibold text-slate-300">Páginas del Dominio:</span>
                  <button
                    type="button"
                    onClick={() => setSelectedDomainPageIndex('all')}
                    className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition ${
                      selectedDomainPageIndex === 'all'
                        ? 'bg-blue-600 text-white'
                        : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                    }`}
                  >
                    Ver Todas ({domainSummary.totalOpportunities} widgets)
                  </button>

                  {domainSummary.pages.map((page, idx) => (
                    <button
                      key={page.path}
                      type="button"
                      onClick={() => setSelectedDomainPageIndex(idx)}
                      className={`rounded-lg border px-2.5 py-1 text-xs transition flex items-center gap-1.5 ${
                        selectedDomainPageIndex === idx
                          ? 'border-cyan-400 bg-cyan-500/20 text-cyan-200 font-semibold'
                          : 'border-slate-800 bg-slate-950 text-slate-400 hover:text-white'
                      }`}
                    >
                      <span>📄</span>
                      <span className="font-mono">{page.path}</span>
                      <span className="rounded-full bg-slate-800 px-1.5 py-0.2 text-[10px] text-cyan-300">
                        {page.opportunitiesCount}
                      </span>
                    </button>
                  ))}
                </div>

                {/* Global Export Actions */}
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleDownloadMasterJson}
                    className="rounded-lg border border-indigo-500/40 bg-indigo-500/15 hover:bg-indigo-500/25 px-3 py-1.5 text-xs font-semibold text-indigo-200 transition"
                  >
                    📥 Descargar Plan JSON
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      const allIframes = domainSummary.pages
                        .flatMap((p) => p.sections.map((s) => `<!-- ${p.path} : ${s.heading} -->\n${s.iframeCode}`))
                        .join('\n\n')
                      handleCopy(allIframes, `Todos los iframes de ${domainSummary.domain}`)
                    }}
                    className="rounded-lg border border-emerald-500/40 bg-emerald-500/15 hover:bg-emerald-500/25 px-3 py-1.5 text-xs font-semibold text-emerald-200 transition"
                  >
                    📋 Copiar Todos los Iframes
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* SINGLE PAGE / CUSTOM CODE MODE */}
      {auditMode === 'page' && (
        <div className="rounded-2xl border border-slate-700/80 bg-slate-900/90 p-5 space-y-4">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
            <div>
              <h3 className="text-base font-bold text-white">
                1. Auditoría de Página Única o Subdominio Específico
              </h3>
              <p className="text-xs text-slate-400">
                Pega la URL de una lección concreta o edita el HTML/Markdown directamente.
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              {SAMPLE_WEBSITE_TEMPLATES.map((tpl) => (
                <button
                  key={tpl.id}
                  type="button"
                  onClick={() => handleLoadSingleTemplate(tpl.id)}
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
                  URL de la Página o Subdominio
                </label>
                <input
                  type="text"
                  value={targetUrl}
                  onChange={(e) => setTargetUrl(e.target.value)}
                  className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 font-mono text-xs text-blue-300 focus:border-blue-500 focus:outline-none"
                />
              </div>

              <div className="rounded-xl border border-slate-800 bg-slate-950 p-3.5 space-y-2 text-xs">
                <div className="font-semibold text-slate-200">Resumen de Página:</div>
                <div className="flex justify-between text-slate-400">
                  <span>Secciones encontradas:</span>
                  <span className="font-mono font-bold text-white">{singlePageReport.totalSections}</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Macro-Categorías:</span>
                  <span className="font-mono font-bold text-cyan-300">{singlePageReport.categoriesUsed.length}</span>
                </div>
              </div>
            </div>

            <div className="lg:col-span-8">
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Contenido HTML / Markdown de la Lección
              </label>
              <textarea
                value={htmlContent}
                onChange={(e) => setHtmlContent(e.target.value)}
                rows={6}
                className="w-full rounded-xl border border-slate-700 bg-slate-950 p-3 font-mono text-xs text-slate-200 focus:border-cyan-400 focus:outline-none"
              />
            </div>
          </div>
        </div>
      )}

      {/* INJECTION OPPORTUNITIES LIST */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold text-white">
            2. Mapa Estructural de Inyección: Fórmulas y Motores Asignados ({displayedSections.length} Oportunidades)
          </h3>
          <span className="text-xs text-slate-400">
            Cada sección recibe su motor determinista (#01..#60) + ecuación validada lista para incrustar
          </span>
        </div>

        {displayedSections.map(({ uniqueKey, pageTitle, pagePath, section: sec }) => {
          const activeTool = sectionToolOverrides[uniqueKey] ?? sec.recommendedTool
          const activeEq = sectionEqOverrides[uniqueKey] ?? sec.equation
          const activeParsed = parseQuadraticInput(activeEq)
          const activeEmbed = buildWidgetEmbedSnippet(activeTool, activeEq)
          const isPreviewOpen = expandedPreviewKey === uniqueKey
          const isMcpOpen = expandedMcpKey === uniqueKey

          return (
            <div
              key={uniqueKey}
              className="rounded-2xl border border-slate-700/90 bg-slate-900/95 p-5 shadow-lg space-y-4"
            >
              {/* Section Header */}
              <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4 border-b border-slate-800 pb-4">
                <div className="space-y-1.5 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    {pagePath && (
                      <span className="rounded bg-slate-800 border border-slate-700 px-2 py-0.5 text-[11px] font-mono text-slate-300">
                        📄 {pagePath}
                      </span>
                    )}
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
                      🔍 Diagnóstico: {sec.detectedGap}
                    </span>
                    <span className="rounded bg-purple-500/15 border border-purple-500/30 px-2 py-0.5 text-[11px] font-mono text-purple-200">
                      ⚡ Kaggle GPU: {sec.kaggleRole}
                    </span>
                  </div>
                </div>

                {/* Assigned Tool Card */}
                <div className="rounded-xl border border-cyan-500/40 bg-slate-950 p-3.5 min-w-[280px] space-y-2 shrink-0">
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

                  <div className="pt-1">
                    <label className="block text-[10px] text-slate-400 mb-1">
                      Alternativas en la misma categoría:
                    </label>
                    <select
                      value={activeTool.id}
                      onChange={(e) => {
                        const allInCat = [sec.recommendedTool, ...sec.alternativeTools]
                        const chosen = allInCat.find((t) => t.id === e.target.value)
                        if (chosen) {
                          setSectionToolOverrides((prev) => ({ ...prev, [uniqueKey]: chosen }))
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

              {/* Equation Bar and Embed Action Buttons */}
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
                <div className="flex flex-wrap items-center gap-2 flex-1">
                  <span className="text-xs font-semibold text-slate-300">
                    Fórmula Asignada:
                  </span>
                  <input
                    type="text"
                    value={activeEq}
                    onChange={(e) =>
                      setSectionEqOverrides((prev) => ({
                        ...prev,
                        [uniqueKey]: e.target.value,
                      }))
                    }
                    className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-1.5 font-mono text-xs text-cyan-200 min-w-[200px]"
                  />
                  <span className="rounded bg-emerald-500/15 border border-emerald-500/30 px-2 py-1 text-[11px] font-mono text-emerald-300">
                    ✓ Δ = {activeParsed.discriminant.toFixed(1)} | Raíces: {activeParsed.exactRootLabels.join(', ')}
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      setExpandedPreviewKey(isPreviewOpen ? null : uniqueKey)
                    }
                    className={`rounded-lg border px-3 py-1.5 text-xs font-bold transition ${
                      isPreviewOpen
                        ? 'border-cyan-400 bg-cyan-500/20 text-cyan-200'
                        : 'border-slate-700 bg-slate-800 text-slate-200 hover:border-slate-500'
                    }`}
                  >
                    {isPreviewOpen ? '👁️ Ocultar Widget' : '👁️ Ver Widget en Vivo'}
                  </button>

                  <button
                    type="button"
                    onClick={() => handleCopy(activeEmbed.iframeCode, `<iframe> de ${activeTool.name}`)}
                    className="rounded-lg border border-emerald-500/40 bg-emerald-500/15 hover:bg-emerald-500/25 px-3 py-1.5 text-xs font-semibold text-emerald-200 transition"
                  >
                    &lt;/&gt; Copiar &lt;iframe&gt;
                  </button>

                  <button
                    type="button"
                    onClick={() => setExpandedMcpKey(isMcpOpen ? null : uniqueKey)}
                    className="rounded-lg border border-purple-500/40 bg-purple-500/15 hover:bg-purple-500/25 px-3 py-1.5 text-xs font-semibold text-purple-200 transition"
                  >
                    🤖 Payload MCP
                  </button>

                  {onOpenToolInSuite && (
                    <button
                      type="button"
                      onClick={() =>
                        onOpenToolInSuite(activeTool.categoryId, activeTool.id, activeEq)
                      }
                      className="rounded-lg border border-slate-700 bg-slate-800 hover:bg-slate-700 px-3 py-1.5 text-xs text-slate-200 transition"
                    >
                      🧭 Abrir #{String(activeTool.number).padStart(2, '0')}
                    </button>
                  )}

                  {onSendToVideoStudio && (
                    <button
                      type="button"
                      onClick={() =>
                        onSendToVideoStudio(
                          `${pageTitle || 'Lección'}: ${sec.heading}`,
                          activeEq
                        )
                      }
                      className="rounded-lg bg-blue-600 hover:bg-blue-500 px-3 py-1.5 text-xs font-bold text-white transition"
                    >
                      🎬 Video Manim 2.2
                    </button>
                  )}
                </div>
              </div>

              {/* MCP Payload Inspector */}
              {isMcpOpen && (
                <div className="grid md:grid-cols-2 gap-4 rounded-xl border border-purple-500/30 bg-slate-950 p-4 text-xs">
                  <div className="space-y-2">
                    <span className="font-bold text-emerald-300">
                      Código HTML &lt;iframe&gt; para tu plantilla web:
                    </span>
                    <pre className="rounded bg-slate-900 p-3 font-mono text-[11px] text-emerald-200 overflow-x-auto">
                      {activeEmbed.iframeCode}
                    </pre>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-purple-300">
                        Invocación MCP (Antigravity / ChatGPT):
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

              {/* Interactive Widget Workbench Preview */}
              {isPreviewOpen && (
                <div className="rounded-xl border border-cyan-500/30 bg-slate-950/90 p-4 space-y-3">
                  <div className="flex items-center justify-between text-xs text-cyan-300">
                    <span className="font-bold">
                      ⚡ Vista Previa del Widget — Motor #{String(activeTool.number).padStart(2, '0')} ({activeTool.name})
                    </span>
                    <span className="font-mono text-[11px] text-slate-400">
                      100% Determinista · Cero Alucinaciones
                    </span>
                  </div>
                  <ToolWorkbench
                    tool={activeTool}
                    parsed={activeParsed}
                    expression={activeEq}
                    onExpressionChange={(next) =>
                      setSectionEqOverrides((prev) => ({
                        ...prev,
                        [uniqueKey]: next,
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
