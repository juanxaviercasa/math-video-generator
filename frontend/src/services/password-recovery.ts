/**
 * Personal Supabase password recovery. Works before the Oracle backend exists.
 * The browser receives only a public publishable key; never a service-role key.
 * Recovery tokens are held in memory and immediately removed from the URL.
 */
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://jplhbgyhswvbghhzhjvm.supabase.co'
const publishableKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || ''

export interface RecoverySession {
  accessToken: string
}

const headers = (): Record<string, string> => {
  if (!publishableKey) throw new Error('La recuperación de contraseña aún no está configurada en Cloudflare.')
  return { apikey: publishableKey, 'Content-Type': 'application/json' }
}

const responseError = async (response: Response): Promise<Error> => {
  const json = await response.json().catch(() => ({})) as { msg?: string; message?: string; error_description?: string }
  if (response.status === 429) return new Error('Se han enviado demasiados correos. Inténtalo más tarde.')
  if (response.status === 422) return new Error('El enlace expiró o la contraseña no cumple los requisitos de seguridad.')
  return new Error(json.msg || json.error_description || json.message || 'Supabase no pudo completar la operación.')
}

export async function requestPasswordRecovery(email: string): Promise<void> {
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) throw new Error('Introduce un correo válido.')
  const target = new URL('/auth/v1/recover', supabaseUrl)
  // Root is the configured Site URL, so no additional redirect allowlist entry is required.
  target.searchParams.set('redirect_to', 'https://math.forjavia.site')
  const response = await fetch(target.toString(), {
    method: 'POST',
    headers: headers(),
    body: JSON.stringify({ email: email.trim() }),
  })
  if (!response.ok) throw await responseError(response)
}

export function consumePasswordRecoveryUrl(): { session?: RecoverySession; error?: string } | null {
  const fragment = new URLSearchParams(window.location.hash.replace(/^#/, ''))
  const query = new URLSearchParams(window.location.search)
  const recovery = fragment.get('type') === 'recovery'
  const errorCode = fragment.get('error_code') || query.get('error_code')
  if (!recovery && !errorCode) return null
  // Never leave an access token or recovery error text in address-bar history.
  window.history.replaceState(null, '', window.location.pathname)

  if (errorCode) return { error: 'Este enlace ha caducado o ya fue utilizado. Solicita uno nuevo.' }
  const token = fragment.get('access_token')
  const tokenType = fragment.get('token_type')
  if (!token || (tokenType && tokenType.toLowerCase() !== 'bearer')) {
    return { error: 'No se recibió una sesión de recuperación válida. Solicita un nuevo enlace.' }
  }
  return { session: { accessToken: token } }
}

export async function updateRecoveredPassword(session: RecoverySession, password: string): Promise<void> {
  if (password.length < 12 || password.length > 128) throw new Error('Usa una contraseña de entre 12 y 128 caracteres.')
  const response = await fetch(new URL('/auth/v1/user', supabaseUrl).toString(), {
    method: 'PUT',
    headers: { ...headers(), Authorization: `Bearer ${session.accessToken}` },
    body: JSON.stringify({ password }),
  })
  if (!response.ok) throw await responseError(response)
}
