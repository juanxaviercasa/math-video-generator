import { useState } from 'react'
import axios from 'axios'
import { auth, User } from '../services/auth'

type AuthPanelProps = {
  user: User | null
  onAuthenticated: (user: User) => void
  onLogout: () => void
  onForgotPassword: () => void
}

export function AuthPanel({ user, onAuthenticated, onLogout, onForgotPassword }: AuthPanelProps) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [open, setOpen] = useState(false)

  if (user) {
    return (
      <div className="flex items-center gap-3 text-right">
        <div>
          <p className="text-sm font-medium text-white">{user.name}</p>
          <p className="text-xs text-slate-400">Espacio personal</p>
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
          <p className="mb-4 text-sm font-semibold text-white">Acceso privado</p>
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
            autoComplete="current-password"
            className="mb-3 w-full rounded border border-slate-600 bg-slate-700 px-3 py-2 text-sm text-white placeholder-slate-400 outline-none focus:border-blue-400"
          />

          {error && <p className="mb-3 text-xs text-red-300">{error}</p>}
          <button type="button" onClick={() => { setOpen(false); setPassword(''); onForgotPassword() }}
            className="mb-3 block text-xs text-blue-300 hover:text-blue-200">
            Olvidé mi contraseña
          </button>

          <button
            type="button"
            disabled={loading}
            onClick={async () => {
              setError('')
              setLoading(true)
              try {
                const nextUser = await auth.login(email, password)
                onAuthenticated(nextUser)
                setOpen(false)
                setPassword('')
              } catch (requestError) {
                if (axios.isAxiosError(requestError) && !requestError.response) {
                  setError('No se puede contactar con la API de Math Video Generator. Debe estar desplegada en api-math.forjavia.site.')
                } else if (axios.isAxiosError(requestError) && requestError.response?.status === 403) {
                  setError('Esta instalación admite únicamente la cuenta propietaria autorizada.')
                } else if (axios.isAxiosError(requestError) && requestError.response?.status === 401) {
                  setError('Correo o contraseña incorrectos. Utiliza tu cuenta confirmada de Supabase.')
                } else {
                  setError('Error al iniciar sesión. Comprueba el backend y vuelve a intentarlo.')
                }
              } finally {
                setLoading(false)
              }
            }}
            className="w-full rounded bg-blue-600 px-3 py-2 text-sm font-semibold text-white transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:bg-slate-600"
          >
            {loading ? 'Validando acceso...' : 'Entrar'}
          </button>
        </div>
      )}
    </div>
  )
}
