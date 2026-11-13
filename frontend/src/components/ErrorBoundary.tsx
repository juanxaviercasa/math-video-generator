import React, { type ErrorInfo, type ReactNode } from 'react'

type Props = { children: ReactNode }
type State = { hasError: boolean; message?: string }

export class ErrorBoundary extends React.Component<Props, State> {
  state: State = { hasError: false }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, message: error.message }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('[Frontend boundary]', error, info.componentStack)
  }

  handleReload = () => window.location.reload()

  render() {
    if (!this.state.hasError) return this.props.children
    return (
      <main className="grid min-h-screen place-items-center bg-slate-950 px-5 py-10 text-center">
        <section role="alert" className="max-w-lg rounded-2xl border border-red-400/30 bg-slate-900 p-8 shadow-2xl">
          <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-red-400/10 text-2xl text-red-300">!</div>
          <h1 className="mt-5 text-2xl font-bold text-white">El estudio necesita reiniciarse</h1>
          <p className="mt-3 text-sm leading-6 text-slate-400">Ocurrió un error inesperado en la interfaz. Tus trabajos guardados en el servidor no se han eliminado.</p>
          <button type="button" onClick={this.handleReload} className="mt-6 rounded-xl bg-cyan-600 px-5 py-3 text-sm font-bold text-white hover:bg-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-300 focus:ring-offset-2 focus:ring-offset-slate-900">Recargar el estudio</button>
          {this.state.message && <details className="mt-5 text-left text-xs text-slate-500"><summary className="cursor-pointer">Detalles técnicos</summary><pre className="mt-2 whitespace-pre-wrap break-words">{this.state.message}</pre></details>}
        </section>
      </main>
    )
  }
}
