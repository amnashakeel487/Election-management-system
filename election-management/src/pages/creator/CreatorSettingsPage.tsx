import { Link } from 'react-router-dom'
import { CreatorPageHeader } from '@/components/creator/layout/CreatorPageHeader'
import { LanguageSettings } from '@/components/i18n/LanguageSettings'
import { AppearanceSettings } from '@/components/theme/AppearanceSettings'
import { CREATOR_PAGE_META } from '@/config/creatorNav'

const meta = CREATOR_PAGE_META.settings

export function CreatorSettingsPage() {
  return (
    <>
      <CreatorPageHeader eyebrow={meta.eyebrow} title={meta.title} subtitle={meta.subtitle} />

      <LanguageSettings variant="admin" />
      <div style={{ marginTop: 16 }}>
        <AppearanceSettings variant="admin" />
      </div>

      <div className="grid-2" style={{ marginTop: 16 }}>
        <div className="card-elevated">
          <div className="card-header">
            <div className="card-title">Account security</div>
          </div>
          <div className="card-body">
            <p style={{ fontSize: 12, color: 'var(--subtle)', marginBottom: 12 }}>
              Password, MFA, and session security.
            </p>
            <Link to="/account/security" className="btn btn-primary">
              Open account security
            </Link>
          </div>
        </div>
        <div className="card-elevated">
          <div className="card-header">
            <div className="card-title">Election defaults</div>
            <div className="card-subtitle">Coming soon</div>
          </div>
          <div className="card-body">
            <p style={{ fontSize: 12, color: 'var(--subtle)' }}>
              Default titles, categories, and real-time results preferences will be saved here.
            </p>
          </div>
        </div>
      </div>
    </>
  )
}
