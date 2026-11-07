import { useEffect, useState } from 'react'
import { auth, User } from '../services/auth'

type AuthPanelProps = {
  user: User | null
  onAuthenticated: (user: User) => void
  onLogout: () => void
}

export function AuthPanel({ user, onAuthenticated, onLogout }: AuthPanelProps) {
  const [mode, setMode] = useState<'login' | 'register'>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [open, setOpen] = useState(false)

  useEffect(() => {
    setError('')
  }, [mode])

  if (user) {
    return (
      <div className="flex items-center gap-3 text-right">
        <div>
          <p className="text-sm font-medium text-white">{user.name}</p>
          <p className="text-xs text-slate-400">Plan {user.plan}</p>
        </div>
        <button
          type="button"
          onClick={async () => {
            await auth.logout()
            onLogout()
          }}
          className="rounded border border-slate-600 px-3 py-2 text-xs text-slate-200 transition hover:border-blue-400 hover:text-white"
        >
          Salir
        </button>
      </div>
    )
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="rounded bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-500"
      >
        Iniciar sesión
      </button>

      {open && (
        <div className="absolute right-0 top-12 z-50 w-80 rounded-lg border border-slate-600 bg-slate-800 p-4 shadow-xl">
          <div className="mb-4 flex gap-2 border-b border-slate-700 pb-3">
            <button
              type="button"
              onClick={() => setMode('login')}
              className={`text-sm ${mode === 'login' ? 'font-semibold text-blue-400' : 'text-slate-400'}`}
            >
              Entrar
            </button>
            <button
              type="button"
              onClick={() => setMode('register')}
              className={`text-sm ${mode === 'register' ? 'font-semibold text-blue-400' : 'text-slate-400'}`}
            >
              Crear cuenta
            </button>
          </div>

          {mode === 'register' && (
            <input
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Nombre"
              autoComplete="name"
              className="mb-2 w-full rounded border border-slate-600 bg-slate-700 px-3 py-2 text-sm text-white placeholder-slate-400 outline-none focus:border-blue-400"
            />
          )}
          <input
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="Correo electrónico"
            type="email"
            autoComplete="email"
            className="mb-2 w-full rounded border border-slate-600 bg-slate-700 px-3 py-2 text-sm text-white placeholder-slate-400 outline-none focus:border-blue-400"
          />
          <input
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="Contraseña"
            type="password"
            autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
            className="mb-3 w-full rounded border border-slate-600 bg-slate-700 px-3 py-2 text-sm text-white placeholder-slate-400 outline-none focus:border-blue-400"
          />

          {error && <p className="mb-3 text-xs text-red-300">{error}</p>}

          <button
            type="button"
            disabled={loading}
            onClick={async () => {
              setError('')
              setLoading(true)
              try {
                const nextUser =
                  mode === 'login'
                    ? await auth.login(email, password)
                    : await auth.register(email, password, name)
                onAuthenticated(nextUser)
                setOpen(false)
                setPassword('')
              } catch (requestError) {
                setError('No se pudo completar la operación. Revisa los datos e inténtalo de nuevo.')
              } finally {
                setLoading(false)
              }
            }}
            className="w-full rounded bg-blue-600 px-3 py-2 text-sm font-semibold text-white transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:bg-slate-600"
          >
            {loading ? 'Procesando...' : mode === 'login' ? 'Entrar' : 'Registrarme'}
          </button>
        </div>
      )}
    </div>
  )
}
