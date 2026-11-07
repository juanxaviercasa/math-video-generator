import axios from 'axios'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api'

export class ApiError extends Error {
  code?: string
  requestId?: string
  fields?: Record<string, string[]>
  status?: number

  constructor(message: string, details: { code?: string; requestId?: string; fields?: Record<string, string[]>; status?: number } = {}) {
    super(message)
    this.name = 'ApiError'
    Object.assign(this, details)
  }
}

const normalizeApiError = (error: unknown): ApiError => {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data as { error?: string; code?: string; requestId?: string; fields?: Record<string, string[]> } | undefined
    return new ApiError(data?.error || error.message || 'Error de comunicación con el servidor', {
      code: data?.code || 'HTTP_REQUEST_FAILED',
      requestId: data?.requestId || error.response?.headers?.['x-request-id'],
      fields: data?.fields,
      status: error.response?.status,
    })
  }
  return error instanceof ApiError ? error : new ApiError(error instanceof Error ? error.message : 'Error desconocido')
}
const API_ORIGIN = new URL(API_URL, window.location.origin).origin

const resolveAssetUrl = (value?: string) => {
  if (!value) return value
  if (/^https?:\/\//i.test(value)) return value
  return `${API_ORIGIN}${value.startsWith('/') ? value : `/${value}`}`
}

const normalizeVideo = <T extends { videoUrl?: string; thumbnailUrl?: string }>(video: T): T => ({
  ...video,
  videoUrl: resolveAssetUrl(video.videoUrl),
  thumbnailUrl: resolveAssetUrl(video.thumbnailUrl),
})

export interface MathValidation {
  supported: boolean
  valid: boolean
  kind: 'quadratic' | 'unsupported'
  normalizedInput: string
  method?: string
  result?: string
  steps: string[]
  warnings: string[]
}

interface VideoRequest {
  id?: string
  idempotencyKey?: string
  title: string
  content: string
  quality?: 'low' | 'medium' | 'high'
  aspectRatio?: '16:9' | '1:1' | '9:16'
  layoutDensity?: 'comfortable' | 'compact'
  narrationStyle?: 'warm_teacher' | 'neutral_teacher'
  enableNarration?: boolean
  narratorVoiceId?: string
  aiProvider?: 'openrouter' | 'gemini' | 'openai'
  enableComfyUI?: boolean
  steps?: string[]
}

interface VideoResponse {
  id?: string
  status: 'pending' | 'processing' | 'completed' | 'failed'
  progress: number
  message: string
  videoUrl?: string
  thumbnailUrl?: string
  error?: string
  errorCode?: string
  attempts?: number
  heartbeatAt?: string
  workerId?: string
  validation?: MathValidation
}

export interface AiModel {
  slug: string
  title: string
  role: string
  pack?: string
  sizeGb?: number
}
export interface AiInfrastructureStatus {
  configured: boolean
  reachable: boolean
  inferenceReady: boolean
  source: 'viralforge'
  models: AiModel[]
  message: string
}

export interface VoiceChoice {
  id: string
  label: string
  locale: string
  language: 'es'
  gender: 'female' | 'male'
  provider: 'edge'
}

export interface ExtractedExercise {
  problem: string
  sourceType: 'image/png' | 'image/jpeg' | 'image/webp' | 'application/pdf'
  observedSolutionSteps: string[]
  confidence: 'high' | 'medium' | 'low'
  requiresConfirmation: true
  warnings: string[]
  validation: MathValidation
}

export interface PreviewResponse {
  title: string
  validation: MathValidation
  steps: string[]
  formatProfile: {
    aspectRatio: '16:9' | '1:1' | '9:16'
    quality: 'low' | 'medium' | 'high'
    width: number
    height: number
    safeMargin: number
    orientation: 'landscape' | 'square' | 'portrait'
  }
  requiresReview: boolean
}

export interface LibraryVideo {
  id: string
  status: 'pending' | 'processing' | 'completed' | 'failed'
  progress: number
  message: string
  videoUrl?: string
  thumbnailUrl?: string
  duration?: number
  createdAt: string
  updatedAt: string
  error?: string
  errorCode?: string
  attempts?: number
  heartbeatAt?: string
}

export const api = {
  async getAiInfrastructure(): Promise<AiInfrastructureStatus> {
    const response = await axios.get<AiInfrastructureStatus>(`${API_URL}/ai-infrastructure`, { withCredentials: true })
    return response.data
  },

  async listVideos(): Promise<LibraryVideo[]> {
    const response = await axios.get<{ videos: LibraryVideo[] }>(`${API_URL}/videos`, {
      withCredentials: true,
    })
    return response.data.videos.map(normalizeVideo)
  },

  async getVoices(): Promise<VoiceChoice[]> {
    const response = await axios.get<{ voices: VoiceChoice[] }>(`${API_URL}/voices`, { withCredentials: true })
    return response.data.voices
  },

  async previewVoice(narratorVoiceId: string, narrationStyle: 'warm_teacher' | 'neutral_teacher'): Promise<Blob> {
    try {
      const response = await axios.post<ArrayBuffer>(
        `${API_URL}/voices/preview`,
        { narratorVoiceId, narrationStyle },
        { withCredentials: true, responseType: 'arraybuffer', timeout: 65000 },
      )
      return new Blob([response.data], { type: 'audio/mpeg' })
    } catch (error) {
      // For binary responses axios cannot parse the server's JSON diagnostic automatically.
      if (axios.isAxiosError(error) && error.response?.data instanceof ArrayBuffer) {
        try {
          const data = JSON.parse(new TextDecoder().decode(error.response.data)) as { code?: string; error?: string }
          throw new ApiError(data.error || 'No se pudo generar la muestra de voz', { code: data.code, status: error.response.status })
        } catch (parsed) {
          if (parsed instanceof ApiError) throw parsed
        }
      }
      throw normalizeApiError(error)
    }
  },

  async extractExercise(file: File, page = 1, provider: 'openrouter' | 'gemini' | 'openai' = 'gemini'): Promise<ExtractedExercise> {
    try {
      const response = await axios.post<ExtractedExercise>(`${API_URL}/extract-exercise?page=${encodeURIComponent(page)}&provider=${encodeURIComponent(provider)}`, file, {
        withCredentials: true,
        headers: { 'Content-Type': file.type },
        timeout: 60000,
      })
      return response.data
    } catch (error) {
      throw normalizeApiError(error)
    }
  },

  async preview(data: Omit<VideoRequest, 'id'>): Promise<PreviewResponse> {
    try {
      const response = await axios.post<PreviewResponse>(`${API_URL}/preview`, data, {
        withCredentials: true,
      })
      return response.data
    } catch (error) {
      const normalized = normalizeApiError(error)
      console.error('Preview API Error:', normalized)
      throw normalized
    }
  },

  async generateVideo(data: VideoRequest): Promise<VideoResponse> {
    try {
      const response = await axios.post(
        `${API_URL}/generate-video`,
        {
          ...data,
          id: data.id || `video_${Date.now()}`,
          idempotencyKey: data.idempotencyKey,
        },
        { withCredentials: true },
      )
      return normalizeVideo(response.data)
    } catch (error) {
      const normalized = normalizeApiError(error)
      console.error('API Error:', normalized)
      throw normalized
    }
  },

  async getVideoStatus(id: string): Promise<VideoResponse> {
    try {
      const response = await axios.get(`${API_URL}/generate-video/status/${id}`, {
        withCredentials: true,
      })
      return normalizeVideo(response.data)
    } catch (error) {
      const normalized = normalizeApiError(error)
      console.error('API Error:', normalized)
      throw normalized
    }
  },
}
