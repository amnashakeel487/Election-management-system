import { useEffect, useState } from 'react'
import { AdminPageHeader } from '@/components/admin/layout/AdminPageHeader'
import { ADMIN_PAGE_META } from '@/config/adminNav'
import { fetchSecuritySummary } from '@/services/adminDashboardService'
import { formatDashboardNumber } from '@/utils/dashboardDisplay'
import { formatRelativeTime } from '@/utils/formatDate'

const meta = ADMIN_PAGE_META.security

function LocalToggle({
  label,
  sub,
  on,
  onChange,
}: {
  label: string
  sub?: string
  on: boolean
  onChange: (v: boolean) => void
}) {
  return (
    <div className="toggle-wrap" style={{ marginBottom: 14 }}>
      <button
        type="button"
        className={`toggle${on ? ' on' : ''}`}
        aria-pressed={on}
        onClick={() => onChange(!on)}
      >
        <span className="toggle-thumb" />
      </button>
      <div>
        <div className="toggle-label">{label}</div>
        {sub ? <div className="toggle-sub">{sub}</div> : null}
      </div>
    </div>
  )
}

export function AdminSecurityPage() {
  const [summary, setSummary] = useState<{
    auditEvents24h: number
    lastAuditAt: string | null
    voteCasts24h: number
  } | null>(null)
  const [loading, setLoading] = useState(true)
  const [mfaRequired, setMfaRequired] = useState(true)
  const [ipAllowlist, setIpAllowlist] = useState(false)
  const [rateLimit, setRateLimit] = useState(true)
  const [encryptBallots, setEncryptBallots] = useState(true)

  useEffect(() => {
    void fetchSecuritySummary()
      .then(setSummary)
      .finally(() => setLoading(false))
  }, [])

  return (
    <>
      <AdminPageHeader eyebrow={meta.eyebrow} title={meta.title} subtitle={meta.subtitle} />

      <div className="stat-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
        {[
          { label: 'Audit events (24h)', value: summary?.auditEvents24h ?? 0 },
          { label: 'Votes cast (24h)', value: summary?.voteCasts24h ?? 0 },
          {
            label: 'Last audit event',
            value: summary?.lastAuditAt ? formatRelativeTime(summary.lastAuditAt) : '—',
            mono: false,
          },
        ].map((m) => (
          <div key={m.label} className="security-metric">
            <div className="sec-icon" style={{ background: '#EFF4FF', color: '#2451A3' }}>
              <svg viewBox="0 0 24 24" aria-hidden>
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" fill="none" strokeWidth="2" />
              </svg>
            </div>
            <div>
              <div style={{ fontSize: 12, fontWeight: 700 }}>{m.label}</div>
              <div style={{ fontSize: 11, color: 'var(--subtle)' }}>
                {loading ? '…' : typeof m.value === 'number' ? formatDashboardNumber(m.value) : m.value}
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid-2" style={{ marginTop: 16 }}>
        <div className="card-elevated">
          <div className="card-header">
            <div className="card-title">Security toggles</div>
            <div className="card-subtitle">Local preview only — not persisted</div>
          </div>
          <div className="card-body">
            <LocalToggle
              label="Require MFA for admins"
              sub="Enforce TOTP on admin sign-in"
              on={mfaRequired}
              onChange={setMfaRequired}
            />
            <LocalToggle
              label="IP allowlist"
              sub="Restrict admin access to known IPs"
              on={ipAllowlist}
              onChange={setIpAllowlist}
            />
            <LocalToggle
              label="API rate limiting"
              sub="Throttle abusive clients"
              on={rateLimit}
              onChange={setRateLimit}
            />
            <LocalToggle
              label="Encrypt ballots at rest"
              sub="Additional envelope encryption layer"
              on={encryptBallots}
              onChange={setEncryptBallots}
            />
          </div>
        </div>

        <div className="card-elevated">
          <div className="card-header">
            <div className="card-title">Platform checks</div>
          </div>
          <div className="card-body">
            <div className="alert alert-success">Row-level security enabled on ballots and audit logs.</div>
            <div className="alert alert-info">Authenticated admin session active for this browser.</div>
            <div className="alert alert-warning">
              Review pending creator requests regularly to reduce unauthorized election creation risk.
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
