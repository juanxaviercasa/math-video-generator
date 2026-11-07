import axios from 'axios'

// Backend authentication remains authoritative for private video files and jobs.
// Until Oracle is online, a Supabase owner may enter a clearly limited personal view.
const API_URL = import.meta.env.VITE_API_URL ||
  (import.meta.env.PROD ? 'https://api-math.forjavia.site/api' : 'http://localhost:3001/api')
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'https://jplhbgyhswvbghhzhjvm.supabase.co'
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || ''
const OWNER_ID = import.meta.env.VITE_OWNER_USER_ID || ''
const STORAGE_KEY = 'mvg.personal.supabase.session'

export interface User {
  id: string
  email: string
  name: string
  plan: string
  authMode?: 'backend' | 'supabase'
}

interface AuthResponse {
  user: User
}

interface SupabaseUser {
  id: string
  email?: string
  user_metadata?: { name?: string }
}

interface SupabaseTokenResult {
  access_token: string
  refresh_token: string
  expires_in: number
  user?: SupabaseUser
}

interface StoredSupabaseSession {
  accessToken: string
  refreshToken: string
  expiresAt: number
}

const client = axios.create({ baseURL: API_URL, withCredentials: true })

function ensureSupabaseReady(): void {
  if (!SUPABASE_KEY || !SUPABASE_URL.startsWith('https://')
    || !/^[0-9a-f-]{36}$/i.test(OWNER_ID)) {
    throw new Error('El inicio de sesión privado con Supabase no está configurado correctamente en Cloudflare.')
  }
}

function authHeaders(token?: string): Record<string, string> {
  return {
    apikey: SUPABASE_KEY,
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  }
}

function readSession(): StoredSupabaseSession | null {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const value = JSON.parse(raw) as Partial<StoredSupabaseSession>
    if (typeof value.accessToken !== 'string'
      || typeof value.refreshToken !== 'string'
      || typeof value.expiresAt !== 'number') return null
    return value as StoredSupabaseSession
  } catch {
    return null
  }
}

function clearSession(): void {
  sessionStorage.removeItem(STORAGE_KEY)
}

function saveSession(result: SupabaseTokenResult): StoredSupabaseSession {
  const record: StoredSupabaseSession = {
    accessToken: result.access_token,
    refreshToken: result.refresh_token,
    expiresAt: Date.now() + Math.max(result.expires_in || 60, 60) * 1000,
  }
  sessionStorage.setItem(STORAGE_KEY, JSON.stringify(record))
  return record
}

async function postSupabaseToken(grantType: 'password' | 'refresh_token', payload: object): Promise<SupabaseTokenResult> {
  ensureSupabaseReady()
  const target = new URL('/auth/v1/token', SUPABASE_URL)
  target.searchParams.set('grant_type', grantType)
  let response: Response
  try {
    response = await fetch(target.toString(), {
      method: 'POST', headers: authHeaders(), body: JSON.stringify(payload),
    })
  } catch {
    throw new Error('No se pudo contactar con Supabase Auth. Revisa tu conexión.')
  }
  if (!response.ok) {
    if (response.status === 429) throw new Error('Demasiados intentos. Intenta más tarde.')
    if (response.status === 400 || response.status === 401) throw new Error('Correo o contraseña incorrectos en Supabase.')
    throw new Error('Supabase Auth no pudo iniciar la sesión.')
  }
  const data = await response.json() as SupabaseTokenResult
  if (!data.access_token || !data.refresh_token) throw new Error('Supabase no devolvió una sesión válida.')
  return data
}

async function verifyOwner(session: StoredSupabaseSession): Promise<User> {
  ensureSupabaseReady()
  const response = await fetch(new URL('/auth/v1/user', SUPABASE_URL).toString(), {
    headers: authHeaders(session.accessToken),
  })
  if (!response.ok) throw new Error('La sesión de Supabase expiró o no es válida.')
  const identity = await response.json() as SupabaseUser
  // Ownership is based solely on the immutable Supabase Auth UUID, not user metadata.
  if (identity.id !== OWNER_ID) {
    clearSession()
    throw new Error('Esta instalación solo permite la cuenta propietaria autorizada.')
  }
  return {
    id: identity.id,
    email: identity.email || '',
    name: identity.user_metadata?.name || 'Mi estudio',
    plan: 'personal',
    authMode: 'supabase',
  }
}

async function restoreSupabaseOwner(): Promise<User | null> {
  let session = readSession()
  if (!session) return null
  try {
    if (session.expiresAt < Date.now() + 60_000) {
      const refreshed = await postSupabaseToken('refresh_token', { refresh_token: session.refreshToken })
      session = saveSession(refreshed)
    }
    return await verifyOwner(session)
  } catch {
    clearSession()
    return null
  }
}

export const auth = {
  async me(): Promise<User | null> {
    try {
      const response = await client.get<AuthResponse>('/auth/me', { timeout: 3500 })
      return { ...response.data.user, authMode: 'backend' }
    } catch {
      // A missing Oracle backend must not prevent logging into Supabase itself.
      return restoreSupabaseOwner()
    }
  },

  async login(email: string, password: string): Promise<User> {
    const response = await postSupabaseToken('password', { email: email.trim(), password })
    const stored = saveSession(response)
    let user: User
    try {
      user = await verifyOwner(stored)
    } catch (error) {
      clearSession()
      throw error
    }
    try {
      const backend = await client.post<AuthResponse>('/auth/login', { email, password }, { timeout: 3500 })
      return { ...backend.data.user, authMode: 'backend' }
    } catch {
      // Supabase authentication succeeded, but no Oracle API cookie exists.
      // Never claim that privileged video APIs are ready.
      return user
    }
  },

  async register(): Promise<never> {
    throw new Error('Este estudio no admite registros públicos.')
  },

  async logout(): Promise<void> {
    const stored = readSession()
    clearSession()
    if (stored) {
      await fetch(new URL('/auth/v1/logout', SUPABASE_URL).toString(), {
        method: 'POST', headers: authHeaders(stored.accessToken),
      }).catch(() => undefined)
    }
    await client.post('/auth/logout', undefined, { timeout: 3000 }).catch(() => undefined)
  },
}
