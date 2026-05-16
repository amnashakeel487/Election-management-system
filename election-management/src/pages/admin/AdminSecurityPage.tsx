import { useCallback, useEffect, useState } from 'react'
import { AdminPageHeader } from '@/components/admin/layout/AdminPageHeader'
import { ADMIN_PAGE_META } from '@/config/adminNav'
import { fetchSecuritySummary } from '@/services/adminDashboardService'
import {
  fetchSecurityPosture,
  updateSecuritySettings,
  type SecurityPosture,
  type SecuritySettings,
} from '@/services/securityService'
import { formatDashboardNumber } from '@/utils/dashboardDisplay'
import { formatRelativeTime } from '@/utils/formatDate'

const meta = ADMIN_PAGE_META.security

function PersistedToggle({
  label,
  sub,
  checked,
  disabled,
  onChange,
}: {
  label: string
  sub?: string
  checked: boolean
  disabled?: boolean
  onChange: (v: boolean) => void
}) {
  return (
    <div className="toggle-wrap" style={{ marginBottom: 14 }}>
      <button
        type="button"
        className={`toggle${checked ? ' on' : ''}`}
        aria-pressed={checked}
        disabled={disabled}
        onClick={() => onChange(!checked)}
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
  const [posture, setPosture] = useState<SecurityPosture | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [saveMessage, setSaveMessage] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const [sec, pos] = await Promise.all([
        fetchSecuritySummary(),
        fetchSecurityPosture(),
      ])
      setSummary(sec)
      setPosture(pos)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load security data')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  const settings = posture?.settings

  async function patchSettings(patch: Partial<SecuritySettings>) {
    setSaving(true)
    setSaveMessage(null)
    setError(null)
    try {
      const updated = await updateSecuritySettings(patch)
      setPosture(updated)
      setSaveMessage('Security settings saved.')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save settings')
    } finally {
      setSaving(false)
    }
  }

  const rlsOk =
    posture?.rls_tables?.every((t) => t.rls) ?? false

  return (
    <>
      <AdminPageHeader
        eyebrow={meta.eyebrow}
        title={meta.title}
        subtitle={meta.subtitle}
        actions={
          <button type="button" className="btn btn-ghost btn-sm" onClick={() => void load()} disabled={loading}>
            Refresh
          </button>
        }
      />

      {error ? (
        <div className="alert alert-danger mb-4">{error}</div>
      ) : null}
      {saveMessage ? (
        <div className="alert alert-success mb-4">{saveMessage}</div>
      ) : null}

      <div className="stat-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
        {[
          { label: 'Audit events (24h)', value: summary?.auditEvents24h ?? 0 },
          { label: 'Votes cast (24h)', value: summary?.voteCasts24h ?? 0 },
          {
            label: 'Last audit event',
            value: summary?.lastAuditAt ? formatRelativeTime(summary.lastAuditAt) : '—',
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
            <div className="card-title">Security controls</div>
            <div className="card-subtitle">Persisted in database · {saving ? 'Saving…' : 'Live'}</div>
          </div>
          <div className="card-body">
            {settings ? (
              <>
                <PersistedToggle
                  label="CAPTCHA on auth"
                  sub="Cloudflare Turnstile when keys are set; checkbox fallback otherwise"
                  checked={settings.captcha_enabled}
                  disabled={saving}
                  onChange={(v) => void patchSettings({ captcha_enabled: v })}
                />
                <PersistedToggle
                  label="Ballot integrity sealing"
                  sub="HMAC seal on each anonymous ballot (tamper detection)"
                  checked={settings.ballot_sealing_enabled}
                  disabled={saving}
                  onChange={(v) => void patchSettings({ ballot_sealing_enabled: v })}
                />
                <PersistedToggle
                  label="Maintenance mode"
                  sub="Blocks voting verify/cast for all users"
                  checked={settings.maintenance_mode}
                  disabled={saving}
                  onChange={(v) => void patchSettings({ maintenance_mode: v })}
                />
                <div className="form-group" style={{ marginTop: 8 }}>
                  <label className="form-label">Vote verify rate limit (per minute)</label>
                  <input
                    className="form-input"
                    type="number"
                    min={5}
                    max={120}
                    value={settings.rate_limit_vote_verify_per_minute}
                    disabled={saving}
                    onChange={(e) =>
                      void patchSettings({
                        rate_limit_vote_verify_per_minute: Number(e.target.value),
                      })
                    }
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Vote cast rate limit (per minute)</label>
                  <input
                    className="form-input"
                    type="number"
                    min={1}
                    max={30}
                    value={settings.rate_limit_vote_cast_per_minute}
                    disabled={saving}
                    onChange={(e) =>
                      void patchSettings({
                        rate_limit_vote_cast_per_minute: Number(e.target.value),
                      })
                    }
                  />
                </div>
              </>
            ) : (
              <p style={{ fontSize: 12, color: 'var(--subtle)' }}>Loading settings…</p>
            )}
          </div>
        </div>

        <div className="card-elevated">
          <div className="card-header">
            <div className="card-title">Platform checks</div>
          </div>
          <div className="card-body">
            <div className={`alert ${rlsOk ? 'alert-success' : 'alert-warning'}`}>
              Row Level Security on {posture?.rls_tables?.length ?? 0} core tables
              {rlsOk ? ' (all enabled)' : ' — review migration 022'}
            </div>
            <div className="alert alert-success">
              Direct ballot INSERT revoked for clients — votes only via{' '}
              <code>cast_anonymous_vote</code> RPC.
            </div>
            <div className={`alert ${posture?.ballots_have_seal_column ? 'alert-success' : 'alert-info'}`}>
              {posture?.ballots_have_seal_column
                ? 'Ballot choice sealing active (HMAC integrity).'
                : 'Apply migration 022 to enable ballot sealing.'}
            </div>
            <div className="alert alert-info">
              Input validation: Zod on auth and voting · parameterized SQL RPCs · React escapes HTML by default.
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
