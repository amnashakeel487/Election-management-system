import { useState } from 'react'
import { Link } from 'react-router-dom'
import { AdminPageHeader } from '@/components/admin/layout/AdminPageHeader'
import { ADMIN_PAGE_META } from '@/config/adminNav'

const meta = ADMIN_PAGE_META.settings

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

export function AdminSettingsPage() {
  const [emailAlerts, setEmailAlerts] = useState(true)
  const [publicMetrics, setPublicMetrics] = useState(true)
  const [defaultTitle, setDefaultTitle] = useState('Untitled Election')
  const [defaultCategory, setDefaultCategory] = useState('')
  const [defaultRealtime, setDefaultRealtime] = useState(true)

  return (
    <>
      <AdminPageHeader eyebrow={meta.eyebrow} title={meta.title} subtitle={meta.subtitle} />

      <div className="grid-2">
        <div className="card-elevated">
          <div className="card-header">
            <div className="card-title">Account</div>
          </div>
          <div className="card-body">
            <p style={{ fontSize: 12, color: 'var(--subtle)', marginBottom: 12 }}>
              Change your password and multi-factor authentication in account security.
            </p>
            <Link to="/account/security" className="btn btn-primary">
              Open account security
            </Link>
          </div>
        </div>

        <div className="card-elevated">
          <div className="card-header">
            <div className="card-title">Notifications</div>
            <div className="card-subtitle">Local only</div>
          </div>
          <div className="card-body">
            <LocalToggle
              label="Email alerts for pending creators"
              on={emailAlerts}
              onChange={setEmailAlerts}
            />
            <LocalToggle
              label="Show public landing metrics"
              on={publicMetrics}
              onChange={setPublicMetrics}
            />
          </div>
        </div>
      </div>

      <div className="card-elevated" style={{ marginTop: 16 }}>
        <div className="card-header">
          <div>
            <div className="card-title">Election defaults</div>
            <div className="card-subtitle">Applied when creators start a new draft (local preview)</div>
          </div>
        </div>
        <div className="card-body">
          <div className="form-row">
            <div className="form-group">
              <label className="form-label" htmlFor="default-title">
                Default title
              </label>
              <input
                id="default-title"
                className="form-input"
                value={defaultTitle}
                onChange={(e) => setDefaultTitle(e.target.value)}
              />
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="default-category">
                Default category
              </label>
              <input
                id="default-category"
                className="form-input"
                value={defaultCategory}
                onChange={(e) => setDefaultCategory(e.target.value)}
              />
            </div>
          </div>
          <LocalToggle
            label="Real-time results by default"
            on={defaultRealtime}
            onChange={setDefaultRealtime}
          />
        </div>
      </div>
    </>
  )
}
