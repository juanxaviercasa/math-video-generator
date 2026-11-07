import { useEffect, useMemo, useState } from 'react'
import type { MathValidation } from '../services/api'

type InteractiveLessonPreviewProps = {
  validation: MathValidation
  steps: string[]
}

const stageLabels = ['Entender', 'Sustituir', 'Calcular', 'Comprobar']

export function InteractiveLessonPreview({ validation, steps }: InteractiveLessonPreviewProps) {
  const [activeStep, setActiveStep] = useState(0)
  const safeSteps = useMemo(() => steps.filter(Boolean), [steps])
  const maximum = Math.max(0, safeSteps.length - 1)

  useEffect(() => {
    setActiveStep(0)
  }, [validation.normalizedInput, safeSteps.length])

  const graphEnabled = validation.valid && validation.kind === 'quadratic'
  const progress = maximum === 0 ? 100 : (activeStep / maximum) * 100

  return (
    <div className="mt-4 rounded border border-cyan-500/30 bg-slate-950/80 p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h4 className="text-sm font-semibold text-cyan-200">Vista previa guiada</h4>
          <p className="mt-1 text-xs text-slate-400">Una explicación humana: primero entendemos, luego reemplazamos, calculamos y comprobamos.</p>
        </div>
        <span className="rounded-full border border-cyan-400/30 px-2 py-1 text-[10px] text-cyan-200">Paso {Math.min(activeStep + 1, safeSteps.length)} de {safeSteps.length || 1}</span>
      </div>

      <div className="mt-4 grid grid-cols-4 gap-1">
        {stageLabels.map((label, index) => (
          <div key={label} className={`rounded px-2 py-2 text-center text-[10px] ${index <= Math.min(activeStep, 3) ? 'bg-cyan-500/20 text-cyan-100' : 'bg-slate-800 text-slate-500'}`}>
            {label}
          </div>
        ))}
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="rounded border border-slate-700 bg-slate-900 p-3">
          <div className="mb-2 h-1 overflow-hidden rounded bg-slate-700"><div className="h-full rounded bg-cyan-400 transition-all" style={{ width: `${progress}%` }} /></div>
          <p className="min-h-20 text-sm leading-6 text-slate-100">{safeSteps[activeStep] || 'Previsualiza una solución para recorrer sus pasos.'}</p>
          <div className="mt-3 flex gap-2">
            <button type="button" onClick={() => setActiveStep((step) => Math.max(0, step - 1))} disabled={activeStep === 0} className="rounded border border-slate-600 px-3 py-2 text-xs text-slate-300 disabled:opacity-40">Anterior</button>
            <button type="button" onClick={() => setActiveStep((step) => Math.min(maximum, step + 1))} disabled={activeStep >= maximum} className="rounded bg-cyan-600 px-3 py-2 text-xs font-semibold text-white disabled:opacity-40">Siguiente</button>
          </div>
        </div>

        <div className="rounded border border-slate-700 bg-slate-900 p-2">
          {graphEnabled ? (
            <svg viewBox="0 0 320 180" role="img" aria-label="Vista previa de la parábola y sus raíces" className="h-full min-h-36 w-full">
              <path d="M20 145 H300 M65 20 V165" stroke="#64748b" strokeWidth="1" />
              <path d="M45 35 C95 110 130 145 160 145 C190 145 225 110 275 35" fill="none" stroke="#facc15" strokeWidth="3" />
              <circle cx="123" cy="145" r="5" fill="#34d399" /><circle cx="197" cy="145" r="5" fill="#34d399" />
              <text x="112" y="166" fill="#cbd5e1" fontSize="12">x = 2</text><text x="188" y="166" fill="#cbd5e1" fontSize="12">x = 3</text>
            </svg>
          ) : (
            <div className="flex min-h-36 items-center justify-center text-center text-xs text-slate-500">La comprobación gráfica aparecerá cuando el problema sea una cuadrática válida.</div>
          )}
        </div>
      </div>
    </div>
  )
}
