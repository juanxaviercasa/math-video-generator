import { useEffect, useRef } from 'react'

type MathFieldElement = HTMLElement & {
  value: string
}

declare global {
  namespace JSX {
    interface IntrinsicElements {
      'math-field': React.DetailedHTMLProps<React.HTMLAttributes<MathFieldElement>, MathFieldElement> & {
        value?: string
      }
    }
  }
}

type InteractiveMathEditorProps = {
  value: string
  onChange: (value: string) => void
  disabled?: boolean
}

export function InteractiveMathEditor({ value, onChange, disabled = false }: InteractiveMathEditorProps) {
  const fieldRef = useRef<MathFieldElement | null>(null)

  useEffect(() => {
    void import('mathlive')
  }, [])

  useEffect(() => {
    const field = fieldRef.current
    if (!field) return

    const handleInput = () => onChange(field.value)
    field.addEventListener('input', handleInput)
    return () => field.removeEventListener('input', handleInput)
  }, [onChange])

  useEffect(() => {
    const field = fieldRef.current
    if (field && field.value !== value) field.value = value
  }, [value])

  return (
    <div className="rounded border border-blue-500/40 bg-slate-950/70 p-3">
      <div className="mb-2 flex items-center justify-between gap-2">
        <span className="text-xs font-semibold uppercase tracking-wide text-blue-200">Editor matemático interactivo</span>
        <span className="text-[10px] text-slate-400">LaTeX · teclado visual · navegador</span>
      </div>
      <math-field
        ref={fieldRef}
        value={value}
        aria-label="Editor de expresión matemática"
        className="block min-h-14 w-full rounded bg-white px-3 py-3 text-xl text-slate-900"
        style={{ opacity: disabled ? 0.6 : 1, pointerEvents: disabled ? 'none' : 'auto' }}
      />
      <p className="mt-2 text-[11px] text-slate-400">Escribe o corrige la expresión; el video usará esta notación como punto de partida.</p>
    </div>
  )
}
