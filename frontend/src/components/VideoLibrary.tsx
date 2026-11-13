import { useEffect, useMemo, useState } from 'react'
import { api, LibraryVideo } from '../services/api'
import { User } from '../services/auth'

type VideoLibraryProps = {
  user: User | null
  refreshKey?: number
}

type Filter = 'all' | LibraryVideo['status']

const statusLabel: Record<LibraryVideo['status'], string> = {
  pending: 'En cola',
  processing: 'Procesando',
  completed: 'Completado',
  failed: 'Fallido',
}

const statusTone: Record<LibraryVideo['status'], string> = {
  pending: 'border-amber-400/30 bg-amber-400/10 text-amber-200',
  processing: 'border-blue-400/30 bg-blue-400/10 text-blue-200',
  completed: 'border-emerald-400/30 bg-emerald-400/10 text-emerald-200',
  failed: 'border-red-400/30 bg-red-400/10 text-red-200',
}

export function VideoLibrary({ user, refreshKey = 0 }: VideoLibraryProps) {
  const [videos, setVideos] = useState<LibraryVideo[]>([])
  const [loading, setLoading] = useState(false)
  const [retryingId, setRetryingId] = useState<string | null>(null)
  const [filter, setFilter] = useState<Filter>('all')
  const [query, setQuery] = useState('')
  const [view, setView] = useState<'grid' | 'list'>('grid')
  const [error, setError] = useState('')

  const loadVideos = () => {
    if (!user) return
    setLoading(true)
    setError('')
    void api.listVideos()
      .then(setVideos)
      .catch(() => setError('La biblioteca estará disponible cuando la base de datos esté configurada.'))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    if (!user) {
      setVideos([])
      return
    }
    loadVideos()
  }, [user, refreshKey])

  useEffect(() => {
    const active = videos.filter((video) => video.status === 'pending' || video.status === 'processing')
    if (!active.length) return
    const unsubscribers = active.map((video) => api.subscribeVideoStatus(video.id, (status) => {
      setVideos((current) => current.map((item) => item.id === video.id ? { ...item, ...status, title: status.title || item.title } : item))
    }, () => undefined))
    return () => unsubscribers.forEach((unsubscribe) => unsubscribe())
  }, [videos.map((video) => `${video.id}:${video.status}`).join('|')])

  const filteredVideos = useMemo(() => videos.filter((video) => {
    const matchesFilter = filter === 'all' || video.status === filter
    const haystack = `${video.title} ${video.content} ${video.id}`.toLowerCase()
    return matchesFilter && (!query.trim() || haystack.includes(query.trim().toLowerCase()))
  }), [filter, query, videos])

  const counts = useMemo(() => videos.reduce<Record<string, number>>((acc, video) => {
    acc.all = (acc.all || 0) + 1
    acc[video.status] = (acc[video.status] || 0) + 1
    return acc
  }, { all: 0 }), [videos])

  const handleRetry = async (id: string) => {
    setRetryingId(id)
    setError('')
    try {
      const updated = await api.retryVideo(id)
      setVideos((current) => current.map((video) => video.id === id ? updated : video))
    } catch (retryError) {
      setError(retryError instanceof Error ? retryError.message : 'No se pudo reintentar el video.')
    } finally {
      setRetryingId(null)
    }
  }

  if (!user) {
    return (
      <section className="rounded-2xl border border-slate-700 bg-slate-800/60 p-6">
        <h2 className="text-xl font-semibold text-white">Tu biblioteca</h2>
        <p className="mt-2 text-sm text-slate-400">Crea una cuenta para conservar tus videos y consultar su progreso desde cualquier sesión.</p>
      </section>
    )
  }

  return (
    <section className="rounded-2xl border border-slate-700 bg-slate-800/60 p-5 sm:p-6">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-xl border border-cyan-400/30 bg-cyan-400/10 text-xl">▶</div>
            <div>
              <h2 className="text-xl font-bold text-white">Centro de trabajos</h2>
              <p className="mt-0.5 text-sm text-slate-400">Supervisa, revisa y recupera tus videos.</p>
            </div>
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            {(['all', 'processing', 'completed', 'failed'] as Filter[]).map((item) => (
              <button key={item} type="button" onClick={() => setFilter(item)} className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition ${filter === item ? 'border-cyan-400 bg-cyan-400/15 text-cyan-200' : 'border-slate-700 bg-slate-900/50 text-slate-400 hover:text-white'}`}>
                {item === 'all' ? 'Todos' : statusLabel[item]} <span className="ml-1 font-mono opacity-70">{counts[item] || 0}</span>
              </button>
            ))}
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar video…" className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white placeholder-slate-500 outline-none focus:border-cyan-400 sm:w-48" />
          <button type="button" onClick={loadVideos} disabled={loading} className="rounded-lg border border-slate-600 px-3 py-2 text-xs font-semibold text-slate-300 hover:border-slate-400 hover:text-white disabled:opacity-50">{loading ? 'Actualizando…' : 'Actualizar'}</button>
          <div className="flex rounded-lg border border-slate-700 bg-slate-950 p-0.5">
            <button type="button" aria-label="Vista de tarjetas" onClick={() => setView('grid')} className={`rounded px-2 py-1 text-xs ${view === 'grid' ? 'bg-slate-700 text-white' : 'text-slate-500'}`}>▦</button>
            <button type="button" aria-label="Vista de lista" onClick={() => setView('list')} className={`rounded px-2 py-1 text-xs ${view === 'list' ? 'bg-slate-700 text-white' : 'text-slate-500'}`}>☷</button>
          </div>
        </div>
      </div>

      {error && <p className="mt-4 rounded-lg border border-amber-500/40 bg-amber-500/10 p-3 text-sm text-amber-200">{error}</p>}
      {!loading && filteredVideos.length === 0 && !error && <p className="mt-5 rounded-xl border border-dashed border-slate-600 p-8 text-center text-sm text-slate-400">{videos.length ? 'No hay trabajos que coincidan con tu filtro.' : 'Todavía no tienes videos guardados. Genera el primero desde el estudio.'}</p>}

      <div className={`mt-5 ${view === 'grid' ? 'grid gap-4 md:grid-cols-2' : 'space-y-3'}`}>
        {filteredVideos.map((video) => (
          <article key={video.id} className={`overflow-hidden rounded-xl border border-slate-700 bg-slate-950/65 transition hover:border-slate-500 ${view === 'list' ? 'flex flex-col sm:flex-row' : ''}`}>
            <div className={`relative flex shrink-0 items-center justify-center bg-gradient-to-br from-slate-900 via-blue-950/40 to-slate-950 ${view === 'grid' ? 'aspect-video' : 'h-28 w-full sm:w-44'}`}>
              {video.thumbnailUrl ? <img src={video.thumbnailUrl} alt="" className="h-full w-full object-cover" /> : <div className="text-center"><div className="text-3xl text-cyan-300/70">∑</div><div className="mt-1 text-[10px] uppercase tracking-[0.18em] text-slate-500">Vista previa</div></div>}
              <span className={`absolute left-3 top-3 rounded-full border px-2 py-1 text-[10px] font-bold ${statusTone[video.status]}`}>{statusLabel[video.status]}</span>
            </div>
            <div className="min-w-0 flex-1 p-4">
              <div className="flex items-start justify-between gap-3"><h3 className="truncate text-sm font-bold text-white">{video.title || 'Video sin título'}</h3><span className="shrink-0 font-mono text-[10px] text-slate-500">{video.progress}%</span></div>
              <p className="mt-1 line-clamp-2 text-xs text-slate-400">{video.message || video.content}</p>
              <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-slate-800"><div className={`h-full rounded-full ${video.status === 'failed' ? 'bg-red-400' : 'bg-cyan-400'}`} style={{ width: `${Math.max(0, Math.min(100, video.progress))}%` }} /></div>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                {video.videoUrl?.startsWith('http') && video.status === 'completed' && <><a href={video.videoUrl} target="_blank" rel="noreferrer" className="rounded-lg bg-cyan-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-cyan-500">Abrir video</a><a href={video.videoUrl} download className="rounded-lg border border-slate-600 px-3 py-1.5 text-xs text-slate-300 hover:text-white">Descargar</a></>}
                {video.status === 'failed' && <button type="button" onClick={() => void handleRetry(video.id)} disabled={retryingId === video.id} className="rounded-lg bg-amber-500/15 px-3 py-1.5 text-xs font-bold text-amber-200 hover:bg-amber-500/25 disabled:opacity-50">{retryingId === video.id ? 'Reintentando…' : 'Reintentar'}</button>}
              </div>
              {video.status === 'failed' && <p className="mt-3 rounded-lg border border-red-500/20 bg-red-500/10 p-2 text-xs text-red-200">{video.error || 'La generación no pudo completarse.'}</p>}
            </div>
          </article>
        ))}
      </div>
    </section>
  )
}
