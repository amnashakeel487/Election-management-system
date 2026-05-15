import { useEffect, useState } from 'react'
import { checkSupabaseHealth, isSupabaseConfigured } from '@/lib/supabase'
import { fetchSecuritySummary } from '@/services/adminDashboardService'
import { formatRelativeTime } from '@/utils/formatDate'

export function AdminSecurityPanel() {
  const [apiOk, setApiOk] = useState<boolean | null>(null)
  const [summary, setSummary] = useState<{
    auditEvents24h: number
    lastAuditAt: string | null
    voteCasts24h: number
  } | null>(null)

  useEffect(() => {
    let cancelled = false
    void Promise.all([
      checkSupabaseHealth(),
      fetchSecuritySummary().catch(() => null),
    ]).then(([health, sec]) => {
      if (cancelled) return
      setApiOk(health.ok)
      setSummary(sec)
    })
    return () => {
      cancelled = true
    }
  }, [])

  return (
    <div className="col-span-12 h-full rounded-[24px] border border-white/5 bg-surface-container p-lg lg:col-span-4">
      <h3 className="mb-6 font-headline-md text-headline-md text-on-surface">System Status</h3>
      <div className="space-y-6">
        <div className="flex items-center justify-between rounded-xl border border-white/5 bg-surface-container-low p-4">
          <div className="flex items-center gap-3">
            <span className="material-symbols-outlined text-tertiary">cloud_done</span>
            <div>
              <p className="font-label-md text-label-md text-on-surface">Supabase API</p>
              <p className="text-[10px] text-on-surface-variant">
                {isSupabaseConfigured ? 'Configured in build' : 'Env vars missing'}
              </p>
            </div>
          </div>
          <div
            className={`h-3 w-3 rounded-full ${apiOk ? 'bg-tertiary shadow-[0_0_8px_rgba(76,215,246,0.6)]' : apiOk === false ? 'bg-error' : 'bg-on-surface-variant'}`}
          />
        </div>
        <div className="flex items-center justify-between rounded-xl border border-white/5 bg-surface-container-low p-4">
          <div className="flex items-center gap-3">
            <span className="material-symbols-outlined text-primary">receipt_long</span>
            <div>
              <p className="font-label-md text-label-md text-on-surface">Audit events (24h)</p>
              <p className="text-[10px] text-primary">
                {summary ? `${summary.auditEvents24h} logged` : 'Loading…'}
              </p>
            </div>
          </div>
          <div className="h-3 w-3 rounded-full bg-primary shadow-[0_0_8px_rgba(173,198,255,0.6)]" />
        </div>
        <div className="flex items-center justify-between rounded-xl border border-white/5 bg-surface-container-low p-4">
          <div className="flex items-center gap-3">
            <span className="material-symbols-outlined text-on-surface-variant">how_to_vote</span>
            <div>
              <p className="font-label-md text-label-md text-on-surface">Votes cast (24h)</p>
              <p className="text-[10px] text-on-surface-variant">
                {summary ? `${summary.voteCasts24h} in audit trail` : 'Loading…'}
              </p>
            </div>
          </div>
          <div className={`h-3 w-3 rounded-full ${(summary?.voteCasts24h ?? 0) > 0 ? 'bg-tertiary' : 'bg-primary/40'}`} />
        </div>
      </div>
      <div className="mt-8 flex items-center gap-4 rounded-2xl border border-secondary/10 bg-secondary/5 p-4">
        <div className="rounded-full bg-secondary/20 p-3 text-secondary">
          <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>
            gpp_good
          </span>
        </div>
        <div>
          <p className="font-label-md text-label-md text-secondary">Row-level security</p>
          <p className="text-[11px] text-on-surface-variant">
            {summary?.lastAuditAt
              ? `Last audit event ${formatRelativeTime(summary.lastAuditAt)}`
              : 'No audit events yet'}
          </p>
        </div>
      </div>
    </div>
  )
}
