import { lazy, Suspense, useEffect, useRef, useState } from 'react'
import { api, PreviewResponse, type ExtractedExercise, type VoiceChoice } from '../services/api'
import { useVideoStore } from '../store/video.store'
const InteractiveMathEditor = lazy(() => import('./InteractiveMathEditor').then((module) => ({ default: module.InteractiveMathEditor })))
import { InteractiveLessonPreview } from './InteractiveLessonPreview'
import { AUDIENCE_MODES, EDUCATION_PRESETS, type AudienceMode, type EducationPreset } from '../config/educationPresets'

type VideoGeneratorProps = {
  onGenerated?: () => void
  externalProblem?: {
    title: string
    content: string
    key: number
  } | null
}

const DRAFT_KEY = 'math-video-generator:draft:v1'
const WIZARD_STEPS = [
  { id: 1, label: 'Ejercicio', hint: 'Idea o archivo', target: 'video-step-exercise' },
  { id: 2, label: 'Revisión', hint: 'Pasos y formato', target: 'video-step-review' },
  { id: 3, label: 'Narración', hint: 'Voz y estilo', target: 'video-step-voice' },
  { id: 4, label: 'Generar', hint: 'Confirmar y lanzar', target: 'video-step-generate' },
]

export function VideoGenerator({ onGenerated, externalProblem }: VideoGeneratorProps) {
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [quality, setQuality] = useState<'low' | 'medium' | 'high'>('medium')
  const [aspectRatio, setAspectRatio] = useState<'16:9' | '1:1' | '9:16'>('16:9')
  const [layoutDensity, setLayoutDensity] = useState<'comfortable' | 'compact'>('comfortable')
  const [narrationStyle, setNarrationStyle] = useState<'warm_teacher' | 'neutral_teacher'>('warm_teacher')
  const [enableNarration, setEnableNarration] = useState(true)
  const [narratorVoiceId, setNarratorVoiceId] = useState('es-PE-CamilaNeural')
  const [voices, setVoices] = useState<VoiceChoice[]>([])
  const [voicePreviewUrl, setVoicePreviewUrl] = useState('')
  const [previewingVoice, setPreviewingVoice] = useState(false)
  const [aiProvider, setAiProvider] = useState<'openrouter' | 'gemini' | 'openai'>('gemini')
  const [enableComfyUI, setEnableComfyUI] = useState(false)
  const [loading, setLoading] = useState(false)
  const [previewLoading, setPreviewLoading] = useState(false)
  const [preview, setPreview] = useState<PreviewResponse | null>(null)
  const [steps, setSteps] = useState<string[]>([])
  const [error, setError] = useState('')
  const [sourceFile, setSourceFile] = useState<File | null>(null)
  const [pdfPage, setPdfPage] = useState(1)
  const [extracted, setExtracted] = useState<ExtractedExercise | null>(null)
  const [sourceConfirmed, setSourceConfirmed] = useState(false)
  const [extracting, setExtracting] = useState(false)
  const [wizardStep, setWizardStep] = useState(1)
  const [draftSavedAt, setDraftSavedAt] = useState<string | null>(null)
  const [audienceMode, setAudienceMode] = useState<AudienceMode>('student')
  const [selectedPreset, setSelectedPreset] = useState<string | null>('quadratic')
  const [recommendation, setRecommendation] = useState<{ category: string; engine: string; rationale: string } | null>(null)
  const [recommending, setRecommending] = useState(false)

  const addVideo = useVideoStore((state) => state.addVideo)
  const pollingTimers = useRef(new Map<string, number>())

  useEffect(() => () => {
    pollingTimers.current.forEach((timer) => window.clearTimeout(timer))
    pollingTimers.current.clear()
  }, [])

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(DRAFT_KEY)
      if (!saved) return
      const draft = JSON.parse(saved) as Partial<{
        title: string; content: string; quality: 'low' | 'medium' | 'high'; aspectRatio: '16:9' | '1:1' | '9:16'
        layoutDensity: 'comfortable' | 'compact'; narrationStyle: 'warm_teacher' | 'neutral_teacher'; enableNarration: boolean
        narratorVoiceId: string; aiProvider: 'openrouter' | 'gemini' | 'openai'; enableComfyUI: boolean
      }>
      if (draft.title) setTitle(draft.title)
      if (draft.content) setContent(draft.content)
      if (draft.quality) setQuality(draft.quality)
      if (draft.aspectRatio) setAspectRatio(draft.aspectRatio)
      if (draft.layoutDensity) setLayoutDensity(draft.layoutDensity)
      if (draft.narrationStyle) setNarrationStyle(draft.narrationStyle)
      if (typeof draft.enableNarration === 'boolean') setEnableNarration(draft.enableNarration)
      if (draft.narratorVoiceId) setNarratorVoiceId(draft.narratorVoiceId)
      if (draft.aiProvider) setAiProvider(draft.aiProvider)
      if (typeof draft.enableComfyUI === 'boolean') setEnableComfyUI(draft.enableComfyUI)
      setDraftSavedAt('restaurado')
    } catch {
      window.localStorage.removeItem(DRAFT_KEY)
    }
  }, [])

  useEffect(() => {
    if (!title && !content) return
    const timeout = window.setTimeout(() => {
      window.localStorage.setItem(DRAFT_KEY, JSON.stringify({ title, content, quality, aspectRatio, layoutDensity, narrationStyle, enableNarration, narratorVoiceId, aiProvider, enableComfyUI }))
      setDraftSavedAt(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }))
    }, 500)
    return () => window.clearTimeout(timeout)
  }, [title, content, quality, aspectRatio, layoutDensity, narrationStyle, enableNarration, narratorVoiceId, aiProvider, enableComfyUI])

  useEffect(() => {
    if (!externalProblem) return
    setTitle(externalProblem.title)
    setContent(externalProblem.content)
    setPreview(null)
    setSteps([])
    setError('')
  }, [externalProblem])

  useEffect(() => {
    let active = true
    void api.getVoices().then((results) => {
      if (active) setVoices(results)
    }).catch(() => {
      if (active) setError('No se pudo cargar la biblioteca de voces neurales.')
    })
    return () => { active = false }
  }, [])

  useEffect(() => () => {
    if (voicePreviewUrl) URL.revokeObjectURL(voicePreviewUrl)
  }, [voicePreviewUrl])

  const handleVoicePreview = async () => {
    setPreviewingVoice(true)
    try {
      const audio = await api.previewVoice(narratorVoiceId, narrationStyle)
      setVoicePreviewUrl(URL.createObjectURL(audio))
    } catch (error) {
      setError(error instanceof Error ? error.message : 'No se pudo generar la prueba de voz.')
    } finally {
      setPreviewingVoice(false)
    }
  }

  const applyPreset = (preset: EducationPreset) => {
    setSelectedPreset(preset.id)
    setAudienceMode(preset.audience)
    setTitle((current) => current || preset.titleTemplate)
    setContent((current) => current || preset.example)
    setQuality(preset.quality)
    setAspectRatio(preset.aspectRatio)
    setLayoutDensity(preset.layoutDensity)
    setNarrationStyle(preset.narrationStyle)
    setEnableNarration(preset.enableNarration)
    setWizardStep(1)
  }

  const handleRecommendEngine = async () => {
    if (!content.trim()) return
    setRecommending(true)
    try {
      const result = await api.recommendEngine(content, [content])
      setRecommendation({ category: result.detectedCategoryTitle, engine: result.primaryEngine.name, rationale: result.rationale })
    } catch {
      setRecommendation(null)
    } finally {
      setRecommending(false)
    }
  }

  const handleExtract = async () => {
    setError('')
    if (!sourceFile) {
      setError('Selecciona una imagen o una página PDF.')
      return
    }
    if (sourceFile.size > 10 * 1024 * 1024) {
      setError('El archivo supera 10 MB.')
      return
    }
    setExtracting(true)
    try {
      const result = await api.extractExercise(sourceFile, pdfPage, aiProvider)
      setExtracted(result)
      setSourceConfirmed(false)
      setContent(result.problem)
      setPreview(null)
      setSteps([])
      if (!title.trim()) setTitle('Explicación de ejercicio matemático')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo reconocer la imagen.')
    } finally {
      setExtracting(false)
    }
  }

  const updateContent = (value: string) => {
    setContent(value)
    setPreview(null)
    setSteps([])
    if (extracted) setSourceConfirmed(false)
  }

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

    if (extracted && !sourceConfirmed) {
      setError('Confirma que el ejercicio reconocido coincide con el original antes de generar.')
      return
    }
    setLoading(true)
    const requestToken = typeof crypto.randomUUID === 'function' ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
    const videoId = `video_${requestToken.replace(/-/g, '')}`
    const idempotencyKey = `web-${requestToken}`

    try {

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
        idempotencyKey,
        title,
        content,
        quality,
        aspectRatio,
        layoutDensity,
        narrationStyle,
        enableNarration,
        narratorVoiceId,
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
        error: response.error,
        errorCode: response.errorCode,
        attempts: response.attempts,
        heartbeatAt: response.heartbeatAt,
      })

      if (finalStatus === 'failed') {
        setError(response.error || response.message || 'La generación falló')
      }

      if (finalStatus === 'processing' || finalStatus === 'pending') {
        const poll = async (attempt = 0): Promise<void> => {
          try {
            const status = await api.getVideoStatus(currentId)
            useVideoStore.getState().updateVideo(currentId, {
              status: status.status,
              progress: status.progress,
              videoUrl: status.videoUrl,
              thumbnailUrl: status.thumbnailUrl,
              message: status.message,
              error: status.error,
              errorCode: status.errorCode,
              attempts: status.attempts,
              heartbeatAt: status.heartbeatAt,
            })

            if (status.status === 'completed' || status.status === 'failed') {
              pollingTimers.current.delete(currentId)
              if (status.status === 'failed') setError(status.error || status.message || 'La generación falló')
              return
            }

            const delay = Math.min(10000, 1500 * Math.pow(1.35, Math.min(attempt, 8)))
            const timer = window.setTimeout(() => void poll(attempt + 1), delay)
            pollingTimers.current.set(currentId, timer)
          } catch (pollError) {
            if (attempt >= 5) {
              pollingTimers.current.delete(currentId)
              useVideoStore.getState().updateVideo(currentId, { status: 'failed', progress: 100 })
              setError('No se pudo consultar el estado del video. Puedes actualizar la biblioteca para reanudar la consulta.')
              return
            }
            const retryDelay = Math.min(15000, 3000 * (attempt + 1))
            const timer = window.setTimeout(() => void poll(attempt + 1), retryDelay)
            pollingTimers.current.set(currentId, timer)
          }
        }
        void poll()
      }

      setTitle('')
      setContent('')
      setSteps([])
      setPreview(null)
      setExtracted(null)
      setSourceConfirmed(false)
      setSourceFile(null)
      window.localStorage.removeItem(DRAFT_KEY)
      setDraftSavedAt(null)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error desconocido'
      useVideoStore.getState().updateVideo(videoId, { status: 'failed', progress: 100, error: message, errorCode: 'CLIENT_GENERATION_FAILED', message })
      setError(message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-slate-800 rounded-lg border border-slate-700 p-6 max-w-2xl mx-auto">
      <div className="mb-6 flex items-start justify-between gap-4">
        <div><h2 className="text-2xl font-bold text-white">Crear video educativo</h2><p className="mt-1 text-xs text-slate-400">Sigue las etapas y conserva tu trabajo automáticamente.</p></div>
        {draftSavedAt && <span className="shrink-0 rounded-full border border-emerald-400/25 bg-emerald-400/10 px-2.5 py-1 text-[10px] text-emerald-200">✓ Borrador {draftSavedAt === 'restaurado' ? 'restaurado' : `guardado ${draftSavedAt}`}</span>}
      </div>
      <div className="mb-6 grid grid-cols-4 gap-1 rounded-xl border border-slate-700 bg-slate-900/70 p-1">
        {WIZARD_STEPS.map((step) => <button key={step.id} type="button" onClick={() => { setWizardStep(step.id); document.getElementById(step.target)?.scrollIntoView({ behavior: 'smooth', block: 'start' }) }} className={`rounded-lg px-1 py-2 text-center transition ${wizardStep === step.id ? 'bg-blue-600 text-white' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}><span className="block text-[10px] font-bold sm:text-xs">0{step.id} · {step.label}</span><span className="mt-0.5 hidden text-[9px] opacity-70 sm:block">{step.hint}</span></button>)}
      </div>

      <div className="mb-6 rounded-xl border border-cyan-500/25 bg-cyan-500/5 p-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div><p className="text-xs font-bold uppercase tracking-[0.16em] text-cyan-300">Comienza con una plantilla</p><p className="mt-1 text-xs text-slate-400">Los presets preparan formato, ritmo y narración. Puedes cambiar todo después.</p></div>
          <div className="flex rounded-lg border border-slate-700 bg-slate-950/60 p-1">
            {AUDIENCE_MODES.map((mode) => <button key={mode.id} type="button" onClick={() => setAudienceMode(mode.id)} className={`rounded-md px-2.5 py-1.5 text-[11px] font-semibold ${audienceMode === mode.id ? 'bg-cyan-600 text-white' : 'text-slate-400 hover:text-white'}`}>{mode.icon} {mode.label}</button>)}
          </div>
        </div>
        <div className="mt-3 grid gap-2 sm:grid-cols-2 xl:grid-cols-5">
          {EDUCATION_PRESETS.filter((preset) => preset.audience === audienceMode || audienceMode === 'student').map((preset) => <button key={preset.id} type="button" onClick={() => applyPreset(preset)} className={`rounded-lg border p-3 text-left transition ${selectedPreset === preset.id ? 'border-cyan-400 bg-cyan-400/10' : 'border-slate-700 bg-slate-950/50 hover:border-slate-500'}`}><span className="text-lg font-bold text-cyan-200">{preset.icon}</span><span className="mt-1 block text-xs font-bold text-white">{preset.title}</span><span className="mt-1 block text-[10px] leading-snug text-slate-400">{preset.description}</span></button>)}
        </div>
      </div>

      {error && (
        <div className="mb-4 bg-red-500/10 border border-red-500/50 rounded p-3">
          <p className="text-red-400 text-sm">{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Título */}
        <div id="video-step-exercise">
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

        {/* Archivo origen: el reconocimiento nunca publica automáticamente. */}
        <div id="video-step-review" className="rounded border border-slate-600 bg-slate-900/50 p-4 space-y-3">
          <label htmlFor="exercise-source" className="block text-sm font-medium text-white">Ejercicio en foto, captura, manuscrito o PDF</label>
          <input
            id="exercise-source"
            type="file"
            accept="image/png,image/jpeg,image/webp,application/pdf"
            onChange={(event) => {
              setSourceFile(event.target.files?.[0] || null)
              setExtracted(null)
              setSourceConfirmed(false)
            }}
            disabled={loading || extracting}
            className="block w-full text-xs text-slate-200 file:mr-3 file:rounded file:border-0 file:bg-blue-700 file:px-3 file:py-2 file:text-white"
          />
          {sourceFile?.type === 'application/pdf' && (
            <label className="block text-xs text-slate-300">
              Página del PDF (1-50)
              <input type="number" min={1} max={50} value={pdfPage} onChange={(e) => setPdfPage(Number(e.target.value))}
                className="ml-2 w-20 rounded border border-slate-600 bg-slate-800 px-2 py-1 text-white" disabled={extracting || loading} />
            </label>
          )}
          <button type="button" onClick={() => void handleExtract()} disabled={!sourceFile || extracting || loading}
            className="rounded border border-blue-500 px-3 py-2 text-sm text-blue-300 disabled:opacity-50">
            {extracting ? 'Reconociendo ejercicio...' : 'Extraer ejercicio para revisión'}
          </button>
          {extracted && (
            <div className="space-y-2 rounded border border-amber-500/40 p-3 text-xs text-slate-200">
              <p>Confianza de lectura: <strong>{extracted.confidence}</strong>. El ejercicio está en el editor y puedes corregirlo.</p>
              {extracted.observedSolutionSteps.length > 0 && (
                <div>
                  <p className="font-semibold">Pasos observados en el original (no verificados):</p>
                  <ol className="list-decimal pl-5">{extracted.observedSolutionSteps.map((step, i) => <li key={i}>{step}</li>)}</ol>
                </div>
              )}
              {extracted.warnings.map((warning, i) => <p className="text-amber-300" key={i}>{warning}</p>)}
              <label className="flex gap-2 items-start">
                <input type="checkbox" checked={sourceConfirmed} onChange={(event) => setSourceConfirmed(event.target.checked)} />
                He comprobado que el enunciado del editor coincide con el ejercicio original.
              </label>
            </div>
          )}
        </div>

        {/* Contenido */}
        <div>
          <label className="block text-sm font-medium text-white mb-2">
            Contenido Matemático
          </label>
          <textarea
            value={content}
            onChange={(e) => updateContent(e.target.value)}
            placeholder="Ej: x² - 5x + 6 = 0&#10;Factorizar: (x-2)(x-3)=0"
            className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 text-white placeholder-slate-400 focus:outline-none focus:border-blue-500 transition min-h-32"
            disabled={loading}
          />
          <Suspense fallback={<p className="mt-2 text-xs text-slate-400">Cargando editor matemático...</p>}>
            <InteractiveMathEditor value={content} onChange={updateContent} disabled={loading} />
          </Suspense>
          <button
            type="button"
            onClick={handlePreview}
            disabled={loading || previewLoading}
            className="mt-2 rounded border border-blue-500 px-3 py-2 text-sm font-medium text-blue-300 transition hover:bg-blue-500/10 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {previewLoading ? 'Preparando revisión...' : 'Revisar solución antes de generar'}
          </button>
          <div className="mt-3 flex flex-wrap items-center justify-between gap-2 rounded-lg border border-slate-600 bg-slate-900/50 px-3 py-2">
            <div><span className="text-[11px] font-semibold text-slate-300">Motor recomendado</span>{recommendation ? <p className="text-xs text-cyan-200">{recommendation.engine} · {recommendation.category}</p> : <p className="text-[11px] text-slate-500">Analiza tu ejercicio para sugerir una herramienta.</p>}</div>
            <button type="button" onClick={() => void handleRecommendEngine()} disabled={!content.trim() || recommending || loading} className="rounded-lg border border-cyan-500/50 px-3 py-1.5 text-xs font-semibold text-cyan-200 hover:bg-cyan-500/10 disabled:opacity-40">{recommending ? 'Analizando…' : 'Recomendar motor'}</button>
          </div>
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
        <div id="video-step-voice" className="bg-slate-700/50 border border-slate-600 rounded p-4">
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
                Añade una voz neural real que acompaña y resalta cada paso matemático. Comprueba la muestra antes de generar.
              </p>
            </div>
          </label>
          {enableNarration && (
            <div className="mt-3 space-y-3">
              <label htmlFor="narrator-voice" className="block text-sm text-slate-200">
                Biblioteca de voces neurales en español
              </label>
              <select id="narrator-voice" value={narratorVoiceId}
                onChange={(event) => { setNarratorVoiceId(event.target.value); setVoicePreviewUrl('') }}
                disabled={loading || previewingVoice}
                className="w-full rounded border border-slate-500 bg-slate-800 px-3 py-2 text-sm text-white">
                {(voices.length ? voices : [{ id: 'es-PE-CamilaNeural', label: 'Camila — Perú', locale: 'es-PE', language: 'es' as const, gender: 'female' as const, provider: 'edge' as const }]).map((voice) =>
                  <option key={voice.id} value={voice.id}>{voice.label}</option>
                )}
              </select>
              <button type="button" onClick={() => void handleVoicePreview()} disabled={loading || previewingVoice}
                className="rounded border border-blue-500 px-3 py-2 text-sm text-blue-300 disabled:opacity-50">
                {previewingVoice ? 'Generando voz real...' : 'Escuchar muestra de la voz'}
              </button>
              {voicePreviewUrl && (
                <div className="space-y-1">
                  <audio key={voicePreviewUrl} controls preload="auto" className="w-full" src={voicePreviewUrl} />
                  <p className="text-xs text-slate-400">Pulsa reproducir y comprueba el volumen antes de generar tu video.</p>
                </div>
              )}
              <p className="text-xs text-slate-400">Voz sintetizada por IA. La vista previa necesita que Edge TTS esté disponible en el servidor.</p>
            </div>
          )}
        </div>

        {/* Proveedor IA */}
        <div>
          <label className="block text-sm font-medium text-white mb-2">
            🤖 Modelo de IA (para reconocer y analizar ejercicios)
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
                {provider === 'openai' && '🔧 OpenAI / ChatGPT API'}
              </button>
            ))}
          </div>
          <p className="text-xs text-slate-400 mt-2">
            El reconocimiento visual usa el proveedor seleccionado y una clave API del servidor. Una suscripción a ChatGPT no sustituye una clave de API de OpenAI.
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
          id="video-step-generate"
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
