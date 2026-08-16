import { useState } from 'react'
import { api, PreviewResponse } from '../services/api'
import { useVideoStore } from '../store/video.store'
import { InteractiveMathEditor } from './InteractiveMathEditor'
import { InteractiveLessonPreview } from './InteractiveLessonPreview'

type VideoGeneratorProps = {
  onGenerated?: () => void
}

export function VideoGenerator({ onGenerated }: VideoGeneratorProps) {
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [quality, setQuality] = useState<'low' | 'medium' | 'high'>('medium')
  const [aspectRatio, setAspectRatio] = useState<'16:9' | '1:1' | '9:16'>('16:9')
  const [layoutDensity, setLayoutDensity] = useState<'comfortable' | 'compact'>('comfortable')
  const [narrationStyle, setNarrationStyle] = useState<'warm_teacher' | 'neutral_teacher'>('warm_teacher')
  const [enableNarration, setEnableNarration] = useState(true)
  const [aiProvider, setAiProvider] = useState<'openrouter' | 'gemini' | 'openai'>('openrouter')
  const [enableComfyUI, setEnableComfyUI] = useState(false)
  const [loading, setLoading] = useState(false)
  const [previewLoading, setPreviewLoading] = useState(false)
  const [preview, setPreview] = useState<PreviewResponse | null>(null)
  const [steps, setSteps] = useState<string[]>([])
  const [error, setError] = useState('')

  const addVideo = useVideoStore((state) => state.addVideo)

  const handlePreview = async () => {
    setError('')
    if (!title.trim() || !content.trim()) {
      setError('Completa el título y el contenido antes de previsualizar')
      return
    }

    setPreviewLoading(true)
    try {
      const result = await api.preview({ title, content, aspectRatio, layoutDensity, narrationStyle })
      setPreview(result)
      setSteps(result.steps)
      if (result.requiresReview) {
        setError('Este problema requiere revisión manual antes de generar el video.')
      }
    } catch (previewError) {
      setError('No se pudo preparar la previsualización')
    } finally {
      setPreviewLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!title.trim() || !content.trim()) {
      setError('Por favor completa todos los campos')
      return
    }

    setLoading(true)

    try {
      const videoId = `video_${Date.now()}`

      // Agregar a lista
      addVideo({
        id: videoId,
        title,
        content,
        status: 'pending',
        progress: 0,
        createdAt: new Date().toISOString(),
      })
      onGenerated?.()

      const response = await api.generateVideo({
        id: videoId,
        title,
        content,
        quality,
        aspectRatio,
        layoutDensity,
        narrationStyle,
        enableNarration,
        aiProvider,
        enableComfyUI,
        steps: steps.length ? steps : undefined,
      })

      const finalStatus = response.status || 'pending'
      const currentId = response.id || videoId

      useVideoStore.getState().updateVideo(videoId, {
        id: currentId,
        title,
        content,
        status: finalStatus,
        progress: response.progress || 0,
        videoUrl: response.videoUrl,
        thumbnailUrl: response.thumbnailUrl,
      })

      if (finalStatus === 'failed') {
        setError(response.error || response.message || 'La generación falló')
      }

      if (finalStatus === 'processing' || finalStatus === 'pending') {
        let polling = true
        const interval = window.setInterval(async () => {
          if (!polling) return

          try {
            const status = await api.getVideoStatus(currentId)
            useVideoStore.getState().updateVideo(currentId, {
              status: status.status,
              progress: status.progress,
              videoUrl: status.videoUrl,
              thumbnailUrl: status.thumbnailUrl,
            })

            if (status.status === 'completed' || status.status === 'failed') {
              polling = false
              window.clearInterval(interval)
            }
          } catch (pollError) {
            polling = false
            window.clearInterval(interval)
            useVideoStore.getState().updateVideo(currentId, {
              status: 'failed',
              progress: 100,
            })
            setError('No se pudo consultar el estado del video. Intenta actualizar la página.')
          }
        }, 1500)
      }

      setTitle('')
      setContent('')
      setSteps([])
      setPreview(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-slate-800 rounded-lg border border-slate-700 p-6 max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold text-white mb-6">Generar Nuevo Video</h2>

      {error && (
        <div className="mb-4 bg-red-500/10 border border-red-500/50 rounded p-3">
          <p className="text-red-400 text-sm">{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Título */}
        <div>
          <label className="block text-sm font-medium text-white mb-2">
            Título del Video
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Ej: Resolver ecuaciones cuadráticas"
            className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 text-white placeholder-slate-400 focus:outline-none focus:border-blue-500 transition"
            disabled={loading}
          />
        </div>

        {/* Contenido */}
        <div>
          <label className="block text-sm font-medium text-white mb-2">
            Contenido Matemático
          </label>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Ej: x² - 5x + 6 = 0&#10;Factorizar: (x-2)(x-3)=0"
            className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 text-white placeholder-slate-400 focus:outline-none focus:border-blue-500 transition min-h-32"
            disabled={loading}
          />
          <InteractiveMathEditor value={content} onChange={setContent} disabled={loading} />
          <button
            type="button"
            onClick={handlePreview}
            disabled={loading || previewLoading}
            className="mt-2 rounded border border-blue-500 px-3 py-2 text-sm font-medium text-blue-300 transition hover:bg-blue-500/10 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {previewLoading ? 'Preparando revisión...' : 'Revisar solución antes de generar'}
          </button>
        </div>

        {preview && (
          <div className="rounded border border-slate-600 bg-slate-700/40 p-4">
            <InteractiveLessonPreview validation={preview.validation} steps={steps} />
            <div className="mt-3 grid grid-cols-3 gap-2 rounded border border-slate-600 bg-slate-900/70 p-3 text-center text-[11px] text-slate-300">
              <div><span className="block text-slate-500">Canvas</span>{preview.formatProfile.width} × {preview.formatProfile.height}</div>
              <div><span className="block text-slate-500">Orientación</span>{preview.formatProfile.orientation}</div>
              <div><span className="block text-slate-500">Safe margin</span>{preview.formatProfile.safeMargin}u</div>
            </div>
            <div className="mb-3 flex items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-semibold text-white">Guion editable</h3>
                <p className="text-xs text-slate-400">
                  {preview.validation.valid
                    ? preview.validation.result || 'Validación completada'
                    : preview.validation.warnings[0] || 'Revisión manual necesaria'}
                </p>
              </div>
              <span className={`text-xs font-semibold ${preview.validation.valid ? 'text-emerald-300' : 'text-amber-300'}`}>
                {preview.validation.valid ? 'Verificado' : 'Revisar'}
              </span>
            </div>
            <div className="space-y-2">
              {steps.map((step, index) => (
                <div key={`${index}-${step.slice(0, 12)}`} className="flex items-start gap-2">
                  <span className="pt-2 text-xs text-slate-400">{index + 1}.</span>
                  <textarea
                    value={step}
                    onChange={(event) => {
                      const next = [...steps]
                      next[index] = event.target.value
                      setSteps(next)
                    }}
                    rows={2}
                    className="min-w-0 flex-1 rounded border border-slate-600 bg-slate-800 px-2 py-2 text-sm text-white outline-none focus:border-blue-400"
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Calidad */}
        <div>
          <label className="block text-sm font-medium text-white mb-2">
            Calidad del Video
          </label>
          <select
            value={quality}
            onChange={(e) => setQuality(e.target.value as any)}
            className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 text-white focus:outline-none focus:border-blue-500 transition"
            disabled={loading}
          >
            <option value="low">Baja (480p)</option>
            <option value="medium">Media (1080p)</option>
            <option value="high">Alta (4K)</option>
          </select>
        </div>

        {/* Formato de salida */}
        <div className="rounded border border-slate-600 bg-slate-700/40 p-4">
          <div className="mb-3">
            <label className="block text-sm font-medium text-white">Formato del video</label>
            <p className="mt-1 text-xs text-slate-400">El contenido se compone dentro de una zona segura; nunca se estira para llenar a la fuerza.</p>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {[
              { value: '16:9', label: '16:9', hint: 'YouTube / Facebook', shape: 'aspect-video' },
              { value: '1:1', label: '1:1', hint: 'Instagram', shape: 'aspect-square' },
              { value: '9:16', label: '9:16', hint: 'Reels / Shorts', shape: 'aspect-[9/16]' },
            ].map((format) => (
              <button
                type="button"
                key={format.value}
                onClick={() => setAspectRatio(format.value as '16:9' | '1:1' | '9:16')}
                className={`rounded border p-2 text-left transition ${aspectRatio === format.value ? 'border-blue-400 bg-blue-500/20 text-white' : 'border-slate-600 bg-slate-800 text-slate-300 hover:border-slate-400'}`}
                disabled={loading}
              >
                <span className={`mx-auto mb-2 block w-10 rounded border border-blue-300/70 bg-slate-950 ${format.shape}`} />
                <span className="block text-xs font-semibold">{format.label}</span>
                <span className="block text-[10px] text-slate-400">{format.hint}</span>
              </button>
            ))}
          </div>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <label className="text-xs text-slate-300">Densidad visual
              <select value={layoutDensity} onChange={(event) => setLayoutDensity(event.target.value as 'comfortable' | 'compact')} className="mt-1 w-full rounded border border-slate-600 bg-slate-800 px-2 py-2 text-sm text-white" disabled={loading}>
                <option value="comfortable">Cómoda: más aire y lectura</option>
                <option value="compact">Compacta: más contenido por escena</option>
              </select>
            </label>
            <label className="text-xs text-slate-300">Tono de narración
              <select value={narrationStyle} onChange={(event) => setNarrationStyle(event.target.value as 'warm_teacher' | 'neutral_teacher')} className="mt-1 w-full rounded border border-slate-600 bg-slate-800 px-2 py-2 text-sm text-white" disabled={loading}>
                <option value="warm_teacher">Docente cercano y motivador</option>
                <option value="neutral_teacher">Docente claro y neutral</option>
              </select>
            </label>
          </div>
        </div>

        {/* Narración */}
        <div className="bg-slate-700/50 border border-slate-600 rounded p-4">
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={enableNarration}
              onChange={(e) => setEnableNarration(e.target.checked)}
              className="w-4 h-4 rounded bg-slate-600 border-slate-500 text-blue-600 focus:ring-blue-500"
              disabled={loading}
            />
            <div className="flex-1">
              <p className="text-sm font-medium text-white">🎙️ Narración en Voz</p>
              <p className="text-xs text-slate-400 mt-1">
                Añade una voz en off didáctica explicando cada paso matemático
              </p>
            </div>
          </label>
        </div>

        {/* Proveedor IA */}
        <div>
          <label className="block text-sm font-medium text-white mb-2">
            🤖 Proveedor de IA (para narración y análisis)
          </label>
          <div className="grid grid-cols-3 gap-2">
            {['openrouter', 'gemini', 'openai'].map((provider) => (
              <button
                type="button"
                key={provider}
                onClick={() => setAiProvider(provider as any)}
                className={`px-3 py-2 rounded text-sm font-medium transition ${
                  aiProvider === provider
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                }`}
                disabled={loading}
              >
                {provider === 'openrouter' && '🚀 OpenRouter (Gratis)'}
                {provider === 'gemini' && '✨ Gemini (Gratis)'}
                {provider === 'openai' && '🔧 OpenAI'}
              </button>
            ))}
          </div>
          <p className="text-xs text-slate-400 mt-2">
            OpenRouter y Gemini tienen opciones gratis. OpenAI requiere crédito pagado.
          </p>
        </div>

        {/* ComfyUI */}
        <div className="bg-slate-700/50 border border-slate-600 rounded p-4">
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={enableComfyUI}
              onChange={(e) => setEnableComfyUI(e.target.checked)}
              className="w-4 h-4 rounded bg-slate-600 border-slate-500 text-blue-600 focus:ring-blue-500"
              disabled={loading}
            />
            <div className="flex-1">
              <p className="text-sm font-medium text-white">🎨 ComfyUI (Fondos)</p>
              <p className="text-xs text-slate-400 mt-1">
                Añade fondos y escenas visuales generadas por IA (opcional)
              </p>
            </div>
          </label>
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-slate-600 text-white font-semibold py-2 rounded transition"
        >
          {loading ? '⏳ Generando video...' : '🎬 Generar Video'}
        </button>
      </form>
    </div>
  )
}
