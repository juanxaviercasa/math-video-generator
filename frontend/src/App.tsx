import React, { lazy, Suspense, useEffect, useMemo, useState } from 'react'
const AuthPanel = lazy(() => import('./components/AuthPanel').then((module) => ({ default: module.AuthPanel })))
const VideoGenerator = lazy(() => import('./components/VideoGenerator').then((module) => ({ default: module.VideoGenerator })))
const VideoLibrary = lazy(() => import('./components/VideoLibrary').then((module) => ({ default: module.VideoLibrary })))
const AiModelsPanel = lazy(() => import('./components/AiModelsPanel').then((module) => ({ default: module.AiModelsPanel })))
import { PasswordRecovery } from './components/PasswordRecovery'
import { SystemHealthBadge } from './components/SystemHealthBadge'
const MathSuperSuite = lazy(() => import('./components/MathSuperSuite').then((module) => ({ default: module.MathSuperSuite })))
const MathWidgetEmbedView = lazy(() => import('./components/MathWidgetEmbedView').then((module) => ({ default: module.MathWidgetEmbedView })))
const WebsiteMathAuditor = lazy(() => import('./components/WebsiteMathAuditor').then((module) => ({ default: module.WebsiteMathAuditor })))
import { type CategoryId } from './suite/catalog'
import { consumePasswordRecoveryUrl } from './services/password-recovery'
import { auth, User } from './services/auth'

// Process recovery tokens exactly once, before React StrictMode can remount components.
// Their URL fragment is immediately cleared and never written to local storage.
const incomingRecovery = consumePasswordRecoveryUrl()

function App() {
  const embedParams = useMemo(() => {
    if (typeof window === 'undefined') return null
    const params = new URLSearchParams(window.location.search)
    const isEmbed = params.get('embed') === '1' || params.get('mode') === 'embed'
    if (!isEmbed) return null
    return {
      toolId: params.get('tool') || undefined,
      expr: params.get('expr') || undefined,
    }
  }, [])

  const [user, setUser] = useState<User | null>(null)
  const [authLoading, setAuthLoading] = useState(true)
  const [libraryRefresh, setLibraryRefresh] = useState(0)
  const [recovery, setRecovery] = useState<{ session?: { accessToken: string }; error?: string } | null>(incomingRecovery)
  const [activeWorkspaceTab, setActiveWorkspaceTab] = useState<'studio' | 'supersuite' | 'auditor'>('supersuite')
  const [suiteCategory, setSuiteCategory] = useState<CategoryId>('video_anim')
  const [suiteToolId, setSuiteToolId] = useState<string | undefined>(undefined)
  const [suiteExpr, setSuiteExpr] = useState<string | undefined>(undefined)
  const [suiteKey, setSuiteKey] = useState(0)
  const [externalProblem, setExternalProblem] = useState<{
    title: string
    content: string
    key: number
  } | null>(null)

  useEffect(() => {
    if (embedParams) return
    auth
      .me()
      .then(setUser)
      .catch(() => setUser(null))
      .finally(() => setAuthLoading(false))
  }, [embedParams])

  if (embedParams) {
    return (
      <Suspense fallback={<div className="min-h-screen bg-slate-950 p-8 text-center text-sm text-slate-400">Cargando widget…</div>}>
        <MathWidgetEmbedView
          initialToolId={embedParams.toolId}
          initialExpression={embedParams.expr}
        />
      </Suspense>
    )
  }

  const handleOpenSpecificToolInSuite = (
    catId: CategoryId,
    toolId: string,
    expression: string
  ) => {
    setSuiteCategory(catId)
    setSuiteToolId(toolId)
    setSuiteExpr(expression)
    setSuiteKey((prev) => prev + 1)
    setActiveWorkspaceTab('supersuite')
  }

  const handleSendToVideoStudio = (title: string, expression: string) => {
    setExternalProblem({
      title,
      content: expression,
      key: Date.now(),
    })
    setActiveWorkspaceTab('studio')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800">
      <header className="app-header border-b border-slate-700/80 sticky top-0 z-50 bg-slate-950/90 backdrop-blur-xl">
        <div className="max-w-[1500px] mx-auto px-4 sm:px-6 py-4 space-y-3">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex items-center gap-3 min-w-0">
              <div className="brand-mark" aria-hidden="true">∑</div>
              <div className="min-w-0">
                <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white truncate">Math Video Generator</h1>
                <p className="text-slate-400 mt-0.5 text-xs sm:text-sm truncate">
                  Estudio visual para convertir matemáticas en experiencias interactivas
              </p>
              </div>
            </div>
            <div className="flex items-center gap-5">
              <div className="text-right hidden sm:block">
                <div className="text-xs uppercase tracking-[0.18em] text-slate-500">Espacio privado</div>
                <div className="text-sm font-semibold text-slate-300 mt-1">60 motores · 12 áreas</div>
              </div>
              {!authLoading && (
                <AuthPanel
                  user={user}
                  onAuthenticated={setUser}
                  onLogout={() => setUser(null)}
                  onForgotPassword={() => setRecovery({})}
                />
              )}
            </div>
          </div>

          {/* Primary mode switcher: only three destinations, categories live inside the suite */}
          <nav className="workspace-nav flex flex-wrap items-center gap-2 pt-3 border-t border-slate-800/80" aria-label="Áreas principales">
            <button
              type="button"
              onClick={() => setActiveWorkspaceTab('studio')}
              className={`workspace-nav-item ${activeWorkspaceTab === 'studio' ? 'is-active studio' : ''}`}
            >
              <span className="nav-icon">✦</span><span>Generador Manim</span>
              {externalProblem && (
                <span className="rounded-full bg-amber-400/20 border border-amber-400/40 px-2 py-0.5 text-[10px] text-amber-200">
                  Ejercicio cargado
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={() => setActiveWorkspaceTab('supersuite')}
              className={`workspace-nav-item ${activeWorkspaceTab === 'supersuite' ? 'is-active suite' : ''}`}
            >
              <span className="nav-icon">◈</span><span>Super-Suite</span><span className="nav-count">60</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveWorkspaceTab('auditor')}
              className={`workspace-nav-item ${activeWorkspaceTab === 'auditor' ? 'is-active auditor' : ''}`}
            >
              <span className="nav-icon">◎</span><span>Auditor Web</span>
            </button>
            <div className="ml-auto hidden lg:flex items-center gap-2 text-[11px] text-slate-500">
              <SystemHealthBadge />
              <span className="mx-1 text-slate-700">·</span>
              <span>Navegación por áreas</span>
            </div>
          </nav>
        </div>
      </header>

      <main className="max-w-[1500px] mx-auto px-4 sm:px-6 py-6 sm:py-8">
        <Suspense fallback={<div className="rounded-2xl border border-slate-700 bg-slate-900/80 p-10 text-center text-sm text-slate-400">Cargando espacio de trabajo…</div>}>
        {recovery ? (
          <PasswordRecovery key={recovery.session?.accessToken ? 'token' : 'request'} recovery={recovery} onClose={() => setRecovery(null)} />
        ) : activeWorkspaceTab === 'auditor' ? (
          <WebsiteMathAuditor
            onOpenToolInSuite={handleOpenSpecificToolInSuite}
            onSendToVideoStudio={handleSendToVideoStudio}
          />
        ) : activeWorkspaceTab === 'supersuite' ? (
          <MathSuperSuite
            key={`${suiteCategory}-${suiteToolId || 'first'}-${suiteKey}`}
            initialCategory={suiteCategory}
            initialToolId={suiteToolId}
            initialExpression={suiteExpr}
            onSendToVideoStudio={handleSendToVideoStudio}
            onOpenWebAuditor={() => setActiveWorkspaceTab('auditor')}
          />
        ) : authLoading ? (
          <div className="rounded-lg border border-slate-700 bg-slate-800 p-8 text-center text-slate-300">Verificando mi sesión…</div>
        ) : user?.authMode === 'supabase' ? (
          <div className="mx-auto max-w-2xl rounded-lg border border-blue-500/40 bg-slate-800 p-8">
            <h2 className="text-xl font-semibold text-white">Acceso personal verificado con Supabase</h2>
            <p className="mt-3 text-slate-200">
              Ya has iniciado sesión con tu cuenta propietaria. La contraseña funciona correctamente.
            </p>
            {externalProblem && (
              <div className="mt-4 rounded-lg border border-cyan-500/40 bg-cyan-950/30 p-4">
                <p className="text-xs font-semibold uppercase tracking-wider text-cyan-300">
                  Ejercicio recibido desde la Super-Suite / Auditor Web
                </p>
                <p className="mt-1 text-sm font-bold text-white">{externalProblem.title}</p>
                <p className="mt-1 font-mono text-xs text-cyan-200">{externalProblem.content}</p>
              </div>
            )}
            <div className="mt-5 rounded-lg border border-amber-500/30 bg-slate-900/60 p-4">
              <p className="font-semibold text-amber-200">El servidor de generación aún no está conectado</p>
              <p className="mt-2 text-sm text-slate-300">
                Para crear videos, usar voces neurales y consultar archivos privados falta desplegar la API y el worker en Oracle
                y conectar api-math.forjavia.site. No se ha generado una sesión de backend.
              </p>
            </div>
            <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
              <p className="text-sm text-slate-400">
                Mientras tanto, puedes utilizar las 60 herramientas interactivas y el Auditor e Inyector de Sitios Web.
              </p>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setActiveWorkspaceTab('supersuite')}
                  className="rounded-lg bg-cyan-600 hover:bg-cyan-500 px-4 py-2 text-xs font-bold text-white transition"
                >
                  🧭 Super-Suite (60 Motores)
                </button>
                <button
                  type="button"
                  onClick={() => setActiveWorkspaceTab('auditor')}
                  className="rounded-lg bg-indigo-600 hover:bg-indigo-500 px-4 py-2 text-xs font-bold text-white transition"
                >
                  🕸️ Auditor e Inyector Web
                </button>
              </div>
            </div>
          </div>
        ) : !user ? (
          <div className="mx-auto max-w-xl rounded-lg border border-slate-700 bg-slate-800 p-8 text-center space-y-4">
            <h2 className="text-xl font-semibold text-white">Estudio privado de matemáticas</h2>
            <p className="text-slate-300">
              Inicia sesión con tu cuenta autorizada para acceder al generador de videos Manim 2.2, las voces neurales y tu biblioteca privada.
            </p>
            {externalProblem && (
              <div className="rounded-lg border border-cyan-500/40 bg-cyan-950/30 p-3 text-left">
                <p className="text-xs font-semibold text-cyan-300">Ejercicio listo para renderizar al iniciar sesión:</p>
                <p className="text-xs text-white font-mono mt-1">{externalProblem.title}</p>
              </div>
            )}
            <div className="pt-2 flex flex-wrap justify-center gap-2">
              <button
                type="button"
                onClick={() => setActiveWorkspaceTab('supersuite')}
                className="rounded-lg border border-cyan-500/50 bg-cyan-500/10 hover:bg-cyan-500/20 px-4 py-2 text-xs font-semibold text-cyan-300 transition"
              >
                🧭 Explorar Super-Suite (60 Motores)
              </button>
              <button
                type="button"
                onClick={() => setActiveWorkspaceTab('auditor')}
                className="rounded-lg border border-indigo-500/50 bg-indigo-500/10 hover:bg-indigo-500/20 px-4 py-2 text-xs font-semibold text-indigo-300 transition"
              >
                🕸️ Abrir Auditor e Inyector Web
              </button>
            </div>
          </div>
        ) : (
          <>
            <div className="grid lg:grid-cols-3 gap-8">
              <div className="lg:col-span-1">
                <VideoGenerator
                  externalProblem={externalProblem}
                  onGenerated={() => setLibraryRefresh((value) => value + 1)}
                />
              </div>
              <div className="lg:col-span-2">
                <VideoLibrary user={user} refreshKey={libraryRefresh} />
                <AiModelsPanel />
              </div>
            </div>
          </>
        )}
        </Suspense>
      </main>

      <footer className="border-t border-slate-700 mt-20 py-8 bg-slate-900/50">
        <div className="max-w-7xl mx-auto px-4 text-center text-slate-400 text-sm">
          <p>
            Math Video Generator — Estudio Manim 2.2 + Super-Suite de 60 Motores Open-Source + Auditor Web MCP/Kaggle
            {' | '}
            <a
              href="https://github.com/juanxaviercasa/math-video-generator"
              className="text-blue-400 hover:text-blue-300"
            >
              GitHub
            </a>
          </p>
        </div>
      </footer>
    </div>
  )
}

export default App
