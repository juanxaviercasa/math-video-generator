import React from 'react'
import { useEffect, useState } from 'react'
import { AuthPanel } from './components/AuthPanel'
import { VideoGenerator } from './components/VideoGenerator'
import { VideoLibrary } from './components/VideoLibrary'
import { AiModelsPanel } from './components/AiModelsPanel'
import { PasswordRecovery } from './components/PasswordRecovery'
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

  useEffect(() => {
    auth
      .me()
      .then(setUser)
      .catch(() => setUser(null))
      .finally(() => setAuthLoading(false))
  }, [])

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800">
      <header className="border-b border-slate-700 sticky top-0 z-50 bg-slate-900/80 backdrop-blur">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-white">🎓 Math Video Generator</h1>
              <p className="text-slate-400 mt-1">Mi estudio de videos matemáticos con IA</p>
            </div>
            <div className="flex items-center gap-5">
              <div className="text-right">
                <div className="text-sm text-slate-400">Estudio privado</div>
                <div className="text-xs text-slate-500 mt-1">Generador de IA</div>
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
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-12">
        {recovery ? (
          <PasswordRecovery key={recovery.session?.accessToken ? 'token' : 'request'} recovery={recovery} onClose={() => setRecovery(null)} />
        ) : authLoading ? (
          <div className="rounded-lg border border-slate-700 bg-slate-800 p-8 text-center text-slate-300">Verificando mi sesión…</div>
        ) : user?.authMode === 'supabase' ? (
          <div className="mx-auto max-w-2xl rounded-lg border border-blue-500/40 bg-slate-800 p-8">
            <h2 className="text-xl font-semibold text-white">Acceso personal verificado con Supabase</h2>
            <p className="mt-3 text-slate-200">
              Ya has iniciado sesión con tu cuenta propietaria. La contraseña funciona correctamente.
            </p>
            <div className="mt-5 rounded-lg border border-amber-500/30 bg-slate-900/60 p-4">
              <p className="font-semibold text-amber-200">El servidor de generación aún no está conectado</p>
              <p className="mt-2 text-sm text-slate-300">
                Para crear videos, usar voces neurales y consultar archivos privados falta desplegar la API y el worker en Oracle
                y conectar api-math.forjavia.site. No se ha generado una sesión de backend.
              </p>
            </div>
            <p className="mt-4 text-sm text-slate-400">
              Cuando Oracle esté disponible, utiliza «Salir» e inicia sesión otra vez con esta misma contraseña
              para activar las funciones de video.
            </p>
          </div>
        ) : !user ? (
          <div className="mx-auto max-w-xl rounded-lg border border-slate-700 bg-slate-800 p-8 text-center">
            <h2 className="text-xl font-semibold text-white">Estudio privado de matemáticas</h2>
            <p className="mt-3 text-slate-300">Inicia sesión con tu cuenta autorizada para acceder al generador, las voces y tus videos.</p>
          </div>
        ) : (
          <>
            <div className="grid lg:grid-cols-3 gap-8">
              <div className="lg:col-span-1">
                <VideoGenerator onGenerated={() => setLibraryRefresh((value) => value + 1)} />
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
            Math Video Generator — uso personal
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
