import { useState } from 'react'
import { requestPasswordRecovery, updateRecoveredPassword, type RecoverySession } from '../services/password-recovery'

interface Props {
  recovery?: { session?: RecoverySession; error?: string } | null
  initialEmail?: string
  onClose: () => void
}

export function PasswordRecovery({ recovery, initialEmail = '', onClose }: Props) {
  const [email, setEmail] = useState(initialEmail)
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [session, setSession] = useState<RecoverySession | undefined>(recovery?.session)
  const [error, setError] = useState(recovery?.error || '')
  const [busy, setBusy] = useState(false)
  const [sent, setSent] = useState(false)
  const [complete, setComplete] = useState(false)

  const request = async () => {
    setError('')
    setBusy(true)
    try {
      await requestPasswordRecovery(email)
      setSent(true)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No fue posible enviar el correo.')
    } finally {
      setBusy(false)
    }
  }

  const submit = async () => {
    if (!session) return
    if (password !== confirmPassword) {
      setError('Las dos contraseñas no coinciden.')
      return
    }
    setBusy(true)
    setError('')
    try {
      await updateRecoveredPassword(session, password)
      setComplete(true)
      setSession(undefined)
      setPassword('')
      setConfirmPassword('')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo actualizar la contraseña.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <section className="mx-auto max-w-lg rounded-lg border border-slate-600 bg-slate-800 p-7 shadow-lg">
      <h2 className="text-xl font-semibold text-white">
        {session ? 'Establecer mi contraseña' : 'Recuperar acceso a mi estudio'}
      </h2>
      <p className="mt-2 text-sm text-slate-300">
        {session
          ? 'Introduce tu nueva contraseña. Solo se enviará a Supabase Auth.'
          : 'Recibirás un correo con un enlace para elegir tu contraseña. No necesitas el backend de Oracle para este paso.'}
      </p>
      {error && <p role="alert" className="mt-4 rounded border border-red-500/50 p-3 text-sm text-red-300">{error}</p>}
      {complete ? (
        <p role="status" className="mt-4 text-green-300">Contraseña actualizada. Podrás iniciar sesión cuando el backend de Oracle esté disponible.</p>
      ) : session ? (
        <form className="mt-5 space-y-3" onSubmit={(event) => { event.preventDefault(); void submit() }}>
          <label htmlFor="new-password" className="block text-sm text-slate-200">Nueva contraseña (mínimo 12 caracteres)</label>
          <input id="new-password" type="password" autoComplete="new-password" required minLength={12} maxLength={128}
            value={password} onChange={(event) => setPassword(event.target.value)}
            className="w-full rounded border border-slate-500 bg-slate-900 px-3 py-2 text-white" />
          <label htmlFor="confirm-password" className="block text-sm text-slate-200">Repetir contraseña</label>
          <input id="confirm-password" type="password" autoComplete="new-password" required minLength={12} maxLength={128}
            value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)}
            className="w-full rounded border border-slate-500 bg-slate-900 px-3 py-2 text-white" />
          <button disabled={busy} type="submit" className="w-full rounded bg-blue-600 px-4 py-2 font-semibold text-white disabled:opacity-50">
            {busy ? 'Actualizando…' : 'Guardar nueva contraseña'}
          </button>
        </form>
      ) : sent ? (
        <p role="status" className="mt-5 text-green-300">Si la cuenta existe, recibirás un mensaje de recuperación. Utiliza el enlace más reciente y comprueba la carpeta de spam.</p>
      ) : (
        <form className="mt-5 space-y-3" onSubmit={(event) => { event.preventDefault(); void request() }}>
          <label htmlFor="recovery-email" className="block text-sm text-slate-200">Correo registrado en Supabase</label>
          <input id="recovery-email" type="email" autoComplete="email" required value={email}
            onChange={(event) => setEmail(event.target.value)} placeholder="Tu correo"
            className="w-full rounded border border-slate-500 bg-slate-900 px-3 py-2 text-white" />
          <button disabled={busy} type="submit" className="w-full rounded bg-blue-600 px-4 py-2 font-semibold text-white disabled:opacity-50">
            {busy ? 'Enviando…' : 'Enviar enlace de recuperación'}
          </button>
        </form>
      )}
      <button type="button" onClick={onClose} className="mt-5 text-sm text-blue-300 hover:text-blue-200">
        Volver al inicio de sesión
      </button>
    </section>
  )
}
