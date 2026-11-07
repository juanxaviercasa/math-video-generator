import { useEffect, useState } from 'react'
import { api, type AiInfrastructureStatus } from '../services/api'

export function AiModelsPanel() {
  const [status, setStatus] = useState<AiInfrastructureStatus | null>(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const refresh = async () => {
    setLoading(true)
    setError('')
    try { setStatus(await api.getAiInfrastructure()) }
    catch { setError('No se pudo consultar el estado de los modelos.') }
    finally { setLoading(false) }
  }

  useEffect(() => { void refresh() }, [])

  return (
    <section className="mt-6 rounded-lg border border-slate-700 bg-slate-800 p-5">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-lg font-semibold text-white">Mis modelos de IA — Kaggle / ViralForge</h2>
        <button type="button" onClick={() => void refresh()} disabled={loading}
          className="rounded border border-slate-600 px-3 py-1.5 text-xs text-slate-200 hover:border-blue-400 disabled:opacity-50">
          {loading ? 'Consultando…' : 'Actualizar'}
        </button>
      </div>
      {error && <p className="mt-3 text-sm text-red-300">{error}</p>}
      {status && (
        <>
          <p className="mt-2 text-xs text-slate-300">{status.message}</p>
          <p className="mt-2 text-xs text-slate-400">
            {status.reachable ? 'Catálogo accesible' : 'Puente sin conexión'} ·{' '}
            {status.inferenceReady ? 'Inferencia disponible' : 'Inferencia GPU sin verificar'} ·{' '}
            {status.models.length} modelos relevantes catalogados
          </p>
          {status.models.length > 0 && (
            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              {status.models.map((item) => (
                <div className="rounded border border-slate-700 bg-slate-900/60 p-3" key={item.slug}>
                  <div className="text-sm font-medium text-slate-200">{item.title}</div>
                  <div className="mt-1 text-xs text-slate-400">{item.role}{item.sizeGb ? ` · ${item.sizeGb} GB` : ''}</div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </section>
  )
}
