import React, { useEffect, useState } from 'react'
import { AuthPanel } from './components/AuthPanel'
import { VideoGenerator } from './components/VideoGenerator'
import { VideoLibrary } from './components/VideoLibrary'
import { AiModelsPanel } from './components/AiModelsPanel'
import { PasswordRecovery } from './components/PasswordRecovery'
import { MathSuperSuite } from './components/MathSuperSuite'
import { MACRO_CATEGORIES, type CategoryId } from './suite/catalog'
import { consumePasswordRecoveryUrl } from './services/password-recovery'
import { auth, User } from './services/auth'

// Process recovery tokens exactly once, before React StrictMode can remount components.
// Their URL fragment is immediately cleared and never written to local storage.
const incomingRecovery = consumePasswordRecoveryUrl()

function App() {
  const [user, setUser] = useState<User | null>(null)
  const [authLoading, setAuthLoading] = useState(true)
  const [libraryRefresh, setLibraryRefresh] = useState(0)
  const [recovery, setRecovery] = useState<{ session?: { accessToken: string }; error?: string } | null>(incomingRecovery)
  const [activeWorkspaceTab, setActiveWorkspaceTab] = useState<'studio' | 'supersuite'>('supersuite')
  const [suiteCategory, setSuiteCategory] = useState<CategoryId>('video_anim')
  const [suiteKey, setSuiteKey] = useState(0)
  const [externalProblem, setExternalProblem] = useState<{
    title: string
    content: string
    key: number
  } | null>(null)

  useEffect(() => {
    auth
      .me()
      .then(setUser)
      .catch(() => setUser(null))
      .finally(() => setAuthLoading(false))
  }, [])

  const handleOpenCategory = (catId: CategoryId) => {
    setSuiteCategory(catId)
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
      <header className="border-b border-slate-700 sticky top-0 z-50 bg-slate-900/85 backdrop-blur">
        <div className="max-w-7xl mx-auto px-4 py-5 space-y-4">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-white">🎓 Math Video Generator</h1>
              <p className="text-slate-400 mt-1 text-sm">
                Estudio de videos matemáticos con IA (Pizarra Manim 2.2) + Super-Suite de 60 Motores Open-Source
              </p>
            </div>
            <div className="flex items-center gap-5">
              <div className="text-right hidden sm:block">
                <div className="text-sm text-slate-400">Estudio privado</div>
                <div className="text-xs text-slate-500 mt-1">12 Categorías · 60 Herramientas</div>
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

          {/* Primary Mode Switcher Tabs */}
          <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-800">
            <button
              type="button"
              onClick={() => setActiveWorkspaceTab('studio')}
              className={`rounded-xl px-4 py-2 text-xs font-bold transition flex items-center gap-2 ${
                activeWorkspaceTab === 'studio'
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-950/60'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              <span>🎬 Estudio Principal (Generador Manim 2.2)</span>
              {externalProblem && (
                <span className="rounded-full bg-amber-400/20 border border-amber-400/40 px-2 py-0.5 text-[10px] text-amber-200">
                  Ejercicio cargado
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={() => setActiveWorkspaceTab('supersuite')}
              className={`rounded-xl px-4 py-2 text-xs font-bold transition flex items-center gap-2 ${
                activeWorkspaceTab === 'supersuite'
                  ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-lg shadow-cyan-950/60'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              <span>🧭 Super-Suite Matemática (12 Categorías · 60 Motores)</span>
            </button>

            <div className="h-4 w-px bg-slate-700 mx-1 hidden lg:block" />

            {/* Quick Category Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 max-w-full">
              {MACRO_CATEGORIES.map((cat, idx) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => handleOpenCategory(cat.id)}
                  title={`${idx + 1}. ${cat.title}`}
                  className={`shrink-0 rounded-lg border px-2.5 py-1 text-[11px] font-medium transition ${
                    activeWorkspaceTab === 'supersuite' && suiteCategory === cat.id
                      ? 'border-cyan-400 bg-cyan-500/20 text-cyan-200'
                      : 'border-slate-800 bg-slate-900/90 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                  }`}
                >
                  {cat.icon} {cat.shortTitle}
                </button>
              ))}
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        {recovery ? (
          <PasswordRecovery key={recovery.session?.accessToken ? 'token' : 'request'} recovery={recovery} onClose={() => setRecovery(null)} />
        ) : activeWorkspaceTab === 'supersuite' ? (
          <MathSuperSuite
            key={`${suiteCategory}-${suiteKey}`}
            initialCategory={suiteCategory}
            onSendToVideoStudio={handleSendToVideoStudio}
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
                  Ejercicio recibido desde la Super-Suite Matemática
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
                Mientras tanto, puedes utilizar las 60 herramientas interactivas en la pestaña Super-Suite Matemática.
              </p>
              <button
                type="button"
                onClick={() => setActiveWorkspaceTab('supersuite')}
                className="rounded-lg bg-cyan-600 hover:bg-cyan-500 px-4 py-2 text-xs font-bold text-white transition"
              >
                🧭 Volver a la Super-Suite (60 Motores)
              </button>
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
            <div className="pt-2">
              <button
                type="button"
                onClick={() => setActiveWorkspaceTab('supersuite')}
                className="rounded-lg border border-cyan-500/50 bg-cyan-500/10 hover:bg-cyan-500/20 px-4 py-2 text-xs font-semibold text-cyan-300 transition"
              >
                🧭 Explorar las 60 Herramientas de la Super-Suite Matemática sin iniciar sesión
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
      </main>

      <footer className="border-t border-slate-700 mt-20 py-8 bg-slate-900/50">
        <div className="max-w-7xl mx-auto px-4 text-center text-slate-400 text-sm">
          <p>
            Math Video Generator — Estudio Manim 2.2 + Super-Suite de 60 Herramientas Open-Source
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
