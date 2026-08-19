import { create } from 'zustand'

interface Video {
  id: string
  title: string
  content: string
  status: 'pending' | 'processing' | 'completed' | 'failed'
  progress: number
  videoUrl?: string
  thumbnailUrl?: string
  message?: string
  error?: string
  errorCode?: string
  attempts?: number
  heartbeatAt?: string
  createdAt: string
}

interface VideoStore {
  videos: Video[]
  addVideo: (video: Video) => void
  updateVideo: (id: string, updates: Partial<Video>) => void
  removeVideo: (id: string) => void
  clearVideos: () => void
}

export const useVideoStore = create<VideoStore>((set) => ({
  videos: [],
  addVideo: (video) =>
    set((state) => ({
      videos: [video, ...state.videos],
    })),
  updateVideo: (id, updates) =>
    set((state) => ({
      videos: state.videos.map((v) => (v.id === id ? { ...v, ...updates } : v)),
    })),
  removeVideo: (id) =>
    set((state) => ({
      videos: state.videos.filter((v) => v.id !== id),
    })),
  clearVideos: () => set({ videos: [] }),
}))
