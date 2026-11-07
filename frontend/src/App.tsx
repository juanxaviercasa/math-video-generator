import React from 'react'
import { useEffect, useState } from 'react'
import { AuthPanel } from './components/AuthPanel'
import { VideoGenerator } from './components/VideoGenerator'
import { VideoLibrary } from './components/VideoLibrary'
import { auth, User } from './services/auth'

function App() {
  const [user, setUser] = useState<User | null>(null)
  const [authLoading, setAuthLoading] = useState(true)
  const [libraryRefresh, setLibraryRefresh] = useState(0)

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
                />
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-12">
        {authLoading ? (
          <div className="rounded-lg border border-slate-700 bg-slate-800 p-8 text-center text-slate-300">Verificando mi sesión…</div>
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
