import axios from 'axios'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api'
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
  async listVideos(): Promise<LibraryVideo[]> {
    const response = await axios.get<{ videos: LibraryVideo[] }>(`${API_URL}/videos`, {
      withCredentials: true,
    })
    return response.data.videos.map(normalizeVideo)
  },

  async preview(data: Omit<VideoRequest, 'id'>): Promise<PreviewResponse> {
    const response = await axios.post<PreviewResponse>(`${API_URL}/preview`, data, {
      withCredentials: true,
    })
    return response.data
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
      console.error('API Error:', error)
      throw error
    }
  },

  async getVideoStatus(id: string): Promise<VideoResponse> {
    try {
      const response = await axios.get(`${API_URL}/generate-video/status/${id}`, {
        withCredentials: true,
      })
      return normalizeVideo(response.data)
    } catch (error) {
      console.error('API Error:', error)
      throw error
    }
  },
}
