import { useEffect, useState } from 'react'
import { api } from '../services/api'

export function SystemHealthBadge() {
  const [online, setOnline] = useState<boolean | null>(null)

  useEffect(() => {
    let active = true
    const check = () => { void api.getHealth().then(() => { if (active) setOnline(true) }).catch(() => { if (active) setOnline(false) }) }
    check()
    const timer = window.setInterval(check, 30000)
    return () => { active = false; window.clearInterval(timer) }
  }, [])

  if (online === null) return <span className="text-[11px] text-slate-500">Comprobando API…</span>
  return <span className={`inline-flex items-center gap-1.5 text-[11px] ${online ? 'text-emerald-300' : 'text-amber-300'}`}><span className={`status-dot ${online ? '' : '!bg-amber-300 !shadow-amber-300/10'}`} /> API {online ? 'operativa' : 'sin respuesta'}</span>
}
