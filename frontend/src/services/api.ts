import axios from 'axios'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api'

interface VideoRequest {
  id?: string
  title: string
  content: string
  quality?: 'low' | 'medium' | 'high'
  enableNarration?: boolean
  aiProvider?: 'openrouter' | 'gemini' | 'openai'
  enableComfyUI?: boolean
}

interface VideoResponse {
  id?: string
  status: 'pending' | 'processing' | 'completed' | 'failed'
  progress: number
  message: string
  videoUrl?: string
  thumbnailUrl?: string
  error?: string
}

export const api = {
  async generateVideo(data: VideoRequest): Promise<VideoResponse> {
    try {
      const response = await axios.post(
        `${API_URL}/generate-video`,
        {
          ...data,
          id: data.id || `video_${Date.now()}`,
        },
        { withCredentials: true },
      )
      return response.data
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
      return response.data
    } catch (error) {
      console.error('API Error:', error)
      throw error
    }
  },
}
