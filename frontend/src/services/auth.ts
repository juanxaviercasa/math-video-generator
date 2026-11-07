import axios from 'axios'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api'

export interface User {
  id: string
  email: string
  name: string
  plan: string
}

interface AuthResponse {
  user: User
}

const client = axios.create({
  baseURL: API_URL,
  withCredentials: true,
})

export const auth = {
  async me(): Promise<User | null> {
    try {
      const response = await client.get<AuthResponse>('/auth/me')
      return response.data.user
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 401) return null
      throw error
    }
  },

  async login(email: string, password: string): Promise<User> {
    const response = await client.post<AuthResponse>('/auth/login', { email, password })
    return response.data.user
  },

  async register(email: string, password: string, name: string): Promise<User> {
    const response = await client.post<AuthResponse>('/auth/register', { email, password, name })
    return response.data.user
  },

  async logout(): Promise<void> {
    await client.post('/auth/logout')
  },
}
