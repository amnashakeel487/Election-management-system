import { useEffect, useState } from 'react'
import {
  checkSupabaseHealth,
  clearSupabaseAuthStorage,
  getSupabaseHostLabel,
  isSupabaseConfigured,
} from '@/lib/supabase'

export function SupabaseConnectionHelp() {
  const [health, setHealth] = useState<string>('Checking…')
  const [healthOk, setHealthOk] = useState<boolean | null>(null)

  useEffect(() => {
    let cancelled = false
    void checkSupabaseHealth().then((result) => {
      if (cancelled) return
      setHealthOk(result.ok)
      setHealth(result.message)
    })
    return () => {
      cancelled = true
    }
  }, [])

  function handleClearCache() {
    clearSupabaseAuthStorage()
    window.location.reload()
  }

  return (
    <div className="mb-md rounded-xl border border-outline-variant/40 bg-surface-container-highest/40 p-md text-left">
      <p className="mb-2 font-label-md text-label-md text-on-surface">Connection diagnostics</p>
      <ul className="space-y-1 font-body-sm text-body-sm text-on-surface-variant">
        <li>
          Build has Supabase URL:{' '}
          <strong className={isSupabaseConfigured ? 'text-tertiary' : 'text-error'}>
            {isSupabaseConfigured ? 'Yes' : 'No — redeploy Vercel after setting env vars'}
          </strong>
        </li>
        <li>
          API host: <code className="text-on-surface">{getSupabaseHostLabel()}</code>
        </li>
        <li>
          Live check:{' '}
          <strong className={healthOk === true ? 'text-tertiary' : healthOk === false ? 'text-error' : ''}>
            {health}
          </strong>
        </li>
      </ul>
      <p className="mt-3 font-body-sm text-body-sm text-on-surface-variant">
        A green live check means the browser can reach your Supabase project. You can still sign in if this
        panel shows an old error — try your email and password below.
      </p>
      <button
        type="button"
        onClick={handleClearCache}
        className="mt-3 rounded-lg border border-primary/30 px-3 py-1.5 font-label-sm text-label-sm text-primary hover:bg-primary/10"
      >
        Clear cached login &amp; reload
      </button>
    </div>
  )
}
