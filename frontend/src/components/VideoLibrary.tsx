import { useEffect, useState } from 'react'
import { api, LibraryVideo } from '../services/api'
import { User } from '../services/auth'

type VideoLibraryProps = {
  user: User | null
  refreshKey?: number
}

const statusLabel: Record<LibraryVideo['status'], string> = {
  pending: 'En cola',
  processing: 'Procesando',
  completed: 'Completado',
  failed: 'Fallido',
}

export function VideoLibrary({ user, refreshKey = 0 }: VideoLibraryProps) {
  const [videos, setVideos] = useState<LibraryVideo[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!user) {
      setVideos([])
      return
    }

    setLoading(true)
    setError('')
    api
      .listVideos()
      .then(setVideos)
      .catch(() => setError('La biblioteca estará disponible cuando la base de datos esté configurada.'))
      .finally(() => setLoading(false))
  }, [user, refreshKey])

  if (!user) {
    return (
      <section className="rounded-lg border border-slate-700 bg-slate-800/60 p-6">
        <h2 className="text-xl font-semibold text-white">Tu biblioteca</h2>
        <p className="mt-2 text-sm text-slate-400">
          Crea una cuenta para conservar tus videos y consultar su progreso desde cualquier sesión.
        </p>
      </section>
    )
  }

  return (
    <section className="rounded-lg border border-slate-700 bg-slate-800/60 p-6">
      <div className="mb-5 flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-white">Tu biblioteca</h2>
          <p className="mt-1 text-sm text-slate-400">Videos asociados a tu cuenta.</p>
        </div>
        {loading && <span className="text-xs text-slate-400">Actualizando...</span>}
      </div>

      {error && <p className="mb-4 rounded border border-amber-500/40 bg-amber-500/10 p-3 text-sm text-amber-200">{error}</p>}

      {!loading && videos.length === 0 && !error && (
        <p className="rounded border border-dashed border-slate-600 p-5 text-center text-sm text-slate-400">
          Todavía no tienes videos guardados. Genera el primero desde el formulario.
        </p>
      )}

      <div className="grid gap-3">
        {videos.map((video) => (
          <article key={video.id} className="rounded border border-slate-700 bg-slate-900/60 p-4">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <h3 className="truncate text-sm font-semibold text-white">{video.id}</h3>
                <p className="mt-1 text-xs text-slate-400">{video.message}</p>
              </div>
              <span
                className={`shrink-0 rounded px-2 py-1 text-xs font-semibold ${
                  video.status === 'completed'
                    ? 'bg-emerald-500/15 text-emerald-300'
                    : video.status === 'failed'
                      ? 'bg-red-500/15 text-red-300'
                      : 'bg-blue-500/15 text-blue-300'
                }`}
              >
                {statusLabel[video.status]}
              </span>
            </div>
            <div className="mt-3 h-2 overflow-hidden rounded bg-slate-700">
              <div className="h-full rounded bg-blue-500 transition-all" style={{ width: `${video.progress}%` }} />
            </div>
            <div className="mt-2 flex items-center justify-between gap-3 text-xs text-slate-500">
              <span>{video.progress}%</span>
              {typeof video.attempts === 'number' && video.attempts > 0 && <span>Intentos: {video.attempts}</span>}
            </div>
            {video.status === 'failed' && (
              <div className="mt-3 rounded border border-red-500/30 bg-red-500/10 p-3 text-xs text-red-200">
                <p>{video.error || 'La generación no pudo completarse.'}</p>
                {video.errorCode && <p className="mt-1 font-mono text-red-300/80">Código: {video.errorCode}</p>}
              </div>
            )}
            {video.videoUrl?.startsWith('http') && video.status === 'completed' && (
              <video className="mt-3 w-full rounded" controls src={video.videoUrl} />
            )}
          </article>
        ))}
      </div>
    </section>
  )
}
